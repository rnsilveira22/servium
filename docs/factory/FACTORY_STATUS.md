# Factory Status — ServiumAI

> Snapshot vivo do estado da factory. Atualizado ao fim de cada sessão (`FACTORY_RUNBOOK.md` §5). Histórico completo vive no git/Issues — este arquivo é o ponto de partida da próxima sessão.

## Última atualização

2026-08-22 · Pós-decisões humanas HG-001/HG-002 (registro formal em [`HUMAN_DECISIONS_LOG.md`](HUMAN_DECISIONS_LOG.md))

## Estado geral

| Dimensão | Estado |
|---|---|
| Branch de trabalho | `main` (factory mergeada) |
| Software Factory | **OPERACIONAL** — agentes, governança, gates e protocolo autônomo vigentes |
| GitHub Integration | READY (Project #2, labels, templates; rulesets `BLOCKED_BY_GITHUB_PLAN`) |
| ADRs 001..011 | **`Accepted`** (HG-002 · 2026-08-22), com condições obrigatórias |
| Protocolo de autonomia | ATIVO (`START_FACTORY` + runbook + orquestração) |
| Backlog oficial | NÃO CRIADO — proposta aguarda HG-003 |

## Decisões humanas

| ID | Assunto | Estado |
|---|---|---|
| HG-001 | Merge PR #2 | ✅ RESOLVIDO — APROVADO (Opção A); merge executado com CI verde |
| HG-002 | Pacote ADR-001..011 | ✅ RESOLVIDO — APROVADO (Opção A); condições preservadas |
| **HG-003** | Proposta inicial de backlog | ⏳ **PENDING** |
| HG-004 | Provedores pagos (event-driven) | aguardando momento (Ondas 5–6) |

Condições vinculantes ativas dos aceites:

- ADR-005 → testes de isolamento multi-tenant obrigatórios na primeira história de persistência;
- ADR-009 → OWASP ASVS + testes de segurança obrigatórios na primeira história de auth;
- ADR-011 → nenhum serviço pago contratado sem HG-004.

## Bloqueios ativos

- Criação de Issues reais e desenvolvimento de produto: bloqueados até **HG-003**;
- Rulesets/branch protection: seguem indisponíveis (`BLOCKED_BY_GITHUB_PLAN`) — merge de PRs permanece Level 3 (humano).

## Fila efetiva

Vazia por design: nenhuma Issue real existe; primeiro trabalho pós-HG-003 será a criação das Issues da Onda 0 pelo PO (Level 2).

## Próximos passos (ordem)

1. Rodrigo decide HG-003 (`docs/product/PROPOSED_INITIAL_BACKLOG.md`);
2. Pós-aprovação: PO cria as Issues reais da Onda 0 (com DoR completa);
3. Loop `/start-factory` assume o fluxo contínuo (análise → implementação → QA → aceite);
4. Condições dos aceites entram nas histórias correspondentes como critérios verificáveis.
