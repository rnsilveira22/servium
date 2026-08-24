import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { Client } from 'pg';

import { APP_URL, ADMIN_URL } from '@servium/db';
import { RequireAuth, Roles, hashToken, type AuthedRequest, type RequestSession } from './auth.guard';

const SESSION_TTL_HOURS = 12;

function cookieFor(token: string, maxAgeSec: number): string {
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  return `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { slug?: string; email?: string; senha?: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { slug, email, senha } = body ?? {};
    if (!slug || !email || !senha) throw new UnauthorizedException();

    const admin = new Client({ connectionString: ADMIN_URL });
    await admin.connect();
    try {
      // lookup do operador: dados de credencial NUNCA cruzam RLS de tenant no login
      const { rows } = await admin.query(
        `SELECT o.id, o.tenant_id, o.senha_hash, o.papel
           FROM operadores o JOIN tenants t ON t.id = o.tenant_id
          WHERE t.slug = $1 AND lower(o.email) = lower($2) AND o.ativo`,
        [slug, email]
      );
      if (rows.length === 0) {
        // sem tenant conhecido não há FK válida p/ trilha; sinal vai ao log da aplicação.
        // Resposta idêntica à de senha errada ⇒ anti-enumeration (ASVS V2.5).
        throw new UnauthorizedException();
      }

      const op = rows[0];
      const { verify } = await import('@node-rs/argon2');
      const ok = await verify(op.senha_hash, senha).catch(() => false);
      if (!ok) {
        await this.auditar(admin, op.tenant_id, op.id, 'login_falha', { motivo: 'senha_invalida' });
        throw new UnauthorizedException();
      }

      const token = randomBytes(32).toString('hex'); // ASVS V3.1: 256-bit CSPRNG
      const app = new Client({ connectionString: APP_URL });
      await app.connect();
      await app.query("SELECT set_config('app.tenant_id', $1, false)", [op.tenant_id]);
      await app.query(
        `INSERT INTO sessoes (tenant_id, operador_id, token_hash, expira_em)
         VALUES ($1, $2, $3, now() + interval '${SESSION_TTL_HOURS} hours')`,
        [op.tenant_id, op.id, await hashToken(token)]
      );
      void app.end();

      await this.auditar(admin, op.tenant_id, op.id, 'login_sucesso', {});
      res.setHeader('Set-Cookie', cookieFor(token, SESSION_TTL_HOURS * 3600));
      return { papel: op.papel };
    } finally {
      void admin.end();
    }
  }

  @UseGuards(RequireAuth)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    const client = req.pg as Client;
    await client.query('UPDATE sessoes SET revogado_em = now() WHERE id = $1', [req.sessao!.sessaoId]);
    await this.auditarVia(client, req.sessao!, 'logout', {});
    res.setHeader('Set-Cookie', cookieFor('', 0));
    void client.end();
  }

  @UseGuards(RequireAuth)
  @Get('me')
  me(@Req() req: AuthedRequest) {
    const { operadorId, tenantId, papel } = req.sessao!;
    return { operadorId, tenantId, papel };
  }

  @UseGuards(RequireAuth)
  @Roles('admin')
  @Get('admin/ping')
  adminPing() {
    return { ok: true };
  }

  private async auditar(
    admin: Client,
    tenantId: string | null,
    operadorId: string | null,
    acao: string,
    detalhes: Record<string, unknown>
  ) {
    // eventos_auditoria é append-only p/ servium_app; login usa conexão admin
    // apenas para INSERT de auditoria de credencial (nunca para dados de negócio).
    await admin.query(
      `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes)
       VALUES ($1::uuid, 'operador', $2::uuid, 'auth', $2::uuid, $3, $4)`,
      [tenantId, operadorId, acao, detalhes]
    );
  }

  private async auditarVia(client: Client, s: RequestSession, acao: string, detalhes: Record<string, unknown>) {
    await client.query(
      `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes)
       VALUES ($1::uuid, 'operador', $2::uuid, 'auth', $2::uuid, $3, $4)`,
      [s.tenantId, s.operadorId, acao, detalhes]
    );
  }
}

export { hash };
