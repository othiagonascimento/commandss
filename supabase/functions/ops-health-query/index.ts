import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { makeV2Envelope, makeUnavailableEnvelope, computeFreshness } from '../_shared/v2Envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STALE_AFTER_SEC = 600; // 10 min — Operations/Tenant Health rule

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathSuffix = req.headers.get('x-path-suffix') || '';
    const params = new URLSearchParams(pathSuffix.startsWith('?') ? pathSuffix.slice(1) : pathSuffix);
    url.searchParams.forEach((v, k) => { if (!params.has(k)) params.set(k, v); });

    const action = params.get('action') || 'latest';
    const tenantId = params.get('tenant_id') || null;

    if (action === 'latest') {
      const { data, error } = await supabase.rpc('get_latest_ops_snapshot', { p_tenant_id: tenantId });
      if (error) throw error;

      if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
        return jsonResponse(makeUnavailableEnvelope({}, 'Nenhum snapshot ops_health encontrado'));
      }

      const observedAt = (data as { created_at?: string })?.created_at ?? null;
      return jsonResponse(makeV2Envelope(data, {
        method: 'snapshot',
        observedAt,
        staleAfterSeconds: STALE_AFTER_SEC,
      }));
    }

    if (action === 'history') {
      const hours = parseInt(params.get('hours') || '24');
      const { data, error } = await supabase.rpc('get_ops_snapshot_history', { p_tenant_id: tenantId, p_hours: hours });
      if (error) throw error;

      const arr = Array.isArray(data) ? data : [];
      if (arr.length === 0) {
        return jsonResponse(makeUnavailableEnvelope([], `Sem histórico nas últimas ${hours}h`));
      }
      const newest = (arr[0] as { hour?: string; created_at?: string })?.hour
        ?? (arr[0] as { created_at?: string })?.created_at ?? null;
      return jsonResponse(makeV2Envelope(arr, {
        method: 'snapshot',
        observedAt: newest,
        staleAfterSeconds: STALE_AFTER_SEC * 6, // history tolerates older
      }));
    }

    if (action === 'alerts') {
      const severity = params.get('severity') || null;
      const limit = parseInt(params.get('limit') || '50');
      const { data, error } = await supabase.rpc('get_active_alerts', { p_tenant_id: tenantId, p_severity: severity, p_limit: limit });
      if (error) throw error;
      const arr = Array.isArray(data) ? data : [];
      const newest = arr.length > 0 ? (arr[0] as { created_at?: string }).created_at ?? null : null;
      return jsonResponse(makeV2Envelope(arr, {
        method: 'live',
        observedAt: newest ?? new Date().toISOString(),
        staleAfterSeconds: 300,
      }));
    }

    if (action === 'alert-stats') {
      const { data, error } = await supabase.rpc('get_alert_stats');
      if (error) throw error;
      return jsonResponse(makeV2Envelope(data || {}, {
        method: 'live',
        observedAt: new Date().toISOString(),
        staleAfterSeconds: 300,
      }));
    }

    if (action === 'resolve' && req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.rpc('resolve_master_alert', {
        p_alert_id: body.alert_id,
        p_user_id: body.user_id || null,
        p_notes: body.notes || null,
        p_reason: body.reason || null,
      });
      if (error) throw error;
      // Mutation: keep legacy v1 shape so callers don't break
      return jsonResponse({ success: data });
    }

    if (action === 'resolved-alerts') {
      const limit = parseInt(params.get('limit') || '50');
      const offset = parseInt(params.get('offset') || '0');
      const alertType = params.get('alert_type') || null;
      const { data, error } = await supabase.rpc('get_resolved_alerts', {
        p_limit: limit, p_offset: offset, p_tenant_id: tenantId, p_alert_type: alertType,
      });
      if (error) throw error;
      const arr = Array.isArray(data) ? data : [];
      const newest = arr.length > 0 ? (arr[0] as { resolved_at?: string }).resolved_at ?? null : null;
      return jsonResponse(makeV2Envelope(arr, {
        method: 'live',
        observedAt: newest ?? new Date().toISOString(),
        staleAfterSeconds: 3600,
      }));
    }

    if (action === 'tenant-ops') {
      if (!tenantId) {
        return jsonResponse({ error: 'tenant_id required' }, 400);
      }
      const [snapshotRes, alertsRes] = await Promise.all([
        supabase.rpc('get_latest_ops_snapshot', { p_tenant_id: tenantId }),
        supabase.rpc('get_active_alerts', { p_tenant_id: tenantId, p_severity: null, p_limit: 20 }),
      ]);

      const snap = snapshotRes.data;
      const hasSnap = snap && typeof snap === 'object' && Object.keys(snap as object).length > 0;
      const observedAt = hasSnap ? (snap as { created_at?: string })?.created_at ?? null : null;

      return jsonResponse(makeV2Envelope({
        snapshot: snap || {},
        alerts: Array.isArray(alertsRes.data) ? alertsRes.data : [],
      }, {
        method: hasSnap ? 'snapshot' : 'unavailable',
        observedAt,
        staleAfterSeconds: STALE_AFTER_SEC,
        warnings: hasSnap ? [] : [`Sem snapshot recente para tenant ${tenantId}`],
      }));
    }

    if (action === 'user-ops') {
      const userId = params.get('user_id');
      if (!tenantId || !userId) {
        return jsonResponse({ error: 'tenant_id and user_id required' }, 400);
      }
      const [usageRes, limitsRes, alertsRes] = await Promise.all([
        supabase.from('user_usage').select('*').eq('user_id', userId).eq('tenant_id', tenantId).maybeSingle(),
        supabase.from('user_limits').select('*').eq('user_id', userId).eq('tenant_id', tenantId).maybeSingle(),
        supabase.from('master_alerts').select('*').eq('user_id', userId).eq('is_resolved', false).order('created_at', { ascending: false }).limit(10),
      ]);

      const observedAt = (usageRes.data as { updated_at?: string })?.updated_at
        ?? (usageRes.data as { created_at?: string })?.created_at
        ?? null;

      return jsonResponse(makeV2Envelope({
        usage: usageRes.data || null,
        limits: limitsRes.data || null,
        alerts: Array.isArray(alertsRes.data) ? alertsRes.data : [],
      }, {
        method: usageRes.data ? 'live' : 'fallback',
        observedAt,
        staleAfterSeconds: 3600,
      }));
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);

  } catch (error) {
    console.error('[OPS-HEALTH-QUERY] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
