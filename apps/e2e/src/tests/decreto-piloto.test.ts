import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { WebDriver } from 'selenium-webdriver';

import { createDriver } from '../support/driver.js';
import { takeScreenshot } from '../support/evidence.js';
import { LoginPage } from '../pages/LoginPage.js';
import { LayoutPage } from '../pages/LayoutPage.js';
import { ENV } from '../config/env.js';

const OPERADOR_EMAIL = process.env.E2E_OPERATOR_EMAIL ?? 'oper@dev.local';
const OPERADOR_SENHA = process.env.E2E_OPERATOR_PASSWORD ?? 'oper-dev-corp-2026';

let driver: WebDriver;
let loginPage: LoginPage;
let layoutPage: LayoutPage;

function apiStatus(path: string): Promise<number> {
  return driver.executeScript<number>(
    `return fetch(arguments[0], { credentials: 'include' }).then((r) => r.status).catch(() => -1);`,
    `${ENV.API_URL}${path}`,
  );
}

async function apiJson(path: string): Promise<{ status: number; body: unknown }> {
  return driver.executeScript<{ status: number; body: unknown }>(
    `return fetch(arguments[0], { credentials: 'include' })
        .then((r) => r.json().then((j) => ({ status: r.status, body: j })))
        .catch(() => ({ status: -1, body: null }));`,
    `${ENV.API_URL}${path}`,
  );
}

beforeAll(async () => {
  driver = await createDriver();
  loginPage = new LoginPage(driver);
  layoutPage = new LayoutPage(driver);
});

afterAll(async () => {
  await driver?.quit();
});

describe('FASE 7 · Decreto do piloto — pré-flight da superfície operacional', () => {
  it('API emite headers de segurança (nosniff/deny/csp) e /health ok', async () => {
    const res = await fetch(`${ENV.API_URL}/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('superfície anônima negada: /auth/me 401 e /metrics/negocio 401', async () => {
    await driver.get(`${ENV.WEB_URL}/login`);
    await driver.manage().deleteAllCookies();
    expect(await apiStatus('/auth/me')).toBe(401);
    expect(await apiStatus('/metrics/negocio')).toBe(401);
  });

  it('RBAC: métricas de negócio NÃO exibem para operador (403)', async () => {
    await loginPage.loginAsAuthed(ENV.SLUG, OPERADOR_EMAIL, OPERADOR_SENHA);
    await layoutPage.waitForAuthenticated();
    expect(await apiStatus('/metrics/negocio')).toBe(403);
  });

  it('RBAC: admin lê /metrics/negocio (200) com as métricas mínimas do piloto', async () => {
    await driver.manage().deleteAllCookies();
    await loginPage.loginAsAuthed(ENV.SLUG, ENV.EMAIL, ENV.PASSWORD);
    await layoutPage.waitForAuthenticated();

    const { status, body } = await apiJson('/metrics/negocio');
    expect(status).toBe(200);
    const b = body as { negocio?: Record<string, unknown>; tecnica?: Record<string, unknown> };
    expect(b.negocio).toHaveProperty('ciclos');
    expect(b.negocio).toHaveProperty('itensResolvidos');
    expect(b.negocio).toHaveProperty('excecoesAbertas');
    expect(b.negocio).toHaveProperty('tempoMedioResolucaoHoras');
    expect(b.tecnica).toHaveProperty('jobsEmRetry');
    await takeScreenshot(driver, 'decreto-piloto-metrics-admin');
  }, 60_000);
});