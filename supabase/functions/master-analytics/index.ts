import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Generate mock time series data
function generateTimeSeriesData(months: number = 12) {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const baseGrowth = 1 + (months - i) * 0.08;
    const variance = 0.9 + Math.random() * 0.2;
    
    data.push({
      month: monthName,
      date: date.toISOString(),
      mrr: Math.round(2500 * baseGrowth * variance),
      tenants: Math.round(8 + (months - i) * 0.6 * variance),
      leads: Math.round(150 * baseGrowth * variance),
      users: Math.round(25 * baseGrowth * variance),
      messages: Math.round(800 * baseGrowth * variance),
    });
  }
  
  return data;
}

// Generate activity logs
function generateActivityLogs(count: number = 50) {
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPERSONATE'];
  const entities = ['tenant', 'user', 'subscription', 'template', 'settings'];
  const users = [
    { email: 'admin@uopa.com.br', id: '1' },
    { email: 'suporte@uopa.com.br', id: '2' },
    { email: 'vendas@uopa.com.br', id: '3' },
  ];
  const tenants = [
    { name: 'Loja do João', id: 't1' },
    { name: 'Imobiliária Central', id: 't2' },
    { name: 'Auto Center SP', id: 't3' },
    { name: 'Pet Shop Amigo', id: 't4' },
  ];

  const logs = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entity = entities[Math.floor(Math.random() * entities.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const tenant = Math.random() > 0.3 ? tenants[Math.floor(Math.random() * tenants.length)] : null;

    logs.push({
      id: `log-${i}`,
      action,
      entity_type: entity,
      entity_id: `${entity}-${Math.floor(Math.random() * 100)}`,
      user_id: user.id,
      user_email: user.email,
      tenant_id: tenant?.id || null,
      tenant_name: tenant?.name || null,
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0',
      created_at: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      old_values: action === 'UPDATE' ? { status: 'old' } : null,
      new_values: action === 'UPDATE' ? { status: 'new' } : null,
    });
  }

  return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Generate tenant health data
function generateTenantHealthData() {
  const tenants = [
    { id: 't1', name: 'Loja do João', subdomain: 'loja-joao', plan_type: 'pro' },
    { id: 't2', name: 'Imobiliária Central', subdomain: 'imob-central', plan_type: 'enterprise' },
    { id: 't3', name: 'Auto Center SP', subdomain: 'auto-center', plan_type: 'pro' },
    { id: 't4', name: 'Pet Shop Amigo', subdomain: 'pet-amigo', plan_type: 'basic' },
    { id: 't5', name: 'Restaurante Sabor', subdomain: 'rest-sabor', plan_type: 'basic' },
    { id: 't6', name: 'Academia Fit', subdomain: 'acad-fit', plan_type: 'pro' },
    { id: 't7', name: 'Clínica Saúde', subdomain: 'clinica-saude', plan_type: 'enterprise' },
    { id: 't8', name: 'Escola Tech', subdomain: 'escola-tech', plan_type: 'basic' },
  ];

  return tenants.map(tenant => {
    const health_score = Math.floor(Math.random() * 60) + 40;
    const status = health_score >= 80 ? 'healthy' 
      : health_score >= 50 ? 'warning' 
      : health_score >= 20 ? 'critical' 
      : 'inactive';

    const alerts = [];
    if (health_score < 50) {
      alerts.push({ type: 'error', message: 'Sem atividade há mais de 7 dias' });
    }
    if (Math.random() > 0.7) {
      alerts.push({ type: 'warning', message: 'Uso de storage acima de 80%' });
    }
    if (Math.random() > 0.8) {
      alerts.push({ type: 'info', message: 'Novo usuário adicionado' });
    }

    return {
      ...tenant,
      health_score,
      status,
      last_activity: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        active_users: Math.floor(Math.random() * 5) + 1,
        total_users: Math.floor(Math.random() * 10) + 5,
        messages_24h: Math.floor(Math.random() * 100),
        messages_trend: Math.floor(Math.random() * 40) - 20,
        leads_7d: Math.floor(Math.random() * 50),
        error_count: Math.floor(Math.random() * 5),
        storage_used_percent: Math.floor(Math.random() * 100),
        ai_tokens_used_percent: Math.floor(Math.random() * 100),
      },
      alerts,
    };
  });
}

// Generate billing intelligence data
function generateBillingIntelligence() {
  // Cohort data
  const cohortMonths = ['Jan/24', 'Fev/24', 'Mar/24', 'Abr/24', 'Mai/24', 'Jun/24'];
  const cohort = cohortMonths.map((month, i) => {
    const baseRetention = 100;
    return {
      cohort: month,
      total: Math.floor(Math.random() * 10) + 5,
      month_1: baseRetention,
      month_2: baseRetention - (Math.random() * 15),
      month_3: baseRetention - (Math.random() * 25),
      month_4: baseRetention - (Math.random() * 35),
      month_5: baseRetention - (Math.random() * 45),
      month_6: baseRetention - (Math.random() * 55),
    };
  });

  // Churn risk
  const churnRisk = [
    {
      id: 't1',
      name: 'Pet Shop Antigo',
      risk_score: 85,
      risk_factors: ['15 dias sem login', 'Queda de 80% no uso', 'Ticket aberto'],
      last_activity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      mrr: 149,
      days_since_login: 15,
    },
    {
      id: 't2',
      name: 'Loja Esquecida',
      risk_score: 72,
      risk_factors: ['10 dias sem login', 'Poucos leads'],
      last_activity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      mrr: 99,
      days_since_login: 10,
    },
    {
      id: 't3',
      name: 'Imóveis Parados',
      risk_score: 65,
      risk_factors: ['Queda de uso', 'Sem novos usuários'],
      last_activity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      mrr: 299,
      days_since_login: 7,
    },
  ];

  // Revenue breakdown
  const revenueBreakdown = {
    by_plan: [
      { plan: 'Basic', revenue: 1485, count: 15 },
      { plan: 'Pro', revenue: 3582, count: 12 },
      { plan: 'Enterprise', revenue: 2394, count: 4 },
    ],
    by_period: cohortMonths.map((month, i) => ({
      month,
      revenue: 3000 + i * 500 + Math.random() * 500,
      new: Math.floor(Math.random() * 1000) + 200,
      churned: Math.floor(Math.random() * 300),
    })),
    by_sales_rep: [
      { name: 'Carlos Silva', revenue: 4500, tenants: 12 },
      { name: 'Ana Santos', revenue: 3200, tenants: 8 },
      { name: 'Pedro Lima', revenue: 2100, tenants: 5 },
    ],
  };

  // Key metrics
  const metrics = {
    ltv: 2850,
    cac: 450,
    ltv_cac_ratio: 6.3,
    churn_rate: 3.2,
    expansion_revenue: 1250,
    net_revenue_retention: 108,
  };

  return { cohort, churn_risk: churnRisk, revenue_breakdown: revenueBreakdown, metrics };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let endpoint = 'overview';
    let body: Record<string, unknown> = {};

    // Handle both URL path and body-based routing
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length > 1) {
      endpoint = pathParts[1];
    }

    // Try to parse body for POST requests
    if (req.method === 'POST') {
      try {
        body = await req.json();
        if (body.endpoint) {
          endpoint = body.endpoint as string;
        }
      } catch {
        // Body parsing failed, use URL-based routing
      }
    }

    console.log(`[Master Analytics] Endpoint: ${endpoint}`);

    let responseData: unknown;

    switch (endpoint) {
      case 'overview':
        responseData = {
          tenants: { total: 15, active: 12, basic: 8, pro: 5, enterprise: 2 },
          subscriptions: { active: 12, trial: 3, cancelled: 0 },
          usage: { total_leads: 1250, total_users: 45, total_messages: 8500 },
          recent_activity: { new_tenants_7d: 3, new_leads_7d: 150 }
        };
        break;

      case 'revenue':
        responseData = {
          mrr: 4500,
          arr: 54000,
          total: 12500,
          growth_percentage: 12.5,
          by_plan: {
            starter: 800,
            professional: 2200,
            enterprise: 1500
          }
        };
        break;

      case 'timeseries':
        const period = url.searchParams.get('period') || 'monthly';
        responseData = {
          period,
          data: generateTimeSeriesData(12),
        };
        break;

      case 'activity-logs':
        responseData = generateActivityLogs(50);
        break;

      case 'tenant-health':
        responseData = generateTenantHealthData();
        break;

      case 'billing-intelligence':
        responseData = generateBillingIntelligence();
        break;

      case 'tenant':
        const tenantId = pathParts[2];
        responseData = {
          tenant_id: tenantId,
          leads: 125,
          users: 8,
          messages: 1200,
          storage_used_mb: 450,
          api_calls_30d: 15000
        };
        break;

      case 'usage':
        responseData = {
          total_api_calls: 250000,
          total_storage_gb: 12.5,
          total_bandwidth_gb: 45.2,
          active_sessions: 156,
          peak_concurrent_users: 89
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Analytics] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
