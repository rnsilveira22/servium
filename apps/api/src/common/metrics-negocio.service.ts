/**
 * B-5 · Métricas mínimas de negócio (criterio 9 do PILOT_READY).
 *
 * Leitura RLS-contextual (req.pg já carrega app.tenant_id) — cada tenant enxerga
 * somente seus dados. Nenhuma tabela/schema novo: tudo é agregação sobre dados
 * já auditados (eventos_auditoria, itens_ciclo, mensagens_comunicacao, jobs_fila,
 * excecoes), conforme "Coleta simples (eventos já auditados)" do slice.
 */
import type { Client } from 'pg';

export interface PendenciaPorCliente {
  clienteId: string;
  nome: string;
  pendencias: number;
}

export interface MetricasNegocio {
  atualizadoEm: string;
  negocio: {
    ciclos: number;
    ciclosAbertos: number;
    itensResolvidos: number;
    excecoesAbertas: number;
    documentosEnviados: number;
    documentosRecebidos: number;
    tempoMedioResolucaoHoras: number | null;
    percentualResolvidosSemEscalada: number | null;
    tentativasMediaAteResposta: number | null;
    pendenciasTotal: number;
    pendenciasPorCliente: PendenciaPorCliente[];
  };
  tecnica: {
    jobsEmRetry: number;
    jobsPresos: number;
    mensagensSemCorrelacao: number;
    errosEnvio: number;
  };
}

const PENDENTES = `'pendente','cobrado','aguardando','recebido','excecao'`;

export async function coletarMetricasNegocio(client: Client): Promise<MetricasNegocio> {
  const contagens = await client.query<{
    ciclos: string;
    ciclos_abertos: string;
    itens_resolvidos: string;
    excecoes_abertas: string;
    documentos_enviados: string;
    documentos_recebidos: string;
  }>(
    `SELECT
        (SELECT count(*) FROM ciclos)                            AS ciclos,
        (SELECT count(*) FROM ciclos WHERE estado='aberto')      AS ciclos_abertos,
        (SELECT count(*) FROM itens_ciclo WHERE estado='resolvido') AS itens_resolvidos,
        (SELECT count(*) FROM excecoes WHERE desfecho IS NULL)   AS excecoes_abertas,
        (SELECT count(*) FROM mensagens_comunicacao WHERE direcao='envio')       AS documentos_enviados,
        (SELECT count(*) FROM mensagens_comunicacao WHERE direcao='recebimento') AS documentos_recebidos`
  );

  const tempo = await client.query<{ horas: string | null }>(
    `WITH resolvidos AS (
        SELECT entidade_id AS item_id, min(criado_em) AS dt
        FROM eventos_auditoria
        WHERE acao = 'decidir' AND detalhes->>'desfecho' = 'resolvido'
        GROUP BY entidade_id
      ), recebidos AS (
        SELECT entidade_id AS item_id, min(criado_em) AS dt
        FROM eventos_auditoria
        WHERE acao = 'receber'
        GROUP BY entidade_id
      )
      SELECT round(avg(extract(epoch FROM (r.dt - c.dt)) / 3600)::numeric, 2) AS horas
      FROM resolvidos r JOIN recebidos c USING (item_id)`
  );

  const escalada = await client.query<{ total: string; sem_escalada: string }>(
    `SELECT
        count(*) AS total,
        count(*) FILTER (WHERE detalhes->>'origem' <> 'excecao') AS sem_escalada
      FROM eventos_auditoria
      WHERE acao = 'decidir' AND detalhes->>'desfecho' = 'resolvido'`
  );

  const tentativas = await client.query<{ media: string | null }>(
    `SELECT round(avg(tentativas)::numeric, 2) AS media
     FROM itens_ciclo
     WHERE estado IN ('recebido','resolvido','excecao','cancelado')`
  );

  const pendencias = await client.query<{
    cliente_id: string;
    nome: string;
    pendencias: string;
  }>(
    `SELECT c.id AS cliente_id, c.nome, count(i.*) AS pendencias
     FROM itens_ciclo i
     JOIN ciclos cy ON cy.id = i.ciclo_id
     JOIN obrigacoes o ON o.id = cy.obrigacao_id
     JOIN clientes c ON c.id = o.cliente_id
     WHERE i.estado IN (${PENDENTES})
     GROUP BY c.id, c.nome
     ORDER BY pendencias DESC`
  );

  const tecnica = await client.query<{
    jobs_em_retry: string;
    jobs_presos: string;
    mensagens_sem_correlacao: string;
    erros_envio: string;
  }>(
    `SELECT
        (SELECT count(*) FROM jobs_fila
          WHERE estado = 'falha' OR (estado IN ('pendente','processando') AND tentativas > 0)) AS jobs_em_retry,
        (SELECT count(*) FROM jobs_fila
          WHERE estado = 'processando' AND criado_em < now() - interval '10 minutes')       AS jobs_presos,
        (SELECT count(*) FROM mensagens_comunicacao
          WHERE direcao = 'recebimento' AND token_correlacao IS NULL)                        AS mensagens_sem_correlacao,
        (SELECT count(*) FROM mensagens_comunicacao WHERE status = 'falha')                  AS erros_envio`
  );

  const c = contagens.rows[0] ?? {
    ciclos: '0',
    ciclos_abertos: '0',
    itens_resolvidos: '0',
    excecoes_abertas: '0',
    documentos_enviados: '0',
    documentos_recebidos: '0',
  };
  const t = tecnica.rows[0] ?? {
    jobs_em_retry: '0',
    jobs_presos: '0',
    mensagens_sem_correlacao: '0',
    erros_envio: '0',
  };
  const total = Number(tempo.rows[0]?.horas ?? 0) || 0;
  const escaladaTotal = Number(escalada.rows[0]?.total ?? 0);
  const semEscalada = Number(escalada.rows[0]?.sem_escalada ?? 0);

  return {
    atualizadoEm: new Date().toISOString(),
    negocio: {
      ciclos: Number(c.ciclos ?? 0),
      ciclosAbertos: Number(c.ciclos_abertos ?? 0),
      itensResolvidos: Number(c.itens_resolvidos ?? 0),
      excecoesAbertas: Number(c.excecoes_abertas ?? 0),
      documentosEnviados: Number(c.documentos_enviados ?? 0),
      documentosRecebidos: Number(c.documentos_recebidos ?? 0),
      tempoMedioResolucaoHoras: total === 0 ? null : total,
      percentualResolvidosSemEscalada:
        escaladaTotal === 0 ? null : Number(((semEscalada / escaladaTotal) * 100).toFixed(2)),
      tentativasMediaAteResposta: tentativas.rows[0]?.media == null ? null : Number(tentativas.rows[0].media),
      pendenciasTotal: pendencias.rows.reduce((acc, r) => acc + Number(r.pendencias), 0),
      pendenciasPorCliente: pendencias.rows.map((r) => ({
        clienteId: r.cliente_id,
        nome: r.nome,
        pendencias: Number(r.pendencias),
      })),
    },
    tecnica: {
      jobsEmRetry: Number(t.jobs_em_retry ?? 0),
      jobsPresos: Number(t.jobs_presos ?? 0),
      mensagensSemCorrelacao: Number(t.mensagens_sem_correlacao ?? 0),
      errosEnvio: Number(t.erros_envio ?? 0),
    },
  };
}