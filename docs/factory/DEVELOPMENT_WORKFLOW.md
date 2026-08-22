# Development Workflow — ServiumAI

> Fluxo oficial e máquina de estados das histórias. Fonte operacional: GitHub Issues + Project `ServiumAI Development`.

## Fluxo oficial

```text
BACKLOG
  ↓ (Gate 1 — Definition of Ready)
READY
  ↓ (servium-senior assume)
TECH_ANALYSIS
  ↓ (Gate 2 — TECH READY)
READY_FOR_DEVELOPMENT
  ↓ (servium-pleno / servium-senior)
IN_DEVELOPMENT
  ↓ (Gate 3 — checklist DEV)
READY_FOR_QA
  ↓ (servium-reviewer-qa)
QA_REVIEW
  ├─ reprovado → CHANGES_REQUESTED → IN_DEVELOPMENT → READY_FOR_QA
  └─ aprovado → QA_APPROVED
                  ↓ (servium-po — Gate 5)
              PO_ACCEPTANCE
                  ├─ ACCEPTED → DONE
                  └─ REJECTED → BACKLOG/IN_DEVELOPMENT com justificativa
```

Estados auxiliares: `BLOCKED`, `REJECTED`, `AWAITING_DECISION`.

## Regra de DONE

`DONE = QA_APPROVED AND PO_ACCEPTED`

Não existe exceção automática. Nenhum agente pode marcar `DONE` sozinho.

## Responsabilidade por estado

| Estado | Responsável | Ação que habilita a transição |
|---|---|---|
| BACKLOG | servium-po | Completar DoR |
| READY | servium-po → senior | Handoff PO→Senior |
| TECH_ANALYSIS | servium-senior | Análise técnica completa |
| READY_FOR_DEVELOPMENT | servium-senior → pleno | Handoff Senior→Pleno |
| IN_DEVELOPMENT | servium-pleno/senior | Implementação + evidências |
| READY_FOR_QA | implementador → qa | Handoff Dev→QA |
| QA_REVIEW | servium-reviewer-qa | Veredito formal único |
| CHANGES_REQUESTED | qa → dev | Achados estruturados |
| QA_APPROVED | reviewer-qa → po | Handoff QA→PO |
| PO_ACCEPTANCE | servium-po | ACCEPTED/REJECTED com evidência |
| DONE | servium-po | Fechamento da Issue |

## Rastreabilidade obrigatória

Toda história deve permitir reconstruir:

`Epic → Issue (#N) → Technical Analysis → Branch (<prefixo>/N-...) → Commits → Pull Request → CI → QA Review → PO Acceptance → DONE`

O número da Issue é o ID canônico (`#23` / `SRV-23`). Não existe sistema paralelo de IDs.

## Regras transversais

1. Nenhuma alteração silenciosa de escopo: expansão vira Issue nova ou decisão documentada.
2. Nenhuma aprovação sem evidência registrada.
3. ADRs `Proposed` bloqueiam desenvolvimento dependente até decisão humana.
4. Histórias fictícias/dry runs vivem em `docs/factory/dry-run/` ou Issues marcadas e fechadas ao final.
