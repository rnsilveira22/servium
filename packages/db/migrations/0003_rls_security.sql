-- 0003_rls_security.sql — isolamento deny-by-default (ADR-005)
-- Padrão: ENABLE + FORCE RLS; política keyed em current_setting('app.tenant_id').
-- Superuser bypassa RLS por definição → acesso de aplicação/testes SEMPRE via role servium_app.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'servium_app') THEN
    CREATE ROLE servium_app LOGIN PASSWORD 'servium_app' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

DO $$
DECLARE
  t text;
BEGIN
  -- tenants: linha visível somente quando é o tenant da conexão
  EXECUTE 'ALTER TABLE tenants ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE tenants FORCE ROW LEVEL SECURITY';
  EXECUTE $pol$CREATE POLICY tenant_isolation ON tenants
    USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)$pol$;

  -- demais tabelas: tenant_id obrigatório na política
  FOREACH t IN ARRAY ARRAY[
    'operadores','clientes','obrigacoes','checklist_templates','itens_template',
    'ciclos','itens_ciclo','mensagens_comunicacao','documentos','excecoes',
    'eventos_auditoria','jobs_fila'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($pol$CREATE POLICY tenant_isolation ON %I
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)$pol$, t);
  END LOOP;
END
$$;

GRANT USAGE ON SCHEMA public TO servium_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO servium_app;

-- Trilha de auditoria append-only para a aplicação
REVOKE UPDATE, DELETE ON eventos_auditoria FROM servium_app;
