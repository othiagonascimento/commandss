-- 1. Remover política problemática de user_roles que causa recursão
DROP POLICY IF EXISTS "Admins can manage roles in their tenant" ON public.user_roles;

-- 2. Remover políticas duplicadas de onboarding_submissions (se existirem)
DROP POLICY IF EXISTS "Admins can view submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Public can submit onboarding" ON public.onboarding_submissions;

-- As políticas corretas já existem:
-- "Permitir cadastro público" (INSERT)
-- "Admins podem visualizar cadastros" (SELECT)
-- "Admins podem atualizar cadastros" (UPDATE)