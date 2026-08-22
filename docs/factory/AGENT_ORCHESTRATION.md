# Agent Orchestration — ServiumAI

> Contrato de orquestração da equipe de agentes. Define ordem, gatilhos, entradas/saídas, transições de estado, política de retry, bloqueadores, escalonamento, condições de parada, filas de trabalho, limites de WIP e política de merge.
>
> Complementa (não duplica): `DEVELOPMENT_WORKFLOW.md` (máquina de estados), `QUALITY_GATES.md` (gates), `HANDOFF_CONTRACTS.md` (contratos), `AGENT_GOVERNANCE.md` (princípios). Em conflito, prevalecem a governança e o repositório.

## 1. Modelo de orquestração

Não existe agente-orquestrador. A orquestração é um **protocolo documentado** que qualquer sessão OpenCode executa via comando `START_FACTORY` (`.opencode/command/start-factory.md`). Cada sessão:

1. Verifica estado (repo, branch, GitHub, Project);
2. Lê a fila de trabalho (Issues + Project);
3. Seleciona o próximo item elegível respeitando WIP e dependências;
4. Atua como **um único agente por item** até o próximo gate;
5. Registra evidências e atualiza GitHub;
6. Repete ou encerra com status formal (`FACTORY_STATUS.md`).

Um item nunca tem dois responsáveis simultâneos; troca de papel só ocorre em gate/handoff formal.

## 2. Ordem de atuação por tipo de item

| Prioridade | Tipo | Agente | Gatilho |
|---|---|---|---|
| 1 | `HUMAN_DECISION_REQUIRED` pendente resolvido pelo humano | conforme decisão | Decisão registrada |
| 2 | Item em `CHANGES_REQUESTED` (loop QA) | servium-pleno/senior | Achados do QA |
| 3 | Item em `READY_FOR_QA` sem revisão | servium-reviewer-qa | Handoff Dev→QA |
| 4 | Item em `TECH_ANALYSIS` concluída | servium-senior | Gate 2 pronto |
| 5 | Item em `READY` sem análise | servium-senior | Handoff PO→Senior |
| 6 | Item em `BACKLOG` com DoR completável | servium-po | Demanda do épico corrente |
| 7 | Épico novo / refinamento de backlog | servium-po | Proposta aprovada |

Regra: desbloquear trabalho em andamento precede iniciar trabalho novo.

## 3. Entradas e saídas por agente (resumo operacional)

| Agente | Consome | Produz |
|---|---|---|
| servium-po | Épicos, proposta de backlog, feedback humano | Issues com DoR completa, aceites com evidência, `HUMAN_DECISION_REQUIRED` quando aplicável |
| servium-senior | Issue em `READY` | Technical Analysis, decomposição, riscos, handoff Senior→Pleno |
| servium-pleno | Issue em `READY_FOR_DEVELOPMENT` | Branch, commits, PR, testes executados, relatório de implementação |
| servium-reviewer-qa | PR em `READY_FOR_QA` | Veredito único `APPROVED`/`CHANGES_REQUESTED`/`BLOCKED` com achados estruturados |

Contratos detalhados: `HANDOFF_CONTRACTS.md`.

## 4. Transições de estado e quem executa

Máquina de estados oficial: ver `DEVELOPMENT_WORKFLOW.md`. Resumo de execução:

- Transição só é executada pelo agente responsável pelo estado de origem;
- Toda transição atualiza: label(s), campo `Status` no Project, comentário de evidência quando exigido;
- Estados auxiliares (`BLOCKED`, `AWAITING_DECISION`) sempre com comentário explicando causa e condição de desbloqueio.

## 5. Filas de trabalho

Fonte única: Issues + Project `ServiumAI Development`. Não existe backlog paralelo.

- **Fila PO**: itens em `BACKLOG` sem DoR; propostas de épico aguardando aprovação.
- **Fila Senior**: itens em `READY`; dúvidas estruturais escaladas.
- **Fila Pleno**: itens em `READY_FOR_DEVELOPMENT`; itens em `CHANGES_REQUESTED`.
- **Fila QA**: PRs em `READY_FOR_QA`; re-verificações pós-correção.

Seleção dentro da fila: maior prioridade (`priority:p0 > p1 > p2 > p3`), depois mais antigo. Itens bloqueados não entram na fila efetiva.

## 6. Limites de WIP (por agente, simultâneo)

| Agente | Máximo simultâneo |
|---|---|
| servium-senior | 2 |
| servium-pleno | 2 |
| servium-reviewer-qa | 3 |
| servium-po | 4 (refinamento é leve) |

Ao atingir o limite, o agente não inicia novo item — reporta fila cheia em `FACTORY_STATUS.md`.

## 7. Política de retry e loop de QA

- Correção pós-QA: implementador corrige **todos** os achados, registra resposta achado-a-achado e devolve a `READY_FOR_QA`.
- **Limite de loop**: após **3 reprovações consecutivas** do mesmo PR/implementação → `ESCALATED_TECHNICAL_FAILURE`:
  1. Item vai a `BLOCKED` com label `status:blocked`;
  2. Análise de causa raiz obrigatória (implementador + senior);
  3. Se causa for requisito/arquitetura → `HUMAN_DECISION_REQUIRED` (ver `HUMAN_GATES.md`);
  4. Se causa for capacidade técnica → replanejamento pela fila Senior com escopo recontratado.
- Retry de CI falho: máximo 3 execuções antes de tratar como falha real (nunca "re-run até passar" como estratégia).

## 8. Bloqueadores e escalonamento

| Bloqueador | Estado | Escala para |
|---|---|---|
| Requisito ambíguo/conflitante | `AWAITING_DECISION` | servium-po → humano se persistir |
| Mudança estrutural sem ADR aceito | `AWAITING_DECISION` + `needs:adr` | Humano (Level 3) |
| Credencial/permissão ausente | `AWAITING_CREDENTIAL`/`AWAITING_PERMISSION` | Humano |
| Falha técnica recorrente (3×) | `BLOCKED` (`ESCALATED_TECHNICAL_FAILURE`) | Senior → humano |
| Dependência externa (custo, serviço) | `AWAITING_DECISION` | Humano (Level 3) |

## 9. Condições de parada do loop autônomo

O loop `START_FACTORY` termina imediatamente (sem tentar contornar) quando:

1. Qualquer regra NEVER seria acionada (ver `AUTONOMY_POLICY.md`);
2. Nenhum item elegível existe (filas vazias ou todas bloqueadas);
3. Todos os WIP estão ocupados e nada pode avançar sem humano;
4. Falha de infraestrutura de verificação (git/gh/CI indisponíveis);
5. Dúvida honesta sobre segurança, escopo ou verdade dos dados.

Encerramento sempre com relatório de status (`FACTORY_STATUS.md` atualizado) — nunca silencioso.

## 10. Política de merge e ordem de integração

- Merge só na `main`, sempre via PR, CI verde, QA `APPROVED` e PO `ACCEPTED`;
- **Merge em si é Level 3 (humano)** enquanto branch protection não existir (`BLOCKED_BY_GITHUB_PLAN`);
- Ordem entre PRs concorrentes: quem fechou QA primeiro; conflito → rebaser responsável resolve e reabre QA se tocar código;
- Nenhum merge de PR que dependa de ADR `Proposed`.

## 11. Auditoria da orquestração

Toda sessão de factory deve deixar trilha mínima:

- Itens tocados (Issue/PR/comentários);
- Transições executadas;
- Bloqueios criados/resolvidos;
- Atualização do `FACTORY_STATUS.md` ao final.
