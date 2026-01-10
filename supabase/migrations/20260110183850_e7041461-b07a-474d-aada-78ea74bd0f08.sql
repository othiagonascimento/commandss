-- Tabela para registrar cada chamada de API
CREATE TABLE public.api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identificação da API
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'whisper'
  model TEXT NOT NULL, -- 'gpt-4o', 'claude-3-sonnet', 'gemini-1.5-pro'
  operation TEXT NOT NULL DEFAULT 'chat', -- 'chat', 'transcription', 'embedding', 'image'
  
  -- Métricas de uso
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  audio_seconds INTEGER DEFAULT 0, -- Para transcrições
  image_count INTEGER DEFAULT 0, -- Para geração de imagens
  
  -- Custos calculados (em BRL)
  cost_usd NUMERIC(12,8) DEFAULT 0,
  cost_brl NUMERIC(12,6) DEFAULT 0,
  
  -- Metadados
  request_id TEXT,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_api_usage_logs_user ON public.api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_tenant ON public.api_usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_provider ON public.api_usage_logs(provider, created_at DESC);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);

-- Tabela de configuração de custos por modelo
CREATE TABLE public.api_cost_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  model TEXT NOT NULL, -- 'gpt-4o', 'claude-3-sonnet', etc.
  operation TEXT NOT NULL DEFAULT 'chat',
  display_name TEXT, -- Nome amigável
  
  -- Custos em USD (fonte original)
  input_cost_per_1m_usd NUMERIC(12,6) DEFAULT 0, -- Custo por 1M tokens de input
  output_cost_per_1m_usd NUMERIC(12,6) DEFAULT 0, -- Custo por 1M tokens de output
  audio_cost_per_minute_usd NUMERIC(10,6) DEFAULT 0, -- Para Whisper
  image_cost_per_unit_usd NUMERIC(10,6) DEFAULT 0, -- Para DALL-E
  
  -- Taxa de conversão global
  usd_to_brl_rate NUMERIC(8,4) DEFAULT 5.50,
  
  -- Markup (margem de lucro)
  markup_percent NUMERIC(5,2) DEFAULT 0, -- Ex: 10 = +10%
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(provider, model, operation)
);

-- Inserir custos iniciais dos principais modelos (preços de Jan 2025)
INSERT INTO public.api_cost_config (provider, model, operation, display_name, input_cost_per_1m_usd, output_cost_per_1m_usd) VALUES
-- OpenAI
('openai', 'gpt-4o', 'chat', 'GPT-4o', 2.50, 10.00),
('openai', 'gpt-4o-mini', 'chat', 'GPT-4o Mini', 0.15, 0.60),
('openai', 'gpt-4-turbo', 'chat', 'GPT-4 Turbo', 10.00, 30.00),
('openai', 'gpt-3.5-turbo', 'chat', 'GPT-3.5 Turbo', 0.50, 1.50),
('openai', 'text-embedding-3-small', 'embedding', 'Embedding Small', 0.02, 0),
('openai', 'text-embedding-3-large', 'embedding', 'Embedding Large', 0.13, 0),
-- Anthropic
('anthropic', 'claude-3-5-sonnet', 'chat', 'Claude 3.5 Sonnet', 3.00, 15.00),
('anthropic', 'claude-3-opus', 'chat', 'Claude 3 Opus', 15.00, 75.00),
('anthropic', 'claude-3-haiku', 'chat', 'Claude 3 Haiku', 0.25, 1.25),
-- Google
('google', 'gemini-1.5-pro', 'chat', 'Gemini 1.5 Pro', 1.25, 5.00),
('google', 'gemini-1.5-flash', 'chat', 'Gemini 1.5 Flash', 0.075, 0.30),
('google', 'gemini-2.0-flash', 'chat', 'Gemini 2.0 Flash', 0.10, 0.40);

-- Inserir custo de transcrição Whisper
INSERT INTO public.api_cost_config (provider, model, operation, display_name, audio_cost_per_minute_usd) VALUES
('openai', 'whisper-1', 'transcription', 'Whisper', 0.006);

-- Inserir custo de imagens DALL-E
INSERT INTO public.api_cost_config (provider, model, operation, display_name, image_cost_per_unit_usd) VALUES
('openai', 'dall-e-3', 'image', 'DALL-E 3 (1024x1024)', 0.04),
('openai', 'dall-e-3-hd', 'image', 'DALL-E 3 HD (1024x1792)', 0.08);

-- RLS para api_usage_logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master users can manage all api usage logs"
ON public.api_usage_logs FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

CREATE POLICY "Tenant admins can view their api usage logs"
ON public.api_usage_logs FOR SELECT
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Users can view their own api usage logs"
ON public.api_usage_logs FOR SELECT
USING (user_id = auth.uid());

-- RLS para api_cost_config
ALTER TABLE public.api_cost_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read api cost config"
ON public.api_cost_config FOR SELECT
USING (true);

CREATE POLICY "Master users can manage api cost config"
ON public.api_cost_config FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_api_cost_config_updated_at
BEFORE UPDATE ON public.api_cost_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();