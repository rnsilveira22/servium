# Glossário — Servium IA

> Vocabulário oficial do projeto. Os termos representam **conceitos de domínio**, não necessariamente entidades de banco de dados, classes ou tabelas. Definições são preliminares e evoluirão com a especificação do MVP.

| Termo | Definição preliminar |
|---|---|
| **Servium IA** | Plataforma B2B de funcionários digitais especializados. Marca comercial do produto. |
| **servium** | Nome técnico do projeto/repositório. |
| **Tenant** | Cliente da plataforma. Unidade de isolamento lógico de dados e configuração. |
| **Organização** | Empresa cliente dentro da plataforma; corresponde, na prática, a um tenant (distinção formal será definida na especificação). |
| **Usuário** | Pessoa que acessa a plataforma em nome de uma organização (ex.: sócio, contador, operador). |
| **Funcionário Digital** | Unidade de trabalho digital com função, responsabilidades, capacidades, ferramentas, permissões, limites e supervisão, que executa tarefas sob governança humana. Não é apenas um chatbot. |
| **Função** | Papel exercido por um funcionário digital (ex.: primeiro atendimento, classificação de solicitações, rotinas contábeis). |
| **Capacidade** | Aquilo que um funcionário digital sabe fazer dentro de sua função. |
| **Ferramenta** | Sistema ou recurso que um funcionário digital pode utilizar para executar seu trabalho (ex.: consulta a sistema externo, emissão de documento). |
| **Permissão** | Autorização explícita que define o que um funcionário digital pode acessar ou executar. Princípio: menor privilégio. |
| **Tarefa** | Unidade de trabalho atribuída a um funcionário digital, com objetivo verificável. |
| **Execução** | Ocorrência registrada de uma tarefa realizada por um funcionário digital, com entradas, passos e resultado auditáveis. |
| **Workflow** | Sequência definida de etapas e condições pelas quais tarefas fluem, incluindo pontos de aprovação e escalonamento. |
| **Exceção** | Situação fora do padrão previsto em que o funcionário digital não deve prosseguir por conta própria. |
| **Escalonamento** | Encaminhamento explícito de uma exceção ou decisão crítica para uma pessoa ou fluxo humano apropriado. |
| **Supervisão Humana** | Conjunto de mecanismos pelos quais pessoas monitoram, revisam e aprovam o trabalho dos funcionários digitais. |
| **Auditoria** | Registro consultável que permite reconstruir execuções e ações relevantes posteriormente. |
| **Integração** | Conexão controlada entre a plataforma e sistemas externos, sempre sujeita a permissões e auditoria. |

## Termos relacionados

- **ADR** (Architecture Decision Record) — registro documentado de uma decisão arquitetural. Ver [`decisions/README.md`](decisions/README.md).
- **MVP** — Minimum Viable Product; primeira versão do produto com valor validável.
- **LGPD** — Lei Geral de Proteção de Dados (Lei nº 13.709/2018), aplicável ao tratamento de dados pessoais no Brasil.

## Termos adicionados (2026-09-23 — evolução Estagiária Digital)

> Formalizados com os requisitos FR-020..FR-029 ([`product/FUNCTIONAL_REQUIREMENTS.md`](product/FUNCTIONAL_REQUIREMENTS.md)). Rastreabilidade: [`product/TRACEABILITY_MATRIX.md`](product/TRACEABILITY_MATRIX.md). **Status (2026-09-23):** Atividade e Agente Executor foram **implementados** (entidades `atividades` e `agentes` — migration `0014_atividades_agentes.sql`); Execução e demais termos permanecem como conceitos de pontos de extensão (FR-022+).

| Termo | Definição |
|---|---|
| **Estagiária Digital** | Primeiro agente operacional da plataforma — Assistente Digital de Pendências Documentais. Agente operacional configurável, executável, observável, corrigível e progressivamente orientável pelo usuário. **Implementado** (catálogo `agentes`, slug `estagiaria-digital`, seed por tenant). |
| **Atividade** | Rotina operacional recorrente definida pelo usuário (ex.: "solicitação mensal de documentos para fechamento") com periodicidade, escopo, agente executor, canal, prazo, checklist e comportamento de execução. Diferente de tarefa isolada. **Implementado** (entidade `atividades`, por tenant com RLS). |
| **Agente Executor** | Entidade/configuração extensível que executa uma atividade. O MVP possui apenas a Estagiária Digital; agentes futuros (Assistente Pleno, Analistas) não devem ser impedidos pela arquitetura. **Implementado** — atividade referencia o agente por FK (`agente_id`), sem hardcode. |
| **Execução** | Ocorrência de uma atividade em um período/competência, gerada pela definição recorrente, com resultado e auditoria próprios. |
| **Competência** | Período (mês/ano) ao qual uma execução coleta documentos (ex.: 09/2026). |
| **Confiança de classificação** | Nível usado na organização documental: ALTA (automático), MÉDIA (execução + sinalização/revisão), BAIXA (não executar automaticamente; gerar exceção). |
| **Feedback operacional** | Correção de uma execução específica do agente (ex.: "este documento foi classificado errado"). |
| **Regra operacional** | Orientação do usuário que deve ser reaplicada nas próximas execuções (ex.: "quando aparecer esse tipo, considere boleto"). |
| **Organização documental** | Capacidade de receber, identificar tipo, classificar, organizar/renomear e separar documentos por cliente, competência/mês e categoria. |
| **Timeline operacional** | Representação da sequência de acontecimentos de uma atividade/execução (solicitação → recebimento → classificação → cobrança → conclusão), em vez de apenas status final. |
| **Auditoria operacional** | Camada de apresentação da trilha auditável que responde o que aconteceu, quem/qual agente executou, para qual cliente, quando, com qual resultado e se houve intervenção humana — distinta do log técnico de chamadas. |
