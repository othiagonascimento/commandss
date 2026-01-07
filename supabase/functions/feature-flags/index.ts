import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FEATURE-FLAGS] ${step}${detailsStr}`);
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
    logStep('Function started');

    const url = new URL(req.url);

    // Public endpoint: check if feature is enabled for a tenant
    if (req.method === 'GET' && url.searchParams.get('check')) {
      const featureName = url.searchParams.get('feature');
      const tenantId = url.searchParams.get('tenantId');

      if (!featureName) throw new Error('feature parameter is required');

      const { data: flag, error } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .eq('name', featureName)
        .single();

      if (error || !flag) {
        return new Response(JSON.stringify({ enabled: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if enabled globally
      if (flag.is_enabled_globally) {
        return new Response(JSON.stringify({ enabled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if enabled for specific tenant
      if (tenantId && flag.enabled_tenant_ids?.includes(tenantId)) {
        return new Response(JSON.stringify({ enabled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check rollout percentage
      if (flag.rollout_percentage > 0 && tenantId) {
        // Consistent hashing based on tenant ID
        const hash = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const bucket = hash % 100;
        if (bucket < flag.rollout_percentage) {
          return new Response(JSON.stringify({ enabled: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ enabled: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin endpoints require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;

    // Verify super_admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .single();

    if (!roleData) throw new Error('Only super admins can manage feature flags');

    if (req.method === 'GET') {
      // List all feature flags
      const { data, error } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .order('name');

      if (error) throw error;

      return new Response(JSON.stringify({ flags: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST requests - parse body
    const body = await req.json().catch(() => ({}));
    const { action, flagId, name, description, isEnabledGlobally, enabledTenantIds, rolloutPercentage } = body;

    if (action === 'create') {
      if (!name) throw new Error('name is required');

      const { data, error } = await supabaseAdmin
        .from('feature_flags')
        .insert({
          name,
          description: description || null,
          is_enabled_globally: isEnabledGlobally || false,
          enabled_tenant_ids: enabledTenantIds || [],
          rollout_percentage: rolloutPercentage || 0,
        })
        .select()
        .single();

      if (error) throw error;

      logStep('Flag created', { name });

      return new Response(JSON.stringify({ success: true, flag: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!flagId) throw new Error('flagId is required');

      const updateData: Record<string, unknown> = {};
      if (typeof isEnabledGlobally === 'boolean') updateData.is_enabled_globally = isEnabledGlobally;
      if (enabledTenantIds !== undefined) updateData.enabled_tenant_ids = enabledTenantIds;
      if (rolloutPercentage !== undefined) updateData.rollout_percentage = rolloutPercentage;
      if (description !== undefined) updateData.description = description;

      const { data, error } = await supabaseAdmin
        .from('feature_flags')
        .update(updateData)
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;

      logStep('Flag updated', { flagId });

      return new Response(JSON.stringify({ success: true, flag: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle_tenant') {
      const { tenantId } = body;
      if (!flagId || !tenantId) throw new Error('flagId and tenantId are required');

      const { data: flag } = await supabaseAdmin
        .from('feature_flags')
        .select('enabled_tenant_ids')
        .eq('id', flagId)
        .single();

      const currentIds = flag?.enabled_tenant_ids || [];
      let newIds: string[];

      if (currentIds.includes(tenantId)) {
        newIds = currentIds.filter((id: string) => id !== tenantId);
      } else {
        newIds = [...currentIds, tenantId];
      }

      const { data, error } = await supabaseAdmin
        .from('feature_flags')
        .update({ enabled_tenant_ids: newIds })
        .eq('id', flagId)
        .select()
        .single();

      if (error) throw error;

      logStep('Tenant toggled', { flagId, tenantId, enabled: newIds.includes(tenantId) });

      return new Response(JSON.stringify({ success: true, flag: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!flagId) throw new Error('flagId is required');

      const { error } = await supabaseAdmin
        .from('feature_flags')
        .delete()
        .eq('id', flagId);

      if (error) throw error;

      logStep('Flag deleted', { flagId });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid request');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
