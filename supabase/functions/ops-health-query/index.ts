import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
      const { data, error } = await supabase.rpc('get_latest_ops_snapshot', {
        p_tenant_id: tenantId,
      });
      if (error) throw error;
      return new Response(JSON.stringify(data || {}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'history') {
      const hours = parseInt(params.get('hours') || '24');
      const { data, error } = await supabase.rpc('get_ops_snapshot_history', {
        p_tenant_id: tenantId,
        p_hours: hours,
      });
      if (error) throw error;
      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'alerts') {
      const severity = params.get('severity') || null;
      const limit = parseInt(params.get('limit') || '50');
      const { data, error } = await supabase.rpc('get_active_alerts', {
        p_tenant_id: tenantId,
        p_severity: severity,
        p_limit: limit,
      });
      if (error) throw error;
      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'alert-stats') {
      const { data, error } = await supabase.rpc('get_alert_stats');
      if (error) throw error;
      return new Response(JSON.stringify(data || {}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ success: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resolved-alerts') {
      const limit = parseInt(params.get('limit') || '50');
      const offset = parseInt(params.get('offset') || '0');
      const alertType = params.get('alert_type') || null;
      const { data, error } = await supabase.rpc('get_resolved_alerts', {
        p_limit: limit,
        p_offset: offset,
        p_tenant_id: tenantId,
        p_alert_type: alertType,
      });
      if (error) throw error;
      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'tenant-ops') {
      if (!tenantId) {
        return new Response(JSON.stringify({ error: 'tenant_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const [snapshotRes, alertsRes] = await Promise.all([
        supabase.rpc('get_latest_ops_snapshot', { p_tenant_id: tenantId }),
        supabase.rpc('get_active_alerts', { p_tenant_id: tenantId, p_severity: null, p_limit: 20 }),
      ]);

      return new Response(JSON.stringify({
        snapshot: snapshotRes.data || {},
        alerts: alertsRes.data || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'user-ops') {
      const userId = params.get('user_id');
      if (!tenantId || !userId) {
        return new Response(JSON.stringify({ error: 'tenant_id and user_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const [usageRes, limitsRes, alertsRes] = await Promise.all([
        supabase.from('user_usage').select('*').eq('user_id', userId).eq('tenant_id', tenantId).maybeSingle(),
        supabase.from('user_limits').select('*').eq('user_id', userId).eq('tenant_id', tenantId).maybeSingle(),
        supabase.from('master_alerts').select('*').eq('user_id', userId).eq('is_resolved', false).order('created_at', { ascending: false }).limit(10),
      ]);

      return new Response(JSON.stringify({
        usage: usageRes.data || null,
        limits: limitsRes.data || null,
        alerts: alertsRes.data || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[OPS-HEALTH-QUERY] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
