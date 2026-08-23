# SRV-10 — Vertical Slice Técnico Mínimo do MVP-01 (Spike)

> Produzido por `servium-senior` · 2026-08-23 · Aceite do PO na Issue #10.
> Base de evidência: ADRs 001–011 (`Accepted`), `FIRST_DIGITAL_EMPLOYEE.md`, `OPERATIONAL_FLOW.md`, `MVP_SCOPE.md`, skeleton #3 + CI #4 já na main. Hipóteses anteriores ao spike foram descartadas onde não suportadas por estas fontes.

## 1. Menor fluxo end-to-end útil

Um template com **2 itens**, **1 cliente**, **1 obrigação**:

```text
operador ativa ciclo (autenticado)
→ motor identifica itens pendentes
→ para cada item: solicitação enviada pelo canal (template + token de correlação)
→ cliente responde por e-mail com documento anexado
→ sistema correlaciona resposta→item, registra documento (hash/origem)
→ verificação básica determinística (tipo/tamanho esperados)
   ├─ ok → item Resolvido
   └─ problema → item vai a Exceção (fila) → operador decide (resolver/cancelar/reenviar)
→ sem resposta em X dias → retry dentro dos limites → esgotou → Exceção
→ todos os itens resolvidos/cancelados/escalados → ciclo encerrado
→ relatório simples + métricas derivadas dos eventos auditados
```

Demonstrável ponta a ponta com dados reais isolados — é o MVP-01.

## 2. Entidades mínimas (derivadas do fluxo; nenhuma tabela "para o futuro")

| Entidade | Papel no fluxo | Notas |
|---|---|---|
| `tenants` | isolamento | raiz de tudo |
| `operadores` | quem ativa/decide (auth mínima) | slice da ADR-009 |
| `clientes` | alvo das cobranças | pertence a tenant |
| `obrigacoes` | agrupa checklist do cliente | ex.: "DAS Janeiro" |
| `checklist_templates` + `itens_template` | definição reutilizável | tipo/tamanho esperado por item |
| `ciclos` | execução ativada pelo operador | estado: aberto/encerrado |
| `itens_ciclo` | estado por item: `pendente→cobrado→aguardando→recebido→resolvido/cancelado/excecao` | máquina de estados da OPERATIONAL_FLOW |
| `mensagens_comunicacao` | ledger bidirecional | direção, idempotency_key, message_id, token, status |
| `documentos` | metadados apenas (ADR-007) | hash SHA-256, origem, vínculo ao item; binário no object storage |
| `excecoes` | fila de intervenção humana | motivo, contexto, desfecho, decidido_por |
| `eventos_auditoria` | append-only (SRV-9) | quem/o quê/quando/tenant/cliente/item/decisão |
| `jobs_fila` | jobs persistidos (ADR-006) | SKIP LOCKED, retry/backoff |

**Todas** as tabelas de negócio com `tenant_id` NOT NULL + RLS deny-by-default (ADR-005).

## 3. Componentes necessários (fronteiras existentes, sem novos frameworks)

Módulos NestJS mapeando o monólito modular (ADR-001/002): `Auth` (slice), `Cadastro`, `CycleEngine`, `Exceptions`, `Communication` (porta ADR-008 + adaptador), `Documents` (metadados; storage atrás de porta), `Audit`, `Jobs` (worker PG). Nenhum Redis/K8s/microsserviço.

## 4. Decisões técnicas que o spike precisa fechar

### 4.1 Acesso a dados e migrations

Nenhum ADR define ORM/tool. Evidência comparada:

| Opção | Prós | Contras |
|---|---|---|
| ORM completo (Prisma/TypeORM) | produtividade | camada extra; RLS exige SQL cru anyway; peso p/ MVP |
| **`pg` (node-postgres) + migrations SQL versionadas + runner mínimo** | zero lock-in; controle total do SQL (RLS/policies); revisão trivial; alinhado deterministic-first | mais SQL manual (aceitável neste tamanho) |

**Recomendação: `pg` + SQL migrations ordenadas (`schema_migrations`) com runner script próprio (~50 linhas).** Reversível; se o projeto crescer, node-pg-migrate é upgrade compatível.

### 4.2 Identidade/autenticação mínima para o piloto (pergunta §5)

**Não é seguro operar com dados reais do cliente piloto sem autenticação.** Token fixo/bypass violam ADR-009 e a condição OWASP ASVS (ADR-009). Antecipação controlada (HG-005 §10) do menor slice da Onda 2:

- login e-mail+senha (argon2id), sessão httpOnly server-side;
- RBAC mínimo: `admin` / `operador` por tenant;
- identidade de serviço registrada para o Funcionário Digital (sem login humano);
- logout + expiração; rate limit básico no endpoint de login.

Fora do slice: OIDC/IdP externo, 2FA, gestão completa de usuários (fica pós-piloto). → **Nova Issue N5 (P0)** criada com este recorte; bloqueia #15/#17/#18 e a avaliação PILOT_READY.

### 4.3 Comunicação bidirecional (comparação formal)

Critérios exigidos pela Issue #10:

| Critério | A) SMTP+IMAP próprio | B) API provedor e-mail | C) Portal/upload manual |
|---|---|---|---|
| Outbound | ✔ via SMTP do escritório | ✔ API | n/a (não é automação) |
| Inbound | ✔ IMAP polling | ✔ webhooks/parse | ✘ quebra automação (rejeitado p/ objetivo MVP-01) |
| Anexos | ✔ MIME parsing | ✔ | ✔ mas manual |
| Correlação | ✔ token no assunto + `In-Reply-To`/`Message-ID` | ✔ headers próprios | ✘ |
| Segurança credenciais | env vars/TLS implícito | API key gerenciada | n/a |
| Observabilidade | média (ledger app) | alta (dashboards do fornecedor) | n/a |
| Retry/idempotência | ✔ jobs + Message-ID único | ✔ | n/a |
| Custo | **zero** | recorrente | zero |
| Fornecedor/novo gate | nenhum | **sim → HG-006** | nenhum |
| Lock-in | baixo | médio | — |
| Complexidade | média (IMAP/MIME quirks) | baixa | baixa |
| Time-to-pilot | rápido-médio | rápido (após contratação) | imediato mas invalida o teste |

**RECOMENDAÇÃO: A (SMTP+IMAP)** — única alternativa que valida automação real bidirecional com custo/provedor zero (sem HG-006), reversível pela porta `CommunicationChannel` (troca por B post-piloto se inbound IMAP mostrar-se frágil). Riscos registrados: variações de IMAP entre provedores → mitigar com testes contra caixa real na SRV-18; parsing MIME via biblioteca madura (`mailparser`). Evidência de viabilidade: credenciais SMTP/IMAP já existem no escritório piloto (infra disponível); nada contratado.

## 5. Capacidades antecipadas vs adiadas

**Antecipadas (necessárias ao slice)**: cadastro mínimo (#16), ciclo core (#15), exceções mínimas (#17), comunicação e-mail (#18), auth mínima (**N5**), auditoria (#9), jobs essenciais (#8 subconjunto), object storage local S3-compatível (MinIO container — zero custo, ADR-007).
**Adiadas**: RBAC granular/OIDC, multi-canal/WhatsApp, LLM, dashboards, portal cliente, ERPs, segundo FD, K8s/microsserviços.

## 6. Dependências refinadas

```text
#6 (recorte fechado acima) → #7 ∥ N5 ∥ #16 → #8(subset) ∥ #15 → #17 ∥ #18 → #9 → PILOT_READY
```

Issues #16/#15/#17/#18 refinadas conforme comentários nas Issues; #7/#8/#9 escopos mantidos (já mínimos); DoR de #6 agora completa (recorte definido).

## 7. Caminho crítico até PILOT_READY

`#5 ∥ #10(feito)` → `#6` → `#7 ∥ N5 ∥ #16` → `#8s ∥ #15` → `#17 ∥ #18(A)` → `#9` → **avaliação PILOT_READY** (critérios de `MVP_01_VERTICAL_SLICE.md`) → Gate humano do piloto.

## 8. Human Gates restantes

1. **Gate do piloto** (execução com dados reais no cliente) — após PILOT_READY;
2. HG-006 — **evitado** com recomendação A (custo zero); reabre se A falhar em produção de e-mail do escritório;
3. Merges Level 3 das PRs correntes (política inalterada).
