# Factory Status — ServiumAI

> Snapshot vivo do estado da factory. Atualizado ao fim de cada sessão (`FACTORY_RUNBOOK.md` §5). Histórico completo vive no git/Issues — este arquivo é o ponto de partida da próxima sessão.

## Última atualização

2026-08-22 · HG-003 resolvido (APROVADO COM AJUSTES) · Ondas 0–1 materializadas (#3–#10)

## Estado geral

| Dimensão | Estado |
|---|---|
| Branch de trabalho | `main` + branch documental `docs/hg003-backlog-inicial` (PR aberta aguardando merge humano) |
| Software Factory | **OPERACIONAL** |
| ADRs 001..011 | `Accepted` (HG-002), condições obrigatórias ativas |
| Backlog | **APROVADO COM AJUSTES** (HG-003) → canônico em [`../product/INITIAL_BACKLOG.md`](../product/INITIAL_BACKLOG.md) |
| Fila da factory | 8 itens reais no Project (`ServiumAI Development`), todos com DoR completa |

## Decisões humanas

| ID | Assunto | Estado |
|---|---|---|
| HG-001 | Merge PR #2 | ✅ RESOLVIDO (Opção A) |
| HG-002 | Pacote ADRs | ✅ RESOLVIDO (Opção A, condições preservadas) |
| HG-003 | Backlog inicial | ✅ RESOLVIDO — **APPROVED WITH ADJUSTMENTS** (Ondas 0–1 materializadas; 2–7 planejadas) |
| HG-004 | Provedores pagos | event-driven (não acionado) |

Registro formal: [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md).

## Fila efetiva (Project `ServiumAI Development`)

| Issue | Item | Onda | Prioridade | Tipo | Papel | Épico | Depende de | Status |
|---|---|---|---|---|---|---|---|---|
| [#3](https://github.com/rnsilveira22/servium/issues/3) | Skeleton monorepo TS | 0 | P0 | Story | Pleno | EPIC-004 | — | Ready |
| [#4](https://github.com/rnsilveira22/servium/issues/4) | CI evoluído (lint+build+testes) | 0 | P0 | Task | Pleno | EPIC-004 | #3 | Ready |
| [#5](https://github.com/rnsilveira22/servium/issues/5) | Ambiente local (Postgres container + fakes) | 0 | P0 | Task | Pleno | EPIC-004 | integra com #3 | Ready |
| [#6](https://github.com/rnsilveira22/servium/issues/6) | Modelo de dados inicial + migrations | 1 | P1 | Story | Pleno | EPIC-006 | #3, #5 | Ready |
| [#7](https://github.com/rnsilveira22/servium/issues/7) | Isolamento multi-tenant (RLS + suíte de vazamento) ⚠️ condição ADR-005 | 1 | P1 | Story | Pleno | EPIC-004 | #6, #4 | Ready |
| [#8](https://github.com/rnsilveira22/servium/issues/8) | Jobs persistidos (+ outbox condicional — ajuste HG-003) | 1 | P1 | Story | Pleno | EPIC-006 | #6, #4 | Ready |
| [#9](https://github.com/rnsilveira22/servium/issues/9) | Auditoria append-only | 1 | P1 | Story | Pleno | EPIC-009 | #6, #4 | Ready |
| [#10](https://github.com/rnsilveira22/servium/issues/10) | Spike: vertical slice mínimo p/ validação multi-tenant (ajuste HG-003) | 1 | P1 | Spike | Senior | EPIC-006 | recomendado após #6 | Ready |

### Ordem recomendada e paralelismo (respeitando WIP: Senior 2 / Pleno 2 / QA 3)

1. **#3** (sem dependências — primeiro elegível);
2. Em paralelo assim que #3 avançar: **#4** ∥ **#5**;
3. Após Onda 0: **#6**; depois **#7** ∥ **#8** ∥ **#9** (limites de WIP do Pleno = 2 simultâneos governam);
4. **#10** (Senior) pode rodar em qualquer janela após design de #6/#7 visível — sua saída pode gerar UMA história nova (slice mínimo).

**Primeiro item elegível para `/start-factory`: #3.**

## Bloqueios ativos

- Nenhum bloqueio para iniciar a fila (ADRs aceitos; fila materializada);
- Merge de PRs segue Level 3 (humano) — inclusive a PR documental desta fase;
- Implementação só inicia quando a fila for considerada validada pelo humano (determinação nº 14/16 do HG-003).

## Próximos passos

1. Rodrigo valida o mapa de Issues acima e autoriza a execução autônoma;
2. Sessão `/start-factory` consome a fila começando por #3;
3. Condições vinculantes entram como critérios verificáveis: #7 materializa ADR-005; primeira história de auth (Onda 2 futura) carregará OWASP ASVS (ADR-009).
