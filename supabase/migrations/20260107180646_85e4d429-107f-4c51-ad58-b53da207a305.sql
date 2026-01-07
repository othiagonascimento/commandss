-- Create tenant_branding table
CREATE TABLE public.tenant_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name TEXT,
  tagline TEXT,
  logo_url TEXT,
  logo_white_url TEXT,
  symbol_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#22d3ee',
  text_color TEXT DEFAULT '#1f2937',
  background_color TEXT DEFAULT '#ffffff',
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT 'md',
  login_background_url TEXT,
  email_header_html TEXT,
  footer_text TEXT,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

-- Admins can view their tenant branding
CREATE POLICY "Admins can view tenant branding"
ON public.tenant_branding
FOR SELECT
USING (
  tenant_id IN (
    SELECT ur.tenant_id FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Super admins can manage all branding
CREATE POLICY "Super admins manage all branding"
ON public.tenant_branding
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_branding_updated_at
BEFORE UPDATE ON public.tenant_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant-assets bucket
CREATE POLICY "Anyone can view tenant assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tenant-assets');

CREATE POLICY "Admins can upload tenant assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-assets' 
  AND has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins can update tenant assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tenant-assets' 
  AND has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins can delete tenant assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tenant-assets' 
  AND has_role(auth.uid(), 'super_admin')
);