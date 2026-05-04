import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Local Supabase (Master)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Remote Supabase (CRM where actual AI data lives)
const remoteUrl = Deno.env.get('REMOTE_SUPABASE_URL');
const remoteKey = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');
const remoteSupabase = remoteUrl && remoteKey 
  ? createClient(remoteUrl, remoteKey)
  : null;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-DIAGNOSTICS] ${step}${detailsStr}`);
};

// Table and column mapping for different database schemas
// Remote CRM uses 'orchestrator_logs' with different column names
// Local Master uses 'ai_orchestration_logs' with standard column names
interface ColumnMapping {
  tableName: string;
  aiModel: string;
  tenantId: string;
  tokensUsed: string;
  costUsd: string;
  responseTimeMs: string;
  confidenceScore: string;
  hasObjection: string;
  conversationStage: string;
  createdAt: string;
}

const getColumnMapping = (): ColumnMapping => {
  if (remoteSupabase) {
    // Remote CRM schema - try common column name patterns
    return {
      tableName: 'orchestrator_logs',
      aiModel: 'model_used',        // or 'selected_model', 'ai_model'
      tenantId: 'tenant_id',
      tokensUsed: 'tokens',         // or 'token_count', 'total_tokens'
      costUsd: 'cost',              // or 'total_cost', 'cost_usd'
      responseTimeMs: 'latency_ms', // or 'response_time', 'duration_ms'
      confidenceScore: 'confidence',
      hasObjection: 'has_objection',
      conversationStage: 'stage',   // or 'conversation_stage'
      createdAt: 'created_at',
    };
  }
  // Local Master schema
  return {
    tableName: 'ai_orchestration_logs',
    aiModel: 'ai_selected',
    tenantId: 'tenant_id',
    tokensUsed: 'tokens_used',
    costUsd: 'cost_usd',
    responseTimeMs: 'response_time_ms',
    confidenceScore: 'confidence_score',
    hasObjection: 'has_objection',
    conversationStage: 'conversation_stage',
    createdAt: 'created_at',
  };
};

// Get the data client (prefer remote if available)
const getDataClient = () => {
  if (remoteSupabase) {
    logStep('Using REMOTE Supabase', { url: remoteUrl });
    return remoteSupabase;
  }
  logStep('Using LOCAL Supabase (no remote configured)', { url: supabaseUrl });
  return supabase;
};

// Dynamically discover the schema of orchestrator_logs table
async function discoverSchema() {
  const client = getDataClient();
  const mapping = getColumnMapping();
  
  try {
    // Try to fetch one row to see what columns exist
    const { data, error } = await client
      .from(mapping.tableName)
      .select('*')
      .limit(1);

    if (error) {
      logStep('Error discovering schema', error);
      return null;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      logStep('Discovered schema', { columns });
      return columns;
    }

    logStep('No data in table to discover schema');
    return null;
  } catch (e) {
    logStep('Exception discovering schema', e);
    return null;
  }
}

// Get summary statistics
async function getSummary() {
  const client = getDataClient();
  const mapping = getColumnMapping();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  logStep('Getting summary', { tableName: mapping.tableName, monthStart });

  // First, discover the actual schema
  const columns = await discoverSchema();
  
  // Build dynamic select based on available columns
  let selectFields = '*';
  if (columns) {
    logStep('Available columns in remote table', { columns });
  }

  // Query directly from orchestration logs table with all columns
  const { data: logsData, error: logsError } = await client
    .from(mapping.tableName)
    .select('*')
    .gte(mapping.createdAt, monthStart);

  if (logsError) {
    logStep('Error fetching logs', logsError);
    return {
      period: 'month',
      dataSource: remoteSupabase ? 'remote' : 'local',
      tableName: mapping.tableName,
      error: logsError.message,
      totals: { calls: 0, tokens: 0, costUsd: 0, credits: 0, avgLatencyMs: 0 },
      last24h: { calls: 0 },
      escalation: { layer1Calls: 0, layer2Calls: 0, layer3Calls: 0, layer2Rate: 0, layer3Rate: 0, escalationTrend: [] },
      modelDistribution: [],
    };
  }

  logStep('Logs fetched', { count: logsData?.length || 0 });

  if (!logsData || logsData.length === 0) {
    return {
      period: 'month',
      dataSource: remoteSupabase ? 'remote' : 'local',
      tableName: mapping.tableName,
      schemaDiscovered: columns,
      totals: { calls: 0, tokens: 0, costUsd: 0, credits: 0, avgLatencyMs: 0 },
      last24h: { calls: 0 },
      escalation: { layer1Calls: 0, layer2Calls: 0, layer3Calls: 0, layer2Rate: 0, layer3Rate: 0, escalationTrend: [] },
      modelDistribution: [],
    };
  }

  // Log first record to understand schema
  logStep('Sample record', { record: logsData[0] });

  // Aggregate by model - try multiple possible column names
  const modelMap: Record<string, { 
    calls: number; 
    tokens: number; 
    cost: number; 
    latency: number; 
    confidence: number;
    tenants: Set<string>;
  }> = {};

  let totalCalls = 0;
  let totalTokens = 0;
  let totalCostUsd = 0;
  let totalLatency = 0;

  // Try to find the right column names dynamically
  const getModelFromLog = (log: Record<string, unknown>): string => {
    return (log.model_used || log.ai_selected || log.selected_model || log.ai_model || log.model || 'unknown') as string;
  };

  const getTokensFromLog = (log: Record<string, unknown>): number => {
    return Number(log.tokens_used || log.tokens || log.token_count || log.total_tokens || 0);
  };

  const getCostFromLog = (log: Record<string, unknown>): number => {
    return Number(log.cost_usd || log.cost || log.total_cost || 0);
  };

  const getLatencyFromLog = (log: Record<string, unknown>): number => {
    return Number(log.response_time_ms || log.latency_ms || log.response_time || log.duration_ms || log.latency || 0);
  };

  const getConfidenceFromLog = (log: Record<string, unknown>): number => {
    return Number(log.confidence_score || log.confidence || 0);
  };

  const getTenantFromLog = (log: Record<string, unknown>): string => {
    return (log.tenant_id || log.tenantId || '') as string;
  };

  (logsData as Record<string, unknown>[]).forEach(log => {
    totalCalls++;
    totalTokens += getTokensFromLog(log);
    totalCostUsd += getCostFromLog(log);
    totalLatency += getLatencyFromLog(log);

    const model = getModelFromLog(log);
    if (!modelMap[model]) {
      modelMap[model] = { calls: 0, tokens: 0, cost: 0, latency: 0, confidence: 0, tenants: new Set() };
    }
    modelMap[model].calls++;
    modelMap[model].tokens += getTokensFromLog(log);
    modelMap[model].cost += getCostFromLog(log);
    modelMap[model].latency += getLatencyFromLog(log);
    modelMap[model].confidence += getConfidenceFromLog(log);
    const tenantId = getTenantFromLog(log);
    if (tenantId) modelMap[model].tenants.add(tenantId);
  });

  const modelSummary = Object.entries(modelMap).map(([model, data]) => ({
    model,
    total_calls: data.calls,
    total_tokens: data.tokens,
    total_cost_usd: data.cost,
    avg_latency_ms: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
    avg_confidence: data.calls > 0 ? data.confidence / data.calls : 0,
    unique_tenants: data.tenants.size,
  }));

  const avgLatency = totalCalls > 0 ? totalLatency / totalCalls : 0;

  // Calculate credits (1 credit = R$ 0.01 = $0.00182 at 5.50 rate)
  const usdToBrlRate = 5.50;
  const totalCredits = Math.round(totalCostUsd * usdToBrlRate * 100);

  // Get 24h stats for comparison
  const { data: last24h } = await client
    .from(mapping.tableName)
    .select('id')
    .gte(mapping.createdAt, dayAgo);

  const callsLast24h = last24h?.length || 0;

  // Calculate model distribution
  const modelDistribution = modelSummary.map(m => ({
    model: m.model,
    calls: m.total_calls,
    percentage: totalCalls > 0 ? Math.round((m.total_calls / totalCalls) * 100) : 0,
    avgLatency: m.avg_latency_ms,
    tokens: m.total_tokens,
    cost: m.total_cost_usd,
  }));

  // Calculate escalation rates (Layer 2 = claude/gpt-4, Layer 3 = sonnet/gpt-4o)
  const layer1Models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gpt-4o-mini', 'gpt-3.5'];
  const layer2Models = ['claude-3-haiku', 'claude-3-5-haiku', 'gpt-4'];
  const layer3Models = ['claude-3-5-sonnet', 'claude-3-opus', 'gpt-4o', 'gpt-4-turbo'];

  let layer1Calls = 0;
  let layer2Calls = 0;
  let layer3Calls = 0;

  modelSummary.forEach(m => {
    const modelLower = m.model.toLowerCase();
    if (layer3Models.some(l3 => modelLower.includes(l3.toLowerCase()))) {
      layer3Calls += m.total_calls;
    } else if (layer2Models.some(l2 => modelLower.includes(l2.toLowerCase()))) {
      layer2Calls += m.total_calls;
    } else {
      layer1Calls += m.total_calls;
    }
  });

  const layer2Rate = totalCalls > 0 ? (layer2Calls / totalCalls) * 100 : 0;
  const layer3Rate = totalCalls > 0 ? (layer3Calls / totalCalls) * 100 : 0;

  return {
    period: 'month',
    dataSource: remoteSupabase ? 'remote' : 'local',
    tableName: mapping.tableName,
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
      layer1Calls,
      layer2Calls,
      layer3Calls,
      layer2Rate: Math.round(layer2Rate * 10) / 10,
      layer3Rate: Math.round(layer3Rate * 10) / 10,
      escalationTrend: [],
    },
    modelDistribution,
  };
}

// Get consumption by tenant
async function getByTenant(limit = 20) {
  const client = getDataClient();
  const mapping = getColumnMapping();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  logStep('Getting by tenant', { tableName: mapping.tableName, limit });
  
  // Aggregate directly from logs
  const { data: logs, error: logsError } = await client
    .from(mapping.tableName)
    .select('*')
    .gte(mapping.createdAt, monthStart);

  if (logsError) {
    logStep('Error fetching logs for tenant aggregation', logsError);
    return [];
  }

  if (!logs || logs.length === 0) {
    logStep('No AI logs found');
    return [];
  }

  logStep('Logs for tenant aggregation', { count: logs.length });

  // Helper functions for dynamic column access
  const getTokensFromLog = (log: Record<string, unknown>): number => {
    return Number(log.tokens_used || log.tokens || log.token_count || log.total_tokens || 0);
  };

  const getCostFromLog = (log: Record<string, unknown>): number => {
    return Number(log.cost_usd || log.cost || log.total_cost || 0);
  };

  const getLatencyFromLog = (log: Record<string, unknown>): number => {
    return Number(log.response_time_ms || log.latency_ms || log.response_time || log.duration_ms || log.latency || 0);
  };

  const getTenantFromLog = (log: Record<string, unknown>): string => {
    return (log.tenant_id || log.tenantId || 'unknown') as string;
  };

  const getCreatedAtFromLog = (log: Record<string, unknown>): string => {
    return (log.created_at || log.createdAt || '') as string;
  };

  // Aggregate by tenant
  const tenantMap: Record<string, { 
    calls: number; 
    tokens: number; 
    cost: number; 
    latency: number;
    lastCall: string;
  }> = {};

  (logs as Record<string, unknown>[]).forEach(log => {
    const tid = getTenantFromLog(log);
    if (!tenantMap[tid]) {
      tenantMap[tid] = { calls: 0, tokens: 0, cost: 0, latency: 0, lastCall: '' };
    }
    tenantMap[tid].calls++;
    tenantMap[tid].tokens += getTokensFromLog(log);
    tenantMap[tid].cost += getCostFromLog(log);
    tenantMap[tid].latency += getLatencyFromLog(log);
    const createdAt = getCreatedAtFromLog(log);
    if (!tenantMap[tid].lastCall || createdAt > tenantMap[tid].lastCall) {
      tenantMap[tid].lastCall = createdAt;
    }
  });

  // Get tenant names from local Master database
  const tenantIds = Object.keys(tenantMap).filter(id => id !== 'unknown');
  const tenantNameMap = new Map<string, string>();

  if (tenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name')
      .in('id', tenantIds);
    
    tenants?.forEach(t => tenantNameMap.set(t.id, t.name));

    // Also try remote
    if (remoteSupabase) {
      const { data: remoteTenants } = await remoteSupabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);
      
      remoteTenants?.forEach(t => {
        if (!tenantNameMap.has(t.id)) {
          tenantNameMap.set(t.id, t.name);
        }
      });
    }
  }

  const result = Object.entries(tenantMap)
    .map(([tenantId, data]) => ({
      tenantId,
      tenantName: tenantNameMap.get(tenantId) || 'Desconhecido',
      totalCalls: data.calls,
      totalTokens: data.tokens,
      totalCostUsd: Math.round(data.cost * 100) / 100,
      avgLatencyMs: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
      lastAiCall: data.lastCall,
      creditsConsumed: Math.round(data.cost * 5.50 * 100),
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, limit);

  logStep('Aggregated tenant consumption', { count: result.length });
  return result;
}

// Get model performance details
async function getModelPerformance() {
  const client = getDataClient();
  const mapping = getColumnMapping();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  
  const { data: logs, error } = await client
    .from(mapping.tableName)
    .select('*')
    .gte(mapping.createdAt, monthStart);

  if (error) {
    logStep('Error fetching model performance', error);
    return [];
  }

  if (!logs || logs.length === 0) {
    return [];
  }

  // Helper functions
  const getModelFromLog = (log: Record<string, unknown>): string => {
    return (log.model_used || log.ai_selected || log.selected_model || log.ai_model || log.model || 'unknown') as string;
  };
  const getTokensFromLog = (log: Record<string, unknown>): number => {
    return Number(log.tokens_used || log.tokens || log.token_count || log.total_tokens || 0);
  };
  const getCostFromLog = (log: Record<string, unknown>): number => {
    return Number(log.cost_usd || log.cost || log.total_cost || 0);
  };
  const getLatencyFromLog = (log: Record<string, unknown>): number => {
    return Number(log.response_time_ms || log.latency_ms || log.response_time || log.duration_ms || log.latency || 0);
  };
  const getConfidenceFromLog = (log: Record<string, unknown>): number => {
    return Number(log.confidence_score || log.confidence || 0);
  };
  const getTenantFromLog = (log: Record<string, unknown>): string => {
    return (log.tenant_id || log.tenantId || '') as string;
  };
  const getCreatedAtFromLog = (log: Record<string, unknown>): string => {
    return (log.created_at || log.createdAt || '') as string;
  };

  // Aggregate by model
  const modelMap: Record<string, { 
    calls: number; 
    tokens: number; 
    cost: number; 
    latency: number;
    confidence: number;
    tenants: Set<string>;
    firstCall: string;
    lastCall: string;
  }> = {};

  (logs as Record<string, unknown>[]).forEach(log => {
    const model = getModelFromLog(log);
    const createdAt = getCreatedAtFromLog(log);
    
    if (!modelMap[model]) {
      modelMap[model] = { 
        calls: 0, tokens: 0, cost: 0, latency: 0, confidence: 0, 
        tenants: new Set(), firstCall: createdAt, lastCall: createdAt 
      };
    }
    modelMap[model].calls++;
    modelMap[model].tokens += getTokensFromLog(log);
    modelMap[model].cost += getCostFromLog(log);
    modelMap[model].latency += getLatencyFromLog(log);
    modelMap[model].confidence += getConfidenceFromLog(log);
    const tenantId = getTenantFromLog(log);
    if (tenantId) modelMap[model].tenants.add(tenantId);
    if (createdAt < modelMap[model].firstCall) modelMap[model].firstCall = createdAt;
    if (createdAt > modelMap[model].lastCall) modelMap[model].lastCall = createdAt;
  });

  return Object.entries(modelMap).map(([model, data]) => ({
    model,
    totalCalls: data.calls,
    avgLatencyMs: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
    totalTokens: data.tokens,
    totalCostUsd: Math.round(data.cost * 100) / 100,
    avgConfidence: data.calls > 0 ? Math.round((data.confidence / data.calls) * 100) / 100 : 0,
    uniqueTenants: data.tenants.size,
    firstCall: data.firstCall,
    lastCall: data.lastCall,
  }));
}

// Get live feed of recent AI calls
async function getLiveFeed(limit = 50) {
  const client = getDataClient();
  const mapping = getColumnMapping();
  
  logStep('Getting live feed', { tableName: mapping.tableName, limit });

  const { data, error } = await client
    .from(mapping.tableName)
    .select('*')
    .order(mapping.createdAt, { ascending: false })
    .limit(limit);

  if (error) {
    logStep('Error fetching live feed', error);
    throw error;
  }

  logStep('Live feed fetched', { count: data?.length || 0 });

  if (!data || data.length === 0) {
    return [];
  }

  // Helper functions
  const getModelFromLog = (log: Record<string, unknown>): string => {
    return (log.model_used || log.ai_selected || log.selected_model || log.ai_model || log.model || 'unknown') as string;
  };
  const getTokensFromLog = (log: Record<string, unknown>): number => {
    return Number(log.tokens_used || log.tokens || log.token_count || log.total_tokens || 0);
  };
  const getCostFromLog = (log: Record<string, unknown>): number => {
    return Number(log.cost_usd || log.cost || log.total_cost || 0);
  };
  const getLatencyFromLog = (log: Record<string, unknown>): number => {
    return Number(log.response_time_ms || log.latency_ms || log.response_time || log.duration_ms || log.latency || 0);
  };
  const getConfidenceFromLog = (log: Record<string, unknown>): number => {
    return Number(log.confidence_score || log.confidence || 0);
  };
  const getTenantFromLog = (log: Record<string, unknown>): string => {
    return (log.tenant_id || log.tenantId || '') as string;
  };
  const getStageFromLog = (log: Record<string, unknown>): string => {
    return (log.conversation_stage || log.stage || '') as string;
  };
  const getCreatedAtFromLog = (log: Record<string, unknown>): string => {
    return (log.created_at || log.createdAt || '') as string;
  };
  const getHasObjectionFromLog = (log: Record<string, unknown>): boolean => {
    return Boolean(log.has_objection || log.hasObjection || false);
  };

  // Get tenant names
  const tenantIds = [...new Set((data as Record<string, unknown>[]).map(d => getTenantFromLog(d)).filter(Boolean))];
  const tenantMap = new Map<string, string>();
  
  if (tenantIds.length > 0) {
    const { data: localTenants } = await supabase
      .from('tenants')
      .select('id, name')
      .in('id', tenantIds);
    
    localTenants?.forEach(t => tenantMap.set(t.id, t.name));

    if (remoteSupabase) {
      const { data: remoteTenants } = await remoteSupabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);
      
      remoteTenants?.forEach(t => {
        if (!tenantMap.has(t.id)) {
          tenantMap.set(t.id, t.name);
        }
      });
    }
  }

  return (data as Record<string, unknown>[]).map(log => ({
    id: log.id,
    model: getModelFromLog(log),
    tenantId: getTenantFromLog(log),
    tenantName: tenantMap.get(getTenantFromLog(log)) || 'Desconhecido',
    stage: getStageFromLog(log),
    latencyMs: getLatencyFromLog(log),
    tokens: getTokensFromLog(log),
    costUsd: getCostFromLog(log),
    confidence: getConfidenceFromLog(log),
    hasObjection: getHasObjectionFromLog(log),
    createdAt: getCreatedAtFromLog(log),
  }));
}

// Get diagnostics for a specific tenant
async function getTenantDiagnostics(tenantId: string) {
  const client = getDataClient();
  const mapping = getColumnMapping();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Get tenant info
  let tenantName = 'Desconhecido';
  
  const { data: localTenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .single();

  if (localTenant) {
    tenantName = localTenant.name;
  } else if (remoteSupabase) {
    const { data: remoteTenant } = await remoteSupabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single();
    if (remoteTenant) tenantName = remoteTenant.name;
  }

  // Get AI logs for this tenant
  const { data: logs, error } = await client
    .from(mapping.tableName)
    .select('*')
    .eq(mapping.tenantId, tenantId)
    .gte(mapping.createdAt, monthStart)
    .order(mapping.createdAt, { ascending: false });

  if (error) {
    logStep('Error fetching tenant diagnostics', error);
    throw error;
  }

  logStep('Tenant diagnostics fetched', { tenantId, logsCount: logs?.length || 0 });

  // Helper functions
  const getModelFromLog = (log: Record<string, unknown>): string => {
    return (log.model_used || log.ai_selected || log.selected_model || log.ai_model || log.model || 'unknown') as string;
  };
  const getTokensFromLog = (log: Record<string, unknown>): number => {
    return Number(log.tokens_used || log.tokens || log.token_count || log.total_tokens || 0);
  };
  const getCostFromLog = (log: Record<string, unknown>): number => {
    return Number(log.cost_usd || log.cost || log.total_cost || 0);
  };
  const getLatencyFromLog = (log: Record<string, unknown>): number => {
    return Number(log.response_time_ms || log.latency_ms || log.response_time || log.duration_ms || log.latency || 0);
  };
  const getStageFromLog = (log: Record<string, unknown>): string => {
    return (log.conversation_stage || log.stage || '') as string;
  };
  const getCreatedAtFromLog = (log: Record<string, unknown>): string => {
    return (log.created_at || log.createdAt || '') as string;
  };

  // Calculate stats
  const totalCalls = logs?.length || 0;
  const totalTokens = (logs as Record<string, unknown>[] || []).reduce((sum, l) => sum + getTokensFromLog(l), 0);
  const totalCostUsd = (logs as Record<string, unknown>[] || []).reduce((sum, l) => sum + getCostFromLog(l), 0);
  const avgLatency = totalCalls > 0
    ? (logs as Record<string, unknown>[]).reduce((sum, l) => sum + getLatencyFromLog(l), 0) / totalCalls
    : 0;

  // Model breakdown
  const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
  (logs as Record<string, unknown>[] || []).forEach(log => {
    const model = getModelFromLog(log);
    if (!byModel[model]) byModel[model] = { calls: 0, tokens: 0, cost: 0 };
    byModel[model].calls++;
    byModel[model].tokens += getTokensFromLog(log);
    byModel[model].cost += getCostFromLog(log);
  });

  return {
    tenant: {
      id: tenantId,
      name: tenantName,
    },
    period: 'month',
    dataSource: remoteSupabase ? 'remote' : 'local',
    tableName: mapping.tableName,
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
    recentLogs: (logs as Record<string, unknown>[] || []).slice(0, 20).map(log => ({
      id: log.id,
      model: getModelFromLog(log),
      stage: getStageFromLog(log),
      latencyMs: getLatencyFromLog(log),
      tokens: getTokensFromLog(log),
      createdAt: getCreatedAtFromLog(log),
    })),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapping = getColumnMapping();
    logStep('Function started', { 
      method: req.method,
      hasRemote: !!remoteSupabase,
      tableName: mapping.tableName,
      remoteUrl: remoteUrl ? remoteUrl.substring(0, 30) + '...' : 'not configured'
    });

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
