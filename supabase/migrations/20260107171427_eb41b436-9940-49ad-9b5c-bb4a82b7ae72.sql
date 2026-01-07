-- =====================================================
-- 1. TABELA DE TEMPLATES DE NICHO
-- =====================================================
CREATE TABLE public.niche_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    prompts JSONB DEFAULT '[]'::jsonb,
    flows JSONB DEFAULT '[]'::jsonb,
    kanban_tags JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. TABELA DE CHECKLIST DE ONBOARDING
-- =====================================================
CREATE TYPE public.onboarding_status AS ENUM (
    'pending',
    'configuring', 
    'whatsapp_connected',
    'training_done',
    'go_live'
);

CREATE TABLE public.tenant_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status onboarding_status DEFAULT 'pending',
    niche_template_id UUID REFERENCES public.niche_templates(id),
    assigned_implementer_id UUID,
    checklist JSONB DEFAULT '{
        "basic_config": false,
        "whatsapp_connected": false,
        "team_trained": false,
        "first_flow_created": false,
        "go_live_approved": false
    }'::jsonb,
    notes TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id)
);

-- =====================================================
-- 3. TABELA DE SESSÕES DE IMPERSONATE
-- =====================================================
CREATE TABLE public.impersonate_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    target_tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    target_user_id UUID,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida por token
CREATE INDEX idx_impersonate_token ON public.impersonate_sessions(token);
CREATE INDEX idx_impersonate_expires ON public.impersonate_sessions(expires_at);

-- =====================================================
-- 4. TABELA DE LINKS DE CONVITE (VENDEDOR)
-- =====================================================
CREATE TABLE public.invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    sales_rep_id UUID NOT NULL,
    plan_type TEXT DEFAULT 'starter',
    trial_days INTEGER DEFAULT 30,
    discount_percent NUMERIC DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por código
CREATE INDEX idx_invite_code ON public.invite_links(code);

-- =====================================================
-- 5. TABELA DE ATRIBUIÇÃO DE VENDEDOR
-- =====================================================
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS sales_rep_id UUID,
ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'organic',
ADD COLUMN IF NOT EXISTS invite_link_id UUID REFERENCES public.invite_links(id);

-- =====================================================
-- 6. TABELA DE FEATURE FLAGS
-- =====================================================
CREATE TABLE public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled_globally BOOLEAN DEFAULT false,
    enabled_tenant_ids UUID[] DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. TABELA DE PROMPTS MESTRE (POR NICHO)
-- =====================================================
CREATE TABLE public.master_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche_template_id UUID REFERENCES public.niche_templates(id),
    name TEXT NOT NULL,
    prompt_type TEXT NOT NULL, -- 'sales', 'support', 'followup', etc.
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. TABELA DE BROADCASTS (AVISOS)
-- =====================================================
CREATE TABLE public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'feature'
    target_tenant_ids UUID[], -- NULL = todos
    target_niche TEXT, -- NULL = todos
    is_banner BOOLEAN DEFAULT true,
    is_push BOOLEAN DEFAULT false,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. TABELA DE USO/CONSUMO (UNIT ECONOMICS)
-- =====================================================
CREATE TABLE public.tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    ai_tokens_used BIGINT DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    estimated_cost_brl NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, period_start)
);

-- Índice para busca por tenant e período
CREATE INDEX idx_tenant_usage ON public.tenant_usage(tenant_id, period_start);

-- =====================================================
-- 10. TABELA DE INADIMPLÊNCIA
-- =====================================================
CREATE TABLE public.payment_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    attempt_number INTEGER DEFAULT 1,
    amount_brl NUMERIC(10,2),
    failure_reason TEXT,
    blocked_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Campo de bloqueio no tenant
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE public.niche_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Niche Templates: Super admins podem tudo, outros podem ler
CREATE POLICY "Super admins manage niche templates"
ON public.niche_templates FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can read active templates"
ON public.niche_templates FOR SELECT
USING (is_active = true);

-- Tenant Onboarding: Admins e implementadores podem ver/editar
CREATE POLICY "Super admins manage all onboarding"
ON public.tenant_onboarding FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view tenant onboarding"
ON public.tenant_onboarding FOR SELECT
USING (tenant_id IN (
    SELECT ur.tenant_id FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
));

-- Impersonate: Apenas super admins
CREATE POLICY "Super admins manage impersonate sessions"
ON public.impersonate_sessions FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Invite Links: Vendedores podem ver seus próprios links
CREATE POLICY "Super admins manage all invite links"
ON public.invite_links FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Sales reps can manage their own links"
ON public.invite_links FOR ALL
USING (sales_rep_id = auth.uid());

-- Feature Flags: Apenas super admins
CREATE POLICY "Super admins manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can read feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- Master Prompts: Super admins podem tudo
CREATE POLICY "Super admins manage master prompts"
ON public.master_prompts FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can read active prompts"
ON public.master_prompts FOR SELECT
USING (is_active = true);

-- Broadcasts: Super admins podem tudo
CREATE POLICY "Super admins manage broadcasts"
ON public.broadcasts FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can read broadcasts"
ON public.broadcasts FOR SELECT
USING (
    starts_at <= now() 
    AND (ends_at IS NULL OR ends_at > now())
);

-- Tenant Usage: Admins podem ver do seu tenant
CREATE POLICY "Super admins view all usage"
ON public.tenant_usage FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins view tenant usage"
ON public.tenant_usage FOR SELECT
USING (tenant_id IN (
    SELECT ur.tenant_id FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
));

-- Payment Failures: Super admins podem tudo
CREATE POLICY "Super admins manage payment failures"
ON public.payment_failures FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =====================================================
CREATE TRIGGER update_niche_templates_updated_at
BEFORE UPDATE ON public.niche_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_onboarding_updated_at
BEFORE UPDATE ON public.tenant_onboarding
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invite_links_updated_at
BEFORE UPDATE ON public.invite_links
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_prompts_updated_at
BEFORE UPDATE ON public.master_prompts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_usage_updated_at
BEFORE UPDATE ON public.tenant_usage
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERIR TEMPLATES DE EXEMPLO
-- =====================================================
INSERT INTO public.niche_templates (name, slug, description, prompts, flows, kanban_tags) VALUES
('Veículos', 'veiculos', 'Template otimizado para concessionárias e revendas de veículos', 
 '[{"name": "Atendimento Inicial", "content": "Você é um vendedor especializado em veículos..."}, {"name": "Qualificação", "content": "Identifique o perfil do cliente..."}]'::jsonb,
 '[{"name": "Fluxo de Venda de Veículo", "steps": ["Primeiro contato", "Agendamento visita", "Test drive", "Proposta", "Fechamento"]}]'::jsonb,
 '["Novo", "Usado", "Financiamento", "Consórcio", "Troca"]'::jsonb),
 
('Imobiliário', 'imobiliario', 'Template para corretores e imobiliárias',
 '[{"name": "Captação", "content": "Você é um corretor de imóveis especializado..."}, {"name": "Visita", "content": "Prepare o cliente para a visita..."}]'::jsonb,
 '[{"name": "Fluxo de Venda de Imóvel", "steps": ["Lead", "Qualificação", "Visita", "Proposta", "Documentação", "Escritura"]}]'::jsonb,
 '["Compra", "Venda", "Aluguel", "Lançamento", "Permuta"]'::jsonb),
 
('E-commerce', 'ecommerce', 'Template para lojas virtuais e marketplaces',
 '[{"name": "Suporte", "content": "Você é um atendente de e-commerce..."}, {"name": "Pós-venda", "content": "Acompanhe a entrega e satisfação..."}]'::jsonb,
 '[{"name": "Fluxo de Atendimento", "steps": ["Dúvida", "Pedido", "Rastreio", "Troca/Devolução", "Finalizado"]}]'::jsonb,
 '["Dúvida", "Pedido", "Troca", "Devolução", "Elogio"]'::jsonb);

-- Inserir feature flags padrão
INSERT INTO public.feature_flags (name, description, is_enabled_globally) VALUES
('ai_transcription_v2', 'Nova versão da transcrição de áudio com IA', false),
('bulk_messaging', 'Envio em massa de mensagens', true),
('advanced_analytics', 'Dashboard de analytics avançado', false),
('api_access', 'Acesso à API pública', false);