import type pg from 'pg';

/**
 * Padrão OBRIGATÓRIO de acesso da aplicação (CA-01 / ADR-005):
 * toda operação de negócio roda dentro de um contexto de tenant explícito.
 *
 * - conexão SEMPRE pelo role `servium_app` (nunca superuser em runtime);
 * - `app.tenant_id` definido antes de qualquer query;
 * - commit/rollback garante que o contexto não vaza para a próxima requisição
 *   (defesa adicional mesmo com pool por sessão).
 */
export async function withTenant<T>(
  client: pg.Client,
  tenantId: string,
  fn: (tx: pg.Client) => Promise<T>
): Promise<T> {
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, false)", [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  }
}
