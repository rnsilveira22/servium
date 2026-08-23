#!/usr/bin/env node
// Runner mínimo de migrations (spike SRV-10): pg puro, ordem lexicográfica,
// cada arquivo em transação com registro em schema_migrations.
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://servium:servium_dev@localhost:5432/servium';

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const { rows } = await client.query('SELECT filename FROM schema_migrations');
const applied = new Set(rows.map((r) => r.filename));
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

let ran = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await import('node:fs/promises').then((fs) => fs.readFile(join(MIGRATIONS_DIR, file), 'utf8'));
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`aplicada: ${file}`);
    ran++;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`FALHA em ${file}:`, err.message);
    process.exit(1);
  }
}

console.log(`${ran} migration(s) aplicada(s), ${files.length - applied.size - ran} já existente(s)`);
await client.end();
