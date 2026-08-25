-- 0005_motor.sql — SRV-15: vínculo obrigação↔template e limites configuráveis
ALTER TABLE obrigacoes ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES checklist_templates(id);
ALTER TABLE ciclos ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{"frequencia_horas":24,"tentativas_max":3,"horario_inicio":8,"horario_fim":18}';
