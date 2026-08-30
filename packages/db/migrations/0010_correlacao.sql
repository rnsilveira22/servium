-- 0010_correlacao.sql — PRM-P0.1-E: vinculo resposta ↔ item do ciclo.
-- A coluna token_correlacao já existe em mensagens_comunicacao (0002);
-- aqui estendemos o registro delivery (Gmail) e indexamos a busca pelo token.

ALTER TABLE mensagens_gmail
  ADD COLUMN IF NOT EXISTS token_correlacao text;

CREATE INDEX IF NOT EXISTS idx_mensagens_comunicacao_token
  ON mensagens_comunicacao (token_correlacao)
  WHERE token_correlacao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mensagens_gmail_token
  ON mensagens_gmail (token_correlacao)
  WHERE token_correlacao IS NOT NULL;