import type pg from 'pg';

/**
 * Fila em PostgreSQL com SKIP LOCKED (ADR-006) — sem Redis, sem cron externo.
 * Todas as operações herdam o contexto de tenant da conexão (RLS).
 */

export interface EnqueueInput {
  tipo: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxTentativas?: number;
}

export interface Job {
  id: string;
  tenant_id: string;
  tipo: string;
  payload: Record<string, unknown>;
  tentativas: number;
  max_tentativas: number;
}

export async function enqueue(client: pg.Client, input: EnqueueInput): Promise<string | null> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO jobs_fila (tenant_id, tipo, payload, idempotency_key, max_tentativas)
     VALUES (current_setting('app.tenant_id', true)::uuid, $1, $2::jsonb, $3, $4)
     ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
     RETURNING id`,
    [input.tipo, JSON.stringify(input.payload), input.idempotencyKey, input.maxTentativas ?? 3]
  );
  return rows[0]?.id ?? null; // null = duplicata idempotente
}

/** Reserva lote atomicamente: dois workers nunca recebem o mesmo job. */
export async function claimJobs(client: pg.Client, limit = 10): Promise<Job[]> {
  await client.query('BEGIN');
  try {
    const { rows } = await client.query<Job>(
      `WITH proximos AS (
         SELECT id FROM jobs_fila
          WHERE estado = 'pendente' AND disponivel_em <= now()
          ORDER BY disponivel_em
          FOR UPDATE SKIP LOCKED
          LIMIT $1
       )
       UPDATE jobs_fila j
          SET estado = 'processando', tentativas = j.tentativas + 1
        FROM proximos p
        WHERE j.id = p.id
       RETURNING j.id, j.tenant_id, j.tipo, j.payload, j.tentativas, j.max_tentativas`,
      [limit]
    );
    await client.query('COMMIT');
    return rows;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  }
}

export async function completeJob(client: pg.Client, jobId: string): Promise<void> {
  await client.query("UPDATE jobs_fila SET estado='concluido' WHERE id=$1", [jobId]);
}

/** Backoff exponencial até esgotar max_tentativas ⇒ estado 'falha'. */
export async function failJob(
  client: pg.Client,
  job: Pick<Job, 'id' | 'tentativas' | 'max_tentativas'>,
  erro: string
): Promise<'reagendado' | 'falha'> {
  if (job.tentativas < job.max_tentativas) {
    await client.query(
      `UPDATE jobs_fila
          SET estado='pendente',
              ultimo_erro=$2,
              disponivel_em = now() + make_interval(secs => power(2, $3) * 5)
        WHERE id=$1`,
      [job.id, erro.slice(0, 2000), job.tentativas]
    );
    return 'reagendado';
  }
  await client.query(
    "UPDATE jobs_fila SET estado='falha', ultimo_erro=$2 WHERE id=$1",
    [job.id, erro.slice(0, 2000)]
  );
  return 'falha';
}

/** Worker morto deixou job em 'processando': devolve à fila. */
export async function reapStuck(client: pg.Client, olderThanMinutes = 15): Promise<number> {
  // varredura de infraestrutura: roda por tenant via conexões contextuais (#15 registra)
  const { rowCount } = await client.query(
    `UPDATE jobs_fila
        SET estado='pendente'
      WHERE estado='processando'
        AND disponivel_em < now() - ($1 || ' minutes')::interval`,
    [String(olderThanMinutes)]
  );
  void rowCount;
  return rowCount ?? 0;
}
