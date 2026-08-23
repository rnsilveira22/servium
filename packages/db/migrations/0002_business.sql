-- 0002_business.sql — modelo mínimo do MVP-01 (spike SRV-10 §modelo)
-- Toda tabela de negócio carrega tenant_id NOT NULL (multi-tenant shared-schema).

CREATE TABLE operadores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id),
  nome       text NOT NULL,
  email      text NOT NULL,
  senha_hash text NOT NULL,
  papel      text NOT NULL DEFAULT 'operador' CHECK (papel IN ('admin','operador')),
  ativo      boolean NOT NULL DEFAULT true,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE clientes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  nome          text NOT NULL,
  identificacao text,
  email         text,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE obrigacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  cliente_id  uuid NOT NULL REFERENCES clientes(id),
  descricao   text NOT NULL,
  prazo       date,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE checklist_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  nome        text NOT NULL,
  canal       text NOT NULL DEFAULT 'email',
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE itens_template (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  template_id       uuid NOT NULL REFERENCES checklist_templates(id),
  descricao         text NOT NULL,
  tipo_esperado     text NOT NULL DEFAULT 'documento'
                    CHECK (tipo_esperado IN ('documento','informacao','assinatura')),
  tamanho_max_bytes bigint CHECK (tamanho_max_bytes IS NULL OR tamanho_max_bytes > 0),
  ordem             integer NOT NULL DEFAULT 1
);

CREATE TABLE ciclos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  obrigacao_id uuid NOT NULL REFERENCES obrigacoes(id),
  estado       text NOT NULL DEFAULT 'aberto' CHECK (estado IN ('aberto','encerrado','cancelado')),
  ativado_por  uuid REFERENCES operadores(id),
  criado_em    timestamptz NOT NULL DEFAULT now(),
  encerrado_em timestamptz
);

CREATE TABLE itens_ciclo (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id),
  ciclo_id         uuid NOT NULL REFERENCES ciclos(id),
  item_template_id uuid NOT NULL REFERENCES itens_template(id),
  estado           text NOT NULL DEFAULT 'pendente'
                   CHECK (estado IN ('pendente','cobrado','aguardando','recebido',
                                     'resolvido','cancelado','excecao')),
  tentativas       integer NOT NULL DEFAULT 0,
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mensagens_comunicacao (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id),
  item_ciclo_id    uuid REFERENCES itens_ciclo(id),
  direcao          text NOT NULL CHECK (direcao IN ('envio','recebimento')),
  canal            text NOT NULL DEFAULT 'email',
  destinatario     text,
  remetente        text,
  template         text,
  message_id       text,
  token_correlacao text,
  idempotency_key  text NOT NULL,
  status           text NOT NULL DEFAULT 'novo'
                   CHECK (status IN ('novo','enviado','entregue','falha','processado')),
  criado_em        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE documentos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  item_ciclo_id uuid NOT NULL REFERENCES itens_ciclo(id),
  nome_arquivo  text NOT NULL,
  mime_type     text NOT NULL,
  tamanho_bytes bigint NOT NULL CHECK (tamanho_bytes > 0),
  sha256        char(64) NOT NULL,
  storage_key   text NOT NULL,
  origem        text NOT NULL DEFAULT 'upload_operador'
                CHECK (origem IN ('upload_operador','resposta_cliente')),
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE excecoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  item_ciclo_id uuid NOT NULL REFERENCES itens_ciclo(id),
  tipo          text NOT NULL,
  motivo        text NOT NULL,
  contexto      jsonb,
  desfecho      text CHECK (desfecho IS NULL OR desfecho IN ('resolvido','cancelado','reenviado')),
  decidido_por  uuid REFERENCES operadores(id),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  decidido_em   timestamptz
);

CREATE TABLE eventos_auditoria (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  actor_type  text NOT NULL CHECK (actor_type IN ('sistema','operador','servico')),
  actor_id    uuid,
  entidade    text NOT NULL,
  entidade_id uuid NOT NULL,
  acao        text NOT NULL,
  detalhes    jsonb,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jobs_fila (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  tipo            text NOT NULL,
  payload         jsonb NOT NULL,
  estado          text NOT NULL DEFAULT 'pendente'
                  CHECK (estado IN ('pendente','processando','concluido','falha')),
  tentativas      integer NOT NULL DEFAULT 0,
  max_tentativas  integer NOT NULL DEFAULT 3,
  disponivel_em   timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL,
  ultimo_erro     text,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

-- Índices de acesso por tenant e FKs quentes
CREATE INDEX idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX idx_obrigacoes_tenant_cliente ON obrigacoes(tenant_id, cliente_id);
CREATE INDEX idx_ciclos_obrigacao ON ciclos(obrigacao_id);
CREATE INDEX idx_itens_ciclo_ciclo ON itens_ciclo(ciclo_id);
CREATE INDEX idx_mensagens_item ON mensagens_comunicacao(item_ciclo_id);
CREATE INDEX idx_documentos_item ON documentos(item_ciclo_id);
CREATE INDEX idx_excecoes_item ON excecoes(item_ciclo_id);
CREATE INDEX idx_eventos_tenant_criado ON eventos_auditoria(tenant_id, criado_em DESC);
-- Fila: varredura SKIP LOCKED pega apenas pendentes disponíveis (ADR-006)
CREATE INDEX idx_jobs_pendentes ON jobs_fila(disponivel_em) WHERE estado = 'pendente';
