/**
 * SRV-8 · Worker de fila PostgreSQL reutilizável (ADR-006).
 * - Claim atômico com SKIP LOCKED via conexão de infraestrutura (fila é infra);
 * - execução contextual por job: conexão servium_app + app.tenant_id do job (RLS);
 * - retry com backoff exponencial (failJob) até esgotar max_tentativas ⇒ falha;
 * - reap periódico de jobs presos em 'processando' (worker morto);
 * - shutdown gracioso (encerra após o lote corrente).
 */
import { setTimeout as sleep } from 'node:timers/promises';
import pg from 'pg';

import { ADMIN_URL, APP_URL } from './index.core.js';
import { claimJobs, completeJob, failJob, reapStuck, type Job } from './queue.js';

export type JobHandler = (job: Job, ctx: pg.Client) => Promise<void>;

export type WorkerLog = (level: 'info' | 'warn' | 'error', msg: string, extra?: Record<string, unknown>) => void;

export interface PollWorkerOptions {
  /** Latência de polling quando não há trabalho (ms). Default 2000. */
  pollMs?: number;
  /** Tamanho do lote por claim. Default 10. */
  batch?: number;
  /** Intervalo do reap de jobs presos em 'processando' (ms). 0 desliga. Default 60000. */
  reapIntervalMs?: number;
  /** Idade mínima de um job 'processando' para ser devolvido à fila (min). Default 15. */
  reapOlderThanMinutes?: number;
  /** Restringe o claim a um tenant (isolamento em testes/multi-instância). Default: todos. */
  tenantFilter?: string;
  log?: WorkerLog;
}

function defaultLog(level: 'info' | 'warn' | 'error', msg: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }));
}

interface ResolvedWorkerOptions {
  pollMs: number;
  batch: number;
  reapIntervalMs: number;
  reapOlderThanMinutes: number;
  tenantFilter?: string;
  log: WorkerLog;
}

export class PollWorker {
  private handlers = new Map<string, JobHandler>();
  private running = false;
  private infra: pg.Client | null = null;
  private loopPromise: Promise<void> | null = null;
  private reapTimer: NodeJS.Timeout | null = null;
  private opts: ResolvedWorkerOptions;

  constructor(opts: PollWorkerOptions = {}) {
    this.opts = {
      pollMs: opts.pollMs ?? 2000,
      batch: opts.batch ?? 10,
      reapIntervalMs: opts.reapIntervalMs ?? 60_000,
      reapOlderThanMinutes: opts.reapOlderThanMinutes ?? 15,
      tenantFilter: opts.tenantFilter,
      log: opts.log ?? defaultLog,
    };
  }

  register(tipo: string, handler: JobHandler): this {
    this.handlers.set(tipo, handler);
    return this;
  }

  get registrados(): string[] {
    return [...this.handlers.keys()];
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.infra = new pg.Client({ connectionString: ADMIN_URL });
    await this.infra.connect();
    this.opts.log('info', 'worker iniciado', {
      pollMs: this.opts.pollMs ?? 2000,
      batch: this.opts.batch ?? 10,
      handlers: this.registrados,
    });
    this.loopPromise = this.loop();
    if ((this.opts.reapIntervalMs ?? 0) > 0) {
      this.reapTimer = setInterval(() => void this.reap(), Math.max(1_000, this.opts.reapIntervalMs ?? 60_000));
      this.reapTimer.unref();
    }
  }

  /** Encerra graciosamente: aguarda o lote corrente; latência ≤ pollMs. */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    if (this.reapTimer) {
      clearInterval(this.reapTimer);
      this.reapTimer = null;
    }
    await this.loopPromise;
    await this.infra?.end().catch(() => undefined);
    this.infra = null;
    this.loopPromise = null;
    this.opts.log('info', 'worker encerrado');
  }

  private async loop(): Promise<void> {
    while (this.running) {
      const infra = this.infra;
      if (!infra) break;
      let claimed: Job[] = [];
      try {
        claimed = await claimJobs(infra, this.opts.batch ?? 10, this.opts.tenantFilter);
        for (const job of claimed) {
          await this.process(job);
        }
        if (claimed.length === 0) await sleep(this.opts.pollMs ?? 2000);
      } catch (err) {
        this.opts.log('error', 'falha no loop', { erro: String((err as Error)?.message ?? err) });
        await sleep(this.opts.pollMs ?? 2000);
      }
    }
  }

  private async process(job: Job): Promise<void> {
    const handler = this.handlers.get(job.tipo);
    const ctx = new pg.Client({ connectionString: APP_URL });
    try {
      await ctx.connect();
      await ctx.query('SELECT set_config($1,$2,false)', ['app.tenant_id', job.tenant_id]);
      if (!handler) throw new Error(`sem handler para tipo=${job.tipo}`);
      await handler(job, ctx);
      await completeJob(ctx, job.id);
      this.opts.log('info', 'job concluido', { id: job.id, tipo: job.tipo, tenant: job.tenant_id });
    } catch (err) {
      const message = String((err as Error)?.message ?? err);
      const desfecho = await failJob(ctx, job, message);
      this.opts.log('warn', `job ${desfecho}`, { id: job.id, tipo: job.tipo, erro: message });
    } finally {
      void ctx.end();
    }
  }

  private async reap(): Promise<void> {
    const infra = this.infra;
    if (!infra || !this.running) return;
    try {
      const n = await reapStuck(infra, this.opts.reapOlderThanMinutes ?? 15);
      if (n > 0) this.opts.log('info', 'reapStuck', { devolvidos: n });
    } catch (err) {
      this.opts.log('warn', 'falha no reapStuck', { erro: String((err as Error)?.message ?? err) });
    }
  }
}

export const sleepMs = sleep;