-- Políticas RLS para onboarding_submissions

-- 1. Permitir INSERT público (formulário de cadastro)
CREATE POLICY "Permitir cadastro público"
ON public.onboarding_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Permitir SELECT apenas para usuários autenticados (admins)
CREATE POLICY "Admins podem visualizar cadastros"
ON public.onboarding_submissions
FOR SELECT
TO authenticated
USING (true);

-- 3. Permitir UPDATE apenas para usuários autenticados (admins)
CREATE POLICY "Admins podem atualizar cadastros"
ON public.onboarding_submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);