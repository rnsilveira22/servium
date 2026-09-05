/**
 * SRV-17 · Decisão humana sobre item em exceção (CA-03) atômica:
 * UPDATE do item + fechamento da exceção + evento de auditoria transacionam juntos.
 * Extraída do controller para permitir injeção de falha nos testes de integração.
 */
import { BadRequestException } from '@nestjs/common';
import type { Client } from 'pg';

export type DesfechoItem = 'resolvido' | 'cancelado';

export interface DecidirItemCtx {
  tenantId: string;
  operadorId: string;
}

export async function decidirItem(
  client: Client,
  ctx: DecidirItemCtx,
  itemId: string,
  desfecho: DesfechoItem
): Promise<void> {
  await client.query('BEGIN');
  try {
    const upd = await client.query(
      `UPDATE itens_ciclo SET estado=$2, atualizado_em=now()
        WHERE id=$1 AND estado='excecao' RETURNING id`,
      [itemId, desfecho]
    );
    if (upd.rowCount === 0) throw new BadRequestException('item não está em exceção');
    await client.query(
      `UPDATE excecoes SET desfecho=$2, decidido_por=$3, decidido_em=now()
        WHERE item_ciclo_id=$1 AND desfecho IS NULL`,
      [itemId, desfecho, ctx.operadorId]
    );
    await client.query(
      `INSERT INTO eventos_auditoria (tenant_id, actor_type, actor_id, entidade, entidade_id, acao, detalhes)
       VALUES ($1,'operador',$2,'item_ciclo',$3,'decidir',$4)`,
      [ctx.tenantId, ctx.operadorId, itemId, JSON.stringify({ desfecho })]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  }
}