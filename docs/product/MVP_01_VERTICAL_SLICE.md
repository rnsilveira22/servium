# MVP-01 — Vertical Slice Canônico

> Documento canônico da meta `MVP-01 — Primeiro Funcionário Digital em operação assistida no cliente piloto` (decisão **HG-005**, 2026-08-22: `PRODUCT PRIORITY: MVP-01 TIME-TO-PILOT`).
> Fontes preservadas: [`FIRST_DIGITAL_EMPLOYEE.md`](FIRST_DIGITAL_EMPLOYEE.md), [`OPERATIONAL_FLOW.md`](OPERATIONAL_FLOW.md), [`MVP_SCOPE.md`](MVP_SCOPE.md).

## Objetivo

Colocar o primeiro Funcionário Digital operando um fluxo real de ponta a ponta no cliente piloto, com supervisão humana, rastreabilidade e segurança suficientes para teste controlado — otimizando time-to-pilot sem violar qualidade.

## Usuário / ator

- **Escritório de contabilidade (tenant)** — persona principal (`PERSONAS.md`);
- Responsável do escritório: ativa ciclos, decide escalonamentos, acompanha painel mínimo;
- Cliente final do escritório: recebe solicitações e responde com documentos.

## Primeiro Funcionário Digital

**Assistente Digital de Pendências Documentais** — único tipo, conforme `FIRST_DIGITAL_EMPLOYEE.md` e `MVP_SCOPE.md`. Determinístico (regras; LLM fora do caminho crítico — ADR-010).

## Rotina executada (fluxo end-to-end)

Conforme máquina de estados de `OPERATIONAL_FLOW.md`:

```text
cliente / obrigação → identificação de pendência (checklist)
  → solicitação de informação/documento (template padronizado)
  → acompanhamento (limites configurados)
  → retry/cobrança quando permitido
  → recebimento/resposta (registro + verificação básica)
  → classificação básica no item correto
  → exceção para humano quando necessário
  → registro/auditoria de cada ação
  → encerramento do ciclo
  → métricas mínimas
```

- **Início do fluxo**: responsável humano **ativa o ciclo** (aprovação prévia obrigatória);
- **Fim do fluxo**: ciclo encerrado — itens `Resolvido`/`Cancelado` ou escalados com decisão humana registrada; relatório de fechamento simples gerado.

## Entradas

- Checklist por cliente/obrigação (configurado pelo escritório);
- Limites configuráveis: frequência, horário comercial, máximo de tentativas;
- Respostas do cliente: mensagem e documento anexado.

## Saídas

- Mensagens padronizadas enviadas em nome do escritório;
- Itens de checklist atualizados (estados do fluxo);
- Trilha de auditoria completa por item/ciclo;
- Relatório/fechamento de ciclo + métricas mínimas.

## Exceções (→ fila de exceção)

Documento ilegível/tipo errado; resposta fora de contexto; limite de tentativas esgotado; qualquer situação ambígua. Exceção = pausa do item + notificação ao responsável.

## Intervenção humana

| Momento | Papel |
|---|---|
| Ativação do ciclo | **Aprovar** (obrigatória) |
| Exceção classificada | **Decidir** próximo passo |
| Cancelamento de item/ciclo | **Somente humano** |
| Tentativas esgotadas | **Decidir** encaminhamento |

## Dados mínimos

`tenant`, `cliente`, `obrigação`, `checklist_template` + `item_checklist`, `ciclo_pendencia`, `mensagem_enviada`, `anexo` (referência mínima), `evento_auditoria` (append-only). Detalhamento exato definido pelo spike SRV-10 e materializado na SRV-6.

## Comunicação

Canal mínimo proposto pelo PO: **e-mail transacional via SMTP configurado pelo escritório piloto** (sem contratação de novo serviço pago). Templates identificados como "em nome do escritório". Se o piloto exigir serviço pago/provedor externo → **HG-006** antes de qualquer contratação. Canal definitivo segue não assumido.

## Auditoria

Trilha append-only reconstrutível (SRV-9): o que o agente fez, quando, em nome de qual tenant, sobre qual cliente, qual decisão, quando houve intervenção humana.

## Segurança

Multi-tenancy obrigatório desde o primeiro dado: `tenant_id` + RLS deny-by-default + suíte anti-vazamento (SRV-7 / condição ADR-005). Secrets fora do repositório. Sem produção sem gate aplicável.

## Métricas mínimas

Tempo médio de resolução por item; % itens resolvidos sem escalada; tentativas médias até resposta; pendências abertas por cliente. Coleta simples (eventos já auditados); painel sofisticado adiado.

## Critérios para o piloto (PILOT_READY)

1. Fluxo end-to-end demonstrável com dados reais isolados;
2. Testes críticos verdes no CI;
3. Multi-tenancy validada (suíte anti-vazamento);
4. Auditoria reconstrutível ponta a ponta;
5. Intervenção humana funcionando (ativação + exceções);
6. Retry/idempotência dos jobs essenciais;
7. Canal real validado (envio+recebimento);
8. Procedimento de rollback/parada documentado;
9. Métricas mínimas coletando;
10. Responsável humano identificado no escritório piloto.

## Fora do MVP-01

Segundo Funcionário Digital; framework genérico de agentes; múltiplos canais/WhatsApp não validado; integração ERP; LLM no caminho crítico; infra distribuída/microsserviços/K8s; dashboards sofisticados; portal do cliente; cobrança além de lembretes.
