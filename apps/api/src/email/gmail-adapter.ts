/**
 * SRV-18 · Adapter Gmail API + OAuth 2.0 (ADR-008 CommunicationChannel).
 * Adapter concreto; core do motor não conhece Gmail — acoplamento via injeção.
 * Idempotência: message_id persistido antes de return; duplicatas rejeitadas.
 * Retry: backoff exponencial para erros 429/5xx (rate limit Google = 250 quota/day).
 */
import { google, gmail_v1 } from 'googleapis';
import type { Client } from 'pg';

import type { CommunicationChannel, MensagemSaida, ResultadoEnvio } from '../motor/channel';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'];
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function buildOAuth2(cfg: GmailConfig) {
  return new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
}

export function buildAuthUrl(cfg: GmailConfig, state: string): string {
  const oauth2 = buildOAuth2(cfg);
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

export async function exchangeCode(
  cfg: GmailConfig,
  code: string,
  ctx: Client,
  tenantId: string
): Promise<{ email: string }> {
  const oauth2 = buildOAuth2(cfg);
  const { tokens } = await oauth2.getToken(code);
  const ticket = await oauth2.verifyIdToken({ idToken: tokens.id_token! });
  const email = ticket.getPayload()!.email!;

  await ctx.query(
    `INSERT INTO gmail_tokens (tenant_id, user_email, access_token, refresh_token, scopes, expires_at)
     VALUES ($1,$2,$3,$4,$5,to_timestamp($6))
     ON CONFLICT (tenant_id, user_email) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       scopes = EXCLUDED.scopes,
       expires_at = EXCLUDED.expires_at,
       atualizado_em = now()`,
    [tenantId, email, tokens.access_token!, tokens.refresh_token!, SCOPES, tokens.expiry_date! / 1000]
  );
  return { email };
}

async function getValidClient(ctx: Client, tenantId: string, cfg: GmailConfig): Promise<gmail_v1.Gmail> {
  const { rows } = await ctx.query<{
    access_token: string;
    refresh_token: string;
    expires_at: Date;
  }>('SELECT access_token, refresh_token, expires_at FROM gmail_tokens WHERE tenant_id=$1 LIMIT 1', [tenantId]);
  if (rows.length === 0) throw new Error('nenhum token Gmail configurado para este tenant');

  const row = rows[0]!;
  const oauth2 = buildOAuth2(cfg);
  oauth2.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
  });

  // refresh automático se expirado
  if (row.expires_at.getTime() < Date.now() + 60_000) {
    const refreshRes = await oauth2.refreshAccessToken();
    const newAccessToken = refreshRes.credentials.access_token ?? '';
    const newExpiry = (refreshRes.credentials.expiry_date ?? Date.now()) / 1000;
    await ctx.query(
      'UPDATE gmail_tokens SET access_token=$2, expires_at=to_timestamp($3), atualizado_em=now() WHERE tenant_id=$1',
      [tenantId, newAccessToken, newExpiry]
    );
    oauth2.setCredentials({ access_token: newAccessToken, refresh_token: row.refresh_token });
  }

  return google.gmail({ version: 'v1', auth: oauth2 });
}

/** Converte MensagemSaida para MIME e envia via Gmail API. */
export class GmailAdapter implements CommunicationChannel {
  constructor(
    private ctx: Client,
    private tenantId: string,
    private cfg: GmailConfig,
    private remetente: string = 'assistente@servium.local'
  ) {}

  async enviar(msg: MensagemSaida): Promise<ResultadoEnvio> {
    let gmail: gmail_v1.Gmail;
    try {
      gmail = await getValidClient(this.ctx, this.tenantId, this.cfg);
    } catch (err) {
      return { ok: false, erro: String((err as Error).message ?? err) };
    }

    const mime = [
      `To: ${msg.destinatario}`,
      `From: ${this.remetente}`,
      `Subject: ${msg.assunto}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      msg.corpo,
    ].join('\r\n');

    const encoded = Buffer.from(mime).toString('base64url');

    let attempt = 0;
    let lastError: unknown;
    while (attempt < MAX_RETRIES) {
      try {
        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encoded },
        });
        const messageId = res.data.id ?? undefined;

        // idempotência: persistir message_id ANTES de retornar ao chamador
        if (messageId) {
          await this.ctx.query(
            `INSERT INTO mensagens_gmail (tenant_id, gmail_message_id, direcao, subject, destinatario)
             VALUES ($1,$2,'envio',$3,$4)
             ON CONFLICT DO NOTHING`,
            [this.tenantId, messageId, msg.assunto, msg.destinatario]
          );
        }
        return { ok: true, messageId };
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { code?: number }).code;
        if (status === 429 || (typeof status === 'number' && status >= 500)) {
          attempt++;
          await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt - 1)));
          continue;
        }
        return { ok: false, erro: String((err as Error).message ?? err) };
      }
    }
    return { ok: false, erro: `rate limit/erro persistente após ${MAX_RETRIES} tentativas: ${String(lastError)}` };
  }

  /** Receber mensagens novas do Gmail (polling simples). */
  async receber(query: string = 'is:unread newer_than:1d'): Promise<Array<{
    gmailMessageId: string;
    gmailThreadId: string | undefined;
    subject: string;
    snippet: string;
    headers: Record<string, string>;
  }>> {
    const gmail = await getValidClient(this.ctx, this.tenantId, this.cfg);
    const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 20 });
    const messages = list.data.messages ?? [];
    const results = [];
    for (const m of messages) {
      if (!m.id) continue;
      const full = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'X-Correlation-Token'] });
      const headers: Record<string, string> = {};
      for (const h of full.data.payload?.headers ?? []) {
        if (h.name && h.value) headers[h.name.toLowerCase()] = h.value;
      }
      // persistência idempotente
      await this.ctx.query(
        `INSERT INTO mensagens_gmail (tenant_id, gmail_message_id, gmail_thread_id, direcao, subject, snippet, destinatario)
         VALUES ($1,$2,$3,'recebimento',$4,$5,$6)
         ON CONFLICT DO NOTHING`,
        [this.tenantId, m.id, m.threadId ?? null, headers['subject'] ?? null, full.data.snippet ?? null, headers['to'] ?? null]
      );
      results.push({
        gmailMessageId: m.id,
        gmailThreadId: m.threadId ?? undefined,
        subject: headers['subject'] ?? '',
        snippet: full.data.snippet ?? '',
        headers,
      });
    }
    return results;
  }
}
