# Decisões de Arquitetura (ADRs) — ServiumAI

Este diretório registra as **Architecture Decision Records** do projeto: decisões arquiteturais relevantes, seu contexto e suas consequências.

## Princípios

- Toda decisão arquitetural relevante deve ser registrada em um ADR.
- ADRs são imutáveis na prática: mudanças de rumo geram novos ADRs que substituem os anteriores (`Superseded`).
- Nenhuma tecnologia deve ser adotada sem ADR correspondente aceito.

## Estados possíveis

| Estado | Significado |
|---|---|
| `Proposed` | Proposta em discussão; não autoriza implementação. |
| `Accepted` | Decisão aceita e vigente. |
| `Superseded` | Substituída por outro ADR (indicar qual). |
| `Rejected` | Recusada; mantida como registro histórico. |
| `Deprecated` | Sem mais aplicabilidade, sem substituta direta. |

## Convenção de nomes

```text
ADR-001-titulo-da-decisao.md
ADR-002-titulo-da-decisao.md
```

Numeração sequencial, sem reutilização de números.

## Template mínimo

```markdown
# ADR-XXX — Título

## Status

Proposed

## Context

## Decision

## Alternatives Considered

## Consequences

## Risks
```

## ADRs existentes

| ADR | Título | Status |
|---|---|---|
| — | Nenhum ADR registrado ainda. | — |

> **Nota da Fase 001:** nenhum ADR foi criado com status `Accepted`. Hipóteses arquiteturais, quando surgirem, devem ser registradas como `Proposed`.
