# Ambiente Local

> Requisito: Docker + Docker Compose. Nenhum serviço pago; nenhuma infraestrutura prematura.

## Subir o PostgreSQL

```bash
cp .env.example .env   # ajuste se necessário
npm run db:up          # sobe o container e aguarda o healthcheck
```

## Parar / resetar

```bash
npm run db:down        # para e remove o container (dados persistem no volume)
npm run db:reset       # para e APAGA o volume (recomeça do zero)
```

## Convenções

- Credenciais locais ficam em `.env` (ignorado pelo git); `.env.example` nunca contém secrets reais;
- Migrations e dados entram nas histórias da SRV-6/#16 — este ambiente é apenas a fundação;
- Adaptadores fake (canal de comunicação, storage) serão adicionados nas histórias que os consumirem — nenhum é necessário ainda;
- O healthcheck (`pg_isready`) garante que `db:up` só retorna quando o banco aceita conexões.
