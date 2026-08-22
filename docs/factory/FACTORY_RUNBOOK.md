# Factory Runbook — ServiumAI

> Manual operacional de uma sessão autônoma da factory. O comando `START_FACTORY` (`.opencode/command/start-factory.md`) referencia este runbook. Fontes normativas: `AGENT_GOVERNANCE.md`, `AUTONOMY_POLICY.md`, `AGENT_ORCHESTRATION.md`.

## 0. Identidade da sessão

Uma sessão OpenCode **atua como um agente por vez por item**. Antes de agir, declarar no primeiro output:

```text
[FACTORY] sessão iniciada | branch: <branch> | data: <data>
[FACTORY] papel ativo inicial: <po|senior|pleno|qa> (muda só em gate/handoff)
```

## 1. Verificação de estado (sempre, nesta ordem)

1. **Repo**: `git status` limpo; branch atual; `git fetch origin` sem surpresa;
2. **GitHub**: `gh auth status` OK; PRs abertos e seus estados;
3. **Project**: itens por Status (Board); campos coerentes com labels;
4. **Bloqueios humanos**: Issues/comentários com `needs:decision` — há decisão nova a processar?
5. **CI**: workflows verdes nos PRs abertos.

Qualquer inconsistência (ex.: campo do Project ≠ labels) é corrigida com registro antes de novo trabalho.

## 2. Seleção de trabalho

Seguir ordem e filas de `AGENT_ORCHESTRATION.md` (§2 e §5), respeitando WIP (§6). Se nenhum item for elegível → atualizar `FACTORY_STATUS.md` e encerrar.

## 3. Execução por papel

### servium-po

- Completa DoR de itens em `BACKLOG` (Gate 1);
- Cria Issues somente de épico aprovado (Level 2/3 — ver `AUTONOMY_POLICY.md`);
- Processa aceites (`PO_ACCEPTANCE`) de itens em `QA_APPROVED`;
- Nunca aprova o que não tem evidência.

### servium-senior

- Consome fila `READY`: produz Technical Analysis (template oficial) e valida contra ADRs vigentes;
- `Proposed` ≠ autorização — se a história depende de ADR não aceito → `AWAITING_DECISION` + HG;
- Decomposição + estratégia de testes → Gate 2 → handoff.

### servium-pleno

- Implementa exatamente o escopo contratado; expansão vira Issue nova;
- Branch `<prefixo>/<issue>-descricao`; Conventional Commits pt-BR;
- Evidências reais (testes executados, build, lint) → Gate 3 → PR → handoff QA;
- Ao receber `CHANGES_REQUESTED`: responde achado-a-achado, corrige tudo, devolve.

### servium-reviewer-qa

- Veredito único formal via template QA; bloqueadores automáticos de `QUALITY_GATES.md` §Gate 4;
- Nunca edita código; nunca aprova com CI vermelho ou critério descumprido;
- 3ª reprovação consecutiva → `ESCALATED_TECHNICAL_FAILURE` (orquestração §7).

## 4. Regras de escrita (todos os papéis)

- Toda transição: label(s) + campo Status do Project consistentes;
- Evidência antes de afirmação: `VALIDATED` só com execução real registrada;
- Segredos nunca em texto, log, Issue, PR ou commit;
- Nada de comentário "enfeitando" histórico — commits só quando carregam mudança real.

## 5. Encerramento de sessão

1. Atualizar `docs/factory/FACTORY_STATUS.md` (itens movidos, bloqueios, decisões pendentes);
2. Commitar mudanças documentais na branch de trabalho vigente (nunca direto na `main`);
3. Push (sem force);
4. Relatório final no chat com: itens tocados, transições, bloqueios criados/resolvidos, decisões humanas pendentes.

## 6. Recuperação de falhas

| Falha | Ação |
|---|---|
| CI vermelho em PR próprio | Investigar log; máx. 3 retries legítimos; senão tratar como falha real |
| `gh` indisponível | Registrar `BLOCKED` infra; seguir trabalho local; re-tentar na próxima sessão |
| Estado do Project divergente | Corrigir para a fonte da verdade (Issue + evidências) e registrar correção |
| Conflito de merge | Responsável rebasa; se tocar código já revisado → volta a `READY_FOR_QA` |
| Suspeita de dado real exposto | Parar tudo; remover do índice/git conforme política de segurança; reportar humano imediatamente |
