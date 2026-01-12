-- Habilitar RLS na tabela ai_available_models
ALTER TABLE public.ai_available_models ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura por usuários autenticados
CREATE POLICY "Allow authenticated read ai_available_models" 
ON public.ai_available_models 
FOR SELECT 
TO authenticated 
USING (true);