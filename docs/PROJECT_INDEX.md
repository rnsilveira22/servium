# Índice da Documentação — ServiumAI

> Mapa de toda a documentação do projeto. **Este arquivo deve ser atualizado sempre que documentação estrutural for adicionada.**

```text
README.md
│
├── Visão ..................... docs/PROJECT_VISION.md
├── Princípios ................ docs/PRODUCT_PRINCIPLES.md
├── Glossário ................. docs/GLOSSARY.md
├── Contexto para IA .......... docs/AI_CONTEXT.md
│
├── Arquitetura ............... docs/architecture/README.md
├── Decisões (ADRs) ........... docs/decisions/README.md
│
├── Produto ................... docs/product/README.md
│   ├── Discovery do MVP ...... docs/product/MVP_DISCOVERY.md
│   ├── Escopo do MVP ......... docs/product/MVP_SCOPE.md
│   ├── Personas .............. docs/product/PERSONAS.md
│   ├── Rotinas candidatas .... docs/product/CANDIDATE_ROUTINES.md
│   ├── 1º Funcionário Digital  docs/product/FIRST_DIGITAL_EMPLOYEE.md
│   ├── Fluxo operacional ..... docs/product/OPERATIONAL_FLOW.md
│   ├── Requisitos funcionais . docs/product/FUNCTIONAL_REQUIREMENTS.md
│   ├── Requisitos não func. .. docs/product/NON_FUNCTIONAL_REQUIREMENTS.md
│   ├── Métricas de sucesso ... docs/product/SUCCESS_METRICS.md
│   ├── Riscos e hipóteses .... docs/product/RISKS_AND_HYPOTHESES.md
│   ├── Plano de validação .... docs/product/VALIDATION_PLAN.md
│   └── Backlog macro ......... docs/product/BACKLOG_OVERVIEW.md
│
└── Roadmap ................... docs/roadmap/README.md
```

## Descrição dos documentos

| Documento | Finalidade |
|---|---|
| [`README.md`](../README.md) | Porta de entrada oficial do projeto: o que é o ServiumAI, problema, solução, princípios, status e roadmap. |
| [`PROJECT_VISION.md`](PROJECT_VISION.md) | Por que o ServiumAI existe: visão, problema, proposta de valor, personas, limites e hipóteses a validar. |
| [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) | Princípios de produto e engenharia que restringem e orientam todas as decisões. |
| [`GLOSSARY.md`](GLOSSARY.md) | Vocabulário oficial do domínio, com definições preliminares. |
| [`AI_CONTEXT.md`](AI_CONTEXT.md) | Contexto, regras e restrições para agentes de IA que trabalhem no repositório. |
| [`architecture/README.md`](architecture/README.md) | Preocupações arquiteturais preliminares; a arquitetura definitiva nascerá de ADRs. |
| [`decisions/README.md`](decisions/README.md) | Processo de Architecture Decision Records (ADRs): estados, convenção e template. |
| [`product/README.md`](product/README.md) | Hub da documentação de produto. |
| [`product/MVP_DISCOVERY.md`](product/MVP_DISCOVERY.md) | Documento central do discovery: problema do MVP, cliente, dores, hipótese de solução e critérios para avançar. |
| [`product/MVP_SCOPE.md`](product/MVP_SCOPE.md) | Definição rígida de escopo: In Scope, Out of Scope, critérios de entrada/conclusão. |
| [`product/PERSONAS.md`](product/PERSONAS.md) | Personas operacionais preliminares relevantes para o MVP. |
| [`product/CANDIDATE_ROUTINES.md`](product/CANDIDATE_ROUTINES.md) | Catálogo e ranking preliminar das rotinas candidatas à automação. |
| [`product/FIRST_DIGITAL_EMPLOYEE.md`](product/FIRST_DIGITAL_EMPLOYEE.md) | Especificação hipotética do primeiro Funcionário Digital: missão, limites, permissões, exceções. |
| [`product/OPERATIONAL_FLOW.md`](product/OPERATIONAL_FLOW.md) | Fluxo operacional e estados do primeiro Funcionário Digital, com human-in-the-loop. |
| [`product/FUNCTIONAL_REQUIREMENTS.md`](product/FUNCTIONAL_REQUIREMENTS.md) | Requisitos funcionais do MVP (FR-xxx, MoSCoW). |
| [`product/NON_FUNCTIONAL_REQUIREMENTS.md`](product/NON_FUNCTIONAL_REQUIREMENTS.md) | Requisitos não funcionais preliminares (NFR-xxx). |
| [`product/SUCCESS_METRICS.md`](product/SUCCESS_METRICS.md) | Métricas de sucesso do piloto (baselines a medir, sem metas arbitrárias). |
| [`product/RISKS_AND_HYPOTHESES.md`](product/RISKS_AND_HYPOTHESES.md) | Registro formal de hipóteses (HYP-xxx) e riscos (RSK-xxx). |
| [`product/VALIDATION_PLAN.md`](product/VALIDATION_PLAN.md) | Plano de validação com escritórios contábeis: roteiro, evidências, critérios. |
| [`product/BACKLOG_OVERVIEW.md`](product/BACKLOG_OVERVIEW.md) | Backlog macro por épicos conceituais. |
| [`roadmap/README.md`](roadmap/README.md) | Roadmap por fases, sem datas arbitrárias. |

## Convenções

- Documentação em português brasileiro, em Markdown.
- Marca escrita consistentemente como **ServiumAI**; nome técnico/repositório como **servium**.
- Links relativos entre documentos.
- Fatos e hipóteses devem estar claramente separados.
