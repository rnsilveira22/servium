/**
 * PRM-P0.1-C · Provider do canal de comunicação do runtime (ADR-008).
 * O motor depende apenas de `CommunicationChannel`; aqui a composição real
 * é escolhida por `COMMUNICATION_ADAPTER`:
 *   - `none`    → FakeChannel (padrão/safety; nenhum envio real);
 *   - `mailpit` → MailpitAdapter via SMTP (local/CI/E2E) — registrado na P0.1-D;
 *   - `gmail`   → GmailAdapter (piloto/prod, obrigatório fora de CI) — wiring
 *                 por tenant previsto pós-validação (PRM-P0.3-A #54).
 * Política: Gmail real NUNCA em CI (owner). `none` garante segurança em
 * ambientes sem configuração.
 */
import { CommunicationChannel, FakeChannel } from '../motor/channel';

export type CommunicationAdapter = 'none' | 'mailpit' | 'gmail';

export const ADAPTERS: readonly CommunicationAdapter[] = ['none', 'mailpit', 'gmail'];

export interface ChannelProvider {
  build(): CommunicationChannel;
}

const registros = new Map<string, ChannelProvider>();

/** Registro de adapters concretos (runtime/main e testes). */
export function registerChannelProvider(adapter: CommunicationAdapter, provider: ChannelProvider): void {
  registros.set(adapter, provider);
}

function validate(adapter: string): asserts adapter is CommunicationAdapter {
  if ((ADAPTERS as readonly string[]).includes(adapter)) return;
  throw new Error(
    `COMMUNICATION_ADAPTER inválido: '${adapter}'. Valores aceitos: ${ADAPTERS.join(', ')}`
  );
}

export function buildChannelFromEnv(env: Record<string, string | undefined> = process.env): CommunicationChannel {
  const adapter = env.COMMUNICATION_ADAPTER ?? 'none';
  validate(adapter);

  if (adapter === 'none') return new FakeChannel();

  if (adapter === 'gmail' && env.CI === 'true') {
    throw new Error('Gmail real é proibido em CI: use COMMUNICATION_ADAPTER=none ou mailpit');
  }

  const provider = registros.get(adapter);
  if (!provider) {
    throw new Error(
      `adapter '${adapter}' sem provider registrado` +
        (adapter === 'mailpit' ? ' (registrado na P0.1-D)' : ' (wiring pós-validação, P0.3-A)')
    );
  }
  return provider.build();
}