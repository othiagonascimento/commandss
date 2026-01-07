import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock users by tenant
const mockUsers: Record<string, Array<{
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
}>> = {
  '1': [
    { id: 'u1', email: 'admin@alpha.com', full_name: 'João Silva', role: 'admin', status: 'active', created_at: '2024-01-15T10:00:00Z', last_login: '2025-01-06T14:30:00Z' },
    { id: 'u2', email: 'maria@alpha.com', full_name: 'Maria Santos', role: 'seller', status: 'active', created_at: '2024-02-01T09:00:00Z', last_login: '2025-01-06T11:20:00Z' },
    { id: 'u3', email: 'pedro@alpha.com', full_name: 'Pedro Oliveira', role: 'seller', status: 'inactive', created_at: '2024-03-15T14:00:00Z', last_login: '2024-12-20T16:45:00Z' },
  ],
  '2': [
    { id: 'u4', email: 'ceo@beta.com', full_name: 'Carlos Mendes', role: 'admin', status: 'active', created_at: '2024-02-01T14:30:00Z', last_login: '2025-01-06T09:00:00Z' },
    { id: 'u5', email: 'ana@beta.com', full_name: 'Ana Costa', role: 'manager', status: 'active', created_at: '2024-02-10T10:00:00Z', last_login: '2025-01-05T18:30:00Z' },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const tenantId = pathParts[1];
    const userId = pathParts[2];
    const method = req.method;

    console.log(`[Master Users] ${method} tenant:${tenantId} user:${userId || 'list'}`);

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantUsers = mockUsers[tenantId] || [];

    // GET /master-users/:tenantId - List users
    if (method === 'GET' && !userId) {
      return new Response(
        JSON.stringify({ data: tenantUsers, total: tenantUsers.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-users/:tenantId/:userId - Get single user
    if (method === 'GET' && userId) {
      const user = tenantUsers.find(u => u.id === userId);
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify(user),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /master-users/:tenantId - Create user
    if (method === 'POST') {
      const body = await req.json();
      const newUser = {
        id: `u${Date.now()}`,
        ...body,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: null
      };
      return new Response(
        JSON.stringify(newUser),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /master-users/:tenantId/:userId - Update user
    if (method === 'PATCH' && userId) {
      const body = await req.json();
      const user = tenantUsers.find(u => u.id === userId);
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const updated = { ...user, ...body };
      return new Response(
        JSON.stringify(updated),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /master-users/:tenantId/:userId - Deactivate user
    if (method === 'DELETE' && userId) {
      return new Response(
        JSON.stringify({ success: true, message: 'User deactivated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Users] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
