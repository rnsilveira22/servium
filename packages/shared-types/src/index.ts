export interface ServiceInfo {
  name: string;
  version: string;
}

export const SERVICE_NAME = 'servium-api';
export const SERVICE_VERSION = '0.1.0';

// ===== SRV-16 · Cadastro mínimo (contratos de API) =====

export interface CriarClienteInput {
  nome: string;
  identificacao?: string;
  email: string;
}

export interface ClienteDTO {
  id: string;
  nome: string;
  identificacao: string | null;
  email: string | null;
  criado_em: string;
}

export interface CriarObrigacaoInput {
  cliente_id: string;
  descricao: string;
  prazo?: string;
  /** ID do checklist_template (mesmo tenant). Opcional — retrocompatível (M1-OPS-01). */
  template_id?: string;
}

export interface ObrigacaoDTO {
  id: string;
  cliente_id: string;
  descricao: string;
  prazo: string | null;
  template_id: string | null;
  template_nome: string | null;
  criado_em: string;
}

export const TIPOS_ESPERADOS = ['documento', 'informacao', 'assinatura'] as const;
export type TipoEsperado = (typeof TIPOS_ESPERADOS)[number];

export interface ItemTemplateInput {
  descricao: string;
  tipo_esperado?: TipoEsperado;
  tamanho_max_bytes?: number;
  ordem?: number;
}

export interface CriarChecklistTemplateInput {
  nome: string;
  canal?: string;
  itens: ItemTemplateInput[];
  /** ID do modelo de e-mail padrão (mesmo tenant). Opcional. */
  email_template_id?: string;
}

export interface ChecklistTemplateDTO {
  id: string;
  nome: string;
  canal: string;
  /** Modelo de e-mail padrão vinculado (null = texto embutido fixo do motor). */
  email_template_id: string | null;
  email_template_nome: string | null;
  itens: Array<{
    id: string;
    descricao: string;
    tipo_esperado: TipoEsperado;
    tamanho_max_bytes: number | null;
    ordem: number;
  }>;
}

// ===== Modelos de e-mail padrão =====

/** Placeholders suportados em `assunto`/`corpo` — renderizados pelo motor. */
export const EMAIL_TEMPLATE_PLACEHOLDERS = [
  { chave: '{{cliente_nome}}', descricao: 'Nome do cliente' },
  { chave: '{{item_descricao}}', descricao: 'Descrição do documento/pendência' },
  { chave: '{{token_correlacao}}', descricao: 'Identificador de correlação (nunca remova do corpo)' },
] as const;

export interface CriarEmailTemplateInput {
  nome: string;
  assunto: string;
  corpo: string;
}

export interface EmailTemplateDTO {
  id: string;
  nome: string;
  assunto: string;
  corpo: string;
  criado_em: string;
}

// ===== M1-OPS-05 · Configurações do tenant (e-mail do escritório) =====

export interface TenantConfigDTO {
  email_escritorio: string | null;
}

// ===== B-2 R3 · Integração de e-mail por tenant (provider-agnóstico) =====

export const EMAIL_PROVIDERS = ['gmail', 'mailpit'] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export const EMAIL_AUTH_TYPES = ['none', 'oauth2'] as const;
export type EmailAuthType = (typeof EMAIL_AUTH_TYPES)[number];

/** Configuração de integração de e-mail do tenant (sem segredos; apenas a
 *  referência à credencial). Compatível com a tabela tenant_email_integration. */
export interface TenantEmailIntegrationDTO {
  provider: EmailProvider;
  sender_email: string | null;
  mailbox_email: string | null;
  auth_type: EmailAuthType;
  credential_reference: string | null;
  send_enabled: boolean;
  receive_enabled: boolean;
  status: string;
}

// ===== FR-020 · Atividade Operacional + FR-021 · Agente Executor =====

/** Periodicidade de recorrência da atividade (configuração armazenada; engine de
 *  execução é ponto de extensão — FR-022, não implementada nesta rodada). */
export const PERIODICIDADES_ATIVIDADE = ['mensal', 'trimestral', 'semestral', 'anual'] as const;
export type PeriodicidadeAtividade = (typeof PERIODICIDADES_ATIVIDADE)[number];

/** Passos de comportamento operacional que o motor aplicará nas execuções. */
export const COMPORTAMENTOS_ATIVIDADE = [
  'solicitar',
  'acompanhar',
  'cobrar',
  'registrar',
  'identificar',
  'escalar',
] as const;
export type ComportamentoAtividade = (typeof COMPORTAMENTOS_ATIVIDADE)[number];
export type ComportamentoAtividadeMap = Record<ComportamentoAtividade, boolean>;

export const COMPORTAMENTO_PADRAO_ATIVIDADE: ComportamentoAtividadeMap = {
  solicitar: true,
  acompanhar: true,
  cobrar: true,
  registrar: true,
  identificar: true,
  escalar: true,
};

/** Escopo implementado no MVP: todos os clientes ativos do tenant. */
export const ESCOPOS_ATIVIDADE = ['todos_ativos'] as const;
export type EscopoAtividade = (typeof ESCOPOS_ATIVIDADE)[number];

export interface AgenteDTO {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  capacidade: string;
  ativo: boolean;
  criado_em: string;
}

export interface CriarAtividadeInput {
  nome: string;
  descricao?: string;
  periodicidade?: PeriodicidadeAtividade;
  escopo?: EscopoAtividade;
  agente_id: string;
  canal?: string;
  prazo_dias?: number | null;
  checklist_template_id?: string | null;
  comportamento?: Partial<ComportamentoAtividadeMap>;
}

export interface AtividadeDTO {
  id: string;
  nome: string;
  descricao: string | null;
  periodicidade: string;
  escopo: string;
  agente_id: string;
  agente_nome: string | null;
  agente_slug: string | null;
  canal: string;
  prazo_dias: number | null;
  checklist_template_id: string | null;
  checklist_template_nome: string | null;
  comportamento: ComportamentoAtividadeMap;
  status: string;
  criado_em: string;
  atualizado_em: string;
}
