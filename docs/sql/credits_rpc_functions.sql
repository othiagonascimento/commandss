-- =====================================================
-- FUNÇÕES RPC DE AGREGAÇÃO DE CRÉDITOS (v4 - Período Flexível)
-- Execute este SQL no Supabase Dashboard (SQL Editor)
-- Projeto: btoyclznuuwvxbsacemw
-- =====================================================
-- IMPORTANTE: Usa período flexível para capturar o billing cycle correto
-- Considera registros onde period_start <= CURRENT_DATE <= period_end
-- =====================================================

-- Limpa versões anteriores para evitar conflitos
DROP FUNCTION IF EXISTS public.get_global_credits_summary();
DROP FUNCTION IF EXISTS public.get_top_credit_consumers(integer);
DROP FUNCTION IF EXISTS public.get_tenant_credits_summary(uuid);
DROP FUNCTION IF EXISTS public.get_tenant_user_credits(uuid);

-- 1. get_global_credits_summary: Resume consumo global de todos os tenants
CREATE OR REPLACE FUNCTION public.get_global_credits_summary()
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  total_tenants_with_usage BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.ai_credits_used), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    COUNT(DISTINCT tu.tenant_id)::BIGINT
  FROM public.tenant_usage tu
  WHERE tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE;
END;
$$;

-- 2. get_top_credit_consumers: Top N tenants por consumo
CREATE OR REPLACE FUNCTION public.get_top_credit_consumers(
  limit_count INTEGER DEFAULT 10
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
BEGIN
  RETURN QUERY
  SELECT 
    tu.tenant_id,
    COALESCE(t.name, 'Desconhecido')::TEXT,
    COALESCE(tu.ai_credits_used, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM public.tenant_usage tu
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE
  ORDER BY tu.ai_credits_used DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- 3. get_tenant_credits_summary: Resume consumo de um tenant específico
CREATE OR REPLACE FUNCTION public.get_tenant_credits_summary(
  p_tenant_id UUID
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
BEGIN
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
    AND tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE
  LIMIT 1;
END;
$$;

-- 4. get_tenant_user_credits: Consumo detalhado por usuário de um tenant
CREATE OR REPLACE FUNCTION public.get_tenant_user_credits(
  p_tenant_id UUID
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
GRANT EXECUTE ON FUNCTION public.get_global_credits_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_credit_consumers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_credits_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_user_credits(UUID) TO authenticated;

-- 6. Forçar reload do schema no PostgREST
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICAÇÃO (execute após criar as funções)
-- =====================================================

-- Teste get_global_credits_summary (deve retornar créditos do período atual)
-- SELECT * FROM get_global_credits_summary();

-- Teste get_top_credit_consumers (deve mostrar tenants com consumo)
-- SELECT * FROM get_top_credit_consumers(5);

-- Teste get_tenant_credits_summary (substitua pelo UUID de um tenant)
-- SELECT * FROM get_tenant_credits_summary('00000000-0000-0000-0000-000000000001');

-- Teste get_tenant_user_credits (mostra consumo por usuário)
-- SELECT * FROM get_tenant_user_credits('00000000-0000-0000-0000-000000000001');
