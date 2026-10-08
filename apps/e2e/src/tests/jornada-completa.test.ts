import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import pg from 'pg';
import type { WebDriver } from 'selenium-webdriver';
import { By } from 'selenium-webdriver';

import { createDriver } from '../support/driver.js';
import { takeScreenshot } from '../support/evidence.js';
import { LoginPage } from '../pages/LoginPage.js';
import { LayoutPage } from '../pages/LayoutPage.js';
import { ObrigacoesPage } from '../pages/ObrigacoesPage.js';
import { CiclosPage } from '../pages/CiclosPage.js';
import { CicloDetailPage } from '../pages/CicloDetailPage.js';
import { ENV } from '../config/env.js';

let driver: WebDriver;
let loginPage: LoginPage;
let layoutPage: LayoutPage;
let obrigacoesPage: ObrigacoesPage;
let ciclosPage: CiclosPage;
let cicloDetailPage: CicloDetailPage;
let db: pg.Client;

/** Registro criado nesta suíte para limpeza ao final (ordem de FK segura). */
type Criado = { clienteId: string; templateId: string; obrigacaoId: string; cicloId: string; itemIds: string[] };
const criados: Criado[] = [];

async function limparCriados(): Promise<void> {
  for (const reg of criados) {
    await db.query('DELETE FROM eventos_auditoria WHERE entidade_id = ANY($1)', [reg.itemIds]);
    await db.query('DELETE FROM excecoes WHERE item_ciclo_id = ANY($1)', [reg.itemIds]);
    await db.query('DELETE FROM itens_ciclo WHERE id = ANY($1)', [reg.itemIds]);
    await db.query('DELETE FROM ciclos WHERE id=$1', [reg.cicloId]);
    await db.query('DELETE FROM obrigacoes WHERE id=$1', [reg.obrigacaoId]);
    await db.query('DELETE FROM itens_template WHERE template_id=$1', [reg.templateId]);
    await db.query('DELETE FROM checklist_templates WHERE id=$1', [reg.templateId]);
    await db.query('DELETE FROM clientes WHERE id=$1', [reg.clienteId]);
  }
}

function apiFetch(path: string, method: string, body: unknown): Promise<{ status: number; body: { id: string } }> {
  const bodyStr = body === undefined ? 'undefined' : JSON.stringify(body);
  return driver.executeScript<{ status: number; body: { id: string } }>(
    `return fetch(arguments[0], {
        method: arguments[1],
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: arguments[2],
      }).then((r) => r.json().then((j) => ({ status: r.status, body: j })).catch(() => ({ status: r.status, body: {} })));`,
    `${ENV.API_URL}${path}`,
    method,
    bodyStr,
  );
}

/** Cria cliente e template por API; obrigação é criada PELA UI (jornada real). */
async function semearSetup(sufixo: number): Promise<{
  clienteNome: string;
  clienteId: string;
  templateNome: string;
  templateId: string;
}> {
  const clienteNome = `E2E Jornada Cliente ${sufixo}`;
  const templateNome = `E2E Jornada Template ${sufixo}`;

  const cliente = await apiFetch('/clientes', 'POST', { nome: clienteNome, email: `jornada-${sufixo}@local.test` });
  expect(cliente.status).toBe(201);

  const template = await apiFetch('/checklist-templates', 'POST', {
    nome: templateNome,
    itens: [
      { descricao: `Doc Jornada ${sufixo}`, tipo_esperado: 'documento' },
      { descricao: `Dado Jornada ${sufixo}`, tipo_esperado: 'informacao' },
    ],
  });
  expect(template.status).toBe(201);

  return { clienteNome, clienteId: cliente.body.id, templateNome, templateId: template.body.id };
}

beforeAll(async () => {
  driver = await createDriver();
  loginPage = new LoginPage(driver);
  layoutPage = new LayoutPage(driver);
  obrigacoesPage = new ObrigacoesPage(driver);
  ciclosPage = new CiclosPage(driver);
  cicloDetailPage = new CicloDetailPage(driver);
  db = new pg.Client({ connectionString: process.env.DATABASE_URL ?? 'postgres://servium:servium_dev@localhost:5432/servium' });
  await db.connect();
});

afterAll(async () => {
  try {
    await limparCriados();
  } finally {
    await db?.end();
    await driver?.quit();
  }
});

beforeEach(async () => {
  await driver.manage().deleteAllCookies();
});

describe('FASE 7 · Jornada completa do operacional (UI: obrigação → ciclo → decisão → painel)', () => {
  it('obrigação criada pela UI com checklist, ciclo ativado e item resolvido refletem no Painel', async () => {
    const sufixo = Date.now();
    const descricao = `E2E Jornada Obrigacao ${sufixo}`;
    const item1 = `Doc Jornada ${sufixo}`;

    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();

    const { clienteNome, clienteId, templateNome, templateId } = await semearSetup(sufixo);

    // 1. Obrigação criada PELA UI (com seleção de checklist).
    await layoutPage.clickNav('Obrigacoes');
    await obrigacoesPage.open();
    await obrigacoesPage.clickNovaObrigacao();
    await obrigacoesPage.waitForClienteOption(clienteNome);
    await obrigacoesPage.selectCliente(clienteNome);
    await obrigacoesPage.selectTemplate(templateNome);
    await obrigacoesPage.fillDescricao(descricao);
    await obrigacoesPage.submit();
    await obrigacoesPage.waitingRow(descricao);

    // Localiza o id da obrigação recém-criada para alimentar o ciclo.
    const { rows: obs } = await db.query<{ id: string }>(
      'SELECT id FROM obrigacoes WHERE tenant_id = (SELECT id FROM tenants WHERE slug=$1) AND descricao=$2',
      [ENV.SLUG, descricao],
    );
    expect(obs).toHaveLength(1);
    const obrigacaoId = obs[0].id;

    // 2. Ciclo ativado PELA UI (ação na linha da obrigação).
    await obrigacoesPage.activateCicloOnRow(descricao);
    const sucesso = await obrigacoesPage.getSuccessMessage();
    expect(sucesso).toContain('Ciclo ativado');
    await takeScreenshot(driver, `jornada-ciclo-ativado-${sufixo}`);

    // 3. Materializa itens e marca 1 como recebido (worker fora do ar; espelha handler real).
    const { rows: cicloRows } = await db.query<{ id: string }>(
      'SELECT id FROM ciclos WHERE obrigacao_id=$1 AND estado=$2',
      [obrigacaoId, 'aberto'],
    );
    expect(cicloRows).toHaveLength(1);
    const cicloId = cicloRows[0].id;

    const { rowCount, rows: itemRows } = await db.query<{ id: string }>(
      `INSERT INTO itens_ciclo (tenant_id, ciclo_id, item_template_id)
       SELECT c.tenant_id, c.id, t.id
         FROM ciclos c
         JOIN itens_template t ON t.template_id=$2
        WHERE c.id=$1
        RETURNING id`,
      [cicloId, templateId],
    );
    expect(rowCount).toBe(2);
    await db.query(
      "UPDATE itens_ciclo SET estado='recebido', atualizado_em=now() WHERE ciclo_id=$1 AND estado='pendente'",
      [cicloId],
    );

    criados.push({ clienteId, templateId, obrigacaoId, cicloId, itemIds: itemRows.map((r) => r.id) });

    // 4. Decisão B-1 PELA UI: recebido → resolvido.
    await layoutPage.clickNav('Ciclos');
    await ciclosPage.open();
    expect(await ciclosPage.hasCiclo(clienteNome, descricao)).toBe(true);
    await cicloDetailPage.openByRow(clienteNome, descricao);
    expect(await cicloDetailPage.itemBadge(item1, 'recebido')).toBe('recebido');
    await cicloDetailPage.validarConcluir();
    expect(await cicloDetailPage.itemBadge(item1, 'resolvido')).toBe('resolvido');
    expect(await cicloDetailPage.hasError()).toBe(false);
    await takeScreenshot(driver, `jornada-item-resolvido-${sufixo}`);

    // 5. Painel reflete o resolvido (consistência UI ↔ motor).
    await layoutPage.clickNav('Painel');
    const cardEl = await driver.wait(
      async () => {
        try {
          const el = await driver.findElement(
            By.xpath('//div[contains(@class,"card")][.//div[normalize-space(.)="Concluidos"]]//div[contains(@class,"card-value")]'),
          );
          const texto = await el.getText();
          return /^\d+$/.test(texto.trim()) ? el : undefined;
        } catch {
          return undefined;
        }
      },
      8000,
      'card Concluidos do Painel deve exibir um número',
    );
    const concluidos = parseInt((await cardEl.getText()).trim(), 10);
    expect(concluidos).toBeGreaterThanOrEqual(1);
    await takeScreenshot(driver, `jornada-painel-${sufixo}`);
  }, 180_000);
});