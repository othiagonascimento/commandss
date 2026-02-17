import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-AI-INSIGHTS] ${step}${detailsStr}`);
};

interface TenantData {
  id: string;
  name: string;
  subdomain: string;
  plan_type: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  is_blocked: boolean | null;
  contracted_users: number | null;
  price_per_user: number | null;
  channel_price: number | null;
  extra_channels: number | null;
  discount_type: string | null;
  discount_value: number | null;
  created_at: string | null;
}

interface PlanData {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
}

interface MetricsData {
  tenants: TenantData[];
  plans: PlanData[];
  subscriptions: unknown[];
  apiUsage: {
    totalCostBrl: number;
    totalTokens: number;
    byProvider: Record<string, { tokens: number; costBrl: number }>;
  };
  summary: {
    totalTenants: number;
    activeTenants: number;
    estimatedMRR: number;
    planDistribution: Record<string, number>;
    tenantsInTrial: number;
    blockedTenants: number;
    avgUsersPerTenant: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started', { method: req.method });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const body = await req.json().catch(() => ({}));
    const { type, context } = body;

    // Gather data for AI analysis
    const metricsData = await gatherMetrics(supabaseAdmin);
    
    logStep('Metrics gathered', { 
      tenantsCount: metricsData.tenants?.length,
      mrr: metricsData.summary.estimatedMRR,
      apiCost: metricsData.apiUsage.totalCostBrl
    });

    // Build the prompt based on type
    let systemPrompt = `Você é um analista de negócios expert em SaaS multi-tenant. 
Analise os dados fornecidos e forneça insights acionáveis em português brasileiro.
Seja direto, use números específicos, e priorize insights que podem gerar ação imediata.
Mantenha respostas concisas (máximo 3-4 insights por análise).`;

    let userPrompt = '';

    switch (type) {
      case 'dashboard_summary':
        userPrompt = `Analise o resumo do dashboard e forneça 3-4 insights principais:

MÉTRICAS ATUAIS:
- Total de tenants: ${metricsData.summary.totalTenants}
- Tenants ativos: ${metricsData.summary.activeTenants}
- MRR estimado: R$ ${metricsData.summary.estimatedMRR.toFixed(2)}
- Tenants em trial: ${metricsData.summary.tenantsInTrial}
- Tenants bloqueados: ${metricsData.summary.blockedTenants}
- Média de usuários por tenant: ${metricsData.summary.avgUsersPerTenant.toFixed(1)}

DISTRIBUIÇÃO POR PLANO:
${Object.entries(metricsData.summary.planDistribution).map(([plan, count]) => `- ${plan}: ${count}`).join('\n')}

CUSTOS DE API (mês atual):
- Custo total: R$ ${metricsData.apiUsage.totalCostBrl.toFixed(2)}
- Tokens consumidos: ${metricsData.apiUsage.totalTokens.toLocaleString('pt-BR')}
- Por provedor: ${Object.entries(metricsData.apiUsage.byProvider).map(([p, d]) => `${p}: R$${d.costBrl.toFixed(2)}`).join(', ') || 'Nenhum uso registrado'}
${metricsData.apiUsage.aiSummary ? `
DADOS DE IA (CRM - últimos 30 dias):
- Total de mensagens IA: ${metricsData.apiUsage.aiSummary.total_messages}
- Créditos consumidos: ${metricsData.apiUsage.aiSummary.total_credits}
- Latência média: ${metricsData.apiUsage.aiSummary.avg_latency_ms}ms
- Fallbacks: ${metricsData.apiUsage.aiSummary.fallbacks}
- Bloqueios: ${metricsData.apiUsage.aiSummary.blocks}
- Feedback positivo: ${metricsData.apiUsage.aiSummary.feedback_positive} | negativo: ${metricsData.apiUsage.aiSummary.feedback_negative} | editado: ${metricsData.apiUsage.aiSummary.feedback_edited}
` : ''}
${metricsData.apiUsage.aiModels && metricsData.apiUsage.aiModels.length > 0 ? `
MODELOS DE IA EM USO:
${metricsData.apiUsage.aiModels.map(m => `- ${m.model}: ${m.count} chamadas (${m.pct.toFixed(1)}%), latência ${m.avg_latency}ms`).join('\n')}
` : ''}
Retorne JSON no formato:
{
  "insights": [
    {"type": "success|warning|info|action", "title": "Título curto", "description": "Descrição do insight com números"},
  ],
  "summary": "Uma frase resumindo a saúde geral do negócio"
}`;
        break;

      case 'churn_risk':
        const atRiskTenants = metricsData.tenants
          .filter(t => t.is_blocked || t.subscription_status === 'past_due')
          .slice(0, 10);
        
        userPrompt = `Analise os tenants em risco de churn:

TENANTS EM RISCO (${atRiskTenants.length} de ${metricsData.tenants.length}):
${atRiskTenants.map(t => `- ${t.name}: status=${t.subscription_status}, bloqueado=${t.is_blocked}`).join('\n') || 'Nenhum tenant em risco identificado'}

Retorne JSON no formato:
{
  "riskLevel": "low|medium|high|critical",
  "atRiskCount": number,
  "insights": [
    {"tenantName": "Nome", "risk": "alto|médio|baixo", "action": "Ação recomendada"}
  ],
  "summary": "Resumo da situação de churn"
}`;
        break;

      case 'growth_opportunities':
        const upgradeCandidates = metricsData.tenants
          .filter(t => t.contracted_users && t.contracted_users >= 5 && t.plan_type === 'basic')
          .slice(0, 10);
        
        userPrompt = `Identifique oportunidades de crescimento:

CANDIDATOS A UPGRADE (tenants basic com 5+ usuários):
${upgradeCandidates.map(t => `- ${t.name}: ${t.contracted_users} usuários, plano ${t.plan_type}`).join('\n') || 'Nenhum candidato identificado'}

MÉTRICAS GERAIS:
- MRR atual: R$ ${metricsData.summary.estimatedMRR.toFixed(2)}
- Tenants no plano básico: ${metricsData.summary.planDistribution['basic'] || 0}

Retorne JSON no formato:
{
  "opportunities": [
    {"type": "upsell|cross-sell|expansion", "tenant": "Nome", "potential": "R$ X/mês", "action": "Ação sugerida"}
  ],
  "potentialMRRIncrease": number,
  "summary": "Resumo das oportunidades"
}`;
        break;

      case 'copilot':
        userPrompt = `Contexto do usuário: ${context || 'Análise geral do negócio'}

DADOS DISPONÍVEIS:
- ${metricsData.summary.totalTenants} tenants (${metricsData.summary.activeTenants} ativos)
- MRR: R$ ${metricsData.summary.estimatedMRR.toFixed(2)}
- Distribuição: ${Object.entries(metricsData.summary.planDistribution).map(([p, c]) => `${p}: ${c}`).join(', ')}
- Custo de APIs: R$ ${metricsData.apiUsage.totalCostBrl.toFixed(2)}

Responda de forma conversacional e útil. Se não tiver dados suficientes, seja honesto.`;
        break;

      default:
        userPrompt = `Faça uma análise geral dos dados:
${JSON.stringify(metricsData.summary, null, 2)}

Retorne 3 insights principais em JSON:
{"insights": [{"type": "info", "title": "...", "description": "..."}]}`;
    }

    // Try different AI providers in order: OpenAI -> Anthropic -> Google
    let aiContent = '';
    let providerUsed = '';

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY');

    // Try OpenAI first
    if (OPENAI_API_KEY) {
      try {
        logStep('Trying OpenAI');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiContent = data.choices?.[0]?.message?.content || '';
          providerUsed = 'openai';
          logStep('OpenAI success', { contentLength: aiContent.length });
        } else {
          logStep('OpenAI failed', { status: response.status });
        }
      } catch (e) {
        logStep('OpenAI error', { error: e instanceof Error ? e.message : String(e) });
      }
    }

    // Try Anthropic if OpenAI failed
    if (!aiContent && ANTHROPIC_API_KEY) {
      try {
        logStep('Trying Anthropic');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiContent = data.content?.[0]?.text || '';
          providerUsed = 'anthropic';
          logStep('Anthropic success', { contentLength: aiContent.length });
        } else {
          logStep('Anthropic failed', { status: response.status });
        }
      } catch (e) {
        logStep('Anthropic error', { error: e instanceof Error ? e.message : String(e) });
      }
    }

    // Try Google if others failed
    if (!aiContent && GOOGLE_API_KEY) {
      try {
        logStep('Trying Google Gemini');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          providerUsed = 'google';
          logStep('Google success', { contentLength: aiContent.length });
        } else {
          logStep('Google failed', { status: response.status });
        }
      } catch (e) {
        logStep('Google error', { error: e instanceof Error ? e.message : String(e) });
      }
    }

    // If no AI provider worked, return insights based on data analysis
    if (!aiContent) {
      logStep('No AI provider available, generating basic insights');
      
      const insights = [];
      
      // MRR insight
      if (metricsData.summary.estimatedMRR > 0) {
        insights.push({
          type: 'info',
          title: `MRR: R$ ${metricsData.summary.estimatedMRR.toFixed(2)}`,
          description: `Com ${metricsData.summary.totalTenants} tenants ativos gerando receita mensal recorrente.`
        });
      }

      // Tenant distribution
      const planDist = Object.entries(metricsData.summary.planDistribution);
      if (planDist.length > 0) {
        const topPlan = planDist.sort((a, b) => b[1] - a[1])[0];
        insights.push({
          type: 'info',
          title: `Plano mais popular: ${topPlan[0]}`,
          description: `${topPlan[1]} tenants (${Math.round((topPlan[1] / metricsData.summary.totalTenants) * 100)}% do total) estão neste plano.`
        });
      }

      // API costs
      if (metricsData.apiUsage.totalCostBrl > 0) {
        insights.push({
          type: metricsData.apiUsage.totalCostBrl > 100 ? 'warning' : 'success',
          title: `Custo de APIs: R$ ${metricsData.apiUsage.totalCostBrl.toFixed(2)}`,
          description: `${metricsData.apiUsage.totalTokens.toLocaleString('pt-BR')} tokens consumidos este mês.`
        });
      }

      // Blocked tenants warning
      if (metricsData.summary.blockedTenants > 0) {
        insights.push({
          type: 'warning',
          title: `${metricsData.summary.blockedTenants} tenants bloqueados`,
          description: 'Verificar motivos e potencial recuperação de receita.'
        });
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        data: {
          insights,
          summary: `Sistema com ${metricsData.summary.activeTenants} tenants ativos e MRR de R$ ${metricsData.summary.estimatedMRR.toFixed(2)}.`
        },
        generatedAt: new Date().toISOString(),
        provider: 'local'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to parse JSON from response
    let parsedResponse;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      const jsonStr = jsonMatch[1]?.trim() || aiContent;
      parsedResponse = JSON.parse(jsonStr);
    } catch {
      parsedResponse = { 
        type: 'text',
        content: aiContent,
        insights: [{
          type: 'info',
          title: 'Análise',
          description: aiContent.slice(0, 500)
        }]
      };
    }

    return new Response(JSON.stringify({
      success: true,
      type,
      data: parsedResponse,
      generatedAt: new Date().toISOString(),
      provider: providerUsed
    }), {
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

// Helper function to gather metrics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gatherMetrics(supabase: any): Promise<MetricsData> {
  // Get all tenants with plan info
  const { data: tenantsRaw } = await supabase
    .from('tenants')
    .select('id, name, subdomain, plan_type, plan_id, subscription_status, is_blocked, contracted_users, price_per_user, channel_price, extra_channels, discount_type, discount_value, created_at')
    .order('created_at', { ascending: false });

  const tenants: TenantData[] = (tenantsRaw || []) as TenantData[];

  // Get plans for pricing
  const { data: plansRaw } = await supabase
    .from('plans')
    .select('id, name, slug, price_monthly');
  
  const plans: PlanData[] = (plansRaw || []) as PlanData[];
  const planPrices = new Map(plans.map(p => [p.id, p.price_monthly]));
  const planSlugPrices = new Map(plans.map(p => [p.slug, p.price_monthly]));

  // Get billing subscriptions
  const { data: subscriptions } = await supabase
    .from('billing_subscriptions')
    .select('tenant_id, status, plan_type');

  // Fetch real AI data from CRM ai_advanced endpoint
  const remoteUrl = Deno.env.get('REMOTE_SUPABASE_URL');
  const remoteAnonKey = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');

  let aiAdvancedData: {
    layers?: { layer: string; model: string; count: number }[];
    models?: { model: string; count: number; avg_latency: number; credits: number; pct: number }[];
    providers?: { provider: string; count: number; credits: number }[];
    summary?: { total_messages: number; total_credits: number; total_tokens: number; avg_latency_ms: number; fallbacks: number; blocks: number; feedback_positive: number; feedback_negative: number; feedback_edited: number };
  } | null = null;

  if (remoteUrl && remoteAnonKey) {
    try {
      const crmResponse = await fetch(
        `${remoteUrl}/functions/v1/master-core/analytics?action=ai_advanced&days=30`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${remoteAnonKey}`,
            'apikey': remoteAnonKey,
            'Content-Type': 'application/json',
          },
        }
      );
      if (crmResponse.ok) {
        aiAdvancedData = await crmResponse.json();
        logStep('AI Advanced data fetched from CRM', {
          models: aiAdvancedData?.models?.length,
          providers: aiAdvancedData?.providers?.length,
        });
      } else {
        logStep('Failed to fetch AI Advanced from CRM', { status: crmResponse.status });
      }
    } catch (e) {
      logStep('Error fetching AI Advanced from CRM', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Build API usage: prefer CRM data, fallback to local api_usage_logs
  const apiUsage = {
    totalCostBrl: 0,
    totalTokens: 0,
    byProvider: {} as Record<string, { tokens: number; costBrl: number }>,
    // Enriched AI data from CRM
    aiLayers: aiAdvancedData?.layers || [],
    aiModels: aiAdvancedData?.models || [],
    aiSummary: aiAdvancedData?.summary || null,
  };

  if (aiAdvancedData?.providers && aiAdvancedData.providers.length > 0) {
    // Use real CRM provider data
    for (const p of aiAdvancedData.providers) {
      apiUsage.byProvider[p.provider] = { tokens: 0, costBrl: p.credits };
      apiUsage.totalCostBrl += p.credits;
    }
    apiUsage.totalTokens = aiAdvancedData.summary?.total_tokens || 0;
  } else {
    // Fallback to local api_usage_logs
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: apiLogs } = await supabase
      .from('api_usage_logs')
      .select('provider, total_tokens, cost_brl')
      .gte('created_at', startOfMonth.toISOString());

    (apiLogs || []).forEach((log: { provider: string; total_tokens: number | null; cost_brl: number | null }) => {
      const cost = log.cost_brl || 0;
      const tokens = log.total_tokens || 0;
      
      apiUsage.totalCostBrl += cost;
      apiUsage.totalTokens += tokens;
      
      if (!apiUsage.byProvider[log.provider]) {
        apiUsage.byProvider[log.provider] = { tokens: 0, costBrl: 0 };
      }
      apiUsage.byProvider[log.provider].tokens += tokens;
      apiUsage.byProvider[log.provider].costBrl += cost;
    });
  }

  // Calculate summary with correct MRR
  const activeTenants = tenants?.filter(t => !t.is_blocked && t.subscription_status !== 'cancelled') || [];
  const planDistribution: Record<string, number> = {};
  
  tenants?.forEach(t => {
    const plan = t.plan_type || 'unknown';
    planDistribution[plan] = (planDistribution[plan] || 0) + 1;
  });

  // Calculate MRR correctly
  let estimatedMRR = 0;
  tenants?.forEach(t => {
    if (t.is_blocked) return;
    
    // Base plan price (from plan_id or plan_type)
    let basePlanPrice = 0;
    if (t.plan_id) {
      basePlanPrice = planPrices.get(t.plan_id) || 0;
    } else if (t.plan_type) {
      basePlanPrice = planSlugPrices.get(t.plan_type) || 0;
    }
    
    // Per-user pricing
    const userRevenue = (t.price_per_user || 0) * (t.contracted_users || 0);
    
    // Channel pricing
    const channelRevenue = (t.channel_price || 0) * (t.extra_channels || 0);
    
    // Total before discount
    let tenantMRR = basePlanPrice + userRevenue + channelRevenue;
    
    // Apply discount
    if (t.discount_type === 'percent' && t.discount_value) {
      tenantMRR = tenantMRR * (1 - t.discount_value / 100);
    } else if (t.discount_type === 'fixed' && t.discount_value) {
      tenantMRR = Math.max(0, tenantMRR - t.discount_value);
    }
    
    estimatedMRR += tenantMRR;
  });

  const totalUsers = tenants?.reduce((sum, t) => sum + (t.contracted_users || 1), 0) || 0;

  return {
    tenants: tenants || [],
    plans: plans || [],
    subscriptions: subscriptions || [],
    apiUsage,
    summary: {
      totalTenants: tenants?.length || 0,
      activeTenants: activeTenants.length,
      estimatedMRR,
      planDistribution,
      tenantsInTrial: tenants?.filter(t => t.subscription_status === 'trialing').length || 0,
      blockedTenants: tenants?.filter(t => t.is_blocked).length || 0,
      avgUsersPerTenant: tenants?.length ? totalUsers / tenants.length : 0,
    },
  };
}
