-- ========================================
-- FUNÇÃO AUXILIAR PRIMEIRO
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========================================
-- FASE 1: Sistema de Roles Seguro
-- ========================================

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'viewer');

-- 2. Criar tabela de roles separada (evita escalation attacks)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, tenant_id)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função SECURITY DEFINER para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para verificar role em tenant específico
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND tenant_id = _tenant_id
          AND role = _role
    )
$$;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- 4. Políticas RLS para user_roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their tenant"
ON public.user_roles
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT ur.tenant_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT ur.tenant_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
    AND role != 'super_admin'
);

-- ========================================
-- FASE 2: Sistema de Logs de Auditoria
-- ========================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view tenant logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT ur.tenant_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
);

CREATE OR REPLACE FUNCTION public.log_audit(
    _user_id UUID,
    _tenant_id UUID,
    _action TEXT,
    _entity_type TEXT,
    _entity_id UUID DEFAULT NULL,
    _old_values JSONB DEFAULT NULL,
    _new_values JSONB DEFAULT NULL,
    _ip_address INET DEFAULT NULL,
    _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, tenant_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
    )
    VALUES (
        _user_id, _tenant_id, _action, _entity_type, _entity_id,
        _old_values, _new_values, _ip_address, _user_agent
    )
    RETURNING id INTO _log_id;
    
    RETURN _log_id;
END;
$$;

-- ========================================
-- FASE 3: Webhooks System
-- ========================================

CREATE TABLE public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    attempt_number INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhooks_tenant ON public.webhooks(tenant_id);
CREATE INDEX idx_webhook_logs_webhook ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created ON public.webhook_logs(created_at DESC);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhooks"
ON public.webhooks
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT ur.tenant_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT ur.tenant_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Super admins can manage all webhooks"
ON public.webhooks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs
FOR SELECT
TO authenticated
USING (
    webhook_id IN (
        SELECT w.id FROM public.webhooks w
        JOIN public.user_roles ur ON ur.tenant_id = w.tenant_id
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
);

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();