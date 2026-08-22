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
| [ADR-001](ADR-001-architecture-style.md) | Estilo arquitetural: monólito modular | `Proposed` |
| [ADR-002](ADR-002-backend-stack.md) | Backend: TypeScript + Node.js (NestJS) | `Proposed` |
| [ADR-003](ADR-003-frontend-stack.md) | Frontend: React + TypeScript (SPA) | `Proposed` |
| [ADR-004](ADR-004-persistence.md) | Persistência: PostgreSQL | `Proposed` |
| [ADR-005](ADR-005-tenant-strategy.md) | Tenant: shared schema + tenant_id (+ RLS) | `Proposed` |
| [ADR-006](ADR-006-async-processing.md) | Processamento assíncrono: jobs no PostgreSQL | `Proposed` |
| [ADR-007](ADR-007-document-storage.md) | Armazenamento documental: object storage + metadados | `Proposed` |
| [ADR-008](ADR-008-communication-abstraction.md) | Comunicação: abstração de canal (`CommunicationChannel`) | `Proposed` |
| [ADR-009](ADR-009-authentication-strategy.md) | Autenticação e autorização: first-party + RBAC mínimo | `Proposed` |
| [ADR-010](ADR-010-ai-usage-strategy.md) | Estratégia de IA: determinístico-first, LLM assistivo | `Proposed` |
| [ADR-011](ADR-011-deployment-strategy.md) | Deployment: PaaS de entrada, sem Kubernetes | `Proposed` |

> **Revisão formal (Fase 2):** análise crítica completa em [`../architecture/ADR_REVIEW_REPORT.md`](../architecture/ADR_REVIEW_REPORT.md). Recomendação `ACCEPT` para todos, **sujeita à decisão humana (HG-002)** — nenhum status foi alterado pela revisão. Enquanto `Proposed`, bloqueiam implementação dependente.
