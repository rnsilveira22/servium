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

describe('Login E2E', () => {
  it('exibe a logo oficial no login', async () => {
    await loginPage.open();
    const src = await loginPage.getLogoSrc();
    expect(src).toContain('/brand/servium-logo-login.svg');
    const alt = await loginPage.getLogoAlt();
    expect(alt).toBe('Servium IA');
  });

  it('login com credenciais validas redireciona para o dashboard', async () => {
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    const url = await driver.getCurrentUrl();
    expect(url).toContain(`${ENV.WEB_URL}/`);
    const role = await layoutPage.getRoleLabel();
    expect(role.toUpperCase()).toBe('ADMINISTRADOR');
  });

  it('login com senha invalida exibe mensagem de erro', async () => {
    await loginPage.open();
    await loginPage.loginAs(ENV.SLUG, ENV.EMAIL, 'senha_errada');
    await driver.sleep(1500);
    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
    const stillOnLogin = await loginPage.isDisplayed();
    expect(stillOnLogin).toBe(true);
  });

  it('login com email inexistente exibe mensagem de erro', async () => {
    await loginPage.open();
    await loginPage.loginAs(ENV.SLUG, 'naoexiste@test.com', 'qualquer');
    await driver.sleep(1500);
    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
  });

  it('login com slug invalido exibe mensagem de erro', async () => {
    await loginPage.open();
    await loginPage.loginAs('slug-invalido', ENV.EMAIL, ENV.PASSWORD);
    await driver.sleep(1500);
    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
  });

  it('campos sao obrigatorios (validacao HTML5)', async () => {
    await loginPage.open();
    await loginPage.submit();
    await driver.sleep(500);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/login');
  });
});
