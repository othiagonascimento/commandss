import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory branding storage (will be replaced with real DB later)
const brandingStore: Record<string, Record<string, unknown>> = {};

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

    const defaultBranding = {
      tenant_id: tenantId,
      company_name: 'Empresa',
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      accent_color: '#22d3ee',
      text_color: '#1f2937',
      background_color: '#ffffff',
      font_family: 'Inter',
      border_radius: 'md',
      logo_url: null,
      logo_white_url: null,
      symbol_url: null,
      favicon_url: null,
      login_background_url: null,
      custom_css: null,
      tagline: null,
      footer_text: null,
    };

    // GET /master-branding/:tenantId
    if (method === 'GET') {
      const branding = brandingStore[tenantId] || defaultBranding;
      return new Response(
        JSON.stringify(branding),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /master-branding/:tenantId
    if (method === 'PUT') {
      const body = await req.json();
      const existing = brandingStore[tenantId] || defaultBranding;
      const updated = { ...existing, ...body, tenant_id: tenantId };
      brandingStore[tenantId] = updated;
      
      console.log('[Master Branding] Updated branding for tenant:', tenantId);
      
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
