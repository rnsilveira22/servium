import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';

interface Sessao {
  operadorId: string;
  tenantId: string;
  papel: 'admin' | 'operador';
}

interface AuthCtx {
  sessao: Sessao | null;
  loading: boolean;
  login: (slug: string, email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Sessao>('/auth/me')
      .then(setSessao)
      .catch(() => setSessao(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (slug: string, email: string, senha: string) => {
    await api('/auth/login', { method: 'POST', body: { slug, email, senha } });
    const s = await api<Sessao>('/auth/me');
    setSessao(s);
  };

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setSessao(null);
  };

  return <Ctx.Provider value={{ sessao, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
