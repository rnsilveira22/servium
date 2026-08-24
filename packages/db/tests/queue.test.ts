import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  TENANT_QA as TENANT_A,
  TENANT_QB as TENANT_B,
  admin,
  app,
  claimJobs,
  completeJob,
  enqueue,
  failJob,
  reapStuck,
  setTenant,
} from './helpers';

let adm: Awaited<ReturnType<typeof admin>>;

beforeAll(async () => {
  adm = admin();
  await adm.connect();
  await adm.query("INSERT INTO tenants (id,nome) VALUES ($1,'QA'),($2,'QB')", [TENANT_A, TENANT_B]);
});

afterAll(async () => {
  await adm.query('DELETE FROM jobs_fila WHERE tenant_id IN ($1,$2)', [TENANT_A, TENANT_B]);
  await adm.query('DELETE FROM tenants WHERE id IN ($1,$2)', [TENANT_A, TENANT_B]);
  void adm.end();
});

async function ctxFor(tenant: string) {
  const c = app();
  await c.connect();
  await setTenant(c, tenant);
  return c;
}

describe('SRV-8 · fila PG (SKIP LOCKED)', () => {
  it('enqueue é idempotente por (tenant, idempotency_key)', async () => {
    const a = await ctxFor(TENANT_A);
    const id1 = await enqueue(a, { tipo: 't', payload: { n: 1 }, idempotencyKey: 'k1' });
    const id2 = await enqueue(a, { tipo: 't', payload: { n: 1 }, idempotencyKey: 'k1' });
    expect(id1).toBeTruthy();
    expect(id2).toBeNull(); // duplicata ignorada
    void a.end();
  });

  it('mesma chave em tenants distintos NÃO colide', async () => {
    const a = await ctxFor(TENANT_A);
    const b = await ctxFor(TENANT_B);
    await expect(enqueue(a, { tipo: 't', payload: {}, idempotencyKey: 'shared' })).resolves.toBeTruthy();
    await expect(enqueue(b, { tipo: 't', payload: {}, idempotencyKey: 'shared' })).resolves.toBeTruthy();
    void a.end();
    void b.end();
  });

  it('claim SKIP LOCKED: dois claimants recebem lotes disjuntos', async () => {
    const a = await ctxFor(TENANT_A);
    for (const i of [1, 2, 3, 4]) {
      await enqueue(a, { tipo: 't', payload: { i }, idempotencyKey: `claim-${i}` });
    }
    // claimant 1 segura transação aberta com locks
    await a.query('BEGIN');
    const lote1 = await claimJobs(a, 2);
    expect(lote1).toHaveLength(2);

    const b = await ctxFor(TENANT_B);
    const loteB = await claimJobs(b, 10);
    // RLS: tudo que B reclama pertence a B (sobras legítimas incluídas)
    expect(loteB.some((j) => j.tenant_id !== TENANT_B)).toBe(false);
    for (const j of loteB) await completeJob(b, j.id);

    const a2 = await ctxFor(TENANT_A);
    const lote2 = await claimJobs(a2, 10);
    // SKIP LOCKED: nada do lote travado reaparece; restantes vêm aqui
    expect(lote2.some((j) => lote1.some((k) => k.id === j.id))).toBe(false);
    // todos os 4 jobs 'claim-*' foram distribuídos entre os dois lotes
    const ids = new Set([...lote1, ...lote2].map((j) => j.id));
    const alvos = await a2.query("SELECT id FROM jobs_fila WHERE idempotency_key LIKE 'claim-%' AND tenant_id=$1", [TENANT_A]);
    expect([...ids].filter((id) => alvos.rows.some((r) => r.id === id))).toHaveLength(4);

    await a.query('COMMIT');
    for (const j of [...lote1, ...lote2]) await completeJob(a2, j.id);
    void a2.end();
    void b.end();
  });

  it('falha reagenda com backoff até esgotar max_tentativas ⇒ falha', async () => {
    const a = await ctxFor(TENANT_A);
    await enqueue(a, { tipo: 't', payload: {}, idempotencyKey: 'retry', maxTentativas: 2 });
    const [j1] = await claimJobs(a, 1);
    expect(j1!.tentativas).toBe(1);
    expect(await failJob(a, j1!, 'boom')).toBe('reagendado');

    const { rows } = await a.query(
      "SELECT estado, disponivel_em > now() AS futuro FROM jobs_fila WHERE id=$1",
      [j1!.id]
    );
    expect(rows[0].estado).toBe('pendente');
    expect(rows[0].futuro).toBe(true); // backoff aplicado

    const loteMeio = await claimJobs(a, 50);
    expect(loteMeio.some((j) => j.id === j1!.id)).toBe(false); // em backoff futuro

    await a.query("UPDATE jobs_fila SET disponivel_em=now() WHERE id=$1", [j1!.id]);
    const loteFim = await claimJobs(a, 50);
    const j3 = loteFim.find((j) => j.id === j1!.id)!;
    expect(j3.tentativas).toBe(2);
    expect(await failJob(a, j3, 'boom-final')).toBe('falha');

    const { rows: finais } = await a.query('SELECT estado FROM jobs_fila WHERE id=$1', [j1!.id]);
    expect(finais[0].estado).toBe('falha');
    void a.end();
  });

  it('reapStuck devolve órfãos processando para pendente', async () => {
    const a = await ctxFor(TENANT_A);
    await enqueue(a, { tipo: 't', payload: {}, idempotencyKey: 'stuck' });
    const [j] = await claimJobs(a, 1);
    await a.query("UPDATE jobs_fila SET disponivel_em = now() - interval '20 minutes' WHERE id=$1", [j!.id]);
    expect(await reapStuck(a, 15)).toBeGreaterThanOrEqual(1);
    const { rows } = await a.query('SELECT estado FROM jobs_fila WHERE id=$1', [j!.id]);
    expect(rows[0].estado).toBe('pendente');
    void a.end();
  });
});
