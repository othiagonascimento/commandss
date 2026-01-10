-- Add per-user quota fields to tenant_features
ALTER TABLE public.tenant_features 
  ADD COLUMN IF NOT EXISTS credits_per_user INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS storage_mb_per_user INTEGER DEFAULT 100;

-- Add comments for clarity
COMMENT ON COLUMN public.tenant_features.credits_per_user IS 'Default AI credits quota per user per month';
COMMENT ON COLUMN public.tenant_features.storage_mb_per_user IS 'Default storage quota per user in MB';

-- Keep limit_ai_tokens_monthly and limit_storage_mb as legacy fields for backward compatibility
-- The new credits_per_user and storage_mb_per_user will be used for per-user calculations