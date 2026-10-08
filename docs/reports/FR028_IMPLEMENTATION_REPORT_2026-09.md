# FR-028 — Auditoria Operacional · Relatório de Implementação

> **Data:** 2026-09-23 · **Base:** `6d02dce` (FR-020/FR-021) · **Branch:** `feat/hg-007-google-cloud-preparation`
> **Tipo:** Implementação (código + testes + documentação, mesmo ciclo — Documentation Sync Rule)
> **Fluxo:** PROMPT FACTORY V2 — FASE A (diagnóstico) → FASE B (plano, **aprovado pelo usuário**) → FASE C (implementação) → FASE D (testes) → FASE E (documentação) → FASE F (handoff)

## 1. Objetivo

Transformar a auditoria técnica (`eventos_auditoria` + `GET /auditoria`) em uma **camada operacional** que responde às perguntas de FR-028: o que aconteceu, quem executou, qual agente, para qual cliente, quando, qual resultado, o que mudou, houve intervenção humana/erro/exceção — **sem criar infraestrutura paralela de auditoria, sem inventar dados e sem implementar FR-027/FR-026/FR-022/FR-025/FR-023/FR-024**.

## 2. Restrições respeitadas (FR-028 §7/§8/§13)

| Restrição | Tratamento |
|---|---|
| Reusar `eventos_auditoria` + `GET /auditoria` | ✅ nenhuma tabela/logger/worker novo |
| Sem endpoint de mutação | ✅ controller permanece `@Get()` apenas; provado 404 p/ POST/PUT/DELETE no teste |
| Append-only preservado | ✅ `REVOKE UPDATE, DELETE` intacto; `UPDATE` testado → `permission denied` |
| Admin-only (RBAC) | ✅ `@Roles('admin')` intacto; `operador` → 403 (testado) |
| Keyset paginação preservado | ✅ `antes_de+antes_id` mantido e testado com a camada operacional |
| Não inventar dados | ✅ dado ausente → `null`/`[]` (evento de atividade sem cliente; eventos `ciclo`/`item_ciclo` sem atividade) |
| Novos agentes | ✅ **fora do escopo** — usado apenas o agente existente aprovado |

## 3. Diagnóstico (FASE A) — divergência encontrada

O inventário `EVENTOS_AUDITORIA.md` documentava **20 ações / 28 linhas de emissão**, mas o código real tinha **21 ações / 29 linhas**: faltava `vincular_email_template` (entidade `checklist_template`, emitida em `apps/api/src/cadastro/cadastro.controller.ts:225` — método `vincularTemplate`, `POST /checklist-templates/:id/email-template`, via helper `cadastro/audit.ts`). O evento **já existia na base `c06f4f7`**; apenas o documento estava incompleto. Correção documental no mesmo ciclo (§7).

## 4. Implementação (FASE C)

### 4.1 Camada de dados — `packages/db/src/audit.ts`

`FiltrosEventos` ganhou novos filtros (contrato `EventoAuditoriaDTO` intocado):

| Filtro | SQL |
|---|---|
| `desde` | `criado_em >= $n::timestamptz` |
| `ate` | `criado_em <= $n::timestamptz` |
| `actorType` | `actor_type = $n` |
| `clienteId` | subquery `UNION` por `itens_ciclo`/`ciclos`/`obrigacoes`/`clientes` com JOIN e RLS FORCE — resolve o cliente mesmo quando o evento referencia `item_ciclo`, `ciclo`, `obrigacao` ou `cliente` diretamente |

O filtro `cliente_id` **não** inclui eventos `atividade`: atividades são `todos_ativos` (multi-cliente), não específicas de um cliente — comportamento honesto e testado. Eventos `ciclo`/`item_ciclo` não têm vínculo determinístico com atividade (FR-022/FR-027 futuro) → `operacional.atividade = null`.

### 4.2 Presenter — `apps/api/src/auditoria/presenter.ts` (novo)

- Mapa com **todas as 29 combinações** `entidade:acao` do inventário corrigido (21 ações);
- Para cada evento deriva: `titulo`, `resultado`, `severidade` (`error`/`alert`/`excecao`/`pendente`/`info`/`success`), `excecao`, `intervencaoHumana` (`actor_type === 'operador'`), `descricao` e `alteracoes` (data-driven por `detalhes`);
- `agenteDoEvento`: `operador` → nome do ator (enriquecido), `servico` → **"Estagiária Digital"** (nome aprovado na HG-APROVAÇÃO-NOMENCLATURA, rótulo de produto), `sistema` → "Sistema";
- `FALLBACK` para combinação desconhecida ("Evento registrado") — extensível, nunca inventa.

### 4.3 Controller — `apps/api/src/auditoria/auditoria.controller.ts`

- Novos query params: `desde`, `ate` (com validação `desde ≤ ate` → 400), `actor_type` (validado em `{sistema, operador, servico}` → 400), `cliente_id` (UUID validado → 400);
- `enriquecerContexto`: resolve `cliente`/`atividade` em **lote** (`ANY`), sem N+1, com JOINs seguros (todas as tabelas de destino têm RLS FORCE — nunca vaza outro tenant);
- Resposta aditiva: `{ eventos: [... EventoAuditoriaOperacional], tem_mais }`, onde cada evento tem `operacional = interpretarEventoOperacional(...)`;
- Correção de bug: contexto indexado por `entidade_id` (era `e.id`, id do evento).

### 4.4 Frontend — `apps/web/src/pages/AuditoriaPage.tsx`

Reescrita: **Auditoria Operacional**. Filtros reais (`desde`/`ate`, tipo de evento, atividade, cliente, agente — aplicados via `Aplicar`, sem fetch a cada tecla), cards operacionais (hora+data local, título, badge de severidade, meta cliente/atividade/agente/resultado, chips de alterações), `<details>` técnico por evento (entidade·ação, id, ator, quando), "Carregar mais" via keyset, estados loading/empty/error (sem stack trace). `MetricasTecnicas` preservado em `<details>` "Métricas e saúde do sistema". Classes novas em `apps/web/src/App.css`.

## 5. Testes (FASE D)

| Suíte | Resultado |
|---|---|
| `apps/api/test/auditoria-operacional.test.ts` (novo, 18 casos) | ✅ presenter (7 unit) + filtros `desde`/`ate`/`actor_type`/`cliente_id` + enriquecimento + isolamento cross-tenant + RBAC 403 + sem rotas de mutação (404) + `UPDATE` rejeitado + keyset |
| `apps/web/src/pages/AuditoriaPage.test.tsx` (novo, 7 casos) | ✅ render operacional, dado ausente não exibido, filtro no backend, validação período, vazio, erro sem stack, paginação/detalhe |
| Suítes completas | API **203 passed** (era 185) · Web **56 passed** (era 49) · DB **24 passed** · shared-types **2 passed** |
| Build/typecheck/lint | ✅ `npm run build` (API/Web/DB) · `npx eslint` ambos · `npm run lint:docs` 0 issues (134 arquivos) |

## 6. Critérios de aceite FR-028 (CA-028-01..) — evidências

| Critério | Evidência |
|---|---|
| Eventos em linguagem operacional (não log GET/POST) | `presenter.ts` + `AuditoriaPage.tsx` (títulos/resultados operacionais; sem verbos HTTP) |
| Correlação agente→cliente→ação→resultado→intervenção humana | `operacional.{agente,cliente,atividade,resultado,intervencaoHumana}`; testes `cobrar`/`decidir`/`atividade` |
| Log técnico separado (admin) | `<details> Detalhes técnicos` por evento + m4tricas/saúde em `<details>` |
| Filtros por período/agente/cliente/atividade | testados (API + UI) |
| Não inventar dados | `null`/`[]` para ausentes; fallback explícito |
| RBAC/RLS/append-only intactos | testados |

## 7. Documentação atualizada (FASE E)

| Documento | Mudança |
|---|---|
| `docs/audit/EVENTOS_AUDITORIA.md` | Inventário §3 → **21 ações · 29 linhas** (+linha `vincular_email_template`); §5 com novos filtros + camada `operacional`; mapa de evidências + testes FR-028 |
| `docs/product/TRACEABILITY_MATRIX.md` | FR-028 → ✅ (código + teste + doc) |
| `docs/product/FUNCTIONAL_REQUIREMENTS.md` | FR-028 status ✅ IMPLEMENTADO + pendências → FR-027 |
| `docs/reports/DOCUMENTATION_SYNC_REPORT_V2_2026-09.md` | Nota de revisão explicando correção 21/29 |

## Documentation Impact

```text
Documents reviewed:   EVENTOS_AUDITORIA.md, TRACEABILITY_MATRIX.md, FUNCTIONAL_REQUIREMENTS.md,
                      DOCUMENTATION_SYNC_REPORT_V2_2026-09.md, AI_CONTEXT.md (path real)
Documents updated:    EVENTOS_AUDITORIA.md, TRACEABILITY_MATRIX.md, FUNCTIONAL_REQUIREMENTS.md,
                      DOCUMENTATION_SYNC_REPORT_V2_2026-09.md, este relatório
No documentation changes required: não — auditoria operacional altera contrato de API (camada
                      operacional aditiva + novos filtros) e a UX da página de auditoria
Architectural decision required:   NO (camada de apresentação; sem decisão de arquitetura nova —
                      reuso do padrão presentacional já usado na API)
ADR affected:         N/A
```

## 8. Pendências e próximos passos

- **Filtros SQL de resultado/exceção/intervenção humana** → **FR-027** (hoje expostos como label/severidade na UI; filtro SQL não implementado por escopo e honestidade de dados);
- **Timeline operacional por atividade** → **FR-027** (dados existem; falta camada de apresentação correlacionando atividade → sequência de eventos);
- Runtime de jobs (`npm run runtime`) fora do escopo (jobs presos em `processando`).
