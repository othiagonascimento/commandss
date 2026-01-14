-- Corrigir views para usar SECURITY INVOKER e função com search_path

-- Recriar views com SECURITY INVOKER explícito
DROP VIEW IF EXISTS v_ai_diagnostics;
DROP VIEW IF EXISTS v_ai_model_summary;
DROP VIEW IF EXISTS v_ai_escalation_rates;
DROP VIEW IF EXISTS v_tenant_ai_consumption;

CREATE VIEW v_ai_diagnostics 
WITH (security_invoker = true) AS
SELECT 
  tenant_id,
  ai_selected as model,
  created_at::date as day,
  COUNT(*) as total_calls,
  AVG(response_time_ms)::numeric(10,2) as avg_latency_ms,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd)::numeric(10,6) as total_cost_usd,
  SUM(CASE WHEN has_objection THEN 1 ELSE 0 END) as objections_count,
  AVG(confidence_score)::numeric(5,2) as avg_confidence,
  SUM(CASE WHEN conversation_stage IN ('layer_2', 'layer_3', 'elite', 'escalated') THEN 1 ELSE 0 END) as escalations_count
FROM ai_orchestration_logs
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY tenant_id, ai_selected, created_at::date;

CREATE VIEW v_ai_model_summary 
WITH (security_invoker = true) AS
SELECT 
  ai_selected as model,
  COUNT(*) as total_calls,
  AVG(response_time_ms)::numeric(10,2) as avg_latency_ms,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd)::numeric(10,6) as total_cost_usd,
  AVG(confidence_score)::numeric(5,2) as avg_confidence,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  MIN(created_at) as first_call,
  MAX(created_at) as last_call
FROM ai_orchestration_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY ai_selected;

CREATE VIEW v_ai_escalation_rates 
WITH (security_invoker = true) AS
SELECT 
  created_at::date as day,
  COUNT(*) as total_calls,
  SUM(CASE WHEN ai_selected ILIKE '%flash%' OR ai_selected ILIKE '%layer_1%' OR ai_selected ILIKE '%router%' THEN 1 ELSE 0 END) as layer_1_calls,
  SUM(CASE WHEN ai_selected ILIKE '%pro%' OR ai_selected ILIKE '%layer_2%' OR ai_selected ILIKE '%standard%' THEN 1 ELSE 0 END) as layer_2_calls,
  SUM(CASE WHEN ai_selected ILIKE '%sonnet%' OR ai_selected ILIKE '%opus%' OR ai_selected ILIKE '%layer_3%' OR ai_selected ILIKE '%elite%' THEN 1 ELSE 0 END) as layer_3_calls,
  ROUND(
    (SUM(CASE WHEN ai_selected ILIKE '%pro%' OR ai_selected ILIKE '%layer_2%' OR ai_selected ILIKE '%standard%' THEN 1 ELSE 0 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100), 2
  ) as layer_2_rate,
  ROUND(
    (SUM(CASE WHEN ai_selected ILIKE '%sonnet%' OR ai_selected ILIKE '%opus%' OR ai_selected ILIKE '%layer_3%' OR ai_selected ILIKE '%elite%' THEN 1 ELSE 0 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100), 2
  ) as layer_3_rate
FROM ai_orchestration_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY created_at::date
ORDER BY day DESC;

CREATE VIEW v_tenant_ai_consumption 
WITH (security_invoker = true) AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(aol.id) as total_ai_calls,
  SUM(aol.tokens_used) as total_tokens,
  SUM(aol.cost_usd)::numeric(10,4) as total_cost_usd,
  AVG(aol.response_time_ms)::numeric(10,2) as avg_latency_ms,
  MAX(aol.created_at) as last_ai_call,
  COALESCE(tu.credits_consumed, 0) as credits_consumed
FROM tenants t
LEFT JOIN ai_orchestration_logs aol ON aol.tenant_id = t.id 
  AND aol.created_at >= DATE_TRUNC('month', NOW())
LEFT JOIN tenant_usage tu ON tu.tenant_id = t.id 
  AND tu.period_start = DATE_TRUNC('month', NOW())::date
WHERE t.is_blocked = false
GROUP BY t.id, t.name, tu.credits_consumed;

-- Corrigir função com search_path
DROP FUNCTION IF EXISTS calculate_credits_from_cost(numeric);
CREATE FUNCTION calculate_credits_from_cost(cost_brl numeric)
RETURNS integer AS $$
BEGIN
  RETURN ROUND(COALESCE(cost_brl, 0) * 100)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;