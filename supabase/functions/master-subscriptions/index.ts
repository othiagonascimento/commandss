import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock subscription data by tenant
const mockSubscriptions: Record<string, {
  tenant_id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  billing_cycle: string;
  amount: number;
  currency: string;
  features: string[];
}> = {
  '1': {
    tenant_id: '1',
    plan: 'professional',
    status: 'active',
    started_at: '2024-01-15T00:00:00Z',
    expires_at: '2025-01-15T00:00:00Z',
    billing_cycle: 'yearly',
    amount: 2400,
    currency: 'BRL',
    features: ['unlimited_leads', 'api_access', 'priority_support', 'custom_integrations']
  },
  '2': {
    tenant_id: '2',
    plan: 'enterprise',
    status: 'active',
    started_at: '2024-02-01T00:00:00Z',
    expires_at: null,
    billing_cycle: 'monthly',
    amount: 999,
    currency: 'BRL',
    features: ['unlimited_everything', 'dedicated_support', 'sla_99', 'custom_development', 'white_label']
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const tenantId = pathParts[1];
    const action = pathParts[2]; // upgrade, downgrade, cancel, reactivate
    const method = req.method;

    console.log(`[Master Subscriptions] ${method} tenant:${tenantId} action:${action || 'get'}`);

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscription = mockSubscriptions[tenantId] || {
      tenant_id: tenantId,
      plan: 'starter',
      status: 'trial',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      billing_cycle: 'monthly',
      amount: 0,
      currency: 'BRL',
      features: ['basic_leads', 'email_support']
    };

    // GET /master-subscriptions/:tenantId - Get subscription
    if (method === 'GET' && !action) {
      return new Response(
        JSON.stringify(subscription),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST actions
    if (method === 'POST' && action) {
      const body = await req.json().catch(() => ({}));

      switch (action) {
        case 'upgrade':
          return new Response(
            JSON.stringify({
              ...subscription,
              plan: body.new_plan || 'professional',
              status: 'active',
              amount: body.new_plan === 'enterprise' ? 999 : 299
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'downgrade':
          return new Response(
            JSON.stringify({
              ...subscription,
              plan: body.new_plan || 'starter',
              amount: body.new_plan === 'professional' ? 299 : 99
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'cancel':
          return new Response(
            JSON.stringify({
              ...subscription,
              status: 'cancelled',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'reactivate':
          return new Response(
            JSON.stringify({
              ...subscription,
              status: 'active',
              expires_at: null
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        default:
          return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Subscriptions] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
