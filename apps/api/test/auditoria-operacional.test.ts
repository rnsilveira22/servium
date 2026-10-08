import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import pg from 'pg';

import { ADMIN_URL, APP_URL, type EventoAuditoriaDTO } from '@servium-ia/db';
import { buildApp } from '../src/app.factory';
import { interpretarEventoOperacional } from '../src/auditoria/presenter';

const TEN = '77770000-0000-0000-0000-0000000000a1';
const TEN_B = '77770000-0000-0000-0000-0000000000b2';
const SLUG = 'tenant-audop-test';
const ADMIN_EMAIL = 'admin@audop-test.local';
const OP_EMAIL = 'op@audop-test.local';
const SENHA = 'senha-' + randomBytes(8).toString('hex');

let app: INestApplication;
let req: supertest.Agent;
let admin: pg.Client;
let ctx: pg.Client;
let cookieAdmin: string;
let cookieOp: string;

let cliX: string;
let cliY: string;
let cliB: string;
let iX: string;
let iY: string;
let iB: string;
let atvA: string;
let adminId: string;

function evento(over: Partial<EventoAuditoriaDTO>): EventoAuditoriaDTO {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    actor_type: 'sistema',
    actor_id: null,
    entidade: 'item_ciclo',
    entidade_id: '00000000-0000-4000-8000-0000000000aa',
    acao: 'receber',
    detalhes: null,
    criado_em: new Date(),
    ...over,
  };
}

describe('presenter operacional (FR-028)', () => {
  it('cobrar: título/resultado/severidade operacionais; agente servico = Estagiária Digital', () => {
    const ev = interpretarEventoOperacional(
      evento({ actor_type: 'servico', acao: 'cobrar', detalhes: { rodada: 3 } }),
      { cliente: 'Empresa ABC Ltda.', atividade: null }
    );
    expect(ev.titulo).toBe('Solicitação de documentos enviada');
    expect(ev.resultado).toBe('Enviado com sucesso');
    expect(ev.severidade).toBe('success');
    expect(ev.excecao).toBe(false);
    expect(ev.intervencaoHumana).toBe(false);
    expect(ev.agente).toBe('Estagiária Digital');
    expect(ev.cliente).toBe('Empresa ABC Ltda.');
    expect(ev.alteracoes[0]).toBe('Envio da rodada 3');
  });

  it('escalar: é exceção operacional com severidade excecao', () => {
    const ev = interpretarEventoOperacional(
      evento({ actor_type: 'servico', acao: 'escalar', detalhes: { motivo: 'limite' } }),
      { cliente: 'Empresa ABC Ltda.', atividade: null }
    );
    expect(ev.excecao).toBe(true);
    expect(ev.severidade).toBe('excecao');
    expect(ev.resultado).toBe('Escalada para tratamento');
    expect(ev.alteracoes[0]).toBe('Pendência movida para exceção');
  });

  it('decidir (operador): intervenção humana true e agente = nome do operador', () => {
    const ev = interpretarEventoOperacional(
      evento({ actor_type: 'operador', actor_id: 'x', actor_nome: 'Maria', acao: 'decidir', detalhes: { desfecho: 'resolvido' } }),
      { cliente: null, atividade: null }
    );
    expect(ev.intervencaoHumana).toBe(true);
    expect(ev.agente).toBe('Maria');
    expect(ev.resultado).toBe('Resolvida');
    expect(ev.alteracoes[0]).toBe('Desfecho: resolvido');
  });

  it('sistema: agente "Sistema", sem intervenção humana', () => {
    const ev = interpretarEventoOperacional(evento({ actor_type: 'sistema', acao: 'receber' }), {
      cliente: 'Empresa ABC Ltda.',
      atividade: null,
    });
    expect(ev.agente).toBe('Sistema');
    expect(ev.intervencaoHumana).toBe(false);
    expect(ev.resultado).toBe('Recebido e pendência atualizada');
  });

  it('atividade: título e resultado por entidade; cliente ausente não é inventado', () => {
    const ev = interpretarEventoOperacional(
      evento({ entidade: 'atividade', acao: 'criar', detalhes: { nome: 'Rotina mensal', agente_nome: 'Estagiária Digital' } }),
      { cliente: null, atividade: 'Rotina mensal' }
    );
    expect(ev.titulo).toBe('Atividade criada');
    expect(ev.cliente).toBeNull();
    expect(ev.atividade).toBe('Rotina mensal');
  });

  it('evento desconhecido: fallback sem invenção', () => {
    const ev = interpretarEventoOperacional(evento({ entidade: 'futuro_modulo', acao: 'acao_futura' }), {
      cliente: null,
      atividade: null,
    });
    expect(ev.titulo).toBe('Evento registrado');
    expect(ev.resultado).toBe('Registrado');
    expect(ev.alteracoes).toEqual([]);
  });

  it('login_sucesso (operador): acesso, intervenção humana', () => {
    const ev = interpretarEventoOperacional(
      evento({ entidade: 'auth', acao: 'login_sucesso', actor_type: 'operador', actor_nome: 'Maria' }),
      { cliente: null, atividade: null }
    );
    expect(ev.titulo).toBe('Entrada no sistema');
    expect(ev.severidade).toBe('success');
    expect(ev.intervencaoHumana).toBe(true);
  });
});

async function limpar() {
  await admin.query('DELETE FROM eventos_auditoria WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM jobs_fila WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM excecoes WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM itens_ciclo WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM ciclos WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM atividades WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM obrigacoes WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM itens_template WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM checklist_templates WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM agentes WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM clientes WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM sessoes WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM operadores WHERE tenant_id IN ($1,$2)', [TEN, TEN_B]);
  await admin.query('DELETE FROM tenants WHERE id IN ($1,$2)', [TEN, TEN_B]);
}

beforeAll(async () => {
  admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await limpar();

  await admin.query("INSERT INTO tenants (id, nome, slug) VALUES ($1,'AuditOp A',$2)", [TEN, SLUG]);
  await admin.query("INSERT INTO tenants (id, nome) VALUES ($1,'AuditOp B')", [TEN_B]);
  const { rows: ops } = await admin.query(
    "INSERT INTO operadores (tenant_id, nome, email, senha_hash, papel) VALUES ($1,'Chefe',$2,$3,'admin'),($1,'Atendente',$4,$5,'operador') RETURNING id, email",
    [TEN, ADMIN_EMAIL, await (await import('@node-rs/argon2')).hash(SENHA), OP_EMAIL, await (await import('@node-rs/argon2')).hash(SENHA)]
  );
  adminId = ops.find((o: { email: string }) => o.email === ADMIN_EMAIL).id;

  const { rows: cA } = await admin.query(
    "INSERT INTO clientes (tenant_id, nome, email) VALUES ($1,'Empresa X',$2),($1,'Empresa Y',$3) RETURNING id, nome",
    [TEN, 'cli-x@x.com', 'cli-y@y.com']
  );
  cliX = cA.find((c: { nome: string }) => c.nome === 'Empresa X').id;
  cliY = cA.find((c: { nome: string }) => c.nome === 'Empresa Y').id;
  const { rows: cb } = await admin.query("INSERT INTO clientes (tenant_id, nome) VALUES ($1,'Cliente B') RETURNING id", [TEN_B]);
  cliB = cb[0].id;

  const { rows: tpl } = await admin.query(
    "INSERT INTO checklist_templates (tenant_id, nome) VALUES ($1,'Tpl A') RETURNING id",
    [TEN]
  );
  const { rows: its } = await admin.query(
    "INSERT INTO itens_template (tenant_id, template_id, descricao, tipo_esperado) VALUES ($1,$2,'Contrato','documento') RETURNING id",
    [TEN, tpl[0].id]
  );

  const { rows: obA } = await admin.query(
    "INSERT INTO obrigacoes (tenant_id, cliente_id, descricao, template_id) VALUES ($1,$2,'Obriga X',$4),($1,$3,'Obriga Y',$4) RETURNING id",
    [TEN, cliX, cliY, tpl[0].id]
  );
  const { rows: obB } = await admin.query(
    "INSERT INTO obrigacoes (tenant_id, cliente_id, descricao) VALUES ($1,$2,'Obriga B') RETURNING id",
    [TEN_B, cliB]
  );

  const { rows: cX } = await admin.query(
    "INSERT INTO ciclos (tenant_id, obrigacao_id) VALUES ($1,$2) RETURNING id",
    [TEN, obA[0].id]
  );
  const { rows: cY } = await admin.query(
    "INSERT INTO ciclos (tenant_id, obrigacao_id) VALUES ($1,$2) RETURNING id",
    [TEN, obA[1].id]
  );
  const { rows: cB } = await admin.query("INSERT INTO ciclos (tenant_id, obrigacao_id) VALUES ($1,$2) RETURNING id", [TEN_B, obB[0].id]);

  const { rows: iAA } = await admin.query(
    "INSERT INTO itens_ciclo (tenant_id, ciclo_id, item_template_id) VALUES ($1,$2,$3),($1,$4,$5) RETURNING id, ciclo_id",
    [TEN, cX[0].id, its[0].id, cY[0].id, its[0].id]
  );
  iX = iAA[0].id;
  iY = iAA[1].id;
  const { rows: iBB } = await admin.query(
    "INSERT INTO itens_ciclo (tenant_id, ciclo_id, item_template_id) VALUES ($1,$2,$3) RETURNING id",
    [TEN_B, cB[0].id, its[0].id]
  );
  iB = iBB[0].id;

  const { rows: agt } = await admin.query(
    `SELECT id FROM agentes WHERE tenant_id=$1 AND slug='estagiaria-digital'`,
    [TEN]
  );
  const { rows: atvs } = await admin.query(
    `INSERT INTO atividades (tenant_id, nome, periodicidade, escopo, agente_id, canal, prazo_dias)
     VALUES ($1,'Solicitação mensal de documentos','mensal','todos_ativos',$2,'email',10) RETURNING id`,
    [TEN, agt[0].id]
  );
  atvA = atvs[0].id;

  // Eventos controlados por data (janela de período testável)
  await admin.query(
    `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,'servico','00000000-0000-4000-8000-00000000aa11','item_ciclo',$2,'cobrar','{"rodada":1}','2026-09-10T10:00:00Z')`,
    [TEN, iX]
  );
  await admin.query(
    `INSERT INTO eventos_auditoria (tenant_id, actor_type, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,'sistema','item_ciclo',$2,'receber','{}','2026-09-10T10:42:00Z')`,
    [TEN, iX]
  );
  await admin.query(
    `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,'servico','00000000-0000-4000-8000-00000000aa11','item_ciclo',$2,'escalar','{"motivo":"sem resposta"}','2026-09-15T09:18:00Z')`,
    [TEN, iX]
  );
  await admin.query(
    `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,'operador',$3,'item_ciclo',$2,'decidir','{"desfecho":"resolvido"}','2026-09-20T11:00:00Z')`,
    [TEN, iY, adminId]
  );
  await admin.query(
    `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,'operador',$2,'atividade',$3,'criar','{"nome":"Solicitação mensal de documentos"}','2026-09-21T12:00:00Z')`,
    [TEN, adminId, atvA]
  );
  await admin.query(
    `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,'servico','00000000-0000-4000-8000-00000000bb22','item_ciclo',$2,'cobrar','{}','2026-09-22T09:00:00Z')`,
    [TEN_B, iB]
  );

  ctx = new pg.Client({ connectionString: APP_URL });
  await ctx.connect();
  await ctx.query("SELECT set_config($1,$2,false)", ['app.tenant_id', TEN]);

  app = await buildApp(true);
  await app.init();
  req = supertest(app.getHttpServer());
  const loginAdmin = await req.post('/auth/login').send({ slug: SLUG, email: ADMIN_EMAIL, senha: SENHA });
  cookieAdmin = loginAdmin.headers['set-cookie'][0].split(';')[0];
  const loginOp = await req.post('/auth/login').send({ slug: SLUG, email: OP_EMAIL, senha: SENHA });
  cookieOp = loginOp.headers['set-cookie'][0].split(';')[0];
});

afterAll(async () => {
  if (app) await app.close();
  await limpar();
  void admin.end();
  void ctx.end();
});

async function get(query: Record<string, string>) {
  const r = await req.get('/auditoria').query(query).set('Cookie', cookieAdmin);
  expect(r.status).toBe(200);
  return r.body as { eventos: unknown[]; tem_mais: boolean };
}

describe('FR-028 · GET /auditoria camada operacional', () => {
  it('filtro de período (desde/ate) limita a janela', async () => {
    const { eventos } = await get({ desde: '2026-09-15T00:00:00.000Z', ate: '2026-09-21T23:59:59.999Z' });
    expect(eventos).toHaveLength(3); // escalar, decidir, criar atividade
    for (const e of eventos as { criado_em: string }[]) {
      const t = new Date(e.criado_em).getTime();
      expect(t).toBeGreaterThanOrEqual(new Date('2026-09-15T00:00:00.000Z').getTime());
      expect(t).toBeLessThanOrEqual(new Date('2026-09-21T23:59:59.999Z').getTime());
    }
  });

  it('validação: desde>ate, actor_type inválido e cliente_id inválido ⇒ 400', async () => {
    const casos: Record<string, string>[] = [
      { desde: '2026-09-21T00:00:00.000Z', ate: '2026-09-15T00:00:00.000Z' },
      { actor_type: 'robo' },
      { cliente_id: 'nao-uuid' },
      { desde: 'invalido' },
    ];
    for (const q of casos) {
      const r = await req.get('/auditoria').query(q).set('Cookie', cookieAdmin);
      expect(r.status, JSON.stringify(q)).toBe(400);
    }
  });

  it('filtro por agente (actor_type=servico) retorna somente eventos de serviço', async () => {
    const { eventos } = await get({ actor_type: 'servico' });
    const ids = (eventos as { entidade_id: string }[]).map((e) => e.entidade_id);
    expect(ids).toContain(iX);
    expect(ids).not.toContain(iY);
    expect(eventos.every((e: { actor_type: string }) => e.actor_type === 'servico')).toBe(true);
  });

  it('filtro por cliente (cliente_id) resolve via JOIN seguro', async () => {
    const { eventos } = await get({ cliente_id: cliX });
    const ids = (eventos as { entidade_id: string }[]).map((e) => e.entidade_id);
    expect(new Set(ids)).toEqual(new Set([iX])); // e1 cobrar, e2 receber, e3 escalar (todos do ciclo do cliente X)
    expect(ids).not.toContain(iY);
    expect(ids).not.toContain(atvA);
  });

  it('filtro por atividade (entidade+entidade_id) + enriquecimento atividade/cliente', async () => {
    const { eventos } = await get({ entidade: 'atividade', entidade_id: atvA });
    expect(eventos).toHaveLength(1);
    const ev = eventos[0] as { operacional: { titulo: string; atividade: string | null; cliente: string | null } };
    expect(ev.operacional.titulo).toBe('Atividade criada');
    expect(ev.operacional.atividade).toBe('Solicitação mensal de documentos');
    expect(ev.operacional.cliente).toBeNull(); // dados ausentes não inventados
  });

  it('enriquecimento: cliente resolvido por item_ciclo, agente por ator', async () => {
    const { eventos } = await get({ entidade: 'item_ciclo', entidade_id: iX });
    expect(eventos).toHaveLength(3);
    const cobrar = (eventos as { acao: string; operacional: { cliente: string | null; agente: string; titulo: string } }[]).find(
      (e) => e.acao === 'cobrar'
    )!;
    expect(cobrar.operacional.cliente).toBe('Empresa X');
    expect(cobrar.operacional.agente).toBe('Estagiária Digital');
    expect(cobrar.operacional.titulo).toBe('Solicitação de documentos enviada');
    const receber = (eventos as { acao: string; operacional: { agente: string } }[]).find((e) => e.acao === 'receber')!;
    expect(receber.operacional.agente).toBe('Sistema');
    const escalar = (eventos as { acao: string; operacional: { excecao: boolean; severidade: string } }[]).find(
      (e) => e.acao === 'escalar'
    )!;
    expect(escalar.operacional.excecao).toBe(true);
    expect(escalar.operacional.severidade).toBe('excecao');
  });

  it('evento de operador: agente = nome do operador e intervenção humana', async () => {
    const { eventos } = await get({ acao: 'decidir' });
    const ev = eventos[0] as { operacional: { agente: string; intervencaoHumana: boolean; resultado: string } };
    expect(ev.operacional.agente).toBe('Chefe');
    expect(ev.operacional.intervencaoHumana).toBe(true);
    expect(ev.operacional.resultado).toBe('Resolvida');
  });

  it('isolamento: cliente/evento de outro tenant nunca vaza', async () => {
    const { eventos } = await get({ cliente_id: cliB });
    expect(eventos).toEqual([]);
    const diret = await req.get('/auditoria').query({ entidade_id: iB }).set('Cookie', cookieAdmin);
    expect(diret.body.eventos).toEqual([]);
  });

  it('RBAC: operador ⇒ 403', async () => {
    expect((await req.get('/auditoria').set('Cookie', cookieOp)).status).toBe(403);
  });

  it('integridade: não existem rotas de mutação (append-only preservado)', async () => {
    expect((await req.post('/auditoria').set('Cookie', cookieAdmin)).status).toBe(404);
    expect((await req.put('/auditoria/x').set('Cookie', cookieAdmin)).status).toBe(404);
    expect((await req.delete('/auditoria/x').set('Cookie', cookieAdmin)).status).toBe(404);
    // DB: UPDATE/DELETE segue bloqueado pela role (servium_app)
    const ctx2 = new pg.Client({ connectionString: APP_URL });
    await ctx2.connect();
    await expect(ctx2.query("UPDATE eventos_auditoria SET acao='x' WHERE acao='cobrar'")).rejects.toThrow(/permission denied|does not have permission/i);
    await ctx2.end();
  });

  it('keyset paginação continua com a camada operacional', async () => {
    const p1 = (await get({ entidade: 'item_ciclo', entidade_id: iX, limite: '2' })) as {
      eventos: { id: string; criado_em: string }[];
      tem_mais: boolean;
    };
    expect(p1.eventos).toHaveLength(2);
    expect(p1.tem_mais).toBe(true);
    const ultimo = p1.eventos[p1.eventos.length - 1];
    const p2 = await req
      .get('/auditoria')
      .query({ antes_de: ultimo.criado_em, antes_id: ultimo.id, limite: '20' })
      .set('Cookie', cookieAdmin);
    expect(p2.status).toBe(200);
    const idsP2 = p2.body.eventos.map((e: { id: string }) => e.id);
    expect(idsP2.some((id: string) => id === ultimo.id)).toBe(false);
    expect(p2.body.eventos.length).toBeGreaterThan(0);
  });
});