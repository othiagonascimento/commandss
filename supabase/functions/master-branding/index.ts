import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock branding data by tenant
const mockBranding: Record<string, {
  tenant_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  favicon_url: string | null;
  custom_css: string | null;
}> = {
  '1': {
    tenant_id: '1',
    logo_url: 'https://example.com/alpha-logo.png',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    company_name: 'Empresa Alpha',
    favicon_url: null,
    custom_css: null
  },
  '2': {
    tenant_id: '2',
    logo_url: 'https://example.com/beta-logo.png',
    primary_color: '#8B5CF6',
    secondary_color: '#F59E0B',
    company_name: 'Beta Corp',
    favicon_url: 'https://example.com/beta-favicon.ico',
    custom_css: '.header { background: linear-gradient(90deg, #8B5CF6, #F59E0B); }'
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
    const method = req.method;

    console.log(`[Master Branding] ${method} tenant:${tenantId}`);

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /master-branding/:tenantId - Get branding
    if (method === 'GET') {
      const branding = mockBranding[tenantId] || {
        tenant_id: tenantId,
        logo_url: null,
        primary_color: '#000000',
        secondary_color: '#666666',
        company_name: 'Unknown',
        favicon_url: null,
        custom_css: null
      };
      return new Response(
        JSON.stringify(branding),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /master-branding/:tenantId - Update branding
    if (method === 'PUT') {
      const body = await req.json();
      const existing = mockBranding[tenantId] || { tenant_id: tenantId };
      const updated = { ...existing, ...body, tenant_id: tenantId };
      return new Response(
        JSON.stringify(updated),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Master Branding] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
