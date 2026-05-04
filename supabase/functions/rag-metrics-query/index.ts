import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for RPC calls
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Parse query params
    const url = new URL(req.url);
    const pathSuffix = req.headers.get('x-path-suffix') || '';
    const params = new URLSearchParams(pathSuffix.startsWith('?') ? pathSuffix.slice(1) : pathSuffix);
    // Also merge URL search params
    url.searchParams.forEach((v, k) => { if (!params.has(k)) params.set(k, v); });

    const action = params.get('action') || 'summary';
    const tenantId = params.get('tenant_id') || null;
    const days = parseInt(params.get('days') || '30', 10);

    if (action === 'summary') {
      const { data, error } = await serviceClient.rpc('get_rag_quality_summary', {
        p_tenant_id: tenantId,
        p_days: days,
      });
      if (error) throw error;

      // Calculate health score
      const d = data?.[0] || data;
      let healthScore = 0;
      if (d) {
        healthScore = Math.round(
          (d.vector_hit_rate || 0) * 0.4 * 100 +
          (d.avg_confidence || 0) * 0.3 * 100 +
          (1 - (d.general_fallback_rate || 0)) * 0.3 * 100
        );
        healthScore = Math.max(0, Math.min(100, healthScore));
      }

      return new Response(JSON.stringify({ ...d, health_score: healthScore }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'by-tenant') {
      const { data, error } = await serviceClient.rpc('get_rag_quality_by_tenant', {
        p_days: days,
      });
      if (error) throw error;

      // Add health score per tenant
      const enriched = (data || []).map((t: Record<string, unknown>) => {
        const hs = Math.round(
          ((t.vector_hit_rate as number) || 0) * 0.4 * 100 +
          ((t.avg_confidence as number) || 0) * 0.3 * 100 +
          (1 - ((t.general_fallback_rate as number) || 0)) * 0.3 * 100
        );
        return { ...t, health_score: Math.max(0, Math.min(100, hs)) };
      });

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'timeline') {
      const { data, error } = await serviceClient.rpc('get_rag_daily_timeline', {
        p_tenant_id: tenantId,
        p_days: days,
      });
      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[RAG-QUERY] Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
