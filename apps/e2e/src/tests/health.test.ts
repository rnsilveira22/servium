import { describe, it, expect } from 'vitest';
import { ENV } from '../config/env.js';

describe('Comunicacao e saude (FE/API)', () => {
  it('API responde /health com banco disponivel', async () => {
    const res = await fetch(`${ENV.API_URL}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status?: string; db?: boolean };
    expect(body.status).toBe('ok');
    expect(body.db).toBe(true);
  });

  it('rota /auth/me sem sessao retorna 401', async () => {
    const res = await fetch(`${ENV.API_URL}/auth/me`);
    expect(res.status).toBe(401);
  });

  it('WEB_URL responde com pagina (SPA index)', async () => {
    const res = await fetch(`${ENV.WEB_URL}/login`, { redirect: 'manual' });
    expect(res.status).toBe(200);
  });
});