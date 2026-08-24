import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Garante que TODAS as migrations foram aplicadas ANTES de qualquer
 * arquivo de teste iniciar — elimina corrida em bancos virgens (CI).
 */
export default function globalSetup() {
  const runner = join(dirname(fileURLToPath(import.meta.url)), 'scripts', 'migrate.mjs');
  execFileSync('node', [runner], { stdio: 'inherit', env: process.env });
}
