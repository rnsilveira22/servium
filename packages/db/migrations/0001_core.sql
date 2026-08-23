-- 0001_core.sql — base multi-tenant (spike SRV-10, ADR-004)
-- gen_random_uuid é core desde PG13; timestamptz sempre em UTC.

CREATE TABLE tenants (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
