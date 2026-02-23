-- ============================================
-- Ops Health Telemetry Tables
-- Execute no Supabase externo (btoyclznuuwvxbsacemw)
-- ============================================

-- 1. Snapshots de saúde operacional (recebidos do CRM)
CREATE TABLE IF NOT EXISTS ops_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  snapshot_type TEXT NOT NULL DEFAULT 'global' CHECK (snapshot_type IN ('global', 'tenant', 'user')),
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  source TEXT DEFAULT 'crm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_health_snapshots_created 
  ON ops_health_snapshots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_health_snapshots_tenant 
  ON ops_health_snapshots (tenant_id, created_at DESC) WHERE tenant_id IS NOT NULL;

-- 2. Alertas do Master
CREATE TABLE IF NOT EXISTS master_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'queue_overload', 'channel_down', 'ai_leak', 'trial_expiring',
    'limit_reached', 'cron_failure', 'security_alert', 'user_inconsistency'
  )),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  tenant_id UUID,
  user_id UUID,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_alerts_active 
  ON master_alerts (is_resolved, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_alerts_tenant 
  ON master_alerts (tenant_id, is_resolved, created_at DESC) WHERE tenant_id IS NOT NULL;

-- 3. Histórico agregado por hora (para gráficos)
CREATE TABLE IF NOT EXISTS ops_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  hour TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_health_history_lookup 
  ON ops_health_history (tenant_id, hour DESC);

-- ============================================
-- RPCs
-- ============================================

-- Get latest snapshot (global or per tenant)
CREATE OR REPLACE FUNCTION get_latest_ops_snapshot(p_tenant_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  IF p_tenant_id IS NULL THEN
    SELECT row_to_json(s)::JSONB INTO result
    FROM ops_health_snapshots s
    WHERE s.snapshot_type = 'global'
    ORDER BY s.created_at DESC LIMIT 1;
  ELSE
    SELECT row_to_json(s)::JSONB INTO result
    FROM ops_health_snapshots s
    WHERE s.tenant_id = p_tenant_id
    ORDER BY s.created_at DESC LIMIT 1;
  END IF;
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get snapshot history (aggregated hourly data)
CREATE OR REPLACE FUNCTION get_ops_snapshot_history(
  p_tenant_id UUID DEFAULT NULL,
  p_hours INT DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_agg(row_to_json(h) ORDER BY h.hour DESC)::JSONB INTO result
  FROM ops_health_history h
  WHERE (p_tenant_id IS NULL OR h.tenant_id = p_tenant_id)
    AND h.hour >= now() - (p_hours || ' hours')::INTERVAL;
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get active alerts with filters
CREATE OR REPLACE FUNCTION get_active_alerts(
  p_tenant_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_agg(row_to_json(a) ORDER BY 
    CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
    a.created_at DESC
  )::JSONB INTO result
  FROM (
    SELECT * FROM master_alerts
    WHERE is_resolved = false
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND (p_severity IS NULL OR severity = p_severity)
    ORDER BY 
      CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT p_limit
  ) a;
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;

-- Resolve an alert
CREATE OR REPLACE FUNCTION resolve_master_alert(p_alert_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE master_alerts 
  SET is_resolved = true, resolved_at = now(), resolved_by = p_user_id
  WHERE id = p_alert_id AND is_resolved = false;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Get alert statistics
CREATE OR REPLACE FUNCTION get_alert_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_build_object(
    'total_active', (SELECT count(*) FROM master_alerts WHERE is_resolved = false),
    'by_severity', (
      SELECT json_object_agg(severity, cnt) FROM (
        SELECT severity, count(*) as cnt FROM master_alerts WHERE is_resolved = false GROUP BY severity
      ) x
    ),
    'by_type', (
      SELECT json_object_agg(alert_type, cnt) FROM (
        SELECT alert_type, count(*) as cnt FROM master_alerts WHERE is_resolved = false GROUP BY alert_type
      ) x
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Cleanup: delete snapshots older than 7 days and history older than 30 days
CREATE OR REPLACE FUNCTION cleanup_ops_health_data()
RETURNS void AS $$
BEGIN
  DELETE FROM ops_health_snapshots WHERE created_at < now() - INTERVAL '7 days';
  DELETE FROM ops_health_history WHERE created_at < now() - INTERVAL '30 days';
  DELETE FROM master_alerts WHERE is_resolved = true AND resolved_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
