import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TENANT_C, TENANT_D, admin, app, setTenant } from './helpers';

/**
 * SRV-7 — Suíte de segurança ADR-005 (condição vinculante).
 * TODA asserção de deny é acompanhada de sanity-check positivo,
 * para garantir que o bloqueio vem da política e não de dados ausentes.
 *
 * Conexão SEMPRE como servium_app: superuser bypassa RLS por definição.
 */

let adm: Awaited<ReturnType<typeof admin>>;
let cl: Awaited<ReturnType<typeof app>>;
let clienteAId: string;

beforeAll(async () => {
  adm = admin();
  await adm.connect();
  await adm.query("INSERT INTO tenants (id, nome) VALUES ($1,'C'),($2,'D')", [TENANT_C, TENANT_D]);
  await adm.query("INSERT INTO clientes (id, tenant_id, nome) VALUES ($1,$2,'Confidencial A')", [
    'aaaaaaaa-0000-0000-0000-000000000001', TENANT_C,
  ]);
  clienteAId = 'aaaaaaaa-0000-0000-0000-000000000001';

  cl = app();
  await cl.connect();
});

afterAll(async () => {
  await adm.query('DELETE FROM clientes WHERE tenant_id = $1', [TENANT_C]);
  await adm.query('DELETE FROM tenants WHERE id IN ($1,$2)', [TENANT_C, TENANT_D]);
  void adm.end();
  void cl.end();
});

describe('SRV-7 · mecanismo de isolamento (catálogo dinâmico)', () => {
  it('toda tabela de negócio tem RLS ENABLE+FORCE e política tenant_isolation', async () => {
    const { rows } = await cl.query(`
      SELECT c.relname,
             c.relrowsecurity AS rls,
             c.relforcerowsecurity AS force_rls,
             EXISTS (
               SELECT 1 FROM pg_policies p
               WHERE p.schemaname='public' AND p.tablename=c.relname
                 AND p.policyname='tenant_isolation'
             ) AS has_policy
      FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r'
        AND c.relname NOT IN ('schema_migrations')
    `);
    expect(rows.length).toBeGreaterThanOrEqual(13);
    for (const r of rows) {
      expect({ table: r.relname, rls: r.rls, force: r.force_rls, policy: r.has_policy }).toEqual(
        { table: r.relname, rls: true, force: true, policy: true }
      );
    }
  });

  it('role runtime não possui bypass nem superpoderes', async () => {
    const { rows } = await cl.query(`
      SELECT rolbypassrls, rolsuper, rolcreaterole, rolcreatedb
      FROM pg_roles WHERE rolname='servium_app'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      rolbypassrls: false, rolsuper: false, rolcreaterole: false, rolcreatedb: false,
    });
  });

  it('todas as colunas tenant_id obrigatórias são NOT NULL', async () => {
    const { rows } = await cl.query(`
      SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r'
        AND c.relname <> ALL (ARRAY['schema_migrations','tenants'])
        AND NOT EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid=c.oid AND a.attname='tenant_id'
            AND a.attnotnull
        )
    `);
    expect(rows.map((r: { relname: string }) => r.relname)).toEqual([]);
  });
});

describe('SRV-7 · matriz de vazamento cross-tenant', () => {
  it('leitura cruzada bloqueada', async () => {
    await setTenant(cl, TENANT_D);
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(0);

    await setTenant(cl, TENANT_C);
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(1);
  });

  it('escrita cruzada bloqueada (UPDATE invisível)', async () => {
    await setTenant(cl, TENANT_D);
    const upd = await cl.query('UPDATE clientes SET nome=$1 WHERE id=$2', ['adulterado', clienteAId]);
    expect(upd.rowCount).toBe(0);

    await setTenant(cl, TENANT_C);
    const { rows } = await cl.query('SELECT nome FROM clientes WHERE id=$1', [clienteAId]);
    expect(rows[0].nome).toBe('Confidencial A');
  });

  it('remoção cruzada bloqueada (DELETE invisível)', async () => {
    await setTenant(cl, TENANT_D);
    const del = await cl.query('DELETE FROM clientes WHERE id=$1', [clienteAId]);
    expect(del.rowCount).toBe(0);

    await setTenant(cl, TENANT_C);
    expect((await cl.query('SELECT 1 FROM clientes WHERE id=$1', [clienteAId])).rowCount).toBe(1);
  });

  it('inserção apontando para outro tenant viola WITH CHECK', async () => {
    await setTenant(cl, TENANT_D);
    await expect(
      cl.query("INSERT INTO clientes (tenant_id, nome) VALUES ($1,'vazamento')", [TENANT_C])
    ).rejects.toThrowError(/row-level security/i);

    await setTenant(cl, TENANT_C);
    await expect(
      cl.query("INSERT INTO clientes (tenant_id, nome) VALUES ($1,'legitimo')", [TENANT_C])
    ).resolves.toBeTruthy();
  });
});

describe('SRV-7 · contexto de tenant degenerado = deny', () => {
  it('contexto ausente nega leitura', async () => {
    await cl.query("SELECT set_config('app.tenant_id', '', false)");
    // '' é tratado como ausente pelas políticas; remove de fato para simular inexistente
    await cl.query('RESET app.tenant_id');
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(0);
  });

  it('contexto vazio nega leitura', async () => {
    await cl.query("SELECT set_config('app.tenant_id', '', false)");
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(0);
  });

  it('contexto inválido (não-uuid) falha a query = deny', async () => {
    await cl.query("SELECT set_config('app.tenant_id', 'nao-e-uuid', false)");
    await expect(cl.query('SELECT id FROM clientes')).rejects.toThrowError(/invalid input syntax/i);
    await cl.query("SELECT set_config('app.tenant_id', $1, false)", [TENANT_C]);
    await expect(cl.query('SELECT id FROM clientes')).resolves.toBeTruthy();
  });
});
