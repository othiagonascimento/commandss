-- Corrigir view v_tenant_template_info para usar SECURITY INVOKER
DROP VIEW IF EXISTS public.v_tenant_template_info;

CREATE VIEW public.v_tenant_template_info
WITH (security_invoker = true)
AS
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

-- Corrigir função para ter search_path definido
CREATE OR REPLACE FUNCTION public.update_tenant_template_subscription_updated_at()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;