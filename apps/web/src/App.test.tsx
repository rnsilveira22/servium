import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LoginPage } from './pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

describe('Brand identity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login renders official logo', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 401, headers: { 'Content-Type': 'application/json' } }),
    );
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(html).toContain('/brand/servium-logo-login.svg');
    expect(html).toContain('alt="Servium IA"');
  });

  it('login has correct logo class', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 401, headers: { 'Content-Type': 'application/json' } }),
    );
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(html).toContain('servium-logo-login');
  });
});
