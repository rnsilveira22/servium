import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface CicloDetalhe {
  id: string;
  estado: string;
  criado_em: string;
  encerrado_em: string | null;
  obrigacao_id: string;
  obrigacao: string;
  cliente_id: string;
  cliente: string;
  itens: {
    id: string;
    estado: string;
    tentativas: number;
    descricao: string;
    atualizado_em: string;
    excecao: {
      id: string;
      tipo: string;
      motivo: string;
      contexto: unknown;
      criado_em: string;
    } | null;
  }[];
  comunicacoes: {
    id: string;
    item_ciclo_id: string | null;
    direcao: string;
    canal: string;
    destinatario: string | null;
    remetente: string | null;
    template: string | null;
    status: string;
    criado_em: string;
  }[];
}

interface Excecao {
  id: string;
  tipo: string;
  motivo: string;
  contexto: string;
  criado_em: string;
  item_id: string;
  tentativas: number;
  item_descricao: string;
  cliente_nome: string;
}

function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

function mensagemErro(err: unknown): string {
  const status = (err as { status?: number } | undefined)?.status;
  if (status === 404) return 'Ciclo não encontrado.';
  if (status === 403) return 'Você não tem permissão para ver este ciclo.';
  return 'Não foi possível carregar o ciclo. Tente novamente.';
}

export function CicloDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useAuth();
  const isAdmin = sessao?.papel === 'admin';

  const [ciclo, setCiclo] = useState<CicloDetalhe | null>(null);
  const [excecoes, setExcecoes] = useState<Excecao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ tipo: 'resolvido' | 'cancelado'; itemId: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCiclo(null);
    setExcecoes([]);
    setErro('');
    Promise.all([
      api<CicloDetalhe>(`/ciclos/${id}`),
      api<Excecao[]>(`/ciclos/${id}/excecoes`).catch(() => [] as Excecao[]),
    ])
      .then(([c, e]) => { setCiclo(c); setExcecoes(e); })
      .catch((err) => {
        console.error('Falha ao carregar o detalhe do ciclo', id, err);
        setErro(mensagemErro(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecidir = async (itemId: string, desfecho: 'resolvido' | 'cancelado') => {
    setErro('');
    setActionLoading(itemId);
    try {
      await api(`/ciclos/itens/${itemId}/decidir`, { method: 'POST', body: { desfecho } });
      setExcecoes((prev) => prev.filter((e) => e.item_id !== itemId));
      setCiclo((prev) => {
        if (!prev) return prev;
        return { ...prev, itens: prev.itens.filter((i) => i.id !== itemId) };
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao processar acao');
    } finally {
      setActionLoading('');
      setConfirmAction(null);
    }
  };

  const handleReenviar = async (itemId: string) => {
    setErro('');
    setActionLoading(itemId);
    try {
      await api(`/ciclos/itens/${itemId}/reenviar`, { method: 'POST' });
      setExcecoes((prev) => prev.filter((e) => e.item_id !== itemId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao reenviar');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <div className="page-loading">Carregando...</div>;

  if (erro && !ciclo) return <div className="container"><div className="alert alert-error">{erro}</div><Link to="/ciclos" className="link">&larr; Ciclos</Link></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/ciclos" className="link">&larr; Ciclos</Link>
          <h1>{ciclo ? `Ciclo de ${ciclo.cliente} — ${ciclo.obrigacao}` : 'Ciclo'}</h1>
        </div>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {ciclo && (
        <>
          <section className="section">
            <h2>Informacoes</h2>
            <table className="table">
              <tbody>
                <tr>
                  <td className="text-muted">Cliente</td>
                  <td>{ciclo.cliente}</td>
                </tr>
                <tr>
                  <td className="text-muted">Obrigacao</td>
                  <td>{ciclo.obrigacao}</td>
                </tr>
                <tr>
                  <td className="text-muted">Status</td>
                  <td><span className={`badge badge-${ciclo.estado}`}>{ciclo.estado}</span></td>
                </tr>
                <tr>
                  <td className="text-muted">Ativado em</td>
                  <td>{formatarData(ciclo.criado_em)}</td>
                </tr>
                {ciclo.encerrado_em && (
                  <tr>
                    <td className="text-muted">Encerrado em</td>
                    <td>{formatarData(ciclo.encerrado_em)}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-muted">ID</td>
                  <td className="text-muted">{ciclo.id}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="section">
            <h2>Itens ({ciclo.itens.length})</h2>
            {ciclo.itens.length === 0 ? (
              <div className="empty-state"><p>Nenhum item neste ciclo.</p></div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Descricao</th>
                    <th>Estado</th>
                    <th>Tentativas</th>
                    <th>Ultima acao</th>
                  </tr>
                </thead>
                <tbody>
                  {ciclo.itens.map((item) => (
                    <tr key={item.id}>
                      <td>{item.descricao}</td>
                      <td><span className={`badge badge-${item.estado}`}>{item.estado}</span></td>
                      <td>{item.tentativas}</td>
                      <td>{formatarData(item.atualizado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <h2>Comunicacoes ({ciclo.comunicacoes.length})</h2>
            {ciclo.comunicacoes.length === 0 ? (
              <div className="empty-state"><p>Nenhuma comunicacao neste ciclo.</p></div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Direcao</th>
                    <th>Canal</th>
                    <th>Status</th>
                    <th>Destinatario / Remetente</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {ciclo.comunicacoes.map((com) => (
                    <tr key={com.id}>
                      <td>{com.direcao}</td>
                      <td>{com.canal}</td>
                      <td><span className="badge badge-info">{com.status}</span></td>
                      <td>{com.destinatario ?? com.remetente ?? '—'}</td>
                      <td>{formatarData(com.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <h2>Excecoes ({excecoes.length})</h2>
            {excecoes.length === 0 ? (
              <div className="empty-state"><p>Nenhuma excecao neste ciclo.</p></div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Cliente</th>
                    <th>Item</th>
                    <th>Tentativas</th>
                    <th>Data</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {excecoes.map((exc) => (
                    <tr key={exc.id}>
                      <td><span className="badge badge-alert">{exc.tipo}</span></td>
                      <td>{exc.motivo}</td>
                      <td>{exc.cliente_nome}</td>
                      <td>{exc.item_descricao}</td>
                      <td>{exc.tentativas}</td>
                      <td>{new Date(exc.criado_em).toLocaleDateString('pt-BR')}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actionLoading === exc.item_id}
                              onClick={() => setConfirmAction({ tipo: 'resolvido', itemId: exc.item_id })}
                            >
                              Resolver
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={actionLoading === exc.item_id}
                              onClick={() => setConfirmAction({ tipo: 'cancelado', itemId: exc.item_id })}
                            >
                              Cancelar
                            </button>
                            <button
                              className="btn btn-sm"
                              disabled={actionLoading === exc.item_id}
                              onClick={() => handleReenviar(exc.item_id)}
                            >
                              Reenviar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar acao</h3>
            <p>
              Tem certeza que deseja marcar este item como{' '}
              <strong>{confirmAction.tipo === 'resolvido' ? 'resolvido' : 'cancelado'}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" onClick={() => setConfirmAction(null)}>
                Voltar
              </button>
              <button
                className={confirmAction.tipo === 'resolvido' ? 'btn btn-primary btn-sm' : 'btn btn-danger btn-sm'}
                disabled={!!actionLoading}
                onClick={() => handleDecidir(confirmAction.itemId, confirmAction.tipo)}
              >
                {actionLoading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
