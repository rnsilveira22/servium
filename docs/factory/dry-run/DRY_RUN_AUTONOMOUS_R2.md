# Dry Run Autônomo R2 — Loop `START_FACTORY`

> Simulação sem side effects do protocolo de operação autônoma (`FACTORY_RUNBOOK.md` + `AGENT_ORCHESTRATION.md`), usando a história fictícia SRV-D002 (`#SIM-42`). Diferença vs R1 (`DRY_RUN_REPORT.md`): aqui valida-se o **loop completo de sessão autônoma**, incluindo níveis de autonomia, decisão humana simulada e reprovação de QA com correção.

## Iteração 0 — Verificação de estado

```text
[FACTORY] sessão iniciada | branch: chore/software-factory-v1 | data: 2026-08-22
git: clean ✓ | gh auth: OK ✓ | PRs abertos: #2 (factory) CI verde ✓
Project: 1 item elegível (SIM #42 em READY) | needs:decision: HG-002 respondido (simulado: ACCEPT)
[FACTORY] papel ativo inicial: senior → consumir fila READY
```

Decisão humana processada primeiro (ordem §2.1): HG-002 ratificado → ADRs `Accepted` (simulado) → desbloqueia Gate 2.

## Iteração 1 — Análise técnica (senior)

- Consumo: `#SIM-42` (fila Senior, prioridade p1);
- Produção: Technical Analysis (`SRV-D002-technical-analysis.md`);
- Gate 2: ✅ → transição `READY → TECH_ANALYSIS → READY_FOR_DEVELOPMENT`;
- Autonomia usada: L1 (leitura, comentários, campos do Project).

## Iteração 2 — Implementação (pleno)

- Handoff aceito; branch `feat/42-health-endpoint` (L1); commits (L1); PR `#SIM-2` criado (L2);
- Evidências locais registradas; Gate 3 ✅ → `READY_FOR_QA`;
- WIP pleno após pegar item: 1/2 ✓.

## Iteração 3 — QA rodada 1 (reviewer-qa)

- Veredito: `CHANGES_REQUESTED` (2 achados — `SRV-D002-qa-review-r1.md`);
- Transição: `READY_FOR_QA → CHANGES_REQUESTED`; contador de loop 1/3;
- Autonomia: L1 (nenhum código editado pelo QA).

## Iteração 4 — Correção (pleno)

- Resposta achado-a-achado no PR; 2 commits de correção; re-evidenciação completa;
- Gate 3 re-verificado ✅ → `READY_FOR_QA` (rodada 2).

## Iteração 5 — QA rodada 2 (reviewer-qa)

- Veredito: `APPROVED` → `QA_APPROVED`;
- Handoff QA→PO registrado.

## Iteração 6 — Aceite (po)

- PO valida critérios contra evidências → `ACCEPTED` registrado (template PO Acceptance);
- **`DONE = QA_APPROVED AND PO_ACCEPTED`** ✔ → Issue fechada (L2) APÓS o aceite;
- Project: `Status = Done`, campos `QA Status`, `PO Acceptance` coerentes.

## Iteração 7 — Seleção seguinte e condição de parada

```text
Fila: vazia (nenhum Issue real; próximas ondas dependem de HG-001/HG-003 reais)
WIP: todos liberados | Nenhum item elegível
→ CONDIÇÃO DE PARADA §9.2 acionada
[FACTORY] sessão encerrada | itens: SIM-42 DONE | transições: 8 | bloqueios: 0
          decisões humanas pendentes: HG-001, HG-003 (reais)
```

## Cenário complementar — `ESCALATED_TECHNICAL_FAILURE` (verificado por inspeção)

Trilha hipotética validada contra `AGENT_ORCHESTRATION.md` §7: se a rodada 2 tivesse reprovado os mesmos achados pela terceira vez consecutiva → item → `BLOCKED` + label `status:blocked`, análise de causa raiz obrigatória, e como a causa seria capacidade técnica → replanejamento na fila Senior com escopo recontratado (sem `HUMAN_DECISION_REQUIRED`, pois não é questão de requisito/arquitetura).

## Resultados validados pelo dry run

| Aspecto | Status |
|---|---|
| Ordem/verificação de estado do runbook | VALIDATED |
| Seleção por fila/prioridade/WIP | VALIDATED |
| Handoffs conforme contratos | VALIDATED |
| Reprovação QA → correção → aprovação | VALIDATED |
| Regra `DONE` (fechamento só pós-aceite) | VALIDATED |
| Níveis de autonomia respeitados (merge nunca executado) | VALIDATED |
| Condições de parada e relatório de encerramento | VALIDATED |

## Limitações

Simulação sem GitHub real para SRV-D002 (Issue/PR fictícios); execução real do loop ocorre após HG-001/HG-003 com Issues verdadeiras.
