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

## Pendências

| ID | Assunto | Estado |
|---|---|---|
| HG-003 | Aprovação/ajuste da proposta inicial de backlog (`docs/product/PROPOSED_INITIAL_BACKLOG.md`) | **PENDING** |
| HG-004 | PaaS/storage pagos (event-driven) | aguardando momento |
| HG-005 | Credenciais/permissões ausentes (event-driven) | aguardando momento |
