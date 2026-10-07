import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { hash } from '@node-rs/argon2';
import { Client } from 'pg';

import { ADMIN_URL, APP_URL } from '@servium-ia/db';
import { buildApp } from '../src/app.factory';

const TEN = 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
const TEN_OUTRO = 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';
const SLUG = 'tenant-metrics-negocio';
const EMAIL = 'admin@metrics.local';
const SENHA = 'senha-' + randomBytes(8).toString('hex');

let app: INestApplication;
let req: supertest.Agent;
let admin: Client;
let ctx: Client;
let cookieAdmin: string;
let cookieOperador: string;

async function seedUsuario(ten: string, email: string, papel: string) {
  await admin.query(
    `INSERT INTO operadores (tenant_id, nome, email, senha_hash, papel)
     VALUES ($1,$2,$3,$4,$5)`,
    [ten, papel === 'admin' ? 'Admin' : 'Operador', email, await hash(SENHA), papel]
  );
}

beforeAll(async () => {
  admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await limpar();
  await limparTenant(TEN_OUTRO, 'tenant-metrics-outro');
  await admin.query("INSERT INTO tenants (id, nome, slug) VALUES ($1,'Metrics',$2)", [TEN, SLUG]);
  await seedUsuario(TEN, EMAIL, 'admin');
  await seedUsuario(TEN, 'op@metrics.local', 'operador');

  app = await buildApp(true);
  await app.init();
  req = supertest(app.getHttpServer());

  const login = async (email: string) => {
    const r = await req.post('/auth/login').send({ slug: SLUG, email, senha: SENHA });
    expect(r.status).toBe(200);
    return r.headers['set-cookie'][0].split(';')[0];
  };
  cookieAdmin = await login(EMAIL);
  cookieOperador = await login('op@metrics.local');

  ctx = new Client({ connectionString: APP_URL });
  await ctx.connect();
  await ctx.query('SELECT set_config($1,$2,false)', ['app.tenant_id', TEN]);
});

afterAll(async () => {
  await app.close();
  await limpar();
  void ctx.end();
  void admin.end();
});

async function limpar() {
  await admin.query("DELETE FROM itens_ciclo ic USING ciclos c WHERE ic.ciclo_id=c.id AND c.tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM ciclos c USING obrigacoes o WHERE c.obrigacao_id=o.id AND o.tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM obrigacoes WHERE tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM clientes WHERE tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM itens_template WHERE tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM checklist_templates WHERE tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM eventos_auditoria WHERE tenant_id=$1", [TEN]);
  await admin.query("DELETE FROM sessoes WHERE tenant_id=$1", [TEN]);
  await admin.query('DELETE FROM operadores WHERE tenant_id=$1', [TEN]);
  await admin.query('DELETE FROM tenants WHERE id=$1', [TEN]);
}

async function limparTenant(ten: string, slug: string) {
  await admin.query('DELETE FROM eventos_auditoria WHERE tenant_id=$1', [ten]);
  await admin.query('DELETE FROM sessoes WHERE tenant_id=$1', [ten]);
  await admin.query('DELETE FROM operadores WHERE tenant_id=$1', [ten]);
  await admin.query('DELETE FROM tenants WHERE id=$1', [ten]);
  // idempotente também para subtuplas antigas com o mesmo slug
  await admin.query("DELETE FROM tenants WHERE slug=$1 AND id<>$2", [slug, ten]);
}

async function semearItemPendente(): Promise<{ clienteId: string }> {
  const [clienteId, templateId, itemTemplateId, obrigacaoId, cicloId, itemId] = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ];
  await ctx.query('INSERT INTO clientes (id,tenant_id,nome,email) VALUES ($1,$2,$3,$4)', [
    clienteId,
    TEN,
    'Cliente Métricas',
    'cm@metrics.local',
  ]);
  await ctx.query('INSERT INTO checklist_templates (id,tenant_id,nome,canal) VALUES ($1,$2,$3,$4)', [
    templateId,
    TEN,
    'Template Métricas',
    'email',
  ]);
  await ctx.query('INSERT INTO itens_template (id,tenant_id,template_id,descricao) VALUES ($1,$2,$3,$4)', [
    itemTemplateId,
    TEN,
    templateId,
    'Item Metricável',
  ]);
  await ctx.query('INSERT INTO obrigacoes (id,tenant_id,cliente_id,descricao) VALUES ($1,$2,$3,$4)', [
    obrigacaoId,
    TEN,
    clienteId,
    'Obrigação Métricas',
  ]);
  await ctx.query('INSERT INTO ciclos (id,tenant_id,obrigacao_id,estado) VALUES ($1,$2,$3,$4)', [
    cicloId,
    TEN,
    obrigacaoId,
    'aberto',
  ]);
  await ctx.query(
    `INSERT INTO itens_ciclo (id,tenant_id,ciclo_id,item_template_id,estado,tentativas)
     VALUES ($1,$2,$3,$4,'pendente',0)`,
    [itemId, TEN, cicloId, itemTemplateId]
  );
  return { clienteId };
}

describe('B-5 · /metrics/negocio (criterio 9 — RBAC + RLS)', () => {
  it('sem autenticação ⇒ 401', async () => {
    expect((await req.get('/metrics/negocio')).status).toBe(401);
  });

  it('operador ⇒ 403 (RBAC admin-only)', async () => {
    const r = await req.get('/metrics/negocio').set('Cookie', cookieOperador);
    expect(r.status).toBe(403);
  });

  it('admin ⇒ 200 com a estrutura mínima de métricas', async () => {
    const r = await req.get('/metrics/negocio').set('Cookie', cookieAdmin);
    expect(r.status).toBe(200);
    expect(typeof r.body.atualizadoEm).toBe('string');
    expect(r.body.negocio).toBeDefined();
    expect(r.body.negocio.ciclos).toBeTypeOf('number');
    expect(r.body.negocio.documentosEnviados).toBeTypeOf('number');
    expect(r.body.negocio.documentosRecebidos).toBeTypeOf('number');
    expect(r.body.negocio.pendenciasPorCliente).toEqual([]);
    expect(r.body.tecnica.jobsEmRetry).toBeTypeOf('number');
    expect(r.body.tecnica.mensagensSemCorrelacao).toBeTypeOf('number');
  });

  it('reflete dados do tenant após semear item pendente (RLS)', async () => {
    await semearItemPendente();
    const r = await req.get('/metrics/negocio').set('Cookie', cookieAdmin);
    expect(r.status).toBe(200);
    expect(r.body.negocio.pendenciasTotal).toBe(1);
    expect(r.body.negocio.pendenciasPorCliente.length).toBe(1);
    expect(r.body.negocio.pendenciasPorCliente[0].nome).toBe('Cliente Métricas');
  });

  it('isola por tenant: um segundo tenant não vê os dados do primeiro (RLS)', async () => {
    const tenOutro = TEN_OUTRO;
    await admin.query("INSERT INTO tenants (id, nome, slug) VALUES ($1,'Outro','tenant-metrics-outro')", [tenOutro]);
    await admin.query(
      `INSERT INTO operadores (tenant_id, nome, email, senha_hash, papel)
       VALUES ($1,'Admin2',$2,$3,'admin')`,
      [tenOutro, 'a@metrics.outro', await hash(SENHA)]
    );
    try {
      const r = await req
        .post('/auth/login')
        .send({ slug: 'tenant-metrics-outro', email: 'a@metrics.outro', senha: SENHA });
      expect(r.status).toBe(200);
      const cookieOutro = r.headers['set-cookie'][0].split(';')[0];
      const m = await req.get('/metrics/negocio').set('Cookie', cookieOutro);
      expect(m.status).toBe(200);
      expect(m.body.negocio.pendenciasTotal).toBe(0);
    } finally {
      await limparTenant(tenOutro, 'tenant-metrics-outro');
    }
  });
});