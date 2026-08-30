#!/usr/bin/env node
/**
 * SRV-8 · Runtime do funcionário digital (processo dedicado do piloto):
 * scheduler periódico + worker que consome os jobs do motor.
 * Composição idêntica à do ambiente real (ADR-006): sem trigger artificial.
 * Encerramento gracioso em SIGINT/SIGTERM.
 */
import { buildChannelFromEnv } from './channel';
import { createMotorWorker } from './worker';
import { MotorScheduler } from './scheduler';

async function main(): Promise<void> {
  const channel = buildChannelFromEnv();
  const worker = createMotorWorker({
    channel,
    pollMs: Number(process.env.WORKER_POLL_MS ?? 2000),
    batch: Number(process.env.WORKER_BATCH ?? 10),
    reapIntervalMs: Number(process.env.WORKER_REAP_INTERVAL_MS ?? 60_000),
    reapOlderThanMinutes: Number(process.env.WORKER_REAP_OLDER_THAN_MIN ?? 15),
  });
  const scheduler = new MotorScheduler({
    tickIntervalMs: Number(process.env.SCHEDULER_TICK_INTERVAL_MS ?? 60_000),
    windowMs: Number(process.env.SCHEDULER_WINDOW_MS ?? 60_000),
    startNow: process.env.SCHEDULER_START_NOW !== 'false',
    reapOlderThanMinutes: Number(process.env.SCHEDULER_REAP_OLDER_THAN_MIN ?? 15),
  });

  await worker.start();
  scheduler.start();

  let encerrando = false;
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.once(sig, () => {
      if (encerrando) return;
      encerrando = true;
      void (async () => {
        scheduler.stop();
        await worker.stop();
        process.exit(0);
      })();
    });
  }
}

void main();