# ADR-010 — Estratégia de IA: Determinístico-first, LLM isolado e assistivo

## Status

Proposed

## Context

O produto é "IA" no discurso, mas o fluxo do MVP é majoritariamente determinístico (checklists, estados, limites, templates). Usar LLM onde uma regra basta gera custo, latência, não-determinismo e risco de alucinação (RSK-003, RSK-009; ADRV-013). Nenhum provedor deve ser escolhido sem necessidade validada.

## Decision (proposed)

Classificar cada função em determinístico / IA potencial / LLM potencial / humano obrigatório ([`../architecture/AI_USAGE_BOUNDARIES.md`](../architecture/AI_USAGE_BOUNDARIES.md)). No MVP:

- **Determinístico (regras):** identificação de pendentes, agendamento, limites, janelas, estados, relatórios, auditoria;
- **LLM assistivo (único ponto previsto):** apoio à classificação de respostas/documentos recebidos quando regras forem insuficientes — **saída sempre sugestiva**, com veredito final humano ou regra verificável;
- **Proibido para LLM:** decisão de envio, alteração de limites, validação conclusiva sem revisão, qualquer ação irreversível.

LLM acessado exclusivamente via porta provider-agnóstica; prompts/versões registrados na trilha de auditoria para reprodutibilidade; provedor concreto escolhido apenas na implementação, se a validação confirmar a necessidade.

## Alternatives Considered

1. **LLM em todas as etapas ("produto de IA")** — rejeitado: custo/latência/não-determinismo sem ganho onde regras bastam.
2. **Zero IA no MVP** — rejeitado: classificação de respostas ambíguas é exatamente onde linguagem natural aparece; IA assistiva bem delimitada agrega valor real.

## Consequences

+ Custo e risco controlados; comportamento previsível onde importa;
+ Provedor trocável; ausência de LLM não inviabiliza o MVP;
− Classificação automática limitada no piloto → mitigado por escalonamento humano (comportamento desejado).

## Risks

- Alucinação aceita como veredito → mitigação: saída sugerida nunca conclusiva; amostragem humana periódica (M-05);
- Prompt injection via conteúdo do cliente → mitigação: conteúdo tratado como dado, nunca como instrução; sem ações automáticas a partir de texto livre.

## Condições de revisão

Validação mostrar necessidade real de mais IA (ex.: extração estruturada de documentos); mudança de custo/capabilidade dos provedores.
