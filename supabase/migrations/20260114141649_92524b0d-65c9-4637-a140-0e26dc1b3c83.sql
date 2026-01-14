-- =====================================================
-- CORREÇÃO 1: Atualizar nomes dos modelos para compatibilidade com Tenant
-- Deletar primeiro os que causariam duplicação
-- =====================================================

-- Deletar modelos que serão consolidados (manter apenas um por categoria)
DELETE FROM ai_available_models WHERE model_id = 'gemini-1.5-pro-latest';
DELETE FROM ai_available_models WHERE model_id = 'gemini-2.0-flash';
DELETE FROM ai_available_models WHERE model_id = 'gemini-2.5-pro-preview-05-06';
DELETE FROM ai_available_models WHERE model_id = 'claude-3-5-sonnet-20241022';

-- Atualizar model_id na tabela ai_available_models
UPDATE ai_available_models 
SET model_id = 'gemini-2.0-flash', display_name = 'Gemini 2.0 Flash' 
WHERE model_id = 'gemini-1.5-flash';

UPDATE ai_available_models 
SET model_id = 'gemini-2.5-pro-preview-05-06', display_name = 'Gemini 2.5 Pro' 
WHERE model_id = 'gemini-1.5-pro';

UPDATE ai_available_models 
SET model_id = 'claude-3-5-sonnet-20241022', display_name = 'Claude 3.5 Sonnet' 
WHERE model_id = 'claude-3-5-sonnet';

-- =====================================================
-- CORREÇÃO 2: Adicionar campo api_url na tabela tenants
-- =====================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_url text;
COMMENT ON COLUMN tenants.api_url IS 'URL base da API Supabase do tenant para webhooks de sincronização';

-- =====================================================
-- CORREÇÃO 3: Atualizar master_settings com nomes corretos
-- =====================================================

UPDATE master_settings 
SET ai_layer_1_model = 'gemini-2.0-flash' 
WHERE key = 'ai_global_engine' AND ai_layer_1_model LIKE 'gemini-1.5%';

UPDATE master_settings 
SET ai_layer_2_model = 'gpt-4o-mini' 
WHERE key = 'ai_global_engine' AND ai_layer_2_model LIKE 'gpt-4o%';

UPDATE master_settings 
SET ai_layer_3_model = 'claude-3-5-sonnet-20241022' 
WHERE key = 'ai_global_engine' AND ai_layer_3_model LIKE 'claude-3-5-sonnet%';

-- =====================================================
-- CORREÇÃO 4: Criar templates de nicho padrão
-- =====================================================

INSERT INTO master_niche_templates (name, slug, is_active, ai_config, prompts, created_at)
VALUES 
(
  'E-commerce Geral',
  'ecommerce-geral',
  true,
  '{"ai_model_provider": "google/gemini-2.0-flash", "layer_1_model": "gemini-2.0-flash", "layer_2_model": "gpt-4o-mini", "layer_3_model": "claude-3-5-sonnet-20241022", "enable_tri_modal": true}'::jsonb,
  '{"greeting": "Olá! 👋 Sou o assistente virtual da loja."}'::jsonb,
  now()
),
(
  'Moda e Vestuário',
  'moda-vestuario',
  true,
  '{"ai_model_provider": "google/gemini-2.0-flash", "layer_1_model": "gemini-2.0-flash", "layer_2_model": "gpt-4o-mini", "layer_3_model": "claude-3-5-sonnet-20241022", "enable_tri_modal": true}'::jsonb,
  '{"greeting": "Oi! ✨ Bem-vindo(a) à nossa loja!"}'::jsonb,
  now()
),
(
  'Suplementos e Saúde',
  'suplementos-saude',
  true,
  '{"ai_model_provider": "google/gemini-2.0-flash", "layer_1_model": "gemini-2.0-flash", "layer_2_model": "gpt-4o-mini", "layer_3_model": "claude-3-5-sonnet-20241022", "enable_tri_modal": true}'::jsonb,
  '{"greeting": "Olá! 💪 Sou seu consultor de suplementação."}'::jsonb,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  ai_config = EXCLUDED.ai_config,
  prompts = EXCLUDED.prompts,
  is_active = EXCLUDED.is_active;