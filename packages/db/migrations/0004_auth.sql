-- 0004_auth.sql — SRV-20: sessões opacas server-side (ADR-009)
-- Token nunca é armazenado: apenas SHA-256. Logout/revoke imediato.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug text;
UPDATE tenants SET slug = lower(regexp_replace(nome, '[^a-zA-Z0-9]+', '-', 'g'))
  WHERE slug IS NULL AND nome IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_slug ON tenants(slug) WHERE slug IS NOT NULL;

CREATE TABLE sessoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  operador_id uuid NOT NULL REFERENCES operadores(id),
  token_hash  char(64) NOT NULL UNIQUE,
  expira_em   timestamptz NOT NULL,
  revogado_em timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessoes_operador ON sessoes(operador_id);
CREATE INDEX idx_sessoes_validas ON sessoes(expira_em) WHERE revogado_em IS NULL;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE sessoes FORCE ROW LEVEL SECURITY';
  EXECUTE $pol$CREATE POLICY tenant_isolation ON sessoes
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)$pol$;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON sessoes TO servium_app;
