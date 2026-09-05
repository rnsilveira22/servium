import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { listarEventos } from '../src/index.js';
import { admin, app, setTenant } from './helpers';

/**
 * PRM-P0.2-A · Issue #51 — trilha de auditoria consultável (nível DB).
 *
 * Tenant IDs e seed dedicados ao arquivo. Cada teste semeia e lê dentro de
 * UMA transação: o arquivo de auditoria append-only (`audit.test.ts`)
 * apaga a tabela inteira (DELETE FROM eventos_auditoria) no `afterAll` e
 * roda em paralelo no mesmo Postgres — com inserts não-commitados o DELETE
 * concorrente fica bloqueado até os asserts terminarem (determinismo);
 * ao final a transação é revertida, sem resíduo cross-file.
 */

const TENANT_A = 'eeee0000-0000-0000-0000-0000000000a1';
const TENANT_B = 'eeee0000-0000-0000-0000-0000000000b2';
const ITEM_A = 'dddd0000-0000-0000-0000-000000000001';
const ITEM_B = 'dddd0000-0000-0000-0000-000000000002';

const T_NOVO = '2026-09-05T10:00:00.000Z';
const T_TIE = '2026-09-01T10:00:00.000Z';
const T_ANTIGO = '2026-08-01T10:00:00.000Z';

const IDS_COBRAR = [
  'c0000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
];

let adm: Awaited<ReturnType<typeof admin>>;
let cl: Awaited<ReturnType<typeof app>>;

async function limpar() {
  await adm.query('DELETE FROM eventos_auditoria WHERE tenant_id IN ($1,$2)', [TENANT_A, TENANT_B]);
  await adm.query('DELETE FROM tenants WHERE id IN ($1,$2)', [TENANT_A, TENANT_B]);
}

/** Semeia os 7 eventos de A via conexão de aplicação (INSERT permite, append-only). */
async function sementeiraA(): Promise<{ id: string; criado_em: string }[]> {
  await setTenant(cl, TENANT_A);
  const seed: { id: string; criado_em: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const id = `c0000000-0000-0000-0000-00000000000${i + 1}`;
    seed.push({ id, criado_em: T_TIE });
    await cl.query(
      `INSERT INTO eventos_auditoria (id, tenant_id, actor_type, entidade, entidade_id, acao, detalhes, criado_em)
       VALUES ($1,$2,'sistema','item_ciclo',$3,'cobrar',$4,$5::timestamptz)`,
      [id, TENANT_A, ITEM_A, JSON.stringify({ rodada: i + 1 }), T_TIE]
    );
  }
  const novo = 'c0000000-0000-0000-0000-000000000101';
  const antigo = 'c0000000-0000-0000-0000-000000000102';
  seed.push({ id: novo, criado_em: T_NOVO });
  seed.push({ id: antigo, criado_em: T_ANTIGO });
  await cl.query(
    `INSERT INTO eventos_auditoria (id, tenant_id, actor_type, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,$2,'sistema','recebimento',$3,'receber',NULL,$4::timestamptz)`,
    [novo, TENANT_A, ITEM_A, T_NOVO]
  );
  await cl.query(
    `INSERT INTO eventos_auditoria (id, tenant_id, actor_type, actor_id, entidade, entidade_id, acao, criado_em)
     VALUES ($1,$2,'operador',NULL,'ciclo',$3,'ativar',$4::timestamptz)`,
    [antigo, TENANT_A, ITEM_A, T_ANTIGO]
  );
  return seed;
}

async function sementeiraB() {
  await setTenant(cl, TENANT_B);
  await cl.query(
    `INSERT INTO eventos_auditoria (id, tenant_id, actor_type, entidade, entidade_id, acao, detalhes, criado_em)
     VALUES ($1,$2,'sistema','item_ciclo',$3,'cobrar',$4,$5::timestamptz),
            ($6,$2,'sistema','item_ciclo',$3,'receber',NULL,$5::timestamptz)`,
    [
      'c0000000-0000-0000-0000-000000000201', TENANT_B, ITEM_B,
      JSON.stringify({ rodada: 1 }), T_TIE,
      'c0000000-0000-0000-0000-000000000202',
    ]
  );
}

describe('auditoria consultável · listarEventos', () => {
  beforeAll(async () => {
    adm = admin();
    await adm.connect();
    await limpar();
    await adm.query("INSERT INTO tenants (id, nome) VALUES ($1,'Audit A'),($2,'Audit B')", [TENANT_A, TENANT_B]);
    cl = app();
    await cl.connect();
  });

  afterAll(async () => {
    await limpar();
    void cl?.end();
    void adm?.end();
  });

  it('CA-04-2 · RLS deny-by-default: A vê só A, B só B, sem contexto → 0', async () => {
    await cl.query('BEGIN');
    try {
      await sementeiraA();
      await sementeiraB();

      await setTenant(cl, TENANT_A);
      const a = await listarEventos(cl);
      expect(a.eventos).toHaveLength(7);
      expect(a.eventos.every((e) => e.entidade_id === ITEM_A)).toBe(true);

      await setTenant(cl, TENANT_B);
      const b = await listarEventos(cl);
      expect(b.eventos).toHaveLength(2);
      expect(b.eventos.every((e) => e.entidade_id === ITEM_B)).toBe(true);

      await setTenant(cl, null);
      const nulo = await listarEventos(cl);
      expect(nulo.eventos).toHaveLength(0);
      expect(nulo.tem_mais).toBe(false);
    } finally {
      await cl.query('ROLLBACK').catch(() => undefined);
    }
  });

  it('ordenação sempre (criado_em DESC, id DESC) — empate de criado_em', async () => {
    await cl.query('BEGIN');
    try {
      const seed = await sementeiraA();
      const esperado = [...seed].sort(
        (x, y) => y.criado_em.localeCompare(x.criado_em) || (x.id < y.id ? 1 : x.id > y.id ? -1 : 0)
      );

      const { eventos } = await listarEventos(cl);
      expect(eventos.map((e) => e.id)).toEqual(esperado.map((s) => s.id));
      for (let i = 1; i < eventos.length; i++) {
        const ant = eventos[i - 1]!;
        const atual = eventos[i]!;
        const cmp = ant.criado_em.getTime() - atual.criado_em.getTime();
        expect(cmp > 0 || (cmp === 0 && ant.id > atual.id)).toBe(true);
      }
    } finally {
      await cl.query('ROLLBACK').catch(() => undefined);
    }
  });

  it('keyset: páginas não repetem nem perdem linha (empate forçado de criado_em)', async () => {
    await cl.query('BEGIN');
    try {
      const seed = await sementeiraA();
      const esperado = [...seed].sort(
        (x, y) => y.criado_em.localeCompare(x.criado_em) || (x.id < y.id ? 1 : x.id > y.id ? -1 : 0)
      ).map((s) => s.id);

      const pagina1 = await listarEventos(cl, { limite: 2 });
      expect(pagina1.eventos).toHaveLength(2);
      expect(pagina1.tem_mais).toBe(true);
      expect(pagina1.eventos.map((e) => e.id)).toEqual(esperado.slice(0, 2));

      const ult = pagina1.eventos[pagina1.eventos.length - 1]!;
      const pagina2 = await listarEventos(cl, {
        limite: 2,
        antesDe: ult.criado_em,
        antesId: ult.id,
      });
      expect(pagina2.eventos).toHaveLength(2);
      expect(pagina2.eventos.map((e) => e.id)).toEqual(esperado.slice(2, 4));
      const ids1 = new Set(pagina1.eventos.map((e) => e.id));
      expect(pagina2.eventos.every((e) => !ids1.has(e.id))).toBe(true);

      const coletado = [...pagina1.eventos, ...pagina2.eventos].map((e) => e.id);
      let cursor = pagina2.eventos[pagina2.eventos.length - 1]!;
      let p = pagina2;
      let guarda = 0;
      while (p.tem_mais && guarda++ < 10) {
        const prox = await listarEventos(cl, { limite: 2, antesDe: cursor.criado_em, antesId: cursor.id });
        coletado.push(...prox.eventos.map((e) => e.id));
        cursor = prox.eventos[prox.eventos.length - 1]!;
        p = prox;
      }
      expect(coletado).toEqual(esperado);
      expect(new Set(coletado).size).toBe(esperado.length);
    } finally {
      await cl.query('ROLLBACK').catch(() => undefined);
    }
  });

  it('filtros combináveis (entidade + entidade_id + acao) e detalhes íntegros', async () => {
    await cl.query('BEGIN');
    try {
      await sementeiraA();
      const { eventos, tem_mais } = await listarEventos(cl, {
        entidade: 'item_ciclo',
        entidadeId: ITEM_A,
        acao: 'cobrar',
      });
      expect(eventos).toHaveLength(5);
      expect(tem_mais).toBe(false);
      expect(eventos.every((e) => e.entidade === 'item_ciclo' && e.entidade_id === ITEM_A && e.acao === 'cobrar')).toBe(true);
      // DESC com empate: id maior primeiro
      expect(eventos.map((e) => e.id)).toEqual(IDS_COBRAR);
      const rodadas = eventos.map((e) => (e.detalhes as { rodada: number }).rodada).sort((a, b) => a - b);
      expect(rodadas).toEqual([1, 2, 3, 4, 5]);
    } finally {
      await cl.query('ROLLBACK').catch(() => undefined);
    }
  });

  it('tem_mais reflete o LIMIT; limite é clampado em [1,200]', async () => {
    await cl.query('BEGIN');
    try {
      await sementeiraA();
      expect((await listarEventos(cl, { limite: 1 })).tem_mais).toBe(true);
      expect((await listarEventos(cl, { limite: 1 })).eventos).toHaveLength(1);
      expect((await listarEventos(cl, { limite: 7 })).tem_mais).toBe(false);
      expect((await listarEventos(cl, { limite: 201 })).eventos).toHaveLength(7);
      expect((await listarEventos(cl, { limite: 0 })).eventos).toHaveLength(1);
      expect((await listarEventos(cl, { limite: 0 })).tem_mais).toBe(true);
    } finally {
      await cl.query('ROLLBACK').catch(() => undefined);
    }
  });
});