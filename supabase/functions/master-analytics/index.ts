import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const endpoint = pathParts[1] || 'overview'; // overview, revenue, tenant, usage

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
