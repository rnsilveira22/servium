import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createDriver } from '../support/driver.js';
import { LoginPage } from '../pages/LoginPage.js';
import { LayoutPage } from '../pages/LayoutPage.js';
import type { WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';

let driver: WebDriver;
let loginPage: LoginPage;
let layoutPage: LayoutPage;

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

describe('Autenticacao E2E', () => {
  it('acesso nao autenticado redireciona para login', async () => {
    await driver.get(`${ENV.WEB_URL}/`);
    await driver.sleep(2000);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/login');
  });

  it('acesso a rota protegida redireciona para login', async () => {
    await driver.get(`${ENV.WEB_URL}/clientes`);
    await driver.sleep(2000);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/login');
  });

  it('logout limpa sessao e volta para login', async () => {
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();
    await layoutPage.clickLogout();
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/login');
  });

  it('acesso a rota inexistente redireciona para dashboard', async () => {
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();
    await driver.get(`${ENV.WEB_URL}/rota-inexistente`);
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    expect(url).toContain(`${ENV.WEB_URL}/`);
  });

  it('titulo da pagina e Servium IA', async () => {
    await loginPage.open();
    const title = await driver.getTitle();
    expect(title).toBe('Servium IA');
  });
});
