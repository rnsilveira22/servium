import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Card } from '../components/Card';
import { Table, TableHead } from '../components/Table';
import { Skeleton } from '../components/Skeleton';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

interface Operacional {
  titulo: string;
  descricao: string;
  resultado: string;
  severidade: 'success' | 'pendente' | 'atencao' | 'excecao' | 'erro';
  excecao: boolean;
  intervencaoHumana: boolean;
  cliente: string | null;
  atividade: string | null;
  agente: string | null;
  alteracoes: string[];
}

interface EventoAuditoria {
  id: string;
  actor_type: string;
  actor_id: string | null;
  actor_nome?: string | null;
  entidade: string;
  entidade_id: string;
  acao: string;
  detalhes: Record<string, unknown> | null;
  criado_em: string;
  operacional: Operacional;
}

interface ListaEventos {
  eventos: EventoAuditoria[];
  tem_mais: boolean;
}

interface Metrics {
  totalClientes?: number;
  totalObrigacoes?: number;
  ciclosAtivos?: number;
  excecoesAbertas?: number;
  [key: string]: unknown;
}

interface Health {
  status: string;
  uptime?: number;
  timestamp?: string;
  correlationId?: string;
  [key: string]: unknown;
}

interface ItemOpcao {
  id: string;
  nome: string;
}

const SEVERIDADE_ROTULO: Record<Operacional['severidade'], string> = {
  success: 'Sucesso',
  pendente: 'Pendente',
  atencao: 'Atenção',
  excecao: 'Exceção',
  erro: 'Erro',
};

const SEVERIDADE_TONE: Record<Operacional['severidade'], 'activo' | 'pendente' | 'info' | 'alert'> = {
  success: 'activo',
  pendente: 'pendente',
  atencao: 'info',
  excecao: 'alert',
  erro: 'alert',
};

const ENTIDADES: { valor: string; rotulo: string }[] = [
  { valor: 'auth', rotulo: 'Acesso e segurança' },
  { valor: 'ciclo', rotulo: 'Ciclo de cobrança' },
  { valor: 'item_ciclo', rotulo: 'Solicitação de documento' },
  { valor: 'cliente', rotulo: 'Cliente' },
  { valor: 'obrigacao', rotulo: 'Obrigação' },
  { valor: 'checklist_template', rotulo: 'Modelo de checklist' },
  { valor: 'email_template', rotulo: 'Modelo de e-mail' },
  { valor: 'atividade', rotulo: 'Atividade' },
];

interface FiltrosEstado {
  desde: string;
  ate: string;
  entidade: string;
  atividadeId: string;
  clienteId: string;
  actorType: string;
}

const FILTROS_VAZIOS: FiltrosEstado = { desde: '', ate: '', entidade: '', atividadeId: '', clienteId: '', actorType: '' };

/** Data local 'YYYY-MM-DD' → ISO local (inclusive). */
function dataLocalISO(data: string, fimDoDia: boolean): string {
  const [y, m, d] = data.split('-').map(Number) as [number, number, number];
  const dt = new Date(y, m - 1, d, fimDoDia ? 23 : 0, fimDoDia ? 59 : 0, fimDoDia ? 59 : 0, fimDoDia ? 999 : 0);
  return dt.toISOString();
}

export function AuditoriaPage() {
  const [filtros, setFiltros] = useState<FiltrosEstado>(FILTROS_VAZIOS);
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [cursor, setCursor] = useState<{ antes_de: string; antes_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atividades, setAtividades] = useState<ItemOpcao[]>([]);
  const [clientes, setClientes] = useState<ItemOpcao[]>([]);

  const montarQuery = useCallback(
    (filtrosAtuais: FiltrosEstado, cursorExtra?: { antes_de: string; antes_id: string }) => {
      const p = new URLSearchParams();
      if (filtrosAtuais.desde) p.set('desde', dataLocalISO(filtrosAtuais.desde, false));
      if (filtrosAtuais.ate) p.set('ate', dataLocalISO(filtrosAtuais.ate, true));
      if (filtrosAtuais.entidade) p.set('entidade', filtrosAtuais.entidade);
      if (filtrosAtuais.atividadeId) p.set('entidade_id', filtrosAtuais.atividadeId);
      if (filtrosAtuais.clienteId) p.set('cliente_id', filtrosAtuais.clienteId);
      if (filtrosAtuais.actorType) p.set('actor_type', filtrosAtuais.actorType);
      p.set('limite', '50');
      if (cursorExtra) {
        p.set('antes_de', cursorExtra.antes_de);
        p.set('antes_id', cursorExtra.antes_id);
      }
      return p.toString();
    },
    []
  );

  const buscar = useCallback(
    async (filtrosAtuais: FiltrosEstado, cursorExtra?: { antes_de: string; antes_id: string }, reset = true) => {
      setError(null);
      if (reset) setLoading(true);
      try {
        const data = await api<ListaEventos>(`/auditoria?${montarQuery(filtrosAtuais, cursorExtra)}`);
        setEventos((prev) => (reset ? data.eventos : [...prev, ...data.eventos]));
        setTemMais(data.tem_mais);
        const ultimo = data.eventos[data.eventos.length - 1];
        setCursor(ultimo ? { antes_de: ultimo.criado_em, antes_id: ultimo.id } : null);
      } catch (e) {
        setError((e as Error).message);
        setEventos([]);
        setTemMais(false);
      } finally {
        setLoading(false);
      }
    },
    [montarQuery]
  );

  useEffect(() => {
    void buscar(FILTROS_VAZIOS);
  }, [buscar]);

  useEffect(() => {
    api<ItemOpcao[]>('/atividades')
      .then(setAtividades)
      .catch(() => setAtividades([]));
    api<ItemOpcao[]>('/clientes')
      .then(setClientes)
      .catch(() => setClientes([]));
  }, []);

  const aplicarFiltros: React.FormEventHandler = (e) => {
    e.preventDefault();
    void buscar(filtros, undefined, true);
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    void buscar(FILTROS_VAZIOS, undefined, true);
  };

  const trocarEntidade = (valor: string) => {
    setFiltros((f) => ({ ...f, entidade: valor, atividadeId: valor !== 'atividade' ? '' : f.atividadeId }));
  };

  const formatHorario = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Auditoria Operacional</h1>
        <p className="text-muted">Acompanhe o que aconteceu na operação do ServiumAI.</p>
      </div>

      <section className="section">
        <form className="filter-row" onSubmit={aplicarFiltros} role="search" aria-label="Filtros da auditoria">
          <label className="filter-field">
            <span>De</span>
            <input type="date" value={filtros.desde} onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))} />
          </label>
          <label className="filter-field">
            <span>Até</span>
            <input type="date" value={filtros.ate} onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value }))} />
          </label>
          <label className="filter-field">
            <span>Tipo de evento</span>
            <select value={filtros.entidade} onChange={(e) => trocarEntidade(e.target.value)}>
              <option value="">Todos</option>
              {ENTIDADES.map((ent) => (
                <option key={ent.valor} value={ent.valor}>
                  {ent.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Atividade</span>
            <select
              value={filtros.atividadeId}
              onChange={(e) => setFiltros((f) => ({ ...f, atividadeId: e.target.value }))}
              disabled={filtros.entidade !== '' && filtros.entidade !== 'atividade'}
            >
              <option value="">Todas</option>
              {atividades.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Cliente</span>
            <select value={filtros.clienteId} onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value }))}>
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Agente</span>
            <select value={filtros.actorType} onChange={(e) => setFiltros((f) => ({ ...f, actorType: e.target.value }))}>
              <option value="">Todos</option>
              <option value="servico">Estagiária Digital</option>
              <option value="operador">Operador (humano)</option>
              <option value="sistema">Sistema</option>
            </select>
          </label>
          <div className="filter-actions">
            <Button type="submit" size="sm">
              Aplicar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={limparFiltros}>
              Limpar
            </Button>
          </div>
        </form>
      </section>

      <section className="section" aria-live="polite">
        {loading && (
          <div className="audit-list" role="status" aria-label="Carregando eventos de auditoria">
            <Skeleton height="4rem" />
            <Skeleton height="4rem" />
            <Skeleton height="4rem" />
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert" aria-live="assertive">
            Não foi possível carregar a auditoria: {error}. Tente novamente.
          </div>
        )}

        {!loading && !error && eventos.length === 0 && (
          <div className="alert" role="status">
            Nenhuma atividade registrada no período selecionado.
          </div>
        )}

        {!loading && !error && eventos.length > 0 && (
          <div className="audit-list">
            {eventos.map((e) => (
              <article className="audit-event" key={e.id} aria-label={e.operacional.titulo}>
                <div className="audit-event-head">
                  <span className="audit-time">{formatHorario(e.criado_em)}</span>
                  <strong className="audit-titulo">{e.operacional.titulo}</strong>
                  <Badge tone={SEVERIDADE_TONE[e.operacional.severidade]}>{SEVERIDADE_ROTULO[e.operacional.severidade]}</Badge>
                </div>
                {e.operacional.descricao !== e.operacional.titulo && (
                  <p className="audit-descricao">{e.operacional.descricao}</p>
                )}
                <div className="audit-meta">
                  {e.operacional.cliente && (
                    <span>
                      <b>Cliente:</b> {e.operacional.cliente}
                    </span>
                  )}
                  {e.operacional.atividade && (
                    <span>
                      <b>Atividade:</b> {e.operacional.atividade}
                    </span>
                  )}
                  <span>
                    <b>Agente:</b> {e.operacional.agente}
                  </span>
                  <span>
                    <b>Resultado:</b> {e.operacional.resultado}
                  </span>
                </div>
                {e.operacional.alteracoes.length > 0 && (
                  <div className="audit-alteracoes">
                    {e.operacional.alteracoes.map((a) => (
                      <span className="chip" key={a}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                <details className="audit-tech">
                  <summary>Detalhes técnicos</summary>
                  <dl className="audit-tech-grid">
                    <dt>Evento</dt>
                    <dd>{e.entidade} · {e.acao}</dd>
                    <dt>ID do evento</dt>
                    <dd>{e.id}</dd>
                    <dt>Entidade auditada</dt>
                    <dd>{e.entidade_id}</dd>
                    <dt>Ator</dt>
                    <dd>{e.actor_type}{e.actor_id ? ` (${e.actor_id})` : ''}</dd>
                    <dt>Quando</dt>
                    <dd>{new Date(e.criado_em).toISOString()}</dd>
                  </dl>
                </details>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && temMais && (
          <div className="audit-more">
            <Button
              variant="secondary"
              onClick={() => {
                if (cursor) void buscar(filtros, cursor, false);
              }}
            >
              Carregar mais
            </Button>
          </div>
        )}
      </section>

      <section className="section">
        <details className="audit-tech-info">
          <summary>Métricas e saúde do sistema</summary>
          <MetricasTecnicas />
        </details>
      </section>
    </div>
  );
}

function MetricasTecnicas() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);
  const [errorHealth, setErrorHealth] = useState<string | null>(null);

  useEffect(() => {
    api<Metrics>('/metrics')
      .then(setMetrics)
      .catch((e: Error) => setErrorMetrics(e.message))
      .finally(() => setLoadingMetrics(false));

    api<Health>('/health')
      .then(setHealth)
      .catch((e: Error) => setErrorHealth(e.message))
      .finally(() => setLoadingHealth(false));
  }, []);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  };

  const formatValue = (val: unknown) => {
    if (typeof val === 'number') return val.toLocaleString('pt-BR');
    if (typeof val === 'boolean') return val ? 'Sim' : 'Nao';
    if (val === null || val === undefined) return '-';
    return String(val);
  };

  return (
    <>
      <section className="section">
        <h2>Metricas</h2>
        {loadingMetrics && (
          <div className="cards-grid" aria-label="Carregando metricas" role="status">
            <Card label={<Skeleton width="70%" />} value={<Skeleton width="40%" height="1.5rem" />} />
            <Card label={<Skeleton width="70%" />} value={<Skeleton width="40%" height="1.5rem" />} />
            <Card label={<Skeleton width="70%" />} value={<Skeleton width="40%" height="1.5rem" />} />
            <Card label={<Skeleton width="70%" />} value={<Skeleton width="40%" height="1.5rem" />} />
          </div>
        )}
        {errorMetrics && <div className="alert alert-error" role="alert" aria-live="assertive">{errorMetrics}</div>}
        {metrics && (
          <div className="cards-grid">
            {Object.entries(metrics).map(([key, value]) => (
              <Card key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')} value={formatValue(value)} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Saude do Sistema</h2>
        {loadingHealth && <div className="loading">Verificando saude...</div>}
        {errorHealth && <div className="alert alert-error" role="alert" aria-live="assertive">{errorHealth}</div>}
        {health && (
          <Table>
            <TableHead columns={['Propriedade', 'Valor']} />
            <tbody>
              <tr>
                <td>Status</td>
                <td>
                  <span className={`badge badge-${health.status === 'ok' ? 'ativo' : 'encerrado'}`}>{health.status}</span>
                </td>
              </tr>
              {health.uptime !== undefined && (
                <tr>
                  <td>Uptime</td>
                  <td>{formatUptime(health.uptime)}</td>
                </tr>
              )}
              {health.timestamp && (
                <tr>
                  <td>Timestamp</td>
                  <td>{new Date(health.timestamp).toLocaleString('pt-BR')}</td>
                </tr>
              )}
              {health.correlationId && (
                <tr>
                  <td>Correlation ID</td>
                  <td><code>{health.correlationId}</code></td>
                </tr>
              )}
              {Object.entries(health)
                .filter(([k]) => !['status', 'uptime', 'timestamp', 'correlationId'].includes(k))
                .map(([key, value]) => (
                  <tr key={key}>
                    <td>{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</td>
                    <td>{formatValue(value)}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}
      </section>
    </>
  );
}