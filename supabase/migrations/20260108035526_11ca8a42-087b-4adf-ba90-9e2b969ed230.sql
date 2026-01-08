-- =============================================
-- TABELA DE PLANOS COM LIMITES
-- =============================================

-- Criar tabela de planos
CREATE TABLE public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    
    -- Preços
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Limites de recursos
    max_users INTEGER NOT NULL DEFAULT 1,
    max_leads INTEGER,
    max_products INTEGER,
    max_channels INTEGER NOT NULL DEFAULT 1,
    max_storage_gb INTEGER NOT NULL DEFAULT 5,
    max_ai_tokens INTEGER NOT NULL DEFAULT 100000,
    max_messages_month INTEGER,
    max_automations INTEGER,
    
    -- Features habilitadas (JSON array de slugs)
    features_enabled JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Ordem de exibição
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active plans"
    ON public.plans
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Master users can manage plans"
    ON public.plans
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.master_users mu
        WHERE mu.user_id = auth.uid() AND mu.is_active = true
    ));

-- Inserir planos padrão
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, max_users, max_leads, max_products, max_channels, max_storage_gb, max_ai_tokens, max_messages_month, max_automations, features_enabled, display_order, is_default)
VALUES 
    ('Basic', 'basic', 'Plano essencial para começar', 69.00, 690.00, 1, 500, 100, 1, 5, 50000, 1000, 5, '["crm", "leads", "catalog"]'::jsonb, 1, true),
    ('Pro', 'pro', 'Recursos avançados para escalar', 149.00, 1490.00, 5, 2000, 500, 3, 20, 200000, 5000, 20, '["crm", "leads", "catalog", "automations", "whatsapp", "ai_assistant", "branding"]'::jsonb, 2, false),
    ('Enterprise', 'enterprise', 'Tudo incluído + customização', 399.00, 3990.00, -1, -1, -1, 10, 100, 1000000, -1, -1, '["crm", "leads", "catalog", "automations", "whatsapp", "ai_assistant", "branding", "api_access", "custom_domain", "priority_support", "dedicated_success"]'::jsonb, 3, false);

-- Adicionar coluna plan_id na tabela tenants
ALTER TABLE public.tenants
    ADD COLUMN plan_id UUID REFERENCES public.plans(id);

-- Adicionar coluna limits_override para sobrescrever limites do plano
ALTER TABLE public.tenants
    ADD COLUMN limits_override JSONB DEFAULT NULL;

-- =============================================
-- TABELA DE DOMÍNIOS PRÓPRIOS
-- =============================================

CREATE TABLE public.tenant_domains (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Domínio
    domain TEXT NOT NULL UNIQUE,
    domain_type TEXT NOT NULL DEFAULT 'custom' CHECK (domain_type IN ('subdomain', 'custom')),
    
    -- Status do domínio
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'active', 'failed', 'expired')),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- Verificação DNS
    verification_token TEXT,
    dns_configured BOOLEAN NOT NULL DEFAULT false,
    ssl_provisioned BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    verified_at TIMESTAMP WITH TIME ZONE,
    last_check_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Quem configurou
    created_by UUID,
    
    -- Notas/erros
    notes TEXT,
    last_error TEXT
);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_tenant_domains_updated_at
    BEFORE UPDATE ON public.tenant_domains
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON public.tenant_domains(domain);
CREATE INDEX idx_tenant_domains_status ON public.tenant_domains(status);

-- Habilitar RLS
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant admins can view their domains"
    ON public.tenant_domains
    FOR SELECT
    USING (tenant_id IN (
        SELECT ur.tenant_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Master users can manage all domains"
    ON public.tenant_domains
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.master_users mu
        WHERE mu.user_id = auth.uid() AND mu.is_active = true
    ));

-- Atualizar tenant existente com plan_id baseado no plan_type
UPDATE public.tenants t
SET plan_id = p.id
FROM public.plans p
WHERE t.plan_type = p.slug;