-- Política para usuários lerem seu próprio perfil
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Política para leitura do tenant master (para verificação)
CREATE POLICY "Users can read their tenant"
ON public.tenants
FOR SELECT
USING (
  id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);