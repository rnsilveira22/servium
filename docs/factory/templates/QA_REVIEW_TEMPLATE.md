# QA Review — SRV-<issue> <título>

> Produzido por `servium-reviewer-qa` (independente do implementador). Registrado no PR e, quando aplicável, em `docs/factory/qa/SRV-<issue>-review.md`.

## PR revisado

`#<pr>` — branch `<feature/...>` — commit base `<sha>`

## Resultado

`APPROVED | CHANGES_REQUESTED | BLOCKED`

## Evidências de execução

- CI: `<link/status>` — verde? `[ ]`
- Testes executados pelo QA (comando + resultado real):

```text
<saída>
```

## Verificação por dimensão

| Dimensão | OK/N-A/Achado |
|---|---|
| Critérios de aceite (CA-01..n) | ... |
| Regras de negócio | ... |
| Arquitetura / boundaries | ... |
| Padrões de código / legibilidade | ... |
| Tratamento de erros | ... |
| Segurança (authn/authz/tenant/secrets) | ... |
| Persistência / migrations | ... |
| Contratos / compatibilidade | ... |
| Observabilidade | ... |
| Testes / regressão | ... |
| Documentação | ... |

## Achados

| # | Severidade (`CRITICAL/HIGH/MEDIUM/LOW/INFO`) | Arquivo/componente | Evidência | Critério violado | Recomendação |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... |

## Handoff

- Se `CHANGES_REQUESTED`: devolver a <senior|pleno> com achados acima.
- Se `APPROVED`: liberar para `PO_ACCEPTANCE`. Pendências não bloqueantes (se houver): <lista ou "nenhuma">.
