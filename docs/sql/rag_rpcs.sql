-- =============================================
-- RAG RPCs - Run this in Supabase SQL Editor AFTER rag_tables.sql
-- =============================================

-- 1. get_rag_quality_summary
CREATE OR REPLACE FUNCTION public.get_rag_quality_summary(
  p_tenant_id UUID DEFAULT NULL,
  p_days INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  WITH current_period AS (
    SELECT
      COUNT(*) AS total_queries,
      COALESCE(AVG(CASE WHEN vector_results_count > 0 THEN 1.0 ELSE 0.0 END), 0) AS vector_hit_rate,
      COALESCE(AVG(CASE WHEN fallback_to_keyword THEN 1.0 ELSE 0.0 END), 0) AS keyword_fallback_rate,
      COALESCE(AVG(CASE WHEN fallback_to_general THEN 1.0 ELSE 0.0 END), 0) AS general_fallback_rate,
      COALESCE(AVG(top_similarity_score), 0) AS avg_similarity,
      COALESCE(AVG(response_confidence), 0) AS avg_confidence,
      COALESCE(AVG(CASE WHEN hybrid_rrf_used THEN 1.0 ELSE 0.0 END), 0) AS hybrid_usage_rate,
      COALESCE(AVG(CASE WHEN reranker_used THEN 1.0 ELSE 0.0 END), 0) AS reranker_usage_rate,
      COALESCE(AVG(CASE WHEN uopa_context_used THEN 1.0 ELSE 0.0 END), 0) AS uopa_usage_rate,
      COALESCE(AVG(CASE WHEN product_context_used THEN 1.0 ELSE 0.0 END), 0) AS product_usage_rate,
      COALESCE(AVG(CASE WHEN was_reformulated THEN 1.0 ELSE 0.0 END), 0) AS reformulation_rate,
      COALESCE(AVG(CASE WHEN chunked_results_count > 0 THEN 1.0 ELSE 0.0 END), 0) AS chunk_usage_rate,
      COUNT(CASE WHEN feedback_type = 'positive' THEN 1 END) AS positive_count,
      COUNT(CASE WHEN feedback_type = 'negative' THEN 1 END) AS negative_count,
      COUNT(CASE WHEN feedback_type = 'edited' THEN 1 END) AS edited_count,
      COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END) AS total_feedback,
      COALESCE(AVG(latency_rag_ms), 0) AS avg_latency_rag_ms,
      COALESCE(AVG(latency_llm_ms), 0) AS avg_latency_llm_ms,
      COALESCE(AVG(latency_total_ms), 0) AS avg_latency_total_ms,
      COALESCE(AVG(conversation_quality_score), 0) AS avg_cqs
    FROM rag_events
    WHERE created_at >= now() - (p_days || ' days')::interval
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  ),
  prev_period AS (
    SELECT
      COALESCE(AVG(CASE WHEN vector_results_count > 0 THEN 1.0 ELSE 0.0 END), 0) AS prev_vector_hit_rate,
      COALESCE(AVG(response_confidence), 0) AS prev_avg_confidence,
      COALESCE(AVG(CASE WHEN fallback_to_general THEN 1.0 ELSE 0.0 END), 0) AS prev_general_fallback_rate,
      COALESCE(AVG(conversation_quality_score), 0) AS prev_avg_cqs
    FROM rag_events
    WHERE created_at >= now() - (p_days * 2 || ' days')::interval
      AND created_at < now() - (p_days || ' days')::interval
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  ),
  top_items AS (
    SELECT json_agg(row_to_json(t)) AS items FROM (
      SELECT item AS knowledge_item_id, COUNT(*) AS usage_count
      FROM rag_events, unnest(knowledge_items_used) AS item
      WHERE created_at >= now() - (p_days || ' days')::interval
        AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      GROUP BY item
      ORDER BY usage_count DESC
      LIMIT 10
    ) t
  ),
  channel_dist AS (
    SELECT json_object_agg(COALESCE(channel, 'unknown'), cnt) AS dist FROM (
      SELECT channel, COUNT(*) AS cnt
      FROM rag_events
      WHERE created_at >= now() - (p_days || ' days')::interval
        AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      GROUP BY channel
    ) ch
  ),
  variant_stats AS (
    SELECT json_agg(row_to_json(v)) AS stats FROM (
      SELECT prompt_variant, COUNT(*) AS total,
        ROUND(AVG(conversation_quality_score)::numeric, 4) AS avg_cqs,
        ROUND(AVG(response_confidence)::numeric, 4) AS avg_confidence
      FROM rag_events
      WHERE created_at >= now() - (p_days || ' days')::interval
        AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        AND prompt_variant IS NOT NULL
      GROUP BY prompt_variant
      ORDER BY total DESC
    ) v
  )
  SELECT json_build_object(
    'total_queries', cp.total_queries,
    'vector_hit_rate', ROUND(cp.vector_hit_rate::numeric, 4),
    'keyword_fallback_rate', ROUND(cp.keyword_fallback_rate::numeric, 4),
    'general_fallback_rate', ROUND(cp.general_fallback_rate::numeric, 4),
    'avg_similarity', ROUND(cp.avg_similarity::numeric, 4),
    'avg_confidence', ROUND(cp.avg_confidence::numeric, 4),
    'hybrid_usage_rate', ROUND(cp.hybrid_usage_rate::numeric, 4),
    'reranker_usage_rate', ROUND(cp.reranker_usage_rate::numeric, 4),
    'uopa_usage_rate', ROUND(cp.uopa_usage_rate::numeric, 4),
    'product_usage_rate', ROUND(cp.product_usage_rate::numeric, 4),
    'reformulation_rate', ROUND(cp.reformulation_rate::numeric, 4),
    'chunk_usage_rate', ROUND(cp.chunk_usage_rate::numeric, 4),
    'positive_feedback_rate', CASE WHEN cp.total_feedback > 0 THEN ROUND((cp.positive_count::numeric / cp.total_feedback), 4) ELSE 0 END,
    'negative_feedback_rate', CASE WHEN cp.total_feedback > 0 THEN ROUND((cp.negative_count::numeric / cp.total_feedback), 4) ELSE 0 END,
    'edited_count', cp.edited_count,
    'total_feedback', cp.total_feedback,
    'positive_count', cp.positive_count,
    'negative_count', cp.negative_count,
    'avg_latency_rag_ms', ROUND(cp.avg_latency_rag_ms::numeric, 0),
    'avg_latency_llm_ms', ROUND(cp.avg_latency_llm_ms::numeric, 0),
    'avg_latency_total_ms', ROUND(cp.avg_latency_total_ms::numeric, 0),
    'avg_cqs', ROUND(cp.avg_cqs::numeric, 4),
    'channel_distribution', COALESCE(cd.dist, '{}'::json),
    'prompt_variant_stats', COALESCE(vs.stats, '[]'::json),
    'top_knowledge_items', COALESCE(ti.items, '[]'::json),
    'trend', json_build_object(
      'vector_hit_rate_delta', ROUND((cp.vector_hit_rate - pp.prev_vector_hit_rate)::numeric, 4),
      'avg_confidence_delta', ROUND((cp.avg_confidence - pp.prev_avg_confidence)::numeric, 4),
      'general_fallback_rate_delta', ROUND((cp.general_fallback_rate - pp.prev_general_fallback_rate)::numeric, 4),
      'avg_cqs_delta', ROUND((cp.avg_cqs - pp.prev_avg_cqs)::numeric, 4)
    )
  ) INTO result
  FROM current_period cp, prev_period pp, top_items ti, channel_dist cd, variant_stats vs;

  RETURN result;
END;
$$;

-- 2. get_rag_quality_by_tenant
CREATE OR REPLACE FUNCTION public.get_rag_quality_by_tenant(
  p_days INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      re.tenant_id,
      tn.name AS tenant_name,
      COUNT(*) AS total_queries,
      ROUND(AVG(CASE WHEN vector_results_count > 0 THEN 1.0 ELSE 0.0 END)::numeric, 4) AS vector_hit_rate,
      ROUND(AVG(CASE WHEN fallback_to_general THEN 1.0 ELSE 0.0 END)::numeric, 4) AS general_fallback_rate,
      ROUND(AVG(response_confidence)::numeric, 4) AS avg_confidence,
      ROUND(AVG(top_similarity_score)::numeric, 4) AS avg_similarity,
      ROUND(AVG(latency_total_ms)::numeric, 0) AS avg_latency_ms,
      ROUND(AVG(conversation_quality_score)::numeric, 4) AS avg_cqs
    FROM rag_events re
    LEFT JOIN tenants tn ON tn.id = re.tenant_id
    WHERE re.created_at >= now() - (p_days || ' days')::interval
    GROUP BY re.tenant_id, tn.name
    ORDER BY total_queries DESC
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 3. get_rag_daily_timeline
CREATE OR REPLACE FUNCTION public.get_rag_daily_timeline(
  p_tenant_id UUID DEFAULT NULL,
  p_days INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT
      created_at::date AS date,
      COUNT(*) AS total_queries,
      ROUND(AVG(CASE WHEN vector_results_count > 0 THEN 1.0 ELSE 0.0 END)::numeric, 4) AS vector_hit_rate,
      ROUND(AVG(CASE WHEN fallback_to_keyword THEN 1.0 ELSE 0.0 END)::numeric, 4) AS keyword_fallback_rate,
      ROUND(AVG(CASE WHEN fallback_to_general THEN 1.0 ELSE 0.0 END)::numeric, 4) AS general_fallback_rate,
      ROUND(AVG(response_confidence)::numeric, 4) AS avg_confidence,
      ROUND(AVG(top_similarity_score)::numeric, 4) AS avg_similarity,
      ROUND(AVG(CASE WHEN hybrid_rrf_used THEN 1.0 ELSE 0.0 END)::numeric, 4) AS hybrid_usage_rate,
      ROUND(AVG(CASE WHEN reranker_used THEN 1.0 ELSE 0.0 END)::numeric, 4) AS reranker_usage_rate,
      ROUND(AVG(latency_total_ms)::numeric, 0) AS avg_latency_ms,
      ROUND(AVG(conversation_quality_score)::numeric, 4) AS avg_cqs
    FROM rag_events
    WHERE created_at >= now() - (p_days || ' days')::interval
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    GROUP BY created_at::date
    ORDER BY date
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 4. Daily aggregation function (for pg_cron)
CREATE OR REPLACE FUNCTION public.aggregate_rag_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO rag_quality_daily (tenant_id, date, total_queries, vector_hit_rate, keyword_fallback_rate, general_fallback_rate, avg_similarity, avg_confidence, hybrid_usage_rate, reranker_usage_rate, uopa_usage_rate, product_usage_rate, reformulation_rate, chunk_usage_rate, positive_feedback_rate, negative_feedback_rate, total_feedback, avg_latency_rag_ms, avg_latency_llm_ms, avg_latency_total_ms, avg_cqs, channel_distribution, prompt_variant_stats)
  SELECT
    tenant_id,
    (now() - interval '1 day')::date,
    COUNT(*),
    AVG(CASE WHEN vector_results_count > 0 THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN fallback_to_keyword THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN fallback_to_general THEN 1.0 ELSE 0.0 END),
    AVG(top_similarity_score),
    AVG(response_confidence),
    AVG(CASE WHEN hybrid_rrf_used THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN reranker_used THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN uopa_context_used THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN product_context_used THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN was_reformulated THEN 1.0 ELSE 0.0 END),
    AVG(CASE WHEN chunked_results_count > 0 THEN 1.0 ELSE 0.0 END),
    CASE WHEN COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END) > 0
      THEN COUNT(CASE WHEN feedback_type = 'positive' THEN 1 END)::float / COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END)
      ELSE 0 END,
    CASE WHEN COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END) > 0
      THEN COUNT(CASE WHEN feedback_type = 'negative' THEN 1 END)::float / COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END)
      ELSE 0 END,
    COUNT(CASE WHEN feedback_type IS NOT NULL THEN 1 END),
    AVG(latency_rag_ms),
    AVG(latency_llm_ms),
    AVG(latency_total_ms),
    AVG(conversation_quality_score),
    (SELECT json_object_agg(COALESCE(ch, 'unknown'), cnt) FROM (SELECT channel AS ch, COUNT(*) AS cnt FROM rag_events e2 WHERE e2.tenant_id = rag_events.tenant_id AND e2.created_at::date = (now() - interval '1 day')::date GROUP BY channel) sub),
    (SELECT json_agg(row_to_json(sub)) FROM (SELECT prompt_variant, COUNT(*) AS total, ROUND(AVG(conversation_quality_score)::numeric, 4) AS avg_cqs FROM rag_events e2 WHERE e2.tenant_id = rag_events.tenant_id AND e2.created_at::date = (now() - interval '1 day')::date AND prompt_variant IS NOT NULL GROUP BY prompt_variant) sub)
  FROM rag_events
  WHERE created_at::date = (now() - interval '1 day')::date
  GROUP BY tenant_id
  ON CONFLICT (tenant_id, date) DO UPDATE SET
    total_queries = EXCLUDED.total_queries,
    vector_hit_rate = EXCLUDED.vector_hit_rate,
    keyword_fallback_rate = EXCLUDED.keyword_fallback_rate,
    general_fallback_rate = EXCLUDED.general_fallback_rate,
    avg_similarity = EXCLUDED.avg_similarity,
    avg_confidence = EXCLUDED.avg_confidence,
    hybrid_usage_rate = EXCLUDED.hybrid_usage_rate,
    reranker_usage_rate = EXCLUDED.reranker_usage_rate,
    uopa_usage_rate = EXCLUDED.uopa_usage_rate,
    product_usage_rate = EXCLUDED.product_usage_rate,
    reformulation_rate = EXCLUDED.reformulation_rate,
    chunk_usage_rate = EXCLUDED.chunk_usage_rate,
    positive_feedback_rate = EXCLUDED.positive_feedback_rate,
    negative_feedback_rate = EXCLUDED.negative_feedback_rate,
    total_feedback = EXCLUDED.total_feedback,
    avg_latency_rag_ms = EXCLUDED.avg_latency_rag_ms,
    avg_latency_llm_ms = EXCLUDED.avg_latency_llm_ms,
    avg_latency_total_ms = EXCLUDED.avg_latency_total_ms,
    avg_cqs = EXCLUDED.avg_cqs,
    channel_distribution = EXCLUDED.channel_distribution,
    prompt_variant_stats = EXCLUDED.prompt_variant_stats;

  -- Prune old events (> 90 days)
  DELETE FROM rag_events WHERE created_at < now() - interval '90 days';
END;
$$;
