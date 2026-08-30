# Factory Status — ServiumAI

> Snapshot vivo do estado da factory. Atualizado ao fim de cada sessão (`FACTORY_RUNBOOK.md` §5). Histórico completo vive no git/Issues — este arquivo é o ponto de partida da próxima sessão.

## Última atualização

2026-08-30 · **POST-MVP Backlog Reconciliation** (HUMAN GATE aprovado) · estado oficial: **`PRE_PILOT_REMEDIATION_REQUIRED`** · `PILOT_READY` invalidado · PRs de código até **SRV-18** (#34), UI, QA corrective (#37) e E2E Selenium (#41/#43) mergeados

### Saída do spike (SRV-10)

Documento: [`../factory/spikes/SRV-10-mvp01-slice.md`](spikes/SRV-10-mvp01-slice.md). Entidades mínimas (12 tabelas, RLS); pg+SQL migrations; auth mínima antecipada (#20, ADR-009); comunicação recomendada: **A) SMTP+IMAP próprio**, reversível via `CommunicationChannel`. **Revisão por decisão humana (HG-008 · 2026-08-30):** canal real do piloto adotado = **Gmail API + OAuth 2.0** (confirmado; registro no [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md)); local/CI/E2E = **Fake SMTP via Mailpit** (decidido, implementar após P0.1).

## Estado geral

| Dimensão | Estado |
|---|---|
| Branch de trabalho | `main` sincronizada (`e04d1e6`) + PRs abertas listadas abaixo |
| Estado do MVP-01 | **`PRE_PILOT_REMEDIATION_REQUIRED`** — remediações P0.1/P0.2/P0.3 antes de redeclarar `PILOT_READY` (ver [`reports/POST_MVP_BACKLOG_RECONCILIATION.md`](../reports/POST_MVP_BACKLOG_RECONCILIATION.md) §0) |
| Software Factory | **OPERACIONAL** — MVP-01 em remediação pré-piloto |
| Meta canônica | [`../product/MVP_01_VERTICAL_SLICE.md`](../product/MVP_01_VERTICAL_SLICE.md) — primeiro Funcionário Digital no piloto |
| ADRs 001..011 | `Accepted` (HG-002); ADR-008 `CommunicationChannel` preservado (HG-008) |
| Backlog | Canônico em [`../product/INITIAL_BACKLOG.md`](../product/INITIAL_BACKLOG.md) (mapa de slices MVP-01 no topo) |
| Relatório da reconciliação | [`../reports/POST_MVP_BACKLOG_RECONCILIATION.md`](../reports/POST_MVP_BACKLOG_RECONCILIATION.md) |

## Decisões humanas

| ID | Assunto | Estado |
|---|---|---|
| HG-001 | Merge PR #2 | ✅ RESOLVIDO |
| HG-002 | Pacote ADRs | ✅ RESOLVIDO (condições ativas) |
| HG-003 | Backlog inicial | ✅ RESOLVED — APPROVED WITH ADJUSTMENTS |
| HG-004 | Merge PRs #11/#12 | ✅ RESOLVIDO (`2ed0965`, `26b0db5`) |
| HG-005 | Reprioridade MVP-01 | ✅ RESOLVED — TIME-TO-PILOT |
| HG-006 | Comunicação com provedor/custo | event-driven — **não acionado** (HG-008: canal decidido sem custo recorrente) |
| HG-008 | **Canal real do piloto = Gmail API + OAuth** (ajusta rec. A da SRV-10) | ✅ RESOLVIDO (2026-08-30) — decisão humana Q2 |

Registro formal: [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md) (renumbering HG-006/HG-007 documentado lá).

## Fila efetiva (Project `ServiumAI Development`)

> **PRE-PUSH VALIDATION GATE: ACTIVE** — desde 2026-08-23, por autorização humana formal.
> Docs → `npm run lint:docs` · Código → `npm ci` + `npm run db:up` + `npm run verify`.
> Falha local ⇒ **sem push**; corrigir e repetir. Proibido `continue-on-error`/`|| true` em checks críticos.

| Issue | Item | Slice | Prioridade | Papel | Épico | Depende de | Status |
|---|---|---|---|---|---|---|---|
| [#3](https://github.com/rnsilveira22/servium/issues/3) | Skeleton monorepo | S0 | P0 | Pleno | EPIC-004 | — | ✅ DONE+MERGED (`26b0db5`) |
| [#4](https://github.com/rnsilveira22/servium/issues/4) | CI evoluído | S0 | P0 | Pleno | EPIC-004 | #3 | ✅ DONE+MERGED (`dfed2eb`) |
| [#5](https://github.com/rnsilveira22/servium/issues/5) | Ambiente local | S0→S1 | P0 | Pleno | EPIC-004 | integra com #3 | ✅ DONE+MERGED (`106ed9e`) |
| [#10](https://github.com/rnsilveira22/servium/issues/10) | Spike vertical slice MVP-01 (+comunicação) | S1 | P0 | Senior | EPIC-006 | — | ✅ DONE (spike aceito; recomendação A revisada por HG-008) |
| [#20](https://github.com/rnsilveira22/servium/issues/20) | N5 Auth mínima (slice ADR-009) | S1/S2 | P0 | Pleno | EPIC-MVP01 | #6,#7 | ✅ DONE+MERGED (`8c6d225`) — **gaps CA-01/CA-04/CA-05/CA-07 = P0.3** |
| [#6](https://github.com/rnsilveira22/servium/issues/6) | Modelo de dados mínimo | S1 | P0 | Pleno | EPIC-006 | #3,#5 | ✅ DONE+MERGED (`7d5c4ae`) |
| [#7](https://github.com/rnsilveira22/servium/issues/7) | Multi-tenant RLS (ADR-005) | S1 | P0 | Pleno | EPIC-004 | #6,#4 | ✅ DONE+MERGED (`6bda68b`) |
| [#9](https://github.com/rnsilveira22/servium/issues/9) | Auditoria append-only | S4 | P0 | Pleno | EPIC-009 | #6,#4 | **OPEN — `PRE_PILOT_BLOCKER` (P0.2)** · CA-01/CA-02 provados; CA-03 parcial; CA-04/CA-05 em aberto |
| [#8](https://github.com/rnsilveira22/servium/issues/8) | Jobs essenciais (outbox condicional) | S2 | P1 | Pleno | EPIC-006 | #6,#4 | ✅ DONE+MERGED (`d9e7379`) — gap menor CA-06 (métrica de backlog) |
| [#15](https://github.com/rnsilveira22/servium/issues/15) | N2 Motor determinístico do ciclo | S2 | P0 | Pleno | EPIC-MVP01 | #16,#7,#8(subset),#20 | ✅ CAs DONE (PR `4a15015`) — **GAP_RUNTIME (wire no worker) = P0.1** |
| [#16](https://github.com/rnsilveira22/servium/issues/16) | N1 Cadastro cliente/obrigação/checklist | S1 | P1 | Pleno | EPIC-MVP01 | #6,#7,saída #10 | ✅ DONE+MERGED (`9ca83b1`) |
| [#17](https://github.com/rnsilveira22/servium/issues/17) | N3 Fila de exceções + intervenção humana | S2/S4 | P1 | Pleno | EPIC-MVP01 | #15,#9,#20 | ✅ DONE+MERGED (`c7fad11`) — gap menor CA-02 (listagem por ciclo) |
| [#18](https://github.com/rnsilveira22/servium/issues/18) | N4 Comunicação real bidirecional | S3 | P1 | Pleno | EPIC-MVP01 | #15,decisão SRV-10 (HG-008) | ✅ DONE+MERGED (`c7f4060`) — **gaps CA-01/CA-02/CA-05 = P0.1** (correlação resposta↔item) |

`EPIC-MVP01` = opção `EPIC-003` do campo Epic + label `epic:mvp01` (API não permite criar opções de campo).

### Ordem recomendada / paralelismo (decisão Q3 · HUMAN GATE 2026-08-30)

1. **P0.1** — Runtime operacional do Funcionário Digital (GAP_RUNTIME): handlers reais no worker · scheduler/tick · motor↔`CommunicationChannel` · Gmail Adapter no fluxo real · correlação resposta↔item da #18 · `template`/`token_correlacao` · **provar motor fora dos testes**;
2. **P0.2** — **#9 Auditoria**: completar CA-03, implementar CA-04, completar CA-05 (preservar CA-01/CA-02);
3. **P0.3** — **#20 Security hardening**: senha mínima · rate limit · revisão credencial de serviço · ASVS para o piloto;
4. Depois — avaliar gaps menores **#17** e **#8** · executar **E2E/runtime** · **LOCAL_ACCEPTANCE**.

`PILOT_READY` **somente** após P0.1/P0.2/P0.3 implementados, testados e aprovados pelo QA.

**Próximo passo (pós-merge deste PR de documentação): STOP e retornar com proposta de decomposição das histórias de `PRE_PILOT_REMEDIATION` (sem implementar).**

## Bloqueios / aguardando humano

| Item | Tipo |
|---|---|
| **P0.1** GAP_RUNTIME do motor (wire de handlers/scheduler/canal no worker) | `PRE_PILOT_BLOCKER` crítico — aguarda decomposição aprovada |
| **P0.2** Auditoria #9 (CA-03/CA-04/CA-05) | `PRE_PILOT_BLOCKER` |
| **P0.3** Security hardening #20 (senha/rate-limit/credential/ASVS) | pós-é-P0, antes de `PILOT_READY` |
| Gaps menores #17 (listagem) e #8 (métrica de backlog) + correlação #18 | confirmar com PO/QA |
| Deploy/piloto no cliente real | gate próprio após `PILOT_READY` redeclarado |

## Próximos passos

1. Merges desta fase (reconciliação + decisões humanas + drift documental);
2. Apresentar proposta de **decomposição das histórias PRE_PILOT_REMEDIATION** (P0.1/P0.2/P0.3);
3. Após aprovação, executar os lotes e manter as condições vinculantes: RLS+suíte anti-vazamento (#7/ADR-005), auditoria pré-piloto (#9), deterministic-first (#15), HG-008 (canal Gmail piloto + Mailpit local/CI).
