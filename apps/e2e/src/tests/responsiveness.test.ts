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

async function setViewport(width: number, height: number): Promise<void> {
  await driver.manage().window().setRect({ width, height });
  await driver.sleep(300);
}

async function hasHorizontalOverflow(): Promise<boolean> {
  return driver.executeScript(
    'return document.documentElement.scrollWidth - document.documentElement.clientWidth > 1',
  );
}

async function sidebarLeft(): Promise<number> {
  return driver.executeScript(
    "const el = document.querySelector('.sidebar'); return el ? el.getBoundingClientRect().left : NaN;",
  );
}

describe('Responsividade basica E2E', () => {
  it('login em viewport mobile renderiza sem overflow horizontal', async () => {
    await setViewport(390, 844);
    await loginPage.open();
    expect(await loginPage.isDisplayed()).toBe(true);
    expect(await hasHorizontalOverflow()).toBe(false);
  });

  it('dashboard em viewport mobile mantem layout sem overflow', async () => {
    await setViewport(390, 844);
    await loginPage.open();
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();
    expect(await layoutPage.isSidebarVisible()).toBe(true);
    expect(await hasHorizontalOverflow()).toBe(false);
  });

  it('sidebar fica off-canvas (fora da tela) no mobile', async () => {
    await setViewport(390, 844);
    await loginPage.open();
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();
    const left = await sidebarLeft();
    expect(left).toBeLessThan(0);
  });

  it('sidebar fica visivel no desktop', async () => {
    await setViewport(1280, 720);
    await loginPage.open();
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();
    const left = await sidebarLeft();
    expect(left).toBeGreaterThanOrEqual(0);
  });
});