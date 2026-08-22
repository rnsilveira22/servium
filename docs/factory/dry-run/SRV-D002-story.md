# [SIMULAÇÃO] História — SRV-D002

> Dry Run Fase 2: valida o **loop autônomo** (`START_FACTORY`) ponta a ponta com reprovação de QA e correção. Sem código real, sem side effects — nenhum Issue/PR real criado.

## Issue simulada

`#SIM-42` — label `type:story`, `priority:p1`, `agent:pleno`

## Objetivo

Expor endpoint de health da API para o balanceador/PaaS verificar disponibilidade real (incluindo banco), conforme Onda 0 do backlog proposto.

## Critérios de aceite

- **CA-01**: `GET /health` retorna `200 {"status":"ok"}` quando aplicação e banco estão saudáveis;
- **CA-02**: retorna `503 {"status":"unavailable"}` quando o banco não responde;
- **CA-03**: resposta não vaza detalhes internos (credenciais, stack trace, DSN);
- **CA-04**: checagem de banco tem timeout curto (não trava worker por conexão pendente);
- **CA-05**: testes automatizados cobrem CA-01..CA-04.

## Regras de negócio / restrições

- Endpoint público de infraestrutura — fora de autenticação;
- Sem dependência de ADR adicional (usa apenas ADRs aceitos hipoteticamente em HG-002).

## Dependências

Nenhuma (história de bootstrap).

## Dúvidas conhecidas

Nenhuma.
