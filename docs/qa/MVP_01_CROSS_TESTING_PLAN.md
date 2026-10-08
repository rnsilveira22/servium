# MVP-01 · Cross-Testing Plan — preparação para `CROSS_TESTING_READY`

- **Data baseline:** 2026-10-07
- **Agente executor da preparação:** opencode · Model: big-pickle · Platform: CLI (repo local)
- **Objetivo:** definir como contratos centrais do MVP-01 serão **cross-testados** (validação cruzada entre camadas/executores, com evidência por teste), a partir de uma **baseline congelada** de código verificada. Este documento **não substitui** a execução deliberada de cross-testing por pessoa/QA (gate humano); entrega a baseline + o protocolo + o inventário.

---

## 1. Baseline `CROSS_TESTING_READY`

| Item | Valor |
|---|---|
| Tag de baseline | `mvp-01-cross-testing-ready` (anotada, criada em 2026-10-07) |
| Commit | `949dae0` (branch `feat/hg-007-google-cloud-preparation`, 12 commits sobre `main`) |
| Estado da suíte no baseline | API 212 passed/2 skipped; DB suite; Web (7 page-suites); E2E Selenium **10 files · 38 passed** |

Critérios para a baseline: build TS OK, ESLint OK, suíte API + E2E verdes, docs sincronizadas pela Documentation Sync Rule, nenhum gate humano registrado como bloqueante-de-código nesta baseline (gates humanos ficam **fora** da definição de baseline de código).

---

## 2. Perímetro

| Camada | Workspace | Verificação |
|---|---|---|
| Banco (schema/RLS/auditoria/fila) | `packages/db` | `npm run test -w @servium-ia/db` |
| API (contratos HTTP, RBAC, motor) | `apps/api` | `npm run test -w @servium-ia/api` + `npm run build -w @servium-ia/api` |
| Web (UX/estado) | `apps/web` | `npm run typecheck` + `vitest` das páginas |
| E2E (Selenium, jornadas reais) | `apps/e2e` | `bash apps/e2e/run-e2e.sh` |
| Docs ↔ código | `docs/**` | `npm run lint:docs` + TRACEABILITY_MATRIX |

---

## 3. Inventário de evidências (baseline)

```text
apps/api/test  → 32 arquivos (incl. security-headers, metrics-negocio, recebido-decisao)
packages/db/tests → audit, audit-lista, queue, rls, rls-suite, schema
apps/web/src/pages → 7 page-suites (incl. AuditoriaPage, TemplatesPage, ExcecoesPage)
apps/e2e/src/tests → auth, login, navigation, permissions, responsiveness, health,
                     ciclo-activation, b1-recebido-validation, jornada-completa, decreto-piloto
```

---

## 4. Matriz de cross-testing

> Contrato → evidência primária (quem implementou) → **validação cruzada obrigatória** (executor independente) → como executar.

| Contrato central do MVP-01 | Evidência primária | Cross-test obrigatório (visão independente) | Execução |
|---|---|---|---|
| Autenticação/sessão (httpOnly, anti-enumeração, logout) | `apps/api/test/auth.test.ts`; `trocar-senha.test.ts` | E2E `login.test.ts` + `auth.test.ts` (Selenium) | `run-e2e.sh` |
| RBAC admin/operador | `permissions.test.ts` (E2E); `@Roles` na API | decreto do piloto (`/metrics/negocio` 401/403/200) + API unit | `run-e2e.sh` + `npm test -w api -- permissions` |
| Isolamento RLS multi-tenant | `packages/db/tests/rls-suite.test.ts` | `metrics-negocio.test.ts` (tenant B não vê dados de A) via **HTTP** | `npm test -w api -- metrics-negocio` |
| B-1 decisão de recebido (→ resolvido/excecao) | `apps/api/test/recebido-decisao.test.ts` | E2E `b1-recebido-validation` + `jornada-completa` (decisão na UI) | `run-e2e.sh` |
| Ativação de ciclo (idempotente, aprovado por humano) | `apps/api/test/ciclos.test.ts`; `atomicidade.test.ts` | E2E `ciclo-activation` (UI) + jornada completa | `run-e2e.sh` |
| Métricas operacionais (B-5) | `apps/api/test/metrics-negocio.test.ts` | E2E `decreto-piloto` (200 admin + shape `negocio/tecnica`) | `run-e2e.sh` + API test |
| Security headers / ORIGIN-check / cookie Secure | `apps/api/test/security-headers.test.ts` | E2E `decreto-piloto` (headers reais na borda HTTP) | `run-e2e.sh` |
| Contrato de provider de e-mail (Mailpit/Gmail; gmail nunca em CI) | `provider-resolver.test.ts`; `gmail.test.ts`; `mailpit.test.ts` | `channel-provider.test.ts` + `integracao-email.test.ts` | `npm test -w api` |
| Fila de jobs / retry / reapStuck | `packages/db/tests/queue.test.ts`; `scheduler.test.ts` | `worker-runtime.test.ts`; observability (`metrics-negocio` jobsEmRetry/jobsPresos) | `npm test -w api` |
| Auditoria append-only + operacional | `audit.test.ts`; `auditoria-operacional.test.ts` | Web `AuditoriaPage.test.tsx` + E2E navigation/auditoria | `npm test` por workspace |
| UX M1 Frente A (templates, exceções) | Web `TemplatesPage/ExcecoesPage` test suites | E2E `ui-01-templates` / `ui-05-excecoes` (ver PR #106) | `run-e2e.sh` (após merge do gate) |

**Executores sugeridos:** (quem valida o quê) — propositor de um contrato **não valida o mesmo contrato** em E2E; os pares da coluna 3 devem ser executados por pessoa/QA independente ou por par de agentes com contextos distintos (a partir desta baseline — regra de cross-testing do prompt mestre).

---

## 5. Protocolo de execução

1. **Checkout limpo** da baseline tag (`git checkout mvp-01-cross-testing-ready`) — estado reproduzível.
2. **Ambiente**: `docker compose up -d` (Postgres 5432) + `npm run migrate`; variáveis via `.env` (defaults documentados).
3. **Ordem**: DB → API (build+test) → Web (typecheck+test) → E2E (`run-e2e.sh`) → `npm run lint:docs`.
4. **Isolamento**: cada E2E limpa somente o que criou (FK-safe); suites serializadas (`fileParallelism: false`) por compartilharem `jobs_fila`.
5. **Registros divergentes**: se uma execução cruzada encontrar divergência (código=ok, doc=defasada), **não** prosseguir: documentar a divergência na TRACEABILITY e corrigir antes de marcar a camada como validada.
6. **Gmail real**: proibido em qualquer execução de CI/cross-testing → substituído por Mailpit; Gmail real é exclusivo do runtime com `COMMUNICATION_ADAPTER=gmail` (HG-007).

---

## 6. Formato de registro de resultado (por teste cross)

```text
# Cross-test — <contrato>
Responsável: <pessoa/par> · Data: <AAAA-MM-DD> · Baseline: mvp-01-cross-testing-ready
Resultado: PASS | FAIL | BLOCKED
Evidência: <arquivo de teste + comando + saída (link/screenshot opcional)>
Divergência encontrada (se FAIL): <descrição> | Rastreada em: <issue/doc>
```

---

## 7. Critérios

| Tipo | Critério |
|---|---|
| Entrada | Baseline tag aplicável; gates humanos de código (HG-007/CA-D-3/HG-M1-FRENTE-A) registrados; ambiente íntegro |
| Saída (`CROSS_TESTING_READY`) | Toda a matriz §4 executada com PASS por executor independente; divergências zeradas; relatório cross-testing anexado |

---

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Divergência entre camadas (contrato mudou num lado só) | Protocolo §5.5 (travar na divergência) |
| Flakiness Selenium (timing) | Waits explícitos + screenshots de evidência; retry de login isolado |
| Baseline obsoleta durante reviews | Re-tagar somente por decisão; PRs não alvo da baseline não invalidam a tag de código |
| Falsos positivos de RLS cobertos só no SQL | RLS re-verificado por HTTP nos testes de contrato (metrics-negocio/decidir) |

## Documentation Impact

```text
Documents reviewed:   suítes por workspace, recon FASE 0 (Δ §8), TRACEABILITY_MATRIX.md
Documents updated:    docs/qa/MVP_01_CROSS_TESTING_PLAN.md (novo)
No documentation changes required: não
Architectural decision required:   NO (definição de processo/QA; sem mudança de arquitetura)
ADR affected:         N/A
```
