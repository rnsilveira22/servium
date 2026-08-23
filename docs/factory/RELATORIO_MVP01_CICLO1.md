# Relatório de Ciclo MVP-01 — Merges + SRV-10 + SRV-5

> Factory session 2026-08-23 · `PRODUCT PRIORITY: MVP-01 TIME-TO-PILOT`

## MERGES DE GOVERNANÇA

| PR | Conteúdo | Gates | Resultado |
|---|---|---|---|
| #13 | Registro HG-004 | OPEN/base main/MERGEABLE/CLEAN/CI ✔ | ✅ merged |
| #14 | SRV-4 (CI pipeline) | idem + novo workflow verde na própria PR | ✅ merged (`dfed2eb`) |
| #19 | Replanejamento MVP-01 | conflito com #13 resolvido por **merge normal da main** preservando união HG-004+HG-005; revalidado CLEAN antes do merge | ✅ merged (`01456d3`) |

Sem force push/rebase destrutivo/bypass. Pós-merge: main atualizada, CI success, `MVP_01_VERTICAL_SLICE.md`, `MVP_01_REPLAN_REPORT.md`, backlog META ATUAL e log HG-004+HG-005 presentes; Issue #4 CLOSED.

## SRV-10 — SPIKE REAL (DONE)

Investigação prévia: ADRs 001–011 lidos (002 NestJS sem Redis; 004 PostgreSQL único; 005 RLS shared-schema; 006 jobs em PG/SKIP LOCKED; 007 object storage S3-compatível gerenciado no piloto; 008 porta `CommunicationChannel`; 009 auth first-party + ASVS; 010 deterministic-first).

- **Menor fluxo e2e**: ciclo ativado pelo operador → solicitação por item (template+token) → resposta e-mail com anexo → correlação → verificação determinística → resolução ou exceção → retry nos limites → encerramento + métricas.
- **Entidades mínimas**: 12 tabelas derivadas do fluxo, todas `tenant_id` + RLS.
- **Tecnologia de dados**: nenhum ADR definia ORM → evidência comparada → **pg + SQL migrations versionadas + runner mínimo**.
- **Auth mínima**: dados reais ⇒ antecipação controlada ADR-009 → **N5 criada como Issue #20 (P0)**; token fixo/bypass rejeitados.
- **Comunicação**: ver seção abaixo.
- Saída completa: [`spikes/SRV-10-mvp01-slice.md`](spikes/SRV-10-mvp01-slice.md) · PO ACCEPTED · Issue #10 fechada.

## FIRST DIGITAL WORKER

Assistente Digital de Pendências Documentais (definição existente preservada; determinístico; identidade de serviço registrada).

## MINIMUM END-TO-END FLOW / DATA MODEL / AUTH

Ver seções SRV-10 acima e documento do spike (fonte canônica deste ciclo).

## COMMUNICATION

| Alt | Avaliação |
|---|---|
| A SMTP+IMAP próprio | outbound✔ inbound(IMAP polling)✔ anexos(MIME)✔ correlação(token+In-Reply-To)✔ custo **zero** lock-in baixo complexidade média |
| B API provedor | inbound excelente; custo recorrente; **HG-006 obrigatório**; lock-in médio |
| C alternativa (portal/manual) | quebra automação real — rejeitada para o objetivo MVP-01 |

**RECOMMENDATION: A** · **HG-006: NOT REQUIRED** (reabre somente se A falhar e migrar para provedor) · Implementação da #18 aguarda validação humana da recomendação.

## SRV-5 — AMBIENTE LOCAL (DONE)

PostgreSQL 16-alpine containerizado + healthcheck + scripts `db:up/down/reset` + `.env.example` sem secrets + `LOCAL_ENV.md`. Evidência real executada (up→Healthy→pg_isready→down). Zero serviço pago; fakes adiados às histórias consumidoras. QA APPROVED · PO ACCEPTED · merge humano na **PR #21**.

## REFINED ISSUES (pós-spike, comentários de rastreabilidade)

| Issue | Refinamento |
|---|---|
| #6 | Recorte definitivo das 12 tabelas; pg+migrations SQL; DoR completa; P0 |
| #7 | Escopo mantido; suíte anti-vazamento sobre as 12 tabelas usando ambiente local; P0 |
| #8 | Subconjunto essencial confirmado; outbox segue condicional (HG-003); ledger via `mensagens_comunicacao`; P1 |
| #15 | Deps confirmadas: #16,#7,#8(subset),**#20**; CAs auditáveis; Backlog |
| #16 | Entidades delimitadas; seeds demo (1 template/2 itens/1 cliente); Backlog |
| #17 | Tipos de exceção enumerados; dep **#20** adicionada (decisões autenticadas); Backlog |
| #18 | Arquitetura NÃO decidida automaticamente; recomendação A registrada; aguarda validação; Backlog |
| #20 (nova/N5) | Auth mínima slice ADR-009; P0; Backlog |

## CRITICAL PATH

```text
#6 → (#7 ∥ #20 ∥ #16) → (#8s ∥ #15) → (#17 ∥ #18*) → #9 → PILOT_READY → Gate do piloto
```
\* após validação humana da recomendação de comunicação.

## HUMAN_DECISIONS_REQUIRED

1. Validar recomendação de comunicação **A (SMTP+IMAP)** para liberar #18;
2. Merges Level 3 pendentes: **#21** (SRV-5), **#22** (este registro/spike);
3. Gate do piloto no cliente real (após PILOT_READY).

## NEXT ELIGIBLE

**#6 — Modelo de dados mínimo (P0, Ready, DoR completa)** — WIP Pleno livre.

## READY TO CONTINUE AUTONOMOUSLY

**YES** — fila íntegra, WIP respeitado (Senior livre; Pleno 1 slot em uso até merge), nenhum gate bloqueando #6/#7/#20/#16/#8s/#15/#9.
