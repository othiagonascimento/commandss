import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix',
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
    // Support both URL path and x-path-suffix header
    const pathSuffix = req.headers.get('x-path-suffix');
    let tenantId: string | undefined;
    let action: string | undefined;
    
    if (pathSuffix) {
      const suffixParts = pathSuffix.split('/').filter(Boolean);
      tenantId = suffixParts[0];
      action = suffixParts[1];
    } else {
      tenantId = pathParts[functionIndex + 1];
      action = pathParts[functionIndex + 2];
    }

    console.log(`[master-tenant-features] ${req.method} tenantId=${tenantId} action=${action} pathSuffix=${pathSuffix}`);

    // GET /master-tenant-features/:tenantId/resolved-config - Get resolved AI config with inheritance
    if (req.method === 'GET' && tenantId && action === 'resolved-config') {
      const resolvedConfig = await resolveAIConfig(supabase, tenantId);
      return new Response(JSON.stringify(resolvedConfig), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
          limit_ai_tokens_monthly: 500,
          limit_storage_mb: 100,
          credits_per_user: 500,
          storage_mb_per_user: 100,
          ai_use_global_config: true,
          overrides: {},
        };
        return new Response(JSON.stringify(defaultFeatures), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If using global config, resolve and attach the inherited values
      if (features.ai_use_global_config) {
        const resolvedConfig = await resolveAIConfig(supabase, tenantId);
        features.resolved_ai_config = resolvedConfig;
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
          if (key.startsWith('limit_') || key === 'credits_per_user' || key === 'storage_mb_per_user' || key === 'extra_credits') {
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

// deno-lint-ignore no-explicit-any
async function resolveAIConfig(supabase: any, tenantId: string) {
  console.log(`[resolveAIConfig] Resolving AI config for tenant: ${tenantId}`);

  // 1. Get tenant features
  const { data: tenantFeatures } = await supabase
    .from('tenant_features')
    .select('ai_use_global_config, ai_layer_1_model, ai_layer_1_instructions, ai_layer_2_model, ai_layer_2_instructions, ai_layer_3_model, ai_layer_3_instructions')
    .eq('tenant_id', tenantId)
    .single();

  // If tenant has custom config, use it
  if (tenantFeatures && !tenantFeatures.ai_use_global_config) {
    console.log('[resolveAIConfig] Using tenant custom config');
    return {
      source: 'tenant',
      layer_1_model: tenantFeatures.ai_layer_1_model,
      layer_1_instructions: tenantFeatures.ai_layer_1_instructions,
      layer_2_model: tenantFeatures.ai_layer_2_model,
      layer_2_instructions: tenantFeatures.ai_layer_2_instructions,
      layer_3_model: tenantFeatures.ai_layer_3_model,
      layer_3_instructions: tenantFeatures.ai_layer_3_instructions,
    };
  }

  // 2. Check if tenant has a niche template via onboarding
  const { data: onboarding } = await supabase
    .from('tenant_onboarding')
    .select('niche_template_id')
    .eq('tenant_id', tenantId)
    .single();

  if (onboarding?.niche_template_id) {
    // Get niche template config
    const { data: nicheTemplate } = await supabase
      .from('niche_templates')
      .select('prompts')
      .eq('id', onboarding.niche_template_id)
      .single();

    if (nicheTemplate?.prompts) {
      const prompts = nicheTemplate.prompts as Record<string, unknown>;
      
      // Check if niche has AI config in prompts
      if (prompts.ai_config) {
        const aiConfig = prompts.ai_config as Record<string, unknown>;
        console.log('[resolveAIConfig] Using niche template config');
        
        // Get global settings for fallback
        const { data: globalSettings } = await supabase
          .from('master_settings')
          .select('ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions')
          .eq('key', 'ai_global_engine')
          .single();

        return {
          source: 'niche',
          niche_template_id: onboarding.niche_template_id,
          layer_1_model: aiConfig.layer_1_model || globalSettings?.ai_layer_1_model,
          layer_1_instructions: aiConfig.layer_1_instructions || globalSettings?.ai_layer_1_instructions,
          layer_2_model: aiConfig.layer_2_model || globalSettings?.ai_layer_2_model,
          layer_2_instructions: aiConfig.layer_2_instructions || globalSettings?.ai_layer_2_instructions,
          layer_3_model: aiConfig.layer_3_model || globalSettings?.ai_layer_3_model,
          layer_3_instructions: aiConfig.layer_3_instructions || globalSettings?.ai_layer_3_instructions,
        };
      }
    }
  }

  // 3. Fallback to master global config
  const { data: globalSettings, error: globalError } = await supabase
    .from('master_settings')
    .select('ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions')
    .eq('key', 'ai_global_engine')
    .single();

  if (globalError && globalError.code !== 'PGRST116') {
    console.error('[resolveAIConfig] Error fetching global settings:', globalError);
  }

  console.log('[resolveAIConfig] Using master global config');
  return {
    source: 'master',
    layer_1_model: globalSettings?.ai_layer_1_model || 'gemini-1.5-flash',
    layer_1_instructions: globalSettings?.ai_layer_1_instructions || '',
    layer_2_model: globalSettings?.ai_layer_2_model || 'gemini-1.5-pro',
    layer_2_instructions: globalSettings?.ai_layer_2_instructions || '',
    layer_3_model: globalSettings?.ai_layer_3_model || 'claude-3-5-sonnet',
    layer_3_instructions: globalSettings?.ai_layer_3_instructions || '',
  };
}