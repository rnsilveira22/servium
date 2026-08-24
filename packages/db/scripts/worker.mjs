#!/usr/bin/env node
// Worker genérico da fila PG (ADR-006). Handlers por 'tipo' são registrados
// pelos consumidores (#15 motor do ciclo). Loop com poll configurável.
import { setTimeout as sleep } from 'node:timers/promises';
import pg from 'pg';
import { APP_URL, ADMIN_URL, claimJobs, completeJob, failJob } from '../dist/index.js';

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 2000);
const BATCH = Number(process.env.WORKER_BATCH ?? 10);

/** Registro de handlers: tipo → (job, ctx) => Promise<void> */
const handlers = new Map();

function log(level, msg, extra = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }));
}

let running = true;
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    running = false;
    log('info', 'encerrando após lote corrente');
  });
}

// Conexões de infraestrutura de fila: o job traz tenant_id; cada execução
// abre conexão contextual (RLS) — padrão SRV-7. Poll usa admin (fila é infra).
const infra = new pg.Client({ connectionString: ADMIN_URL });
await infra.connect();

while (running) {
  let claimed = [];
  try {
    claimed = await claimJobs(infra, BATCH);
    for (const job of claimed) {
      const handler = handlers.get(job.tipo);
      const ctx = new pg.Client({ connectionString: APP_URL });
      await ctx.connect();
      await ctx.query('SELECT set_config($1,$2,false)', ['app.tenant_id', job.tenant_id]);
      try {
        if (!handler) throw new Error(`sem handler para tipo=${job.tipo}`);
        await handler(job, ctx);
        await completeJob(ctx, job.id);
        log('info', 'job concluido', { id: job.id, tipo: job.tipo });
      } catch (err) {
        const desfecho = await failJob(ctx, job, String(err?.message ?? err));
        log('warn', `job ${desfecho}`, { id: job.id, tipo: job.tentativas });
      } finally {
        void ctx.end();
      }
    }
    if (claimed.length === 0) await sleep(POLL_MS);
  } catch (err) {
    log('error', 'falha no loop', { erro: String(err?.message ?? err) });
    await sleep(POLL_MS);
  }
}
void infra.end();
