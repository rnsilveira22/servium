-- 0014_atividades_agentes.sql — FR-020 Atividade Operacional + FR-021 Agente Executor.
-- Atividade = rotina operacional recorrente configurada (multi-cliente), camada acima
-- de obrigação/ciclo. Agente executor = configuração de domínio EXTENSÍVEL (FR-021):
-- a atividade referencia o agente por FK (nunca hardcode string). O catálogo de
-- agentes é POR TENANT (ADR-005: toda entidade de negócio tem tenant_id + RLS).
-- Esta migration NÃO cria motor de execução/recorrência (FR-022) — apenas configuração.

CREATE TABLE agentes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE CASCADE: agentes são catálogo do ciclo de vida do tenant (seedado
  -- por trigger) — a deleção do tenant remove o catálogo, sem exigir limpeza
  -- manual de dependência em testes/operadores (espelha dados de negócio do tenant).
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug       text NOT NULL,
  nome       text NOT NULL,
  descricao  text NOT NULL,
  capacidade text NOT NULL,
  ativo      boolean NOT NULL DEFAULT true,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_agentes_tenant_slug ON agentes (tenant_id, slug);

-- Único agente do MVP (FR-021): Estagiária Digital — Assistente Digital de
-- Pendências Documentais. Futuros agentes serão cadastrados por decisão de produto.
-- Seed AUTOMÁTICO para todo tenant novo (trigger) + backfill dos já existentes.

CREATE OR REPLACE FUNCTION seed_agentes_para_tenant() RETURNS trigger AS $$
BEGIN
  INSERT INTO agentes (tenant_id, slug, nome, descricao, capacidade)
  VALUES (
    NEW.id,
    'estagiaria-digital',
    'Estagiária Digital',
    'Assistente Digital de Pendências Documentais',
    'solicitar, acompanhar, cobrar, registrar, identificar e escalar pendências documentais dos clientes'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agentes_seed ON tenants;
CREATE TRIGGER trg_agentes_seed
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION seed_agentes_para_tenant();

INSERT INTO agentes (tenant_id, slug, nome, descricao, capacidade)
SELECT t.id, 'estagiaria-digital', 'Estagiária Digital', 'Assistente Digital de Pendências Documentais',
       'solicitar, acompanhar, cobrar, registrar, identificar e escalar pendências documentais dos clientes'
  FROM tenants t
ON CONFLICT DO NOTHING;

-- RLS deny-by-default (padrão ADR-005 de 0003/0013). Catálogo é de leitura para o
-- app (SELECT); escrita é decisão de produto (seed/trigger/migration).
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON agentes
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT ON agentes TO servium_app;

CREATE TABLE atividades (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome                 text NOT NULL,
  descricao            text,
  periodicidade        text NOT NULL DEFAULT 'mensal'
                       CHECK (periodicidade IN ('mensal','trimestral','semestral','anual')),
  -- escopo: valor implementado no MVP é exclusivamente 'todos_ativos' (todos os
  -- clientes do tenant). Novos valores exigem decisão de produto + migration.
  escopo               text NOT NULL DEFAULT 'todos_ativos' CHECK (escopo IN ('todos_ativos')),
  agente_id            uuid NOT NULL REFERENCES agentes(id),
  canal                text NOT NULL DEFAULT 'email',
  prazo_dias           integer CHECK (prazo_dias IS NULL OR prazo_dias > 0),
  checklist_template_id uuid REFERENCES checklist_templates(id) ON DELETE SET NULL,
  -- Comportamento operacional: quais passos o motor aplicará nas execuções da atividade.
  -- Booleano = passo ligado/desligado (ponto de extensão FR-022/FR-024, sem engine nova aqui).
  comportamento        jsonb NOT NULL DEFAULT '{"solicitar":true,"acompanhar":true,"cobrar":true,"registrar":true,"identificar":true,"escalar":true}',
  status               text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','inativa')),
  criado_em            timestamptz NOT NULL DEFAULT now(),
  atualizado_em        timestamptz NOT NULL DEFAULT now()
);

-- RLS deny-by-default (padrão ADR-005 de 0003/0013).
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON atividades
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON atividades TO servium_app;

CREATE INDEX idx_atividades_tenant_status
  ON atividades (tenant_id, status);

-- Manter atualizado_em em toda atualização.
CREATE OR REPLACE FUNCTION touch_atividades_atualizado_em() RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atividades_atualizado_em ON atividades;
CREATE TRIGGER trg_atividades_atualizado_em
  BEFORE UPDATE ON atividades
  FOR EACH ROW EXECUTE FUNCTION touch_atividades_atualizado_em();