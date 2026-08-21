# ADR-009 — Autenticação e Autorização: First-party + RBAC mínimo

## Status

Proposed

## Context

Usuários humanos do escritório (papéis mínimos: gestor/responsável), operações sensíveis auditadas, tenant sempre contextualizado (NFR-002, ADRV-001/009). IAM completo ou IdP externo seriam excesso para o piloto.

## Decision (proposed)

**Autenticação first-party**: e-mail + senha (hash moderno, ex.: argon2/bcrypt), sessões httpOnly server-side, RBAC mínimo em tabelas próprias (usuário ↔ papel ↔ tenant). Ações sensíveis (alterar limites/templates, resolver exceções) exigem papel adequado e geram evento de auditoria. Funcionários Digitais são atores registrados com identidade própria de serviço (sem login humano), preparando service identities futuras. Desenho compatível com plugagem futura de OIDC/IdP externo sem reescrita.

## Alternatives Considered

1. **IdP externo gerenciado (Auth0/Cognito/Supabase Auth)** — rápido, mas custo por usuário, dependência externa cedo demais e menos controle sobre o contexto de tenant.
2. **JWT stateless puro** — revogação difícil (kill switch de usuário exige estado); sessões server-side são mais seguras para app interna.

## Consequences

+ Controle total sobre sessão, papéis e contexto de tenant;
+ Zero dependência/custo externo no piloto;
− Implementar corretamente segurança de autenticação é responsabilidade nossa → mitigação: bibliotecas consolidadas de hash/sessão, rate limiting, testes de segurança básicos;
− SSO corporativo futuro exige trabalho adicional → aceito e previsto na desenho.

## Risks

- Falha de implementação própria (ex.: fixação de sessão) → mitigação: checklist OWASP ASVS nível adequado ao piloto.

## Condições de revisão

Requisito de SSO corporativo; crescimento que justifique IdP gerenciado; múltiplos produtos compartilhando identidade.
