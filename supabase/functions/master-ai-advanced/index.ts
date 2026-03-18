import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse parameters
    const url = new URL(req.url);
    const pathSuffix = req.headers.get('x-path-suffix') || '';
    const params = new URLSearchParams(pathSuffix.startsWith('?') ? pathSuffix : '');
    
    const days = parseInt(params.get('days') || url.searchParams.get('days') || '30', 10);
    const tenantId = params.get('tenant_id') || url.searchParams.get('tenant_id') || null;

    // Try CRM first
    const remoteUrl = Deno.env.get('REMOTE_SUPABASE_URL');
    const remoteAnonKey = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');
    
    let crmData: Record<string, unknown> | null = null;
    
    if (remoteUrl && remoteAnonKey) {
      try {
        const crmParams = new URLSearchParams({ action: 'ai_advanced', days: String(days) });
        if (tenantId) crmParams.set('tenant_id', tenantId);
        const crmUrl = `${remoteUrl}/functions/v1/master-core/analytics?${crmParams.toString()}`;
        
        const crmResponse = await fetch(crmUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'apikey': remoteAnonKey,
            'Content-Type': 'application/json',
          },
        });

        if (crmResponse.ok) {
          const data = await crmResponse.json();
          // Only use CRM data if it has meaningful content
          if (data?.models?.length > 0 || data?.layers?.length > 0 || data?.timeline?.length > 0) {
            crmData = data;
          }
        }
      } catch (e) {
        console.warn('[master-ai-advanced] CRM fetch failed, using local fallback:', e);
      }
    }

    // If CRM returned valid data, use it
    if (crmData) {
      return new Response(JSON.stringify(crmData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === LOCAL FALLBACK: Aggregate from ai_events + tenant_usage ===
    console.log('[master-ai-advanced] Using local data aggregation fallback');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString();

    // Build tenant filter
    const tenantFilter = tenantId ? { tenant_id: tenantId } : {};

    // Fetch ai_events
    let eventsQuery = supabase
      .from('ai_events')
      .select('event_type, ai_mode, was_blocked, was_fallback, latency_ms, tenant_id, created_at, fallback_category')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(5000);
    
    if (tenantId) {
      eventsQuery = eventsQuery.eq('tenant_id', tenantId);
    }

    // Fetch tenant_usage for messages/tokens
    let usageQuery = supabase
      .from('tenant_usage')
      .select('tenant_id, ai_tokens_used, messages_sent, active_users, leads_count');
    
    if (tenantId) {
      usageQuery = usageQuery.eq('tenant_id', tenantId);
    }

    // Fetch tenant names
    const tenantsQuery = supabase.from('tenants').select('id, name');

    // Fetch api_cost_config for model info
    const modelsQuery = supabase
      .from('api_cost_config')
      .select('provider, model, display_name, layer_category, is_active')
      .eq('is_active', true);

    const [eventsRes, usageRes, tenantsRes, modelsRes] = await Promise.all([
      eventsQuery,
      usageQuery,
      tenantsQuery,
      modelsQuery,
    ]);

    const events = eventsRes.data || [];
    const usageData = usageRes.data || [];
    const tenantsData = tenantsRes.data || [];
    const modelsData = modelsRes.data || [];

    const tenantNameMap = new Map(tenantsData.map(t => [t.id, t.name]));

    // === Build Summary ===
    const totalEvents = events.length;
    const totalBlocks = events.filter(e => e.was_blocked).length;
    const totalFallbacks = events.filter(e => e.event_type === 'fallback_activated' || e.event_type === 'fallback_success').length;
    const totalResponses = events.filter(e => e.event_type === 'ai_response_sent').length;
    const latencies = events.filter(e => e.latency_ms && e.latency_ms > 0).map(e => e.latency_ms!);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    // Get total messages from tenant_usage (real data)
    const totalMessages = usageData.reduce((sum, u) => sum + (u.messages_sent || 0), 0);
    const totalTokens = usageData.reduce((sum, u) => sum + (u.ai_tokens_used || 0), 0);

    // Credits approximation from tokens
    const totalCredits = Math.round(totalTokens / 10); // rough conversion

    const summary = {
      total_messages: totalMessages,
      total_credits: totalCredits,
      total_tokens: totalTokens,
      avg_latency_ms: avgLatency,
      fallbacks: totalFallbacks,
      blocks: totalBlocks,
      total_events: totalEvents,
      ai_responses: totalResponses,
      feedback_positive: 0,
      feedback_negative: 0,
      feedback_edited: 0,
    };

    // === Build Layers from ai_mode ===
    const modeCount: Record<string, number> = {};
    for (const e of events) {
      const mode = e.ai_mode || 'unknown';
      modeCount[mode] = (modeCount[mode] || 0) + 1;
    }

    // Map ai_modes to layers
    const modeToLayer: Record<string, string> = {
      'seller': 'layer_2',
      'sales': 'layer_2',
      'sdr': 'layer_1',
      'qualification': 'layer_1',
      'support': 'layer_2',
      'recovery': 'layer_3',
      'followup': 'layer_1',
      'proactive': 'layer_1',
      'post_sale': 'layer_2',
      'unknown': 'layer_1',
    };

    const layerAgg: Record<string, { count: number; models: Record<string, number> }> = {};
    for (const [mode, count] of Object.entries(modeCount)) {
      const layer = modeToLayer[mode] || 'layer_1';
      if (!layerAgg[layer]) layerAgg[layer] = { count: 0, models: {} };
      layerAgg[layer].count += count;
      layerAgg[layer].models[mode] = count;
    }

    const layers = Object.entries(layerAgg).flatMap(([layer, data]) => 
      Object.entries(data.models).map(([model, count]) => ({
        layer,
        model,
        count,
      }))
    );

    // === Build Models from api_cost_config + event distribution ===
    const totalForPct = totalEvents || 1;
    const models = modelsData.map(m => ({
      model: m.display_name || m.model,
      count: 0, // We don't have per-model event data
      avg_latency: avgLatency,
      credits: 0,
      pct: 0,
    }));

    // Add a synthetic entry per ai_mode since we have real counts
    const modeModels = Object.entries(modeCount)
      .filter(([mode]) => mode !== 'unknown')
      .map(([mode, count]) => ({
        model: `Modo: ${mode}`,
        count,
        avg_latency: avgLatency,
        credits: Math.round(count * 0.1),
        pct: Math.round((count / totalForPct) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // === Build Providers from api_cost_config ===
    const providerAgg: Record<string, { count: number; credits: number }> = {};
    for (const m of modelsData) {
      if (!providerAgg[m.provider]) providerAgg[m.provider] = { count: 0, credits: 0 };
      providerAgg[m.provider].count++;
    }
    const providers = Object.entries(providerAgg).map(([provider, data]) => ({
      provider,
      count: data.count,
      credits: data.credits,
    }));

    // === Build Tenants ===
    const tenantAgg: Record<string, { credits: number; messages: number; escalations: number; blocks: number }> = {};
    for (const e of events) {
      if (!tenantAgg[e.tenant_id]) tenantAgg[e.tenant_id] = { credits: 0, messages: 0, escalations: 0, blocks: 0 };
      tenantAgg[e.tenant_id].messages++;
      if (e.was_blocked) tenantAgg[e.tenant_id].blocks++;
      if (e.event_type === 'fallback_activated') tenantAgg[e.tenant_id].escalations++;
    }

    // Enrich with tenant_usage messages
    for (const u of usageData) {
      if (!tenantAgg[u.tenant_id]) tenantAgg[u.tenant_id] = { credits: 0, messages: 0, escalations: 0, blocks: 0 };
      tenantAgg[u.tenant_id].credits = Math.round((u.ai_tokens_used || 0) / 10);
      // Use the larger of event count or tenant_usage messages
      tenantAgg[u.tenant_id].messages = Math.max(tenantAgg[u.tenant_id].messages, u.messages_sent || 0);
    }

    const tenants = Object.entries(tenantAgg)
      .map(([tid, data]) => ({
        tenant_id: tid,
        tenant_name: tenantNameMap.get(tid) || tid.slice(0, 8),
        credits: data.credits,
        messages: data.messages,
        escalations: data.escalations,
        blocks: data.blocks,
      }))
      .sort((a, b) => b.messages - a.messages);

    // === Build Timeline ===
    const dayAgg: Record<string, { messages: number; credits: number; escalations: number; blocks: number }> = {};
    for (const e of events) {
      const day = e.created_at?.slice(0, 10) || 'unknown';
      if (!dayAgg[day]) dayAgg[day] = { messages: 0, credits: 0, escalations: 0, blocks: 0 };
      dayAgg[day].messages++;
      if (e.was_blocked) dayAgg[day].blocks++;
      if (e.event_type === 'fallback_activated') dayAgg[day].escalations++;
    }

    const timeline = Object.entries(dayAgg)
      .map(([date, data]) => ({
        date,
        messages: data.messages,
        credits: data.credits,
        escalations: data.escalations,
        blocks: data.blocks,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result = {
      summary,
      layers,
      models: modeModels.length > 0 ? modeModels : models.slice(0, 5),
      providers,
      tenants,
      timeline,
    };

    console.log('[master-ai-advanced] Local data built:', {
      events: events.length,
      tenants: tenants.length,
      timeline: timeline.length,
      layers: layers.length,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-ai-advanced] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
