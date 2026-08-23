# HANDOFF — ServiumAI · Fase 002 concluída (Discovery e Especificação do MVP)

> Relatório gerado por **ox-alpha** (modelo `opencode/big-pickle`, via opencode CLI).
> Branch: `phase/002-mvp-discovery` · Base: `3398304` (Fase 001) · Push: não realizado.
> Arquivo local — não versionado no repositório.

## Contexto do projeto

**ServiumAI** é uma plataforma B2B de funcionários digitais especializados para
empresas, com vertical inicial em escritórios de contabilidade brasileiros.
Fase 001 (fundação) já concluída e publicada em `main`.

## O que foi feito na Fase 002

Especificação completa da hipótese de MVP — sem código, sem stack, sem ADRs aceitos:

### Hipótese central do MVP

**Assistente Digital de Pendências Documentais**: um Funcionário Digital que,
para escritórios contábeis, mantém checklists por cliente/obrigação, identifica
documentos pendentes a cada ciclo, envia cobranças dentro de limites
configurados (hipótese padrão: e-mail), recebe/valida documentos, organiza o
recebido e escala exceções a humanos. Valor esperado: menos horas humanas em
cobrança/conferência + mais documentos recebidos antes do prazo.

### Seleção do caso de uso

Catálogo de 10 rotinas candidatas avaliadas por 11 critérios (frequência,
padronização, risco, julgamento, dependência externa etc.). Ranking preliminar
(hipótese): 1º Pendências documentais (RC-01) · 2º Triagem de solicitações ·
3º Organização documental · depois prazos, agendamento, atendimento, portais,
guias fiscais, folha e conciliação.

### Arquivos criados (13)

- `CONTRIBUTING.md` — política leve: branches (`phase/...`, `feat/...`,
  `fix/...`, `docs/...`) + Conventional Commits com descrição em pt-BR.
- `docs/product/MVP_DISCOVERY.md` — documento central: problema amplo vs.
  problema do MVP, cliente-alvo, usuários, situação atual, dores, causas,
  consequências, alternativas existentes, hipótese de solução, perguntas
  abertas e critérios para avançar.
- `docs/product/MVP_SCOPE.md` — escopo rígido IN/OUT, critérios de entrada e
  conclusão, restrições, premissas e questões pendentes.
- `docs/product/PERSONAS.md` — sócio/gestor, responsável pela rotina e cliente
  final do escritório (sem nomes/histórias inventadas).
- `docs/product/CANDIDATE_ROUTINES.md` — catálogo RC-01..RC-10 + ranking.
- `docs/product/FIRST_DIGITAL_EMPLOYEE.md` — missão, responsabilidades,
  atividades permitidas/proibidas, entradas/saídas, ferramentas por
  capacidade (sem tecnologia), permissões, limites de autonomia (máx. 3
  tentativas, janela comercial), pontos de aprovação humana, exceções,
  escalonamentos e auditoria necessária.
- `docs/product/OPERATIONAL_FLOW.md` — fluxo com Mermaid; estados de item
  (Pendente → Cobrado → Aguardando → EmValidacao → Resolvido/Escalado/
  Cancelado); falhas, retries idempotentes, cancelamento só humano, evidências.
- `docs/product/FUNCTIONAL_REQUIREMENTS.md` — FR-001..FR-019 (MoSCoW;
  FR-017..019 = Won't no MVP: WhatsApp, integração ERP, multi-tenant).
- `docs/product/NON_FUNCTIONAL_REQUIREMENTS.md` — NFR-001..NFR-017 (isolamento,
  LGPD, auditoria imutável, idempotência; valores TBD onde cabível).
- `docs/product/SUCCESS_METRICS.md` — M-01..M-12; métrica norte = tempo humano
  economizado; baselines "a medir", metas só após baseline.
- `docs/product/RISKS_AND_HYPOTHESES.md` — HYP-001..007 e RSK-001..012 com
  probabilidade, impacto e mitigação.
- `docs/product/VALIDATION_PLAN.md` — 3–5 escritórios, roteiro de entrevista
  com 17 perguntas abertas, evidências desejadas, critérios de validar/rejeitar.
- `docs/product/BACKLOG_OVERVIEW.md` — EPIC-001..EPIC-012 (macro, sem tarefas).

### Arquivos atualizados (6)

`README.md` (status → "Discovery do MVP"), `docs/PROJECT_INDEX.md`,
`docs/AI_CONTEXT.md` (+ regra: implementações futuras seguem a spec validada),
`docs/roadmap/README.md` (Fase 0 concluída, Fase 1 atual), `CHANGELOG.md`,
`docs/product/README.md`.

## Decisões tomadas

1. Problema do MVP = cobrança/conferência de pendências documentais (RC-01);
2. Canal inicial hipotético = e-mail (WhatsApp decidido via ADR na Fase 003);
3. Autonomia conservadora: ciclo ativado por humano, templates aprovados,
   máx. 3 tentativas antes de escalar;
4. Proibido inventar metas numéricas sem baseline;
5. Nenhum ADR técnico criado nesta fase.

## Decisões NÃO tomadas

Stack, linguagens, banco, filas, cloud, provedores de IA, canal definitivo,
mecanismo de recebimento de documentos, arquitetura — tudo para a Fase 003
via ADRs (`Proposed` → `Accepted`).

## Validações executadas

Links relativos OK (4 corrigidos em BACKLOG_OVERVIEW) · IDs consistentes
(FR/NFR/HYP/RSK todos definidos) · sem secrets · working tree limpa.

## Estado do Git

Branch `phase/002-mvp-discovery`, 5 commits locais:
cd62cc5 (contribuição) · ffe540a (discovery/escopo) · dc1aafa (funcionário
digital/fluxo) · d0a1891 (requisitos/métricas/riscos) · c555baf (atualizações).
Push NÃO realizado; merge para main NÃO feito.

## Pendências humanas

1. Revisar especificação; autorizar push/merge;
2. Executar entrevistas (3–5 escritórios) conforme VALIDATION_PLAN.md;
3. Identificar escritório piloto;
4. Confirmar canais reais dos clientes finais (e-mail vs. WhatsApp).

## Próxima fase recomendada (NÃO executar ainda)

**Fase 003 — Arquitetura do MVP e seleção de stack**, na ordem refinada pela
revisão 002.1: (A) arquitetura funcional → (B) fluxos e boundaries →
(C) drivers arquiteturais a partir dos FRs/NFRs → (D) ADRs de stack,
persistência, comunicação etc. → (E) integrações específicas (canal,
recebimento de documentos) por último. A stack serve ao produto.
*Nota: este relatório é um retrato da Fase 002; a revisão 002.1 refinou
tenant, canal e política de tentativas — ver commits posteriores.*

## Regras para o próximo agente

Ler `README.md` → `docs/PROJECT_INDEX.md` → `docs/AI_CONTEXT.md` → verificar
ADRs e Git. Seguir escopo de `MVP_SCOPE.md`; não implementar itens Out of
Scope ou Won't sem decisão documentada. Sem stack, sem código, sem credenciais.
