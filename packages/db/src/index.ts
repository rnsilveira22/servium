import pg from 'pg';

/** Conexão administrativa (dono do schema; superuser bypassa RLS). */
export const ADMIN_URL =
  process.env.DATABASE_URL ?? 'postgres://servium:servium_dev@localhost:5432/servium';

/**
 * Conexão da aplicação: role sem BYPASSRLS criado pela migration 0003.
 * É por aqui que API e testes de isolamento falam com o banco.
 */
export const APP_URL =
  process.env.APP_DATABASE_URL ??
  'postgres://servium_app:servium_app@localhost:5432/servium';

export function admin() {
  return new pg.Client({ connectionString: ADMIN_URL });
}

export function app() {
  return new pg.Client({ connectionString: APP_URL });
}

/**
 * Define o contexto de tenant da conexão para as políticas de RLS
 * (`NULLIF(...,'')` nas policies tolera contexto vazio/ausente).
 */
export async function setTenant(client: pg.Client, tenantId: string | null) {
  await client.query('SELECT set_config($1, $2, false)', [
    'app.tenant_id',
    tenantId ?? '',
  ]);
}
