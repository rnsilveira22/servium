# [SIMULAÇÃO] Relatório de QA — SRV-D002 (rodada 1)

> Papel: `servium-reviewer-qa`. Gate 4. Independência preservada: QA não é o autor.

## PR revisado

`#SIM-2` — branch `feat/42-health-endpoint` (simulado)

## Resultado

**`CHANGES_REQUESTED`**

## Evidências de execução

- CI: verde (simulado)
- Revisão de código: completa
- Reprodução local dos cenários: executada (simulação)

## Verificação por dimensão

| Dimensão | Resultado |
|---|---|
| Critérios de aceite | CA-04 não demonstrado |
| Segurança | OK (CA-03) |
| Testes | Falta caso de timeout |
| Arquitetura | OK |
| Regressão | N/A |

## Achados

| # | Severidade | Componente | Evidência | Critério violado | Recomendação |
|---|---|---|---|---|---|
| 1 | HIGH | health indicator | Timeout aplicado apenas na configuração do cliente; nenhum teste prova comportamento sob conexão pendente | CA-04/CA-05 | Adicionar teste com pool simulado que nunca responde, assegurando 503 em ≤1s |
| 2 | LOW | handler de erro | Log interno inclui DSN completo do banco | CA-03 (espírito) | Sanitizar log: remover connection string, manter apenas código do erro |

## Handoff

Devolvido a `servium-pleno` (responsável T1/T2). Estado → `CHANGES_REQUESTED`. Contador de loop da história: 1/3.
