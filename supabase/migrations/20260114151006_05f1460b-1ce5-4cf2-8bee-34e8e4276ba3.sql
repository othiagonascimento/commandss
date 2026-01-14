-- ===========================================
-- Tabela unificada de assinatura tenant-template
-- Substitui a relação fragmentada em tenant_onboarding
-- ===========================================

-- 1. Adicionar novos campos na tabela existente tenant_template_subscriptions
ALTER TABLE public.tenant_template_subscriptions
ADD COLUMN IF NOT EXISTS sync_mode TEXT DEFAULT 'auto' CHECK (sync_mode IN ('auto', 'manual', 'locked')),
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_synced_version TEXT,
ADD COLUMN IF NOT EXISTS local_overrides JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sync_sections TEXT[] DEFAULT ARRAY['prompts', 'ai_config', 'funnel', 'automations', 'sla'],
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'outdated', 'error')),
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_template_subscriptions_template 
ON public.tenant_template_subscriptions(template_id);

CREATE INDEX IF NOT EXISTS idx_tenant_template_subscriptions_sync_status 
ON public.tenant_template_subscriptions(sync_status);

CREATE INDEX IF NOT EXISTS idx_tenant_template_subscriptions_sync_mode 
ON public.tenant_template_subscriptions(sync_mode);

-- 3. Criar tabela de histórico de sincronização
CREATE TABLE IF NOT EXISTS public.template_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.tenant_template_subscriptions(id) ON DELETE CASCADE,
  template_id UUID,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_version TEXT,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('auto', 'manual', 'force', 'rollback')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error', 'skipped')),
  sections_synced TEXT[],
  sections_skipped TEXT[],
  error_message TEXT,
  changes_applied JSONB DEFAULT '{}',
  triggered_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para histórico
CREATE INDEX IF NOT EXISTS idx_template_sync_history_subscription 
ON public.template_sync_history(subscription_id);

CREATE INDEX IF NOT EXISTS idx_template_sync_history_tenant 
ON public.template_sync_history(tenant_id);

CREATE INDEX IF NOT EXISTS idx_template_sync_history_created 
ON public.template_sync_history(created_at DESC);

-- 5. Habilitar RLS
ALTER TABLE public.template_sync_history ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS para histórico
CREATE POLICY "Master users can view sync history"
ON public.template_sync_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.tenant_id = '00000000-0000-0000-0000-000000000001'
  )
);

CREATE POLICY "Master users can insert sync history"
ON public.template_sync_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.tenant_id = '00000000-0000-0000-0000-000000000001'
  )
);

-- 7. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tenant_template_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_tenant_template_subscription_updated_at ON public.tenant_template_subscriptions;
CREATE TRIGGER trigger_update_tenant_template_subscription_updated_at
BEFORE UPDATE ON public.tenant_template_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_template_subscription_updated_at();

-- 9. Migrar dados existentes de tenant_onboarding
INSERT INTO public.tenant_template_subscriptions (tenant_id, template_id, auto_sync_enabled, sync_mode, sync_status)
SELECT 
  o.tenant_id,
  o.niche_template_id,
  true,
  'auto',
  'pending'
FROM public.tenant_onboarding o
WHERE o.niche_template_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.tenant_template_subscriptions s
  WHERE s.tenant_id = o.tenant_id AND s.template_id = o.niche_template_id
);

-- 10. View para consulta simplificada
CREATE OR REPLACE VIEW public.v_tenant_template_info AS
SELECT 
  s.id as subscription_id,
  s.tenant_id,
  s.template_id,
  t.name as tenant_name,
  t.subdomain as tenant_subdomain,
  t.status as tenant_status,
  m.name as template_name,
  m.slug as template_slug,
  s.sync_mode,
  s.sync_status,
  s.last_synced_at,
  s.last_synced_version,
  s.auto_sync_enabled,
  s.local_overrides,
  s.sync_sections,
  s.created_at as subscribed_at
FROM public.tenant_template_subscriptions s
JOIN public.tenants t ON t.id = s.tenant_id
JOIN public.master_niche_templates m ON m.id = s.template_id;