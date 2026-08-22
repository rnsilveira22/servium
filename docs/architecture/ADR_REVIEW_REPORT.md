# ADR Review Report — Fase 2

> Revisão arquitetural formal dos ADR-001..011 (todos `Proposed`). Método: cada decisão avaliada contra os drivers (`ARCHITECTURE_DRIVERS.md`), evidências do repositório e estágio real do produto (repositório documental, pré-implementação). **Nenhum status foi alterado nesta revisão** — recomendações aguardam decisão humana (`AWAITING_HUMAN_ARCHITECTURE_DECISION`).
>
> **RESOLUÇÃO (HG-002 · 2026-08-22):** Rodrigo aceitou o pacote ADR-001..011 conforme as recomendações desta revisão. Todos os ADRs estão agora `Accepted`; as condições registradas abaixo permanecem obrigatórias. Registro formal em [`../factory/HUMAN_DECISIONS_LOG.md`](../factory/HUMAN_DECISIONS_LOG.md). O corpo deste relatório é preservado como snapshot da análise.

## Ordem de revisão (dependências)

`Product constraints (implícitas)` → ADR-001 estilo → ADR-004 persistência → ADR-005 tenant → ADR-002 backend → ADR-003 frontend → ADR-009 auth → ADR-006 jobs → ADR-007 documentos → ADR-008 comunicação → ADR-010 IA → ADR-011 deployment

---

## ADR-001 — Estilo Arquitetural: Monólito Modular

- **Problem**: como organizar um sistema de orquestração interno sem custo operacional distribuído nem acoplamento que inviabilize evolução.
- **Drivers**: ADRV-011 (simplicidade, Must), ADRV-012 (velocidade, Must), ADRV-010 (evolução, Should), ADRV-001/002/004 (módulos facilitam isolamento/auditoria/gates).
- **Assumptions**: carga do piloto trivial (dezenas de clientes); equipe 1–3 pessoas; fronteiras já modeladas em DOMAIN_BOUNDARIES (7 módulos).
- **Alternatives**: monólito sem módulos (sem fronteiras); microsserviços (custo sem requisito) — ambas rejeitadas com justificativa correta.
- **Trade-offs**: (+) um deploy, transações locais, simplicidade máxima; (−) disciplina para não vazar fronteiras; extração futura deliberada.
- **Risks**: erosão de fronteiras por pressão de prazo (mitigação documentada); escala vertical insuficiente (gatilho definido).
- **MVP Fit**: excelente — é a escolha canônica para este perfil de sistema e equipe.
- **Reversibility**: `MODERATE` (extração de módulo possível por design; reescrita distribuída evitada).
- **Evidence**: DOMAIN_BOUNDARIES.md (7 módulos com ownership), drivers com rastreabilidade FR/NFR, STACK_EVALUATION.md coerente.
- **Dependencies**: todas as demais decisões assumem este estilo; ADR-002 reforça fronteiras via NestJS modules.
- **Conflicts**: nenhum encontrado.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES`

## ADR-004 — Persistência: PostgreSQL

- **Problem**: persistência transacional para domínio relacional denso com trilha append-only, JSON flexível e base para RLS/jobs.
- **Drivers**: ADRV-001 (Must), ADRV-002 (Must), ADRV-007 (Must), ADRV-011 (Must).
- **Assumptions**: volume compatível com banco único; provedores gerenciados amplamente disponíveis.
- **Alternatives**: MySQL (sem RLS comparável); NoSQL (viola consistência da trilha sem ganho) — rejeições corretas.
- **Trade-offs**: (+) transações locais cobrindo estado+job+auditoria, um motor só; (−) dependência de recursos PG-specific (aceita e universal).
- **Risks**: crescimento compartilhado (monitoramento + gatilhos em ADR-006/007).
- **MVP Fit**: adequado; alternativa mais segura disponível no mercado.
- **Reversibility**: `HARD` após dados reais (janela pré-código é o momento barato de decidir).
- **Evidence**: requisitos relacionais em FUNCTIONAL_REQUIREMENTS; NFR-001/006; padrão SKIP LOCKED citado corretamente.
- **Dependencies**: ADR-005 (RLS), ADR-006 (jobs), ADR-007 (metadados), ADR-009 (tabelas RBAC).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES`

## ADR-005 — Tenant: Shared Schema + tenant_id + RLS

- **Problem**: garantir isolamento lógico desde o dia 1 (NFR-001) sem custo estrutural de N bancos/schemas.
- **Drivers**: ADRV-001 (Must), ADRV-009, RSK-004.
- **Assumptions**: RLS configurável por provedor gerenciado; disciplina de testes de vazamento no pipeline.
- **Alternatives**: database-per-tenant (custo inviável agora; opção enterprise futura registrada); schema-per-tenant (pior dos mundos neste porte) — análise sólida.
- **Trade-offs**: (+) operação simples, métricas agregadas triviais; (−) risco de vazamento por bug mitigado por RLS deny-by-default + testes dedicados.
- **Risks**: erro humano em política RLS → mitigação por testes automatizados de isolamento (obrigatórios no primeiro ciclo).
- **MVP Fit**: adequado ao piloto single-tenant sem acoplamento hardcoded (diretriz explícita da Fase 002.1).
- **Reversibility**: `HARD`.
- **Evidence**: NFR-001; AI_CONTEXT (regra anti-hardcoded single-tenant); ADRV-001.
- **Dependencies**: ADR-004; impacta todo modelo de dados; ADR-009 contextualiza autorização por tenant.
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT` — **com condição**: pipeline deve incluir testes automatizados de isolamento antes do primeiro deploy com dado real.
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES` (decisão de segurança crítica — Level 3)

## ADR-002 — Backend: TypeScript + Node.js (NestJS)

- **Problem**: stack de backend produtiva, tipada e adequada a workload IO-bound com equipe mínima.
- **Drivers**: ADRV-012 (Must), ADRV-011 (Must), ADRV-008/014 (Should), ADRV-010 (porta p/ provedores).
- **Assumptions**: carga CPU-intensiva irrelevante no MVP; contratação BR abundante.
- **Alternatives**: Spring Boot (robusto, mais verboso/pesado); Python/FastAPI (IA reduzida a API assistiva; Celery exigiria broker extra conflitando com ADR-006) — trade-offs corretos.
- **Trade-offs**: (+) idioma único TS, tipos compartilhados, ecossistema imediato; (−) disciplina strict mode; NestJS tem curva inicial.
- **Risks**: qualidade variável do npm (mitigação: lockfile + auditoria + poucas abstrações).
- **MVP Fit**: bom; NestJS justificado especificamente por reforçar módulos do ADR-001 (não por popularidade).
- **Reversibility**: `EASY` hoje (pré-código) → `HARD` após implementação. Decidir antes do primeiro ciclo maximiza reversibilidade.
- **Evidence**: STACK_EVALUATION.md compara alternativas com critérios dos drivers; ADR-006 alinhado (sem Redis).
- **Dependencies**: ADR-001 (estilo), ADR-003 (idioma compartilhado), ADR-006 (execução dos jobs pelo worker Node).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES`

## ADR-003 — Frontend: React + TypeScript (SPA)

- **Problem**: UI operacional interna (painéis densos, filas, aprovações) sem SEO/usuário externo.
- **Drivers**: ADRV-012, ADRV-014 (Should), ADRV-010.
- **Assumptions**: equipe sem preferência consolidada por Vue (o próprio ADR registra esta condição de revisão).
- **Alternatives**: Vue 3 (viável; reversível sem impacto nas demais ADRs); SSR/meta-frameworks (corretamente rejeitados para app interna).
- **Trade-offs**: (+) ecossistema profundo para dashboards, tipos compartilhados; (−) atenção padrão a estado/roteamento.
- **Risks**: escolha por popularidade sem ajuste à equipe — explicitamente registrado no ADR.
- **MVP Fit**: adequado.
- **Reversibility**: `MODERATE` (fronteira limpa via API; troca antes da implementação é `EASY`).
- **Evidence**: STACK_EVALUATION.md; FUNCTIONAL_ARCHITECTURE (C1–C12 são telas operacionais).
- **Dependencies**: ADR-002 (monorepo TS, tipos compartilhados); independente das demais.
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT` — com nota: se houver preferência comprovada por Vue, decidir ANTES de aceitar (janela reversível).
- **Confidence**: `MEDIUM` (fator humano/equipe não confirmado)
- **Human Decision Required**: `YES`

## ADR-009 — Autenticação: First-party + RBAC mínimo

- **Problem**: autenticar usuários humanos do escritório com papéis mínimos, auditoria de ações sensíveis e contexto de tenant, sem IdP externo prematuro.
- **Drivers**: ADRV-009 (Must), ADRV-001 (Must), ADRV-011, NFR-002/003.
- **Assumptions**: capacidade de implementar auth própria corretamente (OWASP ASVS); SSO futuro previsto mas não exigido.
- **Alternatives**: IdP gerenciado (custo por usuário + dependência cedo demais); JWT stateless (revogação difícil para kill switch) — rejeição do JWT bem fundamentada.
- **Trade-offs**: (+) controle total de sessão/papéis/tenant, zero custo externo; (−) responsabilidade de segurança é nossa (mitigada por bibliotecas consolidadas argon2/bcrypt + rate limiting).
- **Risks**: falha de implementação própria (fixação de sessão etc.) → checklist OWASP ASVS proporcional.
- **MVP Fit**: adequado; desenho OIDC-ready preserva saída futura.
- **Reversibility**: `MODERATE` (trocar auth após dados/usuarios reais é trabalhoso mas mapeável).
- **Evidence**: NFR-002/003; DOMAIN_BOUNDARIES (módulo Identity); ADRV-001/009.
- **Dependencies**: ADR-004 (tabelas), ADR-005 (contexto tenant na autorização), ADR-001 (módulo Identity).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT` — **com condição**: checklist OWASP ASVS e testes de segurança básicos obrigatórios na primeira história de autenticação.
- **Confidence**: `MEDIUM-HIGH` (segurança self-managed exige execução disciplinada)
- **Human Decision Required**: `YES` (Level 3 — modelo de autenticação)

## ADR-006 — Assíncrono: Jobs Persistidos no PostgreSQL

- **Problem**: ciclos/cobranças/retries em background com idempotência de efeitos externos e zero infra extra.
- **Drivers**: ADRV-005 (Must), ADRV-003 (Must), ADRV-011 (Must), ADRV-004.
- **Assumptions**: latência de segundos aceitável; throughput do piloto trivial.
- **Alternatives**: Redis/RabbitMQ (infra extra sem necessidade); Temporal/workflow engine (plataforma inteira antecipada) — rejeições corretas com gatilho de migração definido.
- **Trade-offs**: (+) consistência transacional estado↔job, backup herdado; (−) polling e throughput limitados (irrelevantes aqui).
- **Risks**: fila crescente em falha prolongada de canal → NFR-009 (backoff, sem rajadas) + alarme.
- **MVP Fit**: excelente; transactional outbox atende NFR-008 diretamente.
- **Reversibility**: `MODERATE` (padrão de jobs encapsulado; migrar tabela→broker depois é localizado).
- **Evidence**: OPERATIONAL_FLOW (agendador); NFR-008/017; ADRV-003/005.
- **Dependencies**: ADR-004 (mesmo motor), ADR-002 (worker do backend), ADR-008 (idempotência de envio).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES`

## ADR-007 — Documentos: Object Storage S3 + Metadados no Banco

- **Problem**: armazenar documentos pessoais (LGPD) com integridade, imutabilidade, vínculo auditável, retenção executável e custo previsível.
- **Drivers**: ADRV-007 (Must), ADRV-006 (serviço externo tolerante), ADRV-002 (vínculo auditável), NFR-004/005/010.
- **Assumptions**: provedor S3-compatível gerenciado disponível; URLs assinadas curtas suficientes.
- **Alternatives**: filesystem local (frágil, contraria NFR-016); bytea no banco (incha backups, complica retenção) — rejeições corretas.
- **Trade-offs**: (+) durabilidade gerenciada, ciclo de vida LGPD, backups leves; (−) mais um serviço externo (mitigado por porta/adaptador) e custo por GB monitorado.
- **Risks**: URL assinada vazada (expiração curta + log de acesso); órfãos arquivo↔metadado (escrita em duas etapas + reconciliação).
- **MVP Fit**: adequado; eliminação física LGPD viável.
- **Reversibility**: `MODERATE` (conteúdo atrás da porta de storage).
- **Evidence**: NFR-004/005/010/016; RSK-004; FR-008/009.
- **Dependencies**: ADR-004 (metadados), ADR-011 (provedor gerenciado), ADR-005 (autorização contextual por tenant no acesso).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES` (implica contratação de serviço com custo recorrente — Level 3 na hora de escolher provedor)

## ADR-008 — Comunicação: Porta CommunicationChannel

- **Problem**: core não pode depender de canal/provedor específico enquanto o canal real não foi validado (e-mail é hipótese HYP-005).
- **Drivers**: ADRV-006 (Must), ADRV-010 (Should), ADRV-003 (idempotência de envio), NFR-007/008.
- **Assumptions**: porta mínima (texto + anexo + resposta) representa necessidades reais do fluxo; WhatsApp/outros podem exigir revisão futura da porta.
- **Alternatives**: acoplamento direto a provedor de e-mail (transforma hipótese em prisão); plataforma omnichannel antecipada (custo sem validação) — rejeições corretas.
- **Trade-offs**: (+) troca de canal sem tocar core, adaptador fake para testes; (−) risco de abstração mal desenhada (mitigado: porta mínima orientada a necessidades reais).
- **Risks**: modelos de conversa distintos em canais futuros → porta será revisada sob requisito real.
- **MVP Fit**: excelente; ledger de envios no módulo Communication garante auditoria/idempotência.
- **Reversibility**: `EASY` (a abstração É o mecanismo de reversão).
- **Evidence**: HYP-005; VALIDATION_PLAN; AI_USAGE_BOUNDARIES; ADRV-006/010.
- **Dependencies**: ADR-001 (módulo Communication), ADR-006 (outbox/chave de idempotência), ADR-010 (templates aprovados, sem geração livre).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES`

## ADR-010 — IA: Determinístico-first, LLM isolado e assistivo

- **Problem**: onde (e onde não) usar IA/LLM num produto cujo fluxo é majoritariamente determinístico, controlando custo/não-determinismo/alucinação.
- **Drivers**: ADRV-013 (Must), ADRV-008 (custo), RSK-003/RSK-009, ADRV-004 (veredito humano).
- **Assumptions**: classificação de respostas ambíguas é o único ponto onde linguagem natural aparece no MVP; provedor escolhido só na implementação se validado.
- **Alternatives**: LLM em tudo (custo/risco sem ganho); zero IA (perde valor real na classificação ambígua) — equilíbrio correto.
- **Trade-offs**: (+) previsibilidade onde importa, ausência de LLM não inviabiliza MVP; (−) classificação limitada no piloto (escalonamento humano é comportamento desejado).
- **Risks**: alucinação como veredito (saída nunca conclusiva + amostragem M-05); prompt injection (conteúdo como dado, nunca instrução).
- **MVP Fit**: excelente; espelha exatamente AI_USAGE_BOUNDARIES.
- **Reversibility**: `EASY` (porta provider-agnóstica; adicionar/remover LLM é localizado).
- **Evidence**: AI_USAGE_BOUNDARIES.md (classificação função a função); M-05/M-11; ADRV-013.
- **Dependencies**: ADR-008 (canal entrega o conteúdo), ADR-002 (porta implementada no backend), ADRV-002 (prompt/versão registrados na trilha).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT`
- **Confidence**: `HIGH`
- **Human Decision Required**: `YES`

## ADR-011 — Deployment: PaaS de entrada, sem Kubernetes

- **Problem**: operar com backup/TLS/recuperação corretos desde o dia 1 sem equipe de ops nem orquestração complexa.
- **Drivers**: ADRV-011 (Must), ADRV-009 (Must), ADRV-008, NFR-016, ADRV-012.
- **Assumptions**: custo mensal PaaS aceitável no piloto; container portátil preserva migração futura.
- **Alternatives**: VPS+Compose (mais barato, exige disciplina de ops — legítimo quando houver responsável); K8s/cloud completa (antecipação injustificável) — análise correta.
- **Trade-offs**: (+) backup/recuperação/TLS "de fábrica"; (−) custo maior que VPS bruto (aceito); limites da plataforma monitorados.
- **Risks**: lock-in (mitigado: nada específico de provedor, apenas Postgres/S3-API); billing surpresa (alertas).
- **MVP Fit**: adequado; dois processos (API + worker) do mesmo artefato coerentes com ADR-001.
- **Reversibility**: `EASY-MODERATE` (container portátil; movimentação + dump/restore).
- **Evidence**: NFR-016; ADRV-009/011; MVP_SCOPE (restrições).
- **Dependencies**: ADR-001 (artefato único), ADR-004 (Postgres gerenciado), ADR-007 (storage gerenciado).
- **Conflicts**: nenhum.
- **Recommendation**: `ACCEPT` — **com condição**: escolha concreta do PaaS e aprovação do custo recorrente são Level 3 (`HUMAN_DECISION_REQUIRED`) no momento do setup de infraestrutura.
- **Confidence**: `HIGH` (padrão; provedor concreto fica para depois)
- **Human Decision Required**: `YES`

---

## Matriz-resumo

| ADR | Current | Recommendation | Confidence | Human Decision |
|---|---|---|---|---|
| ADR-001 Estilo arquitetural | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |
| ADR-002 Backend stack | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |
| ADR-003 Frontend stack | Proposed | `ACCEPT` | MEDIUM | AWAITING_HUMAN_ARCHITECTURE_DECISION (confirmar preferência de equipe antes) |
| ADR-004 Persistência | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |
| ADR-005 Tenant strategy | Proposed | `ACCEPT` (condicionado a testes de isolamento) | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION (Level 3 segurança) |
| ADR-006 Async/jobs | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |
| ADR-007 Document storage | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION (custo recorrente Level 3) |
| ADR-008 Comunicação | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |
| ADR-009 Autenticação | Proposed | `ACCEPT` (condicionado a OWASP ASVS + testes) | MEDIUM-HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION (Level 3 segurança) |
| ADR-010 Estratégia IA | Proposed | `ACCEPT` | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |
| ADR-011 Deployment | Proposed | `ACCEPT` (provedor/custo = Level 3) | HIGH | AWAITING_HUMAN_ARCHITECTURE_DECISION |

## Conflitos e inconsistências encontrados

1. `docs/decisions/README.md`: tabela de ADRs desatualizada ("nenhum ADR registrado") — índice corrigido nesta fase (listando 001–011 como `Proposed`); nenhum status alterado.
2. Nenhum conflito técnico entre ADRs detectado: referências cruzadas (ADR-002↔006, ADR-004↔005↔007↔009, ADR-007↔011, ADR-008↔010) são consistentes.
3. ADR-003 depende de confirmação de preferência de equipe (única decisão com confiança MEDIUM).

## Nota sobre conveniência

Nenhuma recomendação acima se apoia em popularidade/familiaridade: cada uma cita os drivers Must/Should que a sustentam. As três decisões com condições explícitas (ADR-005, ADR-009, ADR-011) carregam obrigações verificáveis que devem constar das histórias do primeiro ciclo.
