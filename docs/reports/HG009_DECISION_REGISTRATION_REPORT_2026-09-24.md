# HG-009 — Decision Registration Report

> Registro formal das decisões arquiteturais aprovadas no Human Gate **HG-009 — ADR-012 — Modelo de Atividades e Eventos Operacionais**.
> **Documento gerado em:** 2026-09-24 · **Tipo:** doc-only / governança.

## Platform / Model

- **Plataforma:** opencode (CLI) sobre repositório local Git `servium-ia`
- **Modelo:** big-pickle (opencode) — sessão assistida, com decisões humanas explícitas do decisor **Rodrigo (owner)**
- **Conformidade**: autonômia Nível 3 respeitada — nenhuma recomendação virou aprovação; nenhuma aprovação virou implementação.

## Branch

`feat/hg-007-google-cloud-preparation`

## Initial Commit

`0de4155` — `feat(api+web): FR-028 — auditoria operacional (presenter, filtros, UI em cards)`

## Human Decisions Recorded

Registradas formalmente (imutável: [`../factory/HUMAN_DECISIONS_LOG.md`](../factory/HUMAN_DECISIONS_LOG.md) §HG-009):

| Decisão | Resultado |
|---|---|
| **D1** · Naming | `eventos_operacionais` (entidade do histórico operacional); `atividades` **não** é renomeada |
| **D2** · Estrutura | **Opção A** — nova entidade `eventos_operacionais`, FK à cadeia Cliente → Obrigação → Ciclo → Item do Ciclo |
| **D2-B** · Auditoria | **B1 — dual-write atômico** (`eventos_operacionais` + `eventos_auditoria` na mesma transação) |
| **D3** · 1º corte | **8 eventos**: `ativar`, `escalar`, `cobrar`, `encerrar`, `decidir`, `reenviar`, `receber`, `cancelar`; `decisao`/`ativacao_sem_template` só na auditoria |
| **D4** · `atividades` | Manter como **configuração** de rotinas recorrentes (FR-020); vínculo execução→config = evolução futura (FR-022) |
| **D5** · UX | **Separação**: feed global depende de `eventos_operacionais`; timeline do ciclo independente (sobre `eventos_auditoria`/`mensagens_comunicacao`/`documentos`/`excecoes`) |
| **RBAC** · Feed | **RBAC-2** — admin + operator (operator: visão operacional; auditoria admin-only) |
| **cliente_id** | **Manter denormalizado** (FK p/ `clientes` + mecanismo de consistência com ciclo/item + RLS; duplicação consciente) |
| **Backfill** | **NOT APPROVED / NOT PLANNED** |
| **Implementação** | **NOT AUTHORIZED BY THIS GATE** |

## Documents Updated

- `docs/decisions/ADR-012-atividade-evento-model.md` — `Proposed` → `Accepted (HG-009 · 2026-09-24)` + seção **Human Decision — HG-009** + orientações de implementação + risks/consequências revisados (histórico da análise original preservado).
- `docs/decisions/README.md` — linha ADR-012 atualizada para `Accepted (HG-009)`.
- `docs/architecture/README.md` — nota ADR-012 atualizada; linha do MODEL review (decisões resolvidas).
- `docs/architecture/MODEL_ATIVIDADES_EVENTOS_REVIEW.md` — nota de status, §5.3 (`cliente_id` denormalizado), §8 (etapas 2–3 ✅), nova **§10 Resolução do gate humano (HG-009)**, referências cruzadas.
- `docs/factory/HUMAN_GATES.md` — HG-009 → `RESOLVED` (preserva contexto, decisões, data, decisor, refs ADR/pack); "Contador vivo" atualizado (HG-009 resolvido; HG-007 e HG-M1-FRENTE-A continuam em aberto).
- `docs/factory/HUMAN_DECISIONS_LOG.md` — nova entrada imutável **§HG-009** com autorização, condições vinculantes e evidências.
- `docs/factory/HUMAN_GATE_ADR012_2026-09-24.md` — header de status (`RESOLVED`), §12 preenchido (`APPROVED` × 8 + Backfill + Implementation), §13 com etapas 1–4 executadas, referências atualizadas.
- `docs/product/FUNCTIONAL_REQUIREMENTS.md` — nota de rastreabilidade no FR-027 (D5: timeline por ciclo independente; feed global ↔ `eventos_operacionais`); **nenhum requisito novo criado**.
- `docs/product/TRACEABILITY_MATRIX.md` — linhas de governança atualizadas (HG-009 RESOLVIDO; ADR docs com ADR-012 Accepted).
- `docs/PROJECT_INDEX.md` — statuses ADR-012 / MODEL review / Decision Pack / relatório; linha de `HUMAN_DECISIONS_LOG.md`.
- `docs/reports/HG009_DECISION_REGISTRATION_REPORT_2026-09-24.md` — este documento.

## Documents Reviewed Without Changes

- `docs/product/MVP_EXPERIENCE_SPEC_v1.md` — revisado; referências genéricas a "timeline"/"feed" sem contradição com HG-009; permaneceu **inalterado**.
- `docs/product/MVP_SCOPE.md` — classificação FR-027/28/29 não conflita com as decisões; **inalterado**.
- `docs/audit/EVENTOS_AUDITORIA.md` — inventário de emissores permanece válido (alimenta D3 futura); **inalterado**.
- `docs/product/FIRST_DIGITAL_EMPLOYEE.md` — modelagem de produto sem contradição; **inalterado**.

## Code Changes

**Nenhuma.** `git status` antes e depois confirma apenas arquivos `docs/**` modificados/novos. Certificado: nenhum `apps/**`, `packages/**`, `migrations/**` tocado (`apps/web/src/pages/ObrigacoesPage.tsx` já estava modificado ANTES desta atividade — fora deste escopo, inalterado nesta entrega).

## Database Changes

**Nenhuma.** Nenhum schema, tabela, coluna, trigger ou RLS alterado.

## Migrations

**Nenhuma.** Nenhum arquivo `packages/db/migrations/*.sql` novo ou alterado. `eventos_operacionais` **não foi criada**.

## Tests / Validation

- **`npm run lint:docs` (markdownlint)** — aplicado sobre todos os arquivos alterados; resultado final: **0 issues em 0 arquivos**.
- Verificação de consistência ADR-012 × Decision Pack: correspondem (mesmas 8 decisões + Backfill).
- Verificação `HUMAN_GATES.md` × HG-009: status `RESOLVED`, registro apontando para o log imutável.
- Verificação de requisitos: `FUNCTIONAL_REQUIREMENTS.md` sem contradições (apenas nota de rastreabilidade adicionada); nada novo criado.
- Verificação de referências cruzadas: links atualizados para `Accepted (HG-009)` (decisions/README, architecture/README, PROJECT_INDEX, referências internas).
- Sem testes de implementação executados (proibidos pelo escopo).

## PR

**Nenhum.** Nenhuma PR funcional. Nenhuma PR criada. Sem merge.

## Governance Status

```text
HG-009
→ HUMAN DECISION RECORDED ✅
→ ADR-012 UPDATED (Accepted - arquitetura) ✅
→ GOVERNANCE DOCUMENTATION UPDATED ✅
→ REQUIREMENTS TRACEABILITY UPDATED ✅
→ IMPLEMENTATION NOT AUTHORIZED BY THIS ACTIVITY ⛔
```

**DECISÃO ARQUITETURAL APROVADA ≠ IMPLEMENTAÇÃO AUTORIZADA.**

## Next Authorized Step

A implementação de `eventos_operacionais` (migration + emissores com dual-write atômico D2-B1 + API/feed RBAC-2 + teste + docs) permanece **bloqueada** e deve seguir o fluxo normal da Factory V2 como ciclo separado, com autorizações correspondentes — incluindo o gate de UX **HG-M1-FRENTE-A** para a Home/feed global.

## Blockers / Human Decisions Required

- **Nenhum novo NESTA atividade** (nenhuma inconsistência exigiu decisão adicional; nenhum `HUMAN_DECISION_REQUIRED` foi emitido).
- Seguem pendentes de decisão/passo em outros fluxos: **HG-007** (credenciais Google/Gmail, `AWAITING_DECISION`) e **HG-M1-FRENTE-A** (M1 UX, pendente de PR/gate).
- Aprovação para o ciclo de **implementação** do `eventos_operacionais` (gate dedicado) — decisor: Rodrigo.

---

> **As decisões arquiteturais do HG-009 foram registradas, mas esta atividade não autoriza a implementação técnica de `eventos_operacionais`.**
