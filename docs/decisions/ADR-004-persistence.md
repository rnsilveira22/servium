# ADR-004 — Persistência: PostgreSQL

## Status

Proposed

## Context

Domínio fortemente relacional (ciclo → itens → documentos → mensagens → auditoria), requisitos de transações, trilha append-only, JSON para configurações flexíveis e isolamento por tenant com defesa-em-profundidade (ADRV-001, ADRV-002, ADRV-007).

## Decision (proposed)

**PostgreSQL** como único banco de dados do MVP: dados transacionais, jobs persistidos (ADR-006), metadados documentais e trilha de auditoria. Row-Level Security como segunda camada de isolamento por tenant.

## Alternatives Considered

1. **MySQL/MariaDB** — equivalente razoável, mas sem RLS nativo comparável e menos adequado ao padrão de jobs/JSONB adotado.
2. **MongoDB/NoSQL** — rejeitado: nenhum requisito atual de schema flexível ou escala horizontal; o domínio é transacional; violaria ADRV-002 (consistência da trilha) sem ganho algum.

## Consequences

+ Transações locais cobrindo estado + job + evento de auditoria;
+ RLS reforça ADRV-001 contra bugs de aplicação;
+ Um só motor para dados, jobs e fila — simplicidade operacional;
− Dependência de recursos específicos do Postgres (JSONB, RLS, SKIP LOCKED) — aceita, motor amplamente disponível em qualquer provedor.

## Risks

- Crescimento do volume de jobs/documentos no mesmo banco → mitigação: monitoramento (ADRV-008) e gatilhos de separação definidos em ADR-006/ADR-007.

## Condições de revisão

Volume que degrade o banco compartilhado; requisito de compliance exigindo isolamento físico por tenant.
