/**
 * ADR-008 · Porta de comunicação. O motor NÃO conhece SMTP/IMAP (#18);
 * testes usam FakeChannel — implementação real chega após validação humana.
 * PRM-P0.1-E: mensagens de saída carregam token de correlação e o canal pode
 * expor mensagens recebidas (respostas) para o runtime correlacionar (CA-06).
 */

export interface MensagemSaida {
  destinatario: string;
  assunto: string;
  corpo: string;
  idempotencyKey: string;
  /** PRM-P0.1-E · token que vincula a resposta do cliente ao item do ciclo. */
  tokenCorrelacao?: string;
}

export interface ResultadoEnvio {
  ok: boolean;
  messageId?: string;
  erro?: string;
}

/** PRM-P0.1-E · mensagem recebida (resposta do cliente) vista pelo runtime. */
export interface MensagemRecebida {
  messageId: string;
  remetente: string;
  assunto?: string;
  corpo: string;
  tokenCorrelacao?: string;
}

export interface CommunicationChannel {
  enviar(msg: MensagemSaida): Promise<ResultadoEnvio>;
  /** PRM-P0.1-E · canais reais expõem as respostas recebidas (opcional). */
  receberRespostas?(): Promise<MensagemRecebida[]>;
}

export class FakeChannel implements CommunicationChannel {
  enviadas: MensagemSaida[] = [];
  /** Injeta falha transitória para testar retry técnico sem tocar o cliente. */
  falharProximas = 0;
  /** PRM-P0.1-E · respostas simuladas devolvidas por receberRespostas(). */
  recebidas: MensagemRecebida[] = [];
  chamadasReceber = 0;

  async enviar(msg: MensagemSaida): Promise<ResultadoEnvio> {
    if (this.falharProximas > 0) {
      this.falharProximas--;
      return { ok: false, erro: 'smtp indisponível (fake)' };
    }
    this.enviadas.push(msg);
    return { ok: true, messageId: `fake-${this.enviadas.length}` };
  }

  async receberRespostas(): Promise<MensagemRecebida[]> {
    this.chamadasReceber++;
    return [...this.recebidas];
  }
}