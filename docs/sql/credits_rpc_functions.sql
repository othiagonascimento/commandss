-- =====================================================
-- FUNÇÕES RPC DE AGREGAÇÃO DE CRÉDITOS (v5 - Filtro por Período)
-- Execute este SQL no Supabase Dashboard (SQL Editor)
-- Projeto: btoyclznuuwvxbsacemw
-- =====================================================
-- IMPORTANTE: Agora aceita parâmetros opcionais de período
-- Se não informados, usa o mês atual. Se informados, filtra pelo intervalo.
-- =====================================================

-- Limpa versões anteriores para evitar conflitos
DROP FUNCTION IF EXISTS public.get_global_credits_summary();
DROP FUNCTION IF EXISTS public.get_global_credits_summary(date, date);
DROP FUNCTION IF EXISTS public.get_top_credit_consumers(integer);
DROP FUNCTION IF EXISTS public.get_top_credit_consumers(integer, date, date);
DROP FUNCTION IF EXISTS public.get_tenant_credits_summary(uuid);
DROP FUNCTION IF EXISTS public.get_tenant_credits_summary(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_tenant_user_credits(uuid);
DROP FUNCTION IF EXISTS public.get_tenant_user_credits(uuid, date, date);

-- 1. get_global_credits_summary: Resume consumo global de todos os tenants
-- Aceita período opcional (p_start, p_end). Se NULL, usa mês corrente ou último disponível.
CREATE OR REPLACE FUNCTION public.get_global_credits_summary(
  p_start DATE DEFAULT NULL,
  p_end DATE DEFAULT NULL
)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  total_tenants_with_usage BIGINT,
  period_start DATE,
  period_end DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE;
  v_end DATE;
BEGIN
  -- Se não passou período, busca registros que contêm a data atual
  -- ou pega o último período disponível
  IF p_start IS NULL OR p_end IS NULL THEN
    SELECT tu.period_start, tu.period_end INTO v_start, v_end
    FROM tenant_usage tu
    ORDER BY 
      CASE WHEN tu.period_start <= CURRENT_DATE AND tu.period_end >= CURRENT_DATE THEN 0 ELSE 1 END,
      tu.period_end DESC
    LIMIT 1;
    
    -- Fallback para mês atual se nenhum registro existe
    IF v_start IS NULL THEN
      v_start := date_trunc('month', CURRENT_DATE)::DATE;
      v_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;
  ELSE
    v_start := p_start;
    v_end := p_end;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.ai_credits_used), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    COUNT(DISTINCT tu.tenant_id)::BIGINT,
    v_start,
    v_end
  FROM public.tenant_usage tu
  WHERE tu.period_start >= v_start 
    AND tu.period_end <= v_end;
END;
$$;

-- 2. get_top_credit_consumers: Top N tenants por consumo
CREATE OR REPLACE FUNCTION public.get_top_credit_consumers(
  limit_count INTEGER DEFAULT 10,
  p_start DATE DEFAULT NULL,
  p_end DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  credits_consumed BIGINT,
  cost_brl NUMERIC,
  api_calls BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE;
  v_end DATE;
BEGIN
  -- Determina período
  IF p_start IS NULL OR p_end IS NULL THEN
    SELECT tu.period_start, tu.period_end INTO v_start, v_end
    FROM tenant_usage tu
    ORDER BY 
      CASE WHEN tu.period_start <= CURRENT_DATE AND tu.period_end >= CURRENT_DATE THEN 0 ELSE 1 END,
      tu.period_end DESC
    LIMIT 1;
    
    IF v_start IS NULL THEN
      v_start := date_trunc('month', CURRENT_DATE)::DATE;
      v_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;
  ELSE
    v_start := p_start;
    v_end := p_end;
  END IF;

  RETURN QUERY
  SELECT 
    tu.tenant_id,
    COALESCE(t.name, 'Desconhecido')::TEXT,
    COALESCE(tu.ai_credits_used, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM public.tenant_usage tu
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.period_start >= v_start 
    AND tu.period_end <= v_end
  ORDER BY tu.ai_credits_used DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- 3. get_tenant_credits_summary: Resume consumo de um tenant específico
CREATE OR REPLACE FUNCTION public.get_tenant_credits_summary(
  p_tenant_id UUID,
  p_start DATE DEFAULT NULL,
  p_end DATE DEFAULT NULL
)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  users_with_usage BIGINT,
  period_start DATE,
  period_end DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE;
  v_end DATE;
BEGIN
  -- Determina período
  IF p_start IS NULL OR p_end IS NULL THEN
    SELECT tu.period_start, tu.period_end INTO v_start, v_end
    FROM tenant_usage tu
    WHERE tu.tenant_id = p_tenant_id
    ORDER BY 
      CASE WHEN tu.period_start <= CURRENT_DATE AND tu.period_end >= CURRENT_DATE THEN 0 ELSE 1 END,
      tu.period_end DESC
    LIMIT 1;
    
    IF v_start IS NULL THEN
      v_start := date_trunc('month', CURRENT_DATE)::DATE;
      v_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;
  ELSE
    v_start := p_start;
    v_end := p_end;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(tu.ai_credits_used, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT,
    (SELECT COUNT(DISTINCT uu.user_id) 
     FROM public.user_usage uu 
     WHERE uu.tenant_id = p_tenant_id 
     AND uu.credits_consumed_month > 0)::BIGINT,
    tu.period_start,
    tu.period_end
  FROM public.tenant_usage tu
  WHERE tu.tenant_id = p_tenant_id
    AND tu.period_start >= v_start 
    AND tu.period_end <= v_end
  LIMIT 1;
END;
$$;

-- 4. get_tenant_user_credits: Consumo detalhado por usuário de um tenant
CREATE OR REPLACE FUNCTION public.get_tenant_user_credits(
  p_tenant_id UUID,
  p_start DATE DEFAULT NULL,
  p_end DATE DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  credits_consumed BIGINT,
  ai_tokens BIGINT,
  api_calls BIGINT,
  transcription_minutes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- user_usage não tem period_start/end, então filtramos pelo período ativo
  -- Os dados em user_usage são do mês corrente (resetados mensalmente)
  RETURN QUERY
  SELECT 
    uu.user_id,
    COALESCE(p.full_name, 'Usuário')::TEXT,
    COALESCE(p.role, 'seller')::TEXT,
    COALESCE(uu.credits_consumed_month, 0)::BIGINT,
    COALESCE(uu.ai_tokens_month, 0)::BIGINT,
    COALESCE(uu.api_calls_month, 0)::BIGINT,
    COALESCE(uu.transcription_seconds_month / 60, 0)::BIGINT
  FROM public.user_usage uu
  LEFT JOIN public.profiles p ON p.id = uu.user_id
  WHERE uu.tenant_id = p_tenant_id
    AND uu.credits_consumed_month > 0
  ORDER BY uu.credits_consumed_month DESC;
END;
$$;

-- 5. Permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_global_credits_summary(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_credit_consumers(INTEGER, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_credits_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_user_credits(UUID, DATE, DATE) TO authenticated;

-- 6. Forçar reload do schema no PostgREST
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICAÇÃO (execute após criar as funções)
-- =====================================================

-- Teste get_global_credits_summary SEM parâmetros (usa período atual ou último disponível)
-- SELECT * FROM get_global_credits_summary();

-- Teste get_global_credits_summary COM período específico (janeiro 2026)
-- SELECT * FROM get_global_credits_summary('2026-01-01'::DATE, '2026-01-31'::DATE);

-- Teste get_top_credit_consumers com período de janeiro
-- SELECT * FROM get_top_credit_consumers(5, '2026-01-01'::DATE, '2026-01-31'::DATE);

-- Teste get_tenant_credits_summary do Master (período janeiro)
-- SELECT * FROM get_tenant_credits_summary('00000000-0000-0000-0000-000000000001', '2026-01-01'::DATE, '2026-01-31'::DATE);

-- Teste get_tenant_user_credits
-- SELECT * FROM get_tenant_user_credits('00000000-0000-0000-0000-000000000001');
