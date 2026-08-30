# Relatório — Suíte E2E Básica com Selenium (ServiumAI MVP)

**Data:** 2026-08-27
**Escopo:** Retomar/recuperar o WIP de `apps/e2e` e entregar uma suíte E2E básica, determinística e repetível para o MVP.
**Pré-requisitos:** Docker, Node 22+, Chrome 151+ (chromedriver 151.0.5), banco via `docker compose`.

## 1. Recuperação do WIP (Fase 1)

- Branch criada: `feat/selenium-e2e-basics` (a partir de `main` em `17e838a`).
- WIP anterior encontrado INTEGRO e reaproveitado:
  - `apps/e2e/` (não commitado) com page objects, driver, env e 3 arquivos de teste.
  - `package-lock.json` com as dependências `@servium/e2e`, `selenium-webdriver` e `chromedriver` (workspace já registrado).
- Nenhuma perda de trabalho: sem `git reset --hard`, sem `checkout --`, sem `git clean`, sem force push.

## 2. Correções aplicadas no WIP

### 2.1 Bug determinístico: `driver.wait(promise)` falhava imediatamente

Os page objects usavam `driver.wait(finder.isDisplayed(), ms)`. Quando o elemento ainda não existia, o `findElement` rejeitava e o `wait` NÃO fazia polling — falhava em milissegundos em vez de aguardar. Corrigido com condições `until.elementLocated(...)` (idiomática do Selenium).

### 2.2 Flakiness: login intermitente (posições tardias do arquivo)

As duas últimas tentativas de login de `permissions.test.ts` falhavam de forma intermitente (~50%). Diagnóstico via dump de estado (module `evidence.ts`): a página era recarregada (`deleteAllCookies` dispara reload no ChromeDriver) e o ciclo de preenchimento/submit era engolido. Correção:

- `loginAsAuthed()` com retry (até 3 tentativas) navegando para `about:blank` entre tentativas;
- `pollOutcome()` com waits `until` sequenciais (sidebar → alert-error → timeout);
- screenshots e dump de estado como evidência em `apps/e2e/evidence/` (gitignored).

Resultado: 2 execuções completas consecutivas **29/29 testes verdes**, 0 evidências de falha.

## 3. Achados reais corrigidos no app (bugfix mínimo)

### 3.1 Label de papel em CAIXA ALTA

`apps/web/src/App.css:128` aplica `text-transform: uppercase` em `.sidebar-role`. As afirmações E2E passaram a comparar o texto renderizado (case-insensitive) — `ADMINISTRADOR` / `OPERADOR`.

### 3.2 Overflow horizontal no mobile (login)

`apps/web/src/styles/brand-tokens.css`, media query `max-width: 480px`: `width: min(88vw, 390px)` não considerava o padding interno do `.login-card`, estourando o viewport em 390px. Correção: `max-width: 100%; height: auto;`. Verificado por `responsiveness.test.ts` (sem overflow no mobile).

## 4. Suíte entregue (apps/e2e)

| Área | Arquivo | Testes |
|---|---|---|
| Login (inicialização/authentication) | `src/tests/login.test.ts` | 6 |
| Navegação | `src/tests/navigation.test.ts` | 7 |
| Proteção de rotas / sessão | `src/tests/auth.test.ts` | 5 |
| Permissões (RBAC FE↔API) | `src/tests/permissions.test.ts` | 4 |
| Responsividade básica | `src/tests/responsiveness.test.ts` | 4 |
| Saúde / comunicação FE/API | `src/tests/health.test.ts` | 3 |
| **Total** | | **29** |

Suportes: `src/pages/{LoginPage,LayoutPage}.ts` (page objects), `src/support/{driver,evidence}.ts`, `src/config/env.ts`, `vitest.config.ts` (pool forks singleFork), `run-e2e.sh`.

Seed estendido (`scripts/seed.mjs`): usuário **operador** `oper@dev.local`/`oper123` (papel `operador`) para validar RBAC, idempotente e com envs opcionais `SEED_OPERATOR_EMAIL`/`SEED_OPERATOR_PASSWORD`.

## 5. Execução determinística

```bash
bash apps/e2e/run-e2e.sh        # DB + seed + API + Web + vitest headless
# ou, com servidores já ativos:
cd apps/e2e && HEADLESS=1 npx vitest run
```

Pipeline do runner: Postgres (`docker compose up -d --wait`) → seed (admin+operador) → build API → API `:3000` + Web Vite `:5173` (background, log em mktemp) → wait `/health` e `/login` → `vitest run`. Cleanup via `trap`.

## 6. Gates de qualidade

| Gate | Resultado |
|---|---|
| `npm run lint` | 0 erros |
| `npm run typecheck` | ok |
| `npm run build` | ok |
| `npm run test` (unit) | 7 arquivos / 40 testes ok + web 2 |
| `npm run lint:docs` | 0 erros nos arquivos alterados |
| E2E completo | 29/29 (2 execuções consecutivas) |

## 7. Fora de escopo / observações

- A suíte E2E **não** roda no CI principal (requer Chrome + Postgres + servidores); fica local via `run-e2e.sh`.
- Nenhuma funcionalidade da Demo Factory foi tocada (EPIC-013 permanece `BLOCKED`, `HUMAN_GATE_DEMO_FACTORY` não liberado).
- 403 para operador em rota admin é comportamento esperado do guard RBAC (ASVS V2.x); o teste valida a negação.
