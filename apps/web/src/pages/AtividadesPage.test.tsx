// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AtividadesPage } from './AtividadesPage';

const AGENTE = {
  id: 'ag-1',
  slug: 'estagiaria-digital',
  nome: 'Estagiária Digital',
  descricao: 'Assistente Digital de Pendências Documentais',
  capacidade: 'solicitar, acompanhar, registrar, escalar',
  ativo: true,
  criado_em: '2026-09-23T00:00:00Z',
};

const CHECKLIST = {
  id: 'ck-1',
  nome: 'Fechamento Mensal',
  canal: 'email',
  email_template_id: null,
  email_template_nome: null,
  itens: [{ id: 'i1', descricao: 'Contrato social', tipo_esperado: 'documento', tamanho_max_bytes: null, ordem: 1 }],
};

const ATIVIDADE = {
  id: 'atv-1',
  nome: 'Solicitação mensal de documentos para fechamento',
  descricao: null,
  periodicidade: 'mensal',
  escopo: 'todos_ativos',
  agente_id: 'ag-1',
  agente_nome: 'Estagiária Digital',
  agente_slug: 'estagiaria-digital',
  canal: 'email',
  prazo_dias: 10,
  checklist_template_id: null,
  checklist_template_nome: null,
  comportamento: { solicitar: true, acompanhar: true, cobrar: true, registrar: true, identificar: true, escalar: true },
  status: 'ativa',
  criado_em: '2026-09-23T00:00:00Z',
  atualizado_em: '2026-09-23T00:00:00Z',
};

function instalarFetch(atividades: unknown[] = [ATIVIDADE]) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      const resposta = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
      if (method === 'GET' && url.endsWith('/atividades')) return resposta(atividades);
      if (method === 'GET' && url.endsWith('/agentes')) return resposta([AGENTE]);
      if (method === 'GET' && url.endsWith('/checklist-templates')) return resposta([CHECKLIST]);
      if (method === 'POST' && url.endsWith('/atividades')) return resposta(ATIVIDADE, 201);
      if (method === 'POST' && /\/atividades\/.+\/(des)?ativar$/.test(url)) return resposta(ATIVIDADE, 201);
      if (method === 'PUT' && /\/atividades\/.+/.test(url)) return resposta(ATIVIDADE);
      return resposta({});
    },
  );
}

describe('AtividadesPage — FR-020 + FR-021', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lista atividade operacional com o nome do agente executor', async () => {
    instalarFetch();
    render(
      <MemoryRouter>
        <AtividadesPage />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText('Solicitação mensal de documentos para fechamento'));
    expect(screen.getByText('Estagiária Digital')).toBeDefined();
    expect(screen.getByText('mensal')).toBeDefined();
    expect(screen.getByText('ativa')).toBeDefined();
  });

  it('cria atividade selecionando agente executor e envia agente_id no POST', async () => {
    instalarFetch([]);
    render(
      <MemoryRouter>
        <AtividadesPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '+ Nova Atividade' }));
    await waitFor(() => screen.getByLabelText(/Agente executor/));

    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Solicitação mensal de documentos para fechamento' } });
    fireEvent.change(screen.getByLabelText(/Periodicidade/), { target: { value: 'mensal' } });
    fireEvent.change(screen.getByLabelText(/Agente executor/), { target: { value: 'ag-1' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.getByText('Atividade operacional criada.')).toBeDefined());
    const chamada = vi.mocked(fetch).mock.calls.find(([, init]) =>
      init?.method === 'POST' && String(init.body).includes('agente_id'));
    expect(chamada).toBeDefined();
    expect(JSON.parse(String(chamada![1]!.body))).toMatchObject({
      nome: 'Solicitação mensal de documentos para fechamento',
      agente_id: 'ag-1',
      periodicidade: 'mensal',
      escopo: 'todos_ativos',
    });
  }, 15_000);

  it('desativa e reativa atividade pelo botão alternar', async () => {
    instalarFetch();
    render(
      <MemoryRouter>
        <AtividadesPage />
      </MemoryRouter>,
    );

    const desativar = await screen.findByRole('button', { name: 'Desativar' });
    fireEvent.click(desativar);
    await waitFor(() => expect(screen.getByText('Atividade desativada.')).toBeDefined());
    const chamada = vi.mocked(fetch).mock.calls.find(([input, init]) =>
      init?.method === 'POST' && String(input).includes('/desativar'));
    expect(chamada).toBeDefined();
  }, 15_000);
});