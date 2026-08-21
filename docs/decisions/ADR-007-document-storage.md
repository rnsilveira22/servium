# ADR-007 — Armazenamento Documental: Object Storage + Metadados no Banco

## Status

Proposed

## Context

Documentos recebidos de clientes finais são dados potencialmente pessoais (LGPD, ADRV-007): exigem integridade (hash), imutabilidade, vínculo auditável a tarefas, retenção/eliminação executável e custo previsível. Comparação conceitual: filesystem local × object storage × banco.

## Decision (proposed)

**Conteúdo binário em object storage compatível com S3** (gerenciado no piloto), **metadados no PostgreSQL** (tenant, origem, tipo, tamanho, hash SHA-256, data, vínculo ao item, política de retenção). Conteúdo imutável; eliminação lógica + física conforme política LGPD. Acesso via URLs assinadas de curta duração, sempre mediadas pela aplicação (autorização contextual por tenant).

## Alternatives Considered

1. **Filesystem local do servidor** — simples, mas frágil para backup/recuperação, sem ciclo de vida nativo e acoplado à máquina (contraria NFR-016).
2. **Conteúdo dentro do banco (bytea)** — transacional, mas incha backups, piora performance e complica retenção; inadequado já no piloto.

## Consequences

+ Integridade verificável (hash) e armazenamento durável gerenciado;
+ Ciclo de vida/retenção configurável por regra (LGPD);
+ Backups do banco permanecem leves;
− Dependência de mais um serviço externo → mitigada pela porta de storage (adaptador) e pelo provedor gerenciado;
− Custo por GB — irrelevante na escala do piloto, monitorado via ADRV-008.

## Risks

- URL assinada vazada → mitigação: expiração curta, escopo por documento, log de acesso;
- Órfãos (arquivo sem metadado ou vice-versa) → mitigação: escrita em duas etapas com reconciliação periódica.

## Condições de revisão

Volume/custo que justifique provedor próprio; requisito de residência de dados em jurisdição específica.
