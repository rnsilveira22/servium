# ServiumAI — Documentation Sync V2

> **Data:** 2026-09-23 · **Autor:** Agente opencode (Designer da Fábrica)
> **Base auditada:** `c06f4f7` (~feat/hg-007-google-cloud-preparation) + worktree com alterações não commitadas de docs V1/V2
> **Tipo:** Auditoria documental + governança — **nenhuma implementação de código** (SEM N8N, SEM agentes futuros, SEM Pós-MVP silencioso)
>
> **Atualização FR-020/FR-021 (2026-09-23, mesmo dia):** após esta auditoria, os requisitos FR-020 e FR-021 foram **implementados** (migration `0014_atividades_agentes.sql`, controllers `atividades`/`agentes`, página `AtividadesPage`, teste `apps/api/test/atividades.test.ts` 7✓). Reflexo documental: inventário de auditoria agora é **20 ações · 28 linhas de emissão** (+`atividade` `criar`/`atualizar`/`ativar`/`desativar`); matriz FR-020/FR-021 → ✅; adendo no ADR-005; glossário atualizado. Detalhes na matrícula de handoff da implementação. *(Revisão FR-028 — 2026-09-23: inventário canônico `EVENTOS_AUDITORIA.md` foi corrigido para **21 ações · 29 linhas** — foi omitida a ação `vincular_email_template` (`cadastro.controller.ts:225`), já existente na base `c06f4f7`.)*

---

## 1. Executive Summary

Auditoria da documentação do ServiumIA **contra o código real** confirma que a base documental (FR-001..FR-029, matriz de rastreabilidade, regras de governança, UX, auditoria) está **coerente** com o estado implementado. Foram encontradas e **corrigidas apenas as inconsistências necessárias**:

| # | Inconsistência | Correção aplicada |
|---|---|---|
| 1 | `EVENTOS_AUDITORIA.md` inventariava 17 eventos na base `main@150188f`; o código atual (`c06f4f7`) emite **5 ações a mais** | Inventário reconciliado: **19 ações · 24 emissões** (`cancelar`, `criar/atualizar/excluir` email_template, `login_block`) |
| 2 | `EVENTOS_AUDITORIA.md` afirmava ator `servico` **sem emissor**; desde P0.3-C o motor grava `servico` com `SERVIUM_SERVICE_ID` | §2.5 e §8.4 corrigidos |
| 3 | `README.md` status desatualizado ("restam P0.2/P0.3"; roadmap "em curso") | Status reescrito: remediação P0 concluída; B-2 #103, M0 UX #96 mergeados |
| 4 | Matriz FR-021 citava `auditoria.test.ts` (CA-C) — evidência real está em `identidade-servico.test.ts` | Referência corrigida |
| 5 | Matriz citava fonte inexistente `AGENTS/AI_CONTEXT.md` | Corrigido para `docs/AI_CONTEXT.md` |

**Testes rodados (evidências reais, sem inventar status):** API **178 passed** · Web **46 passed** · DB **24 passed** · Runtime-E2E **3 passed**. Números batem com os citados na matriz.

A Documentation Sync Rule está **gravada e confirmada** em `AGENTS.md`, `docs/AI_CONTEXT.md` e `docs/PROJECT_INDEX.md`.

---

## 2. Repository State

| Item | Valor |
|---|---|
| Branch | `feat/hg-007-google-cloud-preparation` |
| HEAD | `c06f4f7` feat(api+web): modelos de e-mail padrão por checklist; login rate-limit friendly; env via loadEnvFile |
| Worktree | 9 arquivos modificados (docs V1/V2) + 2 untracked (matriz + relatório V1) |
| Código nesta rodada | **Zero alterações** (somente documentação) |
| `demo/` | untracked — fora de commit (decisão do usuário) |

Suíte real (executada nesta auditoria): API 27 arquivos/178 testes (1 arquivo skipado, 2 testes skipados) · Web 11 arquivos/46 · DB 6/24 · Runtime-E2E 1/3.

---

## 3. Documentation Audited

| Documento | Auditado? | Resultado |
|---|---|---|
| `docs/product/MVP_SCOPE.md` | ✅ | Escopo + classificação FR-020..029 corretos |
| `docs/product/FIRST_DIGITAL_EMPLOYEE.md` | ✅ | Renomeado "Estagiária Digital"; modelo atividade/agente coeso |
| `docs/product/FUNCTIONAL_REQUIREMENTS.md` | ✅ | FR-001..FR-019 preservados; FR-020..029 formalizados |
| `docs/product/TRACEABILITY_MATRIX.md` | ✅ | Coerente; **3 correções pontuais** (fontes, FR-021, auditoria) |
| `docs/product/MVP_EXPERIENCE_SPEC_v1.md` | ✅ | Status "aguardando aprovação humana" mantido — correto |
| `docs/audit/EVENTOS_AUDITORIA.md` | ✅ | **Reconciliado** para 19 ações/24 emissões (para eventuais atrasos, ver §10) |
| `docs/factory/FACTORY_STATUS.md` | ✅ | M0 #96 merged; M1 Wave B1 #98 merged; M1 UX Frente A branch sem PR — preciso |
| `docs/factory/HUMAN_GATES.md` | ✅ | Catálogo e formato HG vigentes |
| `docs/AI_CONTEXT.md` | ✅ | Regra de sync gravada + vínculo matriz |
| **`AGENTS/AI_CONTEXT.md`** | ❌ **NÃO EXISTE** | Ver §7 (path fantasma no PROMPT §1/#9) |
| ADR-001..011 | ✅ | Todos Accepted; ADR-006/008/010 cobrem motivos; sem ADR novo necessário |

---

## 4. Documentation Updated

| Arquivo | Mudança |
|---|---|
| `docs/audit/EVENTOS_AUDITORIA.md` | Inventário §3 → 19 ações/24 emissões; +5 ações; ator `servico` real; §8.4; nota de revisão base `c06f4f7` |
| `README.md` | Status e roadmap alinhados ao real (P0 concluído; B-2/M0 UX; piloto Innove) |
| `docs/product/TRACEABILITY_MATRIX.md` | Fontes corrigidas (`docs/AI_CONTEXT.md`); FR-021 → `identidade-servico.test.ts`; linha `EVENTOS_AUDITORIA` reconciliada; `README` corrigido |
| (**do ciclo V1, já presentes**) | `FUNCTIONAL_REQUIREMENTS.md`, `FIRST_DIGITAL_EMPLOYEE.md`, `MVP_SCOPE.md`, `AGENTS.md`, `AI_CONTEXT.md`, `PROJECT_INDEX.md`, `GLOSSARY.md` |

---

## 5. Requirements Verified

**FR-001..FR-019** (estado de rastreamento): cada status ✅ da matriz foi **verificado contra código + testes reais** (ver evidências em colunas da matriz). Nenhum status inventado; 🟡/📋 puros se mantêm.

**FR-020..FR-029**: todos 📋 **formalizado** (nenhum implementado) — consistente com a classificação MVP do `MVP_SCOPE.md`. **Nenhum FR futuro foi implementado** nesta rodada nem nas anteriores além do que estava no código real.

**Novos eventos de auditoria** (descobertos nesta auditoria): `cancelar`, `criar/atualizar/excluir` (`email_template`), `login_block` — todos com evidência de código linha a linha e cobertura de teste (`cancelar-ciclo.test.ts`, `email-templates.test.ts`).

---

## 6. Traceability Matrix Status

**Coerente.** A `TRACEABILITY_MATRIX.md` reflete o estado real após as 3 correções pontuais (§1).

- Legenda ✅/🟡/📋/— aplicada sem invenção;
- Evidência de código: arquivo:função reais (ex.: `handlers.ts:46` emite `servico`; `cancelar-ciclo.ts:36` emite `cancelar`);
- Evidência de teste: `identidade-servico.test.ts` (CA-C-1/CA-C-3), `cancelar-ciclo.test.ts:203` (SELECT `acao='cancelar'`), `email-templates.test.ts`;
- Nunca marcar ✅ sem tripla prova código+teste+doc → esta é a regra que a matriz aplica.

---

## 7. Code vs Documentation Inconsistencies

| Inconsistência | Severidade | Resolvida? |
|---|---|---|
| `EVENTOS_AUDITORIA.md`: 17 eventos em `main@150188f` vs 19 ações/24 emissões reais | Alta (auditoria era fonte de verdade e estava desatualizada) | ✅ |
| Ator `servico` "sem emissor" no doc vs P0.3-C emitindo de fato | Alta | ✅ |
| `README.md` status "restam P0.2/P0.3" vs P0/B-2/M0 resolvidos | Média (doc líder) | ✅ |
| Matriz FR-021 referenciava arquivo de teste errado (`auditoria.test.ts` → `identidade-servico.test.ts`) | Baixa | ✅ |
| **Path fantasma `AGENTS/AI_CONTEXT.md`** citado no PROMPT V2 (§1/#9) como referência — **não existe** no repositório | Média (doc de governança) | ⚠️ **Não duplicado**: o conteúdo vive em `AGENTS.md` (raiz) + `docs/AI_CONTEXT.md`. Recomendo substituir `AGENTS/AI_CONTEXT.md` por `AGENTS.md` no rico de referência do PROMPT |
| `demo/` untracked | Baixa | Fora de escopo (decisão do usuário) |

---

## 8. MVP Scope Validation

Confirmação da classificação formalizada no `MVP_SCOPE.md` (= PROMPT V2 §7–§9). **Nada do incremental/pós foi implementado nesta rodada.**

### MVP obrigatório

FR-020 (atividade operacional recorrente) · FR-021 (agente executor configurável) · FR-029 (UX/UI orientada à operação).

- **Estado:** 📋 formalizado (FR-020/021). FR-029 parcial: M0 UX merged (#96); M1 Wave B1 (#98) com M1-OPS pedaços; M1 UX Frente A na branch `feat/m1-frente-a-pleno` **sem PR**.

### MVP incremental

FR-022 · FR-025 · FR-026 · FR-027 · FR-028 → **📋 formalizados, não implementados** — conforme PROMPT (§8: "evoluir com o fluxo principal estável").

### Pós-MVP

FR-023 (organização documental) · FR-024 (classificação por confiança) → **📋 formalizados, não implementados — correto**. Nada foi criado.

---

## 9. UX/UI Status

| Marco | Estado real | Confere? |
|---|---|---|
| M0 UX (#96) | merged `95c8160` (09/09) — design system, acessibilidade, menu mobile | ✅ |
| M1 Wave B1 (#98) | merged `dfb75c0` — M1-OPS-01/03/04A/05/07 (API/contrato) | ✅ |
| M1 UX Frente A | branch `feat/m1-frente-a-pleno` (M1-UI-01 templates, M1-UI-05 exceções) — **`gh pr list` retorna vazio** → sem PR | ✅ (matriz dizia "sem PR") |
| `MVP_EXPERIENCE_SPEC_v1.md` | Status "Proposta para aprovação humana" | ✅ mantém FG (FR-029 base) |
| AuditoriaPage | metria + health (técnica); sem UI operacional (FR-028) | ✅ |

---

## 10. Audit Status

- **Auditoria técnica (dados):** sólida e reconciliada — 19 ações/24 emissões (`EVENTOS_AUDITORIA.md`), append-only provado em teste (`audit.test.ts:14-39`), RLS FORCE, leitura keyset.
- **Auditoria operacional (FR-028):** 📋 formalizada; dados já existem (`eventos_auditoria`, `GET /auditoria`), falta camada de apresentação operacional. Correto no MVP incremental.
- **`login_block`**: agora catalogado (rate-limit, pré-auth, conexão admin).

---

## 11. Agent Architecture Status

- **Modelo:** atividade → regra → agente executor → execução → resultado → auditoria (FR-020/FR-021) — formalizado, não implementado como entidade.
- **Real hoje:** motor único não-parametrizado + identidade de serviço (`actor_type='servico'`, P0.3-C `identidade-servico.test.ts` CA-C-1/CA-C-3).
- **SEM agentes futuros criados** (Assistente Pleno, Analistas = catalog no model, não implementação) — atendido.
- Compatível com C3 Digital Workforce e B3 Workforce Configuration (boundaries existentes).

---

## 12. Activity Model Status

| Camada do modelo | Estado | Evidência |
|---|---|---|
| Atividade/regra/periodicidade (FR-020/FR-022) | 📋 formalizado | `FUNCTIONAL_REQUIREMENTS.md`; hoje: obrigação→ciclo (`ciclos.controller.ts`) |
| Agente executor (FR-021) | 📋 formalizado (extensível) | `actor_type='servico'` + `requireServiceId` |
| Execução/resultado | 🟡 obrigação/ciclo→itens (implementado) | `handlers.ts`, `ciclos.test.ts` |
| Auditoria | ✅ dados; 📋 apresentação operacional (FR-028) | §10 |

Deixar "TAREFA vs ATIVIDADE" separados desde a semântica (PROMPT §13) já está registrado na doc de produto.

---

## 13. ADR Impact

| Item | Verdict |
|---|---|
| ADR novo | **Não** — nenhuma decisão arquitetural nova nesta rodada |
| ADR atualizado | **Não** |
| ADR vigentes que sustentam | ADR-006 (jobs/fila persistida), ADR-008 (canal), ADR-010 (determinístico-first), ADR-007 (storage) |
| Quando criar | **FR-020/FR-021 implementados como entidades** → avaliar ADR no mesmo ciclo (regra §20 V2) |

Alterações de UI/documentação **não** geram ADR — conforme PROMPT §20.

---

## 14. Human Gate Impact

**Nenhum gate alterado nem aprovado por agente.** Registros de produto seguem `AWAITING_DECISION`:

- HG-B2 PO (já aceito por humano) · HG-007 (Google/OAuth) · HG-RETENÇÃO · M0 UX acceptance formal · M1 UX Frente A (PR+gate) · M1-OPS-04B (legados sem e-mail).

Recomendações explícitas de produto (decisões humanas, não tomadas por mim):

- **HG-M1-FRENTE-A:** abrir PR da `feat/m1-frente-a-pleno` + gate (bloqueia FR-029 "M1 pendente").
- **HG-PATH-AGENTS:** confirmar substituição de `AGENTS/AI_CONTEXT.md` → `AGENTS.md`.

---

## 15. Documentation Sync Rule Status

| Local | Contém regra? | Conteúdo |
|---|---|---|
| `AGENTS.md` (raiz) | ✅ | Regra completa + handoff `## Documentation Impact` + regras de bloqueio |
| `docs/AI_CONTEXT.md` | ✅ | Fluxo início-a-fim + vínculo matriz |
| `docs/PROJECT_INDEX.md` | ✅ | Convenção + ponto de entrada (matriz) |
| **`AGENTS/AI_CONTEXT.md`** | ❌ arquivo inexistente | **Ação recomendada:** PROMPT V2 deve citar `AGENTS.md`, não este path |

**Concluído:** a regra permanente (§4 V2) está **gravada e mantida**.

---

## 16. QA Requirements

Documentado para todos os agents (`AGENTS.md` + `QUALITY_GATES.md` Gate 4.6 / ASVS):

1. **Reviewer/QA valida também documentação e rastreabilidade** (não só código/testes/segurança/arquitetura);
2. `código correto + doc desatualizada` = implementação **incompleta**;
3. Pré-PR checklist (§21 V2): requisito → docs → código → testes → UX → traceability → ADR → Human Gate → escopo. Nenhum item foi pulado nesta auditoria (não há PR: apenas docs).

---

## 17. Risks

| Risco | Severidade | Mitigação |
|---|---|---|
| Inventário de auditoria desatualizar de novo (como ocorreu entre #53 e c06f4f7) | Média | Matriz + regra de sync exigem atualização no mesmo PR; evento novo = editar §3 |
| UI de auditoria mostra log técnico (métrica/health) como "Auditoria" | Média | FR-028 no incremental; QA alertar ao liberar UI |
| M1 UX Frente A sem PR propaga atraso no FR-029 | Média | Human Gate recomendado (§14) |
| Doc líder `README` se desatualizar | Baixa | Já corrigido; manter via rule |
| N8N/agentes futuros "vazarem" para MVP | Alta (atemporal) | PROMPT §10/§11 + matriz e rule blindam |

---

## 18. Recommended Next Steps

### MVP obrigatório

1. **HG-M1-FRENTE-A** → abrir PR `feat/m1-frente-a-pleno`, gate de aprovação, merge (Frente FR-029).
2. **FR-020/FR-021** entrar para implementação (entidade atividade + agente config extensível). Ao implementar: atualizar matriz no mesmo PR + avaliar ADR.

### MVP incremental

1. FR-028/FR-027 (auditoria operacional + timeline sobre `eventos_auditoria` já existentes) — mais baratos.
2. FR-022 periodicidade/competência.
3. FR-026 dashboard operacional.

### Pós-MVP

1. FR-023 organização documental; FR-024 classificação com confiança (sem IA desnecessária — ADR-010).

### Governança

1. Corrigir path `AGENTS/AI_CONTEXT.md` → `AGENTS.md` no material de referência do PROMPT.
2. Commitar esta rodada de docs + correções (aguarda aval do usuário).

---

## 19. Files Changed

### Nesta rodada (V2 — correções de auditoria)

| Arquivo | Tipo |
|---|---|
| `docs/audit/EVENTOS_AUDITORIA.md` | alterado (reconciliação 19 ações/24 emissões) |
| `README.md` | alterado (status/roadmap) |
| `docs/product/TRACEABILITY_MATRIX.md` | alterado (fontes, FR-021, linha auditoria, README) |

### Ciclo V1 (já presentes no worktree)

`AGENTS.md`, `docs/AI_CONTEXT.md`, `docs/GLOSSARY.md`, `docs/PROJECT_INDEX.md`, `docs/product/FIRST_DIGITAL_EMPLOYEE.md`, `docs/product/FUNCTIONAL_REQUIREMENTS.md`, `docs/product/MVP_SCOPE.md` (+ novos `docs/product/TRACEABILITY_MATRIX.md`, `docs/reports/DOCUMENTATION_SYNC_REPORT_2026-09.md`).

### Fora desta rodada (pendente de decisão)

`apps/web/src/pages/ObrigacoesPage.tsx` (correção UI sessão anterior — sem commit), `demo/` (untracked).

---

## 20. Git / Commit / PR Information

| Item | Valor |
|---|---|
| Branch | `feat/hg-007-google-cloud-preparation` |
| HEAD | `c06f4f7` |
| Commit desta rodada | **Nenhum** (aguarda aval do usuário para commitar docs V1+V2 juntos em PR único, ou separados) |
| PR | Nenhum aberto nesta rodada |
| Suíte executada | API 178 ✅ · Web 46 ✅ · DB 24 ✅ · Runtime-E2E 3 ✅ |
| Nota | `apps/web/src/pages/ObrigacoesPage.tsx` tem alteração pendente de decisão (fechar/descartar) |

---

*Fim do relatório V2. Regra de ouro confirmada: **código + teste + documentação + matriz caminham juntos; nada de requisição sem rastreio; nada de decisão humana tomada por agente.***
