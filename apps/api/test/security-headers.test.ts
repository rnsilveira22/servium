import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { hash } from '@node-rs/argon2';

import { ADMIN_URL } from '@servium-ia/db';
import { buildApp } from '../src/app.factory';
import { cookieFor } from '../src/auth/auth.controller';

const TEN = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
const SLUG = 'tenant-security-headers';
const EMAIL = 'admin@sec-headers.local';
const SENHA = 'senha-' + randomBytes(8).toString('hex');

let app: INestApplication;
let req: supertest.Agent;
let admin: import('pg').Client;

beforeAll(async () => {
  const pg = await import('pg');
  admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await limpar();
  await admin.query("INSERT INTO tenants (id, nome, slug) VALUES ($1,'Sec Headers',$2)", [TEN, SLUG]);
  await admin.query(
    `INSERT INTO operadores (tenant_id, nome, email, senha_hash, papel)
     VALUES ($1,'Admin',$2,$3,'admin')`,
    [TEN, EMAIL, await hash(SENHA)]
  );
  app = await buildApp(true);
  await app.init();
  req = supertest(app.getHttpServer());
});

afterAll(async () => {
  await app.close();
  await limpar();
  void admin.end();
});

async function limpar() {
  await admin.query('DELETE FROM sessoes WHERE tenant_id=$1', [TEN]);
  await admin.query('DELETE FROM eventos_auditoria WHERE tenant_id=$1', [TEN]);
  await admin.query('DELETE FROM operadores WHERE tenant_id=$1', [TEN]);
  await admin.query('DELETE FROM tenants WHERE id=$1', [TEN]);
}

describe('P1-3 · security headers (G-01/G-03)', () => {
  it('GET /health devolve os headers de segurança esperados', async () => {
    const r = await req.get('/health');
    expect(r.status).toBe(200);
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
    expect(r.headers['referrer-policy']).toBe('no-referrer');
    expect(r.headers['content-security-policy']).toContain("default-src 'none'");
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('HSTS NÃO é emitido fora de produção', async () => {
    const r = await req.get('/health');
    expect(r.headers['strict-transport-security']).toBeUndefined();
  });

  it('método mutável com Origin de origem cruzada ⇒ 403 (defesa CSRF)', async () => {
    const r = await req
      .post('/auth/login')
      .set('Origin', 'http://evil.example')
      .send({ slug: SLUG, email: EMAIL, senha: SENHA });
    expect(r.status).toBe(403);
  });

  it('método mutável com Origin permitida ou ausente ⇒ prossegue', async () => {
    const ok = await req
      .post('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ slug: SLUG, email: EMAIL, senha: SENHA });
    expect(ok.status).toBe(200);

    const semOrigem = await req.post('/auth/login').send({ slug: SLUG, email: EMAIL, senha: SENHA });
    expect(semOrigem.status).toBe(200);
  });
});

describe('P1-3 · cookie Secure condicional (G-01 · V3.4.2)', () => {
  const origEnv = { NODE_ENV: process.env.NODE_ENV, COOKIE_SECURE: process.env.COOKIE_SECURE };

  afterAll(() => {
    process.env.NODE_ENV = origEnv.NODE_ENV;
    if (origEnv.COOKIE_SECURE === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = origEnv.COOKIE_SECURE;
  });

  it('em produção ⇒ Secure presente por padrão', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SECURE;
    expect(cookieFor('tok', 60)).toContain('; Secure');
  });

  it('fora de produção ⇒ Secure ausente por padrão', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.COOKIE_SECURE;
    expect(cookieFor('tok', 60)).not.toContain('; Secure');
  });

  it('COOKIE_SECURE=false desliga mesmo em produção (dev local)', () => {
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SECURE = 'false';
    expect(cookieFor('tok', 60)).not.toContain('; Secure');
  });

  it('COOKIE_SECURE=true liga mesmo fora de produção', () => {
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_SECURE = 'true';
    expect(cookieFor('tok', 60)).toContain('; Secure');
  });
});