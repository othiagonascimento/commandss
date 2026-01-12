-- Criar bucket para arquivos de onboarding
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-files', 'onboarding-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload público (onboarding é público)
CREATE POLICY "Anyone can upload onboarding files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'onboarding-files');

-- Policy para leitura pública
CREATE POLICY "Onboarding files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding-files');

-- Policy para master users deletarem
CREATE POLICY "Master users can delete onboarding files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'onboarding-files' 
  AND EXISTS (SELECT 1 FROM master_users WHERE user_id = auth.uid() AND is_active = true)
);