# [SIMULAÇÃO] Análise Técnica — SRV-D002

> Papel: `servium-senior`. Gate 2.

## Veredito

`TECH READY` — aprovada para decomposição.

## Arquitetura

Endpoint no módulo de infraestrutura da API (NestJS controller + health indicator). Checagem de banco via query trivial (`SELECT 1`) com timeout de 500ms. Sem cache (health deve refletir estado real).

## ADRs aplicados

ADR-001 (módulo delimitado), ADR-002 (NestJS), ADR-004 (probe Postgres). Nenhum conflito; nenhum ADR `Proposed` dependente.

## Decomposição

| Tarefa | Responsável |
|---|---|
| T1 — Controller `/health` com indicador de banco e timeout | servium-pleno |
| T2 — Testes unitários/integração CA-01..CA-05 | servium-pleno |

## Contratos afetados

Novo contrato público: `GET /health` → `200/503`. Documentado no PR.

## Estratégia de testes

Unitário (mock do pool) + integração (banco real do ambiente local). Casos: saudável, indisponível, timeout, ausência de vazamento de detalhes.

## Riscos

| Risco | Mitigação |
|---|---|
| Probe sobrecarregar banco em intervalos curtos do PaaS | Query trivial + timeout curto |
| Vazamento de detalhe de erro na resposta 503 | Mapear erro para corpo fixo; detalhe só em log interno |

## Bloqueadores

Nenhum.
