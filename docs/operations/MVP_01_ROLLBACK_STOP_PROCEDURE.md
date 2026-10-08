# MVP-01 — Rollback / Stop Procedure (B-4 · criterio 8 do PILOT_READY)

> **Tipo:** documentação operacional · **Entrega:** Phase 4 do completion master prompt.
> Aplica-se ao ambiente local/CI/piloto executado com o runtime de jobs da API (`apps/api`).
> **Base factual:** código atual (`apps/api/src/runtime/*`, `packages/db/src/queue.ts`) — nenhum controle novo foi inventado aqui; onde não há facilidade pronta, o procedimento aponta o caminho manual.

---

## 1. Arquitetura de execução em uma linha

PostgreSQL (fonte de verdade dos jobs) + processo API + **2 schedulers** (`scheduler.ts` ciclo.tick e `receive-scheduler.ts` recebimento Mailpit/Gmail) que enfileiram e reprocessam jobs com `reapStuck` (devolve à fila jobs presos em `processando` desde `reapOlderThanMinutes`).

---

## 2. Como parar o processamento (stop)

### 2.1 Parada limpa imediata

```bash
# encerramento gracioso do worker/schedulers (SIGTERM — enableShutdownHooks)
pkill -TERM -f 'dist/runtime/main.js'   # ou 'node dist/runtime/main.js'
```

O processo respeita `enableShutdownHooks`; o banco continua íntegro (transações atômicas).

### 2.2 Impedir novos jobs (sem matar o banco)

1. Parar o processo do runtime (acima).
2. **Não** enfileirar manualmente novos jobs.
3. Opcional, para travar corrida com o provider: defina `COMMUNICATION_ADAPTER=none` antes de subir o processo (os schedulers até pode\... o provider `none` garante que nenhum e-mail real saia).
   > Nota de honestidade: não existe kill-switch transacional no banco; o controle de executor é operacional (parar processos) + `COMMUNICATION_ADAPTER=none`.

### 2.3 Interromper o processamento em andamento

A atomicidade já protege por item: cada handler é `BEGIN/COMMIT` condicionado ao estado vigente. Para um job travado, use o reap dos schedulers OU devolva manualmente:

```sql
-- devolver um job preso à fila (ambientes com acesso SQL)
UPDATE jobs_fila
   SET estado='pendente', tentativas=0, ultimo_erro=NULL, disponivel_em=now()
 WHERE id='<job_id>' AND estado='processando';
```

Prefira não editar jobs que estão sendo processados por um worker VIVO (dupla execução evitada por `SKIP LOCKED`, mas devolução manual + worker ativo = re-entrega).

---

## 3. Identificar jobs presos / retry

```sql
-- em retry (tentativas > 0) ou falha
SELECT id, tipo, estado, tentativas, ultimo_erro, criado_em
FROM jobs_fila
WHERE estado IN ('falha') OR (estado IN ('pendente','processando') AND tentativas > 0)
ORDER BY criado_em DESC
LIMIT 100;

-- presos há mais de 10 min (mesma janela do reapStuck padrão)
SELECT id, tipo, criado_em
FROM jobs_fila
WHERE estado='processando' AND criado_em < now() - interval '10 minutes';
```

Observação: `reapStuck` devolve automaticamente na próxima rodada do scheduler (padrão `reapOlderThanMinutes`).

---

## 4. Reprocessamento

- **Automático:** subir o runtime novamente — os schedulers retomam a fila (`pendente`+`disponivel_em` passado).
- **Manual de um job:** devolver à fila conforme §2.3 ou:

```sql
UPDATE jobs_fila SET estado='pendente', disponivel_em=now() WHERE id='<job_id>'
  AND estado IN ('falha','processando');
```

---

## 5. Rollback de versão / dados

### 5.1 Código (aplicações)

```bash
# voltar para o commit publicado anterior conhecido-bom
git checkout -f <commit-anterior> && npm ci && npm run build -w @servium-ia/api
# reiniciar API + runtime
npm run start & npm run runtime
```

### 5.2 Banco — migração não é retrocedível automaticamente

As migrations são **sempre-forward** (0014 até hoje); não existe `down`. Caminho honesto:

1. **Pare todo o processamento** (§2).
2. **Backup de consistência:**

   ```bash
   docker compose exec -T postgres pg_dump -U servium servium > servium_backup_$(date +%F_%T).sql
   ```

3. **Restore** (ambiente que suporta): recriar o volume ao commit anterior e `psql` do backup → verificar integridade (§6).
4. Para mudanças schema que **não** têm down, o rollback completo só é seguro com `pg_dump/restore` do snapshot antes da migração.

> Consequência declarada (não resolvida por este doc): restauração de dados com migrações aditivas requer mecanismo de clone — tratado como follow-up operacional.

---

## 6. Verificação de integridade pós-recuperação

```bash
# saúde do banco + API
curl -s localhost:3000/health | jq          # status ok, db true
# swap: 0 jobs processando antes do cutoff aguardado, fila drenando
```

1. Ambientes protegidos: após qualquer rollback, **re-executar** `npm run verify` (API+Web+DB+Runtime E2E) e o roteiro de regressão do `docs/qa/MVP_01_CROSS_TESTING_PLAN.md` antes de declarar recuperado.

---

## 7. Decisão aberta (não inventada)

- **Kill-switch transacional/global** — não existe hoje; prover exige decisão de escopo (mudança de modelo/dados) → `AWAITING_DECISION` (HG).
- Rotação de credenciais Gmail / revogação OAuth segue o fluxo do HG-007 (fora deste doc).

## Documentation Impact

```text
Documents reviewed:   code (runtime/scheduler, queue.ts, reapStuck), MVP_01_VERTICAL_SLICE.md critério 8
Documents updated:    docs/operations/MVP_01_ROLLBACK_STOP_PROCEDURE.md (novo, B-4)
No documentation changes required: não
Architectural decision required:   NO (doc operacional; sem mudança de arquitetura)
ADR affected:         N/A
```
