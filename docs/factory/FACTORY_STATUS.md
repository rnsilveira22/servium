# Factory Status — ServiumAI

> Snapshot vivo do estado da factory. Atualizado ao fim de cada sessão (`FACTORY_RUNBOOK.md` §5). Histórico completo vive no git/Issues — este arquivo é o ponto de partida da próxima sessão.

## Última atualização

2026-08-22 · Fase 2 (ADR review + protocolo de autonomia)

## Estado geral

| Dimensão | Estado |
|---|---|
| Branch de trabalho | `chore/software-factory-v1` |
| PR da factory | **#2** — OPEN, CI verde, aguardando merge humano |
| Software Factory | READY (estrutura + agentes + governança validados) |
| GitHub Integration | READY (Project #2, labels, templates; rulesets `BLOCKED_BY_GITHUB_PLAN`) |
| ADR Review | COMPLETE → `docs/architecture/ADR_REVIEW_REPORT.md` |
| Protocolo de autonomia | COMPLETE (`AGENT_ORCHESTRATION`, `AUTONOMY_POLICY`, `HUMAN_GATES`, `FACTORY_RUNBOOK`, `START_FACTORY`) |
| Backlog oficial | NÃO CRIADO — proposta PO aguarda aprovação |

## Decisões humanas pendentes

| ID | Assunto | Onde |
|---|---|---|
| HG-001 | Merge da PR #2 | `HUMAN_GATES.md` §HG-001 |
| HG-002 | Pacote ADR-001..011 (recomendação: ACCEPT) | `ADR_REVIEW_REPORT.md` + `HUMAN_GATES.md` §HG-002 |
| HG-003 | Aprovar/ajustar proposta inicial de backlog | `docs/product/PROPOSED_INITIAL_BACKLOG.md` |

## Bloqueios ativos

- `BLOCKED_BY_GITHUB_PLAN`: rulesets/branch protection indisponíveis (repo privado, Free) — merge permanece Level 3;
- Implementação de produto: bloqueada até HG-001 + HG-002 (+HG-003 para criar Issues).

## Fila efetiva

Vazia por design: nenhum Issue real existe ainda; primeiro trabalho pós-decisões será a criação das Issues do backlog aprovado pelo PO.

## Próximos passos (ordem)

1. Rodrigo resolve HG-001..003;
2. Pós-merge: factory opera sobre `main`;
3. PO cria Issues reais do backlog aprovado (Level 2);
4. Loop `START_FACTORY` assume o fluxo contínuo.
