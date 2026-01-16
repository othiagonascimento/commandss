-- Apenas tabela tenant_crm_sync (template_sync_history já existe)
CREATE TABLE IF NOT EXISTS public.tenant_crm_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  crm_tenant_id UUID,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(master_tenant_id)
);

-- Trigger (ignora se já existir)
DROP TRIGGER IF EXISTS update_tenant_crm_sync_updated_at ON public.tenant_crm_sync;
CREATE TRIGGER update_tenant_crm_sync_updated_at
  BEFORE UPDATE ON public.tenant_crm_sync
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índice
CREATE INDEX IF NOT EXISTS idx_tenant_crm_sync_status ON public.tenant_crm_sync(sync_status);

-- RLS
ALTER TABLE public.tenant_crm_sync ENABLE ROW LEVEL SECURITY;

-- Política
DROP POLICY IF EXISTS "Master users can manage tenant_crm_sync" ON public.tenant_crm_sync;
CREATE POLICY "Master users can manage tenant_crm_sync"
  ON public.tenant_crm_sync
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.master_users mu
      WHERE mu.user_id = auth.uid() AND mu.is_active = true
    )
  );