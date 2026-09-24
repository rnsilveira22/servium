import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Client } from 'pg';

import {
  COMPORTAMENTO_PADRAO_ATIVIDADE,
  COMPORTAMENTOS_ATIVIDADE,
  ESCOPOS_ATIVIDADE,
  PERIODICIDADES_ATIVIDADE,
  type AtividadeDTO,
  type CriarAtividadeInput,
  type ComportamentoAtividadeMap,
} from '@servium-ia/shared-types';
import { RequireAuth, type AuthedRequest } from '../auth/auth.guard';
import { auditar } from './audit';

function texto(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

const SELECT_ATIVIDADE = `
  SELECT a.id, a.nome, a.descricao, a.periodicidade, a.escopo,
         a.agente_id, ag.nome AS agente_nome, ag.slug AS agente_slug,
         a.canal, a.prazo_dias, a.checklist_template_id, c.nome AS checklist_template_nome,
         a.comportamento, a.status, a.criado_em::text AS criado_em, a.atualizado_em::text AS atualizado_em
    FROM atividades a
    LEFT JOIN agentes ag ON ag.id = a.agente_id
    LEFT JOIN checklist_templates c ON c.id = a.checklist_template_id
`;

function comportamentoValido(v: unknown): v is { [k: string]: boolean } {
  if (typeof v !== 'object' || v === null || Object.keys(v).length === 0) return false;
  for (const [k, val] of Object.entries(v)) {
    if (!COMPORTAMENTOS_ATIVIDADE.includes(k as (typeof COMPORTAMENTOS_ATIVIDADE)[number])) return false;
    if (typeof val !== 'boolean') return false;
  }
  return true;
}

function comportamentoMesclado(parcial: unknown): ComportamentoAtividadeMap {
  const base: ComportamentoAtividadeMap = { ...COMPORTAMENTO_PADRAO_ATIVIDADE };
  if (parcial === undefined || parcial === null) return base;
  if (!comportamentoValido(parcial)) {
    throw new BadRequestException(
      `comportamento deve mapear ${COMPORTAMENTOS_ATIVIDADE.join(', ')} para true/false`
    );
  }
  return { ...base, ...parcial };
}

@Controller('atividades')
@UseGuards(RequireAuth)
export class AtividadesController {
  private pg(req: AuthedRequest): Client {
    return req.pg as Client;
  }

  private async existeNoTenant(req: AuthedRequest, id: string): Promise<boolean> {
    const { rows } = await this.pg(req).query('SELECT 1 FROM atividades WHERE id=$1 AND tenant_id=$2', [
      id,
      req.sessao!.tenantId,
    ]);
    return rows.length > 0;
  }

  /** Valida agente ATIVO do catálogo do MESMO tenant (FK ignoraria RLS). */
  private async validarAgente(req: AuthedRequest, agenteId: unknown): Promise<string> {
    if (!texto(agenteId)) throw new BadRequestException('agente_id obrigatório');
    const client = this.pg(req);
    const { rows } = await client.query<{ id: string; ativo: boolean }>(
      'SELECT id, ativo FROM agentes WHERE id=$1 AND tenant_id=$2',
      [agenteId, req.sessao!.tenantId]
    );
    if (rows.length === 0) throw new BadRequestException('agente não encontrado no catálogo');
    if (!rows[0]!.ativo) throw new BadRequestException('agente inativo não pode ser atribuído');
    return agenteId;
  }

  /** Checklocks existentes apenas dentro do próprio tenant (FK ignora RLS). */
  private async validarChecklist(req: AuthedRequest, checklistId: unknown): Promise<string | null> {
    if (checklistId === undefined || checklistId === null || checklistId === '') return null;
    if (!texto(checklistId)) throw new BadRequestException('checklist_template_id inválido');
    const { rows } = await this.pg(req).query('SELECT 1 FROM checklist_templates WHERE id=$1', [checklistId]);
    if (rows.length === 0) {
      throw new NotFoundException('checklist não encontrado neste tenant');
    }
    return checklistId;
  }

  private async validarPrazo(prazo: unknown): Promise<number | null> {
    if (prazo === undefined || prazo === null || prazo === '') return null;
    const n = Number(prazo);
    if (!Number.isInteger(n) || n <= 0) throw new BadRequestException('prazo_dias deve ser um inteiro positivo');
    return n;
  }

  @Get()
  async listar(@Req() req: AuthedRequest): Promise<AtividadeDTO[]> {
    const { rows } = await this.pg(req).query<AtividadeDTO>(
      `${SELECT_ATIVIDADE} WHERE a.tenant_id=$1 ORDER BY a.criado_em DESC`,
      [req.sessao!.tenantId]
    );
    return rows;
  }

  @Get(':id')
  async detalhar(@Req() req: AuthedRequest, @Param('id') id: string): Promise<AtividadeDTO> {
    const { rows } = await this.pg(req).query<AtividadeDTO>(
      `${SELECT_ATIVIDADE} WHERE a.tenant_id=$1 AND a.id=$2`,
      [req.sessao!.tenantId, id]
    );
    if (rows.length === 0) throw new NotFoundException('atividade não encontrada');
    return rows[0]!;
  }

  @Post()
  async criar(@Req() req: AuthedRequest, @Body() body: CriarAtividadeInput): Promise<AtividadeDTO> {
    if (!texto(body?.nome)) throw new BadRequestException('nome obrigatório');
    if (body.periodicidade !== undefined && !PERIODICIDADES_ATIVIDADE.includes(body.periodicidade)) {
      throw new BadRequestException(`periodicidade deve ser um de ${PERIODICIDADES_ATIVIDADE.join(', ')}`);
    }
    if (body.escopo !== undefined && !ESCOPOS_ATIVIDADE.includes(body.escopo as never)) {
      throw new BadRequestException(`escopo deve ser um de ${ESCOPOS_ATIVIDADE.join(', ')}`);
    }

    const client = this.pg(req);
    const agenteId = await this.validarAgente(req, body.agente_id);
    const checklistId = await this.validarChecklist(req, body.checklist_template_id ?? null);
    const prazo = await this.validarPrazo(body.prazo_dias);
    const comportamento = comportamentoMesclado(body.comportamento);

    const { rows } = await client.query<AtividadeDTO>(
      `INSERT INTO atividades (tenant_id, nome, descricao, periodicidade, escopo, agente_id, canal, prazo_dias, checklist_template_id, comportamento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        req.sessao!.tenantId,
        body.nome.trim(),
        body.descricao?.trim() || null,
        body.periodicidade ?? 'mensal',
        body.escopo ?? 'todos_ativos',
        agenteId,
        body.canal?.trim() || 'email',
        prazo,
        checklistId,
        JSON.stringify(comportamento),
      ]
    );
    const id = rows[0]!.id;

    const { rows: criada } = await client.query<AtividadeDTO>(
      `${SELECT_ATIVIDADE} WHERE a.id=$1`,
      [id]
    );
    const atividade = criada[0]!;
    await auditar(client, req.sessao!.tenantId, req.sessao!.operadorId, 'atividade', atividade.id, 'criar', {
      nome: atividade.nome,
      agente_nome: atividade.agente_nome,
    });
    return atividade;
  }

  @Put(':id')
  async atualizar(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: Partial<CriarAtividadeInput>
  ): Promise<AtividadeDTO> {
    if (!(await this.existeNoTenant(req, id))) throw new NotFoundException('atividade não encontrada');

    const client = this.pg(req);
    const nome =
      body.nome === undefined ? undefined : texto(body.nome) ? body.nome.trim() : undefined;
    if (body.periodicidade !== undefined && !PERIODICIDADES_ATIVIDADE.includes(body.periodicidade)) {
      throw new BadRequestException(`periodicidade deve ser um de ${PERIODICIDADES_ATIVIDADE.join(', ')}`);
    }
    if (body.escopo !== undefined && !ESCOPOS_ATIVIDADE.includes(body.escopo as never)) {
      throw new BadRequestException(`escopo deve ser um de ${ESCOPOS_ATIVIDADE.join(', ')}`);
    }
    const agenteId = body.agente_id !== undefined ? await this.validarAgente(req, body.agente_id) : undefined;
    const checklistId = body.checklist_template_id !== undefined
      ? await this.validarChecklist(req, body.checklist_template_id ?? null)
      : undefined;
    const prazo = body.prazo_dias !== undefined ? await this.validarPrazo(body.prazo_dias) : undefined;
    const comportamento =
      body.comportamento !== undefined ? comportamentoMesclado({ ...COMPORTAMENTO_PADRAO_ATIVIDADE, ...body.comportamento }) : undefined;

    const campos = Object.keys(body).filter(
      (k) => body[k as keyof Partial<CriarAtividadeInput>] !== undefined && k !== 'comportamento'
    );
    if (
      nome === undefined && campos.length === 0 && comportamento === undefined
    ) {
      throw new BadRequestException('nada a atualizar');
    }

    const checklistUndefined = body.checklist_template_id === undefined;
    const checklistParaGravar =
      body.checklist_template_id === null || body.checklist_template_id === '' ? null : checklistId;

    await client.query(
      `UPDATE atividades
          SET nome = COALESCE($3, nome),
              descricao = COALESCE($4, descricao),
              periodicidade = COALESCE($5, periodicidade),
              escopo = COALESCE($6, escopo),
              agente_id = COALESCE($7, agente_id),
              canal = COALESCE($8, canal),
              prazo_dias = COALESCE($9, prazo_dias),
              checklist_template_id = CASE
                WHEN $10 THEN COALESCE($11::uuid, checklist_template_id)
                ELSE $11
              END,
              comportamento = COALESCE($12, comportamento)
        WHERE id=$1 AND tenant_id=$2`,
      [
        id,
        req.sessao!.tenantId,
        nome ?? null,
        body.descricao === undefined ? null : body.descricao.trim() || null,
        body.periodicidade ?? null,
        body.escopo ?? null,
        agenteId ?? null,
        body.canal === undefined ? null : body.canal.trim() || 'email',
        prazo ?? null,
        checklistUndefined,
        checklistParaGravar,
        comportamento === undefined ? null : JSON.stringify(comportamento),
      ]
    );

    const { rows } = await client.query<AtividadeDTO>(
      `${SELECT_ATIVIDADE} WHERE a.tenant_id=$1 AND a.id=$2`,
      [req.sessao!.tenantId, id]
    );
    const atividade = rows[0]!;
    await auditar(client, req.sessao!.tenantId, req.sessao!.operadorId, 'atividade', id, 'atualizar', {
      campos: Object.keys(body).filter((k) => body[k as keyof Partial<CriarAtividadeInput>] !== undefined && k !== 'comportamento'),
      comportamento: body.comportamento !== undefined,
    });
    return atividade;
  }

  @Post(':id/ativar')
  async ativar(@Req() req: AuthedRequest, @Param('id') id: string): Promise<AtividadeDTO> {
    return this.alterarStatus(req, id, 'ativa');
  }

  @Post(':id/desativar')
  async desativar(@Req() req: AuthedRequest, @Param('id') id: string): Promise<AtividadeDTO> {
    return this.alterarStatus(req, id, 'inativa');
  }

  private async alterarStatus(req: AuthedRequest, id: string, status: 'ativa' | 'inativa'): Promise<AtividadeDTO> {
    const client = this.pg(req);
    const { rows } = await client.query<AtividadeDTO>(
      `UPDATE atividades SET status=$3
        WHERE id=$1 AND tenant_id=$2
        RETURNING id`,
      [id, req.sessao!.tenantId, status]
    );
    if (rows.length === 0) throw new NotFoundException('atividade não encontrada');

    const { rows: atualizada } = await client.query<AtividadeDTO>(
      `${SELECT_ATIVIDADE} WHERE a.tenant_id=$1 AND a.id=$2`,
      [req.sessao!.tenantId, id]
    );
    await auditar(client, req.sessao!.tenantId, req.sessao!.operadorId, 'atividade', id, status === 'ativa' ? 'ativar' : 'desativar', {});
    return atualizada[0]!;
  }
}