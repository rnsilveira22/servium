import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { admin } from './helpers';

const runMigrate = () =>
  execFileSync('node', [join(dirname(__filename), '..', 'scripts', 'migrate.mjs')], {
    env: process.env,
    encoding: 'utf8',
  });

describe('migrations (contrato do schema)', () => {
  it('aplica o conjunto completo de forma idempotente', async () => {
    const out1 = runMigrate();
    expect(out1).toMatch(/aplicada/);

    // segunda execução é no-op
    expect(runMigrate()).toMatch(/0 migration\(s\) aplicada/);

    const client = admin();
    await client.connect();
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> 'schema_migrations'
    `);
    void client.end();

    const tables = rows.map((r) => r.tablename).sort();
    expect(tables).toHaveLength(13);
    expect(tables).toEqual(
      expect.arrayContaining([
        'tenants','operadores','clientes','obrigacoes','checklist_templates',
        'itens_template','ciclos','itens_ciclo','mensagens_comunicacao',
        'documentos','excecoes','eventos_auditoria','jobs_fila',
      ])
    );
  });

  it('toda tabela de negócio tem RLS habilitado e forçado', async () => {
    const client = admin();
    await client.connect();
    const { rows } = await client.query(`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND c.relname <> 'schema_migrations'
    `);
    void client.end();

    expect(rows).toHaveLength(13);
    for (const r of rows) {
      expect(r.relrowsecurity).toBe(true);
      expect(r.relforcerowsecurity).toBe(true);
    }
  });
});
