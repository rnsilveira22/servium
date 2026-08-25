-- 0006_gmail.sql — SRV-18: Gmail API + OAuth 2.0 adapter

CREATE TABLE gmail_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  user_email      text NOT NULL,
  access_token    text NOT NULL,
  refresh_token   text NOT NULL,
  scopes          text[] NOT NULL DEFAULT '{https://www.googleapis.com/auth/gmail.send}',
  expires_at      timestamptz NOT NULL,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_email)
);

ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON gmail_tokens
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);

CREATE TABLE mensagens_gmail (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  gmail_message_id  text NOT NULL,
  gmail_thread_id   text,
  item_ciclo_id     uuid REFERENCES itens_ciclo(id),
  direcao           text NOT NULL CHECK (direcao IN ('envio','recebimento')),
  subject           text,
  snippet           text,
  destinatario      text,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, gmail_message_id)
);

ALTER TABLE mensagens_gmail ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_gmail FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mensagens_gmail
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true),'')::uuid);

CREATE INDEX idx_mensagens_gmail_item ON mensagens_gmail(item_ciclo_id);
CREATE INDEX idx_mensagens_gmail_tenant ON mensagens_gmail(tenant_id, criado_em DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON gmail_tokens TO servium_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON mensagens_gmail TO servium_app;
