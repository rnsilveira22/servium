# ADR-011 — Estratégia de Deployment: PaaS de entrada, sem Kubernetes

## Status

Accepted (HG-002 · 2026-08-22)

## Context

Equipe mínima sem função dedicada de operações; requisitos de backup/recuperação/TLS corretos desde o dia um (NFR-016, ADRV-009); custo proporcional ao piloto (ADRV-011). Kubernetes e orquestração complexa são antecipação injustificável.

## Decision (Accepted)

**PaaS de entrada**: aplicação empacotada como container portátil (backend + SPA), **PostgreSQL gerenciado**, **object storage gerenciado compatível S3**. Dois processos do mesmo artefato (API e worker/scheduler). Ambientes: produção do piloto + ambiente de desenvolvimento/staging simples.

## Alternatives Considered

1. **VPS + Docker Compose** — mais barato, porém backup/patch/TLS/recuperação dependem de disciplina própria; registrado como alternativa legítima quando houver responsável por operação.
2. **Cloud gerenciada completa / Kubernetes** — rejeitado: complexidade e custo sem requisito de escala; viola ADRV-011.

## Consequences

+ Backups, recuperação, TLS e observabilidade básica "de fábrica";
+ Container portátil preserva opção de migrar para VPS/cloud própria depois;
− Custo mensal maior que VPS bruto (aceito no piloto);
− Limites da plataforma de entrada → monitorados; migração é movimentação de container + dump/restore.

## Risks

+ Lock-in de plataforma → mitigado: nada específico de provedor na aplicação; apenas serviços padrão (Postgres, S3-API);
+ Custo crescer com uso → mitigado: alertas de billing (ADRV-008).

## Condições de revisão

Custo mensal desproporcional ao estágio; necessidade de escala multi-região; equipe de operações própria disponível.
