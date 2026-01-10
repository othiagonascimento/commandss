-- Add AI Engine configuration columns to tenant_features for per-tenant configuration
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_use_global_config BOOLEAN DEFAULT true;
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_layer_1_model TEXT;
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_layer_1_instructions TEXT;
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_layer_2_model TEXT;
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_layer_2_instructions TEXT;
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_layer_3_model TEXT;
ALTER TABLE public.tenant_features ADD COLUMN IF NOT EXISTS ai_layer_3_instructions TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN public.tenant_features.ai_use_global_config IS 'When true, tenant inherits global AI config. When false, uses custom config.';
COMMENT ON COLUMN public.tenant_features.ai_layer_1_model IS 'Router layer model (fast model for routing)';
COMMENT ON COLUMN public.tenant_features.ai_layer_2_model IS 'Standard layer model (balanced model)';
COMMENT ON COLUMN public.tenant_features.ai_layer_3_model IS 'Elite layer model (advanced model for complex tasks)';