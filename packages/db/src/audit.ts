import type pg from 'pg';

/**
 * Leitura da trilha de auditoria (PRM-P0.2-A · Issue #51).
 *
 * O isolamento cross-tenant é EXCLUSIVAMENTE via RLS (políticas
 * tenant_isolation FORCE, deny-by-default): este SQL nunca filtra por
 * tenant_id. Sem `app.tenant_id` configurado na conexão, a política
 * retorna 0 linhas.
 */

export interface FiltrosEventos {
  /** Entidade do evento (ex.: 'item_ciclo', 'ciclo', 'auth'). */
  entidade?: string;
  /** Chave da entidade (UUID). */
  entidadeId?: string;
  /** Ação (ex.: 'cobrar', 'ativar', 'decidir', 'receber'). */
  acao?: string;
  /**
   * FR-028 · iníci da janela de período (`criado_em >= desde`). Usado com
   * `ate` para o filtro de período da Auditoria Operacional.
   */
  desde?: string | Date;
  /**
   * FR-028 · fim da janela de período (`criado_em <= ate`).
   */
  ate?: string | Date;
  /**
   * FR-028 · tipo de ator ('sistema' | 'operador' | 'servico') — filtro de
   * agente na Auditoria Operacional.
   */
  actorType?: string;
  /**
   * FR-028 · filtro por cliente: restringe os eventos cujo `entidade_id`
   * resolve (via JOIN seguro, respeitando o RLS das tabelas) para um cliente.
   */
  clienteId?: string;
  /** Máximo de eventos (default 50; clamp interno [1,200]). */
  limite?: number;
  /**
   * Cursor keyset — `criado_em` (timestamptz) da última linha da página
   * anterior. Deve vir junto com `antesId` (criado_em não é único).
   */
  antesDe?: string | Date;
  /**
   * Cursor keyset — `id` da última linha da página anterior (tiebreaker
   * para o ordenamento `(criado_em DESC, id DESC)`).
   */
  antesId?: string;
}

export interface EventoAuditoriaDTO {
  id: string;
  actor_type: 'sistema' | 'operador' | 'servico';
  actor_id: string | null;
  /** M1-OPS-07 · aditivo: nome do ator humano resolvido no controller. */
  actor_nome?: string | null;
  entidade: string;
  entidade_id: string;
  acao: string;
  detalhes: Record<string, unknown> | null;
  criado_em: Date;
}

const LIMITE_PADRAO = 50;
const LIMITE_MAXIMO = 200;

/**
 * Lista eventos de auditoria do tenant da CONEXÃO, em
 * `(criado_em DESC, id DESC)`. `tem_mais` é derivado de `LIMIT limite+1`
 * (a última linha descartada indica que existe página seguinte). Appende
 * o índice existente `idx_eventos_tenant_criado`; filtros por
 * entidade/acao/entidade_id fazem seq scan aceitável no piloto.
 */
export async function listarEventos(
  client: pg.Client,
  filtros: FiltrosEventos = {}
): Promise<{ eventos: EventoAuditoriaDTO[]; tem_mais: boolean }> {
  const params: unknown[] = [];
  const clausulas: string[] = [];

  if (filtros.entidade !== undefined) {
    params.push(filtros.entidade);
    clausulas.push(`entidade = $${params.length}`);
  }
  if (filtros.entidadeId !== undefined) {
    params.push(filtros.entidadeId);
    clausulas.push(`entidade_id = $${params.length}`);
  }
  if (filtros.acao !== undefined) {
    params.push(filtros.acao);
    clausulas.push(`acao = $${params.length}`);
  }
  if (filtros.desde !== undefined) {
    params.push(filtros.desde);
    clausulas.push(`criado_em >= $${params.length}::timestamptz`);
  }
  if (filtros.ate !== undefined) {
    params.push(filtros.ate);
    clausulas.push(`criado_em <= $${params.length}::timestamptz`);
  }
  if (filtros.actorType !== undefined) {
    params.push(filtros.actorType);
    clausulas.push(`actor_type = $${params.length}`);
  }
  if (filtros.clienteId !== undefined) {
    // FR-028 · filtro por cliente via JOIN seguro: as tabelas de destino
    // (clientes, obrigacoes, ciclos, itens_ciclo) também têm RLS FORCE, logo
    // o filtro é restrito ao tenant da conexão — nunca busca fora dele.
    params.push(filtros.clienteId);
    const n = params.length;
    clausulas.push(
      `(entidade = 'cliente' AND entidade_id IN (SELECT id FROM clientes WHERE id = $${n}::uuid)
         OR entidade = 'obrigacao' AND entidade_id IN (
              SELECT o.id FROM obrigacoes o JOIN clientes cl ON cl.id = o.cliente_id WHERE cl.id = $${n}::uuid)
         OR entidade = 'ciclo' AND entidade_id IN (
              SELECT c.id FROM ciclos c JOIN obrigacoes o ON o.id = c.obrigacao_id
                JOIN clientes cl ON cl.id = o.cliente_id WHERE cl.id = $${n}::uuid)
         OR entidade = 'item_ciclo' AND entidade_id IN (
              SELECT i.id FROM itens_ciclo i JOIN ciclos c ON c.id = i.ciclo_id
                JOIN obrigacoes o ON o.id = c.obrigacao_id
                JOIN clientes cl ON cl.id = o.cliente_id WHERE cl.id = $${n}::uuid))`
    );
  }

  const temAntesDe = filtros.antesDe !== undefined;
  const temAntesId = filtros.antesId !== undefined;
  if (temAntesDe !== temAntesId) {
    throw new Error('listarEventos: antesDe e antesId são o cursor keyset e devem vir juntos');
  }
  if (temAntesDe && temAntesId) {
    params.push(filtros.antesDe);
    const n1 = params.length;
    params.push(filtros.antesId);
    const n2 = params.length;
    clausulas.push(`(criado_em < $${n1}::timestamptz OR (criado_em = $${n1}::timestamptz AND id < $${n2}::uuid))`);
  }

  // clamp [1,200]; default 50. `LIMIT limite+1` revela se há página seguinte.
  const limite = Math.min(LIMITE_MAXIMO, Math.max(1, Math.floor(filtros.limite ?? LIMITE_PADRAO)));

  const sql = `
    SELECT id, actor_type, actor_id, entidade, entidade_id, acao, detalhes, criado_em
      FROM eventos_auditoria
      ${clausulas.length > 0 ? 'WHERE ' + clausulas.join(' AND ') : ''}
     ORDER BY criado_em DESC, id DESC
     LIMIT ${limite + 1}`;

  const { rows } = await client.query<EventoAuditoriaDTO>(sql, params);
  const tem_mais = rows.length > limite;
  return { eventos: rows.slice(0, limite), tem_mais };
}