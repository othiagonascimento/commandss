-- =====================================================
-- FUNÇÕES RPC DE AGREGAÇÃO DE CRÉDITOS (v2 - CORRIGIDO)
-- Execute este SQL no Supabase Dashboard (SQL Editor)
-- Projeto: btoyclznuuwvxbsacemw
-- =====================================================
-- IMPORTANTE: Variáveis locais usam prefixo v_ para evitar
-- ambiguidade com colunas de tabela (erro 42702)
-- =====================================================

-- Limpa versões anteriores para evitar conflitos
DROP FUNCTION IF EXISTS public.get_global_credits_summary();
DROP FUNCTION IF EXISTS public.get_top_credit_consumers(integer);
DROP FUNCTION IF EXISTS public.get_tenant_credits_summary(uuid);

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
DECLARE
  v_period_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.credits_consumed), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    COUNT(DISTINCT tu.tenant_id)::BIGINT
  FROM public.tenant_usage tu
  WHERE tu.period_start >= v_period_start;
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
DECLARE
  v_period_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    tu.tenant_id,
    COALESCE(t.name, 'Desconhecido')::TEXT,
    COALESCE(tu.credits_consumed, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM public.tenant_usage tu
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.period_start >= v_period_start
  ORDER BY tu.credits_consumed DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- 3. get_tenant_credits_summary: Resume consumo de um tenant específico
CREATE OR REPLACE FUNCTION public.get_tenant_credits_summary(
  tenant_id_param UUID
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
  v_p_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_p_end DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.credits_consumed), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    (SELECT COUNT(DISTINCT uu.user_id) 
     FROM public.user_usage uu 
     WHERE uu.tenant_id = tenant_id_param 
     AND uu.credits_consumed_month > 0)::BIGINT,
    v_p_start,
    v_p_end
  FROM public.tenant_usage tu
  WHERE tu.tenant_id = tenant_id_param
  AND tu.period_start >= v_p_start;
END;
$$;

-- 4. Permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_global_credits_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_credit_consumers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_credits_summary(UUID) TO authenticated;

-- 5. Forçar reload do schema no PostgREST
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICAÇÃO (execute após criar as funções)
-- =====================================================

-- Teste get_global_credits_summary
-- SELECT * FROM get_global_credits_summary();

-- Teste get_top_credit_consumers
-- SELECT * FROM get_top_credit_consumers(5);

-- Teste get_tenant_credits_summary (substitua pelo UUID de um tenant)
-- SELECT * FROM get_tenant_credits_summary('seu-tenant-uuid-aqui');
