# Revisão do Modelo — Atividade · Evento · Obrigação · Ciclo · Item

> **Data:** 2026-09-23 · **Base:** `0de4155` (FR-028) · **Tipo:** DOC-only (definição de modelo + decisões pendentes — nenhum código muda neste documento)
> **Origem:** Proposta do produto (Rodrigo, sessão 2026-09-23): antes de avançar a Fase 1 da nova UX, revisar e formalizar o vínculo da camada de Atividade/Eventos à cadeia Obrigação → Ciclo → Item.
> **Ponto de entrada:** [`TRACEABILITY_MATRIX.md`](../product/TRACEABILITY_MATRIX.md) → FR-026/FR-027/FR-028.

## 1. Objetivo e decisões em aberto

Formalizar a **camada operacional de registro** ("o que aconteceu durante a execução") como entidade de primeira classe, ligada explicitamente à cadeia Obrigação → Ciclo → Item, e separá-la conceitualmente da **auditoria** (quem fez o quê, rastreabilidade administrativa).

Este documento **não implementa nada**; ele define o modelo-alvo, mapeia os emissores atuais, dimensiona impacto e **lista decisões que dependem de gate humano** (§9). As decisões registradas em ADR-012 ([`../decisions/ADR-012-atividade-evento-model.md`](../decisions/ADR-012-atividade-evento-model.md)) foram **APROVADAS via HG-009 (2026-09-24)** — ver seção [10. Resolução do gate humano (HG-009)](#10-resolução-do-gate-humano-hg-009). ADR-012 hoje: `Accepted (HG-009)`.

## 2. Distinções conceituais (a coluna do modelo)

| Camada | Define | Exemplo | Fonte atual |
|---|---|---|---|
| **1 · Entidade** (Cliente) | quem é o dono da obrigação | ACME Ltda. | `clientes` |
| **2 · Obrigação** | **o que** deve ser feito | Entregar documentos mensais | `obrigacoes` |
| **3 · Regra/Template** | como / qual checklist | Checklist de fechamento (itens de template) | `checklist_templates` / `itens_template` / **`atividades` (rotina recorrente — FR-020)** |
| **4 · Ciclo** | **uma execução** da obrigação p/ cliente/período | Setembro/2026 | `ciclos` |
| **5 · Item** | **cada pendência/tarefa** da execução | RG do sócio | `itens_ciclo` |
| **6 · Atividade/Evento** | **o que aconteceu** na execução (origem de negócio) | Cobrança enviada · documento recebido · exceção criada · ação humana | ★ **a definir** (hoje: parcialmente em `eventos_auditoria` + `mensagens_comunicacao` + `documentos` + `excecoes`) |
| **7 · Auditoria** | **quem fez o quê** no sistema (administrativo/técnico) | login, cadastro de template, alteração de config | `eventos_auditoria` (append-only) |

Regra de ouro do modelo-alvo:

> **Toda atividade operacional é rastreável até o Ciclo que a originou e, quando aplicável, até o Item do Ciclo.**

## 3. Estado atual (fatos do código)

| Entidade | Tabela | Vínculos atuais | Papel |
|---|---|---|---|
| Cliente | `clientes` | `tenant_id` | dono da obrigação |
| Obrigação | `obrigacoes` | `cliente_id` | definição do que fazer |
| Template/Checklist | `checklist_templates`, `itens_template` | `obrigacoes.template_id` | regra da execução |
| **Rotina recorrente** | **`atividades`** (`migrations/0014_atividades_agentes.sql:64`) | `tenant_id`, `agente_id`, `checklist_template_id` · **`escopo='todos_ativos'` (multi-cliente)** | configuração de recorrência (FR-020) — **NÃO é o registro operacional** |
| Ciclo | `ciclos` | `obrigacao_id` | execução da obrigação |
| Item | `itens_ciclo` | `ciclo_id`, `item_template_id` | tarefa da execução |
| Registro operacional | **inexistente como entidade única** | — | espalhado em `eventos_auditoria` (polimórfico), `mensagens_comunicacao`/`documentos`/`excecoes` (via `item_ciclo_id`) |
| Auditoria | `eventos_auditoria` | `tenant_id` + `entidade`/`entidade_id` (polimórfico) | append-only, admin-only |

### 3.1 Emissores × vínculo de negócio (inventário real, 21 ações · 29 linhas — `EVENTOS_AUDITORIA.md`)

| Categoria | Eventos | Tem origem de negócio? | Resolvível ao ciclo/item? |
|---|---|---|---|
| **Execução (ciclo/item)** | `ativar`(ciclo, HTTP+motor), `ativacao_sem_template`, `decisao`, `escalar`, `cobrar`, `encerrar`(2), `decidir`, `reenviar`, `receber`, `cancelar` | ✅ nascem de uma operação do motor/cadastro | ✅ `item_ciclo`/`ciclo` → JOIN (FR-028) |
| **Configuração/Cadastro** | `criar`/`atualizar`/`excluir` (cliente, obrigacao, checklist_template, email_template, atividade), `vincular_email_template`, `ativar`/`desativar` (atividade) | ⚠️ sim, mas **não de uma execução** (são configuração) | ❌ sem ciclo (cliente/obrigação/template existem) |
| **Acesso/Administrativo** | `login_sucesso`, `login_falha`, `login_block`, `logout`, `trocar_senha`, `trocar_senha_falha` | ❌ não é trabalho do FD | ❌ não tem ciclo — camada auditoria pura |

**Conclusão do diagnóstico:** a parte que o usuário chama de "atividade recente da Funcionária Digital" **já existe em conteúdo** (eventos de execução, enriquecidos no FR-028), mas vive num modelo polimórfico (`entidade`+`entidade_id`), sem FKs de negócio e sem origem garantida.

## 4. Conflitos identificados (não resolver silenciosamente)

1. **Colisão de nomenclatura "Atividade":** o termo já designa a **rotina recorrente configurada** (`atividades`, FR-020) — inclusive em `eventos_auditoria` (`entidade='atividade'`). Um segundo "Atividade" para o registro da execução cria ambiguidade de domínio, de schema e de API. → **Decisão D1 (§9).**
2. **Polimorfismo de origem:** `eventos_auditoria.entidade_id` é uma chave solta (sem FK); a regra "rastreável ao ciclo/item" só vale por JOIN e só para entidades de execução. Não há garantia estrutural.
3. **Escopo de `atividades`:** hoje `escopo='todos_ativos'` (multi-cliente, sem `cliente_id`). O feed da Home agrupa por cliente/ciclo — o vínculo terá que nascer da execução (ciclo/item), não da rotina configurada.
4. **`atividade` de FR-028 como "título":** o presenter resolve `operacional.atividade` a partir da entidade `atividade` config (eventos `criar`/`atualizar`/`ativar`/...); isso é rótulo de configuração, **não** vínculo de execução. Caso `ciclo/item` não têm atividade associada hoje (FR-027 em aberto) — inconsistência que o modelo-alvo deve resolver.

## 5. Modelo-alvo proposto (entidade de registro operacional)

### 5.1 Cadeia (visão única)

```text
CLIENTE
  │
  └── OBRIGAÇÃO
        │
        ├── Template / Checklist
        │
        └── CICLO
              │
              ├── Item 1
              ├── Item 2
              ├── Item 3
              │
              └── REGISTROS OPERACIONAIS
                    ├── Ciclo criado
                    ├── Cobrança enviada
                    ├── Documento recebido
                    ├── Documento validado
                    ├── Pendência identificada
                    ├── Exceção criada
                    ├── Ação humana
                    ├── Reenvio
                    └── Ciclo concluído
```

### 5.2 Estrutura-alvo (rascunho — sujeita à D1/D2)

```text
eventos_operacionais (ou nome a definir na D1)
├── id                uuid PK
├── tenant_id         uuid FK tenants            (RLS — ADR-005)
├── ciclo_id          uuid FK ciclos NOT NULL    ★ origem obrigatória
├── ciclo_item_id     uuid FK itens_ciclo NULL   ★ quando aplicável
├── cliente_id        uuid FK clientes NOT NULL  (denormalizada p/ feed, consistente via ciclo)
├── tipo              text                       (ex.: cobranca_enviada, documento_recebido, ...)
├── ator_tipo         text CHECK (fd | humano | sistema | cliente)
├── ator_id           uuid
├── titulo            text
├── descricao         text
├── resultado         jsonb / text
├── contexto_tecnico  jsonb   (colapsável na UI)
└── criado_em         timestamptz
```

### 5.3 Regras obrigatórias

1. **Origem:** todo registro nasce de uma operação concreta do motor/cadastro/recebimento — nunca de leitura (GET) nem de log de infra;
2. **Rastreabilidade:** `ciclo_id NOT NULL`; `ciclo_item_id` presente quando a ação recai sobre um item;
3. **Consistência:** `cliente_id` **denormalizado** (mantido por decisão HG-009) com FK válida p/ `clientes`, `NOT NULL` e mecanismo de consistência com o ciclo/item (lógica garantida no emissor / CHECK composto);
4. **Separação:** `eventos_auditoria` permanece como auditoria administrativa (quem fez o quê) — modelos distintos, fontes distintas;
5. **Append-only** para o registro operacional também (espelhar `REVOKE UPDATE, DELETE` + RLS FORCE — ADR-005).

## 6. Alternativas dimensionadas

| Opção | Descrição | Custo | Risco / dívida |
|---|---|---|---|
| **A. Entidade nova** | Tabela `eventos_operacionais` normalizada (5.2) + emissores passam a gravar nela; auditoria segue paralela | médio-alto (migration + backfill dos eventos de execução + emissores) | risco de duplicidade/temporariedade com `eventos_auditoria`; mais robusto no longo prazo |
| **B. Graduar auditoria** | Adicionar FKs `ciclo_id`/`ciclo_item_id`/`cliente_id` nullable + índices a `eventos_auditoria`; Home/navegação em cima | baixo-médio | modelo segue polimórfico; eventos de configuração/login precisam de regra de vazio; dívida de modelo permanece |
| **C. Somente apresentação** | Sem schema novo: Home feed + navegação via JOIN (extensão natural do FR-028) | baixo | não garante origem de negócio estruturalmente; resolve a dor de UX mais rápido |

**Recomendação preliminar (pendente D2):** **A**, começando por um subconjunto — registrar operacionalmente as ações de **execução de ciclo/item** (que já têm origem de negócio garantida), deixando configuração/acesso na auditoria. C é aceitável como entrega intermediária de UX, sem substituir A.

## 7. Impacto por camada (se A for aceita)

| Camada | Impacto |
|---|---|
| **Banco** | Migration nova (tabela + FKs + RLS FORCE + `REVOKE UPDATE/DELETE` + índice `(ciclo_id, criado_em DESC)`); **não** altera `atividades` (config) nem `eventos_auditoria` |
| **Motor/runtime** | Emissores `cobrar`, `receber`, `escalar`, `encerrar`, `ativar`, `decisao` passam a gravar (ou replicar) no registro operacional — transacionalmente, onde hoje já são transacionais |
| **Cadastro** | `decidir`, `reenviar`, `cancelar`, `ativar` (HTTP) — mesma regra; ações humanas ganham `ator_tipo='humano'` |
| **API** | Endpoints de consulta do feed/Home (ex.: `GET /atividades-operacionais/later?cursor=`) com keyset; navegação `Atividade → Cliente → Obrigação → Ciclo → Item`; **auditoria continua `GET /auditoria`** (FR-028 intacto) |
| **UI/Home** | "Atividade recente da Funcionária Digital" (feed) com navegação por contexto; detalhe técnico colapsável; toca **FR-026/FR-027** e o gate **HG-M1-FRENTE-A** (pendente) |
| **Testes** | Suíte nova por emissor (origem garantida, rastreabilidade, isolamento, append-only) — no padrão `auditoria-operacional.test.ts` |

## 8. Plano de evolução proposto

1. **Esta revisão** (DOC) — formaliza modelo e decisões pendentes; ✅ documento
2. **Decisão humana** — D1 (nomenclatura), D2 (opção A/B/C), D3 (escopo do primeiro corte) — ✅ **HG-009 RESOLVIDO (2026-09-24)**
3. **ADR-012** → `Accepted` — ✅ `Accepted (HG-009 · 2026-09-24)`
4. **Implementação** (ciclo posterior) — ⛔ **não autorizada por este gate**: migration + emissores + API + Home/feed + testes + docs (Documentation Sync Rule) seguem fluxo normal da Factory V2

## 9. Decisões pendentes (Human Gate — não decidir silenciosamente)

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| **D1** | Nome da camada operacional | `eventos_operacionais` · `registros_do_ciclo` · `atividade_do_ciclo` · renomear `atividades` (config) | `eventos_operacionais` (evita colisão com FR-020) |
| **D2** | Rota de implementação | **A** entidade nova · B graduar auditoria · C só apresentação | **A** (subconjunto execução) |
| **D3** | Escopo do primeiro corte | só execução ciclo/item · execução+configuração · incluir acesso | Só execução ciclo/item |
| **D4** | Relação com `atividades` (config, FR-020) | manter paralela · vincular execução→config (quando recorrência existir) | Manter paralela; vínculo futuro (FR-022) |
| **D5** | Gate de UX | Home/feed + navegação tocam `HG-M1-FRENTE-A` (pendente) | Registrar dependência no gate |

> **Nenhum requisito novo é criado aqui como fato:** os itens acima são propostas; a canonicidade continua em `FUNCTIONAL_REQUIREMENTS.md` e `MVP_EXPERIENCE_SPEC_v1.md`, que devem ser atualizados **após** as decisões D1–D5.

## 10. Resolução do gate humano (HG-009)

**Decisões aprovadas em 2026-09-24** (Decisor: Rodrigo · registro imutável: [`../factory/HUMAN_DECISIONS_LOG.md`](../factory/HUMAN_DECISIONS_LOG.md) §HG-009 · pack: [`../factory/HUMAN_GATE_ADR012_2026-09-24.md`](../factory/HUMAN_GATE_ADR012_2026-09-24.md)):

| Decisão | Resultado |
|---|---|
| D1 · Naming | `eventos_operacionais` (`atividades` não renomeada) |
| D2 · Rota | **A** — entidade nova |
| D2-B · Auditoria | **B1** — dual-write atômico (mesma transação) |
| D3 · 1º corte | 8 eventos (`ativar`, `escalar`, `cobrar`, `encerrar`, `decidir`, `reenviar`, `receber`, `cancelar`) |
| D4 · `atividades` | Manter como configuração; vínculo futuro (FR-022) |
| D5 · UX | Feed global depende da entidade; timeline por ciclo independente |
| RBAC · Feed | **RBAC-2** (admin + operator) |
| cliente_id | Manter **denormalizado** (FK + consistência + RLS) |
| Backfill | NOT APPROVED / NOT PLANNED |

> **Impacto desta seção:** arquitetura `Accepted`. Este documento/ADR **não autoriza implementação** — o modelo-alvo acima orienta o ciclo futuro de implementação (Factory V2 + gates).

## Referências cruzadas

- [`../decisions/ADR-012-atividade-evento-model.md`](../decisions/ADR-012-atividade-evento-model.md) — ADR desta revisão (`Accepted (HG-009)`, decisões registradas)
- [`EVENTOS_AUDITORIA.md`](../audit/EVENTOS_AUDITORIA.md) — inventário de emissores (21 ações · 29 linhas) e camada `operacional` do FR-028
- [`../product/TRACEABILITY_MATRIX.md`](../product/TRACEABILITY_MATRIX.md) — FR-026/FR-027/**FR-028**
- [`../product/FIRST_DIGITAL_EMPLOYEE.md`](../product/FIRST_DIGITAL_EMPLOYEE.md) — §Modelo de atividade, agente executor e feedback (2026-09-23)
- [`../product/FUNCTIONAL_REQUIREMENTS.md`](../product/FUNCTIONAL_REQUIREMENTS.md) — FR-020 (atividade recorrente) · FR-028 (auditoria operacional) · FR-029 (UX)
- [`../reports/UI_EXPERIENCE_BLUEPRINT_PROPOSAL.md`](../reports/UI_EXPERIENCE_BLUEPRINT_PROPOSAL.md) — timeline do FD (M2/M3) e gaps de narrativa (`UX_PRODUCT_GAP_ANALYSIS.md`)
- [`../architecture/DOMAIN_BOUNDARIES.md`](../architecture/DOMAIN_BOUNDARIES.md) — B3 (tarefa e execução) · B7 (Audit & Observability)
- [`../decisions/ADR-005-tenant-strategy.md`](../decisions/ADR-005-tenant-strategy.md) — RLS como base do isolamento (aplicado ao registro operacional)
