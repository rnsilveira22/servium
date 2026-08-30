import { describe, expect, it } from 'vitest';

import { buildChannelFromEnv, registerChannelProvider, ADAPTERS } from '../src/runtime/channel';
import { FakeChannel } from '../src/motor/channel';

describe('PRM-P0.1-C · provider do canal selecionado por env', () => {
  it('sem COMMUNICATION_ADAPTER usa FakeChannel (default seguro)', () => {
    const canal = buildChannelFromEnv({});
    expect(canal).toBeInstanceOf(FakeChannel);
  });

  it('none → FakeChannel (nenhum envio real)', async () => {
    const canal = buildChannelFromEnv({ COMMUNICATION_ADAPTER: 'none' });
    expect(canal).toBeInstanceOf(FakeChannel);
    const res = await canal.enviar({ destinatario: 'a@b', assunto: 's', corpo: 'c', idempotencyKey: 'k1' });
    expect(res.ok).toBe(true);
  });

  it('valor inválido é rejeitado na inicialização', () => {
    expect(() => buildChannelFromEnv({ COMMUNICATION_ADAPTER: 'whatsapp' })).toThrow(/inválido/);
  });

  it('gmail nunca é escolhido em CI', () => {
    expect(() => buildChannelFromEnv({ COMMUNICATION_ADAPTER: 'gmail', CI: 'true' })).toThrow(/Gmail real.*proibido em CI/);
  });

  it('adapter válido sem provider registrado ainda indica o próximo passo', () => {
    expect(() => buildChannelFromEnv({ COMMUNICATION_ADAPTER: 'mailpit' })).toThrow(/P0.1-D/);
  });

  it('provider registrado é usado (extensível para mailpit/gmail)', async () => {
    const fake = new FakeChannel();
    registerChannelProvider('mailpit', { build: () => fake });
    const canal = buildChannelFromEnv({ COMMUNICATION_ADAPTER: 'mailpit' });
    expect(canal).toBe(fake);
    expect(ADAPTERS).toContain('mailpit');
  });
});