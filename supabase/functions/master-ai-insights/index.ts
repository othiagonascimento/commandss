import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  subscription_status: string | null;
  is_blocked: boolean | null;
  contracted_users: number | null;
  price_per_user: number | null;
  created_at: string | null;
}

interface MetricsData {
  tenants: TenantData[];
  subscriptions: unknown[];
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
    
    logStep('Metrics gathered', { tenantsCount: metricsData.tenants?.length });

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
        // Free-form question from user
        userPrompt = `Contexto do usuário: ${context || 'Análise geral do negócio'}

DADOS DISPONÍVEIS:
- ${metricsData.summary.totalTenants} tenants (${metricsData.summary.activeTenants} ativos)
- MRR: R$ ${metricsData.summary.estimatedMRR.toFixed(2)}
- Distribuição: ${Object.entries(metricsData.summary.planDistribution).map(([p, c]) => `${p}: ${c}`).join(', ')}

Responda de forma conversacional e útil. Se não tiver dados suficientes, seja honesto.`;
        break;

      default:
        userPrompt = `Faça uma análise geral dos dados:
${JSON.stringify(metricsData.summary, null, 2)}

Retorne 3 insights principais em JSON:
{"insights": [{"type": "info", "title": "...", "description": "..."}]}`;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    logStep('Calling AI Gateway', { type });

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMITED' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to your Lovable workspace.',
          code: 'PAYMENT_REQUIRED' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await aiResponse.text();
      logStep('AI Gateway error', { status: aiResponse.status, error: errorText });
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    logStep('AI Response received', { contentLength: content.length });

    // Try to parse JSON from response
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content;
      parsedResponse = JSON.parse(jsonStr);
    } catch {
      // If not valid JSON, return as text
      parsedResponse = { 
        type: 'text',
        content,
        insights: [{
          type: 'info',
          title: 'Análise',
          description: content.slice(0, 500)
        }]
      };
    }

    return new Response(JSON.stringify({
      success: true,
      type,
      data: parsedResponse,
      generatedAt: new Date().toISOString(),
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
async function gatherMetrics(supabase: ReturnType<typeof createClient>): Promise<MetricsData> {
  // Get all tenants
  const { data: tenantsRaw } = await supabase
    .from('tenants')
    .select('id, name, subdomain, plan_type, subscription_status, is_blocked, contracted_users, price_per_user, created_at')
    .order('created_at', { ascending: false });

  const tenants: TenantData[] = (tenantsRaw || []) as TenantData[];

  // Get billing subscriptions
  const { data: subscriptions } = await supabase
    .from('billing_subscriptions')
    .select('tenant_id, status, plan_type');

  // Calculate summary
  const activeTenants = tenants?.filter(t => !t.is_blocked && t.subscription_status !== 'cancelled') || [];
  const planDistribution: Record<string, number> = {};
  
  tenants?.forEach(t => {
    const plan = t.plan_type || 'unknown';
    planDistribution[plan] = (planDistribution[plan] || 0) + 1;
  });

  const estimatedMRR = tenants?.reduce((sum, t) => {
    const users = t.contracted_users || 1;
    const pricePerUser = t.price_per_user || 69;
    return sum + (users * pricePerUser);
  }, 0) || 0;

  const totalUsers = tenants?.reduce((sum, t) => sum + (t.contracted_users || 1), 0) || 0;

  return {
    tenants: tenants || [],
    subscriptions: subscriptions || [],
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
