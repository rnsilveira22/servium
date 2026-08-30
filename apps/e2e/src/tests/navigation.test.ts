import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createDriver } from '../support/driver.js';
import { LoginPage } from '../pages/LoginPage.js';
import { LayoutPage } from '../pages/LayoutPage.js';
import type { WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';

let driver: WebDriver;
let loginPage: LoginPage;
let layoutPage: LayoutPage;

async function loginAsAdmin(): Promise<void> {
  await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
  await layoutPage.waitForAuthenticated();
}

beforeAll(async () => {
  driver = await createDriver();
  loginPage = new LoginPage(driver);
  layoutPage = new LayoutPage(driver);
});

afterAll(async () => {
  await driver?.quit();
});

beforeEach(async () => {
  await driver.manage().deleteAllCookies();
});

describe('Navegacao E2E', () => {
  it('sidebar exibe todos os links de navegacao', async () => {
    await loginAsAdmin();
    const links = await layoutPage.getNavLinks();
    expect(links).toContain('Painel');
    expect(links).toContain('Clientes');
    expect(links).toContain('Obrigacoes');
    expect(links).toContain('Ciclos');
    expect(links).toContain('Excecoes');
    expect(links).toContain('Auditoria');
  });

  it('navega para Clientes', async () => {
    await loginAsAdmin();
    await layoutPage.clickNav('Clientes');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/clientes');
    const active = await layoutPage.getActiveNavLink();
    expect(active).toBe('Clientes');
  });

  it('navega para Obrigacoes', async () => {
    await loginAsAdmin();
    await layoutPage.clickNav('Obrigacoes');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/obrigacoes');
  });

  it('navega para Ciclos', async () => {
    await loginAsAdmin();
    await layoutPage.clickNav('Ciclos');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/ciclos');
  });

  it('navega para Excecoes', async () => {
    await loginAsAdmin();
    await layoutPage.clickNav('Excecoes');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/excecoes');
  });

  it('navega para Auditoria', async () => {
    await loginAsAdmin();
    await layoutPage.clickNav('Auditoria');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/auditoria');
  });

  it('volta para Painel (dashboard)', async () => {
    await loginAsAdmin();
    await layoutPage.clickNav('Clientes');
    await layoutPage.clickNav('Painel');
    const url = await driver.getCurrentUrl();
    expect(url).toContain(`${ENV.WEB_URL}/`);
  });
});
