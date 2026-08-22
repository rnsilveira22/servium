# ADR-005 — Estratégia de Tenant: Shared Schema + tenant_id (+ RLS)

## Status

Proposed

## Context

NFR-001 exige consciência e isolamento de tenant desde o primeiro dia, mesmo com um único tenant ativo no piloto. Critérios: isolamento, complexidade operacional, custo, backup único, métricas agregadas (M-01..M-12) e risco.

## Decision (proposed)

**Schema compartilhado com coluna `tenant_id` obrigatória em toda entidade de negócio**, acesso sempre contextualizado ao tenant corrente, e **Row-Level Security do PostgreSQL como defesa-em-profundidade**. Testes automatizados dedicados de isolamento entre tenants.

## Alternatives Considered

1. **Database per tenant** — isolamento físico máximo, porém N backups/migrações e custo inviáveis para o estágio atual; permanece opção para clientes enterprise com exigência contratual futura.
2. **Schema per tenant** — meio-termo que herda o pior dos dois mundos no nosso porte (migrações × N schemas sem ganho real).

## Consequences

+ Operação simples (uma instância, um backup, uma migração);
+ Métricas agregadas multi-tenant triviais;
+ Evolução para funções administrativas multi-tenant (FR-019 futuro) sem reestruturação;
− Vazamento por bug de aplicação é possível → mitigado por RLS + testes de isolamento + revisão de queries;
− Consultas esquecem `tenant_id`? → RLS falha fechada (deny-by-default).

## Risks

+ Erro humano em política RLS → mitigação: testes automatizados de vazamento no pipeline; auditoria de acessos cross-tenant como alarme.

## Condições de revisão

Cliente enterprise com exigência contratual de isolamento físico; volume que justifique sharding.
