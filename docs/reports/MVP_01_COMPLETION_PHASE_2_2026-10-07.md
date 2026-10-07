# MVP-01 · Completion — Report Phase 2 (Gmail real / HG-007)

- **Data:** 2026-10-07
- **Agent:** opencode · Model: big-pickle · Platform: CLI (repo local)

## Escopo

Habilitar envio Gmail real (provider gmail) para o piloto — depende de credenciais OAuth/TLS.

## Resultado

| Item | Status |
|---|---|
| Provider gmail implementado no código | ✅ (exists — fora desta fase) |
| Credencial OAuth / TLS real | `AWAITING_DECISION` (HG-007) |
| Config runtime para produção | ✓ documentada em `.env.example` / configure; execução exige credencial |

## Decisão necessária (Human Gate)

Favor registrar em `HUMAN_DECISIONS_LOG.md` / `HUMAN_GATES.md`:

- **HG-007:** fornecer credenciais OAuth (client id/secret, refresh token, scopes) e TLS pública para o piloto, OU declarar piloto 100% com Mailpit.
- Regra inalterada: **Gmail real NUNCA em CI**; envio real apenas em runtime com `COMMUNICATION_ADAPTER=gmail`.

## Documentation Impact

```text
Documents reviewed:   docs/factory/HUMAN_GATES.md (HG-007), docs (provider gmail)
Documents updated:    nenhum nesta fase (sem código)
No documentation changes required: não — bloco externo registrado no handoff do prompt mestre
Architectural decision required:   YES quando a credencial for resolvida (provider election)
ADR affected:         ADR-007 / AF-ADP (a confirmar com a decisão HG-007)
```
