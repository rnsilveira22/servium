# Plano de Refinamento — Decomposição `PRE_PILOT_REMEDIATION` (P0.1 / P0.2 / P0.3)

> **Estado atual:** `PRE_PILOT_REMEDIATION_BACKLOG_READY` — HG-PR-PLAN **APPROVED** (2026-08-30) e governança/rastreabilidade executada (15 Issues `[PRM-*]` criadas: #45–#59); **aguardando novo gate humano** (autorização de execução da P0.1).
> **Responsável pelo plano/governança:** plataforma **opencode** · modelo **`opencode/big-pickle`** · sessões 2026-08-30 (refinamento + execução de governança).
> **Base:** `main` @ `8b16387` (após merge do PR #44); governança versionada neste documento + PR de documentação (ver Anexo A).
> **Autoridade:** HUMAN GATES 2026-08-30 — HG-PR-PLAN = **APPROVED**; HG-PR-SEC = **DEFERRED**; HG-RETENÇÃO = **DEFERRED**; P0.1-D (nodemailer) = **APPROVED**.
> **Escopo desta entrega:** governança/rastreabilidade **somente** — Issues criadas, históricas preservadas, `#9` permanece aberta, plano versionado. **Nenhum código; P0.1-A não iniciada.**

## 1. Contexto e objetivo

A reconciliação pós-MVP ([`POST_MVP_BACKLOG_RECONCILIATION.md`](POST_MVP_BACKLOG_RECONCILIATION.md)) invalidou `PILOT_READY` e classificou:

- `#9` (auditoria) = **PRE_PILOT_BLOCKER**;
- GAP_RUNTIME do motor = **PRE_PILOT_BLOCKER crítico**;
- `#20`/`#18`/`#17`/`#8` = **CLOSED_BUT_GAP_FOUND** (implementação mergeada com lacunas comprovadas).

Este plano transforma a decomposição aprovada (conceitual) em **histórias executáveis** com DoR completa, dependências, critérios de aceite objetivos, estratégia de testes e rastreabilidade com as Issues históricas. Prioridade e ordem preferencial fixadas pelo owner:

**P0.1** (Runtime operacional) na ordem **A → B → C → D/E → F**; depois **P0.2** (auditoria #9) e **P0.3** (hardening #20); gaps menores `#17`/`#8` **apenas mapeados** (novas histórias de backlog, não implementadas nesta fase).

## 2. Regras arquiteturais vincidentes (espelho das decisões do owner)

1. O motor depende **exclusivamente** da abstração `CommunicationChannel` (ADR-008) — nenhum import de Gmail/SMTP/Mailpit fora dos adapters.
2. **Gmail API + OAuth 2.0** é o adapter de piloto/produção (HG-008).
3. **Mailpit (Fake SMTP)** é o adapter de local/CI/E2E.
4. Nenhuma regra do motor pode depender diretamente de Gmail, SMTP ou Mailpit.
5. A seleção do adapter ocorre por **configuração/composição da aplicação** (env + point de composição), nunca por decisão no motor.
6. **Gmail/OAuth reais não são usados em nenhum teste automatizado** (CI/local/E2E). Testes com o adapter Gmail usam env fake e casos de erro (padrão já existente em `apps/api/test/gmail.test.ts`).

Corolários de design derivados:

- A porta (`apps/api/src/motor/channel.ts`) permanece como está; `MensagemSaida` pode ganhar campo opcional de correlação (P0.1-E) sem quebrar contratos.
- O worker deixa de ser "script genérico sem handlers" e passa a ser **composto na aplicação** (`apps/api`) com os handlers do motor (P0.1-A), mantendo o loop genérico da fila no pacote `@servium/db` (ADR-006).
- Scheduler único e idempotente via fila (chaves determinísticas já existentes): ticks periódicos re-enfileiram `ciclo.tick` com `idempotencyKey` estável, evitando duplicidade entre workers.

## 3. Visão geral da decomposição

| ID | Título | Prioridade | Ordem | Paralelizável | Depende de | Nova Issue? | Vínculo histórico | HG |
|---|---|---|---|---|---|---|---|---|
| PRM-P0.1-A | Wire de handlers reais no worker | P0.1 | 1 | não | — | sim | #15 (SRV-15), #8 (fila) | — |
| PRM-P0.1-B | Scheduler/tick periódico do ciclo | P0.1 | 2 | não | A | sim | #15, #8 | — |
| PRM-P0.1-C | Composição do `CommunicationChannel` (provider por env) | P0.1 | 3 | não | B | sim | ADR-008, HG-008, #18 | — |
| PRM-P0.1-D | Adapter Mailpit (SMTP de teste) | P0.1 | 4 | parcial (D ∥ E após C) | C | sim | HG-008, #18 | — |
| PRM-P0.1-E | Correlação resposta↔item (CA-02 da #18) | P0.1 | 4/5 | parcial (D ∥ E) | C | sim | #18 (CA-02), #9 (auditoria) | — |
| PRM-P0.1-F | E2E runtime: ciclo sem chamada manual de força | P0.1 | 6 | não | A–E | sim | #15, #18, #8, #9 | — |
| PRM-P0.2-A | CA-04: trilha consultável (query + endpoint RBAC) | P0.2 | 7 | sim (A∥B∥C) | — | sim (RelatesTo #9) | #9 (CA-04) | — |
| PRM-P0.2-B | CA-03: eventos atômicos com a ação auditada | P0.2 | 7 | sim (A∥B∥C) | — | sim (RelatesTo #9) | #9 (CA-03) | — |
| PRM-P0.2-C | CA-05: documentação do mecanismo de auditoria | P0.2 | 7 | sim (A∥B∥C) | A (para mapear leituras) | sim (RelatesTo #9) | #9 (CA-05) | — |
| PRM-P0.3-A | Política de senha (ASVS/NIST) + ponto de enforcement | P0.3 | 8 | sim (A∥B) | HG-PR-SEC | sim | #20 (CA-02 senha), ADR-009 | **HG-PR-SEC** |
| PRM-P0.3-B | Rate limiting no login (anti-automação) | P0.3 | 8 | sim (A∥B) | HG-PR-SEC | sim | #20 (CA-02 rate-limit), ADR-009 | **HG-PR-SEC** |
| PRM-P0.3-C | Credencial de serviço do Funcionário Digital | P0.3 | 9 | não | A (identidade no worker) | sim | #20 (CA-06), #15 | — |
| PRM-P0.3-D | ASVS materializado para o piloto | P0.3 | 9 | sim (C∥D) | P0.3-A/B (mapeamento das decisões) | sim | #20 (CA-07), ADR-009 | — |
| PRM-M-17 | Mapa: exceções abertas por tenant (listagem global) | Backlog | — | — | — | sim (backlog) | #17 (gap CA-02) | — |
| PRM-M-08 | Mapa: métrica de profundidade da fila | Backlog | — | — | — | sim (backlog) | #8 (gap CA-06) | — |

Panorama de paralelização: **P0.2 ∥ P0.3** podem ser iniciados em paralelo com o fim de P0.1 (áreas distintas); **P0.1-F** fecha a P0.1; **P0.3-A/B** dependem somente do gate de segurança; **P0.3-C** depende da identidade de serviço de P0.1-A. Dentro de P0.2, `A∥B∥C`; dentro de P0.3, `A∥B` e `C∥D`.

## 4. Regras de rastreabilidade GitHub (Issues)

Decisão Q1/Q4 da reconciliação: **não reabrir** as Issues `CLOSED_BUT_GAP_FOUND` indiscriminadamente; propor rastreabilidade explícita.

Recomendação formal (aguardando aprovação humana para criar/alterar):

1. **Histórias de remediação = novas Issues** com prefixo no título `[PRM-P0.x]` (ex.: `[PRM-P0.1-A] Wire de handlers reais no worker`).
2. **Corpo da nova Issue** deve conter o bloco de rastreabilidade (origem, evidência, referências às Issues históricas, aceite) — as Issues históricas permanecem fechadas como estão.
3. **P0.2** gravita na `#9`, que permanece **aberta** como issue-tracking do bloqueador: as novas Issues `PRM-P0.2-*` usam `Relates to #9`; a `#9` recebe **apenas um comentário rastreável** ao final de P0.2 (não muda título/estado/corpo sem aprovação).
4. **Gaps menores #17/#8** viram Issues de **backlog** (`[PRM-M-17]`, `[PRM-M-08]`), sem vínculo de implementação nesta fase.
5. **Epics/labels:** os campos do board seguem bloqueados (`PROJECT_BOARD_READ_BLOCKED_BY_TOKEN_SCOPE`); usar labels existentes (`epic:mvp01`, `epic:009`) e citar épicos no corpo das Issues.
6. Nenhuma Issue é criada/alterada até o **HUMAN GATE de aprovação do plano**.

## 5. PRM-P0.1-A — Wire de handlers reais no worker

- **ID/título:** `[PRM-P0.1-A] Wire de handlers reais do motor no worker de fila`.
- **Objetivo:** que o worker de produção execute os handlers do motor (registrados via `registrarMotorHandlers`), em vez do mapa vazio, e seja iniciável por comando (script npm) com canal injetado.
- **Problema que resolve:** `packages/db/scripts/worker.mjs:11-12` mantém `const handlers = new Map()` sem nenhum cadastro; em runtime todo job falharia com `sem handler para tipo=…` (`worker.mjs:41`) — o motor só é exercido dentro dos testes (`apps/api/test/motor.test.ts` `rodarJobs()`). Não há script npm que inicie o worker.
- **Origem/rastreabilidade:** GAP_RUNTIME (§6 do relatório de reconciliação); Issues `#15` (SRV-15 motor) e `#8` (SRV-8 fila); `worker.mjs` (loop genérico + `claimJobs`/`failJob`/`completeJob` em `@servium/db`).
- **Dependências:** nenhuma de P0.1 (base). Requer build de `@servium/db` e `@servium/api`.
- **Escopo IN:**
  - Extrair o loop atual de `worker.mjs` para função reutilizável em `@servium/db` (ex.: `runWorker(handlers, { pollMs, batch, log })`), preservando claim/complete/fail/reap e backoff (ADR-006).
  - Criar bootstrap do worker na aplicação (`apps/api/src/jobs/worker.bootstrap.ts`) que importa `registrarMotorHandlers(deps)` e roda `runWorker`.
  - Adicionar script npm `worker` (raiz e `@servium/api`) e documentação de execução.
  - Refatorar o teste de motor para consumir o **loop real** do worker (processo/função `runWorker`) em vez do laço manual `rodarJobs()`, quando aplicável e estável; manter os testes de engine puro como estão.
- **Escopo OUT:** scheduler (PRM-P0.1-B); seleção de canal (PRM-P0.1-C); Gmail/Mailpit; refinamento do E2E (PRM-P0.1-F); mudança de regra do motor.
- **Critérios de aceite (objetivos):**
  - CA-A1: `runWorker` consumida no bootstrap registra os 4 tipos (`ciclo.ativar`, `item.cobrar`, `ciclo.tick`, `ciclo.encerrar`) e **nenhum job desses tipos termina em `falha` por handler ausente**.
  - CA-A2: um job de tipo desconhecido é marcado como `falha/pendente` via `failJob` com `ultimo_erro` registrado (comportamento atual preservado).
  - CA-A3: existe script npm `worker` que inicia o processo sem erro e encerra graciosamente em `SIGTERM`/`SIGINT` (log JSON `encerrando após lote corrente`).
  - CA-A4: teste de integração demonstra `ciclo.ativar` e `item.cobrar` processados **pelo worker real** contra o Postgres local (sem invocação direta de handlers no teste).
  - CA-A5: nenhuma importação de Gmail/SMTP/Mailpit no motor (`engine.ts`/`handlers.ts`).
- **Testes unitários:** registro do mapa (4 tipos presentes, sem duplicidade); `failJob`/`completeJob`/`claimJobs` inalterados (`@servium/db` já tem suite); `runWorker` com handler artificial (registra/complete/fail, backoff).
- **Testes de integração:** processo worker real + banco seeded (tenant/checklist/obrigação via admin ou HTTP) + job `ciclo.ativar` → itens criados + `item.cobrar` (canal fake) → `aguardando` + mensagem em `mensagens_comunicacao`.
- **E2E:** não se aplica (fechado por PRM-P0.1-F).
- **Observabilidade/auditoria:** logs JSON em estrutura única (padrão `worker.mjs`); eventos de auditoria do motor continuam emitidos pelos handlers; medir jobs por tipo/estado (será explorado em `PRM-M-08`).
- **Segurança:** worker usa role `servium_app` + `set_config('app.tenant_id', …)` por job (padrão RUNBOOK §8) — não alterar; sem segredos novos.
- **Definition of Ready:** evidência do gap referenciada; `runWorker` extraída e testável; comandos de execução definidos; ambiente Postgres local disponível; QA reviewer atribuído.
- **Definition of Done:** CA-A1..A5 verdes; `npm run verify` verde; PR com QA (servium-reviewer-qa) aprovado; docs (`FACTORY_STATUS`) atualizadas; CI verde.
- **Agente responsável:** `servium-senior` (motor/fila); QA: `servium-reviewer-qa`.
- **Ordem de execução:** 1º de P0.1.
- **Paralelização:** não (bloqueia B–F).
- **Human Gate:** não (automação; gate Geral na aprovação do plano).

## 6. PRM-P0.1-B — Scheduler/tick periódico do ciclo

- **ID/título:** `[PRM-P0.1-B] Scheduler periódico do ciclo (tick global idempotente)`.
- **Objetivo:** que o Funcionário Digital avance sozinho ao longo do tempo — re-enfileirando `ciclo.tick` — sem depender de chamadas HTTP isoladas de ativação/reenvio.
- **Problema que resolve:** hoje o tick é encadeado apenas por ativação/reenvios pontuais (`ciclos.controller.ts:33-37`, `handlers.ts:69`, `ciclos.controller.ts:144-148`); sem algum disparo periódico, itens que não são elegíveis ainda (fora de horário/frequência) **param para sempre**.
- **Origem/rastreabilidade:** GAP_RUNTIME (sem `cron`/`setInterval` em `apps/api`); Issues `#15`, `#8`; fluxo `OPERATIONAL_FLOW` (ciclos longos de pendência).
- **Dependências:** PRM-P0.1-A.
- **Escopo IN:**
  - `apps/api/src/jobs/scheduler.ts`: `setInterval` que enfileira `ciclo.tick` global (`payload {}`) com `idempotencyKey` estável por janela (ex.: `tick:global:<hh>`), + chamada periódica de `reapStuck` (worker travado), configurável por env (`TICK_INTERVAL_MS` default 60 s; `REAP_OLDER_THAN_MIN` default 15 min).
  - Início/parada via ciclo de vida NestJS (`onModuleInit`/`onApplicationShutdown`) e proteção contra múltiplas instâncias (chave idempotente de janela).
  - Teste do scheduler com relógio fake.
- **Escopo OUT:** regras de decisão do motor (não mudam); retry social/frequência (já no motor); cron externo/serviço de agendamento terceiro.
- **Critérios de aceite (objetivos):**
  - CA-B1: com scheduler ligado e um ciclo em `aberto` com itens elegíveis, **sem nenhuma chamada ao motor**, o item evolui (ex.: `pendente→aguardando`) dentro de `2 × TICK_INTERVAL_MS + margem`.
  - CA-B2: ticks globais duplicados na mesma janela **não geram mensagens duplicadas** (idempotência da fila + `chaveCobranca`).
  - CA-B3: `reapStuck` é invocado periodicamente e devolve à fila jobs `processando` antigos (`queue.reapStuck`).
  - CA-B4: encerramento gracioso (para o intervalo, sem enfileirar mais).
- **Testes unitários:** agendamento com fake timers; construção da chave de janela; lógica de janela.
- **Testes de integração:** scheduler + worker reais + banco: ciclo avança sozinho após ativamento (ver CA-B1).
- **E2E:** coberto/fortificado por PRM-P0.1-F (avanço automático).
- **Observabilidade/auditoria:** log do tick `tick_global_enfileirado`; eventos de auditoria continuam nos handlers; métricas de fila (`PRM-M-08`).
- **Segurança:** intervalos configurados por env; sem novas credenciais; contexto RLS mantido (tick por tenant no handler já existe — revalidar varredura por tenant).
- **Definition of Ready:** mecanismo de janela definido; intervalos/env documentados; teste com relógio fake planejado.
- **Definition of Done:** CA-B1..B4 verdes; `npm run verify` verde; PR + QA aprovado; docs atualizadas.
- **Agente responsável:** `servium-senior`; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 2º de P0.1.
- **Paralelização:** não (dependente de A).
- **Human Gate:** não.

## 7. PRM-P0.1-C — Composição do `CommunicationChannel` por configuração

- **ID/título:** `[PRM-P0.1-C] Provider de CommunicationChannel por env (Mailpit local/CI; Gmail em piloto)`.
- **Objetivo:** injetar o adapter correto por composição da aplicação — `MailpitAdapter` em local/CI/E2E e `GmailAdapter` no piloto — sem o motor conhecer nenhum deles.
- **Problema que resolve:** `registrarMotorHandlers(deps)` exige `MotorDeps.channel` (`handlers.ts:19-22`), mas nenhum ponto de composição de produção instancia o canal com `GmailAdapter`; `app.module.ts`/`app.factory.ts` não fornecem `CommunicationChannel`; testes usam `FakeChannel`.
- **Origem/rastreabilidade:** GAP_RUNTIME (canal não injetado); ADR-008; HG-008 (Gmail piloto + Mailpit local/CI); `#18`.
- **Dependências:** PRM-P0.1-A, PRM-P0.1-B (bootstrap/scheduler consomem o canal).
- **Escopo IN:**
  - `apps/api/src/email/channel.provider.ts`: fábrica que seleciona adapter por `COMMUNICATION_ADAPTER` (`none` → `FakeChannel`/no-op; `mailpit` → `MailpitAdapter`; `gmail` → `GmailAdapter` com config via `GMAIL_*`), com validação de env e erro descritivo para valor desconhecido.
  - Registro do provider no módulo de jobs (worker bootstrap) e no container NestJS para outros usos; `MotorDeps` montado uma única vez.
  - Teste de composição (seleção por env).
- **Escopo OUT:** implementação dos adapters (Mailpit é PRM-P0.1-D; Gmail já existe e fica apenas conectado); comportamento do motor.
- **Critérios de aceite (objetivos):**
  - CA-C1: `COMMUNICATION_ADAPTER=none` roda sem rede e sem erro (usado em testes de unidade).
  - CA-C2: `COMMUNICATION_ADAPTER=mailpit` instancia `MailpitAdapter`; `gmail` instancia `GmailAdapter` (testes com env fake — sem chamada ao Google).
  - CA-C3: motor invoca `deps.channel.enviar(...)` sem nunca importar classes de Gmail/SMTP/Mailpit (verificação estática + regra de lint opcional).
  - CA-C4: composição única: mesma instância de canal usada pelo worker e pelo scheduler.
- **Testes unitários:** fábrica com mocks dos adapters; validação de env.
- **Testes de integração:** worker iniciado com `none`/`mailpit` contra banco; envio observável no Mailpit.
- **E2E:** fechado por PRM-P0.1-F.
- **Observabilidade/auditoria:** log de `adapter-selecionado` no boot (sem segredos).
- **Segurança:** `GmailAdapter` nunca ativo em CI/local por default; segredos só via env pilot.
- **Definition of Ready:** enum de adapters + env definidos; contratos `CommunicationChannel` inalterados.
- **Definition of Done:** CA-C1..C4 verdes; `npm run verify` verde; PR + QA aprovado; runbook de configuração atualizado.
- **Agente responsável:** `servium-senior` (composição) com revisão de segurança; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 3º de P0.1.
- **Paralelização:** não.
- **Human Gate:** não.

## 8. PRM-P0.1-D — Adapter Mailpit (Fake SMTP de teste)

- **ID/título:** `[PRM-P0.1-D] Adapter Mailpit (SMTP de teste) para local/CI/E2E`.
- **Objetivo:** entregar mensagens do motor em um SMTP falso (Mailpit) — observáveis e inspecionáveis — nos ambientes de teste, mantendo o Gmail real fora da automação.
- **Problema que resolve:** sem um adapter concreto para o fluxo real, local/CI não têm como provar a saída de e-mail do motor; hoje isso é coberto apenas por `FakeChannel` em memória.
- **Origem/rastreabilidade:** HG-008 (decisão Mailpit p/ local/CI/E2E); ADR-008; `#18`; arquitetura de testes da reconciliação (§0).
- **Dependências:** PRM-P0.1-C.
- **Escopo IN:**
  - `apps/api/src/email/mailpit-adapter.ts` implementando `CommunicationChannel` via SMTP local (`MAILPIT_SMTP_HOST/PORT`, default `localhost:1025`), incluindo retry transitório (padrão do `GmailAdapter`) e persistência da mensagem em `mensagens_comunicacao` (responsabilidade do handler — validar e manter).
  - Adição do serviço Mailpit ao `docker compose` (dev) e à matriz de serviços do CI (E2E runtime); doc de execução.
  - `docker compose up --wait` aguarda também Mailpit (`/api/v1/messages`).
  - Avaliação de dependência: **DECISÃO HUMANA (HG-PR-PLAN, 2026-08-30): APPROVED `nodemailer`** como cliente SMTP do adapter de teste (local/CI/E2E). Cliente SMTP manual sobre `node:net` **proibido** — só com impedimento técnico comprovado e novo Human Gate. Nenhuma dependência nova em produção (nodemailer restrito ao contexto de teste).
- **Escopo OUT:** Gmail real; UI Selenium; o próprio motor.
- **Critérios de aceite (objetivos):**
  - CA-D1: com adapter `mailpit` e worker real, uma cobrança produz mensagem **visível na API do Mailpit** (`GET /api/v1/messages` → destinatário = `cliente.email`).
  - CA-D2: falha transitória do SMTP dispara retry e, esgotado, `failJob`/backoff preservado (nenhuma mensagem duplicada).
  - CA-D3: sem TTY/Google: nenhuma chamada a `googleapis`neste fluxo (garantia por teste de ambiente com env fake/reset).
- **Testes unitários:** adapter com servidor SMTP local fake (não Mailpit, mas contrato `enviar`): sucesso, erro transitório, retry.
- **Testes de integração:** adapters `mailpit` + worker + banco; mensagem inspecionável (CA-D1).
- **E2E:** fechado por PRM-P0.1-F (cenário completo usa Mailpit).
- **Observabilidade/auditoria:** evento motor `cobrar` em `eventos_auditoria`; mensagens em `mensagens_comunicacao` (`status='enviado'`, `message_id` do Mailpit quando disponível).
- **Segurança:** Mailpit restrito a local/CI (nunca em produção); sem tokens.
- **Definition of Ready:** serviço Mailpit no compose com healthcheck; contrato `CommunicationChannel` estável; decisão de dependência SMTP registrada.
- **Definition of Done:** CA-D1..D3 verdes; `npm run verify` verde; compose/CI atualizados; PR + QA aprovado.
- **Agente responsável:** `servium-pleno` (adapter) com revisão `servium-senior`; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 4º de P0.1 (pode rodar em paralelo com PRM-P0.1-E após C).
- **Paralelização:** D ∥ E (após C).
- **Human Gate:** não.

## 9. PRM-P0.1-E — Correlação resposta↔item (CA-02 da #18)

- **ID/título:** `[PRM-P0.1-E] Correlação mensagem↔item do ciclo (envio tokenizado + recebimento vinculado)`.
- **Objetivo:** fechar o bidirecional da `#18` (CA-02 não implementado): respostas do cliente devem voltar vinculadas ao item/solicitação original que as gerou.
- **Problema que resolve:** `mensagens_comunicacao` tem `template`/`token_correlacao` (`0002:83-85`), mas o handler `cobrarItem` nunca os popula; `GmailAdapter.receber` grava em `mensagens_gmail` sem `item_ciclo_id`; `mensagens_comunicacao` (ledger do motor) e `mensagens_gmail` (ledger Gmail) ficam desconexas — correlação não existe em runtime (`#18` CA-02 ausente).
- **Origem/rastreabilidade:** `#18` CA-02 (CLOSED_BUT_GAP_FOUND); §5.4/§8 da reconciliação; `OPERATIONAL_FLOW` (entrada de resposta do cliente);
- **Dependências:** PRM-P0.1-C.
- **Escopo IN:**
  - `MensagemSaida` ganha campo opcional de correlação (`tokenCorrelacao?: string`); `cobrarItem` gera o token (uuid) antecipado, persiste `mensagens_comunicacao.token_correlacao` e **não conclui envio sem token**.
  - Envio: `MailpitAdapter` e `GmailAdapter` incluem o token no cabeçalho (`X-Correlation-Token`) quando presente.
  - Recebimento: novo processo (poller/scheduler) usa o adapter para ler mensagens entrantes; o recebimento é **vinculado ao item** quando o token corresponde a uma `mensagens_comunicacao` de envio; grava `mensagens_gmail.item_ciclo_id` e um registro `mensagens_comunicacao` `direcao='recebimento'` com o mesmo `token_correlacao`.
  - Estado do item: recebimento correlacionado pode marcar o item como `aguardando→recebido` (validação humana de documento permanece fora do escopo; apenas sinaliza).
  - Testes de correlação (token único por envio; duplicidade; resposta sem token = desvinculada e rastreável).
- **Escopo OUT:** upload/validação de documentos; parser de e-mail; decisão semântica automática (ADR-010: determinístico apenas no motor); modelo de correlação por `In-Reply-To`/thread.
- **Critérios de aceite (objetivos):**
  - CA-E1: todo envio de `cobrarItem` persiste `token_correlacao` único e não-nulo em `mensagens_comunicacao` (afirmação em integração).
  - CA-E2: resposta com `X-Correlation-Token` correspondente → `mensagens_gmail.item_ciclo_id` preenchido e `mensagens_comunicacao` cria `recebimento` com mesmo token.
  - CA-E3: resposta sem token corresponde → registro de `recebimento` sem vínculo, identificável por `token_correlacao IS NULL` (visível; não quebra o motor).
  - CA-E4: nenhum campo/regra do motor depende de Gmail/SMTP/Mailpit (token é dado de domínio da porta).
- **Testes unitários:** geração/validação de token; mapeamento token→item; casos E2/E3 com mocks.
- **Testes de integração:** fluxo envio→recebimento usando Mailpit com header; persists coerentes entre ledgers.
- **E2E:** fechado/fortificado por PRM-P0.1-F (correlação preservada no cenário).
- **Observabilidade/auditoria:** eventos `cobrar` (com rodada), `receber`/`recebimento_correlacionado`/`recebimento_desvinculado` em `eventos_auditoria`; retenção conforme política CA-05.
- **Segurança:** token é UUID não-guessável; cabeçalho não expõe dado sensível; RLS protege os ledgers.
- **Definition of Ready:** design da correlação validado (ledgers `mensagens_comunicacao`×`mensagens_gmail`); campos existentes mapeados; decisão de transição `aguardando→recebido` por recebimento documentada.
- **Definition of Done:** CA-E1..E4 verdes; `npm run verify` verde; PR + QA aprovado; modelo de dados sem nova migration destrutiva (preferir colunas existentes; nova coluna em `mensagens_gmail` possível sob migration additive).
- **Agente responsável:** `servium-senior` (design da correlação) + `servium-pleno`; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 5º de P0.1 (D ∥ E após C).
- **Paralelização:** D ∥ E.
- **Human Gate:** não (design determinístico; se surgir decisão de produto sobre "recebido automático × validação humana", abre gate de produto).

## 10. PRM-P0.1-F — E2E runtime do Funcionário Digital (sem força manual)

- **ID/título:** `[PRM-P0.1-F] E2E runtime: ciclo completo avança sozinho via fila + worker + Mailpit + auditoria`.
- **Objetivo:** **provar `RUNTIME` real** (não integração de classes): ambiente limpo, o FD avança automaticamente após configuração/ativação, sem chamada manual para forçar o motor.
- **Problema que resolve:** o único teste que exercita o motor usa laço manual `rodarJobs()` (`motor.test.ts:21-46`), que não prova o worker, nem o canal real, nem o scheduler em processo real.
- **Origem/rastreabilidade:** requisito explícito do owner (decisão Q4 refinement); GAP_RUNTIME; `#15`/`#18`/`#8`/`#9`.
- **Dependências:** PRM-P0.1-A/B/C/D/E (todas).
- **Escopo IN:**
  - Novo harness de teste **runtime E2E** (vitest; sugerido `apps/runtime-e2e`) com orquestração: `db:up` (com Mailpit) → migrate → seed de fixture de negócio → subir API → subir **worker real** com `MailpitAdapter` → **ativar um ciclo via HTTP** (única ação humana legítima) → então **apenas observar** até o estado final.
  - Cenário canônico (espelho da spec do owner): seed/configuração → scheduler identifica trabalho → ciclo/item avança → job criado → worker consome → handler real executa → `CommunicationChannel` chamado → adapter SMTP de teste entrega no Mailpit → mensagem inspecionável → correlação mensagem↔item preservada → auditoria registra eventos → estado final comprovado.
  - Asserts por polling (janelas configuráveis), sem qualquer escrita admin/DB no meio do cenário após a ativação.
  - Job no CI (workflow dedicado) com dependência do serviço Postgres + Mailpit.
- **Escopo OUT:** UI Selenium (`apps/e2e` permanece); Google real; upload de documentos; decisões de produto.
- **Critérios de aceite (objetivos):**
  - CA-F1: após o `POST /ciclos` (ativação), **nenhuma chamada ao motor/handlers/scheduler é feita pelo teste**; o avanço ocorre por scheduler+worker (prova: alterar o detector é proibido por review).
  - CA-F2: estado final esperado alcançado em janela ≤ `T_limite` (ex.: 120 s) — item em `aguardando` (canais síncronos) com `tentativas=1` e mensagem em `mensagens_comunicacao` `status='enviado'`.
  - CA-F3: mensagem **presente e inspecionável no Mailpit** com destinatário e corpo corretos.
  - CA-F4: `token_correlacao` presente na mensagem de envio (PRM-P0.1-E).
  - CA-F5: eventos `ativar`, `cobrar` (e, se aplicável, `decidir`) presentes em `eventos_auditoria` do tenant (append-only; via leitura RBAC de PRM-P0.2-A).
  - CA-F6: **sem Gmail real**: nenhuma credencial `GMAIL_*` válida requisitada (environments de CI sem segredo real).
  - CA-F7: re-execução idempotente: segunda ativação não duplica envios (CA-05/chave determinística).
- **Testes unitários:** não se aplica (nível E2E); harness compartilha helpers dos testes existentes.
- **Testes de integração:** os cenários de PRM-P0.1-A/B/D fornecem os alicerces; este harness os compõe.
- **E2E:** este é o E2E de **runtime** (distinto do Selenium); Selenium UI permanece fora.
- **Observabilidade/auditoria:** logs JSON do worker; métricas de fila (PRM-M-08); trilha de auditoria do cenário inteiro provada (CA-F5).
- **Segurança:** ambiente isolado (containers), Mailpit sem bind público; sem credenciais reais.
- **Definition of Ready:** A–E entregues e verdes; Mailpit no compose/CI; janelas e limites definidos; CI com runner capaz de Postgres+Mailpit.
- **Definition of Done:** CA-F1..F7 verdes em CI (workflow dedicado); PR + QA aprovado; artefato de evidência (resumo do cenário) anexado; `FACTORY_STATUS` atualizado com `RUNTIME PROVADO`.
- **Agente responsável:** `servium-senior` (harness) + `servium-reviewer-qa` (evidência); suporte `servium-pleno`.
- **Ordem de execução:** 6º de P0.1 (encerra P0.1).
- **Paralelização:** não.
- **Human Gate:** não.

## 11. PRM-P0.2-A — CA-04: trilha consultável (query + endpoint RBAC)

- **ID/título:** `[PRM-P0.2-A] Auditoria consultável por entidade/tenant (CA-04)`.
- **Objetivo:** prover leitura mínima da trilha `eventos_auditoria` (por entidade/tenant), hoje inexistente ($CMD não há nenhum `SELECT` de auditoria em runtime).
- **Problema que resolve:** sem leitura, a trilha é "gravável mas não auditável" — não é possível comprovar estados regulatórios/operacionais no piloto.
- **Origem/rastreabilidade:** `#9` CA-04 (PRE_PILOT_BLOCKER); `0003_rls_security.sql` (REVOKE UPDATE/DELETE ⇒ append-only já provado em `audit.test.ts`); §5 da reconciliação.
- **Dependências:** nenhuma (paralelo com B/C). Leitura usa RLS padrão (servium_app + contexto).
- **Escopo IN:**
  - `packages/db/src/audit.ts`: `listarEventos(tenant, { entidade?, entidadeId?, acao?, limite, antesDe? })` ordenada por `criado_em` (padrão append-only; nunca escreve).
  - Endpoint `GET /auditoria` com `@Roles('admin')`, filtros opcionais `entidade`/`entidade_id`, paginação básica.
  - Teste de integração com RLS: tenant A não enxerga eventos de B (anti-vazamento); `operador` (não-admin) recebe 403.
- **Escopo OUT:** export/reconstrução de trilha; UI de auditoria (SPA); retenção/purge (PRM-P0.2-C define política).
- **Critérios de aceite (objetivos):**
  - CA-04-1: `GET /auditoria` autenticado admin retorna eventos do tenant com filtros corretos (aceite: registro `cobrar` por `item_ciclo_id`).
  - CA-04-2: requisição entre tenants ⇒ 0 eventos (RLS) — teste explícito.
  - CA-04-3: `operador` sem papel admin ⇒ 403.
  - CA-04-4: append-only preservado: `UPDATE`/`DELETE` de `servium_app` continuam falhando (teste do `audit.test.ts` mantido).
- **Testes unitários:** `listarEventos` com fixtures em memória (pg-mock) — ordenação/filtros.
- **Testes de integração:** endpoint + RLS + RBAC contra Postgres local.
- **E2E:** coberto indiretamente por PRM-P0.1-F (CA-F5 usa a leitura).
- **Observabilidade/auditoria:** leitura é auditorada? Não (leitura não gera evento, por design; registrar no doc CA-05).
- **Segurança:** RBAC admin + RLS; sem exposição de colunas sensíveis (detalhes/blob de contexto limitado).
- **Definition of Ready:** contrato do endpoint definido; permissões decididas (admin somente).
- **Definition of Done:** CA-04-1..4 verdes; `npm run verify` verde; PR + QA aprovado; status `#9` atualizado por comentário rastreável.
- **Agente responsável:** `servium-pleno`; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 7º de P0.2 (A∥B∥C).
- **Paralelização:** A ∥ B ∥ C.
- **Human Gate:** não.

## 12. PRM-P0.2-B — CA-03: eventos atômicos com a ação auditada

- **ID/título:** `[PRM-P0.2-B] Transações explícitas nos caminhos de auditoria não atômicos (CA-03)`.
- **Objetivo:** garantir que item de negócio + exceção/estado + evento de auditoria transacionem juntos nos caminhos ainda em autocommit.
- **Problema que resolve:** CA-03 PARCIAL: `cobrarItem` (`handlers.ts:159-188`) e `reenviarItem` (`ciclos.controller.ts:120-142`) já são transacionais; **não são**: `ativarCiclo` (insert itens + auditoria), ramo `escalar` de `cobrarItem` (UPDATE estado + INSERT excecoes + auditoria), `decidirItem` (`ciclos.controller.ts:90-106`, UPDATE item + UPDATE excecao + auditoria) e encerramento em `tickCiclos`/`encerrarCiclo`.
- **Origem/rastreabilidade:** `#9` CA-03; §5 da reconciliação; handlers/controller citados.
- **Dependências:** nenhuma (A∥B∥C).
- **Escopo IN:**
  - Envolver em `BEGIN/COMMIT`/`ROLLBACK` (padrão `cobrarItem`): `ativarCiclo`, ramo `escalar`, `decidirItem`, encerramentos (`tickCiclos` com `cielo_id`, `encerrarCiclo`).
  - Ajustar guardas de corrida (`RETURNING`/`rowCount`) para preservar comportamento sob concorrência.
  - Testes de integração: falha injetada no passo 2 desfaz o passo 1 (nenhum evento órfão, nenhum estado inconsistente).
- **Escopo OUT:** mudança de regra do motor; reescrita de SQL já transacional.
- **Critérios de aceite (objetivos):**
  - CA-03-1: injeção de falha em `ativarCiclo` após insert de itens ⇒ ROLLBACK total (0 itens, 0 eventos).
  - CA-03-2: falha em `escalar` entre UPDATE/INSERT excecao ⇒ ROLLBACK total (estado inalterado, sem exceção órfã e sem evento).
  - CA-03-3: falha em `decidirItem` ⇒ ROLLBACK total (item continua `excecao`, exceção sem `desfecho`).
  - CA-03-4: encerramento por `tickCiclos`/`encerrarCiclo` atômico (update estado + auditoria).
  - CA-03-5: nenhuma mudança de contrato público dos handlers/endpoints.
- **Testes unitários:** helpers de transação (quando extraídos).
- **Testes de integração:** falhas injetadas (SQL inválido proposital/plugin) validando ROLLBACK (CA-03-1..4).
- **E2E:** coberto por PRM-P0.1-F (estado final comprovado).
- **Observabilidade/auditoria:** invariante "evento append-only existe somente com estado aplicado"; logs de ROLLBACK.
- **Segurança:** sem novas superfícies; RLS intacto.
- **Definition of Ready:** lista de caminhos não atômicos congelada (a desta seção); técnica de injeção de falha definida.
- **Definition of Done:** CA-03-1..5 verdes; `npm run verify` verde; PR + QA aprovado.
- **Agente responsável:** `servium-pleno`; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 7º de P0.2 (A∥B∥C).
- **Paralelização:** A ∥ B ∥ C.
- **Human Gate:** não.

## 13. PRM-P0.2-C — CA-05: documentação do mecanismo de auditoria

- **ID/título:** `[PRM-P0.2-C] Documento "auditoria do piloto" (mecanismo, eventos, retenção) — CA-05`.
- **Objetivo:** documento de referência sobre o que é auditável hoje (eventos, append-only, políticas, leituras) e a política de retenção (pendência jurídica — NFR retenção).
- **Problema que resolve:** CA-05 PARCIAL: mecanismo implementado e testado (CA-01/CA-02), mas sem documentação que sustente o piloto e a revisão jurídica.
- **Origem/rastreabilidade:** `#9` CA-05; NFR retenção; §5/§10 da reconciliação.
- **Dependências:** PRM-P0.2-A (mapear leituras disponíveis) para a seção de consultas.
- **Escopo IN:**
  - `docs/audit/EVENTOS_AUDITORIA.md`: tabela de eventos emitidos hoje (caminho fonte), mecanismo append-only (REVOKE, migrations `0002`/`0003`), delegação RLS, leituras disponíveis (PRM-P0.2-A), convenção `actor_type` (`sistema`, `operador`, `servico` — este último com PRM-P0.3-C), retenção (**DEFERIDA** — ver abaixo; durante MVP/piloto eventos são preservados até aprovação).
  - Referências cruzadas: `HUMAN_DECISIONS_LOG` HG-008 (canal), ADR-005 (RLS), ADR-009 (auth audita), ADR-010.
- Decisão (2026-08-30): **HG-RETENÇÃO = DEFERRED** — nenhuma política definitiva de retenção nesta fase; **sem purge automático**; documentar explicitamente que, durante MVP/piloto, os eventos de auditoria são preservados até aprovação da política; qualquer purge futuro condicionado a HG-RETENÇÃO.
- **Escopo OUT:** implementação de purge/export (só política documentada); UI.
- **Critérios de aceite (objetivos):**
  - CA-05-1: documento lista **todos** os eventos emitidos pelos caminhos atuais (levantamento exaustivo no refinamento → checklist do PR).
  - CA-05-2: política de retenção registrada como **DEFERIDA** (preservar eventos no MVP/piloto até aprovação; purge futuro só com HG-RETENÇÃO), sem implementação de limpeza.
  - CA-05-3: doc referencia contratos/tests que provam CA-01/CA-02/CA-03/CA-04.
- **Testes unitários/integração:** não se aplica (documentação); validar por checklist de PR + markdownlint.
- **E2E:** não se aplica (referenciado em PRM-P0.1-F CA-F5).
- **Observabilidade/auditoria:** objeto do próprio documento.
- **Segurança:** seção de "dados sensíveis em detalhes" (não registrar segredos/PII além do necessário; revisar campos `detalhes`).
- **Definition of Ready:** lista de eventos levantada (parte do refinamento); política de retenção registrada como **DEFERIDA** (HG-RETENÇÃO).
- **Definition of Done:** CA-05-1..3 atendidos; doc revisado por QA e owner; markdownlint verde.
- **Agente responsável:** `servium-pleno` (documentação técnica) + apoio jurídico/owner na retenção; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 7º de P0.2 (A∥B∥C; recomendado após A).
- **Paralelização:** A ∥ B ∥ C.
- **Human Gate:** **HG-RETENÇÃO = DEFERRED (2026-08-30)** — definirá política de retenção (com PO/jurídico) antes de qualquer purge futuro.

## 14. PRM-P0.3-A — Política de senha (ASVS/NIST) + ponto de enforcement

- **Status (2026-08-30): BLOQUEADA — HG-PR-SEC DEFERRED.** Valores (mín. 12 proposto) seguem **proposta técnica**, não aprovados. Reavaliação em novo Human Gate (HG-PR-SEC) **antes da implementação de P0.3**.
- **ID/título:** `[PRM-P0.3-A] Política de senha justificada (ASVS V2.1/NIST 800-63B) + trocar-senha`.
- **Objetivo:** definir e **aplicar** política de senha com justificativa rastreável, substituindo a ausência de validação (seed usa `admin123`/`oper123`).
- **Problema que resolve:** `#20` gap "senha fraca" — nenhuma validação existe; valores não podem ser arbitrários.
- **Origem/rastreabilidade:** `#20` CA-02 (senha); ADR-009; ASVS 4.0.3 (V2.1 Authentication — memorized secrets); NIST SP 800-63B §5/§A (memorized secrets).
- **Dependências:** gate **HG-PR-SEC** (aprovar valores).
- **Escopo IN:**
  - `packages/db/src/security/password-policy.ts` (ou em `apps/api`): validação de senha com **justificativa documentada**: mínimo 8 (NIST A2.1; projeto adota **12** para B2B — proposto, sob gate), máximo 64, sem regra de composição obrigatória (sem exigir maiúscula/símbolo — NIST desaconselha como obrigatório), sem truncamento, espaços permitidos, blocklist de senhas comuns (top-1000; opcional v1).
  - Ponto de enforcement: `POST /auth/trocar-senha` (autenticado, verifica senha atual, aplica política, rehash argon2 já usado), + validação no `seed.mjs` (dev) e em qualquer futura criação de operador.
  - Documento curto de decisão (racional ASVS/NIST; desvio, se houver, justificado).
- **Escopo OUT:** criação de operadores via API (adicionei como dependência futura — fica OUT, registrada); MFA/2FA; bloqueio por senha (cobre P0.3-B).
- **Critérios de aceite (objetivos):**
  - CA-A-1: `trocar-senha` rejeita senha fora da política com mensagem específica e **audita** `trocar_senha_falha`; senha válida atualiza hash e revoga demais sessões do operador.
  - CA-A-2: seed/dev e tests falham com senhas fora da política (quando aplicável).
  - CA-A-3: política, justificativa e referências ASVS/NIST versionadas em doc (decisão).
- **Testes unitários:** validador (limites, blocklist, unicodidade, sem truncamento — argon2 já aceita `Buffer`).
- **Testes de integração:** endpoint `trocar-senha` (autenticação, senha atual, RC, auditoria, revogação de sessões) + RLS.
- **E2E:** coberto por suite Selenium existente (login) + novo doc (opcional).
- **Observabilidade/auditoria:** eventos `trocar_senha`/`trocar_senha_falha` (CA-02 do tempo).
- **Segurança:** hash existente argon2 inalterado; cookies invalidação em senha trocada.
- **Definition of Ready:** HG-PR-SEC aprovado (valores + justificativa); contrato do endpoint definido; revogação de sessões dimensionada.
- **Definition of Done:** CA-A-1..3 verdes; `npm run verify` verde; PR + QA + revisão de segurança; doc de decisão aprovado.
- **Agente responsável:** `servium-pleno` (segurança) com revisão de segurança dedicada; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 8º (P0.3-A ∥ B).
- **Paralelização:** A ∥ B (após HG-PR-SEC).
- **Human Gate:** **HG-PR-SEC** — aprovar valores e justificativa da política de senha (**DEFERRED em 2026-08-30**).

## 15. PRM-P0.3-B — Rate limiting no login (anti-automação)

- **Status (2026-08-30): BLOQUEADA — HG-PR-SEC DEFERRED.** Valores (5/15min conta; 30/5min IP propostos) seguem **proposta técnica**, não aprovados. Reavaliação em novo Human Gate (HG-PR-SEC) **antes da implementação de P0.3**.
- **ID/título:** `[PRM-P0.3-B] Rate limiting e bloqueio no POST /auth/login` .
- **Objetivo:** mitigar brute-force/credential-stuffing com limites configuráveis, auditáveis e justificados.
- **Problema que resolve:** `#20` gap "rate-limit ausente"; sem ele, o endpoint de login aceita tentativas ilimitadas (ASVS V2.2 Authentication / anti-automation; NIST 800-63B para confidencialidade).
- **Origem/rastreabilidade:** `#20` CA-02 (rate-limit); ADR-009.
- **Dependências:** HG-PR-SEC (valores); (roda sobre AuthController atual; sem Redis).
- **Escopo IN:**
  - Middleware/guard de rate limit **in-memory fixed-window** em `POST /auth/login`: por **conta** `(slug,email)` e por **IP** (sem expor qual foi acionado — anti-enumeração preservada: resposta idêntica `401`/`429` genérica).
  - Valores propostos (sob gate, justificados em ASVS/NIST): 5 falhas/15 min por conta → `LOCKOUT=429` com backoff; 30/5 min por IP (confidencialidade NIST). Configurável via env (`LOGIN_RATE_LIMIT_*`) para CI/tests.
  - Auditoria `login_block` em `eventos_auditoria` (sem PII desnecessária) + log estruturado.
  - Teste: limite excedido ⇒ 429 não informa; **a sessão legítima continua funcionando**.
- **Escopo OUT:** Redis/serviço externo (nota de escala: single-instance ok para piloto); captcha; bloqueio permanente.
- **Critérios de aceite (objetivos):**
  - CA-B-1: N falhas consecutivas por conta dentro da janela ⇒ 429 e evento `login_block`.
  - CA-B-2: resposta de bloqueio não revela se o alvo é conta ou IP (anti-enumeração).
  - CA-B-3: janela expira e login legítimo volta a funcionar (sem estado persistente corrompido).
  - CA-B-4: testes/CI usam configuração reduzida sem afetar casos existentes.
- **Testes unitários:** window/fixed logic com relógio fake.
- **Testes de integração:** N tentativas erradas → 429 → janela → sucesso; sucesso não limpa equivocadamente entre tenants.
- **E2E:** login Selenium continua verde (config reduzida).
- **Observabilidade/auditoria:** evento `login_block`; métricas de falhas (PRM-M-08).
- **Segurança:** nenhuma quebra de anti-enumeração atual (respostas 401/429 idênticas no formato).
- **Definition of Ready:** HG-PR-SEC (valores); janela/armazenamento em memória explicitado; comportamento multi-instância documentado (estado quebrado).
- **Definition of Done:** CA-B-1..4 verdes; `npm run verify` verde; PR + QA + segurança.
- **Agente responsável:** `servium-pleno` (segurança); QA: `servium-reviewer-qa`; revisão de segurança dedicada.
- **Ordem de execução:** 8º (P0.3-A ∥ B).
- **Paralelização:** A ∥ B (após HG-PR-SEC).
- **Human Gate:** **HG-PR-SEC** — valores de rate-limit (**DEFERRED em 2026-08-30**).

## 16. PRM-P0.3-C — Credencial de serviço do Funcionário Digital

- **ID/título:** `[PRM-P0.3-C] Identidade de serviço do FD em auditoria (actor_type='servico')`.
- **Objetivo:** que eventos emitidos pelo worker em nome do Funcionário Digital sejam atribuídos a uma identidade de serviço estável (`actor_type='servico'`, `actor_id` configurável), distinguindo de `sistema` (infra) e de `operador`.
- **Problema que resolve:** o CHECK do schema suporta `servico` (`0002:121-123`) mas nenhuma trilha o usa — auditoria não distingue "o FD agindo" de "infra do sistema".
- **Origem/rastreabilidade:** `#20` CA-06; §8 da reconciliação (risco 3); `actor_type` em `0002`.
- **Dependências:** PRM-P0.1-A (worker composto na app, onde se injeta a identidade); PRM-P0.2-C (doc cita `servico`).
- **Escopo IN:**
  - Env `SERVIUM_SERVICE_ID` (padrão: id estável por deploy) + contexto da identidade ao montar o worker.
  - `auditar()` do motor aceita sobreposição de actor quando job originado no runtime (sem mudar regras).
  - Testes: eventos de handler do worker trazem `actor_type='servico'` e `actor_id` configurado; auth continua `operador`; infra (`ciclo.encerrar` via scheduler?) reparte para `servico`.
- **Escopo OUT:** autenticação mútua dos jobs (tokens de serviço), ACL de serviços, rotacionar credenciais.
- **Critérios de aceite (objetivos):**
  - CA-C-1: worker real grava eventos com `actor_type='servico'` e `actor_id = SERVIUM_SERVICE_ID`.
  - CA-C-2: chamadas HTTP (operador/admin) continuam `actor_type='operador'` (sem regressão).
  - CA-C-3: sem `SERVIUM_SERVICE_ID` set, bootstrap falha com erro claro (evita trilha sem identidade).
- **Testes unitários:** `auditar` com actor override.
- **Testes de integração:** worker→eventos `servico`; RLS e leitura por PRM-P0.2-A retornam eventos corretos.
- **E2E:** CA-F5 do runtime preserva actor de serviço.
- **Observabilidade/auditoria:** trilha com `servico` diferenciado (doc CA-05 atualizado).
- **Segurança:** identidade não é segredo (é rótulo); sem bypass de RLS.
- **Definition of Ready:** convenção de `actor_type/actor_id` escrita; compatibilidade com CA-05.
- **Definition of Done:** CA-C-1..C-3 verdes; `npm run verify` verde; docs atualizadas.
- **Agente responsável:** `servium-senior` (worker/identidade) ; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 9º de P0.3.
- **Paralelização:** não (após P0.1-A).
- **Human Gate:** não.

## 17. PRM-P0.3-D — Materializar requisitos ASVS para o piloto

- **ID/título:** `[PRM-P0.3-D] Mapeamento ASVS 4.0.3 (nível 1) para o piloto + cobertura por testes`.
- **Objetivo:** documento vivo de conformidade de segurança do piloto: controles exigidos, implementados, testados e lacunas abertas — sustentando `PILOT_READY` e a revisão de segurança.
- **Problema que resolve:** `#20` CA-07 gap: nenhum artefato ASVS materializado (ADR-009 vinculou ASVS + testes de segurança na primeira história de auth).
- **Origem/rastreabilidade:** `#20` CA-07; ADR-009; §8 da reconciliação.
- **Dependências:** P0.1/P0.2/P0.3-A/B/C (para refletir estado real).
- **Escopo IN:**
  - `docs/security/ASVS_PILOTO.md`: tabela (capítulo → requisito → implementado? → evidência/teste → lacuna → responsável) para V2 (AuthN), V3 (Session), V4 (Access) e V5 (Validation/Input) **nível 1**.
  - Checklist de revisão de segurança no `QUALITY_GATES`.
- **Escopo OUT:** V6+ (encryption/crypto — revisar só ADR-009/RLS), testes de integração com ferramentas externas (não necessário nesta fase).
- **Critérios de aceite (objetivos):**
  - CA-D-1: documenta lacunas abertas (ex.: CORS estrito, headers de segurança, `SameSite` etc.) como itens rastreados.
  - CA-D-2: cada requisito implementado aponta a evidência automatizada (teste específico).
  - CA-D-3: revisado por "alguma pessoa responsável por segurança" antes de `PILOT_READY`.
- **Testes unitários/integração:** não se aplica (documentação); cada linha referencia teste existente.
- **E2E:** alinhado à suite Selenium (login/permissões).
- **Observabilidade/auditoria:** tópico "auditoria como controle ASVS" (ref. PRM-P0.2-C).
- **Segurança:** objeto do documento.
- **Definition of Ready:** ADR-009/QA gates revisados; lista de capítulos nivelada.
- **Definition of Done:** CA-D-1..3 atendidos; doc aprovado em revisão de segurança.
- **Agente responsável:** `servium-pleno` (segurança) + revisão dedicada; QA: `servium-reviewer-qa`.
- **Ordem de execução:** 9º de P0.3 (C ∥ D).
- **Paralelização:** C ∥ D.
- **Human Gate:** não (entregável de revisão).

## 18. Mapa de gaps menores #17 e #8 (NÃO implementar agora)

Estas viram **Issues de backlog** (`[PRM-M-17]`, `[PRM-M-08]`) com o único intuito de rastreamento — **não entram na execução desta fase**.

### PRM-M-17 — Exceções abertas por tenant (listagem global)

- **Origem:** `#17` CA-02 (gap); hoje `GET /ciclos/:cicloId/excecoes` (`ciclos.controller.ts:61-80`) lista apenas por ciclo.
- **Proposta (backlog):** `GET /excecoes` com filtros (estado aberto, ciclo, cliente) + RLS; decisão de prioridade com PO (listagem global é necessária para a fila de intervenção humana?).
- **Relação Issue:** nova Issue; relacionada a `#17` (fechada — sem reabrir).

### PRM-M-08 — Métrica de profundidade da fila

- **Origem:** `#8` CA-06 (gap): não há métrica de backlog (`metrics.service.ts` existe para API).
- **Proposta (backlog):** expor no `/metrics` a contagem de `jobs_fila` por estado (pendente/processando/falha/concluido) e próxima execução; base para alertas do piloto.
- **Relação Issue:** nova Issue; relacionada a `#8` (fechada — sem reabrir).

## 19. Estratégia de testes consolidada

| Camada | Onde | Ambientação | Prova | Histórias |
|---|---|---|---|---|
| Unit (motor puro) | `apps/api/test/motor.test.ts` | banco fake/tempo fake | decisão, transições, chaves | B, E (token) |
| Unit (worker loop) | `@servium/db` suite + novo | pg real local | claim/complete/fail/backoff | A |
| Unit (adapter) | `apps/api/test` | env fake | contrato `enviar` retry erro | D, E, C(fábrica) |
| Integration (worker real) | `apps/api/test` ou runtime-e2e helpers | Postgres Docker | handlers no processo real | A, B, E |
| Integration (API+REST) | `apps/api/test` supertest | Postgres Docker | endpoints, RLS, RBAC, rate-limit | P0.2-A/B, P0.3-A/B |
| Runtime E2E (F) | `apps/runtime-e2e` (novo) | Postgres + **Mailpit** | ciclo avança sozinho; mensagem inspecionada; correlação; auditoria | **P0.1-F**, A/B/C/D/E |
| UI E2E Selenium | `apps/e2e` (existente) | Web da API local | login, permissões, navegação | inalterado (regressão ok) |

Premissas e guarda:

- **Sem Gmail/OAuth real em testes automatizados** (regra 6). Testes do `GmailAdapter` continuam com env fake e caminhos de erro (padrão `gmail.test.ts`).
- Orquestração de Mailpit: serviço no `docker compose` (dev) e job dedicado no CI para o runtime E2E.
- `npm run verify` (lint + build + typecheck + test) permanece o gate de CI por PR; o runtime E2E roda em workflow dedicado (com Postgres+Mailpit).
- Timebox/limiar do F: janela definida por env (default ≤ 120 s), evitando flakiness por polling.

## 20. Definições transversais

**Definition of Ready global de cada história:** título/objetivo/problema/rastreabilidade declarados; dependências resolvidas; escopos IN/OUT claros; critérios de aceite objetivos e testáveis; testes planejados; ambiente necessário disponível (Postgres/Mailpit); resposta de "agente responsável + QA"; nenhum valor de segurança arbitrário (justificativa).

**Definition of Done global:** critérios de aceite verdes; `npm run verify` verde; CI verde; PR com aprovação QA (servium-reviewer-qa); revisão de segurança nos itens de segurança; docs (`FACTORY_STATUS`, runbook, `HUMAN_DECISIONS_LOG` se houver decisão) atualizadas; rastreabilidade GitHub (nova Issue → Issues históricas) registrada; sem regressão de RLS/auditoria (testes anti-vazamento verdes).

## 21. Human Gates

| Gate | Objeto | Quando | Quem | Status (2026-08-30) |
|---|---|---|---|---|
| **HG-PR-PLAN** | Aprovar o refinamento e a conversão das histórias em Issues | antes de criar Issues / iniciar P0.1 | Rodrigo (owner) | **APPROVED** — governança executada |
| **HG-PR-SEC** | Aprovar política de senha (mín 12 proposto vs alternativa) e rate-limit (5/15min conta; 30/5min IP propostos) com sua justificativa ASVS/NIST | antes de implementar P0.3-A/B | Rodrigo (owner) + apoio segurança | **DEFERRED** — valores seguem como propostas; P0.3-A/B bloqueadas |
| **HG-RETENÇÃO** | Política de retenção da auditoria (PRM-P0.2-C) | antes de qualquer purge futuro; na P0.2-C só documentação | PO/jurídico | **DEFERRED** — preservar eventos no MVP/piloto até aprovação |

Nenhum outro gate humano é necessário nas histórias refinadas; o restante é automação + QA (política de nível 3 mantém review de PR com QA obrigatório).

## 22. Ordem de execução e paralelização (resumo operacional)

```text
P0.1
  A (wire worker) ──▶ B (scheduler) ──▶ C (provider canal) ──▶ D (Mailpit) ┐
                                                                             ├─▶ F (runtime E2E)
                                                            ──▶ E (correlação) ┘
P0.2  A ∥ B ∥ C  (qualquer ordem; recomenda-se C após A p/ mapear leituras)
P0.3  [HG-PR-SEC — DEFERRED] → A ∥ B  ·  C (após P0.1-A)  ·  D (após A/B/C)  ·  M-17/M-08 só backlog
```

## 23. Riscos e premissas

- **Scheduler single-instance** (CPI local/in-memory) é suficiente para o piloto; documento o comportamento multi-instância (chave de janela idempotente) como condição de escala (premissa/risco).
- **Estados `cobrado`** (canal assíncrono em dois passos) não é usado pelo fluxo síncrono atual — mantido por compatibilidade (ADR-008), fora do escopo ativo.
- **Nova dependência `nodemailer`** para o Mailpit: **APROVADA** (2026-08-30) para o SMTP de teste; cliente manual via `node:net` proibido; restrita ao contexto local/CI/E2E, nenhuma dependência nova em produção.
- **`messages_gmail` vs `mensagens_comunicacao`:** PRM-P0.1-E alinha os ledgers; qualquer duplicidade residual é detectável e auditada; sem purge nesta fase.
- **Board Project** continua bloqueado (`PROJECT_BOARD_READ_BLOCKED_BY_TOKEN_SCOPE`) — rastreabilidade via Issue body/labels.
- **`#9` permanece aberta** como tracking; atualizações somente por comentário rastreável, sem mexer em título/estado até aprovação.

## 24. Estado final e próximo passo

Estado atual: **`PRE_PILOT_REMEDIATION_BACKLOG_READY`** — HG-PR-PLAN **APPROVED** (2026-08-30); 15 Issues de governança criadas (#45–#59); plano versionado; issues históricas preservadas; `#9` permanece **OPEN** como tracking.

Próximo passo (aguardando decisão humana — **STOP** da etapa de governança):

1. Autorizar o **início de execução da P0.1 (A→B→C→D/E→F)** — gate humano de execução (novo HG ou decisão no comentário/PR).
2. Aprovar **HG-PR-SEC** (valores de senha/rate-limit) **antes** de P0.3-A/B (atuam **bloqueadas** até lá).
3. Definir **HG-RETENÇÃO** (política de retenção) antes de qualquer purge futuro.
4. Parear P0.2/P0.3 conforme seção 22; M-17/M-08 seguem apenas backlog (creção de registro, sem execução).

**STOP: nenhuma implementação foi feita por esta etapa de governança. Nenhuma Issue histórica foi alterada. `#9` segue aberta e intocada (exceto comentário rastreável permitido).**

---

## Anexo A — Execução de governança (2026-08-30)

Registro da conversão do refinamento aprovado (HG-PR-PLAN) em rastreabilidade GitHub. Executado por **opencode · `opencode/big-pickle`**.

### A.1 Registro das Issues criadas

| # | Título | Prioridade | Labels | Dependências/Ordem | Relações históricas |
|---|---|---|---|---|---|
| #45 | [PRM-P0.1-A] Wire de handlers reais do motor no worker de fila | p0 | type:task, epic:mvp01, agent:senior | 1º de P0.1 (base de B/C/E/F) | #15, #8 |
| #46 | [PRM-P0.1-B] Scheduler periódico do ciclo (tick global idempotente) | p0 | type:task, epic:mvp01, agent:senior | depende de #45 | #15, #8 |
| #47 | [PRM-P0.1-C] Provider de CommunicationChannel por env (Mailpit/Gmail) | p0 | type:task, epic:mvp01, agent:senior | depende de #45/#46; base de D/E | #18 (ADR-008/HG-008) |
| #48 | [PRM-P0.1-D] Adapter Mailpit (SMTP de teste via nodemailer) | p0 | type:task, epic:mvp01, agent:pleno | depende de #47; ∥ E | #18 |
| #49 | [PRM-P0.1-E] Correlação resposta↔item do ciclo (token + recebimento) | p0 | type:task, epic:mvp01, agent:senior | depende de #47; ∥ D | #18 (CA-02) |
| #50 | [PRM-P0.1-F] E2E runtime: ciclo completo avança sozinho | p0 | type:task, epic:mvp01, agent:senior | depende de #45–#49 (encerra P0.1) | #15, #18, #8, #9 |
| #51 | [PRM-P0.2-A] Auditoria consultável por entidade/tenant (CA-04) | p0 | type:task, agent:pleno | A∥B∥C | **Relates #9** |
| #52 | [PRM-P0.2-B] Eventos de auditoria atômicos (CA-03) | p0 | type:task, agent:pleno | A∥B∥C | **Relates #9** |
| #53 | [PRM-P0.2-C] Documento do mecanismo de auditoria (CA-05) + retenção deferida | p0 | type:task, agent:pleno | recomendado após #51 | **Relates #9** |
| #54 | [PRM-P0.3-A] Política de senha ASVS/NIST + trocar-senha — **BLOQUEADA** | p0 | type:task, type:security, epic:mvp01, agent:pleno, status:blocked, needs:decision | HG-PR-SEC (DEFERRED); A∥B | #20 (fechada — sem reabrir) |
| #55 | [PRM-P0.3-B] Rate limiting no POST /auth/login — **BLOQUEADA** | p0 | type:task, type:security, epic:mvp01, agent:pleno, status:blocked, needs:decision | HG-PR-SEC (DEFERRED); A∥B | #20 (fechada — sem reabrir) |
| #56 | [PRM-P0.3-C] Identidade de serviço do FD (actor_type=servico) | p0 | type:task, type:security, epic:mvp01, agent:senior | depende de #45 | #20 (CA-06) |
| #57 | [PRM-P0.3-D] Mapeamento ASVS 4.0.3 nível 1 + cobertura por testes | p0 | type:task, type:security, epic:mvp01, agent:pleno | C∥D; reflete decisões de #54/#55 | #20 (CA-07) |
| #58 | [PRM-M-17] Exceções abertas por tenant — **backlog** | p2 | type:tech-debt, agent:pleno | sem execução nesta fase | #17 (fechada — sem reabrir) |
| #59 | [PRM-M-08] Métrica de profundidade da fila — **backlog** | p2 | type:tech-debt, agent:pleno | sem execução nesta fase | #8 (fechada — sem reabrir) |

**Ordem final de execução proposta:** #45 → #46 → #47 → #48/#49 → #50 (encerra P0.1); #51 ∥ #52 ∥ #53 (P0.2); após HG-PR-SEC: #54 ∥ #55 → #56 → #57 (P0.3). Dependências registradas no corpo de cada Issue.

### A.2 Estado das Issues históricas (preservadas)

- `#15`, `#16`, `#17`, `#18`, `#20`, `#8` — permanecem **fechadas** (`CLOSED_BUT_GAP_FOUND`); novas Issues vinculam-se por referência/`Relates`, sem reabrir.
- `#9` (auditoria) — permanece **OPEN** (`PRE_PILOT_BLOCKER`), intocada em título/estado; P0.2 relaciona-se a ela via `Relates to #9`. Nenhum fechamento/alteração até aprovação.

### A.3 Estado dos Human Gates

- **HG-PR-PLAN = APPROVED** (decisões: nodemailer aprovado; arquitetura 3 camadas confirmada; motor cego a Gmail/SMTP/Mailpit).
- **HG-PR-SEC = DEFERRED** — P0.3-A (#54) e P0.3-B (#55) **bloqueadas** (`status:blocked` + `needs:decision`); valores continuam propostas.
- **HG-RETENÇÃO = DEFERRED** — sem purge; eventos preservados no MVP/piloto até definição (P0.2-C/#53 documenta isso).

### A.4 Project Board

Bloqueado na leitura: `PROJECT_BOARD_READ_BLOCKED_BY_TOKEN_SCOPE` (token sem escopo Projects V2) — rastreabilidade registrada via labels/issues (epic:mvp01, priority:p0/p2, status:blocked, needs:decision).

### A.5 Versionamento

- Commit de governança contido no PR de documentação (ver retorno do assistente para número do PR e **SHA final** em `main` após merge).
- Estado do repositório: `main` (PR de governança do Anexo A); `docs-ci` deve validar markdownlint dos .md alterados.

### A.6 Estado esperado

`PRE_PILOT_REMEDIATION_BACKLOG_READY` — confirmado. **Aguardando novo gate humano para iniciar P0.1-A (#45).**

**Responsável pela governança:** plataforma **opencode** · modelo **`opencode/big-pickle`** · 2026-08-30.
