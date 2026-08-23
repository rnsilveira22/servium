# Factory Status — ServiumAI

> Snapshot vivo do estado da factory. Atualizado ao fim de cada sessão (`FACTORY_RUNBOOK.md` §5). Histórico completo vive no git/Issues — este arquivo é o ponto de partida da próxima sessão.

## Última atualização

2026-08-23 · Merges de governança executados (PRs #13/#14/#19) · **SRV-10 DONE** (spike MVP-01) · **SRV-5 DONE** (PR #21) · N5 criada (#20)

### Saída do spike (SRV-10)

Documento: [`../factory/spikes/SRV-10-mvp01-slice.md`](spikes/SRV-10-mvp01-slice.md). Entidades mínimas (12 tabelas, RLS); pg+SQL migrations; auth mínima antecipada (#20, ADR-009); comunicação recomendada: **A) SMTP+IMAP próprio** (custo zero → HG-006 evitado), reversível via `CommunicationChannel`.

## Estado geral

| Dimensão | Estado |
|---|---|
| Branch de trabalho | `main` sincronizada (`26b0db5`) + branches/PRs abertas listadas abaixo |
| Software Factory | **OPERACIONAL** — replanejada para MVP-01 |
| Meta canônica | [`../product/MVP_01_VERTICAL_SLICE.md`](../product/MVP_01_VERTICAL_SLICE.md) — primeiro Funcionário Digital no piloto |
| ADRs 001..011 | `Accepted` (HG-002); ADR-008 `CommunicationChannel` preservado na decisão de comunicação |
| Backlog | Canônico em [`../product/INITIAL_BACKLOG.md`](../product/INITIAL_BACKLOG.md) (mapa de slices MVP-01 no topo) |
| Relatório do replanejamento | [`../product/MVP_01_REPLAN_REPORT.md`](../product/MVP_01_REPLAN_REPORT.md) |

## Decisões humanas

| ID | Assunto | Estado |
|---|---|---|
| HG-001 | Merge PR #2 | ✅ RESOLVIDO |
| HG-002 | Pacote ADRs | ✅ RESOLVIDO (condições ativas) |
| HG-003 | Backlog inicial | ✅ RESOLVED — APPROVED WITH ADJUSTMENTS |
| HG-004 | Merge PRs #11/#12 | ✅ RESOLVIDO (`2ed0965`, `26b0db5`) |
| HG-005 | Reprioridade MVP-01 | ✅ RESOLVED — TIME-TO-PILOT |
| HG-006 | Comunicação com provedor/custo | event-driven — **provável pós-SRV-10** |

Registro formal: [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md) (renumbering HG-006/HG-007 documentado lá).

## Fila efetiva (Project `ServiumAI Development`)

| Issue | Item | Slice | Prioridade | Papel | Épico | Depende de | Status |
|---|---|---|---|---|---|---|---|
| [#3](https://github.com/rnsilveira22/servium/issues/3) | Skeleton monorepo | S0 | P0 | Pleno | EPIC-004 | — | ✅ DONE+MERGED (`26b0db5`) |
| [#4](https://github.com/rnsilveira22/servium/issues/4) | CI evoluído | S0 | P0 | Pleno | EPIC-004 | #3 | ✅ DONE — merge na PR #14 (aguarda humano) |
| [#5](https://github.com/rnsilveira22/servium/issues/5) | Ambiente local | S0→S1 | P0 | Pleno | EPIC-004 | integra com #3 | ✅ DONE — merge na PR #21 |
| [#10](https://github.com/rnsilveira22/servium/issues/10) | Spike vertical slice MVP-01 (+comunicação) | S1 | P0 | Senior | EPIC-006 | — | ✅ DONE (spike aceito) |
| [#20](https://github.com/rnsilveira22/servium/issues/20) | N5 Auth mínima (slice ADR-009) | S1/S2 | P0 | Pleno | EPIC-MVP01 | #6,#7 | Backlog |
| [#6](https://github.com/rnsilveira22/servium/issues/6) | Modelo de dados mínimo ⚙️ recorte fechado pelo spike | S1 | P0 | Pleno | EPIC-006 | #3,#5 ✔ | Ready |
| [#7](https://github.com/rnsilveira22/servium/issues/7) | Multi-tenant RLS ⚠️ ADR-005 | S1 | P0 | Pleno | EPIC-004 | #6,#4 | Ready |
| [#9](https://github.com/rnsilveira22/servium/issues/9) | Auditoria append-only | S4 | P0 | Pleno | EPIC-009 | #6,#4 | Ready |
| [#8](https://github.com/rnsilveira22/servium/issues/8) | Jobs essenciais (outbox condicional) | S2 | P1 | Pleno | EPIC-006 | #6,#4 | Ready |
| [#15](https://github.com/rnsilveira22/servium/issues/15) | N2 Motor determinístico do ciclo | S2 | P0 | Pleno | EPIC-MVP01 | #16,#7,#8(subset),#20 | Backlog |
| [#16](https://github.com/rnsilveira22/servium/issues/16) | N1 Cadastro cliente/obrigação/checklist | S1 | P1 | Pleno | EPIC-MVP01 | #6,#7,saída #10 | Backlog |
| [#17](https://github.com/rnsilveira22/servium/issues/17) | N3 Fila de exceções + intervenção humana | S2/S4 | P1 | Pleno | EPIC-MVP01 | #15,#9,#20 | Backlog |
| [#18](https://github.com/rnsilveira22/servium/issues/18) | N4 Comunicação real bidirecional | S3 | P1 | Pleno | EPIC-MVP01 | #15,decisão SRV-10 (HG-006 se pago) | Backlog |

`EPIC-MVP01` = opção `EPIC-003` do campo Epic + label `epic:mvp01` (API não permite criar opções de campo).

### Ordem recomendada / paralelismo (WIP inalterado: Senior 2 · Pleno 2 · QA 3)

1. ~~#10~~ ✅ ∥ ~~#5~~ ✅ concluídos;
2. **#6** (Ready, DoR completa) — próximo elegível imediato;
3. **#6** → **#7 ∥ #20(N5) ∥ #16**;
4. **#8(subset) ∥ #15** → **#17 ∥ #18** (validar recomendação de comunicação antes);
5. **#9** → avaliação PILOT_READY.

**Próximo item elegível para `/start-factory`: #6.**

## Bloqueios / aguardando humano

| Item | Tipo |
|---|---|
| Merges de governança/fundação autorizados em lote (PRs #13, #14 e #19 — replanejamento MVP-01) | ✅ executados com gates pré-merge |
| Validar recomendação do spike p/ comunicação (A: SMTP+IMAP, custo zero) antes de iniciar #18 | HG-006 só se alternativa mudar para provedor/custo |
| Deploy/piloto no cliente real | gate próprio após PILOT_READY |

## Próximos passos

1. Retomar `/start-factory` consumindo #10 ∥ #5;
2. Incorporar saída do spike em #6/N1–N4 (refinamento → Ready via Gate 1);
3. Manter condições vinculantes: RLS+suíte anti-vazamento (#7/ADR-005), auditoria pré-piloto (#9), deterministic-first (#15).
