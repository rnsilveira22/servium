# FACTORY V2 — FASE 0 — Auditoria Técnica e de Governança da Factory V1 + Design Review

Estado: **`FACTORY_V2_FASE0_AUDITORIA`** · main = `df7a997` · 04/09/2026 · Sessão READ-ONLY / DESIGN REVIEW

Relatório final da auditoria da Software Factory V1 e da proposta de design da Factory V2.
Nenhuma alteração foi feita ao repositório, GitHub, agentes, código, banco ou configurações durante a auditoria.

## 1. Estado atual da auditoria

| Dimensão | Resultado verificado |
|---|---|
| Git | branch `main` · HEAD `df7a9975886` · working tree limpo · sincronizada com origin (0/0) |
| GitHub | 17 issues abertas · 0 PRs abertos · CI e E2E **success** em `df7a997` |
| Produto | Núcleo técnico sólido: RLS deny-by-default, sessões SHA-256, auditoria insert-only, motor determinístico (ADR-010), runtime P0.1 implementado e mergeado |
| Factory | 4 agentes operacionais (PO/Senior/Pleno/QA) + protocolo `START_FACTORY` |
| Ambiente | Node 24.20 / npm 11.19 / Git 2.53 / Docker 29.7 — validado |

**Conclusão de estado:** o ambiente reconstruído é íntegro. O lucro técnico da P0.1
(runtime, correlação, Mailpit, E2E) **não está refletido** na governança da Factory —
origem de quase todos os P1/P2.

## 2. Auditoria da Factory V1 — problemas classificados

### P0 — Decisões erradas ou bloqueios críticos

**P0-1 · Conflito normativo de MERGE (o mais grave).** Três fontes divergem sobre a mesma ação:

- `AUTONOMY_POLICY.md:18` — "Merge de qualquer PR = Level 3 (humano)"
- `AGENT_ORCHESTRATION.md:110` — "Merge em si é Level 3 (humano)"
- `FACTORY_RUNBOOK.md §9` (decisão owner 2026-08-24) — **merge autônomo** de PR normal sob condições
- `start-factory.md:39` — reforça "Merge = Level 3"

Violação do princípio `AGENT_GOVERNANCE.md:13` ("Repository truth > prompt; conflitos registrados,
jamais resolvidos silenciosamente"). Um agente seguindo a política bloquearia o que o runbook autoriza;
um seguindo o runbook burlaria a política.

**P0-2 · `FACTORY_STATUS.md` obsoleto de forma crítica.** É o ponto de entrada de toda sessão
(runbook §5), mas está congelado em `e04d1e6` (2026-08-30): cita "main sincronizada e04d1e6",
"próximo passo = decompor P0.1" e lista **P0.1 como `PRE_PILOT_BLOCKER` aguardando decomposição**.
A P0.1 já foi **inteiramente implementada e mergeada** (PRs #61–#66) e declarada
`P0_1_RUNTIME_READY_FOR_HUMAN_REVIEW`. Sessões seguem instruções falsas.

**P0-3 · Issues #45–#49 abertas com implementação mergeada.** Confirmado via git:
`#45→PR#61(ddbe530)`, `#46→PR#62(7340089)`, `#47→PR#63(b0412e7)`, `#48→PR#64(90a9df7)`,
`#49→PR#65(b6b2b75)` — todos ancestrais de HEAD. Apenas #50 foi fechada.
Rastreabilidade Épico→Issue→PR→DONE quebrada.

### P1 — Confusões que dirigem trabalho errado

| # | Problema | Evidência |
|---|---|---|
| P1-1 | `CHANGELOG.md` congelado na Fase 003, ADRs `Proposed` | Não reflete MVP-01, Gmail (HG-008), runtime P0.1 |
| P1-2 | `README.md` banner diz runtime "a wirelar"/P0.1 pendente | Já implementado e mergeado |
| P1-3 | Estados `REJECTED`/`AWAITING_DECISION` ausentes do GitHub Project | `DEVELOPMENT_WORKFLOW.md` vs `GITHUB_WORKFLOW.md:71` |
| P1-4 | Documentação afirma "Playwright já utilizado p/ E2E" | Projeto usa **Selenium** (`DEMO_FACTORY_STORY.md`, 2 relatórios) |
| P1-5 | Independência QA procedural, não identitária | Mesma conta GitHub; sem code-review separado |

### P2 — Degradação de qualidade

- **Sem cobertura de código mensurável** — nenhum `@vitest/coverage-*`, sem thresholds; `verify` passa com módulo a 0%.
- **Testes frontend finos** — só 4 de 8 páginas (faltam Dashboard/Clientes/Excecoes/Auditoria/Login/AuthContext/api-client).
- **Numeração HG colide entre catálogo e log** (HG-004/005 com significados distintos; renumerados HG-006/007, não reconciliados).
- **E2E estreito** — apenas 1 jornada completa; faltam Cliente-CRUD/Exceção/Auditoria.
- ADRs com heading estale `Decision (proposed)` apesar de Accepted.

### P3 — Cosmético/operacional

- QA agent **sem `question: allow`** (ausente; os outros 3 têm).
- Path prefix inconsistente p/ `SECURITY_ARCHITECTURE.md` no QA agent.
- `PROJECT_INDEX.md` sem branch `docs/reports/` e subpastas factory.

## 3. Factory V2 — arquitetura proposta

```
RODRIGO ── Human Gates (L3: ADR, merge estrutural, deploy, governance, custo, dados reais)
   │
   ▼
PO (agente) ──consenso──► ChatGPT/PO (assistente; não autoridade final)
   │  contrato PO→ORCH
   ▼
ORCHESTRATOR (NOVO)  ◄── fonte única: Issues + Project
   │  ├─► SENIOR (análise técnica, ADR proposal, partes críticas)
   │  └─► PLENO  (implementação, testes, PR)
   │         └─► REVIEWER/QA (veredito independente)
   ▼            QA_APPROVED
HUMAN REVIEW (novo gate) ──► PO ACCEPTANCE ──► DONE
```

**DONE = `QA_APPROVED AND PO_ACCEPTED AND MERGED`.**

**Princípio central:** o Orchestrator **não é autoridade** (nem de produto, nem de arquitetura) —
é coordenador de fluxo. Distribui, valida handoffs, controla estados, detecta bloqueios,
impede desvio de escopo e para conforme condições de parada.

## 4. Orchestrator — responsabilidades e limites

**Faz (L1/L2, autônomo com notificação):**

1. Recebe tarefa `READY` do PO (DoR completa).
2. Decide agente por tipo/dependência/WIP.
3. Empacota contexto (Issue + análise + contratos + AC + precedentes de código).
4. Valida contrato de handoff (saída obrigatória + evidências + estado) → move estado.
5. Detecta bloqueios (CI recorrente, `AWAITING_DECISION`, ADR `Proposed`) **e para**.
6. Controla loops: máx. 3 voltas QA→Pleno antes de `ESCALATED_TECHNICAL_FAILURE`.
7. Impede: trabalho não solicitado; resolver Issue diferente; alterar arquitetura sem aprovação;
   modificar governança; fechar Issue indevido; DONE sem evidência.

**Não faz (L3/NEVER):** não decide produto/prioridade/aceite; não aceita ADR; não merge estrutural;
não deploy; não toca governance real; não toca dados reais de cliente; não substitui julgamento do PO.

## 5. Contratos de handoff (tipificados)

| Handoff | Entrada/pré-condição | Saída obrigatória | Evidências | Estado saída |
|---|---|---|---|---|
| PO→ORCH | Issue DoR + prioridade | Pacote executável | Issue com AC; deps | `READY` |
| ORCH→SENIOR | Pacote; sem ADR `Proposed` | Technical Analysis + tarefas + teste | Template TA; riscos | `READY_FOR_DEVELOPMENT` |
| SENIOR→PLENO | Análise aprovada | Implementação + testes rodados + PR `Closes #N` | `verify` verde; relatório | `READY_FOR_QA` |
| PLENO→QA | PR + relatório | Veredito único `APPROVED/CHANGES_REQUESTED/BLOCKED` | CI verde; AC um-a-um | `QA_REVIEW` |
| QA→PLENO | Veredito falha (máx. 3) | Achados estruturados → correção → volta | 7 campos por achado | loop |
| QA→HUMAN | `APPROVED` | Pacote revisão humana | relatório `qa/<issue>-review.md` | `QA_APPROVED` |
| HUMAN→PO | Revisão sem objeção | Aceite funcional com evidência | registro aceite | `PO_ACCEPTANCE` |
| PO→DONE | QA_APPROVED AND PO_ACCEPTED AND MERGED | Fechar Issue + changelog | PR mergeado | `DONE` |

**Regra universal de rejeição:** handoff incompleto devolve a história ao estado anterior.

## 6. Workflow — estados e transições (análise crítica)

| Estado proposto | Veredito | Observação |
|---|---|---|
| `OPEN` / `PO_APPROVED` | Manter | traduz `BACKLOG`/`READY` |
| `SENIOR_ANALYSIS` + `IMPLEMENTATION_APPROVED` | **Fundir** | redundância; vira um único `TECH_READY` |
| `IMPLEMENTING` | Manter | = `IN_DEVELOPMENT` |
| `QA_REVIEW` / `QA_FAILED` / `QA_APPROVED` | Manter | `QA_FAILED` substitui `CHANGES_REQUESTED` c/ semântica de falha |
| `HUMAN_REVIEW` | **Novo — manter** | gate humano estrutural |
| `PO_ACCEPTED` / `DONE` | Manter | DONE só com MERGED |
| `BLOCKED` | Manter | |
| **Faltam** | **Adicionar** | `AWAITING_DECISION`, `REJECTED`, `ESCALATED_TECHNICAL_FAILURE` |

**Risco de colisão:** o conjunto V2 (OPEN/PO_APPROVED/...) duplica o `Status` do Project
(Backlog/Ready/...). **Recomendação:** manter os estados **V1 como campo `Status`** do Project e
representar os estados V2 como **labels de decisão** — nunca duas máquinas de estado paralelas.

## 7. Human Gates na V2

**Preservar todos os existentes** (HG-001..005, HG-008 resolvidos; HG-006/007 pendentes) +
**formalizar o gate `HUMAN REVIEW`** entre QA_APPROVED e PO_ACCEPTED. Manter: política de default
(não implementa por timeout), `AWAITING_DECISION`, e "não objeção ≠ aprovação".

**Novos gates exigidos** (porque `AGENT_GOVERNANCE.md:52` torna alterações em `docs/factory/*` = Level 3):

- **HG-F2-01** — aprovar criação do agente ORCHESTRATOR + atualização da governança.
- **HG-F2-02** — aprovar conjunto canônico de estados.
- **HG-F2-03** — aprovar política definitiva de merge (resolve P0-1).
- **+ autorização de reconciliação** (fechar #45–#49, corrigir FACTORY_STATUS/README/CHANGELOG).

## 8. STOP conditions (obrigatórias)

1. Requisito ambíguo / AC não testável → retorno ao PO.
2. Conflito de arquitetura / ADR `Proposed` dependente → `AWAITING_DECISION`.
3. Mudança de escopo fora do diff aprovado.
4. Falha de segurança / credencial exposta → QA + humano.
5. Human Gate (L3) necessário → nunca executar.
6. Teste crítico quebrado / CI vermelho recorrente.
7. Evidência insuficiente (`NOT_VALIDATED` ≠ sucesso).
8. Divergência documentação × código → registrar, não resolver silenciosamente.
9. Agente excedendo responsabilidade.
10. Loop excedido (3× QA) → `ESCALATED_TECHNICAL_FAILURE`.
11. `PILOT_READY` sem evidência → STOP + Go/No-Go + `HUMAN_DECISION_REQUIRED`.

## 9. QA — independência e evidência

- **Antes de `QA_APPROVED`:** CI verde real, suite relevante executada, AC um-a-um,
  relatório `docs/factory/qa/<issue>-review.md`.
- **Antes de `HUMAN_REVIEW` / `PO_ACCEPTED` / `DONE`:** relatório QA rastreável +
  registro de "review aprovado" no PR (evidência datável).
- **Regras inegociáveis:** QA não corrige silenciosamente (`QA_FAILED → PLENO`); ORCH impede auto-revisão.
- **Limitação reconhecida:** independência procedural (mesma conta GitHub), mitigada por trilha
  imutável no PR enquanto não houver branch protection (Free plan).

## 10. GitHub no workflow V2

- **Issues** = entrada do pipeline (DoR). **#45–#49 a serem fechadas** (requer autorização humana).
- **PRs** = veículo de handoff; **CI** (`ci.yml` + `e2e.yml`) = pré-condição dura de `QA_APPROVED`
  e merge (verde hoje).
- **Project `Status`** = fonte dos estados; reconciliar `AWAITING_DECISION`/`REJECTED` (P1-3).
- **Sem branch protection** (`BLOCKED_BY_GITHUB_PLAN`) → mitigar com disciplina + audit trail;
  resolver política de merge (P0-1).

## 11. Testes — evidências mínimas

| Etapa | Mínimo obrigatório |
|---|---|
| `READY_FOR_QA` | testes criados+executados; `npm run verify` local verde |
| `QA_APPROVED` | CI verde + suite do diff + AC verificados + relatório QA |
| `HUMAN_REVIEW` | diff + relatório + testes-chave + risco residual |
| `DONE` | `QA_APPROVED AND PO_ACCEPTED AND MERGED` |

**Recomendações:** adicionar cobertura + thresholds no CI (maior buraco mensurável); componentes
Dashboard/Clientes/Excecoes/Auditoria/Login/AuthContext/api-client; E2E Cliente-CRUD/Exceção/Auditoria;
unit p/ correlação-middleware/metrics/`GmailAdapter.receber()`. Corrigir docs Playwright→Selenium (P1-4).

## 12. Autonomia — automático vs. humano

**Automático (L1/L2):** seleção/atribuição via ORCH; branch/commit; análise/implementação/QA no escopo;
mover estados; abrir PR normal; CI; e merge autônomo de PRs normais sob condições do runbook §9
(uma vez resolvido o P0-1).

**Humano (L3, inegociável):** ADR; escopo/prioridade de produto; custo/provedor pago;
deploy produção/cliente real; alterar `docs/factory/*`; dados reais de cliente; merge estrutural;
**gate HG-PR-SEC (#54/#55 — password hardening e rate limit)**.

## 13. Migração V1 → V2 (plano)

| Ação | Escopo |
|---|---|
| **Preservar** | 4 agentes V1, ADRs Accepted, testes, governance docs, gates |
| **Refatorar** | estados consolidados; fonte única p/ invariantes; reconciliar docs |
| **Adicionar** | `servium-orchestrator` + `command/start-orchestrator.md` + `docs/factory/ORCHESTRATOR.md` |
| **Compatibilidade** | ORCH sobre a mesma máquina de estados V1 (mapeia `READY↔PO_APPROVED`); START_FACTORY tradicional permanece como fallback |
| **Remover V1** | só após N ciclos validados + gates verdes + decisão humana |
| **Validar V2** | 2–3 issues reais ponta-a-ponta; medir handoffs, loops, STOPs, DONE com evidência |

**Requisito de gate:** criação do Orchestrator exige **HG-F2-01** (mexe em `docs/factory/*`).

## 14. Riscos

| Id | Risco | Mitigação |
|---|---|---|
| R1 | ORCH vira gargalo/falha única | fallback START_FACTORY; ORCH leve/delegador |
| R2 | ORCH vira "super-PO" ou auto-aceita | limites L3 explícitos; checklist de escopo; auditoria |
| R3 | Duplicação de estados V1×V2 | conjunto canônico único |
| R4 | Drift de governança recorrente | fonte única + repository truth |
| R5 | Merge sem branch protection | disciplina processual |
| R6 | Independência QA procedural | trilha imutável no PR |
| R7 | Sem cobertura de código | thresholds no CI |
| R8 | P0.3 parado em HG-PR-SEC | decisão humana obrigatória |
| R9 | Frontend fino | testes de componentes críticos |

## 15. Recomendação final

**Implementar a Factory V2 agora?** → **SIM, porém como camada coordenadora incremental sob um
Human Gate explícito — NÃO como reescrita.** O núcleo está sólido e verde; a V2 ataca exatamente
os P0 de governança detectados.

**Antes de implementar, resolver (nesta ordem):**

1. **P0 — Reconciliar estado:** fechar #45–#49; atualizar `FACTORY_STATUS.md`, `README.md`, `CHANGELOG.md`.
2. **P0 — Resolver conflito de merge** em um único documento normativo (HG-F2-03).
3. **Decidir HG-PR-SEC** (#54/#55) — destravar ou oficializar o bloqueio pré-piloto.
4. **Adicionar cobertura de código + testes frontend críticos** antes de a V2 exigir evidência obrigatória.

**Human Gates necessários:**

- **HG-F2-01** — aprovar criação do Orchestrator + governance da V2.
- **HG-F2-02** — aprovar estados canônicos.
- **HG-F2-03** — aprovar política definitiva de merge.
- **Autorização** para reconciliação do estado.

**Primeira Issue segura (prova de conceito da V2):** **#51 — "Auditoria consultável por
entidade/tenant (PRM-P0.2-A)"**. Escopo contido, sem ADR em aberto, sem dados reais,
endpoint+testes+UI claros, e reduz a P0.2 da auditoria (#9). Alternativa: **#58**
(listagem global de exceções). Valida o handoff ORCH→SENIOR→PLENO→QA→HUMAN→PO ponta-a-ponta
sem risco estrutural.

## 16. Declaração de conformidade

Sessão **100% READ-ONLY / DESIGN REVIEW** durante a auditoria. Únicos comandos executados na
auditoria: `git status/fetch/branch/log/rev-parse` e consultas GET à API pública do GitHub.
A criação deste relatório é o primeiro ato de escrita, autorizado pelo owner (Rodrigo).
Nenhum commit, branch, PR, Issue, agente, código ou configuração foi alterado.
