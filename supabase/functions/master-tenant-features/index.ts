import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token and verify master user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify master user
    const { data: masterUser, error: masterError } = await supabase
      .from('master_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (masterError || !masterUser) {
      return new Response(JSON.stringify({ error: 'Access denied - not a master user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionIndex = pathParts.indexOf('master-tenant-features');
    const tenantId = pathParts[functionIndex + 1];
    const action = pathParts[functionIndex + 2]; // for 'override'

    console.log(`[master-tenant-features] ${req.method} tenantId=${tenantId} action=${action}`);

    // GET /master-tenant-features/:tenantId - Get tenant features
    if (req.method === 'GET' && tenantId) {
      const { data: features, error } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[master-tenant-features] Error fetching features:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If no features exist, return defaults
      if (!features) {
        const defaultFeatures = {
          tenant_id: tenantId,
          module_ai_agent: true,
          module_ai_transcription: true,
          module_automation_flows: true,
          module_campaigns: true,
          module_ecommerce: true,
          module_erp_integration: false,
          module_api_access: false,
          module_whitelabel: false,
          module_multi_whatsapp: false,
          limit_users: 5,
          limit_leads: 1000,
          limit_products: 100,
          limit_whatsapp_instances: 1,
          limit_ai_tokens_monthly: 100000,
          limit_storage_mb: 500,
          overrides: {},
        };
        return new Response(JSON.stringify(defaultFeatures), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(features), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /master-tenant-features/:tenantId - Update tenant features
    if (req.method === 'PUT' && tenantId && !action) {
      const body = await req.json();
      const { modules, limits, ai_config, overrides, override_reason } = body;

      // Build update object
      const updateData: Record<string, unknown> = {
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      };

      // Add modules if provided
      if (modules) {
        Object.entries(modules).forEach(([key, value]) => {
          if (key.startsWith('module_')) {
            updateData[key] = value;
          }
        });
      }

      // Add limits if provided
      if (limits) {
        Object.entries(limits).forEach(([key, value]) => {
          if (key.startsWith('limit_')) {
            updateData[key] = value;
          }
        });
      }

      // Add AI config if provided
      if (ai_config) {
        Object.entries(ai_config).forEach(([key, value]) => {
          if (key.startsWith('ai_')) {
            updateData[key] = value;
          }
        });
      }

      // Add overrides if provided
      if (overrides) {
        updateData.overrides = overrides;
        updateData.override_reason = override_reason || null;
        updateData.overridden_by = user.id;
        updateData.overridden_at = new Date().toISOString();
      }

      // Upsert (insert or update)
      const { data: features, error } = await supabase
        .from('tenant_features')
        .upsert(updateData, { onConflict: 'tenant_id' })
        .select()
        .single();

      if (error) {
        console.error('[master-tenant-features] Error updating features:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[master-tenant-features] Features updated:', features);
      return new Response(JSON.stringify(features), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /master-tenant-features/:tenantId/override - Apply promotional override
    if (req.method === 'POST' && tenantId && action === 'override') {
      const body = await req.json();
      const { overrides, reason } = body;

      if (!overrides || !reason) {
        return new Response(JSON.stringify({ error: 'overrides and reason are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get existing features
      const { data: existing } = await supabase
        .from('tenant_features')
        .select('overrides')
        .eq('tenant_id', tenantId)
        .single();

      // Merge overrides
      const mergedOverrides = {
        ...(existing?.overrides || {}),
        ...overrides,
      };

      const { data: features, error } = await supabase
        .from('tenant_features')
        .upsert({
          tenant_id: tenantId,
          overrides: mergedOverrides,
          override_reason: reason,
          overridden_by: user.id,
          overridden_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' })
        .select()
        .single();

      if (error) {
        console.error('[master-tenant-features] Error applying override:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[master-tenant-features] Override applied:', features);
      return new Response(JSON.stringify(features), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /master-tenant-features/:tenantId/override - Clear overrides
    if (req.method === 'DELETE' && tenantId && action === 'override') {
      const { data: features, error } = await supabase
        .from('tenant_features')
        .update({
          overrides: {},
          override_reason: null,
          overridden_by: null,
          overridden_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('[master-tenant-features] Error clearing override:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(features), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-tenant-features] Exception:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
