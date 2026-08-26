import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LoginPage } from './pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

// Mock fetch for auth context
const originalFetch = global.fetch;

describe('Brand identity', () => {
  it('login renders official logo', () => {
    global.fetch = (() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })) as typeof fetch;
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(html).toContain('/brand/servium-logo-login.svg');
    expect(html).toContain('alt="Servium IA"');
    global.fetch = originalFetch;
  });

  it('login has correct logo class', () => {
    global.fetch = (() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })) as typeof fetch;
    const html = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(html).toContain('servium-logo-login');
    global.fetch = originalFetch;
  });
});
