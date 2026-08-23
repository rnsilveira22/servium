import { afterAll, describe, expect, it } from 'vitest';
import { TENANT_AUDIT, admin, app, setTenant } from './helpers';

describe('trilha de auditoria append-only', () => {
  let adm: Awaited<ReturnType<typeof admin>>;

  afterAll(async () => {
    if (!adm) return;
    await adm.query('DELETE FROM eventos_auditoria');
    await adm.query('DELETE FROM tenants WHERE id = $1', [TENANT_AUDIT]);
    void adm.end();
  });

  it('permite INSERT mas nega UPDATE/DELETE para a aplicação', async () => {
    adm = admin();
    await adm.connect();
    await adm.query("INSERT INTO tenants (id, nome) VALUES ($1,'Audit')", [TENANT_AUDIT]);

    const cl = app();
    await cl.connect();
    await setTenant(cl, TENANT_AUDIT);

    const { rows } = await cl.query(
      `INSERT INTO eventos_auditoria (tenant_id, actor_type, entidade, entidade_id, acao)
       VALUES ($1,'sistema','ciclos',$2,'criado') RETURNING id`,
      [TENANT_AUDIT, TENANT_AUDIT]
    );
    expect(rows).toHaveLength(1);

    await expect(
      cl.query('UPDATE eventos_auditoria SET acao = $1 WHERE id = $2', ['adulterado', rows[0].id])
    ).rejects.toThrowError(/permission denied/i);

    await expect(cl.query('DELETE FROM eventos_auditoria')).rejects.toThrowError(
      /permission denied/i
    );

    void cl.end();
  });
});
