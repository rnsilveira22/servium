// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ObrigacoesPage } from './ObrigacoesPage';

const OBRIGACOES = [
  { id: 'obl-1', cliente_id: 'cli-1', descricao: 'Entrega de CTPS', prazo: null, criado_em: '2026-08-01T00:00:00Z' },
  { id: 'obl-2', cliente_id: 'cli-2', descricao: 'Apostilamento FNDE', prazo: '2026-12-15', criado_em: '2026-08-02T00:00:00Z' },
];

const CLIENTES = [
  { id: 'cli-1', nome: 'Acme SA', identificacao: null, email: null, criado_em: '2026-08-01T00:00:00Z' },
  { id: 'cli-2', nome: 'Global Ltda', identificacao: null, email: null, criado_em: '2026-08-02T00:00:00Z' },
];

interface Chamada {
  url: string;
  method?: string;
  body?: unknown;
}

function instalarFetch(respostas: Record<string, { status: number; body: unknown }> = {}): Chamada[] {
  const chamadas: Chamada[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      chamadas.push({ url, method, body: init?.body });
      const resposta = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      if (method === 'GET' && url.endsWith('/obrigacoes')) return resposta(OBRIGACOES);
      if (method === 'GET' && url.endsWith('/clientes')) return resposta(CLIENTES);
      if (method === 'GET' && url.endsWith('/checklist-templates')) return resposta([]);
      if (method === 'POST' && url.endsWith('/ciclos')) {
        const r = respostas['POST /ciclos'] ?? { status: 201, body: { id: 'c-9', estado: 'aberto' } };
        return resposta(r.body, r.status);
      }
      return resposta({});
    },
  );
  return chamadas;
}

describe('ObrigacoesPage — ativar ciclo pela linha da obrigação', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lista obrigações e ativa um ciclo por linha sem exigir UUID manual', async () => {
    const chamadas = instalarFetch();
    render(<ObrigacoesPage />);

    await waitFor(() => screen.getByText('Entrega de CTPS'));
    expect(screen.getByText('Acme SA')).toBeDefined();
    expect(screen.getByText('Apostilamento FNDE')).toBeDefined();
    expect(screen.getByText('Global Ltda')).toBeDefined();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Ativar ciclo' }))[0]!);

    await waitFor(() => expect(screen.getByText('Ciclo ativado para "Entrega de CTPS".')).toBeDefined());

    const post = chamadas.find((c) => c.method === 'POST' && c.url.endsWith('/ciclos'));
    expect(post).toBeDefined();
    expect(JSON.parse(String(post!.body))).toEqual({ obrigacao_id: 'obl-1' });
  }, 15_000);

  it('erro de API é exibido de forma legível (obrigação não encontrada)', async () => {
    instalarFetch({ 'POST /ciclos': { status: 400, body: { message: 'obrigacao não encontrada neste tenant' } } });
    render(<ObrigacoesPage />);

    await waitFor(() => screen.getByText('Entrega de CTPS'));
    fireEvent.click((await screen.findAllByRole('button', { name: 'Ativar ciclo' }))[0]!);

    await waitFor(() =>
      expect(screen.getByText('obrigacao não encontrada neste tenant')).toBeDefined(),
    );
  }, 15_000);
});