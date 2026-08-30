import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createDriver } from '../support/driver.js';
import { takeScreenshot } from '../support/evidence.js';
import { LoginPage } from '../pages/LoginPage.js';
import { LayoutPage } from '../pages/LayoutPage.js';
import { ObrigacoesPage } from '../pages/ObrigacoesPage.js';
import { CiclosPage } from '../pages/CiclosPage.js';
import type { WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';

let driver: WebDriver;
let loginPage: LoginPage;
let layoutPage: LayoutPage;
let obrigacoesPage: ObrigacoesPage;
let ciclosPage: CiclosPage;

function apiFetch(path: string, method: string, body: unknown): Promise<number> {
  const bodyStr = body === undefined ? 'undefined' : JSON.stringify(body);
  return driver.executeScript<number>(
    `return fetch(arguments[0], {
        method: arguments[1],
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: arguments[2],
      }).then((r) => r.status).catch(() => -1);`,
    `${ENV.API_URL}${path}`,
    method,
    bodyStr,
  );
}

beforeAll(async () => {
  driver = await createDriver();
  loginPage = new LoginPage(driver);
  layoutPage = new LayoutPage(driver);
  obrigacoesPage = new ObrigacoesPage(driver);
  ciclosPage = new CiclosPage(driver);
});

afterAll(async () => {
  await driver?.quit();
});

beforeEach(async () => {
  await driver.manage().deleteAllCookies();
});

describe('Local Acceptance — ativação de ciclo pela UI', () => {
  it('operador cadastra/ativa ciclo a partir de obrigação legível (sem UUID manual)', async () => {
    const sufixo = Date.now();
    const clienteNome = `E2E Cliente ${sufixo}`;
    const descricao = `E2E Obrigacao ${sufixo}`;

    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();

    const clienteStatus = await apiFetch('/clientes', 'POST', { nome: clienteNome });
    expect(clienteStatus).toBe(201);

    await layoutPage.clickNav('Obrigacoes');
    await obrigacoesPage.clickNovaObrigacao();
    await obrigacoesPage.waitForClienteOption(clienteNome);
    await obrigacoesPage.selectCliente(clienteNome);
    await obrigacoesPage.fillDescricao(descricao);
    await obrigacoesPage.submit();
    await obrigacoesPage.waitingRow(descricao);

    await obrigacoesPage.activateCicloOnRow(descricao);
    const sucesso = await obrigacoesPage.getSuccessMessage();
    expect(sucesso).toContain('Ciclo ativado');
    expect(sucesso).toContain(descricao);
    await takeScreenshot(driver, `ciclo-ativado-obrigacao-${sufixo}`);

    await layoutPage.clickNav('Ciclos');
    await ciclosPage.open();
    expect(await ciclosPage.hasCiclo(clienteNome, descricao)).toBe(true);
    await takeScreenshot(driver, `ciclo-listado-${sufixo}`);
  }, 60_000);
});