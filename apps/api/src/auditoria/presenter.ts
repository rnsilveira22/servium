import type { EventoAuditoriaDTO } from '@servium-ia/db';

/**
 * FR-028 · Camada de apresentação operacional da trilha de auditoria.
 *
 * Transforma um evento técnico (`EventoAuditoriaDTO`) em um evento
 * operacional compreensível pelo usuário. **Não inventa dados**: o context
 * (cliente/atividade) vem de JOINs seguros resolvidos na API (mesmo tenant,
 * RLS); o agente vem do `actor_type`/`actor_id`; o label `servico` é o nome
 * aprovado em HG-APROVAÇÃO-NOMENCLATURA (único agente do MVP), nunca um
 * hardcode de fluxo de negócio.
 */

export type SeveridadeOperacional = 'success' | 'pendente' | 'atencao' | 'excecao' | 'erro';

export const SEVERIDADE_ROTULO: Record<SeveridadeOperacional, string> = {
  success: 'Sucesso',
  pendente: 'Pendente',
  atencao: 'Atenção',
  excecao: 'Exceção',
  erro: 'Erro',
};

export interface EventoOperacionalDTO {
  /** Título humano do que aconteceu. */
  titulo: string;
  /** Descrição curta orientada à operação. */
  descricao: string;
  /** Resultado operacional (ex.: "Enviado com sucesso"). */
  resultado: string;
  severidade: SeveridadeOperacional;
  /** Evento representa uma exceção operacional (ex.: pendência escalada). */
  excecao: boolean;
  /** Ação executada por humano (actor_type = 'operador'). */
  intervencaoHumana: boolean;
  /** Nome do cliente, quando determinável com segurança; senão null. */
  cliente: string | null;
  /** Nome da atividade, quando o evento a referencia; senão null. */
  atividade: string | null;
  /** Nome do agente executor, derivado do ator do evento. */
  agente: string | null;
  /** O que mudou, quando derivável do payload (nunca inventado). */
  alteracoes: string[];
}

export interface EventoAuditoriaOperacional extends EventoAuditoriaDTO {
  operacional: EventoOperacionalDTO;
}

type Detalhes = Record<string, unknown>;

interface DefinicaoOperacional {
  titulo: string;
  resultado: string | ((d: Detalhes) => string);
  severidade: SeveridadeOperacional;
  excecao: boolean;
  descricao?: string | ((d: Detalhes) => string);
  alteracoes?: (d: Detalhes) => string[];
}

const MAPA: Record<string, DefinicaoOperacional> = {
  // ---- auth
  'auth:login_sucesso': {
    titulo: 'Entrada no sistema',
    descricao: 'Operador realizou login com sucesso.',
    resultado: 'Acesso concedido',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Sessão iniciada'],
  },
  'auth:login_falha': {
    titulo: 'Tentativa de entrada falhou',
    descricao: (d) => (d.motivo === 'senha_invalida' ? 'Senha inválida informada no login.' : 'Falha na autenticação.'),
    resultado: 'Acesso negado',
    severidade: 'atencao',
    excecao: false,
  },
  'auth:login_block': {
    titulo: 'Entrada bloqueada temporariamente',
    descricao: () => 'Limite de tentativas de login excedido; entrada bloqueada por alguns minutos.',
    resultado: 'Entrada bloqueada',
    severidade: 'erro',
    excecao: false,
  },
  'auth:logout': {
    titulo: 'Saída do sistema',
    descricao: 'Operador encerrou a sessão.',
    resultado: 'Sessão encerrada',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Sessão encerrada'],
  },
  'auth:trocar_senha': {
    titulo: 'Senha alterada',
    descricao: 'Operador alterou a própria senha.',
    resultado: 'Senha atualizada',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Senha atualizada'],
  },
  'auth:trocar_senha_falha': {
    titulo: 'Alteração de senha falhou',
    descricao: (d) =>
      d.motivo === 'politica_violada' ? 'Nova senha não atende à política obrigatória.' : 'A senha atual informada não confere.',
    resultado: 'Senha não alterada',
    severidade: 'atencao',
    excecao: false,
  },
  // ---- ciclo
  'ciclo:ativar': {
    titulo: 'Ciclo de cobrança ativado',
    descricao: 'Novo ciclo de solicitação de documentos iniciado.',
    resultado: 'Ciclo ativo',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Ciclo iniciado'],
  },
  'ciclo:ativacao_sem_template': {
    titulo: 'Ciclo ativado sem modelo de checklist',
    descricao: 'A obrigação não possui checklist vinculado; o ciclo segue sem itens de solicitação.',
    resultado: 'Sem checklist vinculado',
    severidade: 'atencao',
    excecao: false,
  },
  'ciclo:encerrar': {
    titulo: 'Ciclo de cobrança encerrado',
    descricao: 'Todos os itens do ciclo foram finalizados.',
    resultado: 'Ciclo concluído',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Ciclo encerrado'],
  },
  'ciclo:cancelar': {
    titulo: 'Ciclo de cobrança cancelado',
    descricao: (d) => (d.motivo ? `Cancelado pelo operador. Motivo: ${d.motivo}.` : 'Cancelado pelo operador.'),
    resultado: 'Ciclo cancelado',
    severidade: 'atencao',
    excecao: false,
    alteracoes: (d) => (d.de_estado && d.para_estado ? [`Estado: ${d.de_estado} → ${d.para_estado}`] : ['Ciclo cancelado']),
  },
  // ---- item_ciclo
  'item_ciclo:cobrar': {
    titulo: 'Solicitação de documentos enviada',
    descricao: (d) => `Solicitação de documentos enviada ao cliente (rodada ${String(d.rodada ?? 1)}).`,
    resultado: 'Enviado com sucesso',
    severidade: 'success',
    excecao: false,
    alteracoes: (d) => [`Envio da rodada ${String(d.rodada ?? 1)}`],
  },
  'item_ciclo:decisao': {
    titulo: 'Sem nova ação nesta rodada',
    descricao: 'O motor verificou o item e não realizou envio neste momento.',
    resultado: 'Aguardando',
    severidade: 'pendente',
    excecao: false,
  },
  'item_ciclo:escalar': {
    titulo: 'Pendência escalada',
    descricao: (d) =>
      d.motivo
        ? `Cliente não respondeu às solicitações; pendência escalada. Motivo: ${String(d.motivo)}.`
        : 'Cliente não respondeu às solicitações; pendência escalada para tratamento.',
    resultado: 'Escalada para tratamento',
    severidade: 'excecao',
    excecao: true,
    alteracoes: () => ['Pendência movida para exceção'],
  },
  'item_ciclo:decidir': {
    titulo: 'Pendência decidida',
    descricao: (d) => {
      const desfecho = d.desfecho === 'resolvido' ? 'Pendência marcada como resolvida.' : 'Pendência cancelada pelo operador.';
      return d.motivo ? `${desfecho} Motivo: ${String(d.motivo)}.` : desfecho;
    },
    resultado: (d: Detalhes) => (d.desfecho === 'cancelado' ? 'Cancelada' : 'Resolvida'),
    severidade: 'success',
    excecao: false,
    alteracoes: (d) => [`Desfecho: ${String(d.desfecho ?? 'resolvido')}`],
  },
  'item_ciclo:reenviar': {
    titulo: 'Solicitação reenviada',
    descricao: 'Operador reenviou manualmente a solicitação de documentos.',
    resultado: 'Reenviado',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Solicitação reenviada'],
  },
  'item_ciclo:receber': {
    titulo: 'Documento recebido',
    descricao: 'Resposta do cliente vinculada à solicitação; pendência atualizada.',
    resultado: 'Recebido e pendência atualizada',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Pendência atualizada para recebida'],
  },
  // ---- cliente
  'cliente:criar': {
    titulo: 'Cliente cadastrado',
    descricao: (d) => (d.nome ? `Cadastro do cliente ${String(d.nome)}.` : 'Novo cliente cadastrado.'),
    resultado: 'Cadastrado',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Cliente adicionado'],
  },
  // ---- obrigacao
  'obrigacao:criar': {
    titulo: 'Obrigação cadastrada',
    descricao: (d) => (d.descricao ? `Cadastro da obrigação: ${String(d.descricao)}.` : 'Nova obrigação cadastrada.'),
    resultado: 'Cadastrada',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Obrigação adicionada'],
  },
  // ---- checklist_template
  'checklist_template:criar': {
    titulo: 'Modelo de checklist criado',
    descricao: 'Novo modelo de checklist criado.',
    resultado: 'Criado',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Modelo criado'],
  },
  'checklist_template:vincular_email_template': {
    titulo: 'Modelo de e-mail vinculado ao checklist',
    descricao: 'Modelo de e-mail vinculado ao modelo de checklist.',
    resultado: 'Vinculado',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Modelo de e-mail vinculado'],
  },
  // ---- email_template
  'email_template:criar': {
    titulo: 'Modelo de e-mail criado',
    descricao: 'Novo modelo de e-mail criado.',
    resultado: 'Criado',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Modelo de e-mail adicionado'],
  },
  'email_template:atualizar': {
    titulo: 'Modelo de e-mail atualizado',
    descricao: 'Modelo de e-mail alterado.',
    resultado: 'Atualizado',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Modelo de e-mail alterado'],
  },
  'email_template:excluir': {
    titulo: 'Modelo de e-mail excluído',
    descricao: 'Modelo de e-mail removido do sistema.',
    resultado: 'Excluído',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Modelo de e-mail removido'],
  },
  // ---- atividade
  'atividade:criar': {
    titulo: 'Atividade criada',
    descricao: (d) => (d.nome ? `Atividade cadastrada: ${String(d.nome)}.` : 'Nova atividade cadastrada.'),
    resultado: 'Cadastrada',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Atividade cadastrada'],
  },
  'atividade:atualizar': {
    titulo: 'Atividade atualizada',
    descricao: (d) => {
      if (d.campos && typeof d.campos === 'object') {
        const campos = Object.keys(d.campos as Record<string, unknown>);
        return campos.length > 0 ? `Campo(s) alterado(s): ${campos.join(', ')}.` : 'Atividade alterada.';
      }
      return 'Atividade alterada.';
    },
    resultado: 'Atualizada',
    severidade: 'success',
    excecao: false,
    alteracoes: (d) => {
      if (d.campos && typeof d.campos === 'object') {
        const campos = Object.keys(d.campos as Record<string, unknown>);
        return campos.length > 0 ? [`${campos.join(', ')} atualizado(s)`] : ['Atividade atualizada'];
      }
      return ['Atividade atualizada'];
    },
  },
  'atividade:ativar': {
    titulo: 'Atividade ativada',
    descricao: 'Atividade ativada para a rotina operacional.',
    resultado: 'Ativa',
    severidade: 'success',
    excecao: false,
    alteracoes: () => ['Atividade ativada'],
  },
  'atividade:desativar': {
    titulo: 'Atividade desativada',
    descricao: 'Atividade desativada; não participa mais da rotina.',
    resultado: 'Inativa',
    severidade: 'atencao',
    excecao: false,
    alteracoes: () => ['Atividade desativada'],
  },
};

const FALLBACK: DefinicaoOperacional = {
  titulo: 'Evento registrado',
  resultado: 'Registrado',
  severidade: 'success',
  excecao: false,
};

export const ENTIDADES_AUDITAVEIS: { valor: string; rotulo: string }[] = [
  { valor: 'auth', rotulo: 'Acesso e segurança' },
  { valor: 'ciclo', rotulo: 'Ciclo de cobrança' },
  { valor: 'item_ciclo', rotulo: 'Solicitação de documento' },
  { valor: 'cliente', rotulo: 'Cliente' },
  { valor: 'obrigacao', rotulo: 'Obrigação' },
  { valor: 'checklist_template', rotulo: 'Modelo de checklist' },
  { valor: 'email_template', rotulo: 'Modelo de e-mail' },
  { valor: 'atividade', rotulo: 'Atividade' },
];

export function rotuloEntidade(entidade: string): string {
  return ENTIDADES_AUDITAVEIS.find((e) => e.valor === entidade)?.rotulo ?? entidade;
}

/**
 * Nome do agente apresentado ao usuário, derivado SOMENTE dos dados do
 * evento: operador → nome resolvido; servico → nome aprovado do único
 * agente do MVP; sistema → "Sistema". Nunca hardcoded no domínio.
 */
export function agenteDoEvento(evento: EventoAuditoriaDTO): string {
  if (evento.actor_type === 'operador') {
    return evento.actor_nome ?? 'Operador';
  }
  if (evento.actor_type === 'servico') {
    return 'Estagiária Digital';
  }
  return 'Sistema';
}

export function interpretarEventoOperacional(
  evento: EventoAuditoriaDTO,
  contexto: { cliente: string | null; atividade: string | null }
): EventoOperacionalDTO {
  const definicao = MAPA[`${evento.entidade}:${evento.acao}`] ?? FALLBACK;
  const detalhes = (evento.detalhes ?? {}) as Detalhes;

  let descricao = definicao.titulo;
  if (typeof definicao.descricao === 'function') {
    descricao = definicao.descricao(detalhes);
  } else if (typeof definicao.descricao === 'string') {
    descricao = definicao.descricao;
  }

  const resultado = typeof definicao.resultado === 'function' ? (definicao.resultado as (d: Detalhes) => string)(detalhes) : definicao.resultado;

  return {
    titulo: definicao.titulo,
    descricao,
    resultado,
    severidade: definicao.severidade,
    excecao: definicao.excecao,
    intervencaoHumana: evento.actor_type === 'operador',
    cliente: contexto.cliente,
    atividade: contexto.atividade,
    agente: agenteDoEvento(evento),
    alteracoes: definicao.alteracoes ? definicao.alteracoes(detalhes) : [],
  };
}