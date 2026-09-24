import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { hash } from '@node-rs/argon2';

import { ADMIN_URL } from '@servium-ia/db';
import { buildApp } from '../src/app.factory';

// Tenants EXCLUSIVOS deste arquivo (paralelismo vitest — lição SRV-7)
const TEN_A = '99999999-9999-9999-9999-999999999991';
const TEN_B = '99999999-9999-9999-9999-999999999992';
const SLUG_A = 'tenant-atv-a';
const SLUG_B = 'tenant-atv-b';
const EMAIL = 'admin@atv-test.local';
const SENHA = 'senha-' + randomBytes(8).toString('hex');

let app: INestApplication;
let req: supertest.Agent;
let admin: import('pg').Client;
let cookieA: string;
let cookieB: string;
let agenteEstagiaria: string;

async function seed(ten: string, slug: string) {
  await admin.query("INSERT INTO tenants (id, nome, slug) VALUES ($1,'Atv Test',$2)", [ten, slug]);
  await admin.query(
    `INSERT INTO operadores (tenant_id, nome, email, senha_hash, papel)
     VALUES ($1,'Admin',$2,$3,'admin')`,
    [ten, EMAIL, await hash(SENHA)]
  );
}

async function login(slug: string): Promise<string> {
  const r = await req.post('/auth/login').send({ slug, email: EMAIL, senha: SENHA });
  expect(r.status).toBe(200);
  return r.headers['set-cookie'][0].split(';')[0];
}

async function criarChecklist(tag: string, cookie = cookieA) {
  return req
    .post('/checklist-templates')
    .set('Cookie', cookie)
    .send({ nome: `Checklist ${tag}`, canal: 'email', itens: [{ descricao: 'Contrato social', tipo_esperado: 'documento' }] });
}

beforeAll(async () => {
  const pg = await import('pg');
  admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await limpar();
  await seed(TEN_A, SLUG_A);
  await seed(TEN_B, SLUG_B);

  app = await buildApp(true);
  await app.init();
  req = supertest(app.getHttpServer());
  cookieA = await login(SLUG_A);
  cookieB = await login(SLUG_B);

  const cat = await req.get('/agentes').set('Cookie', cookieA);
  expect(cat.status).toBe(200);
  agenteEstagiaria = cat.body.find((a: { slug: string }) => a.slug === 'estagiaria-digital')?.id;
  expect(agenteEstagiaria).toBeTruthy();
});

afterAll(async () => {
  await app.close();
  await limpar();
  void admin.end();
});

async function limpar() {
  // agentes é catálogo por tenant: remove agentes de teste dos dois tenants
  for (const ten of [TEN_A, TEN_B]) {
    await admin.query(`DELETE FROM agentes WHERE tenant_id=$1 AND slug IN ('atv-teste','atv-inativo')`, [ten]);
    for (const sql of [
      'DELETE FROM atividades WHERE tenant_id=$1',
      'DELETE FROM itens_template WHERE tenant_id=$1',
      'DELETE FROM obrigacoes WHERE tenant_id=$1',
      'DELETE FROM checklist_templates WHERE tenant_id=$1',
      'DELETE FROM email_templates WHERE tenant_id=$1',
      'DELETE FROM clientes WHERE tenant_id=$1',
      'DELETE FROM eventos_auditoria WHERE tenant_id=$1',
      'DELETE FROM sessoes WHERE tenant_id=$1',
      'DELETE FROM operadores WHERE tenant_id=$1',
      'DELETE FROM tenants WHERE id=$1',
    ]) {
      await admin.query(sql, [ten]);
    }
  }
}

describe('FR-020 Atividade Operacional + FR-021 Agente Executor', () => {
  it('CRUD: criar/listar/detalhar/atualizar atividade com agente e checklist', async () => {
    const checklist = await criarChecklist('FR020');
    expect(checklist.status).toBe(201);

    const criada = await req
      .post('/atividades')
      .set('Cookie', cookieA)
      .send({
        nome: 'Solicitação mensal de documentos para fechamento',
        descricao: 'Rotina de solicitação de pendências no fechamento mensal',
        periodicidade: 'mensal',
        escopo: 'todos_ativos',
        agente_id: agenteEstagiaria,
        canal: 'email',
        prazo_dias: 10,
        checklist_template_id: checklist.body.id,
        comportamento: { cobrar: false },
      });
    expect(criada.status).toBe(201);
    expect(criada.body.id).toBeDefined();
    expect(criada.body.status).toBe('ativa');
    expect(criada.body.agente_nome).toBe('Estagiária Digital');
    expect(criada.body.checklist_template_nome).toBe('Checklist FR020');
    expect(criada.body.comportamento.solicitar).toBe(true);
    expect(criada.body.comportamento.cobrar).toBe(false);
    expect(criada.body.comportamento.escalar).toBe(true);

    const lista = await req.get('/atividades').set('Cookie', cookieA);
    expect(lista.status).toBe(200);
    expect(lista.body.some((a: { id: string }) => a.id === criada.body.id)).toBe(true);

    const detalhe = await req.get(`/atividades/${criada.body.id}`).set('Cookie', cookieA);
    expect(detalhe.status).toBe(200);
    expect(detalhe.body.agente_slug).toBe('estagiaria-digital');

    const atualizada = await req
      .put(`/atividades/${criada.body.id}`)
      .set('Cookie', cookieA)
      .send({ nome: 'Solicitação mensal (atualizada)', prazo_dias: 15 });
    expect(atualizada.status).toBe(200);
    expect(atualizada.body.nome).toBe('Solicitação mensal (atualizada)');
    expect(atualizada.body.prazo_dias).toBe(15);
    expect(atualizada.body.checklist_template_id).toBe(checklist.body.id); // campo ausente preservado
    expect(atualizada.body.comportamento.cobrar).toBe(false); // ausente preservado
  });

  it('validações: nome vazio ⇒ 400; periodicidade inválida ⇒ 400; prazo inválido ⇒ 400; nada a atualizar ⇒ 400', async () => {
    const r1 = await req.post('/atividades').set('Cookie', cookieA).send({ nome: '  ', agente_id: agenteEstagiaria });
    expect(r1.status).toBe(400);

    const r2 = await req
      .post('/atividades')
      .set('Cookie', cookieA)
      .send({ nome: 'X', periodicidade: 'diaria', agente_id: agenteEstagiaria });
    expect(r2.status).toBe(400);

    const r3 = await req
      .post('/atividades')
      .set('Cookie', cookieA)
      .send({ nome: 'X', prazo_dias: -3, agente_id: agenteEstagiaria });
    expect(r3.status).toBe(400);

    const criada = await req.post('/atividades').set('Cookie', cookieA).send({ nome: 'R', agente_id: agenteEstagiaria });
    const nada = await req.put(`/atividades/${criada.body.id}`).set('Cookie', cookieA).send({});
    expect(nada.status).toBe(400);
  });

  it('agente obrigatório e agente inativo rejeitados', async () => {
    const semAgente = await req.post('/atividades').set('Cookie', cookieA).send({ nome: 'Sem agente' });
    expect(semAgente.status).toBe(400);

    const inativo = await admin.query(
      `INSERT INTO agentes (tenant_id, slug, nome, descricao, capacidade, ativo)
       VALUES ($1,'atv-inativo','Agente Inativo','x','x',false) RETURNING id`,
      [TEN_A]
    );
    const recusado = await req
      .post('/atividades')
      .set('Cookie', cookieA)
      .send({ nome: 'Inativo', agente_id: inativo.rows[0].id });
    expect(recusado.status).toBe(400);
    expect(String(recusado.body.message)).toContain('inativo');
  });

  it('ativar/desativar atualiza status e gera auditoria', async () => {
    const criada = await req.post('/atividades').set('Cookie', cookieA).send({ nome: 'Toggle', agente_id: agenteEstagiaria });
    expect(criada.body.status).toBe('ativa');

    const desativada = await req.post(`/atividades/${criada.body.id}/desativar`).set('Cookie', cookieA);
    expect(desativada.status).toBe(201);
    expect(desativada.body.status).toBe('inativa');

    const reativada = await req.post(`/atividades/${criada.body.id}/ativar`).set('Cookie', cookieA);
    expect(reativada.status).toBe(201);
    expect(reativada.body.status).toBe('ativa');

    const audit = await admin.query(
      `SELECT acao FROM eventos_auditoria WHERE tenant_id=$1 AND entidade='atividade' AND entidade_id=$2 ORDER BY criado_em`,
      [TEN_A, criada.body.id]
    );
    const acoes = audit.rows.map((r) => r.acao);
    expect(acoes).toContain('criar');
    expect(acoes).toContain('desativar');
    expect(acoes).toContain('ativar');
  });

  it('isolamento RLS: atividade de A é invisível e inacessível em B', async () => {
    const criada = await req.post('/atividades').set('Cookie', cookieA).send({ nome: 'Só A', agente_id: agenteEstagiaria });
    expect(criada.status).toBe(201);

    const listaB = await req.get('/atividades').set('Cookie', cookieB);
    expect(listaB.body.some((a: { id: string }) => a.id === criada.body.id)).toBe(false);

    const detalheB = await req.get(`/atividades/${criada.body.id}`).set('Cookie', cookieB);
    expect(detalheB.status).toBe(404);

    const toggleB = await req.post(`/atividades/${criada.body.id}/desativar`).set('Cookie', cookieB);
    expect(toggleB.status).toBe(404);
  });

  it('checklist de outro tenant rejeitado ao vincular atividade', async () => {
    const checklistB = await criarChecklist('CrossB', cookieB);
    expect(checklistB.status).toBe(201);

    const negada = await req
      .post('/atividades')
      .set('Cookie', cookieA)
      .send({ nome: 'Cross', agente_id: agenteEstagiaria, checklist_template_id: checklistB.body.id });
    expect(negada.status).toBe(404);
  });

  it('não autenticado ⇒ 401 em /atividades e /agentes', async () => {
    const semAuth = await req.get('/atividades');
    expect(semAuth.status).toBe(401);
    const catSemAuth = await req.get('/agentes');
    expect(catSemAuth.status).toBe(401);
  });
});