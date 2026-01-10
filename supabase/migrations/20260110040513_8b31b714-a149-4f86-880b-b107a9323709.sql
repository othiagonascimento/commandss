-- =====================================================
-- FASE 1: INTEGRAÇÃO MASTER → TENANT
-- Criação de tabelas para gerenciamento de features, limites e consumo
-- =====================================================

-- 1. Tabela tenant_features - Limites e Módulos por Tenant
CREATE TABLE public.tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Módulos habilitados
  module_ai_agent BOOLEAN DEFAULT true,
  module_ai_transcription BOOLEAN DEFAULT true,
  module_automation_flows BOOLEAN DEFAULT true,
  module_campaigns BOOLEAN DEFAULT true,
  module_ecommerce BOOLEAN DEFAULT true,
  module_erp_integration BOOLEAN DEFAULT false,
  module_api_access BOOLEAN DEFAULT false,
  module_whitelabel BOOLEAN DEFAULT false,
  module_multi_whatsapp BOOLEAN DEFAULT false,
  
  -- Limites de recursos
  limit_users INTEGER DEFAULT 5,
  limit_leads INTEGER DEFAULT 1000,
  limit_products INTEGER DEFAULT 100,
  limit_whatsapp_instances INTEGER DEFAULT 1,
  limit_ai_tokens_monthly INTEGER DEFAULT 100000,
  limit_storage_mb INTEGER DEFAULT 500,
  
  -- Overrides promocionais/especiais
  overrides JSONB DEFAULT '{}',
  override_reason TEXT,
  overridden_by UUID,
  overridden_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela user_limits - Limites por Usuário Individual
CREATE TABLE public.user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Limites individuais (NULL = herda do tenant)
  ai_tokens_monthly INTEGER,
  storage_mb INTEGER,
  messages_monthly INTEGER,
  api_calls_monthly INTEGER,
  
  -- Permissões individuais (NULL = herda do tenant)
  can_use_ai BOOLEAN,
  can_transcribe BOOLEAN,
  can_use_api BOOLEAN,
  can_send_campaigns BOOLEAN,
  can_manage_automations BOOLEAN,
  
  -- Metadata
  configured_by UUID,
  configured_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, tenant_id)
);

-- 3. Tabela billing_subscriptions - Assinatura/Pagamento
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise')),
  status TEXT DEFAULT 'trial' CHECK (status IN ('active', 'trialing', 'past_due', 'unpaid', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  cancelled_at TIMESTAMPTZ,
  external_subscription_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id)
);

-- 4. Tabela user_usage - Consumo por Usuário
CREATE TABLE public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Consumo de IA
  ai_tokens_month INTEGER DEFAULT 0,
  ai_tokens_total INTEGER DEFAULT 0,
  
  -- Consumo de storage
  storage_bytes BIGINT DEFAULT 0,
  
  -- Consumo de transcrição
  transcription_seconds_month INTEGER DEFAULT 0,
  
  -- Consumo de mensagens
  messages_sent_month INTEGER DEFAULT 0,
  
  -- Consumo de API
  api_calls_month INTEGER DEFAULT 0,
  
  -- Período de billing
  billing_period_start TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, tenant_id)
);

-- 5. Adicionar colunas faltantes em tenant_usage (se existir)
DO $$
BEGIN
  -- Adicionar leads_count se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'leads_count') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN leads_count INTEGER DEFAULT 0;
  END IF;
  
  -- Adicionar products_count se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'products_count') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN products_count INTEGER DEFAULT 0;
  END IF;
  
  -- Adicionar whatsapp_instances_count se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'whatsapp_instances_count') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN whatsapp_instances_count INTEGER DEFAULT 0;
  END IF;
  
  -- Adicionar transcription_seconds_month se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'transcription_seconds_month') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN transcription_seconds_month INTEGER DEFAULT 0;
  END IF;
  
  -- Adicionar campaign_messages_month se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'campaign_messages_month') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN campaign_messages_month INTEGER DEFAULT 0;
  END IF;
  
  -- Adicionar last_calculated_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'last_calculated_at') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN last_calculated_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  -- Adicionar users_count se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_usage' AND column_name = 'users_count') THEN
    ALTER TABLE public.tenant_usage ADD COLUMN users_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 6. Função para incrementar tokens de IA do usuário
CREATE OR REPLACE FUNCTION public.increment_user_ai_tokens(
  _user_id UUID,
  _tokens INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- Buscar tenant_id do usuário
  SELECT tenant_id INTO _tenant_id FROM public.profiles WHERE id = _user_id;
  
  -- Atualizar ou inserir user_usage
  INSERT INTO public.user_usage (user_id, tenant_id, ai_tokens_month, ai_tokens_total)
  VALUES (_user_id, _tenant_id, _tokens, _tokens)
  ON CONFLICT (user_id, tenant_id) 
  DO UPDATE SET 
    ai_tokens_month = user_usage.ai_tokens_month + _tokens,
    ai_tokens_total = user_usage.ai_tokens_total + _tokens,
    last_updated_at = now();
    
  -- Atualizar tenant_usage
  UPDATE public.tenant_usage 
  SET ai_tokens_used = COALESCE(ai_tokens_used, 0) + _tokens,
      updated_at = now()
  WHERE tenant_id = _tenant_id;
END;
$$;

-- 7. Função para incrementar storage do usuário
CREATE OR REPLACE FUNCTION public.increment_user_storage(
  _user_id UUID,
  _bytes BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- Buscar tenant_id do usuário
  SELECT tenant_id INTO _tenant_id FROM public.profiles WHERE id = _user_id;
  
  -- Atualizar ou inserir user_usage
  INSERT INTO public.user_usage (user_id, tenant_id, storage_bytes)
  VALUES (_user_id, _tenant_id, _bytes)
  ON CONFLICT (user_id, tenant_id) 
  DO UPDATE SET 
    storage_bytes = user_usage.storage_bytes + _bytes,
    last_updated_at = now();
    
  -- Atualizar tenant_usage
  UPDATE public.tenant_usage 
  SET storage_used_mb = COALESCE(storage_used_mb, 0) + (_bytes / 1048576),
      updated_at = now()
  WHERE tenant_id = _tenant_id;
END;
$$;

-- 8. Função para resetar contadores mensais (para cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Resetar contadores de user_usage
  UPDATE public.user_usage SET 
    ai_tokens_month = 0,
    transcription_seconds_month = 0,
    messages_sent_month = 0,
    api_calls_month = 0,
    billing_period_start = now(),
    last_updated_at = now();
    
  -- Resetar contadores de tenant_usage
  UPDATE public.tenant_usage SET 
    ai_tokens_used = 0,
    messages_sent = 0,
    api_calls = 0,
    transcription_seconds_month = 0,
    campaign_messages_month = 0,
    updated_at = now();
END;
$$;

-- 9. Função para calcular/recalcular uso do tenant
CREATE OR REPLACE FUNCTION public.calculate_tenant_usage(_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _users_count INTEGER;
  _total_ai_tokens INTEGER;
  _total_storage BIGINT;
BEGIN
  -- Contar usuários do tenant
  SELECT COUNT(*) INTO _users_count 
  FROM public.profiles 
  WHERE tenant_id = _tenant_id;
  
  -- Somar tokens de IA dos usuários
  SELECT COALESCE(SUM(ai_tokens_month), 0) INTO _total_ai_tokens 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id;
  
  -- Somar storage dos usuários
  SELECT COALESCE(SUM(storage_bytes), 0) INTO _total_storage 
  FROM public.user_usage 
  WHERE tenant_id = _tenant_id;
  
  -- Atualizar ou inserir tenant_usage
  INSERT INTO public.tenant_usage (tenant_id, period_start, period_end, users_count, ai_tokens_used, storage_used_mb, last_calculated_at)
  VALUES (
    _tenant_id, 
    date_trunc('month', now()), 
    date_trunc('month', now()) + interval '1 month',
    _users_count, 
    _total_ai_tokens, 
    _total_storage / 1048576,
    now()
  )
  ON CONFLICT (tenant_id) 
  DO UPDATE SET 
    users_count = _users_count,
    ai_tokens_used = _total_ai_tokens,
    storage_used_mb = _total_storage / 1048576,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- 10. Habilitar RLS nas novas tabelas
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para tenant_features
CREATE POLICY "Master users can manage tenant_features"
ON public.tenant_features
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
);

CREATE POLICY "Tenant admins can read own tenant_features"
ON public.tenant_features
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);

-- 12. Políticas RLS para user_limits
CREATE POLICY "Master users can manage user_limits"
ON public.user_limits
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
);

CREATE POLICY "Tenant admins can manage own tenant user_limits"
ON public.user_limits
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p
    WHERE p.id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p
    WHERE p.id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can read own user_limits"
ON public.user_limits
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 13. Políticas RLS para billing_subscriptions
CREATE POLICY "Master users can manage billing_subscriptions"
ON public.billing_subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
);

CREATE POLICY "Tenant admins can read own billing_subscriptions"
ON public.billing_subscriptions
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);

-- 14. Políticas RLS para user_usage
CREATE POLICY "Master users can read user_usage"
ON public.user_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.master_users mu
    WHERE mu.user_id = auth.uid() AND mu.is_active = true
  )
);

CREATE POLICY "Tenant admins can read own tenant user_usage"
ON public.user_usage
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can read own user_usage"
ON public.user_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 15. Triggers para updated_at
CREATE TRIGGER update_tenant_features_updated_at
BEFORE UPDATE ON public.tenant_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_limits_updated_at
BEFORE UPDATE ON public.user_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_subscriptions_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Índices para performance
CREATE INDEX idx_tenant_features_tenant_id ON public.tenant_features(tenant_id);
CREATE INDEX idx_user_limits_tenant_id ON public.user_limits(tenant_id);
CREATE INDEX idx_user_limits_user_id ON public.user_limits(user_id);
CREATE INDEX idx_billing_subscriptions_tenant_id ON public.billing_subscriptions(tenant_id);
CREATE INDEX idx_billing_subscriptions_status ON public.billing_subscriptions(status);
CREATE INDEX idx_user_usage_tenant_id ON public.user_usage(tenant_id);
CREATE INDEX idx_user_usage_user_id ON public.user_usage(user_id);