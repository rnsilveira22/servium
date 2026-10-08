import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Client } from 'pg';

import type { AgenteDTO } from '@servium-ia/shared-types';
import { RequireAuth, type AuthedRequest } from '../auth/auth.guard';

/**
 * FR-021 · Catálogo de Agentes Executores (configuração de domínio, global).
 * Leitura para o app autenticado alimentar o seletor de agente das atividades.
 * Escrita do catálogo é decisão de produto (seed/migration) — sem CRUD.
 */
@Controller('agentes')
@UseGuards(RequireAuth)
export class AgentesController {
  @Get()
  async listar(@Req() req: AuthedRequest): Promise<AgenteDTO[]> {
    const { rows } = await (req.pg as Client).query<AgenteDTO>(
      `SELECT id, slug, nome, descricao, capacidade, ativo, criado_em::text AS criado_em
         FROM agentes
        WHERE ativo = true
        ORDER BY nome`
    );
    return rows;
  }
}