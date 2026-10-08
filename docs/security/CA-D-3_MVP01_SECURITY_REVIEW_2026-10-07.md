# CA-D-3 — Pacote de evidências de segurança para revisão humana (MVP-01 · Phase 3 · P1-3)

- **Data:** 2026-10-07
- **Escopo:** itens P1-3 do completion master prompt + submissão formal para gate de revisão humana **CA-D-3** (Issue #57).
- **Status do gate:** `AWAITING_DECISION` — **nenhuma aprovação de segurança foi registrada por este agente**.
- **Regra:** entregável = evidência verificável (teste `arquivo:linha`), nunca declaração de segurança.

---

## 1. O que foi implementado nesta fase

| Controle | Onde (código) | Evidência automatizada (teste) |
|---|---|---|
| Headers de segurança globais (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP `default-src 'none'; frame-ancestors 'none'`) | `apps/api/src/common/security-headers.middleware.ts`; registrado em `apps/api/src/app.factory.ts` | `apps/api/test/security-headers.test.ts:50-57` |
| HSTS **somente** em produção | `security-headers.middleware.ts` (gate `NODE_ENV=production`) | `security-headers.test.ts:59-62` |
| Defesa anti-CSRF: POST/PUT/PATCH/DELETE com `Origin` cross-site ⇒ **403** | `security-headers.middleware.ts` (ORIGIN check vs `CORS_ORIGINS`) | `security-headers.test.ts:64-69`; permitida/ausente prossegue em `:75-82` |
| Ajuste de CORS (AppFactory agora Promise; CORS configurado antes do middleware) | `apps/api/src/app.factory.ts` | suíte completa API `npm run test -w @servium-ia/api` → 212 passed / 2 skipped |
| Cookie `Secure` default em produção (override `COOKIE_SECURE`) | `apps/api/src/auth/auth.controller.ts:12-21` (`cookieFor`) | `security-headers.test.ts:91-116` (matriz env × flag) |

---

## 2. Status ASVS pós-fase (recálculo em `ASVS_PILOTO.md`)

| Capítulo | Total | Implementado | Parcial | Lacuna | n/d |
|---|---|---|---|---|---|
| V2 — Autenticação | 14 | 13 | 0 | 1 | 0 |
| V3 — Sessão | 10 | 10 | 0 | 0 | 0 |
| V4 — Controle de acesso | 7 | 7 | 0 | 0 | 0 |
| V5 — Validação / sanitização | 9 | 5 | 2 | 1 | 1 |
| **Total** | **40** | **35** | **2** | **2** | **1** |

- **G-01** (V3.4.2 Secure), **G-02** (CSRF/ORIGIN) e **G-03** (headers) — **resolvidos**.
- **G-04..G-08** permanecem abertas (P2/P3, sem bloqueio de piloto): ativação out-of-band, validação centralizada
  (GlobalPipe), schema runtime, upload pipeline, teste de pausa de sessão.

---

## 3. Gap de ASVS restante por decisão explícita do gate anterior (HG-009)

| Item | Status | Tratamento |
|---|---|---|
| Requisitos ASVS 2.2.1/2.2.6/2.3.1 (rate-limit de autenticação / KDF forte / senha inicial) | **Não aplicado** por decisão de escopo do HG-009 | Documentado em `HUMAN_DECISIONS_LOG.md` §HG-009; **não revertido aqui** — sem inventar decisão. |

---

## 4. Execução de validação (não substitui a revisão humana)

```text
npm run test -w @servium-ia/api            → 32 files · 214 testes (212 passed / 2 skipped)
npm run test -w @servium-ia/api -- security-headers metrics-negocio → 9/9
npm run build -w @servium-ia/api          → tsc OK
eslint (arquivos da fase)                  → OK
```

Ambientes de execução: Postgres local `127.0.0.1:5432` (docker-compose); gmail real **nunca** usado em CI.

---

## 5. Riscos residuais declarados (para decisão humana)

1. **ORIGIN check**: em clientes sem envio de `Origin` (curl, alguns mobile SDKs), a defesa depende do `SameSite=Lax`; a mitigação não cobre requests forjados que suprimem o header.
2. **CSP `default-src 'none'`** aplicado globalmente à API (sem UI server-rendered): a corretude depende de nenhum recurso novo ser carregado pela API; revisar ao reativar UI embarcada.
3. **HSTS** um ano sem `preload` (decisão consciente — sem domínio público ainda).
4. `Secure` em produção exige **TLS no proxy** — sem isso cookies ficam inutilizáveis (falha de disponibilidade, não de segurança).
5. G-04..G-08 (P2/P3) permanecem abertas; **aceitação explícita para o piloto é decisão humana** (este pacote não as aprova).

---

## 6. Decisão necessária (Human Gate)

Favor registrar em `docs/factory/HUMAN_DECISIONS_LOG.md` / `HUMAN_GATES.md`:

| ID | Pergunta | Opções |
|---|---|---|
| CA-D-3 | Aprovar/validar o mapeamento ASVS (35/40 implementado, 2 parcial, 2 lacuna, 1 n/d) e a mitigação anti-CSRF-origin como suficiente para `PILOT_READY`? | `APPROVED` / `VALIDATED` / `REJECTED` + parecer |
| CA-D-3 | Manter G-04..G-08 abertas (P2/P3) para a primeira iteração do piloto? | `APROVADO` / `NÃO` (listar bloqueantes) |

## Documentation Impact

```text
Documents reviewed:   ASVS_PILOTO.md, HUMAN_GATES.md, QUALITY_GATES.md, docs/security
Documents updated:    ASVS_PILOTO.md (linhas V2.8.1/V3.4.2/V3.7.1/V4.1.5, gaps G-01..03, cobertura →35/2/2/1)
No documentation changes required: não
Architectural decision required:   NO (controles incrementais; sem mudança de arquitetura)
ADR affected:         N/A
```
