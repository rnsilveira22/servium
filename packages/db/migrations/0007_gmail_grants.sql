-- 0007_gmail_grants.sql — permissions for SRV-18 tables

GRANT SELECT, INSERT, UPDATE, DELETE ON gmail_tokens TO servium_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mensagens_gmail TO servium_app;
