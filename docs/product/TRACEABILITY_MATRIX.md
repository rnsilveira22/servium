# Matriz de Rastreabilidade — Servium AI

> **Auditoria documental · 2026-09-23.** Matriz *Requisito → Documentação → Código → Teste → Status*, construída sobre o estado real do repositório (`main` reconciliada em `0266322` + commits até `c06f4f7`). Objetivo: permitir rastrear qualquer requisito/evolução até sua evidência de código e teste, sem inventar status.
>
> **Fontes desta matriz:** `docs/product/FUNCTIONAL_REQUIREMENTS.md`, `docs/product/FIRST_DIGITAL_EMPLOYEE.md`, `docs/product/MVP_SCOPE.md`, `docs/product/MVP_01_VERTICAL_SLICE.md`, `docs/product/MVP_EXPERIENCE_SPEC_v1.md`, `docs/audit/EVENTOS_AUDITORIA.md`, `docs/factory/FACTORY_STATUS.md`, `docs/AI_CONTEXT.md` e verificação direta em `apps/**`, `packages/**`.
>
> **Legenda de status:** ✅ Implementado/mantido · 🟡 Parcial (implementado parcial ou com ressalvas) · 📋 Planejado/formalizado, não implementado · — Não aplicável/fora.

## Requisitos do conceito Estagiária Digital (definidos em 2026-09-23)

> Estes requisitos formalizam a evolução do conceito de **tarefa → atividade operacional com agente executor configurável**. IDs novos (FR-020+); os atuais FR-001..FR-019 permanecem intactos como fonte histórica. Prioridade MoSCoW e status de aceite são registro de **produto**, revisáveis por Human Gate.

| Requisito | Documento (definição) | Documento (técnico) | Código (real) | Teste (real) | Status |
|---|---|---|---|---|---|
| **FR-020 · Atividade operacional recorrente** (nome, periodicidade, escopo de clientes, agente, canal, checklist, comportamento solicitar/acompanhar/cobrar/registrar/identificar/escalar) | `FUNCTIONAL_REQUIREMENTS.md` FR-020; `FIRST_DIGITAL_EMPLOYEE.md` §Modelo de atividade | `MVP_01_VERTICAL_SLICE.md` (fluxo end-to-end); `OPERATIONAL_FLOW.md`; migration `0014_atividades_agentes.sql` | Entidade `atividades` (por tenant, RLS) implementada: `nome`, `periodicidade`, `escopo='todos_ativos'`, `agente_id` FK, `canal`, `prazo_dias`, `checklist_template_id`, `comportamento` (jsonb, 6 passos), `status` ativa/inativa + timestamps (`apps/api/src/cadastro/atividades.controller.ts`; front `apps/web/src/pages/AtividadesPage.tsx`). **Sem** engine de execução/recorrência (FR-022 fica como ponto de extensão) | `apps/api/test/atividades.test.ts` (CRUD, validações, RLS, auditoria, ativar/desativar) | ✅ **Implementado** — configuração da atividade recorrente persistida, auditada e isolada por tenant; execução automática é FR-022 |
| **FR-021 · Seleção do agente executor** (atividade → agente configurável/extensível; MVP com apenas Estagiária Digital) | `FUNCTIONAL_REQUIREMENTS.md` FR-021; `FIRST_DIGITAL_EMPLOYEE.md` §Agente executor | `DOMAIN_BOUNDARIES.md` (B3 Workforce Configuration); `FUNCTIONAL_ARCHITECTURE.md` (C3 Digital Workforce); migration `0014_atividades_agentes.sql` (ADR-005 adendo FR-021) | Entidade `agentes` (catálogo **por tenant**, RLS, seed automático via trigger `trg_agentes_seed` com a Estagiária Digital). `atividades.agente_id` FK referencia o agente — **sem hardcode de string**; seletor no front alimentado por `GET /agentes` (`apps/api/src/cadastro/agentes.controller.ts`); identidade de serviço `actor_type='servico'` permanece p/ o runtime | `apps/api/test/atividades.test.ts` (catálogo, agente obrigatório, agente inativo rejeitado); `apps/api/test/identidade-servico.test.ts` (CA-C-1/CA-C-3) | ✅ **Implementado** — catálogo de agentes configurável/extensível com Estagiária Digital como única entrada do MVP |
| **FR-022 · Definição de periodicidade** (mês/competência) | `FUNCTIONAL_REQUIREMENTS.md` FR-022 | `MVP_01_VERTICAL_SLICE.md`; `NON_FUNCTIONAL_REQUIREMENTS.md` (NFR-014) | Ciclos são **ativados manualmente** pelo responsável (`POST /ciclos`); scheduler dispara `ciclo.tick` mas não cria ciclos por periodicidade | `apps/api/test/ciclos.test.ts`; `apps/e2e/` (ciclo-activation) | 📋 Formalizado; sem engine de agendamento de periodicidade |
| **FR-023 · Organização documental** (receber, identificar tipo, classificar, organizar, renomear, separar por cliente/competência/categoria) | `FUNCTIONAL_REQUIREMENTS.md` FR-023; `CANDIDATE_ROUTINES.md` RC-04 | `MVP_SCOPE.md` (§Out of Scope — organização documental adiada); `ADR-007` (storage), `ADR-010` (classificação assistiva futura) | Recebimento conecta documento ao item (`apps/api/src/runtime/recebimento.ts`, `mensagens_gmail`); **não há** árvore documental por cliente/mês/categoria | `apps/api/test/recebimento*.test.ts` (vínculo resposta↔item) | 📋 Pós-MVP (RC-04 declarada fora do MVP-01) |
| **FR-024 · Classificação com confiança** (ALTA automática / MÉDIA revisão / BAIXA exceção) | `FUNCTIONAL_REQUIREMENTS.md` FR-024; `AI_USAGE_BOUNDARIES.md`; `ADR-010` | — | Classificação atual é **determinística** (vínculo por `token_correlacao`); validação humana de recebido (B-1) já existe (`decidir-item.ts`) | `apps/api/test/decidir-item.test.ts` (fluxo validado); `apps/api/test/atomicidade.test.ts` | 📋 Conceito formalizado; implementação conforme estágio do MVP (sem IA desnecessária) |
| **FR-025 · Feedback do usuário ↔ agente** (feedback operacional, regra operacional, configuração da atividade, exceção) | `FUNCTIONAL_REQUIREMENTS.md` FR-025 | `FIRST_DIGITAL_EMPLOYEE.md` §Feedback e orientação; `MVP_EXPERIENCE_SPEC_v1.md` (mapa de conhecimento/evidências) | **Inexistente** hoje (sem caminho de correção/orientação persistido) | — | 📋 Formalizado; não implementado |
| **FR-026 · Dashboard operacional** (clientes no ciclo, solicitações, entregues, respostas, completas, pendências, cobranças, atrasadas, exceções, taxa de resposta, tempo médio) | `FUNCTIONAL_REQUIREMENTS.md` FR-026; `MVP_EXPERIENCE_SPEC_v1.md` §5–§10 | `SUCCESS_METRICS.md` (M-01..M-09); `MVP_01_VERTICAL_SLICE.md` (§Métricas mínimas) | `apps/web/src/pages/DashboardPage.tsx` mostra apenas cards C1 (ativos/itens/concluídos/exceções) + lista de ciclos | `apps/web/*.test.tsx` (dashboard básico); `apps/e2e/` | 🟡 Parcial — dashboard mínima; conceito operacional formalizado |
| **FR-027 · Timeline operacional** (sequência de acontecimentos por atividade) | `FUNCTIONAL_REQUIREMENTS.md` FR-027; `MVP_EXPERIENCE_SPEC_v1.md` §9 | `EVENTOS_AUDITORIA.md` (eventos por entidade/timestamp) | Não há UI de timeline; eventos existem em `eventos_auditoria` (append-only) | `packages/db/tests/audit-lista.test.ts` (leitura/timeframe) | 📋 Formalizado; dados suficientes existem, falta camada de apresentação |
| **FR-028 · Auditoria operacional** (o que/quem/qual agente/para qual cliente/quando/resultado/regra/intervenção humana) | `FUNCTIONAL_REQUIREMENTS.md` FR-028; `audit/EVENTOS_AUDITORIA.md` | `ADRV-002`; `NFR-006`; `MVP_EXPERIENCE_SPEC_v1.md` §17 | `GET /auditoria` (admin-only, append-only, RLS, keyset) agora expõe **camada operacional**: presenter `apps/api/src/auditoria/presenter.ts` (21 ações/29 linhas mapeadas em cards); filtros `desde`/`ate`, `actor_type` (agente), `cliente_id` (JOIN seguro) e `entidade_id` (atividade); enriquecimento de `cliente`/`atividade` sem inventar dado; UI `AuditoriaPage.tsx` reescrita (cards operacionais + detalhes técnicos + métricas/health preservados) | `apps/api/test/auditoria-operacional.test.ts` (18 casos: presenter + filtros + enriquecimento + isolamento + RBAC + integridade + keyset); `apps/web/src/pages/AuditoriaPage.test.tsx` (7 casos) | ✅ **Implementado** — auditoria operacional com filtros e enriquecimento; tab operacional completa. Timeline por atividade → FR-027 |
| **FR-029 · UX/UI orientada a operação** (clara, moderna, consistente, ação; sem log/vazio como status) | `FUNCTIONAL_REQUIREMENTS.md` FR-029; `MVP_EXPERIENCE_SPEC_v1.md` (todo) | `M0`/`M1` UX em `FACTORY_STATUS.md` | M0 UX **merged** (`95c8160`, 09/09 — identidade, tokens, acessibilidade, menu mobile); M1 UX (Frente A) em branch **sem PR**; `ModelosEmailPage` nova | `apps/web/*.test.tsx` (46); E2E Selenium 31/31 | 🟡 M0 feito; M1 pendente de PR/gate |

## Requisitos existentes (leaf FR-001..FR-019) — estado de rastreamento

| Requisito | Documento | Código | Teste | Status |
|---|---|---|---|---|
| FR-001 Gestão de checklists por cliente/obrigação | `FUNCTIONAL_REQUIREMENTS.md` | `checklist_templates`+`itens_template`; `POST /checklist-templates` (`cadastro.controller.ts`) | `apps/api/test/cadastro.test.ts` | ✅ |
| FR-002 Cadastrar clientes e responsáveis | `FUNCTIONAL_REQUIREMENTS.md` | `clientes` (e-mail obrigatório/validado, DD-08); `POST /clientes` | `apps/api/test/cadastro.test.ts` (email validation) | ✅ |
| FR-003 Configurar limites de autonomia | `FUNCTIONAL_REQUIREMENTS.md` | `configuracoes` (0011); `GET/PUT /configuracoes` | `apps/api/test/configuracoes.test.ts` | ✅ |
| FR-004 Templates de mensagem aprovados | `FUNCTIONAL_REQUIREMENTS.md` | `email_templates` (0013); CRUD `/email-templates`; vínculo checklist↔modelo | `apps/api/test/email-templates.test.ts` | ✅ (recente) |
| FR-005 Ativar ciclo com aprovação humana | `FUNCTIONAL_REQUIREMENTS.md` | `POST /ciclos` + motor `ativarCiclo` (idempotente) | `apps/api/test/ciclos.test.ts`, `atomicidade.test.ts` | ✅ |
| FR-006 Identificar itens pendentes automaticamente | `FUNCTIONAL_REQUIREMENTS.md` | motor `ativarCiclo` → materializa itens do template | `apps/api/test/motor.test.ts` | ✅ |
| FR-007 Enviar cobranças dentro dos limites | `FUNCTIONAL_REQUIREMENTS.md` | motor `cobrarItem` + canal (gmail/mailpit) + `max_attempts` | `apps/api/test/motor.test.ts`, channel tests | ✅ |
| FR-008 Receber e associar respostas/documentos | `FUNCTIONAL_REQUIREMENTS.md` | `recebimento.ts` via `token_correlacao` (0010) | `apps/api/test/recebimento*.test.ts` | ✅ |
| FR-009 Validar recebimento básico | `FUNCTIONAL_REQUIREMENTS.md` | B-1 `decidir-item.ts` (recebido→resolvido/excecao) | `apps/api/test/decidir-item.test.ts` | ✅ |
| FR-010 Escalonar exceções ao responsável | `FUNCTIONAL_REQUIREMENTS.md` | motor `escalar` + `excecoes` | `apps/api/test/atomicidade.test.ts` | ✅ |
| FR-011 Painel de status consolidado | `FUNCTIONAL_REQUIREMENTS.md` | `DashboardPage.tsx` (mínima) + `CicloDetailPage` | web tests | 🟡 Parcial (evolui p/ FR-026) |
| FR-012 Resolver itens escalados com registro humano | `FUNCTIONAL_REQUIREMENTS.md` | `decidirItem` + `reenviarItem` + `cancelarCiclo` | `apps/api/test/decidir-item.test.ts`, `cancelar-ciclo` | ✅ |
| FR-013 Registrar trilha auditável completa | `FUNCTIONAL_REQUIREMENTS.md` | `eventos_auditoria` append-only; `GET /auditoria` | `packages/db/tests/audit*.ts`; `apps/api/test/auditoria.test.ts` | ✅ |
| FR-014 Relatório de fechamento de ciclo | `FUNCTIONAL_REQUIREMENTS.md` | motor `encerrarCiclo`/`tickCiclos`; exceções com tipo | motor/E2E tests | 🟡 Automático; sem UI de relatório |
| FR-015 Notificar responsáveis sobre eventos | `FUNCTIONAL_REQUIREMENTS.md` | exceções escaladas (notificação implícita na fila) | — | 📋 Planejado |
| FR-016 Instrumentar métricas do piloto | `FUNCTIONAL_REQUIREMENTS.md` | `/metrics`; eventos auditáveis | e2e/navigation | 🟡 Mínimo |
| FR-017 WhatsApp (Won't MVP) | `FUNCTIONAL_REQUIREMENTS.md` | — (porta ADR-008 permite futuro) | — | — Fora |
| FR-018 Integração ERP (Won't MVP) | `FUNCTIONAL_REQUIREMENTS.md` | — | — | — Fora |
| FR-019 Admin multi-tenant (Won't MVP) | `FUNCTIONAL_REQUIREMENTS.md` | — (tenant awareness preservada) | — | — Fora |

## NFRs (resumo rastreável)

| NFR | Documento | Evidência | Status |
|---|---|---|---|
| NFR-001 Tenant isolamento | `NON_FUNCTIONAL_REQUIREMENTS.md`; `ADR-005` | `0003_rls_security.sql` (FORCE RLS); anti-leak suíte em `packages/db/tests/` | ✅ |
| NFR-002 Controle de acesso | `NON_FUNCTIONAL_REQUIREMENTS.md`; `ADR-009` | RBAC `@Roles('admin')`; sessões httpOnly | ✅ |
| NFR-006 Trilha imutável | `NON_FUNCTIONAL_REQUIREMENTS.md` | `REVOKE UPDATE,DELETE` (`audit.test.ts`) | ✅ |
| NFR-007 Rastreabilidade comunicações | `NON_FUNCTIONAL_REQUIREMENTS.md` | ledger de envios + `token_correlacao` | ✅ |
| NFR-008 Idempotência | `NON_FUNCTIONAL_REQUIREMENTS.md`; `ADR-006` | jobs SKIP LOCKED + idempotency keys | ✅ |
| NFR-012 Observabilidade | `NON_FUNCTIONAL_REQUIREMENTS.md` | `/health`, `/metrics`, eventos | ✅ |
| NFR-017 Tempo resposta comunicações | `NON_FUNCTIONAL_REQUIREMENTS.md` | scheduler/worker runtime | ✅ |

## Itens do completion master prompt (MVP-01 → PILOT_READY · FASE 0 recon 2026-10-07)

| Item (fase) | Documento (definição) | Código real | Teste real | Status |
|---|---|---|---|---|
| B-1 — Decisão de recebido (FASE 1) | `MVP_01_VERTICAL_SLICE.md` (validação humana) | `apps/api/src/cadastro/decidir-item.ts` (recebido→resolvido/excecao, atômico) | `apps/api/test/decidir-item.test.ts`; `atomicidade` | ✅ verificado 2026-10-07 (merged PR #99) |
| B-4 — Rollback/Stop (FASE 4) | `MVP_01_VERTICAL_SLICE.md` critério 8 | — (documento operacional) | — | ✅ `docs/operations/MVP_01_ROLLBACK_STOP_PROCEDURE.md` |
| B-5 — Métricas mínimas (FASE 4) | `MVP_01_VERTICAL_SLICE.md` §Métricas mínimas | `apps/api/src/common/metrics-negocio.service.ts`; `GET /metrics/negocio` (admin) em `health.controller.ts` | `apps/api/test/metrics-negocio.test.ts` (RBAC+RLS+agregações) | ✅ implementado 2026-10-07 |
| P1-3 — Segurança HTTP (FASE 3) | `ASVS_PILOTO.md` (G-01..G-03, V2.8.1, V3.4.2, V3.7.1, V4.1.5) | `apps/api/src/common/security-headers.middleware.ts`; `app.factory.ts`; `auth.controller.ts` (`cookieFor`) | `apps/api/test/security-headers.test.ts` (8 casos) | ✅ resolvido 2026-10-07 |
| CA-D-3 — Review de segurança (FASE 3) | `ASVS_PILOTO.md` (condição PILOT_READY) | — (evidências) | suíte API 214 testes | `docs/security/CA-D-3_MVP01_SECURITY_REVIEW_2026-10-07.md` — **AWAITING_DECISION** |
| FR-026 — Dashboard (FASE 4) | `FUNCTIONAL_REQUIREMENTS.md` FR-026 | `GET /metrics/negocio` alimenta dashboard (futuro) | `metrics-negocio.test.ts` | 🟡 backend pronto; UI continua FR-026 |

## Presenças e lacunas documentais (auditoria)

| Documento esperado | Existe? | Situação |
|---|---|---|
| `README.md` | ✅ | Status corrigido em 2026-09-23 (P0 remediação concluída; B-2/M0 UX/modelos e-mail) |
| `docs/audit/EVENTOS_AUDITORIA.md` | ✅ | Reconciliado em `c06f4f7` (19 ações · 24 emissões) — +`cancelar`, +`email_template` criar/atualizar/excluir, +`login_block`, ator `servico` real (P0.3-C) |
| `docs/product/FUNCTIONAL_REQUIREMENTS.md` | ✅ | FR-001..FR-019 vigentes; novos FR-020+ **não** formalizados até ontem → gap resolvido nesta entrega |
| `docs/product/MVP_SCOPE.md` | ✅ | Sem classificação MVP obrigatório/incremental/pós → adicionada nesta entrega |
| `docs/product/MVP_EXPERIENCE_SPEC_v1.md` | ✅ | Spec UX v1.0 **(status no arquivo: "aguardando aprovação humana")** |
| `docs/factory/HUMAN_GATES.md` | ✅ | Catálogo ativo; **HG-009 (ADR-012) RESOLVIDO 2026-09-24** (decisão registrada, implementação NÃO autorizada); **HG-FECHAMENTO-CORRECAO-UI RESOLVIDO 2026-10-07** (seletor de checklist commitado, GAP-01 parcial); em aberto: HG-007, HG-RETENÇÃO, formalização M0 UX, HG-M1-FRENTE-A |
| `ADR docs` | ✅ | ADR-001..011 Accepted; **ADR-012 Accepted (HG-009 · 2026-09-24)** — decisões arquiteturais registradas (`eventos_operacionais`); implementação segue Factory V2 |
| Matriz de rastreabilidade | **novo** | Este documento |
| Relatório Documentation Sync | **novo** | `docs/reports/DOCUMENTATION_SYNC_REPORT_2026-09.md` |
| Relatório Documentation Sync V2 | **novo** | `docs/reports/DOCUMENTATION_SYNC_REPORT_V2_2026-09.md` (reconciliação 19 ações, correção README/EVENTOS) |

## Como manter esta matriz viva

A **Documentation Sync Rule** (formalizada em `AGENTS.md` e `docs/AI_CONTEXT.md`) determina: **todo** agente que alterar comportamento/regra/entidade/API/contrato/UX/arquitetura deve verificar os documentos afetados (incluindo esta matriz) e atualizá-los **no mesmo ciclo de desenvolvimento**. Esta matriz é ponto de entrada da checagem: alterou código de requisito? Ajuste aqui a linha `Código`/`Teste`/`Status` e referencie o PR no campo `Teste`.
