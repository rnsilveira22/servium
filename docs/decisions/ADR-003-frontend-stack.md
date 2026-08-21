# ADR-003 — Stack de Frontend: React + TypeScript (SPA)

## Status

Proposed

## Context

Frontend exclusivamente operacional/administrativo (painel de status, fila de exceções, aprovações, configuração de checklists/templates/limites). Sem SEO, sem usuário final externo. Comparação em [`../architecture/STACK_EVALUATION.md`](../architecture/STACK_EVALUATION.md).

## Decision (proposed)

**React + TypeScript** como SPA, consumindo a API JSON do backend. Component library madura para dashboards operacionais (tabelas densas, formulários) escolhida na implementação.

## Alternatives Considered

1. **Vue 3** — alternativa perfeitamente viável (curva mais suave, SFCs coesos); ecossistema de componentes menor e contratação ligeiramente menor no Brasil. Se a equipe inicial tiver preferência comprovada por Vue, esta decisão pode ser revertida **sem impactar nenhuma outra ADR** (fronteira limpa via API).
2. **SSR/meta-frameworks (Next/Nuxt)** — rejeitados: complexidade desnecessária para app interna.

## Consequences

+ Ecossistema profundo para o tipo de UI necessária;
+ Tipos compartilhados com o backend (monorepo TS);
− SPA exige atenção básica a estado/roteamento (padrão conhecido).

## Risks

- Escolha por popularidade sem ajuste à equipe → mitigação: decisão explicitamente reversível antes do início da implementação.

## Condições de revisão

Equipe inicial com competência consolidada em Vue; surgimento de requisitos públicos/SEO.
