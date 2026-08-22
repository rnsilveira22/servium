# Handoff Contracts — ServiumAI

> Contratos de troca entre agentes. Um handoff incompleto devolve a história ao estado anterior.

## PO → Senior (entrada: `READY`)

| Campo | Obrigatório |
|---|---|
| Issue (`#N`) | ✅ |
| Objetivo | ✅ |
| Critérios de aceite | ✅ |
| Regras de negócio | ✅ quando aplicável |
| Prioridade (P0–P3) | ✅ |
| Dependências | ✅ |
| Restrições | ✅ |
| Dúvidas conhecidas | ✅ (ou "nenhuma") |

Verificação: Gate 1 — Definition of Ready.

## Senior → Pleno (entrada: `READY_FOR_DEVELOPMENT`)

| Campo | Obrigatório |
|---|---|
| Issue | ✅ |
| Technical Analysis (link/comentário) | ✅ |
| Tarefas decompostas com responsável | ✅ |
| Módulos afetados | ✅ |
| Restrições técnicas | ✅ |
| Contratos afetados (APIs/eventos/schemas) | ✅ (ou "nenhum") |
| Testes esperados | ✅ |
| Riscos | ✅ |

## Dev → QA (entrada: `READY_FOR_QA`, via PR)

| Campo | Obrigatório |
|---|---|
| Issue + PR (`Closes #N`) | ✅ |
| Resumo da implementação | ✅ |
| Arquivos/módulos alterados | ✅ |
| Testes criados + execução real | ✅ |
| Status do CI | ✅ |
| Critérios cobertos | ✅ |
| Limitações e riscos residuais | ✅ (ou "nenhuma") |
| Decisões técnicas tomadas | ✅ (ou "nenhuma") |
| Migration (quando houver) | condicional |

## QA → Dev (saída: `CHANGES_REQUESTED`)

Cada achado deve conter:

1. Achado (descrição)
2. Severidade (`CRITICAL/HIGH/MEDIUM/LOW/INFO`)
3. Arquivo/componente
4. Evidência
5. Comportamento esperado
6. Critério violado
7. Recomendação

Destino: Sênior ou Pleno, conforme atribuição da análise técnica.

## QA → PO (saída: `APPROVED`)

Registrar: QA Status · testes executados · regressão avaliada · segurança avaliada · arquitetura verificada · pendências não bloqueantes · confirmação técnica explícita.

## PO → DONE

PO registra `ACCEPTED` com evidência ou justificativa (`PO_ACCEPTANCE_TEMPLATE.md`). Somente então a história vai a `DONE`.

Regra formal invariável: **`DONE = QA_APPROVED AND PO_ACCEPTED`**.
