import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock tenants data
const mockTenants = [
  { id: '1', name: 'Empresa Alpha', subdomain: 'alpha', plan_type: 'professional', status: 'active', implementation_level: 3, created_at: '2024-01-15T10:00:00Z', user_count: 12, lead_count: 450 },
  { id: '2', name: 'Beta Corp', subdomain: 'beta', plan_type: 'enterprise', status: 'active', implementation_level: 5, created_at: '2024-02-01T14:30:00Z', user_count: 45, lead_count: 2100 },
  { id: '3', name: 'Gamma Solutions', subdomain: 'gamma', plan_type: 'starter', status: 'active', implementation_level: 2, created_at: '2024-03-10T09:15:00Z', user_count: 3, lead_count: 85 },
  { id: '4', name: 'Delta Tech', subdomain: 'delta', plan_type: 'professional', status: 'suspended', implementation_level: 4, created_at: '2024-01-20T16:45:00Z', user_count: 8, lead_count: 320 },
  { id: '5', name: 'Epsilon Industries', subdomain: 'epsilon', plan_type: 'enterprise', status: 'active', implementation_level: 5, created_at: '2023-12-05T11:00:00Z', user_count: 67, lead_count: 3500 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const tenantId = pathParts[1];
    const method = req.method;

    console.log(`[Master Tenants] ${method} ${tenantId || 'list'}`);

    // GET /master-tenants - List all tenants
    if (method === 'GET' && !tenantId) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const status = url.searchParams.get('status');
      const plan = url.searchParams.get('plan');

      let filtered = [...mockTenants];
      if (status) filtered = filtered.filter(t => t.status === status);
      if (plan) filtered = filtered.filter(t => t.plan_type === plan);

      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return new Response(
        JSON.stringify({
          data: paginated,
          total: filtered.length,
          page,
          limit,
          total_pages: Math.ceil(filtered.length / limit)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-tenants/:id - Get single tenant
    if (method === 'GET' && tenantId) {
      const tenant = mockTenants.find(t => t.id === tenantId);
      if (!tenant) {
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify(tenant),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /master-tenants - Create tenant
    if (method === 'POST') {
      const body = await req.json();
      const newTenant = {
        id: String(mockTenants.length + 1),
        ...body,
        status: 'active',
        implementation_level: 1,
        created_at: new Date().toISOString(),
        user_count: 0,
        lead_count: 0
      };
      return new Response(
        JSON.stringify(newTenant),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-tenants/:id - Update tenant
    if (method === 'PATCH' && tenantId) {
      const body = await req.json();
      const tenant = mockTenants.find(t => t.id === tenantId);
      if (!tenant) {
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const updated = { ...tenant, ...body };
      return new Response(
        JSON.stringify(updated),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /master-tenants/:id - Deactivate tenant
    if (method === 'DELETE' && tenantId) {
      return new Response(
        JSON.stringify({ success: true, message: 'Tenant deactivated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Tenants] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
