# Proposta de Backlog Inicial — ServiumAI (PO)

> **PROPOSTA — nenhum Issue real foi criado.** Criação de Issues só ocorre após aprovação humana (HG-003). Elaborada pelo `servium-po` a partir de `BACKLOG_OVERVIEW.md`, `MVP_SCOPE.md`, `FUNCTIONAL_REQUIREMENTS.md` e dos ADRs em revisão (`ADR_REVIEW_REPORT.md`).
>
> Premissas para início: HG-001 (merge PR #2) + HG-002 (ADRs aceitos). Ondas marcadas com ⚠ dependem adicionalmente de critérios de entrada do MVP (`MVP_SCOPE.md`).

## Princípios da proposta

1. Ondas = sequenciamento de valor com dependências técnicas respeitadas; histórias dentro de cada onda seguem o fluxo completo da factory (DoR → análise → implementação → QA → aceite);
2. Nenhuma história depende de ADR `Proposed`; nenhuma antecipa decisão de produto não tomada (canal definitivo, provedor pago);
3. Segurança e auditoria entram cedo (estruturais), nunca "depois";
4. Paralelismo humano: EPIC-003 (validação de mercado) corre fora da factory — entrevistas são trabalho do Rodrigo; resultados podem reordenar Ondas 5–7.

## Onda 0 — Bootstrap técnico da implementação *(pós HG-001/HG-002)*

Objetivo: transformar repositório documental em monorepo executável sem violar gates.

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 0.1 | Skeleton monorepo TS (API NestJS + SPA React + pacote de tipos compartilhados) | EPIC-004 | Concretiza ADR-001/002/003 |
| 0.2 | Pipeline CI evoluído: lint + build + testes (unit/integração) obrigatórios no Gate 4 | EPIC-004 | Substitui progressivamente docs-ci sem duplicar workflow |
| 0.3 | Ambiente local padronizado (Postgres via container; adaptadores fake por padrão) | EPIC-004 | Zero serviço pago nesta onda |

## Onda 1 — Fundações de dados e confiança

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 1.1 | Modelo de dados inicial + migrations versionadas | EPIC-006 | ADR-004 |
| 1.2 | Isolamento multi-tenant: `tenant_id` + RLS deny-by-default + suíte de testes de vazamento | EPIC-004/006 | **Condição do ACCEPT do ADR-005** |
| 1.3 | Framework de jobs persistidos (SKIP LOCKED, retry/backoff, idempotency keys) + transactional outbox | EPIC-006 | ADR-006 |
| 1.4 | Trilha de auditoria append-only (eventos de negócio e de agente) | EPIC-009 | ADRV-002 |

## Onda 2 — Identidade e acesso

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 2.1 | Autenticação first-party (argon2, sessões httpOnly server-side) + rate limiting | EPIC-005 | **OWASP ASVS checklist obrigatório (condição ADR-009)** |
| 2.2 | RBAC mínimo (usuário ↔ papel ↔ tenant) + autorização contextual | EPIC-005 | Base p/ ações sensíveis auditadas |
| 2.3 | Identidade de serviço para Funcionários Digitais (atores não-humanos na trilha) | EPIC-005 | Prepara service identities |

## Onda 3 — Core de execução

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 3.1 | Cadastro de clientes e checklists de documentos por cliente/obrigação | EPIC-006 | FR base |
| 3.2 | Motor de ciclos: identificação de pendentes, estados, janelas e limites configuráveis | EPIC-006 | Determinístico-first (ADR-010) |
| 3.3 | Agendador + retries idempotentes de cobrança dentro dos limites | EPIC-006 | Consome 1.3 |
| 3.4 | Relatório de fechamento de ciclo | EPIC-006 | M-01..M-04 |

## Onda 4 — Supervisão humana

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 4.1 | Painel de status consolidado (pendências por cliente/ciclo) | EPIC-008 | SPA |
| 4.2 | Fila de exceções + escalonamento humano explícito | EPIC-008 | NFR core |
| 4.3 | Configuração de limites de autonomia (frequência, horários, tentativas) com auditoria | EPIC-008 | Restrição do MVP_SCOPE |

## Onda 5 — Comunicação ⚠

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 5.1 | Porta `CommunicationChannel` + adaptador fake (testes) | EPIC-010 | ADR-008 |
| 5.2 | `EmailAdapter` concreto + templates aprovados + ledger de envios | EPIC-010 | ⚠ HYP-005 confirmada; provedor = Level 3 (HG-004) |
| 5.3 | Recebimento de respostas/anexos + registro vinculado ao item | EPIC-010 | Idempotência de recebimento |

## Onda 6 — Funcionário Digital v1 ⚠

| # | História proposta | Épico | Notas |
|---|---|---|---|
| 6.1 | Storage documental (S3-compatível) + metadados/hash/retenção + URLs assinadas curtas | EPIC-007 | ADR-007; provedor/custo = Level 3 |
| 6.2 | Validação básica de recebimento (corresponde? legível?) + escalonamento em dúvida | EPIC-007 | Regras primeiro |
| 6.3 | Classificação assistiva de respostas ambíguas via porta LLM (saída sugerida, veredito humano) | EPIC-007 | ADR-010; opcional se validação indicar |
| 6.4 | Instrumentação das métricas M-01..M-12 + amostragem humana (M-05) | EPIC-009 | SUCCESS_METRICS |

## Onda 7 — Piloto ⚠ *(gated)*

| # | Item | Épico | Critério de entrada |
|---|---|---|---|
| 7.1 | Onboarding do escritório piloto + baseline medido | EPIC-011 | HYP-001..004 não refutadas; escritório comprometido (`MVP_SCOPE.md`) |
| 7.2 | Operação assistida 2–3 ciclos + coleta de métricas + decisão continuar/ajustar/pivotar | EPIC-011/012 | 7.1 concluído |

## Riscos da proposta

- **Canal (Onda 5)**: se validação refutar e-mail, 5.2 muda de adaptador — porta protege o resto (ADR-008);
- **Custo recorrente**: primeiro gasto só aparece em 5.2/6.1 — sempre precedido de HG-004;
- **Escopo**: qualquer expansão detectada vira Issue nova avaliada pelo PO — nunca silenciosa.

## O que esta proposta deliberadamente NÃO faz

Não cria Issues agora; não define datas; não promete segundo Funcionário Digital, WhatsApp, integração com ERPs ou qualquer item do Out of Scope (`MVP_SCOPE.md`).
