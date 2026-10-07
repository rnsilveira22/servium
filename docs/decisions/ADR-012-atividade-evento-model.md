# ADR-012 — Modelo de Atividade/Evento Operacional ligado à cadeia Obrigação → Ciclo → Item

## Status

Accepted (HG-009 · 2026-09-24)

> Decisão arquitetural **APROVADA** no Human Gate **HG-009** (Decision Pack [`../factory/HUMAN_GATE_ADR012_2026-09-24.md`](../factory/HUMAN_GATE_ADR012_2026-09-24.md)). Proposta original registrada na revisão [`../architecture/MODEL_ATIVIDADES_EVENTOS_REVIEW.md`](../architecture/MODEL_ATIVIDADES_EVENTOS_REVIEW.md) (2026-09-23) em estado `Proposed`.
>
> **Aprovação de arquitetura ≠ autorização de implementação.** Este ADR registra decisões humanas; a implementação técnica de `eventos_operacionais` **não está autorizada** por este gate e permanece sujeita ao fluxo normal da Factory V2 e aos gates correspondentes.

## Context

A camada de registro operacional ("o que aconteceu durante a execução") não existe como entidade de primeira classe. O conteúdo está espalhado em `eventos_auditoria` (polimórfico `entidade`+`entidade_id`), `mensagens_comunicacao`, `documentos` e `excecoes`. A UX pretendida (Home "Atividade recente da Funcionária Digital", timeline, navegação Atividade → Cliente → Obrigação → Ciclo → Item) exige vínculo estrutural e origem de negócio garantida.

Distinção que motiva a decisão:

- **Obrigação** → define o que deve ser feito;
- **Ciclo** → execução da obrigação para cliente/período;
- **Item** → pendência/tarefa da execução;
- **Atividade/Evento** → registra o que aconteceu durante a execução;
- **Auditoria** → quem fez o quê no sistema (rastreabilidade administrativa), já sólida (FR-028, append-only, RLS).

Colisões e lacunas atuais: o termo "Atividade" já designa a rotina recorrente configurada (`atividades`, FR-020); os eventos de execução já são enriquecidos por JOIN no FR-028, mas sem FK de negócio.

## Decision (aprovada — HG-009)

Adotar uma **entidade de registro operacional** (`eventos_operacionais`) ligada por FK à cadeia `ciclos`/`itens_ciclo`/`clientes`, com as regras:

1. `ciclo_id NOT NULL` — toda atividade operacional é rastreável ao ciclo que a originou;
2. `ciclo_item_id` quando a ação recai sobre um item;
3. origem de negócio: somente operações concretas do motor/cadastro/recebimento (nunca leitura ou log de infra);
4. append-only + RLS FORCE (espelho do padrão `eventos_auditoria` — ADR-005);
5. `eventos_auditoria` permanece como auditoria administrativa (modelos separados).

Estrutura rascunhada em [`MODEL_ATIVIDADES_EVENTOS_REVIEW.md` §5.2](../architecture/MODEL_ATIVIDADES_EVENTOS_REVIEW.md).

## Alternatives Considered

1. **Graduar `eventos_auditoria`** (FKs nullable + índices) — mais barato, mas mantém o modelo polimórfico misturando configuração/acesso/execução; dívida de modelo permanece.
2. **Somente camada de apresentação** (feed + navegação via JOIN) — resolve rapidamente a dor de UX, mas não garante origem de negócio estruturalmente; aceitável como entrega intermediária, não como substituta da decisão A.

## Consequences

- Feed/Home e timeline com vínculo estrutural (ciclo/item obrigatórios quando aplicável);
- Navegação Atividade → Cliente → Obrigação → Ciclo → Item sem JOIN frágil;
- Qualidade de resposta à dor "o que a Funcionária Digital fez" (backlog UX);
− Novo schema, novos emissores e backfill dos eventos de execução atuais;
− Duplicidade temporária com `eventos_auditoria` até a migração ser consolidada;
− Decisões humanas D1–D5 registradas via **HG-009** (2026-09-24); **gate de UX HG-M1-FRENTE-A permanece pendente** e bloqueia a Home/feed global.

## Human Decision — HG-009

- **Data:** 2026-09-24
- **Gate:** HG-009 · **Status:** `AWAITING_DECISION` → `RESOLVED` (decisão registrada)
- **Decision Pack:** [`../factory/HUMAN_GATE_ADR012_2026-09-24.md`](../factory/HUMAN_GATE_ADR012_2026-09-24.md)
- **Decisor:** Rodrigo (owner)

| Decisão | Resultado aprovado |
|---|---|
| **D1** · Naming | `eventos_operacionais` como entidade do histórico operacional; `atividades` **não** é renomeada |
| **D2** · Estrutura | **Opção A** — nova entidade `eventos_operacionais`, vinculada por FK à cadeia Cliente → Obrigação → Ciclo → Item do Ciclo; não usar `eventos_auditoria` como substituta |
| **D2-B** · Relação com auditoria | **B1 — dual-write atômico**: quando a operação exigir ambos os registros, persistir `eventos_operacionais` + `eventos_auditoria` na **mesma transação** |
| **D3** · Primeiro corte | **8 eventos**: `ativar`, `escalar`, `cobrar`, `encerrar`, `decidir`, `reenviar`, `receber`, `cancelar`; `decisao` e `ativacao_sem_template` permanecem exclusivamente na auditoria |
| **D4** · `atividades` | **Manter como configuração** de rotinas recorrentes (FR-020); vínculo execução→config permanece evolução futura (FR-022) |
| **D5** · UX | **Separar** feed global (depende de `eventos_operacionais`) × timeline do ciclo (pode continuar sobre `mensagens_comunicacao`/`itens_ciclo`/`documentos`/`excecoes`) |
| **RBAC** · Feed | **RBAC-2** — admin + operator; operator vê informações operacionais (auditoria segue admin-only) |
| **cliente_id** | **Manter desnormalizado** no `eventos_operacionais` com FK válida p/ `clientes`, mecanismo de consistência com ciclo/item, isolamento multi-tenant e RLS apropriado (duplicação consciente e documentada) |
| **Backfill** | **NOT APPROVED / NOT PLANNED** — sem conversão automática de eventos históricos; novo registro começa a partir do ponto de ativação definido pelo produto |
| **Implementação** | **NOT AUTHORIZED BY THIS GATE** — nem esta aprovação nem este ADR autorizam código/migration/API/UX |

## Consequences — orientações de implementação aprovadas (HG-009)

Aprovadas junto às decisões, para orientar a etapa futura de implementação (que segue o fluxo da Factory V2):

1. `eventos_operacionais`: entidade de primeira classe, `ciclo_id NOT NULL`, `ciclo_item_id` quando a ação recai sobre um item;
2. `cliente_id` denormalizado: FK p/ `clientes`, NOT NULL e proteção de consistência com o ciclo/item (duplicação consciente);
3. append-only + RLS FORCE + `REVOKE UPDATE/DELETE` (espelho do padrão `eventos_auditoria` — ADR-005);
4. dual-write atômico com `eventos_auditoria` na mesma transação (D2-B1);
5. RBAC do feed: admin + operator (RBAC-2);
6. sem backfill — registros começam do ponto de ativação definido pelo produto;
7. apenas os 8 eventos do primeiro corte (D3).

## Risks

- Escopo crescer e incluir configuração/login indevidamente → mitigado pela regra de origem (execução) e por D3;
- Divergência entre registro operacional e auditoria (mesmo fato em dois lugares) → mitigado por **D2-B1**: origem única no emissor, dual-write atômico na mesma transação;
- Divergência de `cliente_id` denormalizado vs cadeia do ciclo → mitigado por FK + mecanismo de consistência com ciclo/item (HG-009);
- Escopo de implementação avançar sem autorização da Factory → bloqueado: decisão (HG-009) **não** autoriza implementação; gate de UX **HG-M1-FRENTE-A** permanece pendente.

## Condições de revisão

Decisões humanas registradas na seção [Human Decision — HG-009](#human-decision--hg-009) e no Decision Pack [`HUMAN_GATE_ADR012_2026-09-24.md`](../factory/HUMAN_GATE_ADR012_2026-09-24.md). Revisar este ADR quando: (a) a Fase 1 da nova UX for iniciada; (b) `FUNCTIONAL_REQUIREMENTS.md`/`TRACEABILITY_MATRIX.md` refletirem os vínculos FR-027/FR-028 com `eventos_operacionais`; (c) o ponto de ativação do registro (sem backfill) for definido pelo produto.
