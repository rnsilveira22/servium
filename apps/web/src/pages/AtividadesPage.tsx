import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import {
  COMPORTAMENTOS_ATIVIDADE,
  PERIODICIDADES_ATIVIDADE,
  type AgenteDTO,
  type AtividadeDTO,
  type ChecklistTemplateDTO,
  type ComportamentoAtividade,
  type ComportamentoAtividadeMap,
} from '@servium-ia/shared-types';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Table, TableHead } from '../components/Table';

function comportamentoInicial(): ComportamentoAtividadeMap {
  return {
    solicitar: true,
    acompanhar: true,
    cobrar: true,
    registrar: true,
    identificar: true,
    escalar: true,
  };
}

export function AtividadesPage() {
  const [atividades, setAtividades] = useState<AtividadeDTO[]>([]);
  const [agentes, setAgentes] = useState<AgenteDTO[]>([]);
  const [checklists, setChecklists] = useState<ChecklistTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [periodicidade, setPeriodicidade] = useState<string>('mensal');
  const [agenteId, setAgenteId] = useState('');
  const [prazoDias, setPrazoDias] = useState('');
  const [checklistTemplateId, setChecklistTemplateId] = useState('');
  const [comportamento, setComportamento] = useState<ComportamentoAtividadeMap>(comportamentoInicial());

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState('');
  const [editandoPeriodicidade, setEditandoPeriodicidade] = useState('mensal');
  const [editandoAgenteId, setEditandoAgenteId] = useState('');
  const [editandoPrazoDias, setEditandoPrazoDias] = useState('');
  const [editandoChecklistId, setEditandoChecklistId] = useState('');

  const load = () => {
    Promise.all([
      api<AtividadeDTO[]>('/atividades').catch(() => [] as AtividadeDTO[]),
      api<AgenteDTO[]>('/agentes').catch(() => [] as AgenteDTO[]),
      api<ChecklistTemplateDTO[]>('/checklist-templates').catch(() => [] as ChecklistTemplateDTO[]),
    ])
      .then(([a, g, c]) => { setAtividades(a); setAgentes(g); setChecklists(c); })
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resetForm = () => {
    setNome(''); setDescricao(''); setPeriodicidade('mensal'); setAgenteId('');
    setPrazoDias(''); setChecklistTemplateId(''); setComportamento(comportamentoInicial());
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSaving(true);
    try {
      await api('/atividades', {
        method: 'POST',
        body: {
          nome,
          descricao: descricao || undefined,
          periodicidade,
          escopo: 'todos_ativos',
          agente_id: agenteId,
          canal: 'email',
          prazo_dias: prazoDias ? Number(prazoDias) : null,
          checklist_template_id: checklistTemplateId || null,
          comportamento,
        },
      });
      resetForm();
      setShowForm(false);
      setAviso('Atividade operacional criada.');
      load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar atividade');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setErro('');
    setSaving(true);
    try {
      await api(`/atividades/${id}`, {
        method: 'PUT',
        body: {
          nome: editandoNome,
          periodicidade: editandoPeriodicidade,
          agente_id: editandoAgenteId,
          prazo_dias: editandoPrazoDias ? Number(editandoPrazoDias) : null,
          checklist_template_id: editandoChecklistId || null,
        },
      });
      setEditandoId(null);
      setAviso('Atividade atualizada.');
      load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar atividade');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: AtividadeDTO) => {
    setErro('');
    setSaving(true);
    try {
      await api(`/atividades/${a.id}/${a.status === 'ativa' ? 'desativar' : 'ativar'}`, { method: 'POST', body: {} });
      setAviso(a.status === 'ativa' ? 'Atividade desativada.' : 'Atividade ativada.');
      load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar status');
    } finally {
      setSaving(false);
    }
  };

  const comportamentoLabel = (map: ComportamentoAtividadeMap) =>
    COMPORTAMENTOS_ATIVIDADE.filter((k) => map[k]).join(', ');

  const alternarComportamento = (k: ComportamentoAtividade) =>
    setComportamento((c) => ({ ...c, [k]: !c[k] }));

  if (loading) return <div className="page-loading">Carregando...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Atividades Operacionais</h1>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? 'Cancelar' : '+ Nova Atividade'}
        </Button>
      </div>

      {aviso && <div className="alert alert-success" role="status" aria-live="polite">{aviso}</div>}
      {erro && <div className="alert alert-error" role="alert" aria-live="assertive">{erro}</div>}

      {showForm && (
        <form className="form-inline" onSubmit={handleCreate}>
          <Field label="Nome" required>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Solicitação mensal de documentos para fechamento" />
          </Field>
          <Field label="Descrição">
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Rotina operacional executada pela Estagiária Digital" />
          </Field>
          <Field label="Periodicidade">
            <select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value)}>
              {PERIODICIDADES_ATIVIDADE.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Agente executor" required hint="Catálogo de agentes digitais disponíveis.">
            <select value={agenteId} onChange={(e) => setAgenteId(e.target.value)} required>
              <option value="">Selecione...</option>
              {agentes.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </Field>
          <Field label="Prаzo (dias)">
            <input type="number" min={1} value={prazoDias} onChange={(e) => setPrazoDias(e.target.value)} placeholder="10" />
          </Field>
          <Field label="Checklist de documentos" hint="Modelo de pendências da competência.">
            <select value={checklistTemplateId} onChange={(e) => setChecklistTemplateId(e.target.value)}>
              <option value="">Sem checklist</option>
              {checklists.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <Field label="Comportamento operacional" hint="Passos que o motor aplicará na execução.">
            <div className="checkbox-group">
              {COMPORTAMENTOS_ATIVIDADE.map((k) => (
                <label key={k} className="checkbox-line">
                  <input type="checkbox" checked={comportamento[k]} onChange={() => alternarComportamento(k)} />
                  {k}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Escopo" hint="MVP: todos os clientes ativos do escritório.">
            <input value="Todos os clientes ativos" disabled />
          </Field>
          <Button type="submit" loading={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      )}

      {atividades.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma atividade operacional cadastrada.</p>
          <p className="text-muted">Crie uma rotina recorrente atribuída a um agente executor (ex.: Estagiária Digital).</p>
        </div>
      ) : (
        <Table>
          <TableHead columns={['Nome', 'Periodicidade', 'Agente', 'Prazo (dias)', 'Checklist', 'Comportamento', 'Status', 'Criado em', '']} />
          <tbody>
            {atividades.map((a) => {
              if (editandoId === a.id) {
                return (
                  <tr key={a.id}>
                    <td colSpan={9}>
                      <form className="form-inline" onSubmit={(e) => { e.preventDefault(); handleUpdate(a.id); }}>
                        <Field label="Nome" required>
                          <input value={editandoNome} onChange={(e) => setEditandoNome(e.target.value)} required />
                        </Field>
                        <Field label="Periodicidade">
                          <select value={editandoPeriodicidade} onChange={(e) => setEditandoPeriodicidade(e.target.value)}>
                            {PERIODICIDADES_ATIVIDADE.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </Field>
                        <Field label="Agente executor" required>
                          <select value={editandoAgenteId} onChange={(e) => setEditandoAgenteId(e.target.value)} required>
                            {agentes.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                          </select>
                        </Field>
                        <Field label="Prazo (dias)">
                          <input type="number" min={1} value={editandoPrazoDias} onChange={(e) => setEditandoPrazoDias(e.target.value)} />
                        </Field>
                        <Field label="Checklist">
                          <select value={editandoChecklistId} onChange={(e) => setEditandoChecklistId(e.target.value)}>
                            <option value="">Sem checklist</option>
                            {checklists.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                        </Field>
                        <div>
                          <Button type="submit" size="sm" loading={saving}>Salvar</Button>{' '}
                          <Button type="button" variant="ghost" size="sm" onClick={() => setEditandoId(null)}>Cancelar</Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={a.id}>
                  <td>{a.nome}{a.descricao ? <div className="text-muted text-sm">{a.descricao}</div> : null}</td>
                  <td>{a.periodicidade}</td>
                  <td>{a.agente_nome ?? <span className="text-muted">—</span>}</td>
                  <td>{a.prazo_dias ?? <span className="text-muted">—</span>}</td>
                  <td>{a.checklist_template_nome ?? <span className="text-muted">nenhum</span>}</td>
                  <td className="text-muted">{comportamentoLabel(a.comportamento)}</td>
                  <td>
                    <span className={`badge ${a.status === 'ativa' ? 'badge-ativo' : 'badge-neutral'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditandoId(a.id);
                          setEditandoNome(a.nome);
                          setEditandoPeriodicidade(a.periodicidade);
                          setEditandoAgenteId(a.agente_id);
                          setEditandoPrazoDias(a.prazo_dias ? String(a.prazo_dias) : '');
                          setEditandoChecklistId(a.checklist_template_id ?? '');
                        }}
                      >Editar</Button>
                      <Button
                        size="sm"
                        variant={a.status === 'ativa' ? 'secondary' : 'primary'}
                        onClick={() => handleToggle(a)}
                      >
                        {a.status === 'ativa' ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}