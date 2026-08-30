import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { MailpitAdapter, buildMailpitConfig } from '../src/runtime/mailpit';

/**
 * Integração com o serviço Mailpit real (SMTP 1025 + REST 8025).
 * Rodado apenas quando MAILPIT_API_URL está configurado (CI / local via
 * `docker compose up -d mailpit`); caso contrário é pulado.
 */
const API = process.env.MAILPIT_API_URL;

async function mailpitTotal(): Promise<number | null> {
  try {
    const res = await fetch(`${API}/api/v1/messages`);
    if (!res.ok) return null;
    const body = (await res.json()) as { total: number };
    return body.total;
  } catch {
    return null;
  }
}

const skip = describe.skipIf(!API);

let adapter: MailpitAdapter | null = null;

beforeAll(() => {
  adapter = new MailpitAdapter(buildMailpitConfig());
}, 10_000);

afterAll(async () => {
  await adapter?.close();
});

skip('PRM-P0.1-D · MailpitAdapter entrega e-mail via SMTP real (Mailpit)', () => {
  it('enviar() retorna ok com messageId e a mensagem chega ao Mailpit', async () => {
    const antes = await mailpitTotal();
    expect(antes).not.toBeNull();

    const res = await adapter!.enviar({
      destinatario: 'cliente-motor@mailpit.local',
      assunto: 'Cobrança #48',
      corpo: 'Token de correlação será vinculado na P0.1-E.',
      idempotencyKey: `mailpit-${Date.now()}`,
    });
    expect(res.ok).toBe(true);
    expect(res.messageId).toBeTruthy();

    let total = antes!;
    for (let i = 0; i < 50 && total === antes!; i++) {
      await new Promise((r) => setTimeout(r, 100));
      total = (await mailpitTotal()) ?? antes!;
    }
    expect(total).toBe(antes! + 1);

    const resMsgs = await fetch(`${API}/api/v1/messages`);
    const body = (await resMsgs.json()) as {
      messages: Array<{ Subject: string }>;
    };
    expect(body.messages.some((m) => m.Subject === 'Cobrança #48')).toBe(true);
  }, 20_000);

  it('falha de transporte não vaza erro: retorna { ok:false }', async () => {
    const quebrado = new MailpitAdapter({ smtpHost: 'localhost', smtpPort: 1, from: 'x@servium.local' });
    const res = await quebrado.enviar({
      destinatario: 'a@b',
      assunto: 'x',
      corpo: 'y',
      idempotencyKey: `falha-${Date.now()}`,
    });
    expect(res.ok).toBe(false);
    expect(res.erro).toBeTruthy();
    await quebrado.close();
  }, 15_000);
});