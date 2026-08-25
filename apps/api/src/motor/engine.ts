/**
 * SRV-15 · Motor determinístico do ciclo (ADR-010 — zero LLM no caminho crítico).
 * Funções PURAS: sem IO, relógio injetado ⇒ testes com tempo fake.
 * Máquina de estados conforme docs/product/OPERATIONAL_FLOW.md.
 * Estados DB: pendente, cobrado, aguardando, recebido (=EmValidacao),
 * resolvido, cancelado, excecao (=Escalado).
 */

export type EstadoItem =
  | 'pendente'
  | 'cobrado'
  | 'aguardando'
  | 'recebido'
  | 'resolvido'
  | 'cancelado'
  | 'excecao';

export type Acao = 'cobrar' | 'aguardar' | 'escalar' | 'nada';

/** Transições legais (motor só executa as automáticas; humano fecha excecao). */
const TRANSICOES: Record<EstadoItem, EstadoItem[]> = {
  pendente: ['cobrado', 'aguardando'], // aguardando: canal síncrono envia+registra em passo único
  cobrado: ['aguardando'],
  aguardando: ['recebido', 'cobrado', 'excecao'],
  recebido: ['resolvido', 'excecao'],
  excecao: ['resolvido', 'cancelado'], // decisão humana
  resolvido: [],
  cancelado: [],
};

export function podeTransicionar(de: EstadoItem, para: EstadoItem): boolean {
  return TRANSICOES[de]?.includes(para) ?? false;
}

export interface LimitesConfig {
  frequencia_horas: number;
  tentativas_max: number; // tentativas SOCIAIS (cobranças ao cliente)
  horario_inicio: number; // hora local inclusiva
  horario_fim: number; // hora local exclusiva
}

export const LIMITES_PADRAO: LimitesConfig = {
  frequencia_horas: 24,
  tentativas_max: 3,
  horario_inicio: 8,
  horario_fim: 18,
};

/** Horário comercial permitido (CA-02) — relógio injetado. */
export function dentroHorarioComercial(agora: Date, cfg: LimitesConfig): boolean {
  const h = agora.getHours();
  return h >= cfg.horario_inicio && h < cfg.horario_fim;
}

export interface ItemParaDecisao {
  estado: EstadoItem;
  tentativas: number; // cobranças sociais já feitas
  ultima_cobranca_em: Date | null;
}

/**
 * Decisão determinística do próximo passo (CA-01..CA-03).
 * - pendente/aguardando + fora de horário ⇒ nada (espera janela)
 * - frequência não cumprida ⇒ nada (ainda cedo)
 * - limite social esgotado ⇒ escalar (exceção p/ humano)
 * - caso contrário ⇒ cobrar
 */
export function decidirAcao(
  item: ItemParaDecisao,
  cfg: LimitesConfig,
  agora: Date
): { acao: Acao; motivo: string } {
  if (item.estado === 'recebido' || item.estado === 'excecao' || item.estado === 'resolvido' || item.estado === 'cancelado') {
    return { acao: 'nada', motivo: `estado terminal/parado=${item.estado}` };
  }
  if (!dentroHorarioComercial(agora, cfg)) {
    return { acao: 'nada', motivo: 'fora do horário comercial' };
  }
  if (item.tentativas >= cfg.tentativas_max) {
    return { acao: 'escalar', motivo: `tentativas sociais esgotadas (${item.tentativas}/${cfg.tentativas_max})` };
  }
  if (item.ultima_cobranca_em) {
    const proxima = item.ultima_cobranca_em.getTime() + cfg.frequencia_horas * 3600_000;
    if (agora.getTime() < proxima) return { acao: 'nada', motivo: 'frequência mínima não atingida' };
  }
  return { acao: 'cobrar', motivo: `dentro dos limites (${item.tentativas}/${cfg.tentativas_max})` };
}

/** Idempotência determinística por rodada social (CA-05): mesmo tick ⇒ mesma chave. */
export function chaveCobranca(itemCicloId: string, rodadaSocial: number): string {
  return `cobrar:${itemCicloId}:r${rodadaSocial}`;
}
