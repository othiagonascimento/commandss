import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate mock time series data
function generateTimeSeriesData(months: number = 12) {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    // Generate realistic growing data with some variance
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

// Generate daily data for last 30 days
function generateDailyData(days: number = 30) {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayName = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    data.push({
      day: dayName,
      date: date.toISOString(),
      leads: Math.round(5 + Math.random() * 15),
      users: Math.round(1 + Math.random() * 3),
      messages: Math.round(50 + Math.random() * 100),
    });
  }
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const endpoint = pathParts[1] || 'overview';

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
          data: period === 'daily' ? generateDailyData(30) : generateTimeSeriesData(12),
        };
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
