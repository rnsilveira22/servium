# ADR-005 — Estratégia de Tenant: Shared Schema + tenant_id (+ RLS)

## Status

Accepted (HG-002 · 2026-08-22)

## Context

NFR-001 exige consciência e isolamento de tenant desde o primeiro dia, mesmo com um único tenant ativo no piloto. Critérios: isolamento, complexidade operacional, custo, backup único, métricas agregadas (M-01..M-12) e risco.

## Decision (Accepted)

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

## Adendo FR-021 (2026-09-23) — Catálogo de Agentes Executores por tenant

O **catálogo de agentes executores** (`agentes`, FR-021) é **entidade de negócio por tenant**, portando `tenant_id NOT NULL` + RLS `tenant_isolation` (mesma regra desta ADR — a alternativa de catálogo global do produto foi **rejeitada** por violar a invariante de RLS de todo schema e por acoplar config do tenant a dado global).

Decisões decorrentes (migration `0014_atividades_agentes.sql`):

1. **Seed automático por trigger** (`trg_agentes_seed` em `tenants` AFTER INSERT): cada tenant nasce com o único agente do MVP — `estagiaria-digital` (Estagiária Digital). Backfill da migration cobre tenants pré-existentes. Escrita do catálogo é provida por seed/trigger/migration (decisão de produto), não por CRUD público (`GRANT SELECT` apenas).
2. **`ON DELETE CASCADE`** em `agentes.tenant_id` e `atividades.tenant_id`: são dados do ciclo de vida do tenant; a deleção do tenant não exige limpeza manual de dependências.
3. **Extensibilidade sem custo**: novos agentes (MVP figuras futuras) entram via seed por tenant — `slug` único por tenant (`uq_agentes_tenant_slug`).
4. `atividades.agente_id` referencia `agentes` por FK; como FK ignora RLS, o controller valida pertencimento ao tenant explicitamente (padrão já usado em `obrigacoes.template_id`).
