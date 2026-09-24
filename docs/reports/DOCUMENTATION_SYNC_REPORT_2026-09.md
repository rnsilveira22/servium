# ServiumAI — Documentation Sync Report

> **Data:** 2026-09-23
> **Autor:** Agente opencode (Designer da Fábrica)
> **Escopo:** PROMPT MESTRE SERVIUMAI — Documentation Sync + Novos Requisitos (atividade, agente executor, periodicidade, organização documental, feedback, dashboard, timeline, auditoria operacional, UX/UI)
> **Branch:** `feat/hg-007-google-cloud-preparation`
> **Regra aplicada:** Documentation Sync Rule (executa porque **nenhuma** mudança desta sessão altera código implementado; esta é uma rodada de documentação/requisitos).

---

## 1. Executive Summary

Realizada a **Documentation Sync** do Servium IA: criada a **matriz de rastreabilidade canônica**, formalizados **10 novos requisitos** (FR-020..FR-029) que evoluem o conceito de *tarefa* para o de **Atividade / Agente Executor** (a **Estagiária Digital**), classificados em **MVP obrigatório / MVP incremental / Pós-MVP**, e gravada a **Documentation Sync Rule** como obrigatória para todos os agentes.

**Resultado-chave:** a documentação agora reflete o conceito de produto vigente sem inventar requisitos e sem decisões de arquitetura silenciosas. A correção de UI (seletor de checklist em Obrigações) da sessão anterior permanece **não commitada** e **fora** deste relatório de documentação — ver §10 e §16.

| Aspecto | Estado |
|---|---|
| Documentação de requisitos | FR-001..FR-019 consolidados; FR-020..FR-029 formalizados |
| Documentação de arquitetura | Sem alteração; ADRs vigentes (006/008/010) cobrem a base |
| Matriz de rastreabilidade | Criada (Requisição → Doc → Código → Teste → Status) |
| Escopo MVP | Classificado (obrigatório / incremental / pós) |
| Documentation Sync Rule | Gravada em `AGENTS.md`, `AI_CONTEXT.md`, `PROJECT_INDEX.md` |
| Testes | Não aplicável (nenhuma mudança de código nesta sessão) |
| **Não commitado** | Correção UI `ObrigacoesPage.tsx` (sessão anterior) |

---

## 2. Artifacts Delivered

| # | Artefato | Arquivo | Tipo |
|---|---|---|---|
| 1 | Matriz de rastreabilidade Requisito→Doc→Código→Teste→Status | `docs/product/TRACEABILITY_MATRIX.md` | **novo** |
| 2 | Requisitos FR-020..FR-029 formalizados | `docs/product/FUNCTIONAL_REQUIREMENTS.md` | alterado |
| 3 | Conceito de Atividade/Agente/Feedback na especificação do primeiro agente | `docs/product/FIRST_DIGITAL_EMPLOYEE.md` | alterado |
| 4 | Classificação de escopo da evolução | `docs/product/MVP_SCOPE.md` | alterado |
| 5 | Documentation Sync Rule global | `AGENTS.md`, `docs/AI_CONTEXT.md`, `docs/PROJECT_INDEX.md` | alterados |
| 6 | Novos termos do glossário | `docs/GLOSSARY.md` | alterado |
| 7 | Relatório final (este arquivo) | `docs/reports/DOCUMENTATION_SYNC_REPORT_2026-09.md` | **novo** |

---

## 3. Documentation Landscape (estado atual)

Mapeamento completo da estrutura documental do repositório (auditado nesta sessão):

| Área | Documentos-chave |
|---|---|
| Raiz | `README.md`, `AGENTS.md`, `docs/PROJECT_INDEX.md`, `docs/GLOSSARY.md`, `docs/AI_CONTEXT.md` |
| Produto | `product/MVP_SCOPE.md`, `product/FUNCTIONAL_REQUIREMENTS.md`, `product/NON_FUNCTIONAL_REQUIREMENTS.md`, `product/MVP_01_VERTICAL_SLICE.md`, `product/INITIAL_BACKLOG.md`, `product/BACKLOG_OVERVIEW.md`, `product/FIRST_DIGITAL_EMPLOYEE.md`, `product/OPERATIONAL_FLOW.md`, `product/CANDIDATE_ROUTINES.md`, `product/SUCCESS_METRICS.md`, `product/MVP_EXPERIENCE_SPEC_v1.md`, `product/RISKS_AND_HYPOTHESES.md`, `product/PERSONAS.md`, `product/DEMO_FACTORY_STORY.md`, `product/TRACEABILITY_MATRIX.md` *(novo)* |
| Arquitetura | `architecture/*` — FUNCTIONAL_ARCHITECTURE, DOMAIN_BOUNDARIES, ARCHITECTURE_DRIVERS, SYSTEM_CONTEXT, CONTAINER_ARCHITECTURE, STACK_EVALUATION, AI_USAGE_BOUNDARIES, SECURITY_ARCHITECTURE |
| Decisões | `decisions/ADR-001..011` (todos Accepted) |
| Fábrica | `factory/HUMAN_GATES.md`, `factory/HUMAN_DECISIONS_LOG.md`, `factory/FACTORY_STATUS.md`, `factory/ORCHESTRATOR.md`, `factory/DEVELOPMENT_WORKFLOW.md`, `factory/AGENT_TEAM.md`, `factory/QUALITY_GATES.md`, `factory/HG-007_GOOGLE_WORKSPACE_INNOVE_PHASE2.md` |
| Auditoria | `audit/EVENTOS_AUDITORIA.md` (17 eventos, append-only) |
| Segurança | `security/*` |
| Roadmap | `roadmap/README.md` |
| Dev | `development/LOCAL_ENV.md` |
| Relatórios | `reports/*` (30+ relatórios de sessões/gates) |

**Diretórios/padrões:** Markdown em pt-BR, links relativos, hipóteses vs. fatos separados, IDs estáveis para requisitos.

---

## 4. Traceability Matrix (novo)

Criado **`docs/product/TRACEABILITY_MATRIX.md`** como fonte de verdade de status: Requisito → Documento(s) → Código/Evidência → Teste → Status.

- **FR-001..FR-019** mapeados com status real (✅ implementado / 🟡 parcial / 📋 formalizado / — fora do escopo);
- **FR-020..FR-029** todos 📋 **formalizado** (nenhum implementado como entidade);
- **NFR-001..NFR-017** mapeados;
- **Tabela de presenças/lacunas** documentais (identifica o que cada requisito tem/pela na documentação);
- **Seção "Como manter esta matriz viva"** — ancorada na Documentation Sync Rule.

---

## 5. Formalized New Requirements (FR-020..FR-029)

Formalizados em `FUNCTIONAL_REQUIREMENTS.md` (com critérios de aceite preliminares, sujeitos a Human Gate):

| ID | Requisito | Prioridade |
|---|---|---|
| FR-020 | Modelar **atividade operacional recorrente** (não apenas tarefa) | Must (MVP) |
| FR-021 | **Selecionar agente executor** da atividade (configurável/extensível) | Must (MVP) |
| FR-022 | Definir **periodicidade e competência** | Should (MVP) / Must condicional |
| FR-023 | **Organização documental** por cliente/competência/categoria | Pós-MVP |
| FR-024 | **Classificação com níveis de confiança** (ALTA/MÉDIA/BAIXA) | Pós-MVP |
| FR-025 | **Feedback usuário ↔ agente** (operacional / regra / configuração / exceção) | MVP incremental |
| FR-026 | **Dashboard operacional** orientada à ação | MVP incremental |
| FR-027 | **Timeline operacional** da atividade | MVP incremental |
| FR-028 | **Auditoria operacional** (camada de apresentação; dados já existem) | MVP incremental |
| FR-029 | **UX/UI consistente** e orientada à operação | MVP obrigatório |

**Garantia de rastreabilidade:** cada novo requisito referencia evidências de código existentes (ex.: FR-021 ↔ `actor_type='servico'` + `requireServiceId`; FR-028 ↔ `eventos_auditoria`; FR-026/027 ↔ dados da trilha), evitando "requisito no vácuo".

---

## 6. Scope Classification (MVP)

Gravação em `MVP_SCOPE.md` (classificação de produto; **não autoriza implementação**):

| Classe | Requisitos | Justificativa |
|---|---|---|
| **MVP obrigatório** | FR-020, FR-021, FR-029 | Necessários ao teste real com a Innove (base M0 UX já existe; M1 Frente A pendente) |
| **MVP incremental** | FR-022, FR-025, FR-026, FR-027, FR-028 | Entram após fluxo principal estável e critérios PILOT_READY; a maioria só adiciona camada de apresentação sobre dados que já existem |
| **Pós-MVP** | FR-023, FR-024 | Não bloqueiam o piloto; implementação de confiança avaliada conforme estágio (ADR-010 determinístico-first) |

**Regra de precedência documentada:** fluxo principal do MVP-01 segue prioridade #1; itens Pós-MVP não bloqueiam; itens incrementais após estabilização; alteração de contrato/entidade/arquitetura exige ADR.

---

## 7. Architecture / ADR Impact

**Conclusão: NENHUMA alteração arquitetural foi feita ou é necessária para esta rodada.**

| Pergunta | Resposta |
|---|---|
| A formalização FR-020..FR-029 altera arquitetura implementada? | **Não** — são requisitos de produto, sem implementação |
| ADR novo criado? | **Não** |
| ADR existente precisa atualizar? | **Não** — fundamentação vigente cobre a base |
| Fundamentação | **ADR-006** (jobs persistidos/assíncronos → execuções recorrentes), **ADR-008** (abstração de canal → canal da atividade), **ADR-010** (determinístico-first → confiança Pós-MVP) |
| Risco futuro | Quando **FR-020/FR-021** forem implementados como entidades (`atividades`, seleção de agente) → avaliar **novo ADR** no mesmo ciclo |

**Preparação estrutural (sem impacto):** FR-021 exige que o agente seja configuração extensível. A base `CommunicationChannel`/`actor_type='servico'` já não impede o conceito; apenas não deve haver hardcode `atividade→estagiária` quando da implementação.

---

## 8. Build / Test Verification

| Item | Resultado |
|---|---|
| Mudanças de código nesta sessão | **Nenhuma** (documentação pura) |
| Testes executados | Não aplicável |
| Typecheck/46 testes web/build | Pertencentes à sessão anterior (correção UI — **não commitada**, §10/§16) |

---

## 9. M0 / M1 UX Status

| Marco | Status | Observação |
|---|---|---|
| **M0 UX Foundation** | ✅ Implementado e validado (`M0_UX_FOUNDATION_IMPLEMENTATION_REPORT.md`, `M0_UX_FOUNDATION_VALIDATION_REPORT.md`) | Base para FR-029 |
| **M1 (Frente A)** | 🟡 Pendente de PR/gate | `M1_IMPLEMENTATION_PLAN.md` |
| **MVP Experience Spec v1** | 📋 Proposta "aguardando aprovação humana" (202 linhas) | Usa o nome **Estagiária Digital** |

---

## 10. Known Conflicts / Gaps / Risks

### Conflitos de documentação (sem decisão silenciosa)

| Conflito | Impacto | Recomendação |
|---|---|---|
| `README.md` status "restam P0.2/P0.3" desatualizado (P0.1/P0.2/P0.3 já resolvidos; B-2 merged; M0 UX; modelos de e-mail) | Documentação líder desatualizada | Atualizar em PR separado (Human Gate leve) — registrado como pendência |

### Gaps

| Gap | Status |
|---|---|
| Nenhuma ocorrência do termo **"Estagiária"** existia em docs/código até esta rodada (agora formalizado a partir do `MVP_EXPERIENCE_SPEC_v1` e `FIRST_DIGITAL_EMPLOYEE`) | Resolvido |
| Matriz de rastreabilidade (primeira versão) deve ser mantida viva por todos os agentes | Vigente via rule |
| **Correção UI `ObrigacoesPage.tsx`** (sessão anterior) **sem commit** | Pendente de decisão do usuário (§16) |
| **Runtime `npm run runtime` não roda** → jobs do ciclo presos em `processando` no banco dev, bloqueando o envio real de e-mails | Pendente de decisão (não foi escopo desta sessão) |

### Riscos

- **R1 — Vazamento de decisão de produto:** mitigado pela regra "documentar conflito → propor decisão → Human Gate";
- **R2 — Requisito no vácuo:** mitigado pela exigência de evidência de código/teste na matriz;
- **R3 — Adoção da regra não funcionar na prática:** mitigado por `AGENTS.md` + `AI_CONTEXT.md` + QA validando documentação nos gates.

---

## 11. Human Gates

Nenhuma decisão bloqueante foi tomada silenciosamente nesta rodada. Itens que exigem decisão humana (no formato `HUMAN_DECISION_REQUIRED`, ver `docs/factory/HUMAN_GATES.md`):

| Gate | Tema | Estado |
|---|---|---|
| **HG-APROVAÇÃO-NOMENCLATURA** | Adoção do nome **"Estagiária Digital"** (vs. "Assistente Digital de Pendências Documentais") | **AWAITING_DECISION** |
| **HG-APROVAÇÃO-ESCOPO-EVOLUÇÃO** | Classificação MVP obrigatório/incremental/Pós-MVP dos FR-020..029 | **AWAITING_DECISION** |
| **HG-M1-FRENTE-A** | Aprovação da Frente A do M1 UX (PR/gate) | Já existe; mantida pendente |
| **HG-FECHAMENTO-CORRECAO-UI** | Commitar a correção de UI de Obrigações (checklist selector) ou descartá-la | **AWAITING_DECISION** (ver §16) |
| **HG-RETENÇÃO-DADOS** | Política LGPD de retenção de documentos (Pós-MVP) | Registrada como pendência pré-existente |

---

## 12. Open Questions / Decisions Needed

1. **Nome definitivo do primeiro agente**: adotar *Estagiária Digital* como nome canônico? (usado nesta sessão como adotado)
2. **FR-022**: periodicidade/competência como Must ou Should (depende de o piloto exigir competência no primeiro teste)?
3. **Correção de UI de Obrigações**: manter e commitar, ou descartar? (sessão anterior)
4. **Runtime do ciclo**: iniciar `npm run runtime` para desbloquear os jobs presos antes do teste com a Innove?
5. **README.md**: autorizar a correção do status desatualizado em PR próprio?

---

## 13. Build / Test Notes (não aplicável)

Esta rodada não possui compilação/teste próprio (zero alterações de código). A integridade das edições foi verificada por inspeção dos arquivos e contagem de seções (`grep`/`git status`).

---

## 14. What Was NOT Done (e por quê)

| Item | Por quê |
|---|---|
| Implementar FR-020..FR-029 no código | PROMPT MESTRE: "documentação/requisitos agora; implementação não é escopo desta rodada" |
| Criar ADR novo para atividade/agente executor | Sem mudança arquitetural implementada; ADR avalia-se no ciclo de implementação (§7) |
| Adicionar N8N/Redis/broker ou alternativas de fila | Proibido pelo contexto; arquitetura atual (PostgreSQL) preservada |
| Alterar Human Gates / ADRs vigentes sem justificativa | Governança preservada |
| Commit da correção UI resultante da pergunta anterior | Aguarda decisão do usuário (§16) |
| Alterar escopo/documentação de HG-007 | Fora do escopo de documentação/requisitos desta rodada |

---

## 15. Next Steps

1. **[Rodrigo]** Decidir `Human Gates` §11 (nomenclatura, escopo evolução, correção UI, runtime);
2. **[Gate apurado]** Atualizar `README.md` (status desatualizado) em PR separado;
3. **[Quando houver implementação]** Implementar FR-020/FR-021 → avaliar novo ADR → atualizar matriz no mesmo PR;
4. **[M1]** Avançar Frente A do M1 UX conforme `M1_IMPLEMENTATION_PLAN.md`;
5. **[Fluxo principal]** Manter prioridade #1 = MVP-01 vertical slice (PILOT_READY).

---

## 16. Files Changed

### Desta rodada (documentação)

| Arquivo | Tipo |
|---|---|
| `docs/product/TRACEABILITY_MATRIX.md` | **novo** |
| `docs/reports/DOCUMENTATION_SYNC_REPORT_2026-09.md` | **novo** |
| `docs/product/FUNCTIONAL_REQUIREMENTS.md` | alterado |
| `docs/product/FIRST_DIGITAL_EMPLOYEE.md` | alterado |
| `docs/product/MVP_SCOPE.md` | alterado |
| `AGENTS.md` | alterado |
| `docs/AI_CONTEXT.md` | alterado |
| `docs/PROJECT_INDEX.md` | alterado |
| `docs/GLOSSARY.md` | alterado |

### Pendente de decisão (sessão anterior — FORA deste relatório)

| Arquivo | Estado |
|---|---|
| `apps/web/src/pages/ObrigacoesPage.tsx` | `M` (modificado), **não commitado** — correção de UI (seletor de checklist) |

---

## 17. Git / Branch / Commit

| Item | Valor |
|---|---|
| Branch atual | `feat/hg-007-google-cloud-preparation` |
| Último commit (canônico) | `c06f4f7` feat(api+web): modelos de e-mail padrão por checklist; login rate-limit friendly; env via loadEnvFile |
| Mudanças desta rodada | **Não commitadas** (aguardando aval do usuário para agrupar commit de documentação) |
| Arquivos novos/alterados não commitados | 8 docs alterados + 1 matriz nova + 1 relatório novo |
| Fora de commit | `demo/` (decisão do usuário: não versionar) |
| Vulnerabilidades GitHub (default branch) | 8 dependências (6 high, 1 moderate, 1 low) — não bloqueiam esta entrega |

---

## 18. Documentation Sync Rule — Estado de Adoção

| Local | Onde fica | Conteúdo |
|---|---|---|
| `AGENTS.md` | Regra global obrigatória (completa) | Identificar mudança → identificar documentos afetados → atualizar → verificar consistência → testes → informar + Handoff `## Documentation Impact` + regras de bloqueio |
| `docs/AI_CONTEXT.md` | Regra para todos os agentes | Fluxo Requisito→Decisão→Implementação→Teste→Documentação→QA→Human Gate + vínculo matriz |
| `docs/PROJECT_INDEX.md` | Convenção + link da regra | Ponto de entrada: matriz de rastreabilidade |

**Efeito esperado:** toda mudança futura em contratos/entidades/fluxos/UX/backlogs exige atualização no mesmo ciclo/PR; QA valida documentação; handoffs carregam a seção obrigatória.

---

## 19. Documentation Impact (Handoff)

```text
## Documentation Impact
Documents reviewed:   AGENTS.md, PROJECT_INDEX.md, AI_CONTEXT.md, GLOSSARY.md,
                      FUNCTIONAL_REQUIREMENTS.md, FUNCTIONAL_ARCHITECTURE.md,
                      MVP_SCOPE.md, MVP_01_VERTICAL_SLICE.md, INITIAL_BACKLOG.md,
                      BACKLOG_OVERVIEW.md, FIRST_DIGITAL_EMPLOYEE.md,
                      OPERATIONAL_FLOW.md, CANDIDATE_ROUTINES.md, SUCCESS_METRICS.md,
                      MVP_EXPERIENCE_SPEC_v1.md, NON_FUNCTIONAL_REQUIREMENTS.md,
                      EVENTOS_AUDITORIA.md, HUMAN_GATES.md, FACTORY_STATUS.md,
                      QUALITY_GATES.md, ADR-006, ADR-008, ADR-010, README.md,
                      (matriz estrutural global do repositório)
Documents updated:    TRACEABILITY_MATRIX.md (novo), DOCUMENTATION_SYNC_REPORT_2026-09.md (novo),
                      FUNCTIONAL_REQUIREMENTS.md, FIRST_DIGITAL_EMPLOYEE.md,
                      MVP_SCOPE.md, AGENTS.md, AI_CONTEXT.md, PROJECT_INDEX.md,
                      GLOSSARY.md
No documentation changes required: não — esta rodada é, por definição, sync documental
Architectural decision required:   NO (formalização de requisitos não altera arquitetura;
                                  FR-020/FR-021 exigirão ADR apenas quando implementados)
ADR affected:         N/A (avaliado: ADR-006/008/010 permanecem vigentes e suficientes)
```

---

## 20. Final Notes

- **Nada foi inventado:** todos os novos requisitos têm contrapartida no conceito já presentes em `MVP_EXPERIENCE_SPEC_v1.md`/`FIRST_DIGITAL_EMPLOYEE.md` ou no código existente (matriz comprova);
- **Nada foi decidido silenciosamente:** Human Gates e perguntas em aberto ficaram explícitos (§11/§12);
- **O foco continua o MVP-01:** o fluxo principal e os critérios PILOT_READY seguem como prioridade #1 (código).

---

*Fim do relatório. Documentação evoluindo junto com o código — regra canônica válida a partir de 2026-09-23.*
