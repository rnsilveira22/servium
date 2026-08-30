/**
 * PRM-P0.1-A (spike composição) · Seleção inicial do CommunicationChannel para
 * o runtime. PRM-P0.1-C (#47) evolui este arquivo para prover por configuração
 * (none | mailpit | gmail) — ver channel.provider.ts.
 */
import { FakeChannel, type CommunicationChannel } from '../motor/channel';

export function buildChannelFromEnv(): CommunicationChannel {
  const adapter = (process.env.COMMUNICATION_ADAPTER ?? 'none').trim().toLowerCase();
  if (adapter === 'none' || adapter === '') return new FakeChannel();
  // PRM-P0.1-C substitui este ponto pelo provider completo (mailpit/gmail).
  throw new Error(`CommunicationChannel "${adapter}" ainda não disponível nesta etapa (PRM-P0.1-A)`);
}