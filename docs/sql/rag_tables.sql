-- =============================================
-- RAG TABLES - Run this in Supabase SQL Editor
-- =============================================

-- 1. RAG Events table
CREATE TABLE IF NOT EXISTS public.rag_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  query_length INT DEFAULT 0,
  was_reformulated BOOLEAN DEFAULT false,
  vector_results_count INT DEFAULT 0,
  keyword_results_count INT DEFAULT 0,
  hybrid_rrf_used BOOLEAN DEFAULT false,
  reranker_used BOOLEAN DEFAULT false,
  top_similarity_score FLOAT,
  knowledge_items_used UUID[] DEFAULT '{}',
  uopa_context_used BOOLEAN DEFAULT false,
  product_context_used BOOLEAN DEFAULT false,
  fallback_to_keyword BOOLEAN DEFAULT false,
  fallback_to_general BOOLEAN DEFAULT false,
  layer_used INT,
  model_used TEXT,
  response_confidence FLOAT,
  chunked_results_count INT DEFAULT 0,
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'edited') OR feedback_type IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_rag_events_tenant_created ON public.rag_events (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rag_events_created ON public.rag_events (created_at);

ALTER TABLE public.rag_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on rag_events"
  ON public.rag_events FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read rag_events"
  ON public.rag_events FOR SELECT TO authenticated USING (true);

-- 2. RAG Quality Daily (pre-computed aggregation)
CREATE TABLE IF NOT EXISTS public.rag_quality_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_queries INT DEFAULT 0,
  vector_hit_rate FLOAT DEFAULT 0,
  keyword_fallback_rate FLOAT DEFAULT 0,
  general_fallback_rate FLOAT DEFAULT 0,
  avg_similarity FLOAT DEFAULT 0,
  avg_confidence FLOAT DEFAULT 0,
  hybrid_usage_rate FLOAT DEFAULT 0,
  reranker_usage_rate FLOAT DEFAULT 0,
  uopa_usage_rate FLOAT DEFAULT 0,
  product_usage_rate FLOAT DEFAULT 0,
  reformulation_rate FLOAT DEFAULT 0,
  chunk_usage_rate FLOAT DEFAULT 0,
  positive_feedback_rate FLOAT DEFAULT 0,
  negative_feedback_rate FLOAT DEFAULT 0,
  total_feedback INT DEFAULT 0,
  UNIQUE(tenant_id, date)
);

ALTER TABLE public.rag_quality_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on rag_quality_daily"
  ON public.rag_quality_daily FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read rag_quality_daily"
  ON public.rag_quality_daily FOR SELECT TO authenticated USING (true);
