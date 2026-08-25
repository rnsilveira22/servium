-- 0009_rename_policies.sql — rename gmail policies to match convention

ALTER POLICY gmail_tokens_tenant_isolation ON gmail_tokens RENAME TO tenant_isolation;
ALTER POLICY mensagens_gmail_tenant_isolation ON mensagens_gmail RENAME TO tenant_isolation;
