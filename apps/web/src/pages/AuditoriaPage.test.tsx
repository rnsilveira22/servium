// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuditoriaPage } from './AuditoriaPage';

const EVENTO_COBRAR = {
  id: 'ev-1',
  actor_type: 'servico',
  actor_id: '00000000-0000-4000-8000-00000000aa11',
  actor_nome: null,
  entidade: 'item_ciclo',
  entidade_id: '00000000-0000-4000-8000-00000000dd11',
  acao: 'cobrar',
  detalhes: { rodada: 1 },
  criado_em: '2026-09-10T10:00:00.000Z',
  operacional: {
    titulo: 'Solicitação de documentos enviada',
    resultado: 'Enviado com sucesso',
    severidade: 'success',
    excecao: false,
    intervencaoHumana: false,
    agente: 'Estagiária Digital',
    cliente: 'Empresa X',
    atividade: null,
    descricao: 'Solicitação de documentos enviada',
    alteracoes: ['Envio da rodada 1'],
  },
};

const EVENTO_DECIDIR = {
  id: 'ev-2',
  actor_type: 'operador',
  actor_id: '00000000-0000-4000-8000-00000000aa22',
  actor_nome: 'Chefe',
  entidade: 'item_ciclo',
  entidade_id: '00000000-0000-4000-8000-00000000dd22',
  acao: 'decidir',
  detalhes: { desfecho: 'resolvido' },
  criado_em: '2026-09-20T11:00:00.000Z',
  operacional: {
    titulo: 'Pendência decidida',
    resultado: 'Resolvida',
    severidade: 'pendente',
    excecao: false,
    intervencaoHumana: true,
    agente: 'Chefe',
    cliente: null,
    atividade: null,
    descricao: 'Decisão tomada sobre pendência documental. Extraia um cenário de ação e bloqueie novos envios até a resolução.',
    alteracoes: ['Desfecho: resolvido'],
  },
};

const EVENTO_ATIVIDADE = {
  id: 'ev-3',
  actor_type: 'operador',
  actor_id: null,
  actor_nome: 'Chefe',
  entidade: 'atividade',
  entidade_id: '00000000-0000-4000-8000-00000000dd33',
  acao: 'criar',
  detalhes: { nome: 'Solicitação mensal de documentos' },
  criado_em: '2026-09-21T12:00:00.000Z',
  operacional: {
    titulo: 'Atividade criada',
    resultado: 'Registrada',
    severidade: 'info',
    excecao: false,
    intervencaoHumana: true,
    agente: 'Chefe',
    cliente: null,
    atividade: 'Solicitação mensal de documentos',
    descricao: 'Atividade criada',
    alteracoes: [],
  },
};

const ATIVIDADE = { id: 'atv-1', nome: 'Solicitação mensal de documentos' };
const CLIENTE = { id: 'cli-1', nome: 'Empresa X' };

function isoLocal(data: string, fimDoDia: boolean): string {
  const [y, m, d] = data.split('-').map(Number);
  return new Date(y, m - 1, d, fimDoDia ? 23 : 0, fimDoDia ? 59 : 0, fimDoDia ? 59 : 0, fimDoDia ? 999 : 0).toISOString();
}

function resposta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function instalarFetch(
  eventos: unknown[] = [EVENTO_COBRAR, EVENTO_DECIDIR, EVENTO_ATIVIDADE],
  temMais = false,
) {
  const chamadasAuditoria: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname === '/auditoria') {
      chamadasAuditoria.push(url.search ?? '?');
      return resposta({ eventos, tem_mais: temMais });
    }
    if (url.pathname === '/atividades') return resposta([ATIVIDADE]);
    if (url.pathname === '/clientes') return resposta([CLIENTE]);
    if (url.pathname === '/metrics') return resposta({ status: 'ok', uptime_s: 42 });
    if (url.pathname === '/health') return resposta({ status: 'ok' });
    return resposta({});
  });
  return { chamadasAuditoria };
}

describe('AuditoriaPage — FR-028 Auditoria Operacional', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renderiza eventos de auditoria em linguagem operacional', async () => {
    instalarFetch();
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText('Solicitação de documentos enviada'));
    expect(screen.getAllByText('Estagiária Digital').length).toBeGreaterThan(0);
    expect(screen.getByText('Enviado com sucesso')).toBeDefined();
    expect(screen.getAllByText(/Empresa X/).length).toBeGreaterThan(0);
    expect(screen.getByText('Envio da rodada 1')).toBeDefined();
  });

  it('dado ausente não é inventado: evento de atividade sem cliente', async () => {
    instalarFetch([EVENTO_ATIVIDADE]);
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText('Atividade criada'));
    expect(screen.getAllByText(/Solicitação mensal de documentos/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Cliente:')).toBeNull();
  });

  it('aplica filtro por tipo e por agente ao clicar em Aplicar', async () => {
    const { chamadasAuditoria } = instalarFetch();
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText('Solicitação de documentos enviada'));

    fireEvent.change(screen.getByLabelText('Tipo de evento'), { target: { value: 'item_ciclo' } });
    fireEvent.change(screen.getByLabelText('Agente'), { target: { value: 'servico' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => expect(chamadasAuditoria.length).toBeGreaterThanOrEqual(2));
    const filtrada = chamadasAuditoria[chamadasAuditoria.length - 1];
    expect(filtrada).toContain('entidade=item_ciclo');
    expect(filtrada).toContain('actor_type=servico');
  });

  it('validação de período é enviada ao backend (sem inventar resultado)', async () => {
    const { chamadasAuditoria } = instalarFetch();
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText('Solicitação de documentos enviada'));

    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-09-15' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-09-21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => expect(chamadasAuditoria.length).toBeGreaterThanOrEqual(2));
    const filtrada = chamadasAuditoria[chamadasAuditoria.length - 1];
    expect(filtrada).toContain(`desde=${encodeURIComponent(isoLocal('2026-09-15', false))}`);
    expect(filtrada).toContain(`ate=${encodeURIComponent(isoLocal('2026-09-21', true))}`);
  });

  it('mostra estado vazio quando não há eventos no período', async () => {
    instalarFetch([], false);
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText('Nenhuma atividade registrada no período selecionado.'));
  });

  it('mostra erro sem vazar stack trace', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(resposta({ message: 'Erro interno de servidor' }, 500));
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText(/Não foi possível carregar a auditoria/));
    expect(screen.queryByText(/at .*\.tsx:\d+/)).toBeNull();
    expect(screen.queryByText(/Stack/)).toBeNull();
  });

  it('expõe detalhes técnicos sob demanda e suporta paginação com cursor', async () => {
    const { chamadasAuditoria } = instalarFetch([EVENTO_COBRAR], true);
    render(
      <MemoryRouter>
        <AuditoriaPage />
      </MemoryRouter>,
    );

    const resumo = await screen.findByText('Detalhes técnicos');
    fireEvent.click(resumo);
    await waitFor(() => expect(screen.queryByText(/item_ciclo · cobrar/)).not.toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }));
    await waitFor(() => expect(chamadasAuditoria.length).toBeGreaterThanOrEqual(2));
    const paginada = chamadasAuditoria[chamadasAuditoria.length - 1];
    expect(paginada).toContain('antes_de=');
    expect(paginada).toContain('antes_id=ev-1');
  }, 20_000);
});