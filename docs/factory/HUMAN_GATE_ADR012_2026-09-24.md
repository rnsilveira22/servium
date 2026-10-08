# HUMAN GATE — ADR-012

## Modelo de Atividades e Eventos Operacionais

**Data:** 24/09/2026
**Gate:** HG-009 (`RESOLVED` — decisão registrada em 2026-09-24) · **Nível:** 3 · **RBAC:** humano (Rodrigo)
**Base técnica:** [`../reports/ADR012_TECHNICAL_REVIEW_2026-09-24.md`](../reports/ADR012_TECHNICAL_REVIEW_2026-09-24.md)
**Commit analisado:** `0de4155` · **Estado atual:** `DECISION RECORDED / ADR-012 ACCEPTED (arquitetura)`
**Política:** `default-safe: none` — sem decisão explícita, nada é implementado. **Este gate não autoriza implementação.**

---

## 1. Contexto

A revisão técnica confirmou que o modelo atual possui uma cadeia relacional forte:

```text
Cliente
   ↓
Obrigação
   ↓
Ciclo
   ↓
Item
```

Essa cadeia possui FKs reais e isolamento por tenant.

O problema está no registro da execução:

```text
O que aconteceu durante a execução?
```

Atualmente esse histórico está distribuído entre `eventos_auditoria`, `mensagens_comunicacao`, `documentos`, `excecoes` e estado dos itens.

O `eventos_auditoria` utiliza:

```text
entidade
entidade_id
```

de forma polimórfica e sem FK de negócio.

A revisão confirmou que isso não fornece o vínculo estrutural necessário para a futura experiência de:

```text
Funcionária Digital
    ↓
Atividade recente
    ↓
Cliente
    ↓
Obrigação
    ↓
Ciclo
    ↓
Item
    ↓
Resultado / próxima ação
```

A proposta do ADR-012 é criar:

```text
eventos_operacionais
```

como entidade operacional de primeira classe.

A revisão técnica recomendou manter essa direção, mas identificou decisões que precisam ser tomadas pelo Human Gate.

---

## 2. DECISÃO D1 — Naming

### Pergunta

Qual deve ser o nome da nova entidade responsável por registrar acontecimentos operacionais da execução?

### Opção recomendada

```text
eventos_operacionais
```

### Motivo

A entidade `atividades` já possui significado definido no domínio:

```text
atividades = configuração de rotina recorrente
```

Ela possui periodicidade, agente, checklist e comportamento, mas não representa uma ocorrência executada.

Usar "atividade" novamente para o histórico criaria ambiguidade entre:

```text
Atividade = configuração
```

e:

```text
Atividade = acontecimento
```

### Decisão humana

**D1 — Aprovar `eventos_operacionais`?**

- [ ] APROVAR
- [ ] ALTERAR

**Recomendação técnica:** APROVAR.

---

## 3. DECISÃO D2 — Modelo Arquitetural

### Pergunta

Onde devem viver os registros operacionais?

### Opção A — Nova entidade

```text
eventos_operacionais
```

com FKs estruturais:

```text
tenant_id
ciclo_id
ciclo_item_id
cliente_id
```

### Opção B — Expandir `eventos_auditoria`

Adicionar FKs/colunas operacionais à tabela existente.

### Opção C — Não criar entidade

Continuar compondo a informação por JOINs na apresentação.

---

### Análise

A revisão considera a Opção A a mais aderente ao problema porque fornece:

- FK real;
- semântica própria;
- separação entre produto e compliance;
- feed global;
- paginação;
- evolução futura;
- possibilidade de resultado estruturado;
- possibilidade de próxima ação.

A Opção B mantém o débito técnico do modelo polimórfico.

A Opção C não resolve o problema arquitetural de rastreabilidade estrutural.

### Decisão humana

**D2 — Adotar `eventos_operacionais` como nova entidade?**

- [ ] APROVAR — Opção A
- [ ] ALTERAR — Opção B
- [ ] ALTERAR — Opção C

**Recomendação técnica:** APROVAR — Opção A.

---

## 4. DECISÃO D2-B — Relação com Auditoria

Esta decisão foi identificada pela revisão como necessária para evitar uma inconsistência arquitetural futura.

Hoje os eventos de negócio já são gravados em:

```text
eventos_auditoria
```

Criar `eventos_operacionais` gera duas possibilidades.

---

### Opção D2-B1 — Dual-write atômico

Cada operação grava:

```text
eventos_operacionais
        +
eventos_auditoria
```

na mesma transação.

Exemplo:

```text
cobrar
  │
  ├── INSERT eventos_operacionais
  │
  └── INSERT eventos_auditoria
```

#### Vantagens

- preserva a auditoria atual;
- mantém compatibilidade;
- separa semanticamente os domínios;
- evita perda da trilha histórica futura.

#### Risco

Existe duplicação deliberada de informação.

---

### Opção D2-B2 — Realocação do emissor

O evento operacional passa a ser registrado em:

```text
eventos_operacionais
```

e a auditoria deixa de ser o emissor principal daquele evento.

Uma eventual trilha de auditoria seria derivada/gerada conforme a estratégia definida.

#### Vantagem

Evita dois registros independentes.

#### Risco

Maior alteração arquitetural e maior impacto no modelo atual.

---

### Decisão humana

**D2-B — Como tratar os dois domínios?**

- [ ] D2-B1 — Dual-write atômico
- [ ] D2-B2 — Realocação do emissor

**Recomendação técnica:** D2-B1, mantendo ambos na mesma transação.

> A revisão explicitamente identifica o dual-write como risco alto e exige que essa escolha seja feita conscientemente.

---

## 5. DECISÃO D3 — Primeiro Corte Operacional

A revisão identificou 10 eventos relacionados à execução, mas concluiu que dois deles não deveriam entrar no feed operacional.

### Eventos propostos para `eventos_operacionais`

| Evento | Incluir |
|---|---:|
| `ativar` | SIM |
| `escalar` | SIM |
| `cobrar` | SIM |
| `encerrar` | SIM |
| `decidir` | SIM |
| `reenviar` | SIM |
| `receber` | SIM |
| `cancelar` | SIM |

Total:

**8 eventos**

### Permanecem somente na auditoria

```text
decisao
ativacao_sem_template
```

A justificativa é que `decisao` pode ocorrer em todo tick sem ação e gerar ruído no feed, enquanto `ativacao_sem_template` representa uma condição/configuração ausente e não uma ação operacional efetiva.

### Decisão humana

**D3 — Primeiro corte = 8 eventos?**

- [ ] APROVAR — 8 eventos
- [ ] ALTERAR — incluir também `decisao`
- [ ] ALTERAR — incluir também `ativacao_sem_template`
- [ ] ALTERAR — outra composição

**Recomendação técnica:** APROVAR os 8 eventos.

---

## 6. DECISÃO D4 — `atividades`

### Pergunta

O que fazer com a entidade existente:

```text
atividades
```

### Resultado da revisão

Ela deve permanecer.

Seu papel é:

```text
atividade
    ↓
configuração de rotina recorrente
    ↓
agente
    ↓
checklist
```

Ela não representa execução.

Não deve ser renomeada.

Não deve ser transformada em histórico.

O vínculo entre atividade e execução deverá ser tratado futuramente quando o FR-022 materializar a execução da atividade em obrigação/ciclo.

### Decisão humana

**D4 — Manter `atividades` como configuração independente?**

- [ ] APROVAR
- [ ] ALTERAR

**Recomendação técnica:** APROVAR.

---

## 7. DECISÃO D5 — Dependência da UX

A revisão corrigiu uma questão importante do ADR.

Não devemos considerar toda a UX dependente de `eventos_operacionais`.

Existem dois casos.

---

### D5-A — Feed global

```text
Home
  ↓
Atividade recente da Funcionária Digital
  ↓
eventos de vários ciclos
```

Esse feed precisa da nova entidade.

Motivos:

- paginação;
- ordenação;
- rastreabilidade;
- RBAC separado;
- performance;
- fonte operacional única.

---

### D5-B — Timeline de um ciclo

```text
Ciclo
  ↓
Timeline
```

Já pode ser construída hoje usando:

```text
mensagens_comunicacao
itens_ciclo
excecoes
```

Portanto, não precisa obrigatoriamente aguardar `eventos_operacionais`.

---

### Decisão humana

**D5 — Aprovar a separação?**

```text
Feed global
→ depende de eventos_operacionais

Timeline do ciclo
→ pode existir independentemente
```

- [ ] APROVAR
- [ ] ALTERAR

**Recomendação técnica:** APROVAR.

---

## 8. DECISÃO EXTRA — RBAC DO FEED

A revisão identificou uma decisão de produto que não estava suficientemente definida.

Hoje:

```text
GET /auditoria
```

é admin-only.

O futuro feed:

```text
Atividade recente da Funcionária Digital
```

não deve necessariamente expor a auditoria administrativa.

É necessário decidir quem pode visualizar o feed operacional.

### Opções

**RBAC-1**

```text
Somente admin
```

**RBAC-2**

```text
Admin + operador
```

com exposição apenas de informações operacionais.

**RBAC-3**

```text
Admin + operador
```

com níveis diferentes de detalhe.

### Decisão humana

**RBAC — Quem pode visualizar a atividade operacional?**

- [ ] RBAC-1
- [ ] RBAC-2
- [ ] RBAC-3
- [ ] Outra regra

**Observação:** esta decisão deve ser tratada como decisão de produto/RBAC e não pode ser inferida pelo OpenCode.

---

## 9. DECISÃO EXTRA — `cliente_id`

A proposta possui:

```text
eventos_operacionais
    ├── ciclo_id
    └── cliente_id
```

Mas:

```text
ciclo
 ↓
obrigação
 ↓
cliente
```

já permite derivar o cliente.

### Opção A

Manter:

```text
cliente_id
```

como desnormalização consciente.

Nesse caso:

- FK para `clientes`;
- NOT NULL;
- mecanismo para garantir consistência com o ciclo.

### Opção B

Remover `cliente_id`.

Derivar via JOIN.

### Decisão humana

**CLIENTE-ID — manter desnormalizado ou derivar?**

- [ ] Manter `cliente_id`
- [ ] Derivar por JOIN

A revisão considera a desnormalização justificável para o feed, mas reconhece o risco de divergência.

---

## 10. Resumo das decisões

Antes da implementação, precisamos registrar:

| Gate | Decisão |
|---|---|
| **D1** | Naming `eventos_operacionais` |
| **D2** | Nova entidade |
| **D2-B** | Dual-write ou realocação |
| **D3** | 8 eventos no primeiro corte |
| **D4** | `atividades` permanece configuração |
| **D5** | Feed global ≠ timeline de ciclo |
| **RBAC** | Quem pode visualizar feed |
| **CLIENTE-ID** | Desnormalizar ou derivar |

---

## 11. Estado do Human Gate

Até que essas decisões sejam explicitamente aprovadas:

```text
ADR-012
    ↓
PROPOSED
    ↓
HUMAN DECISION REQUIRED
    ↓
IMPLEMENTATION BLOCKED
```

A revisão técnica confirmou que a implementação **não está pronta para ser liberada** enquanto D1–D5 não forem aprovadas.

---

## 12. Registro de decisão humana

Decisões registradas em **2026-09-24** pelo decisor **Rodrigo (owner)** (registro imutável: [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md) §HG-009).

## D1

**Decisão:** **APPROVED** — nome da entidade: `eventos_operacionais` (`atividades` não é renomeada).

## D2

**Decisão:** **APPROVED — Opção A** — nova entidade `eventos_operacionais`, vinculada por FK à cadeia Cliente → Obrigação → Ciclo → Item do Ciclo.

## D2-B

**Decisão:** **APPROVED — B1 (dual-write atômico)** — operações que exigirem registro operacional **e** auditoria persistem ambos na mesma transação.

## D3

**Decisão:** **APPROVED** — primeiro corte com **8 eventos**: `ativar`, `escalar`, `cobrar`, `encerrar`, `decidir`, `reenviar`, `receber`, `cancelar`. `decisao` e `ativacao_sem_template` permanecem exclusivamente na auditoria.

## D4

**Decisão:** **APPROVED** — `atividades` permanece como configuração de rotinas recorrentes; não renomear; vínculo com execução → evolução futura (FR-022).

## D5

**Decisão:** **APPROVED** — separação: feed global depende de `eventos_operacionais`; timeline do ciclo pode continuar independente (sobre `mensagens_comunicacao`/`itens_ciclo`/`documentos`/`excecoes`).

## RBAC

**Decisão:** **APPROVED — RBAC-2** — admin + operator podem visualizar o feed; operator vê informações operacionais; auditoria permanece admin-only.

## CLIENTE-ID

**Decisão:** **APPROVED** — manter `cliente_id` desnormalizado no `eventos_operacionais`, com FK válida p/ `clientes`, mecanismo de consistência com ciclo/item e RLS apropriado (duplicação consciente e documentada).

## Registros adicionais

```text
Backfill: NOT APPROVED / NOT PLANNED
Implementation: NOT AUTHORIZED BY THIS GATE
```

> **As decisões arquiteturais do HG-009 foram registradas, mas esta atividade não autoriza a implementação técnica de `eventos_operacionais`.**

---

## 13. Próximo Human Gate

Após o preenchimento deste Decision Pack:

1. registrar as decisões no ADR-012 — ✅ **executado** (seção *Human Decision — HG-009*; ADR-012 → `Accepted (HG-009)`);
2. atualizar `MODEL_ATIVIDADES_EVENTOS_REVIEW.md` — ✅ **executado** (decisões registradas);
3. atualizar requisitos afetados — ✅ **executado** (revisão sem criar requisitos novos);
4. atualizar a matriz de rastreabilidade, se necessário — ✅ **executado**;
5. somente então liberar a implementação — ⛔ **NÃO autorizada por este gate** (aguarda fluxo normal da Factory V2 + gates de implementação/UX).

**Nenhuma dessas etapas deve ser considerada autorizada automaticamente pela existência deste documento.**

---

## Referências cruzadas

- [`../decisions/ADR-012-atividade-evento-model.md`](../decisions/ADR-012-atividade-evento-model.md) — ADR objeto do gate; decisões registradas (`Accepted (HG-009)`).
- [`../reports/ADR012_TECHNICAL_REVIEW_2026-09-24.md`](../reports/ADR012_TECHNICAL_REVIEW_2026-09-24.md) — revisão técnica e Propostas de Alteração (D3/D5).
- [`../architecture/MODEL_ATIVIDADES_EVENTOS_REVIEW.md`](../architecture/MODEL_ATIVIDADES_EVENTOS_REVIEW.md) — origem da proposta e das decisões D1–D5.
- [`../audit/EVENTOS_AUDITORIA.md`](../audit/EVENTOS_AUDITORIA.md) — inventário de emissores usado para dimensionar o primeiro corte.
- [`HUMAN_GATES.md`](HUMAN_GATES.md) — catálogo de gates (HG-009).
