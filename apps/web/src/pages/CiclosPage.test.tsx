// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CiclosPage } from './CiclosPage';

interface Chamada {
  url: string;
  method?: string;
  body?: unknown;
}

const OBRIGACAO = {
  id: 'obl-1',
  cliente_id: 'cli-1',
  descricao: 'Entrega de CTPS',
  prazo: null,
  criado_em: '2026-08-01T00:00:00Z',
};

const CLIENTE = {
  id: 'cli-1',
  nome: 'Acme SA',
  identificacao: null,
  email: null,
  criado_em: '2026-08-01T00:00:00Z',
};

const CICLO_ATIVO = {
  id: 'ciclo-novo',
  estado: 'aberto',
  criado_em: '2026-08-30T00:00:00Z',
  obrigacao: 'Entrega de CTPS',
  cliente: 'Acme SA',
  itens: 0,
  resolvidos: 0,
  excecoes: 0,
};

function instalarFetch(
  rotas: { ciclos: unknown[] },
  respostas: Record<string, { status: number; body: unknown }> = {},
): Chamada[] {
  const chamadas: Chamada[] = [];
  let getCiclos = 0;
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
      if (method === 'GET' && url.endsWith('/obrigacoes')) return resposta([OBRIGACAO]);
      if (method === 'GET' && url.endsWith('/clientes')) return resposta([CLIENTE]);
      if (method === 'GET' && url.endsWith('/ciclos')) {
        getCiclos++;
        if (getCiclos >= 2) return resposta(rotas.ciclos);
        return resposta([]);
      }
      if (method === 'POST' && url.endsWith('/ciclos')) {
        const r = respostas['POST /ciclos'] ?? { status: 201, body: CICLO_ATIVO };
        return resposta(r.body, r.status);
      }
      return resposta({});
    },
  );
  return chamadas;
}

describe('CiclosPage — ativação por obrigação legível', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('operador vê obrigações cadastradas e ativa um ciclo sem digitar UUID (ID enviado internamente)', async () => {
    const chamadas = instalarFetch({ ciclos: [CICLO_ATIVO] });
    render(
      <MemoryRouter>
        <CiclosPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '+ Ativar Ciclo' }));
    await waitFor(() => screen.getByText('Entrega de CTPS — Acme SA'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'obl-1' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Ativar ciclo' }));

    await waitFor(() =>
      expect(screen.getByText('Ciclo ativado para "Entrega de CTPS".')).toBeDefined(),
    );
    await waitFor(() => expect(screen.getByText('Acme SA')).toBeDefined());

    const post = chamadas.find((c) => c.method === 'POST' && c.url.endsWith('/ciclos'));
    expect(post).toBeDefined();
    expect(JSON.parse(String(post!.body))).toEqual({ obrigacao_id: 'obl-1' });
  }, 15_000);

it('mensagem amigável ao tentar ativar sem selecionar uma obrigação', async () => {
    const chamadas: Chamada[] = [];
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? 'GET').toUpperCase();
        chamadas.push({ url, method, body: init?.body });
        const resposta = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          });
        if (method === 'GET' && url.endsWith('/obrigacoes')) return resposta([OBRIGACAO]);
        if (method === 'GET' && url.endsWith('/clientes')) return resposta([CLIENTE]);
        if (method === 'GET' && url.endsWith('/ciclos')) return resposta([]);
        return resposta({});
      },
    );

    render(
      <MemoryRouter>
        <CiclosPage />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: '+ Ativar Ciclo' }));
    await waitFor(() => screen.getByText('Entrega de CTPS — Acme SA'));
    fireEvent.click(await screen.findByRole('button', { name: 'Ativar ciclo' }));

    await waitFor(() =>
      expect(screen.getByText('Selecione uma obrigação para ativar o ciclo.')).toBeDefined(),
    );
    expect(chamadas.some((c) => c.method === 'POST')).toBe(false);
    spy.mockRestore();
  }, 15_000);

  it('mensagem amigável quando não há obrigação cadastrada', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      return new Response(
        JSON.stringify(url.endsWith('/ciclos') ? [] : []),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    render(
      <MemoryRouter>
        <CiclosPage />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText('+ Ativar Ciclo'));
    fireEvent.click(screen.getByRole('button', { name: '+ Ativar Ciclo' }));

    expect(
      await screen.findByText('Nenhuma obrigação disponível para ativar um ciclo.'),
    ).toBeDefined();
  }, 15_000);

  it('erro de API é tratado e exibido para o usuário', async () => {
    instalarFetch(
      { ciclos: [] },
      { 'POST /ciclos': { status: 400, body: { message: 'obrigacao não encontrada neste tenant' } } },
    );
    render(
      <MemoryRouter>
        <CiclosPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '+ Ativar Ciclo' }));
    await waitFor(() => screen.getByText('Entrega de CTPS — Acme SA'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'obl-1' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Ativar ciclo' }));

    await waitFor(() =>
      expect(screen.getByText('obrigacao não encontrada neste tenant')).toBeDefined(),
    );
  }, 15_000);
});