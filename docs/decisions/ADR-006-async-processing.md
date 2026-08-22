# ADR-006 — Processamento Assíncrono: Jobs Persistidos no PostgreSQL

## Status

Accepted (HG-002 · 2026-08-22)

## Context

Ciclos, cobranças agendadas, retries e validações ocorrem em background (ADRV-005), com exigência de idempotência de efeitos externos (ADRV-003/NFR-008) e simplicidade operacional máxima (ADRV-011). Escala do piloto: dezenas de clientes × itens mensais.

## Decision (proposed)

**Fila de jobs persistida no próprio PostgreSQL** (tabela de jobs com estados, `SKIP LOCKED` para concorrência segura), executada pelo worker do backend. Padrão transactional outbox conceitual: intenção de efeito externo registrada na mesma transação do estado de negócio; envio só ocorre com chave de idempotência.

## Alternatives Considered

1. **Fila dedicada (Redis/RabbitMQ)** — infra extra para operar/backupear sem necessidade atual; gatilho de migração documentado abaixo.
2. **Workflow engine (Temporal etc.)** — poderosa, porém plataforma inteira a operar; antecipação injustificável no MVP.

## Consequences

+ Zero infraestrutura nova; backup/recuperação herdados do banco;
+ Consistência transacional entre estado de negócio e job;
− Throughput limitado comparado a brokers dedicados (suficiente por muito tempo no nosso perfil);
− Polling periódico (aceitável; latência de segundos é irrelevante aqui).

## Risks

+ Acúmulo de jobs atrasados em falha prolongada do canal → mitigação: NFR-009 (sem rajadas na recuperação; backoff) + alarme de fila crescente.

## Condições de revisão

Volume/latência de jobs que degrade o banco ou o fluxo interativo; necessidade de agendamentos complexos multi-etapas com versão — então avaliar fila dedicada ou workflow engine.
