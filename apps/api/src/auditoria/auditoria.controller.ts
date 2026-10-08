import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Client } from 'pg';

import { listarEventos, type EventoAuditoriaDTO, type FiltrosEventos } from '@servium-ia/db';
import { RequireAuth, Roles, type AuthedRequest } from '../auth/auth.guard';
import { interpretarEventoOperacional, type EventoAuditoriaOperacional } from './presenter';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTOR_TYPES = new Set(['sistema', 'operador', 'servico']);

@Controller('auditoria')
@UseGuards(RequireAuth)
@Roles('admin')
export class AuditoriaController {
  private pg(req: AuthedRequest): Client {
    return req.pg as Client;
  }

  /**
   * Trilha de auditoria consultável (CA-04). Admin-only; o isolamento de
   * tenant é garantido pelo RLS da conexão (`req.pg` já contextualizada
   * pelo RequireAuth). Validação de entrada aqui evita erros SQL 22P02.
   *
   * M1-OPS-07 (DA-02): enrich `actor_id → actor_nome` no controller — resolve
   * o nome dos atores humanos (tabela `operadores`) mantendo `actor_type` e
   * `actor_id` intactos no contrato. FR-028: a camada operacional
   * (`presenter.ts`) deriva cliente/atividade via JOIN seguro e o rótulo do
   * agente a partir de `actor_type` (operador → nome; `servico` → nome
   * aprovado; `sistema` → "Sistema").
   */
  @Get()
  async listar(@Req() req: AuthedRequest, @Query() query: Record<string, unknown>) {
    const antesDe = this.timestamp(query.antes_de, 'antes_de');
    const antesId = this.uuid(query.antes_id, 'antes_id');
    if ((antesDe === undefined) !== (antesId === undefined)) {
      throw new BadRequestException('antes_de e antes_id são o cursor keyset e devem vir juntos');
    }
    const desde = this.timestamp(query.desde, 'desde');
    const ate = this.timestamp(query.ate, 'ate');
    if (desde !== undefined && ate !== undefined && Date.parse(desde) > Date.parse(ate)) {
      throw new BadRequestException('desde não pode ser após ate');
    }

    const filtros: FiltrosEventos = {
      entidade: this.texto(query.entidade, 'entidade'),
      acao: this.texto(query.acao, 'acao'),
      entidadeId: this.uuid(query.entidade_id, 'entidade_id'),
      desde,
      ate,
      actorType: this.actorType(query.actor_type),
      clienteId: this.uuid(query.cliente_id, 'cliente_id'),
      limite: this.limite(query.limite),
      antesDe,
      antesId,
    };

    const { eventos, tem_mais } = await listarEventos(this.pg(req), filtros);
    const eventosComNome = await this.enriquecerAtores(this.pg(req), eventos);
    const contexto = await this.enriquecerContexto(this.pg(req), eventosComNome);
    const eventosOperacionais: EventoAuditoriaOperacional[] = eventosComNome.map((e) => ({
      ...e,
      operacional: interpretarEventoOperacional(
        e,
        contexto.get(e.entidade_id) ?? { cliente: null, atividade: null }
      ),
    }));
    return { eventos: eventosOperacionais, tem_mais };
  }

  /**
   * DA-02 · resolve os nomes dos atores humanos numa única query (IN), sem
   * mudar RLS nem o contrato: `actor_nome` é um campo aditivo.
   */
  private async enriquecerAtores(client: Client, eventos: EventoAuditoriaDTO[]): Promise<EventoAuditoriaDTO[]> {
    const operadorIds = Array.from(
      new Set(eventos.filter((e) => e.actor_type === 'operador' && e.actor_id).map((e) => e.actor_id as string))
    );
    if (operadorIds.length === 0) {
      return eventos.map((e) => ({ ...e, actor_nome: null }));
    }
    const { rows } = await client.query<{ id: string; nome: string }>(
      `SELECT id, nome FROM operadores WHERE id = ANY($1::uuid[])`,
      [operadorIds]
    );
    const nomes = new Map(rows.map((r) => [r.id, r.nome]));
    return eventos.map((e) => ({ ...e, actor_nome: e.actor_type === 'operador' ? (nomes.get(e.actor_id as string) ?? null) : null }));
  }

  /**
   * FR-028 · resolve cliente/atividade por entidade_id em lote (ANY), sem N+1.
   * Os JOINs são seguros: todas as tabelas de destino têm RLS FORCE, logo o
   * contexto nunca resolve para outro tenant. Entidades sem vínculo
   * determinístico (auth, checklist_template, email_template) retornam
   * cliente/atividade null — dado ausente não é inventado.
   */
  private async enriquecerContexto(
    client: Client,
    eventos: EventoAuditoriaDTO[]
  ): Promise<Map<string, { cliente: string | null; atividade: string | null }>> {
    const resultado = new Map<string, { cliente: string | null; atividade: string | null }>();

    const ids = (entidade: string) =>
      Array.from(new Set(eventos.filter((e) => e.entidade === entidade).map((e) => e.entidade_id)));

    const atividadeIds = ids('atividade');
    if (atividadeIds.length > 0) {
      const { rows } = await client.query<{ id: string; nome: string }>(
        `SELECT id, nome FROM atividades WHERE id = ANY($1::uuid[])`,
        [atividadeIds]
      );
      for (const r of rows) {
        const atual = resultado.get(r.id) ?? { cliente: null, atividade: null };
        atual.atividade = r.nome;
        resultado.set(r.id, atual);
      }
    }

    const clienteIds = ids('cliente');
    if (clienteIds.length > 0) {
      const { rows } = await client.query<{ id: string; nome: string }>(
        `SELECT id, nome FROM clientes WHERE id = ANY($1::uuid[])`,
        [clienteIds]
      );
      for (const r of rows) {
        const atual = resultado.get(r.id) ?? { cliente: null, atividade: null };
        atual.cliente = r.nome;
        resultado.set(r.id, atual);
      }
    }

    const obrigacaoIds = ids('obrigacao');
    if (obrigacaoIds.length > 0) {
      const { rows } = await client.query<{ id: string; nome: string }>(
        `SELECT o.id AS id, cl.nome FROM obrigacoes o
           JOIN clientes cl ON cl.id = o.cliente_id
          WHERE o.id = ANY($1::uuid[])`,
        [obrigacaoIds]
      );
      for (const r of rows) {
        const atual = resultado.get(r.id) ?? { cliente: null, atividade: null };
        atual.cliente = r.nome;
        resultado.set(r.id, atual);
      }
    }

    const cicloIds = ids('ciclo');
    if (cicloIds.length > 0) {
      const { rows } = await client.query<{ id: string; nome: string }>(
        `SELECT c.id AS id, cl.nome FROM ciclos c
           JOIN obrigacoes o ON o.id = c.obrigacao_id
           JOIN clientes cl ON cl.id = o.cliente_id
          WHERE c.id = ANY($1::uuid[])`,
        [cicloIds]
      );
      for (const r of rows) {
        const atual = resultado.get(r.id) ?? { cliente: null, atividade: null };
        atual.cliente = r.nome;
        resultado.set(r.id, atual);
      }
    }

    const itemIds = ids('item_ciclo');
    if (itemIds.length > 0) {
      const { rows } = await client.query<{ id: string; nome: string }>(
        `SELECT i.id AS id, cl.nome FROM itens_ciclo i
           JOIN ciclos c ON c.id = i.ciclo_id
           JOIN obrigacoes o ON o.id = c.obrigacao_id
           JOIN clientes cl ON cl.id = o.cliente_id
          WHERE i.id = ANY($1::uuid[])`,
        [itemIds]
      );
      for (const r of rows) {
        const atual = resultado.get(r.id) ?? { cliente: null, atividade: null };
        atual.cliente = r.nome;
        resultado.set(r.id, atual);
      }
    }

    return resultado;
  }

  private texto(valor: unknown, campo: string): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== 'string' || valor.trim() === '') {
      throw new BadRequestException(`${campo} deve ser uma string não vazia`);
    }
    return valor;
  }

  private uuid(valor: unknown, campo: string): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== 'string' || !UUID_RE.test(valor)) {
      throw new BadRequestException(`${campo} deve ser um UUID válido`);
    }
    return valor;
  }

  private actorType(valor: unknown): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== 'string' || !ACTOR_TYPES.has(valor)) {
      throw new BadRequestException('actor_type deve ser sistema, operador ou servico');
    }
    return valor;
  }

  private limite(valor: unknown): number | undefined {
    if (valor === undefined) return undefined;
    const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : Number.NaN;
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      throw new BadRequestException('limite deve ser um inteiro entre 1 e 200');
    }
    return n;
  }

  private timestamp(valor: unknown, campo: string): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== 'string' || Number.isNaN(Date.parse(valor))) {
      throw new BadRequestException(`${campo} deve ser um timestamp ISO 8601 válido`);
    }
    return valor;
  }
}