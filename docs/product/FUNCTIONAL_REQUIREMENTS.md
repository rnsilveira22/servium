# Requisitos Funcionais do MVP — Servium IA

> **Fase 002 — Discovery do MVP**
> Requisitos funcionais preliminares do primeiro MVP (Assistente Digital de Pendências Documentais). Priorização MoSCoW: **Must** (obrigatório) / **Should** (importante) / **Could** (desejável) / **Won't** (explicitamente fora desta versão).
>
> IDs são estáveis: requisitos nunca são renumerados; cancelamentos permanecem no registro.
>
> **AMPLIAÇÃO (2026-09-23):** os FR-020..FR-029 abaixo formalizam a evolução de conceito do primeiro agente para a **Estagiária Digital** — agente operacional configurável, executável, observável, corrigível e progressivamente orientável (atividade → agente executor → execução → resultado → auditoria). Eles **estendem**, não substituem, os FR-001..FR-019. Critérios de aceite de produto são preliminares e sujeitos a Human Gate antes da implementação; a classificação de escopo MVP está em [`MVP_SCOPE.md`](MVP_SCOPE.md) (seção *Classificação de escopo da evolução*). Rastreabilidade completa: [`TRACEABILITY_MATRIX.md`](TRACEABILITY_MATRIX.md).

## Gestão de checklists e configuração

### FR-001 — Manter checklist de documentos por cliente/obrigação

**Descrição:** o escritório pode criar, editar e desativar checklists que definem quais documentos/informações devem ser coletados de cada cliente para cada tipo de obrigação.

**Motivação:** base de todo o fluxo; formaliza conhecimento hoje implícito.

**Critério de aceite:** responsável cria um checklist com múltiplos itens, associa-o a clientes/obrigações e o sistema reflete a associação nos ciclos seguintes.

**Nota de rastreabilidade (HG-FECHAMENTO-CORRECAO-UI · 2026-10-07):** o vínculo obrigação↔template ganhou UI em Nova Obrigação (`ObrigacoesPage.tsx` — select de checklist enviando `template_id`, fechamento **parcial** do GAP-01); criação/gerência de templates segue em M1-UI-01 (gate HG-M1-FRENTE-A).

**Prioridade:** Must

### FR-002 — Cadastrar clientes e responsáveis designados

**Descrição:** o escritório mantém a lista de clientes atendidos pelo MVP, com dados de contato para cobrança e o responsável interno designado.

**Motivação:** direcionamento correto das comunicações e dos escalonamentos.

**Critério de aceite:** cliente criado com canal de contato e responsável; alterações refletem-se em novos ciclos.

**Prioridade:** Must

### FR-003 — Configurar limites de autonomia

**Descrição:** o escritório configura limites do Funcionário Digital: máximo de tentativas por item/ciclo, intervalo entre cobranças, janela de envio e templates aprovados.

**Motivação:** autonomia deve ser explícita e controlada (princípio *Automação responsável*).

**Critério de aceite:** limites editáveis; o Funcionário Digital respeita os valores vigentes no momento da execução, registrados na auditoria.

**Prioridade:** Must

### FR-004 — Gerenciar templates de mensagem aprovados

**Descrição:** o escritório cria e aprova os modelos de mensagem de lembrete/cobrança; apenas mensagens derivadas desses templates podem ser enviadas.

**Motivação:** nenhuma comunicação ao cliente final sem conteúdo aprovado.

**Critério de aceite:** template inativo não gera envios; cada mensagem enviada referencia o template usado.

**Prioridade:** Must

## Execução do ciclo

### FR-005 — Ativar ciclo de pendências com aprovação humana

**Descrição:** o responsável ativa um ciclo (período/obrigação) para um conjunto de clientes; somente após ativação começam as ações automáticas.

**Motivação:** ponto de aprovação humana obrigatório antes de qualquer contato com cliente final.

**Critério de aceite:** nenhum envio ocorre antes da ativação; a ativação é registrada com autoria.

**Prioridade:** Must

### FR-006 — Identificar itens pendentes automaticamente

**Descrição:** ao ativar o ciclo, o sistema compara o checklist de cada cliente com os recebimentos já registrados e marca itens pendentes.

**Motivação:** eliminar conferência manual inicial.

**Critério de aceite:** itens já resolvidos não são recobrados; pendências refletem fielmente o checklist vigente.

**Prioridade:** Must

### FR-007 — Enviar cobranças dentro dos limites configurados

**Descrição:** o Funcionário Digital envia lembretes aos clientes finais para itens pendentes, respeitando tentativas máximas, intervalos, janela de envio e templates.

**Motivação:** núcleo do valor — cobrança consistente sem esforço humano.

**Critério de aceite:** nenhum envio fora dos limites; toda tentativa exaurida resulta em escalonamento, não em nova mensagem.

**Prioridade:** Must

### FR-008 — Receber e associar respostas/documentos ao item correto

**Descrição:** documentos/respostas enviados pelo cliente chegam ao sistema e são associados ao item solicitado correspondente.

**Motivação:** fechar o laço entre cobrança e recebimento sem triagem manual.

**Critério de aceite:** documento recebido fica vinculado a cliente, item e ciclo, com origem registrada.

**Prioridade:** Must

### FR-009 — Validar recebimento de forma básica

**Descrição:** verificação básica do recebido: correspondência com o item solicitado, tipo/tamanho de arquivo esperado e legibilidade mínima.

**Motivação:** evitar aceitar documento errado silenciosamente; detectar problemas cedo.

**Critério de aceite:** recebimentos inválidos geram exceção escalada com motivo; válidos avançam para resolvido. Critérios detalhados por tipo de item são configuráveis (**nível de sofisticação da validação: a definir na Fase 003**).

**Prioridade:** Must

## Supervisão e exceções

### FR-010 — Escalonar exceções ao responsável

**Descrição:** situações definidas como exceção (limite esgotado, recusa, ambiguidade, documento inválido, pendência crítica próxima do prazo) são encaminhadas ao responsável designado com contexto completo.

**Motivação:** princípio *Escalation* — o digital nunca improvisa.

**Critério de aceite:** cada exceção chega ao responsável com histórico do item; item entra em estado `Escalado` e não recebe novas ações automáticas.

**Prioridade:** Must

### FR-011 — Painel de status consolidado

**Descrição:** visão do escritório com estado atual de pendências por cliente, obrigação e ciclo (pendente/cobrado/aguardando/em validação/escalado/resolvido).

**Motivação:** visibilidade consolidada é dor central identificada no discovery.

**Critério de aceite:** responsável consegue responder "o que está pendente e há quanto tempo" sem consultar conversas ou planilhas.

**Prioridade:** Must

### FR-012 — Resolver itens escalados com registro humano

**Descrição:** o responsável registra a decisão sobre itens escalados (resolvido, cancelado, reenviar com aprovação especial), com motivo.

**Motivação:** fechar o ciclo de supervisão com rastreabilidade.

**Critério de aceite:** decisão humana registrada com autoria e motivo; item sai da fila de exceções.

**Prioridade:** Must

## Auditoria e relatórios

### FR-013 — Registrar trilha auditável completa

**Descrição:** toda ação do Funcionário Digital (envios, validações, transições de estado, retries) é registrada de forma imutável e consultável, com timestamp e insumos.

**Motivação:** princípio *Auditabilidade*; requisito inegociável.

**Critério de aceite:** dado um item qualquer, é possível reconstruir sua história completa posteriormente.

**Prioridade:** Must

### FR-014 — Gerar relatório de fechamento de ciclo

**Descrição:** ao encerrar um ciclo, gerar resumo: recebidos × pendentes × escalados × cancelados, por cliente e no total.

**Motivação:** fechamento com revisão humana e insumo para métricas.

**Critério de aceite:** relatório disponível ao fim do ciclo e arquivado.

**Prioridade:** Must

### FR-015 — Notificar responsáveis sobre eventos relevantes

**Descrição:** notificações internas ao escritório para exceções novas, aprovações pendentes e pendências críticas próximas do prazo.

**Motivação:** intervenção humana oportuna sem vigilância constante.

**Critério de aceite:** eventos definidos geram notificação ao responsável designado em tempo útil.

**Prioridade:** Should

### FR-016 — Instrumentar métricas do piloto

**Descrição:** coletar os dados necessários às métricas definidas em [`SUCCESS_METRICS.md`](SUCCESS_METRICS.md) (tempos, taxas, intervenções).

**Motivação:** validar a hipótese central exige medição desde o primeiro dia.

**Critério de aceite:** métricas calculáveis a partir dos registros, sem instrumentação manual adicional.

**Prioridade:** Must

## Fora do MVP (Won't nesta versão)

### FR-017 — Comunicação via WhatsApp automatizada

**Descrição:** canal WhatsApp como meio automático de cobrança.

**Motivação do adiamento:** custo/política da plataforma e complexidade de aprovação. O canal de comunicação definitivo deverá ser decidido posteriormente através de validação de produto (entrevistas, operação real, comportamento dos clientes) e decisão arquitetural documentada — WhatsApp é alternativa relevante a avaliar, não escolha feita.

**Prioridade:** Won't (MVP) — candidato a avaliação pós-piloto

### FR-018 — Integração bidirecional com ERPs contábeis

**Descrição:** sincronização automática com sistemas de gestão do escritório.

**Motivação do adiamento:** piloto aceita carga manual; integração depende do software real do piloto.

**Prioridade:** Won't (MVP)

### FR-019 — Administração multi-tenant (self-service, billing, gestão comercial)

**Descrição:** onboarding autônomo de novos escritórios, administração completa de múltiplos tenants, billing por tenant e recursos avançados de configuração entre tenants.

**Motivação do adiamento:** o piloto opera com um único tenant ativo. **Atenção:** este item adere apenas as *funções administrativas* multi-tenant. A **consciência de tenant** (identidade, isolamento lógico e associação de dados/execuções ao tenant) permanece requisito desde o início — ver NFR-001. Nenhuma decisão estrutural single-tenant deve ser tomada.

**Prioridade:** Won't (MVP)

---

## Evolução da Estagiária Digital — FR-020 a FR-029 (2026-09-23)

> Estes requisitos formalizam o conceito **Atividade** (não apenas "tarefa") e o **Agente Executor** configurável/extensível. **FR-020 e FR-021 foram implementados** (2026-09-23) como entidades (`atividades` + catálogo `agentes` por tenant com a Estagiária Digital — ver `TRACEABILITY_MATRIX.md`); os demais começam como 📋 **formalizado** e a implementação segue o fluxo da Factory V2 (níveis L1/L2, Human Gates quando aplicável). O MVP terá **apenas** a Estagiária Digital como agente executora; os demais agentes do catálogo são **futuros**, e a arquitetura não deve impedi-los.
>
> **HG-APROVAÇÃO-NOMENCLATURA ✅ (aprovado por humano em 2026-09-23):** o nome do primeiro agente executor é **Estagiária Digital** (*Assistente Digital de Pendências Documentais* é a capacidade). Aprovação registrada por este agente após confirmação explícita do usuário.

### FR-020 — Modelar atividade operacional recorrente (não apenas tarefa)

**Descrição:** o sistema distingue conceitualmente *Atividade* (ex.: "Solicitação mensal de documentos para fechamento do balancete") de *tarefa isolada*. Uma atividade possui: nome, periodicidade (ex.: mensal, competência), escopo de clientes ativos, agente executor, canal, prazo definido por regra, checklist da competência e comportamento de solicitar/acompanhar/cobrar/registrar recebimentos/identificar pendências/escalar exceções.

**Motivação:** o usuário cadastra a *rotina*, não um conjunto solto de tarefas; a recorrência e o comportamento operacional são propriedades da atividade.

**Critério de aceite (preliminar):** o usuário cadastra uma atividade com periodicidade e escopo; o sistema gera as execuções correspondentes a cada período; as execuções herdam agente, canal, checklist e regras da atividade.

**Prioridade:** Must (MVP) — ✅ **implementado** (2026-09-23): cadastro/edição/ativação da atividade com nome, periodicidade, escopo `todos_ativos`, agente, canal, prazo, checklist e comportamento; ver `apps/api/src/cadastro/atividades.controller.ts`, `apps/web/src/pages/AtividadesPage.tsx` e `apps/api/test/atividades.test.ts`. A **geração automática de execuções por período** permanece como ponto de extensão (FR-022).

### FR-021 — Selecionar o agente executor da atividade

**Descrição:** o usuário escolhe qual agente executa determinada atividade. O agente é uma **entidade/configuração extensível** (ex.: `Estagiária Digital` hoje; `Assistente Pleno`, `Analista Fiscal`, `Analista Contábil`, `Analista Financeiro` no futuro). Nenhum caminho do código pode assumir `atividade → estagiária` de forma fixa.

**Motivação:** requisito estrutural — a plataforma é de *funcionários digitais*; agentes são funções extensíveis, não um atalho hardcoded.

**Critério de aceite (preliminar):** existe uma configuração canônica de agente com identidade; a atividade referencia o agente executor; a auditoria registra o agente que executou cada ação (base já existente: `actor_type='servico'` + `requireServiceId` — ver `TRACEABILITY_MATRIX.md` FR-021).

**Prioridade:** Must (MVP) — ✅ **implementado** (2026-09-23): catálogo `agentes` por tenant com seed automático da Estagiária Digital (`migration 0014`, trigger `trg_agentes_seed`); `atividades.agente_id` referencia por FK (sem hardcode); `GET /agentes` alimenta o seletor. Agentes futuros **não** foram criados — apenas extensibilidade arquitetural.

### FR-022 — Definir periodicidade e competência da atividade

**Descrição:** a atividade declara periodicidade (ex.: mensal, trimestral) e competência (mês/ano) para o qual cada execução coleta documentos.

**Motivação:** "todo mês solicitar documentos do balancete" deve ser representado como rotina recorrente, não como cobrança avulsa.

**Critério de aceite (preliminar):** execuções são criadas por competência; prazo de cada execução derivado da regra; alteração de periodicidade afeta execuções futuras (auditável).

**Prioridade:** Should (MVP) / Must se char slug `competencia` — revisão de produto antes da implementação.

### FR-023 — Organização documental por cliente/competência/categoria

**Descrição:** documentos recebidos podem ser classificados e organizados: receber, identificar tipo, classificar, renomear, separar por cliente, por competência/mês e por categoria (Boletos, Notas Fiscais, Contas a Pagar, Contas a Receber, Outros). Estrutura-alvo conceitual: `Cliente → Ano → Competência → Categoria → Documentos`.

**Motivação:** a organização documental (RC-04) complementa a coleta documental e é candidata natural à segunda capacidade da Estagiária Digital.

**Critério de aceite (preliminar):** recebido no item do checklist, o documento pode ser visualizado dentro da estrutura por cliente/competência/categoria; classificação registrada e auditável.

**Prioridade:** **Pós-MVP** (declarada fora do MVP-01 em `MVP_SCOPE.md`).

### FR-024 — Classificação com níveis de confiança

**Descrição:** a organização/classificação não presume acerto automático. Níveis de confiança definidos conceitualmente: **ALTA** → execução automática; **MÉDIA** → execução + sinalização/revisão; **BAIXA** → não executar automaticamente, gerar exceção/revisão humana.

**Motivação:** evitar o falso positivo silencioso; decidir o grau de autonomia por confiança, coerentemente com o princípio *Automação responsável*.

**Critério de aceite (preliminar):** nenhuma ação automática ocorre com confiança BAIXA; classificações MÉDIA sinalizam revisão; a confiança registrada na auditoria.

**Prioridade:** **Pós-MVP** no MVP-01 (implementação concreta avaliada conforme estágio; sem introduzir IA desnecessária). Ver `ADR-010` (determinístico-first).

### FR-025 — Feedback do usuário ↔ agente (distinto de aprendizado cego)

**Descrição:** o usuário pode corrigir/orientar explicitamente: feedback **operacional** (corrige uma execução específica), **regra operacional** (orientação a reaplicar), **configuração da atividade** (mudança da rotina) e **exceção** (situação não resolvível automaticamente). Distinguir essas quatro classes; **não** tratar toda mensagem como "aprendizado automático".

**Motivação:** o agente é *progressivamente orientável*; correções relevantes devem virar regra/configuração com rastreabilidade, não efeito silencioso.

**Critério de aceite (preliminar):** o sistema registra autor, data/hora, regra anterior, regra nova e origem de cada orientação; nenhuma alteração crítica de comportamento ocorre sem registro/revisão; a auditoria distingue intervenção humana.

**Prioridade:** **MVP incremental** (depois do fluxo principal estável).

### FR-026 — Dashboard operacional orientada à ação

**Descrição:** a dashboard mostra o *trabalho efetivamente realizado pelo agente*, não apenas Concluído/Pendente/Atrasado. Para uma atividade (ex.: solicitação mensal): clientes no ciclo, solicitações enviadas, e-mails entregues, respostas recebidas, documentações completas, pendências, cobranças realizadas, atrasadas, exceções, taxa de resposta, tempo médio de resolução.

**Motivação:** o usuário precisa responder "o que está acontecendo / o que o agente fez / o que falta / o que precisa de mim" (spec UX v1 §2).

**Critério de aceite (preliminar):** cada indicador tem significado operacional ligado a uma ação; sem cards sem contexto; dados derivados da trilha auditável.

**Status (2026-10-07):** 🟡 **backend pronto / UI continua mínima** — `GET /metrics/negocio` (B-5, admin-only, RLS) entrega agregações operacionais: ciclos, ciclosAbertos, itensResolvidos, excecoesAbertas, documentosEnviados/Recebidos, tempoMedioResolucaoHoras, percentualResolvidosSemEscalada, tentativasMediaAteResposta, pendenciasTotal/PorCliente (+ camada `tecnica`: jobsEmRetry, jobsPresos, mensagensSemCorrelacao, errosEnvio). Evidência: `apps/api/src/common/metrics-negocio.service.ts` + `apps/api/test/metrics-negocio.test.ts` (RBAC/RLS/agregações). A UI do dashboard permanece a mínima da FR-011.

**Prioridade:** **MVP incremental**; evolução da FR-011/dashboard mínima já existente.

### FR-027 — Timeline operacional da atividade

**Descrição:** visualizar a sequência de acontecimentos de uma atividade/execução: solicitação enviada, documento recebido, classificado, checklist atualizado, pendência, cobrança enviada (D+2), resposta, atividade concluída — em vez de apenas "Status: Concluído".

**Motivação:** timeline é mais informativa que status isolado para o usuário operacional (spec UX v1 §9, §12).

**Critério de aceite (preliminar):** cada evento relevante é apresentado com quem/quando/o que/resultado; fonte de dados: `eventos_auditoria` + estados de item.

**Nota de rastreabilidade (HG-009 · 2026-09-24):** por D5 a timeline do ciclo (FR-027) pode continuar independente de `eventos_operacionais` (sobre `eventos_auditoria` + `mensagens_comunicacao` + `documentos` + `excecoes`); o **feed global** (Home "Atividade recente") ficará vinculado à futura entidade `eventos_operacionais` — ver [`ADR-012`](../decisions/ADR-012-atividade-evento-model.md) (`Accepted`) e Decision Pack [`HG-009`](../factory/HUMAN_GATE_ADR012_2026-09-24.md).

**Prioridade:** **MVP incremental**.

### FR-028 — Auditoria operacional (além do log técnico)

**Descrição:** a interface de auditoria responde a perguntas operacionais: o que aconteceu, quem executou, **qual agente**, para qual cliente, quando, qual resultado, o que mudou, qual regra estava aplicada, houve intervenção humana/erro/exceção, qual impacto. Ex.: "Estagiária Digital · Cliente XYZ · Documento NF_123.pdf · Classificação Nota Fiscal · Competência 09/2026 · Confiança 97% · Resultado: organizado automaticamente · Origem: E-mail". Os eventos atuais (`eventos_auditoria`) **não** devem ser apresentados como log de chamadas (GET/POST) ao usuário.

**Motivação:** a auditoria de dados já existe e é sólida (FR-013); falta a camada **operacional** de apresentação e correlação agente/cliente/documento.

**Critério de aceite (preliminar):** página de auditoria apresenta eventos em linguagem operacional com correlação agente→cliente→ação→resultado→intervenção humana; log técnico permanece disponível separadamente (admin).

**Status (2026-09-23):** ✅ **IMPLEMENTADO** — `GET /auditoria` responde eventos com bloco `operacional` (presenter `apps/api/src/auditoria/presenter.ts`, 21 ações/29 linhas mapeadas) e filtros `desde`/`ate`/`actor_type`/`cliente_id`; `AuditoriaPage.tsx` apresenta cards operacionais (agente·cliente·atividade·resultado·alterações·severidade) com `<details>` técnico por evento e métricas/saúde preservadas; RBAC admin + append-only + RLS intactos; dado ausente nunca é inventado. Evidências: `apps/api/test/auditoria-operacional.test.ts` (18), `apps/web/src/pages/AuditoriaPage.test.tsx` (7). Pendências: filtros de resultado/exceção/intervenção humana como filtro SQL → FR-027 (hoje expostos como label/severidade na UI).

**Prioridade:** **MVP incremental** (dados já existem; falta apresentação/correlação).

### FR-029 — UX/UI consistente e orientada à operação

**Descrição:** interface clara, moderna, consistente e agradável; orientada a ação ("o que está acontecendo → por que → o que o agente fez → o que falta → o que precisa de intervenção"). Proibido: dashboard de cards sem significado, logs técnicos como auditoria, tabelas sem contexto, status sem explicação.

**Motivação:** evolução de interface é parte do MVP (spec UX v1), não enfeite.

**Critério de aceite (preliminar):** conforme `MVP_EXPERIENCE_SPEC_v1.md` (princípios §4, critérios §24–§26); M0 UX feito; M1 (Frente A) pendente de PR/gate.

**Prioridade:** **MVP obrigatório** para o teste real com a Innove (base); implementação incremental.
