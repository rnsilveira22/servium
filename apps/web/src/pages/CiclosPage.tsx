import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface CicloResumo {
  id: string;
  estado: string;
  criado_em: string;
  itens: number;
  resolvidos: number;
  excecoes: number;
}

export function CiclosPage() {
  const [ciclos, setCiclos] = useState<CicloResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ativando, setAtivando] = useState(false);

  const load = () => {
    api<CicloResumo[]>('/ciclos')
      .then(setCiclos)
      .catch(() => setErro('Erro ao carregar ciclos'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAtivar = async () => {
    setErro('');
    setAtivando(true);
    try {
      await api('/ciclos', { method: 'POST', body: {} });
      load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao ativar ciclo');
    } finally {
      setAtivando(false);
    }
  };

  if (loading) return <div className="page-loading">Carregando...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Ciclos</h1>
        <button className="btn btn-primary" onClick={handleAtivar} disabled={ativando}>
          {ativando ? 'Ativando...' : '+ Ativar Ciclo'}
        </button>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      {ciclos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum ciclo registrado.</p>
          <p className="text-muted">Ative um ciclo para iniciar a monitoramento de obrigacoes.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Itens</th>
              <th>Resolvidos</th>
              <th>Excecoes</th>
              <th>Criado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ciclos.map((c) => (
              <tr key={c.id}>
                <td><span className={`badge badge-${c.estado}`}>{c.estado}</span></td>
                <td>{c.itens}</td>
                <td>{c.resolvidos}</td>
                <td>{c.excecoes > 0 ? <span className="badge badge-alert">{c.excecoes}</span> : '0'}</td>
                <td>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                <td><Link to={`/ciclos/${c.id}`} className="link">Detalhes</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
