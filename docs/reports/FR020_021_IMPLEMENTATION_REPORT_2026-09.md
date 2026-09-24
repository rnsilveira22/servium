# ServiumIA — Implementação FR-020 (Atividade Operacional) + FR-021 (Agente Executor)

> **Data:** 2026-09-23 · **Autor:** Agente opencode (Designer da Fábrica)
> **Processo:** PROMPT MESTRE V2 FACTORY V2 — Fases A→F · **Status final:** FR-020 ✅ Implementado · FR-021 ✅ Implementado
> **Human Gates:** nenhum gate aprovado/alterado; nenhuma decisão de produto substituída por este agente

---

## 1. Implementação (resumo)

| Recurso | Entrega | Arquivos |
|---|---|---|
| **DB** | Migration `0014_atividades_agentes.sql`: entidade `atividades` (por tenant, RLS, `comportamento` jsonb, status ativa/inativa, timestamps) + catálogo `agentes` (por tenant, RLS, seed automático via trigger `trg_agentes_seed`, `ON DELETE CASCADE`) | `packages/db/migrations/0014_atividades_agentes.sql` |
| **API** | `GET /agentes` (catálogo do tenant p/ seletor) + `POST/GET/GET:id/PUT /atividades` + `POST /atividades/:id/ativar` e `/desativar` + auditoria `cadastro/audit.ts` (entidade `atividade`: `criar`, `atualizar`, `ativar`, `desativar`) | `apps/api/src/cadastro/agentes.controller.ts`, `apps/api/src/cadastro/atividades.controller.ts`, `apps/api/src/cadastro/cadastro.module.ts` |
| **Contratos** | DTOs `AgenteDTO`, `CriarAtividadeInput`, `AtividadeDTO` + constantes `PERIODICIDADES_ATIVIDADE`, `COMPORTAMENTOS_ATIVIDADE`, `COMPORTAMENTO_PADRAO_ATIVIDADE`, `ESCOPOS_ATIVIDADE` | `packages/shared-types/src/index.ts` |
| **Frontend** | `AtividadesPage.tsx` (lista + criar/editar de forma inline com seletor de agente, checklist, periodicidade, prazo, checkboxes de comportamento, alternar ativar/desativar) + rota `/atividades` + item de navegação "Atividades" | `apps/web/src/pages/AtividadesPage.tsx`, `apps/web/src/App.tsx`, `apps/web/src/layout/Layout.tsx`, `apps/web/src/App.css` |

## 2. Status dos requisitos

| Requisito | Status | Evidência |
|---|---|---|
| **FR-020 · Atividade operacional recorrente** | ✅ **Implementado** | `apps/api/test/atividades.test.ts` (7✓); UI em `AtividadesPage.tsx`; entidade `atividades` persistida com periodicidade, escopo `todos_ativos`, agente, canal, prazo, checklist e comportamento. **Ponto de extensão declarado:** geração automática de execuções por período (FR-022) — não implementada nesta rodada, conforme PROMPT (sem scheduler novo) |
| **FR-021 · Seleção do agente executor** | ✅ **Implementado** | Catálogo `agentes` por tenant (seed `estagiaria-digital` via trigger); `atividades.agente_id` referencia por FK (**sem hardcode**); seletor no front alimentado por `GET /agentes`; agente inativo rejeitado; agentes futuros não criados (extensibilidade apenas) |

## 3. Mudanças de banco de dados

- Nova tabela `agentes` (*catálogo por tenant*): `tenant_id NOT NULL` + RLS `tenant_isolation` + GRANT SELECT + índice único `(tenant_id, slug)` + seed via trigger `trg_agentes_seed` (AFTER INSERT em `tenants`) e backfill da migration.
- Nova tabela `atividades` (*por tenant*): RLS `tenant_isolation` deny-by-default + GRANT CRUD + índice `(tenant_id, status)` + trigger `trg_atividades_atualizado_em`.
- `agentes.tenant_id` e `atividades.tenant_id` com **ON DELETE CASCADE** (dados do ciclo de vida do tenant — ver ADR-005 adendo).
- Índice `uq_agentes_tenant_slug ON agentes(tenant_id, slug)`.

## 4. Mudanças de API

| Endpoint | Método | Comportamento |
|---|---|---|
| `/agentes` | GET | Catálogo de agentes ativos do tenant (leitura) |
| `/atividades` | GET | Lista atividades do tenant com `agente_nome`/`agente_slug` e `checklist_template_nome` |
| `/atividades` | POST | Cria atividade (validações: nome, periodicidade, escopo, agente existente/ativo no tenant, checklist do mesmo tenant, `prazo_dias` inteiro positivo; comportamento mesclado sobre default) |
| `/atividades/:id` | GET | Detalhe (404 fora do tenant — RLS + filtro) |
| `/atividades/:id` | PUT | Atualização parcial (COALESCE; explicit null desvincula checklist) |
| `/atividades/:id/ativar` · `/:id/desativar` | POST | Alterna `status`; auditado |

Auditoria: ações `criar`, `atualizar`, `ativar`, `desativar` na entidade `atividade` (helper `cadastro/audit.ts`, pós-COMMIT — limite de atomicidade honestamente declarado, coerente com `EVENTOS_AUDITORIA.md` §3).

## 5. Mudanças de frontend

- `AtividadesPage.tsx`: formulário de criação (nome, descrição, periodicidade, seletor de **agente executor**, prazo em dias, checklist, checkboxes de comportamento, escopo fixo "Todos os clientes ativos"), edição inline por linha e botões **Ativar/Desativar**.
- Rota `/atividades` em `App.tsx` e item **Atividades** no menu (`Layout.tsx`).
- Estilos mínimos adicionados em `App.css` (`.checkbox-group`, `.checkbox-line`, `.text-sm`).

## 6. Testes

| Suíte | Resultado | Observação |
|---|---|---|
| `apps/api/test/atividades.test.ts` (novo) | 7/7 ✓ | CRUD, validações, agente inativo rejeitado, ativar/desativar, auditoria presente, isolamento RLS A×B, checklist cross-tenant rejeitado, 401 anônimo |
| API (suíte completa) | **185 passed** · 2 skipped | 28 arquivos, 1 file skip |
| Web (suíte completa) | **49 passed** | inclui `AtividadesPage.test.tsx` (3✓) |
| DB (suíte completa) | **24 passed** | exclui contratos SRV-7 (agentes cumpriu tenant_id+RLS) |
| `shared-types` | 2/2 ✓ | |
| Build + typecheck + eslint (apenas diffs) | ✓ | `lint:docs` 0 issues |

## 7. Documentação atualizada (mesmo ciclo)

| Documento | Mudança |
|---|---|
| `docs/product/TRACEABILITY_MATRIX.md` | FR-020 e FR-021 → ✅ com código/teste reais |
| `docs/product/FUNCTIONAL_REQUIREMENTS.md` | Nota da seção + status de FR-020/021 → ✅ implementado |
| `docs/audit/EVENTOS_AUDITORIA.md` | Inventário §3 → **20 ações · 28 linhas de emissão** (+`atividade`: `criar`, `atualizar`, `ativar`, `desativar`) |
| `docs/decisions/ADR-005-tenant-strategy.md` | Adendo FR-021 (catálogo de agentes **por tenant** com seed via trigger; CASCADE; validação de FK+RLS) |
| `docs/GLOSSARY.md` | Termos Atividade/Agente Executor/Estagiária Digital com nota de implementação |
| `docs/reports/DOCUMENTATION_SYNC_REPORT_V2_2026-09.md` | Nota de atualização (contagem do inventário) |

## 8. Traceability

`TRACEABILITY_MATRIX.md`: FR-020 → ✅ (`atividades.controller.ts`, `AtividadesPage.tsx`, `atividades.test.ts`); FR-021 → ✅ (`agentes.controller.ts`, migration 0014, `identidade-servico.test.ts` preservado p/ `actor_type=servico`).

## 9. ADR Impact

**ADR-005** recebeu adendo (sem novo ADR): catálogo de agentes é entidade de negócio por tenant; a alternativa de catálogo global do produto foi rejeitada em favor da invariante de RLS da ADR. **Nenhuma outra ADR alterada.**

## 10. Human Gate Impact

Nenhum gate aprovado nem alterado por este agente, **exceto um registro de aprovação confirmada pelo usuário em 2026-09-23**:

| Gate | Status | Registro |
|---|---|---|
| **HG-APROVAÇÃO-NOMENCLATURA** (nome do primeiro agente executor) | ✅ **APPROVED** (humano, 2026-09-23) | "Estagiária Digital" adotado como nome funcional; *Assistente Digital de Pendências Documentais* = capacidade. Gravado em `FUNCTIONAL_REQUIREMENTS.md` e `FIRST_DIGITAL_EMPLOYEE.md` |

Demais assuntos seguem `AWAITING_DECISION`: HG-APROVAÇÃO-ESCOPO-EVOLUÇÃO, HG-M1-FRENTE-A (PR da `feat/m1-frente-a-pleno`), HG-FECHAMENTO-CORRECAO-UI (commit/descarte de `ObrigacoesPage.tsx`), HG-PATH-AGENTS, HG-RETENÇÃO, HG-007.

## 11. Limitações conhecidas

- **FR-022 (execução/recorrência) não implementada** — `periodicidade` é configuração armazenada; a engine de execução é o próximo bloco (por decisão do usuário).
- Escopo implementado é exclusivamente `todos_ativos` (CHECK na coluna); seleção individual de clientes exige decisão de produto + migration.
- Auditoria `criar`/`atualizar` da atividade é pós-COMMIT (não atômica) — igual aos demais CRUDs do cadastro; documentado em `EVENTOS_AUDITORIA.md`.
- `GET /agentes` e o seletor dependem do seed por tenant; tenants existentes foram cobertos por backfill da migration (verificado: todos os 5 tenants com `estagiaria-digital`).

## 12. Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Extrapolação de escopo (FR futuros) | Alta | Seguido estritamente o PROMPT: nada de FR-022/023/024/025/026/027/028 nesta rodada |
| Agentes futuros "vazarem" como hardcode | Média | Referência por FK; catálogo extensível via seed; sem string fixa no fluxo |
| Inventário de auditoria desatualizar | Média | Atualizado no mesmo ciclo; regra de sync obriga revisão no PR |
| UI de comparação (ModelosEmail) divergir do padrão | Baixa | Página espelha padrões existentes (Field/Table/Button) |

## 13. Próximo passo

Conforme sequência aprovada pelo usuário: **FR-028 (auditoria operacional)** → FR-027 (timeline) → FR-022 (periodicidade/competência) → FR-026 (dashboard) → Pós-MVP (FR-023/024).
