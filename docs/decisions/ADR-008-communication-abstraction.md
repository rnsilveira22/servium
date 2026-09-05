# ADR-008 — Comunicação: Abstração de Canal (CommunicationChannel)

## Status

Accepted (HG-002 · 2026-08-22)

## Context

O canal de comunicação com clientes finais ainda está **a validar** (e-mail é hipótese inicial — HYP-005; WhatsApp é alternativa a avaliar). O core não pode depender de provedor específico (ADRV-006, ADRV-010), e todo envio exige idempotência e evidência auditável (NFR-007/008).

## Decision (Accepted)

Definir a porta conceitual **`CommunicationChannel`** com operações mínimas: enviar mensagem (destinatário, template renderizado, chave de idempotência) e receber mensagens/anexos. Adaptadores concretos implementam a porta (ex.: `EmailAdapter` hoje; `FutureChannelAdapter` depois). O ledger de envios fica no módulo Communication, nunca no adaptador. Escolha do provedor concreto ocorre na implementação, após validação de produto.

```text
CommunicationService (core)
    |
    +-- CommunicationChannel (porta)
          +-- EmailAdapter        (hipótese inicial)
          +-- FutureChannelAdapter (WhatsApp ou outro, se validado)
```

## Alternatives Considered

1. **Acoplamento direto a um provedor de e-mail** — rápido, mas viola ADRV-010 e torna HYP-005 uma prisão.
2. **Plataforma de comunicação omnichannel desde já** — antecipa custo/complexidade para um canal que sequer foi validado.

## Consequences

+ Troca/adição de canal sem tocar o core;
+ Testes com adaptador fake (sem envios reais em desenvolvimento);
− Abstração mal desenhada poderia vazar detalhes do canal → mitigação: porta mínima baseada nas necessidades reais do fluxo (texto + anexo + resposta).

## Risks

+ Canais futuros (ex.: WhatsApp) terem modelos de conversa/aprovação distintos → mitigação: a porta será revisada quando houver requisito real, sem compromisso prévio.

## Condições de revisão

Validação indicar canal diferente de e-mail; necessidade de recursos de canal não representáveis na porta atual.
