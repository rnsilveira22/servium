# AGENTS.md — Servium IA

## Regra global de saída

> **Respostas em Markdown**: todas as respostas do assistente devem ser geradas em **Markdown estruturado** (títulos `#`/`##`, tabelas, listas, blocos de código), pronto para compartilhamento direto (ex.: copiar/colar no ChatGPT) sem perda de estrutura. Evitar texto corrido sem formatação em respostas que envolvam planos, estados, comparações ou resumos.

## Documentation Sync Rule (obrigatória para todos os agentes)

> **Código e documentação evoluem juntos.** Não é aceitável "documentar depois".

Todo agente que implementar uma mudança que altere **comportamento, regra de negócio, fluxo, entidade, banco de dados, API, contrato, estado, permissão, agente, atividade/tarefa, UX/UI, dashboard, auditoria, integração ou arquitetura** deve, **no mesmo ciclo de desenvolvimento** (preferencialmente no mesmo PR):

1. **Identificar a mudança** — o que mudou no código/contrato;
2. **Identificar documentos afetados** — usar como ponto de entrada a [`docs/product/TRACEABILITY_MATRIX.md`](docs/product/TRACEABILITY_MATRIX.md) e o [`docs/PROJECT_INDEX.md`](docs/PROJECT_INDEX.md);
3. **Atualizar a documentação correspondente** (requisitos, ADRs, arquitetura, banco, UX, glossário, auditoria, relatórios) — sem criar duplicatas;
4. **Verificar consistência** — a matriz de rastreabilidade reflete o estado real;
5. **Executar os testes** — nunca considerar pronto por "código compila";
6. **Informar documentação atualizada** — registrar no handoff/PR.

O **handoff** deve conter:

```text
## Documentation Impact
Documents reviewed:   <lista>
Documents updated:    <lista>
No documentation changes required: <sim/não + por quê>
Architectural decision required:   YES/NO
ADR affected:         <ADR-XXX ou N/A>
```

Regras de bloqueio:

- **QA também valida documentação** (qual segura o avanço se somente o código estiver correto e a documentação desatualizada). A implementação pode ser considerada **incompleta** quando `código = correto` mas `documentação = desatualizada`;
- **Não inventar requisitos** — conflitos entre doc existente e novo requisito: **documentar o conflito → identificar impacto → propor decisão → Human Gate quando necessário**. Nunca resolver silenciosamente decisão de produto;
- Mudança arquitetural relevante (ex.: agente executor, atividade recorrente, organização documental) → **ADR ou atualização de ADR** no mesmo ciclo.
