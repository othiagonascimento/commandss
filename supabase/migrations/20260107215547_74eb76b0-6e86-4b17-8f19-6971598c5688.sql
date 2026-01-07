-- Create master_roles table for flexible role definitions
CREATE TABLE public.master_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create master_users table to store master panel users
CREATE TABLE public.master_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Create master_user_roles junction table
CREATE TABLE public.master_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_user_id UUID NOT NULL REFERENCES public.master_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.master_roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE(master_user_id, role_id)
);

-- Create permissions table for granular access control
CREATE TABLE public.master_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.master_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.master_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.master_permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.master_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Super admins can do everything
CREATE POLICY "Super admins can manage roles" ON public.master_roles
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view roles" ON public.master_roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage master users" ON public.master_users
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view master users" ON public.master_users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage user roles" ON public.master_user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view user roles" ON public.master_user_roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage permissions" ON public.master_permissions
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view permissions" ON public.master_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage role permissions" ON public.master_role_permissions
    FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view role permissions" ON public.master_role_permissions
    FOR SELECT TO authenticated USING (true);

-- Insert default roles
INSERT INTO public.master_roles (name, display_name, description, color) VALUES
    ('super_admin', 'Super Admin', 'Acesso total ao sistema', '#dc2626'),
    ('implementador', 'Implementador', 'Responsável pela implantação e configuração de clientes', '#2563eb'),
    ('vendedor', 'Vendedor', 'Equipe comercial e vendas', '#16a34a'),
    ('marketing', 'Marketing', 'Equipe de marketing e comunicação', '#9333ea'),
    ('administrativo', 'Administrativo', 'Equipe administrativa', '#ca8a04'),
    ('financeiro', 'Financeiro', 'Equipe financeira', '#0891b2');

-- Insert default permissions
INSERT INTO public.master_permissions (code, name, description, category) VALUES
    -- Dashboard
    ('dashboard.view', 'Ver Dashboard', 'Acesso ao dashboard principal', 'Dashboard'),
    ('dashboard.analytics', 'Ver Analytics', 'Acesso a métricas e análises', 'Dashboard'),
    
    -- Clientes
    ('tenants.view', 'Ver Clientes', 'Visualizar lista de clientes', 'Clientes'),
    ('tenants.create', 'Criar Clientes', 'Cadastrar novos clientes', 'Clientes'),
    ('tenants.edit', 'Editar Clientes', 'Modificar dados de clientes', 'Clientes'),
    ('tenants.delete', 'Remover Clientes', 'Desativar clientes', 'Clientes'),
    ('tenants.impersonate', 'Impersonar Clientes', 'Acessar como cliente', 'Clientes'),
    
    -- Templates IA
    ('templates.view', 'Ver Templates', 'Visualizar templates de IA', 'Templates IA'),
    ('templates.create', 'Criar Templates', 'Criar novos templates', 'Templates IA'),
    ('templates.edit', 'Editar Templates', 'Modificar templates existentes', 'Templates IA'),
    ('templates.publish', 'Publicar Templates', 'Publicar templates para produção', 'Templates IA'),
    
    -- Comercial
    ('subscriptions.view', 'Ver Assinaturas', 'Visualizar assinaturas', 'Comercial'),
    ('subscriptions.manage', 'Gerenciar Assinaturas', 'Alterar planos e assinaturas', 'Comercial'),
    ('contracts.create', 'Criar Contratos', 'Gerar novos contratos', 'Comercial'),
    ('invite_links.manage', 'Gerenciar Links', 'Criar e gerenciar links de convite', 'Comercial'),
    
    -- Sistema
    ('users.view', 'Ver Usuários', 'Visualizar usuários do master', 'Sistema'),
    ('users.manage', 'Gerenciar Usuários', 'Adicionar e remover usuários', 'Sistema'),
    ('roles.manage', 'Gerenciar Cargos', 'Criar e editar cargos e permissões', 'Sistema'),
    ('settings.view', 'Ver Configurações', 'Acessar configurações do sistema', 'Sistema'),
    ('settings.edit', 'Editar Configurações', 'Modificar configurações', 'Sistema'),
    ('broadcasts.manage', 'Gerenciar Broadcasts', 'Enviar comunicados', 'Sistema'),
    ('feature_flags.manage', 'Gerenciar Feature Flags', 'Controlar funcionalidades', 'Sistema');

-- Grant all permissions to super_admin role
INSERT INTO public.master_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.master_roles r
CROSS JOIN public.master_permissions p
WHERE r.name = 'super_admin';

-- Create triggers for updated_at
CREATE TRIGGER update_master_roles_updated_at
    BEFORE UPDATE ON public.master_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_users_updated_at
    BEFORE UPDATE ON public.master_users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check master permission
CREATE OR REPLACE FUNCTION public.has_master_permission(_user_id UUID, _permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.master_users mu
        JOIN public.master_user_roles mur ON mur.master_user_id = mu.id
        JOIN public.master_role_permissions mrp ON mrp.role_id = mur.role_id
        JOIN public.master_permissions mp ON mp.id = mrp.permission_id
        WHERE mu.user_id = _user_id
          AND mu.is_active = true
          AND mp.code = _permission_code
    )
$$;