import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Client } from 'pg';

import { enqueue } from '@servium/db';
import { RequireAuth, Roles, type AuthedRequest } from '../auth/auth.guard';

@Controller('ciclos')
@UseGuards(RequireAuth)
export class CiclosController {
  private pg(req: AuthedRequest): Client {
    return req.pg as Client;
  }

  /** Ponto formal de intervenção humana nº1: ativação do ciclo. */
  @Post()
  @Roles('admin', 'operador')
  async ativar(@Req() req: AuthedRequest, @Body() body: { obrigacao_id?: string }) {
    if (!body?.obrigacao_id) throw new BadRequestException('obrigacao_id obrigatório');
    const client = this.pg(req);
    const dono = await client.query('SELECT 1 FROM obrigacoes WHERE id=$1', [body.obrigacao_id]);
    if (dono.rowCount === 0) throw new BadRequestException('obrigação não encontrada neste tenant');

    const { rows } = await client.query<{ id: string; estado: string }>(
      `INSERT INTO ciclos (tenant_id, obrigacao_id, ativado_por) VALUES ($1,$2,$3) RETURNING id, estado`,
      [req.sessao!.tenantId, body.obrigacao_id, req.sessao!.operadorId]
    );
    const ciclo = rows[0]!;
    await enqueue(client, {
      tipo: 'ciclo.ativar',
      payload: { ciclo_id: ciclo.id },
      idempotencyKey: `ativar:${ciclo.id}`,
    });
    await enqueue(client, {
      tipo: 'ciclo.tick',
      payload: {},
      idempotencyKey: `tick:${ciclo.id}:0`,
    });
    await client.query(
      `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes)
       VALUES ($1,'operador',$2,'ciclo',$3,'ativar',$4)`,
      [req.sessao!.tenantId, req.sessao!.operadorId, ciclo.id, JSON.stringify({ obrigacao_id: body.obrigacao_id })]
    );
    return ciclo;
  }

  @Get()
  @Roles('admin', 'operador')
  async listar(@Req() req: AuthedRequest) {
    const { rows } = await this.pg(req).query(
      `SELECT c.id, c.estado, c.criado_em,
              o.descricao AS obrigacao, cli.nome AS cliente,
              count(i.id)::int AS itens,
              count(i.id) FILTER (WHERE i.estado='resolvido')::int AS resolvidos,
              count(i.id) FILTER (WHERE i.estado='excecao')::int AS excecoes
         FROM ciclos c
         LEFT JOIN itens_ciclo i ON i.ciclo_id=c.id
         JOIN obrigacoes o ON o.id=c.obrigacao_id
         JOIN clientes cli ON cli.id=o.cliente_id
        GROUP BY c.id, o.descricao, cli.nome
        ORDER BY c.criado_em DESC`
    );
    return rows;
  }

  /** Listar exceções abertas de um ciclo (CA-02). */
  @Get(':cicloId/excecoes')
  @Roles('admin', 'operador')
  async listarExcecoes(@Req() req: AuthedRequest, @Param('cicloId') cicloId: string) {
    const { rows } = await this.pg(req).query(
      `SELECT e.id, e.tipo, e.motivo, e.contexto, e.criado_em,
              i.id AS item_id, i.tentativas,
              it.descricao AS item_descricao,
              cli.nome AS cliente_nome
         FROM excecoes e
         JOIN itens_ciclo i ON i.id = e.item_ciclo_id
         LEFT JOIN itens_template it ON it.id = i.item_template_id
         JOIN ciclos c ON c.id = i.ciclo_id
         JOIN obrigacoes o ON o.id = c.obrigacao_id
         JOIN clientes cli ON cli.id = o.cliente_id
        WHERE c.id = $1 AND e.desfecho IS NULL
        ORDER BY e.criado_em DESC`,
      [cicloId]
    );
    return rows;
  }

  /** Intervenção humana nº2/3: resolver/cancelar item em exceção. */
  @Post('itens/:itemId/decidir')
  @Roles('admin')
  async decidirItem(@Req() req: AuthedRequest, @Param('itemId') itemId: string, @Body() body: { desfecho?: string }) {
    if (!['resolvido', 'cancelado'].includes(body?.desfecho ?? '')) {
      throw new BadRequestException("desfecho deve ser 'resolvido' ou 'cancelado'");
    }
    const client = this.pg(req);
    const upd = await client.query(
      `UPDATE itens_ciclo SET estado=$2, atualizado_em=now()
        WHERE id=$1 AND estado='excecao' RETURNING id`,
      [itemId, body.desfecho]
    );
    if (upd.rowCount === 0) throw new BadRequestException('item não está em exceção');
    await client.query(
      `UPDATE excecoes SET desfecho=$2, decidido_por=$3, decidido_em=now()
        WHERE item_ciclo_id=$1 AND desfecho IS NULL`,
      [itemId, body.desfecho, req.sessao!.operadorId]
    );
    await client.query(
      `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes)
       VALUES ($1,'operador',$2,'item_ciclo',$3,'decidir',$4)`,
      [req.sessao!.tenantId, req.sessao!.operadorId, itemId, JSON.stringify({ desfecho: body.desfecho })]
    );
    return { ok: true };
  }

  /** Intervenção humana nº2/3: reenviar (CA-06 — respeita limites configurados). */
  @Post('itens/:itemId/reenviar')
  @Roles('admin')
  async reenviarItem(@Req() req: AuthedRequest, @Param('itemId') itemId: string) {
    const client = this.pg(req);
    const { rows: item } = await client.query<{ ciclo_id: string }>(
      `SELECT ciclo_id FROM itens_ciclo WHERE id=$1 AND estado='excecao'`,
      [itemId]
    );
    if (item.length === 0) throw new BadRequestException('item não está em exceção');

    await client.query('BEGIN');
    try {
      // fecha exceção aberta com desfecho reenviado
      await client.query(
        `UPDATE excecoes SET desfecho='reenviado', decidido_por=$2, decidido_em=now()
          WHERE item_ciclo_id=$1 AND desfecho IS NULL`,
        [itemId, req.sessao!.operadorId]
      );
      // volta ao fluxo motor (aguardando); motor decide se cobra ou escala novamente
      await client.query(
        `UPDATE itens_ciclo SET estado='aguardando', atualizado_em=now() WHERE id=$1`,
        [itemId]
      );
      await client.query(
        `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes)
         VALUES ($1,'operador',$2,'item_ciclo',$3,'reenviar','{}'::jsonb)`,
        [req.sessao!.tenantId, req.sessao!.operadorId, itemId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
    // enfileira tick para processar o item reenviado
    await enqueue(client, {
      tipo: 'ciclo.tick',
      payload: { ciclo_id: item[0]!.ciclo_id },
      idempotencyKey: `tick-reenvio:${itemId}:${Date.now()}`,
    });
    return { ok: true };
  }
}
