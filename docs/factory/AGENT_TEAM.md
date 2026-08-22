# Agent Team — ServiumAI

> Equipe de agentes da Software Factory V1. Ambiente de execução: OpenCode (`.opencode/agent/`). Gestão: GitHub Issues/Projects. Princípios: `docs/AI_CONTEXT.md` e `AGENT_GOVERNANCE.md`.

## Composição (exatamente quatro agentes)

| Agente | Arquivo | Papel | Entrada típica | Saída típica |
|---|---|---|---|---|
| `servium-po` | `.opencode/agent/servium-po.md` | Product Owner — backlog, histórias, priorização, aceite funcional | Necessidade de produto, histórico `QA_APPROVED` | Issues formatadas, `ACCEPTED/REJECTED`, `DONE` |
| `servium-senior` | `.opencode/agent/servium-senior.md` | Analista/Dev Sênior — direção técnica, análise, partes críticas | História `READY` | Análise técnica, ADRs propostos, código crítico |
| `servium-pleno` | `.opencode/agent/servium-pleno.md` | Analista/Dev Pleno — implementação disciplinada | História `READY_FOR_DEVELOPMENT` + tarefas | Código + testes + PR com evidências |
| `servium-reviewer-qa` | `.opencode/agent/servium-reviewer-qa.md` | Reviewer/QA independente — gate técnico final | PR + relatório de implementação | `APPROVED / CHANGES_REQUESTED / BLOCKED` |

Não existe orquestrador nesta versão (decisão V1). Coordenação ocorre pelos estados do workflow e handoffs contratuais.

## Matriz de permissões (least privilege)

| Capacidade | po | senior | pleno | reviewer-qa |
|---|---|---|---|---|
| Ler repositório | ✅ | ✅ | ✅ | ✅ |
| Buscar (grep/glob/list) | ✅ | ✅ | ✅ | ✅ |
| Editar código de produto | ❌ | ✅ | ✅ | ❌ |
| Editar docs de produto (`docs/product/**`) | ✅ | ✅* | ❌ | ❌ |
| Editar relatórios QA (`docs/factory/qa/**`) | ❌ | ❌ | ❌ | ✅ |
| Bash irrestrito | ❌ (somente leitura/git read/gh read) | ✅ (com denials destrutivos) | ✅ (com denials destrutivos) | ⚠️ ask por comando; deny em push/commit/rebase/rm |
| Webfetch | ⚠️ ask | ✅ | ⚠️ ask | ⚠️ ask |

\* Sênior edita docs apenas quando a análise técnica exigir; conteúdo de produto é autoridade do PO.

Denials explícitos para todos os agentes com bash amplo: `git push --force`, `git reset --hard`, `rm -rf /*`. QA adicionalmente: `git push*`, `git commit*`, `git rebase*`, `rm *`.

## Autoridade e proibições — resumo

- **PO**: define o quê e por quê; nunca o como técnico. `DONE` só com `QA_APPROVED AND PO_ACCEPTED`.
- **Senior**: define o como dentro dos ADRs vigentes; propõe ADRs (`Proposed`), nunca os aceita sozinho.
- **Pleno**: implementa o escopo contratado; escalar toda dúvida estrutural ao Senior.
- **Reviewer/QA**: verifica independentemente; nunca corrige silenciosamente; emite exatamente um resultado formal.

## Independência do QA

O reviewer/QA é agente separado dos implementadores. Como não há identidade GitHub própria para os agentes (ver `GITHUB_WORKFLOW.md §Identidade`), a independência é garantida tecnicamente: permissões restritas de edição + obrigação de evidência + proibição de auto-aprovação registrada no prompt de todos os agentes.

## Validação

```bash
opencode agent list   # deve listar servium-po, servium-senior, servium-pleno, servium-reviewer-qa
```
