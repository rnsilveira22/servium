/**
 * ADR-008 · Porta de comunicação. O motor NÃO conhece SMTP/IMAP (#18);
 * testes usam FakeChannel — implementação real chega após validação humana.
 */

export interface MensagemSaida {
  destinatario: string;
  assunto: string;
  corpo: string;
  idempotencyKey: string;
}

export interface ResultadoEnvio {
  ok: boolean;
  messageId?: string;
  erro?: string;
}

export interface CommunicationChannel {
  enviar(msg: MensagemSaida): Promise<ResultadoEnvio>;
}

export class FakeChannel implements CommunicationChannel {
  enviadas: MensagemSaida[] = [];
  /** Injeta falha transitória para testar retry técnico sem tocar o cliente. */
  falharProximas = 0;

  async enviar(msg: MensagemSaida): Promise<ResultadoEnvio> {
    if (this.falharProximas > 0) {
      this.falharProximas--;
      return { ok: false, erro: 'smtp indisponível (fake)' };
    }
    this.enviadas.push(msg);
    return { ok: true, messageId: `fake-${this.enviadas.length}` };
  }
}
