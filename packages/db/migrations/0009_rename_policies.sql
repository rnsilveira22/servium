-- 0009_rename_policies.sql — rename gmail policies to match convention
-- Idempotent: only renames if old name exists (fresh DBs already use correct name in 0006)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname='gmail_tokens_tenant_isolation') THEN
    ALTER POLICY gmail_tokens_tenant_isolation ON gmail_tokens RENAME TO tenant_isolation;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname='mensagens_gmail_tenant_isolation') THEN
    ALTER POLICY mensagens_gmail_tenant_isolation ON mensagens_gmail RENAME TO tenant_isolation;
  END IF;
END $$;
