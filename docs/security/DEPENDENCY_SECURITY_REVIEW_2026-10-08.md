# Dependências · Revisão de Segurança (npm audit + Dependabot)

- **Data:** 2026-10-08
- **Agente:** opencode · Model: big-pickle · Platform: CLI
- **Escopo:** cadeia de dependências do monorepo (produção + desenvolvimento); lockfile `package-lock.json` (npm workspaces)
- **Disparo:** alerts do Dependabot (`rnsilveira22/servium-ia` — 9 high, 10 moderate, 1 low) + `npm audit` local (24 vulns: 18 high, 1 critical, 2 moderate, 3 low)

---

## 1. Resultado

| Métrica | Antes | Depois |
|---|---|---|
| `npm audit` total | 24 | 14 |
| Críticas (runtime) | 1 (`proxy-addr`) | 0 |
| High **runtime/produção** | 4 | 0 |
| High dev-only (sem fix compatível) | — | 10 |

> Todos os alerts de **produção** (API/Web runtime) foram eliminados. Os 14 restantes são **exclusivos de ferramentas de dev/CI** (`markdownlint-cli2`, `chromedriver`/proxy-agent) e **não possuem fix compatível publicado** (§3) — permanecem visíveis no Dependabot até upstream realease fix.

## 2. Correções aplicadas (2026-10-08)

| Pacote | Versão antiga → nova | Severidade | Uso |
|---|---|---|---|
| `@nestjs/platform-express` | 11.2.1 → **11.2.7** | high (multer) | API runtime |
| `multer` (transitivo) | 2.2.0 → **2.4.0** | high | uploads runtime |
| `nodemailer` | ≤10.0.8 → **10.0.16** | high (5 GHSA) | provider e-mail (gmail/mailpit) |
| `proxy-addr` (transitivo) | 2.0.7 → **2.0.8** | **critical** | Express runtime |
| `markdownlint-cli2` | 0.23.2 → **0.23.3** | high | lint de docs (dev) |
| `source-map-js` (transitivo) | 1.2.1 → **1.2.2** | high | vite (dev) |
| `adm-zip` (transitivo) | 0.6.0 → **0.6.1** | high (7 GHSA) | chromedriver install (dev) |
| `js-yaml` (transitivo) | <4.3.2 → **4.3.2** | high | tooling |
| `ip-address` (transitivo) | 10.5.0 → **10.7.3** | moderate | socks (dev) |
| `brace-expansion` (transitivo) | <5.0.12 → **5.0.12** | high | typescript-eslint (dev) |

Meio: `npm install` + `npm audit fix` (não-destrutivo) + bumps diretos em `package.json`/`apps/api/package.json`.

## 3. Alertas residuais aceitos (dev-only, sem fix compatível)

| Cluster | Advisories | Motivo de permanecer |
|---|---|---|
| `markdownlint-cli2@0.23.3` (e subtree: `braces`, `fast-glob`, `globby`, `micromatch`, `smol-toml@1.8.0`, `katex`, `markdownlint`, `micromark-extension-math`) | 9 (6 high, 2 low, 1 moderate) | **0.23.3 é a versão mais recente publicada**; a própria dependência `smol-toml`/`braces` não tem versão patched no range compatível. Fix só com release upstream futuro. |
| Cadeia `chromedriver@151.0.5` → `proxy-agent` → `get-uri` → `basic-ftp` | 5 high (incl. `pac-proxy-agent`) | `basic-ftp` só tem fix na linha 6.2.x, mas `get-uri@8` exige `^5.x` (incompatível). Única sugestão `npm audit fix` é **downgrade do driver p/ 122.0.1**, incompatível com Chrome local 152 → quebraria o E2E. Migração p/ Selenium Manager (provisionamento auto) é mudança de harness — backburner. |

**Risco real dos residuais:** baixo — nenhum está em cadeia servida em runtime; são build/lint/E2E locais, sem dados de piloto em trânsito.

*Obs.: tree `npm ls` pôde reportar `invalid` ao coexistir resíduo de `node_modules/.pnpm` (instalação antiga) — irrelevante para o lockfile; `apps/e2e/run-e2e.sh` validado com a árvore atual.*

## 4. Verificação pós-correção

```text
apps/api    216 passed / 2 skipped (32 files) · build TS ok
apps/web    56 passed (13 files) · typecheck ok
apps/e2e    38 passed (10 files) — run-e2e.sh, Chrome 152
docs        markdownlint-cli2 v0.23.3 → 0 issues (153 files)
eslint      apps/packages → 0 issues (demo/ segue como dívida FU-1 fora da baseline)
```

## 5. Acompanhamento

- Reabrir quando: Dependabot detectar `markdownlint-cli2` ≥0.23.4 ou release com `smol-toml`/`braces` patched; decisão de migrar o E2E para Selenium Manager.
- G-10 (nova): vigiar alerts do Dependabot em PRs alvo da baseline `mvp-01-cross-testing-ready`.

## Documentation Impact

```text
Documents reviewed:   README, package.json (root + apps/api), package-lock.json, TRACEABILITY_MATRIX, ASVS_PILOTO
Documents updated:    docs/security/DEPENDENCY_SECURITY_REVIEW_2026-10-08.md (novo — este)
No documentation changes required: não
Architectural decision required:   NO
ADR affected:         N/A
```
