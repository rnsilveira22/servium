# MVP-01 — Completion Reconciliation (2026-10-07)

> **FASE 0** do prompt mestre de implementação · **somente-leitura**: nenhum código/migration/endpoint alterado.
> Fontes: `git` local, GitHub (PRs/Issues), `HUMAN_DECISIONS_LOG.md`, `FACTORY_STATUS.md`, código auditado.
> Regras: merge ≠ aprovação; código ≠ requisito validado; unit ≠ E2E; nada de aprovação humana inventada.

---

## 1. Identificação

| Campo | Valor |
|---|---|
| Agent | opencode/big-pickle |
| Model | big-pickle |
| Platform | OpenCode (CLI) |
| Repository | rnsilveira22/servium-ia |
| Branch base | `feat/hg-007-google-cloud-preparation` |
| Base reference | `origin/main` = `c0675f8` |
| Data | 2026-10-07 |

## 2. Estado do Git

```text
branch atual:             feat/hg-007-google-cloud-preparation
HEAD:                     1d0c071
ahead:                    main → 7 commits (0 behind; PR #105, mergeable)
origin/HEAD:              main = c0675f8 (0458262 squash B-2 + docs)
untracked:                demo/ (dívida de lint FU-1; não commitado)
branches relevantes:
  feat/m1-frente-a-pleno  (3 commits à frente de main — M1-UI-01/05, SEM PR)
  feat/m1-frente-b-ops    (conteúdo já integrado via PR #98)
  feat/72-editar-obrigacao/m1-office-ai-workforce (stale, superseeded/pre-98)
```

## 3. PRs e Issues no GitHub

| Item | Estado |
|---|---|
| PR #105 (este branch) | OPEN · MERGEABLE · base `main` · 2 commits pushados (a217806 docs HG-007; c06f4f7 email-templates/login-rate-limit) — **5 commits locais ainda não pushados** |
| PR #104 / #102 | OPEN · docs HG-007 / B-2 readiness (branches docs) |
| PR #101 | OPEN · dependabot devDeps |
| Issue #9 (auditoria) | OPEN · conteúdo técnico DONE; fechamento formal = Owner |
| Issue #8 (jobs/outbox generalizado) | OPEN · fora do núcleo do MVP (P1 backlog) |
| Issue #58/#59 (P2 tech-debt) | OPEN · não bloqueiam piloto |
| Issue #72 (editar obrigação) | OPEN · P1 |

## 4. Auditoria dos itens — status por evidência

| Item | Status | Evidência |
|---|---|---|
| **B-1** recebido → resolvido | ✅ **DONE** (merged `04329db` PR #99) | `decidir-item.ts` (transições `recebido→resolvido\|excecao`; `validacao_recebido`; atômico via UPDATE condicionado; RLS/auditoria na mesma transação); testes AC-B1-01..12; Runtime E2E; Selenium |
| **B-2** Gmail código/wiring | 🔶 **DONE (código) / MISSING_EVIDENCE (real)** | PR #103 squash `0266322`: `provider-resolver.ts` (gmail por tenant), `gmail-adapter.ts`, `recebimento.ts` (fontes Mailpit + Gmail via `mensagens_gmail`, correlação), política "Gmail nunca em CI" preservada. FALTA: credencial real (HG-007) + E2E com Gmail real (message id + auditoria) |
| **M0 UX** | ✅ **DONE + MERGED** (PR #96 `95c8160`) | CI 4/4, Selenium 31/31, Visual QA 18/18; **`HG-UX-M0_ACCEPTANCE` ainda não formalizado** |
| **M1 Backend Wave B1** | ✅ **DONE + MERGED** (PR #98 `dfb75c0`) | OPS-01/03/04A/05/07; registro de gate/merge **não formalizado**; OPS-04B `AWAITING_DECISION` |
| **M1 UX Frente A** | 🔶 **IMPLEMENTED / SEM PR / SEM GATE** | `feat/m1-frente-a-pleno` (3f6ebdb, a45f830, 20af34f): TemplatesPage + ExcecoesPage + E2E (14 arquivos, +1.487/−113); gate **HG-M1-FRENTE-A** pendente |
| **GAP-01 UI** | 🔶 **PARCIAL** | seletor de checklist em Nova Obrigação commitado localmente (`1d0c071`, decisão HG-FECHAMENTO-CORRECAO-UI); criação/gerência de templates segue no Frente A |
| **HG-007** (credenciais Google) | ⏳ **AWAITING_DECISION** | PRs #104/#105 documentam readiness; sem `GMAIL_CLIENT_ID/SECRET` + OAuth reais |
| **B-3 / CA-D-3** (revisão humana ASVS) | ⏳ **AWAITING_DECISION** | `HUMAN_DECISIONS_LOG.md` (HG-L3-0809): "CA-D-3 NÃO registrada"; `QUALITY_GATES.md`: sem `VALIDATED/APPROVED` piloto não é declarado pronto |
| **B-4** rollback/stop procedure | ❌ **AUSENTE** | nenhum runbook operacional; só SIGTERM + cancelar ciclo |
| **B-5** métricas mínimas | ❌ **NÃO impl.** | `metrics.service.ts` = contadores HTTP apenas; M-01..M-12 sem agregação |
| **B-6** responsável do piloto | ❌ **NÃO-FOUND** | decisão organizacional (fora do repo) |
| **P1-3** security headers / CSP / Secure cookie / anti-CSRF | ❌ **NÃO impl.** | `app.factory.ts`: CORS + CorrelationId + rate-limit; sem helmet/CSP/anti-CSRF; cookie `Secure` condicional |
| **P1-4** auditoria visível na UI | ✅ **DONE** (locais) | FR-028 `0de4155` (presenter + filtros + UI em cards) — **não mergeado ainda** |
| **P1-5** Selenium jornada completa | 🔶 PARCIAL | Selenium cobre M0/UI; jornada completa template→decidir→encerrar não fechada |
| **P1-6** fechamento Issue #9 | ⏳ pendente/owner | — |
| **P1-7** HG-RETENÇÃO | ⏳ **DEFERRED** | sem política numérica; registrar antes de PILOT_READY |
| **FR-020/FR-021/FR-028** (incremental) | 🔶 **LOCAL (sem merge)** | commits `6d02dce`, `0de4155` no branch — precisam push/PR junto deste bundle |

## 5. Documentação perdida/desatualizada

- **Desatualizada:** `FACTORY_STATUS.md` (snapshot 14/09; não reflete FR-020/21/28, HG-009, HG-FECHAMENTO-CORRECAO-UI, ADR-012).
- **Perdida (não commitada):** `docs/ux/FACTORY_V2_UX_UI_EVOLUTION_BACKLOG.md`, `docs/ux/FACTORY_V2_UX_UI_REFERENCE_COMPARISON.md`, `docs/factory/FACTORY_V2_M1_EXECUTABLE_BACKLOG.md` — existem só como blobs efêmeros.
- **`EVENTOS_AUDITORIA.md`:** atualizado em FR-028 (21 ações · 29 linhas) — ok.
- **ADR-012:** `Accepted (HG-009)`, doc-only, implementação de `eventos_operacionais` NÃO autorizada.

## 6. Bloqueios por Human Gate

| Gate | Estado |
|---|---|
| HG-007 (credencial Google) | AWAITING_DECISION → bloqueia Phase 2 (Gmail real) |
| CA-D-3 (revisão ASVS) | AWAITING_DECISION → bloqueia Phase 3 (declaração de segurança/piloto) |
| HG-M1-FRENTE-A (UX) | pendente → bloqueia merge da Frente A (Phase 5) |
| HG-RETENÇÃO | DEFERRED → decisão numérica antes de PILOT_READY |
| B-6 (responsável humano) | AWAITING_DECISION → bloqueia criterio 10 |
| M1-OPS-04B | AWAITING_DECISION (não-bloqueante p/ pilotos novos) |

## 7. Conclusão da FASE 0

- **Núcleo funcional do MVP:** entregue (B-1 ✅, B-2 código ✅, UA/auditoria/RLS/RBAC ✅, UX M0 ✅).
- **Trabalho autônomo possível agora:** merge do bundle local (FR-020/21/28 + HG-009 + fix + UI), **B-5 métricas**, **P1-3 headers/CSP/cookie/anti-CSRF**, **B-4 rollback doc**, **CA-D-3 evidence pack**, **Selenium jornada completa**, **Frente A (criar PR)**, **cross-testing plan**.
- **Bloqueado por humano:** Gmail real (HG-007), CA-D-3 aprovação, gate Frente A, HG-RETENÇÃO, B-6.
- **Veredito:** `NOT_PILOT_READY` hoje — primeira rodada de entregas autônomas deve zerar os itens não-humanos.

## 8. Evolução pós-FASE 0 (Δ 2026-10-07 · FASE 8 do completion master prompt)

> **Delta de status** dos itens citados na FASE 0 após as entregas autônomas (FASES 1–7). A seção 2..6 acima permanecem como snapshot da data de criação; este delta é a fonte de verdade vigente.

| Item (FASE 0) | Status na FASE 0 | Status vigente (2026-10-07) | Evidência |
|---|---|---|---|
| **B-1** decisão recebido | ✅ DONE + merged | ✅ mantido | `decidir-item.ts`; decisão B-1 E2E na UI (jornada completa, FASE 7) |
| **B-4** rollback/stop procedure | ❌ AUSENTE | ✅ **ENTREGUE** | `docs/operations/MVP_01_ROLLBACK_STOP_PROCEDURE.md` (FASE 4) |
| **B-5** métricas mínimas | ❌ NÃO impl. | ✅ **IMPLEMENTADO** | `GET /metrics/negocio` (admin+RLS) + `metrics-negocio.test.ts`; verificado E2E no decreto do piloto |
| **P1-3** headers/CSP/cookie/anti-CSRF | ❌ NÃO impl. | ✅ **RESOLVIDO** | `security-headers.middleware.ts` + `security-headers.test.ts`; ASVS 35/40; headers verificados E2E |
| **CA-D-3** revisão de segurança | pendente | 🔶 **PACOTE ENTREGUE / AWAITING_DECISION** | `docs/security/CA-D-3_MVP01_SECURITY_REVIEW_2026-10-07.md` |
| **M1 UX Frente A** | IMPLEMENTED / SEM PR / SEM GATE | 🔶 **PR #106 ABERTO / HG-M1-FRENTE-A AWAITING_DECISION** | verificado 35/35 E2E; merge NÃO realizado |
| **M1 Backend Wave B1** gate/merge não formalizado | observação | ✅ **formalizado** (bundle local já merged em etapas anteriores; sem delta nesta rodada) | PRs #98/#99 |
| **B-2** Gmail real | DONE código / MISSING_EVIDENCE real | 🔶 inalterado — **HG-007 AWAITING_DECISION** | provider gmail; credencial real pendente |
| **Selenium jornada completa** (previsão) | — | ✅ **ENTREGUE** | `jornada-completa.test.ts` + `decreto-piloto.test.ts` → run-e2e 10 files · 38 passed |

**Veredito vigente:** núcleo autônomo **zerado** (B-4, B-5, P1-3, CA-D-3 pack, Frente A PR, E2E). Restam **somente** itens com decisão humana: HG-007 (Gmail real), CA-D-3 (aprovação), HG-M1-FRENTE-A (merge UX), HG-RETENÇÃO, B-6 — `PILOT_READY` permanece condicionado a esses gates.
