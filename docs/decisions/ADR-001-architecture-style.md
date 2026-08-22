# ADR-001 — Estilo Arquitetural: Monólito Modular

## Status

Accepted (HG-002 · 2026-08-22)

## Context

O MVP é um sistema operacional interno de orquestração (ciclos, cobranças limitadas, documentos, supervisão humana) com carga trivial no piloto (dezenas de clientes), equipe de desenvolvimento mínima e necessidade de velocidade com segurança (drivers ADRV-001..014, em especial ADRV-011 simplicidade e ADRV-012 velocidade). As fronteiras de domínio já estão modeladas em [`../architecture/DOMAIN_BOUNDARIES.md`](../architecture/DOMAIN_BOUNDARIES.md) (7 módulos).

## Decision (proposed)

Adotar **monólito modular**: um único deployável backend com módulos internos de fronteiras explícitas (ownership de dados, dependências direcionadas, comunicação por interfaces/eventos), mais SPA e infraestrutura mínima. Módulos podem ser extraídos para serviços futuramente **somente** quando gatilhos documentados ocorrerem.

## Alternatives Considered

1. **Monólito tradicional (sem módulos)** — rejeitado: mesma simplicidade operacional, mas sem fronteiras; o acoplamento cresce e a evolução (novos Funcionários Digitais, funções multi-tenant) fica cara.
2. **Microsserviços** — rejeitado: custo operacional distribuído (deploy, observabilidade, transações, rede) sem nenhum requisito atual que o justifique; viola ADRV-011 e retarda ADRV-012.

## Consequences

+ Simplicidade operacional máxima (um deploy, um banco, transações locais);
+ Fronteiras preservadas por convenção estrutural (módulos + lint de dependências);
+ Evolução incremental: extração futura de módulo é possível sem reescrita;
− Disciplina necessária para não vazar fronteiras (mitigado por regras automatizadas);
− Extração futura exigirá trabalho deliberado (aceito).

## Risks

+ Erosão gradual das fronteiras por pressão de prazo → mitigação: revisões guiadas por DOMAIN_BOUNDARIES;
+ Crescimento real de volume exceder escala vertical → gatilho de revisão abaixo.

## Condições de revisão

Volume muito acima do piloto; equipes independentes trabalhando em módulos distintos; necessidade de escalonamento isolado de um módulo específico; requisitos de disponibilidade diferenciados por capacidade.
