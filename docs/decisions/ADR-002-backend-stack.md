# ADR-002 — Stack de Backend: TypeScript + Node.js (NestJS)

## Status

Proposed

## Context

Backend IO-bound (orquestração de banco, canal de comunicação, storage), equipe mínima, necessidade de velocidade com tipagem e jobs assíncronos simples (ADRV-005, ADRV-011, ADRV-012). Comparação completa em [`../architecture/STACK_EVALUATION.md`](../architecture/STACK_EVALUATION.md).

## Decision (proposed)

**TypeScript + Node.js**, com framework **NestJS** para reforçar os módulos do monólito modular (injeção de dependência, módulos explícitos). Filas via PostgreSQL (ADR-006), sem Redis no MVP.

## Alternatives Considered

1. **Java + Spring Boot** — robustez e maturidade máximas, porém mais verboso (menor velocidade de MVP) e maior pegada de memória em infraestrutura mínima; permanece alternativa sólida se a equipe futura for Java-first.
2. **Python (FastAPI/Django)** — excelente para ML, mas ADRV-013 reduz IA a funções assistivas via API; Celery exigiria broker extra, conflitando com ADRV-006; tipagem culturalmente fraca.

## Consequences

+ Um único idioma (TS) entre backend e frontend, tipos compartilhados;
+ Iteração rápida, contratação abundante no Brasil;
+ Ecossistema imediato para e-mail/storage/LLM;
− Disciplina extra para manter tipagem estrita (strict mode + lint obrigatórios);
− Não é a escolha natural para processamento CPU-intensivo (irrelevante no MVP).

## Risks

- Qualidade variável do ecossistema npm → mitigação: dependências auditadas, lockfile, poucas abstrações;
- NestJS tem curva inicial → aceita em troca de fronteiras reforçadas.

## Condições de revisão

Surgimento de carga CPU-intensiva relevante; mudança estrutural da equipe para outro ecossistema.
