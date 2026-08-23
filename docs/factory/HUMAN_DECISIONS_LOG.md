# Human Decisions Log — ServiumAI

> Registro formal e imutável das decisões humanas (human gates). Cada entrada preserva a autorização, a evidência da execução e as condições vinculadas. Formato das solicitações: `HUMAN_GATES.md`. Fonte viva de pendências: `FACTORY_STATUS.md`.

---

## HG-001 — Merge da PR #2 (Software Factory V1)

```text
[AUTONOMY] L3 | decisão requerida: merge da PR #2 | solicitada em: PHASE2_REPORT.md / HUMAN_GATES.md §HG-001
```

- **Decisão**: **APROVADO — Opção A** ("Autorizo o merge da PR #2 (Software Factory V1) na main.")
- **Decisor**: Rodrigo (owner) · **Data**: 2026-08-22
- **Autorização registrada**:

> HG-001: APROVADO — Opção A. Autorizo o merge da PR #2 (Software Factory V1) na main.

- **Execução**: revalidação pré-merge (`state=OPEN`, `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, ambos os checks do docs-ci verdes); merge via GitHub (`gh pr merge --merge`), sem force merge; `main` local atualizada após o merge.
- **Evidência**: PR [#2](https://github.com/rnsilveira22/servium/pull/2) · commit de conteúdo `af1ab64` · SHA do merge registrado no repositório.
- **Resultado**: factory passa a operar sobre `main`.

## HG-002 — Pacote de ADRs estruturais (001..011)

```text
[AUTONOMY] L3 | decisão requerida: aceitar/rejeitar ADR-001..011 | solicitada em: ADR_REVIEW_REPORT.md / HUMAN_GATES.md §HG-002
```

- **Decisão**: **APROVADO — Opção A** ("Autorizo a aceitação do pacote ADR-001 até ADR-011, conforme as recomendações do ADR_REVIEW_REPORT.md.")
- **Decisor**: Rodrigo (owner) · **Data**: 2026-08-22
- **Autorização registrada**:

> HG-002: APROVADO — Opção A. Autorizo a aceitação do pacote ADR-001 até ADR-011, conforme as recomendações do ADR_REVIEW_REPORT.md.

- **Condições vinculantes confirmadas pelo decisor**:
  1. **ADR-005** — suíte de testes de isolamento multi-tenant obrigatória;
  2. **ADR-009** — checklist OWASP ASVS e testes de segurança obrigatórios;
  3. **ADR-011** — escolha concreta de provedor e qualquer custo recorrente permanecem sujeitos ao human gate correspondente (**HG-004**) e **não estão autorizados** por esta aprovação.
- **Execução**: status dos 11 arquivos alterado de `Proposed` para `Accepted (HG-002 · 2026-08-22)` — exatamente 1 linha por arquivo (`git diff`: 11 inserções, 11 remoções), sem alteração material do conteúdo técnico; índices atualizados (`decisions/README.md`, `PROJECT_INDEX.md`, `AI_CONTEXT.md`, `architecture/README.md`, `roadmap/README.md`, nota em `STACK_EVALUATION.md`, resolução no `ADR_REVIEW_REPORT.md`).
- **Evidência**: commit desta fase na branch integrada à PR #2 → `main`.
- **Resultado**: Gate 2 desbloqueado para histórias que dependem destas decisões.

---

## HG-003 — Proposta inicial de backlog

```text
[AUTONOMY] L3 | decisão requerida: aprovar/ajustar proposta de backlog | solicitada em: PROPOSED_INITIAL_BACKLOG.md / HUMAN_GATES.md §HG-003
```

- **Decisão**: **APROVADO COM AJUSTES — Opção B**
- **Decisor**: Rodrigo (owner) · **Data**: 2026-08-22
- **Autorização registrada**:

> HG-003: APROVADO — Opção B (aprovação com ajustes). A proposta inicial de backlog do ServiumAI está aprovada como direção de produto, com as seguintes determinações: […] Ondas 0–7 aprovadas como roadmap inicial, não como autorização irrestrita; PO autorizado a materializar somente as histórias das Ondas 0 e 1; Ondas 2–7 permanecem backlog planejado.

- **Determinações vinculantes** (íntegra na Issue/comunicação da decisão):
  1. Ondas 0–7 = roadmap inicial, **não** autorização irrestrita;
  2. Materialização imediata restrita às Ondas **0 e 1**;
  3. Ondas 2–7: refinamento/materialização progressiva;
  4. **História 1.3**: transactional outbox só com necessidade concreta demonstrada pela análise técnica; jobs/SKIP LOCKED/retry/backoff/idempotency keys permanecem requisitos; conflito material com ADR-006 → `needs:adr` + `HUMAN_DECISION_REQUIRED`, nunca contradição silenciosa;
  5. **PO + Senior avaliam** antecipação de vertical slice mínimo da C3.1 para validação realista de tenant_id/RLS/isolamento (sem antecipar toda a Onda 3);
  6. História 1.4 permanece na Onda 1;
  7. Ondas 5–7 condicionadas aos gates de `MVP_SCOPE.md`/`HUMAN_GATES.md`;
  8. Aprovação NÃO autoriza: contratação de serviços, escolha de provedor pago, deploy em produção, mudança arquitetural, mudança de visibilidade PRIVATE, expansão de escopo, bypass de Human Gates;
  9. Onda 5: canal concreto condicionado à validação (e-mail não é definitivo sem evidência);
  10. História 6.3: LLM opcional, fora do caminho crítico, deterministic-first (ADR-010).
- **Execução**: proposta transformada em backlog canônico (`docs/product/INITIAL_BACKLOG.md`) com ajustes incorporados; Issues reais criadas apenas para as Ondas 0–1 (**#3–#10**, 8 itens) no Project `ServiumAI Development`, com campos Epic/Priority/Item Type/Responsible Role/Status, labels, dependências, critérios de aceite, DoR e DoD; campo `Epic` adicionado ao Project.
- **Resultado**: fila da factory populada; implementação só inicia após validação das Issues contra a governança e o DoR.

---

## HG-004 — Autorização de merge (PRs #11 e #12)

```text
[AUTONOMY] L3 | decisão requerida: merge das PRs documental e de implementação | solicitada em: relatório da sessão /start-factory
```

- **Decisão**: **AUTORIZADO** — `PR #11 MERGE: AUTHORIZED` · `PR #12 MERGE: AUTHORIZED`, nesta ordem.
- **Decisor**: Rodrigo (owner) · **Data**: 2026-08-22
- **Gates pré-merge exigidos**: state=OPEN, MERGEABLE, CLEAN, checks verdes, diff sem alterações inesperadas, base=main, sem force push/bypass/rebase destrutivo; falha em qualquer gate ⇒ não mesclar e registrar bloqueio.
- **Execução e evidências**:

| Gate | PR #11 | PR #12 |
|---|---|---|
| state/base | OPEN / main ✔ | OPEN / main ✔ |
| mergeable/status | MERGEABLE/CLEAN ✔ | MERGEABLE/CLEAN ✔ (aguardou recomputação pós-#11) |
| checks | 2/2 pass ✔ | 2/2 pass ✔ |
| diff revisado | 6 arquivos esperados ✔ | 26 arquivos do skeleton ✔ |
| merge commit | `2ed0965` | `26b0db5` |

- **Pós-merge verificado**: main local atualizada; `INITIAL_BACKLOG.md`, `HUMAN_DECISIONS_LOG.md` e HG-003 RESOLVED confirmados; skeleton presente na main com revalidação real (`npm ci`, lint, build, testes 3/3).
## HG-005 — Reprioridade de produto para MVP-01

```text
[AUTONOMY] L3 | decisão de produto | comunicada em: "SERVIUMAI — REPRIORIDADE DE PRODUTO PARA MVP-01" (2026-08-22)
```

- **Decisão**: `PRODUCT PRIORITY: MVP-01 TIME-TO-PILOT`
- **Decisor**: Rodrigo (owner) · **Data**: 2026-08-22
- **Meta canônica registrada**: `MVP-01 — Primeiro Funcionário Digital em operação assistida no cliente piloto` (fluxo end-to-end demonstrável com supervisão humana, rastreabilidade e segurança suficientes).
- **Determinações principais** (íntegra na comunicação da decisão):
  1. Otimizar por time-to-pilot sem violar segurança, multi-tenancy, auditoria, CAs, QA independente, ADRs Accepted e Human Gates;
  2. REPLANEJAR, não recomeçar — backlog/arquitetura/ADRs/histórico preservados;
  3. #4 e #5 seguem fundação imediata mínima; #6 modela só o necessário ao slice; #7 obrigatório (condição ADR-005 vinculante); #8 essencial-subconjunto (outbox segue condicional); #9 obrigatório pré-piloto;
  4. #10 muda de foco: definir o vertical slice técnico mínimo do MVP-01 (não só multi-tenancy);
  5. Antecipação controlada de capacidades das Ondas 3–7 somente quando necessárias ao MVP-01 (PO + Senior);
  6. Não antecipar: 2º Funcionário Digital, framework genérico de agentes, múltiplos canais, WhatsApp não validado, ERPs, LLM no caminho crítico, infra distribuída, microsserviços, K8s, dashboards sofisticados;
  7. LLM: DETERMINISTIC-FIRST (ADR-010) — só se regras não bastarem;
  8. Canal: não assumir definitivo; mínimo proposto pelo PO; se envolver serviço pago/provedor/custo → acionar HG-006; nada contratado automaticamente;
  9. Piloto passa a ser o alvo organizador (slices), não a última onda; plano rastreável até PILOT_READY;
  10. Novas Issues apenas as indispensáveis (progressive materialization); WIP mantido; qualidade inegociável; PILOT_READY ≠ deploy automático.
- **Renumbering do catálogo**: para evitar colisão com esta numeração cronológica do log, os eventos reservados do catálogo passam a **HG-006** (PaaS/storage pagos) e **HG-007** (credenciais/permissões ausentes). Nenhum desses eventos foi acionado ainda.
- **Execução**: replanejamento documentado em `docs/product/MVP_01_VERTICAL_SLICE.md`, `docs/product/MVP_01_REPLAN_REPORT.md` e atualizações do backlog/Project.

---

## Pendências

| ID | Assunto | Estado |
|---|---|---|
| HG-006 | PaaS/storage pagos (event-driven) | aguardando momento (canal/comunicação ou piloto) |
| HG-007 | Credenciais/permissões ausentes (event-driven) | aguardando momento |
