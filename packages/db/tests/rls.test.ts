import { afterAll, describe, expect, it } from 'vitest';
import { TENANT_A, TENANT_B, admin, app, setTenant } from './helpers';

// Isolamento cross-tenant SEMPRE via role servium_app (superuser bypassa RLS).
describe('RLS deny-by-default', () => {
  let cleanup: Awaited<ReturnType<typeof admin>>;

  afterAll(async () => {
    if (!cleanup) return;
    await cleanup.query('DELETE FROM clientes WHERE tenant_id IN ($1,$2)', [TENANT_A, TENANT_B]);
    await cleanup.query('DELETE FROM tenants WHERE id IN ($1,$2)', [TENANT_A, TENANT_B]);
    void cleanup.end();
  });

  it('cliente do tenant A é invisível para B e sem contexto', async () => {
    const adm = admin();
    await adm.connect();
    cleanup = adm;
    await adm.query("INSERT INTO tenants (id, nome) VALUES ($1,'A'),($2,'B')", [TENANT_A, TENANT_B]);

    const cl = app();
    await cl.connect();

    await setTenant(cl, TENANT_A);
    const { rows: criado } = await cl.query(
      "INSERT INTO clientes (tenant_id, nome) VALUES ($1,'Cliente A') RETURNING id",
      [TENANT_A]
    );
    expect(criado).toHaveLength(1);

    // mesmo tenant vê
    await setTenant(cl, TENANT_A);
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(1);

    // outro tenant não vê nada
    await setTenant(cl, TENANT_B);
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(0);

    // sem contexto: deny-by-default
    await setTenant(cl, null);
    expect((await cl.query('SELECT id FROM clientes')).rows).toHaveLength(0);

    // WITH CHECK bloqueia insert apontando para outro tenant
    await setTenant(cl, TENANT_B);
    await expect(
      cl.query("INSERT INTO clientes (tenant_id, nome) VALUES ($1,'vazamento')", [TENANT_A])
    ).rejects.toThrowError(/row-level security/i);

    void cl.end();
  });
});
