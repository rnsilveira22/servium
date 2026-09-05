# Factory Status — ServiumAI

> Snapshot vivo do estado da factory. Atualizado ao fim de cada sessão (`FACTORY_RUNBOOK.md` §5). Histórico completo vive no git/Issues — este arquivo é o ponto de partida da próxima sessão.

## Última atualização

2026-09-04 · **FASE 1 FACTORY V2 aprovada (HG-F2-01/02/03 + HG-REC-01)** · HEAD `df7a997` · P0.1 Runtime implementado e mergeado (#45→PR#61, #46→PR#62, #47→PR#63, #48→PR#64, #49→PR#65, #50→PR#66) · Factory V2 com Orchestrator em implantação (PR `feat/f2-orchestrator`)

### Reconciliado nesta sessão (Fase 0/1 + HG-REC)

- **P0.1 GAP_RUNTIME resolvida**: motor operacional fora dos testes (#15) e comunicação (#18) implementados e mergeados — PRs #61 a #66 (`ddbe530`, `7340089`, `b0412e7`, `90a9df7`, `b6b2b75`, `8d7c11b`).
- **Issues #45–#49** têm implementação mergeada mas permanecem **abertas no GitHub** — fechamento autorizado (HG-REC-01), pendente de execução (requer `gh`/web).
- **Conflito de merge resolvido** (HG-F2-03): `AUTONOMY_POLICY.md` agora define merge **por classe** (normal = L2 autônomo; estrutural/banco/produto/governança = L3 humano), em harmonia com `FACTORY_RUNBOOK.md` §9.
- **Factory V2**: estados canônicos (14) aprovados (HG-F2-02); Orchestrator agente + comando + docs criados (HG-F2-01) no branch `feat/f2-orchestrator`.

## Estado geral

| Dimensão | Estado |
|---|---|
| Branch de trabalho | `main` sincronizada (`df7a997`) + `feat/f2-orchestrator` (PR da Factory V2) + `dependabot` PR #75 |
| Estado do MVP-01 | **P0.1 resolvido/margeado** — restam P0.2 (#9 Auditoria) e P0.3 (#20 hardening) antes de redeclarar `PILOT_READY` |
| Software Factory | **V1 OPERACIONAL (fallback)** + **V2 em implantação** (Orchestrator + estados V2 aprovados) |
| Factory V2 (Orchestrator) | **IMPLANTANDO** — agente `.opencode/agent/servium-orchestrator.md`, comando `start-orchestrator.md`, `ORCHESTRATOR.md` (PR `feat/f2-orchestrator` em revisão) |
| Meta canônica | [`../product/MVP_01_VERTICAL_SLICE.md`](../product/MVP_01_VERTICAL_SLICE.md) — primeiro Funcionário Digital no piloto |
| ADRs 001..011 | `Accepted` (HG-002); ADR-008 `CommunicationChannel` preservado (HG-008) |
| Backlog | Canônico em [`../product/INITIAL_BACKLOG.md`](../product/INITIAL_BACKLOG.md) |
| Relatório da reconciliação | [`../reports/POST_MVP_BACKLOG_RECONCILIATION.md`](../reports/POST_MVP_BACKLOG_RECONCILIATION.md) |
| Relatórios Fase 0/1 (V2) | [`../reports/FACTORY_V2_FASE0_AUDITORIA_DESIGN.md`](../reports/FACTORY_V2_FASE0_AUDITORIA_DESIGN.md) · [`../reports/FACTORY_V2_FASE1_IMPLEMENTATION_PLAN.md`](../reports/FACTORY_V2_FASE1_IMPLEMENTATION_PLAN.md) |

## Decisões humanas

| ID | Assunto | Estado |
|---|---|---|
| HG-001 | Merge PR #2 | ✅ RESOLVIDO |
| HG-002 | Pacote ADRs | ✅ RESOLVIDO (condições ativas) |
| HG-003 | Backlog inicial | ✅ RESOLVED — APPROVED WITH ADJUSTMENTS |
| HG-004 | Merge PRs #11/#12 | ✅ RESOLVIDO (`2ed0965`, `26b0db5`) |
| HG-005 | Reprioridade MVP-01 | ✅ RESOLVED — TIME-TO-PILOT |
| HG-006 | Comunicação com provedor/custo | event-driven — **não acionado** (HG-008: canal decidido sem custo recorrente) |
| HG-008 | **Canal real do piloto = Gmail API + OAuth** (ajusta rec. A da SRV-10) | ✅ RESOLVIDO (2026-08-30) |
| **HG-F2-01** | **Criar Orchestrator + governança V2** | ✅ APROVADO (2026-09-04) |
| **HG-F2-02** | **Estados canônicos V2 (14)** | ✅ APROVADO (2026-09-04) |
| **HG-F2-03** | **Política de merge por classe** | ✅ APROVADO (2026-09-04) |
| **HG-REC-01** | **Reconciliação (fechamento #45–#49 + docs)** | ✅ APROVADO (2026-09-04) |

Registro formal: [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md).

## Fila efetiva (Project `ServiumAI Development`)

> **PRE-PUSH VALIDATION GATE: ACTIVE** — docs → `npm run lint:docs`; código → `npm ci` + `npm run db:up` + `npm run verify`. Falha local ⇒ sem push.

| Issue | Item | Prioridade | Status real | Observação |
|---|---|---|---|---|
| [#15](https://github.com/rnsilveira22/servium/issues/15) | N2 Motor determinístico — **P0.1 GAP_RUNTIME** | P0 | ✅ código DONE+MERGED (PRs #61/#62) | Issue aguarda fechamento (HG-REC-01) |
| [#9](https://github.com/rnsilveira22/servium/issues/9) | Auditoria append-only (**P0.2**) | P0 | OPEN — filtrar próxima prova | PoC recomendado Fase 1 V2 (#51 não autorizado nesta rodada) |
| [#20](https://github.com/rnsilveira22/servium/issues/20) | N5 Auth mínima (**P0.3** hardening) | P0 | OPEN | gaps CA-01/CA-04/CA-05/CA-07 |
| [#45](https://github.com/rnsilveira22/servium/issues/45) | P0.1 lote | P0 | ✅ código mergeado (`ddbe530`) — Issue aberta | fechar (HG-REC-01) |
| [#46](https://github.com/rnsilveira22/servium/issues/46) | P0.1 lote | P0 | ✅ código mergeado (`7340089`) — Issue aberta | fechar (HG-REC-01) |
| [#47](https://github.com/rnsilveira22/servium/issues/47) | P0.1 lote | P0 | ✅ código mergeado (`b0412e7`) — Issue aberta | fechar (HG-REC-01) |
| [#48](https://github.com/rnsilveira22/servium/issues/48) | P0.1 lote | P0 | ✅ código mergeado (`90a9df7`) — Issue aberta | fechar (HG-REC-01) |
| [#49](https://github.com/rnsilveira22/servium/issues/49) | P0.1 lote | P0 | ✅ código mergeado (`b6b2b75`) — Issue aberta | fechar (HG-REC-01) |

Demais itens do board: ver histórico do Project `ServiumAI Development`. #50 fechada (PR #66 `8d7c11b`). #44 Pré-pulo choke → retirada da Meta canônica.

## Bloqueios / aguardando humano

| Item | Tipo |
|---|---|
| **PR #75 (dependabot)** — bump `nodemailer`/`qs` em 3 workspaces | decisão humana (externo à Fase 1) |
| Fechamento de Issues #45–#49 (HG-REC-01 aprovado) | execução GitHub via `gh`/web |
| **Migração do campo `Status`** do Project para os 14 estados V2 | exige `gh` admin / web |
| P0.2 Auditoria #9 / P0.3 hardening #20 | antes de `PILOT_READY` |
| Deploy/piloto no cliente real | gate próprio após `PILOT_READY` |

## Próximos passos

1. Merge do PR `feat/f2-orchestrator` (Factory V2) após revisão;
2. Fechar #45–#49 e migrar campo `Status` no Project (execução GitHub);
3. Apresentar proposta de **decomposição das histórias PRE_PILOT_REMEDIATION** restantes (P0.2/P0.3);
4. Avaliar PR #75 (dependabot);
5. Após 2–3 ciclos V2 com gates verdes + decisão humana → avaliar desativação da V1 (nunca automática).
