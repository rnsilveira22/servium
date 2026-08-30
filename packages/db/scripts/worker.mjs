#!/usr/bin/env node
// Worker genérico da fila PG (ADR-006). Loop com poll configurável; handlers
// por 'tipo' são registrados pelos consumidores (#15 motor do ciclo).
// Uso operacional do motor real: apps/api (runtime/worker.ts) registra os
// handlers; este script é o ponto de entrada genérico de infraestrutura.
import { PollWorker } from '../dist/index.js';

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 2000);
const BATCH = Number(process.env.WORKER_BATCH ?? 10);
const REAP_MS = Number(process.env.WORKER_REAP_INTERVAL_MS ?? 60_000);
const REAP_MIN = Number(process.env.WORKER_REAP_OLDER_THAN_MIN ?? 15);

const worker = new PollWorker({
  pollMs: POLL_MS,
  batch: BATCH,
  reapIntervalMs: REAP_MS,
  reapOlderThanMinutes: REAP_MIN,
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.once(sig, () => {
    void worker.stop().then(() => process.exit(0));
  });
}

await worker.start();