-- Create master_settings table for persisting system configurations
CREATE TABLE public.master_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.master_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage settings
CREATE POLICY "Super admins can manage settings"
ON public.master_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Authenticated users can read settings
CREATE POLICY "Authenticated users can read settings"
ON public.master_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.master_settings (key, value, category, description) VALUES
('system_name', '"UOPA Master"', 'general', 'Nome do sistema'),
('support_email', '"suporte@uopa.com.br"', 'general', 'Email de suporte'),
('default_language', '"pt-BR"', 'general', 'Idioma padrão'),
('dark_mode_default', 'true', 'appearance', 'Tema escuro por padrão'),
('animations_enabled', 'true', 'appearance', 'Animações ativadas'),
('email_notifications', 'true', 'notifications', 'Notificações por email'),
('new_tenant_notification', 'true', 'notifications', 'Notificar novo tenant'),
('payment_notification', 'true', 'notifications', 'Notificar pagamentos'),
('error_alerts', 'true', 'notifications', 'Alertas de erro'),
('two_factor_enabled', 'false', 'security', '2FA obrigatório'),
('session_timeout', '30', 'security', 'Timeout de sessão (min)'),
('ip_whitelist', '""', 'security', 'IPs permitidos');

-- Create trigger for updated_at
CREATE TRIGGER update_master_settings_updated_at
    BEFORE UPDATE ON public.master_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();