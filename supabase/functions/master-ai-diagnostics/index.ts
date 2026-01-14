import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-DIAGNOSTICS] ${step}${detailsStr}`);
};

// Get summary statistics
async function getSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Get model summary from view
  const { data: modelSummary, error: modelError } = await supabase
    .from('v_ai_model_summary')
    .select('*');
  
  if (modelError) {
    logStep('Error fetching model summary', modelError);
  }

  // Get escalation rates from view
  const { data: escalationRates, error: escalationError } = await supabase
    .from('v_ai_escalation_rates')
    .select('*')
    .limit(30);
  
  if (escalationError) {
    logStep('Error fetching escalation rates', escalationError);
  }

  // Get totals for month
  const { data: monthlyStats, error: monthlyError } = await supabase
    .from('ai_orchestration_logs')
    .select('id, tokens_used, cost_usd, response_time_ms')
    .gte('created_at', monthStart);

  const totalCalls = monthlyStats?.length || 0;
  const totalTokens = monthlyStats?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
  const totalCostUsd = monthlyStats?.reduce((sum, log) => sum + (log.cost_usd || 0), 0) || 0;
  const avgLatency = monthlyStats?.length 
    ? (monthlyStats.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / monthlyStats.length)
    : 0;

  // Calculate credits (1 credit = R$ 0.01 = $0.00182 at 5.50 rate)
  const usdToBrlRate = 5.50;
  const totalCredits = Math.round(totalCostUsd * usdToBrlRate * 100);

  // Get 24h stats for comparison
  const { data: last24h } = await supabase
    .from('ai_orchestration_logs')
    .select('id')
    .gte('created_at', dayAgo);

  const callsLast24h = last24h?.length || 0;

  // Calculate model distribution
  const modelDistribution = (modelSummary || []).map(m => ({
    model: m.model,
    calls: m.total_calls,
    percentage: totalCalls > 0 ? Math.round((m.total_calls / totalCalls) * 100) : 0,
    avgLatency: m.avg_latency_ms,
    tokens: m.total_tokens,
    cost: m.total_cost_usd,
  }));

  // Calculate average escalation rates
  const avgLayer2Rate = escalationRates?.length 
    ? escalationRates.reduce((sum, r) => sum + (parseFloat(r.layer_2_rate) || 0), 0) / escalationRates.length
    : 0;
  const avgLayer3Rate = escalationRates?.length 
    ? escalationRates.reduce((sum, r) => sum + (parseFloat(r.layer_3_rate) || 0), 0) / escalationRates.length
    : 0;

  return {
    period: 'month',
    totals: {
      calls: totalCalls,
      tokens: totalTokens,
      costUsd: Math.round(totalCostUsd * 100) / 100,
      credits: totalCredits,
      avgLatencyMs: Math.round(avgLatency),
    },
    last24h: {
      calls: callsLast24h,
    },
    escalation: {
      layer2Rate: Math.round(avgLayer2Rate * 10) / 10,
      layer3Rate: Math.round(avgLayer3Rate * 10) / 10,
      escalationTrend: escalationRates?.slice(0, 7) || [],
    },
    modelDistribution,
  };
}

// Get consumption by tenant
async function getByTenant(limit = 20) {
  const { data, error } = await supabase
    .from('v_tenant_ai_consumption')
    .select('*')
    .order('total_ai_calls', { ascending: false })
    .limit(limit);

  if (error) {
    logStep('Error fetching tenant consumption', error);
    throw error;
  }

  return data?.map(t => ({
    tenantId: t.tenant_id,
    tenantName: t.tenant_name,
    totalCalls: t.total_ai_calls,
    totalTokens: t.total_tokens,
    totalCostUsd: t.total_cost_usd,
    avgLatencyMs: t.avg_latency_ms,
    lastAiCall: t.last_ai_call,
    creditsConsumed: t.credits_consumed,
  })) || [];
}

// Get model performance details
async function getModelPerformance() {
  const { data, error } = await supabase
    .from('v_ai_model_summary')
    .select('*');

  if (error) {
    logStep('Error fetching model performance', error);
    throw error;
  }

  return data?.map(m => ({
    model: m.model,
    totalCalls: m.total_calls,
    avgLatencyMs: m.avg_latency_ms,
    totalTokens: m.total_tokens,
    totalCostUsd: m.total_cost_usd,
    avgConfidence: m.avg_confidence,
    uniqueTenants: m.unique_tenants,
    firstCall: m.first_call,
    lastCall: m.last_call,
  })) || [];
}

// Get live feed of recent AI calls
async function getLiveFeed(limit = 50) {
  const { data, error } = await supabase
    .from('ai_orchestration_logs')
    .select(`
      id,
      ai_selected,
      tenant_id,
      conversation_stage,
      response_time_ms,
      tokens_used,
      cost_usd,
      confidence_score,
      has_objection,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logStep('Error fetching live feed', error);
    throw error;
  }

  // Get tenant names in bulk
  const tenantIds = [...new Set(data?.map(d => d.tenant_id).filter(Boolean))];
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .in('id', tenantIds);

  const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);

  return data?.map(log => ({
    id: log.id,
    model: log.ai_selected,
    tenantId: log.tenant_id,
    tenantName: tenantMap.get(log.tenant_id) || 'Desconhecido',
    stage: log.conversation_stage,
    latencyMs: log.response_time_ms,
    tokens: log.tokens_used,
    costUsd: log.cost_usd,
    confidence: log.confidence_score,
    hasObjection: log.has_objection,
    createdAt: log.created_at,
  })) || [];
}

// Get diagnostics for a specific tenant
async function getTenantDiagnostics(tenantId: string) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Get tenant info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .single();

  // Get AI logs for this tenant
  const { data: logs, error } = await supabase
    .from('ai_orchestration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', monthStart)
    .order('created_at', { ascending: false });

  if (error) {
    logStep('Error fetching tenant diagnostics', error);
    throw error;
  }

  // Calculate stats
  const totalCalls = logs?.length || 0;
  const totalTokens = logs?.reduce((sum, l) => sum + (l.tokens_used || 0), 0) || 0;
  const totalCostUsd = logs?.reduce((sum, l) => sum + (l.cost_usd || 0), 0) || 0;
  const avgLatency = totalCalls > 0
    ? logs!.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / totalCalls
    : 0;

  // Model breakdown
  const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
  logs?.forEach(log => {
    const model = log.ai_selected || 'unknown';
    if (!byModel[model]) byModel[model] = { calls: 0, tokens: 0, cost: 0 };
    byModel[model].calls++;
    byModel[model].tokens += log.tokens_used || 0;
    byModel[model].cost += log.cost_usd || 0;
  });

  return {
    tenant: {
      id: tenantId,
      name: tenant?.name || 'Desconhecido',
    },
    period: 'month',
    stats: {
      totalCalls,
      totalTokens,
      totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      avgLatencyMs: Math.round(avgLatency),
      credits: Math.round(totalCostUsd * 5.50 * 100),
    },
    byModel: Object.entries(byModel).map(([model, stats]) => ({
      model,
      calls: stats.calls,
      tokens: stats.tokens,
      cost: stats.cost,
      percentage: totalCalls > 0 ? Math.round((stats.calls / totalCalls) * 100) : 0,
    })),
    recentLogs: logs?.slice(0, 20).map(log => ({
      id: log.id,
      model: log.ai_selected,
      stage: log.conversation_stage,
      latencyMs: log.response_time_ms,
      tokens: log.tokens_used,
      createdAt: log.created_at,
    })) || [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started', { method: req.method });

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    const tenantId = url.searchParams.get('tenant_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let result;

    switch (path) {
      case 'summary':
        result = await getSummary();
        break;
      case 'by-tenant':
        result = await getByTenant(limit);
        break;
      case 'model-performance':
        result = await getModelPerformance();
        break;
      case 'live-feed':
        result = await getLiveFeed(limit);
        break;
      case 'tenant':
        if (!tenantId) throw new Error('tenant_id is required');
        result = await getTenantDiagnostics(tenantId);
        break;
      default:
        // Default: return summary
        result = await getSummary();
    }

    logStep('Returning result', { path, resultSize: JSON.stringify(result).length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
