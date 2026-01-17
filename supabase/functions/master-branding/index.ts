import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-BRANDING] ${step}${detailsStr}`);
};

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
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;
    logStep('User authenticated', { userId });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Support both URL path and x-path-suffix header
    const pathSuffix = req.headers.get('x-path-suffix');
    const tenantId = pathSuffix || pathParts[1];
    const method = req.method;

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`${method} request`, { tenantId, pathSuffix });

    // GET /master-branding/:tenantId
    if (method === 'GET') {
      const { data: branding, error } = await supabaseAdmin
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default branding if none exists
      const response = branding || {
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

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /master-branding/:tenantId - Upsert branding
    if (method === 'PUT') {
      const body = await req.json();

      // Check if branding exists
      const { data: existing } = await supabaseAdmin
        .from('tenant_branding')
        .select('id')
        .eq('tenant_id', tenantId)
        .single();

      let result;
      if (existing) {
        // Update
        const { data, error } = await supabaseAdmin
          .from('tenant_branding')
          .update({
            company_name: body.company_name,
            tagline: body.tagline,
            primary_color: body.primary_color,
            secondary_color: body.secondary_color,
            accent_color: body.accent_color,
            text_color: body.text_color,
            background_color: body.background_color,
            font_family: body.font_family,
            border_radius: body.border_radius,
            logo_url: body.logo_url,
            logo_white_url: body.logo_white_url,
            symbol_url: body.symbol_url,
            favicon_url: body.favicon_url,
            login_background_url: body.login_background_url,
            custom_css: body.custom_css,
            footer_text: body.footer_text,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert
        const { data, error } = await supabaseAdmin
          .from('tenant_branding')
          .insert({
            tenant_id: tenantId,
            company_name: body.company_name,
            tagline: body.tagline,
            primary_color: body.primary_color || '#6366f1',
            secondary_color: body.secondary_color || '#8b5cf6',
            accent_color: body.accent_color || '#22d3ee',
            text_color: body.text_color || '#1f2937',
            background_color: body.background_color || '#ffffff',
            font_family: body.font_family || 'Inter',
            border_radius: body.border_radius || 'md',
            logo_url: body.logo_url,
            logo_white_url: body.logo_white_url,
            symbol_url: body.symbol_url,
            favicon_url: body.favicon_url,
            login_background_url: body.login_background_url,
            custom_css: body.custom_css,
            footer_text: body.footer_text,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      logStep('Branding updated', { tenantId });

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
