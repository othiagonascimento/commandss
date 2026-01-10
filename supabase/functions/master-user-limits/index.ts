import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const functionIndex = pathParts.indexOf('master-user-limits');
    const tenantId = pathParts[functionIndex + 1];
    const userId = pathParts[functionIndex + 2];

    console.log(`[master-user-limits] ${req.method} tenantId=${tenantId} userId=${userId}`);

    // GET /master-user-limits/:tenantId - List all user limits for a tenant
    if (req.method === 'GET' && tenantId && !userId) {
      const { data: limits, error } = await supabase
        .from('user_limits')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            role
          )
        `)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[master-user-limits] Error fetching limits:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: limits, total: limits?.length || 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-user-limits/:tenantId/:userId - Get specific user limits
    if (req.method === 'GET' && tenantId && userId) {
      // Get user limits
      const { data: limits, error: limitsError } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single();

      // Get user usage
      const { data: usage } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .single();

      // Get tenant features for inherited limits
      const { data: tenantFeatures } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      // If no custom limits, return defaults from tenant
      const response = {
        limits: limits || {
          user_id: userId,
          tenant_id: tenantId,
          ai_tokens_monthly: null,
          storage_mb: null,
          messages_monthly: null,
          api_calls_monthly: null,
          can_use_ai: null,
          can_transcribe: null,
          can_use_api: null,
          can_send_campaigns: null,
          can_manage_automations: null,
        },
        usage: usage || {
          ai_tokens_month: 0,
          ai_tokens_total: 0,
          storage_bytes: 0,
          transcription_seconds_month: 0,
          messages_sent_month: 0,
          api_calls_month: 0,
        },
        tenant_limits: tenantFeatures || {},
        has_custom_limits: !!limits,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /master-user-limits/:tenantId/:userId - Update user limits
    if (req.method === 'PUT' && tenantId && userId) {
      const body = await req.json();
      const { limits, permissions, reason } = body;

      const updateData: Record<string, unknown> = {
        user_id: userId,
        tenant_id: tenantId,
        configured_by: user.id,
        configured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add limits if provided
      if (limits) {
        if (limits.ai_tokens_monthly !== undefined) updateData.ai_tokens_monthly = limits.ai_tokens_monthly;
        if (limits.storage_mb !== undefined) updateData.storage_mb = limits.storage_mb;
        if (limits.messages_monthly !== undefined) updateData.messages_monthly = limits.messages_monthly;
        if (limits.api_calls_monthly !== undefined) updateData.api_calls_monthly = limits.api_calls_monthly;
      }

      // Add permissions if provided
      if (permissions) {
        if (permissions.can_use_ai !== undefined) updateData.can_use_ai = permissions.can_use_ai;
        if (permissions.can_transcribe !== undefined) updateData.can_transcribe = permissions.can_transcribe;
        if (permissions.can_use_api !== undefined) updateData.can_use_api = permissions.can_use_api;
        if (permissions.can_send_campaigns !== undefined) updateData.can_send_campaigns = permissions.can_send_campaigns;
        if (permissions.can_manage_automations !== undefined) updateData.can_manage_automations = permissions.can_manage_automations;
      }

      // Add reason if provided
      if (reason) {
        updateData.reason = reason;
      }

      const { data: userLimits, error } = await supabase
        .from('user_limits')
        .upsert(updateData, { onConflict: 'user_id,tenant_id' })
        .select()
        .single();

      if (error) {
        console.error('[master-user-limits] Error updating limits:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[master-user-limits] Limits updated:', userLimits);
      return new Response(JSON.stringify(userLimits), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /master-user-limits/:tenantId/:userId - Remove custom limits (use tenant defaults)
    if (req.method === 'DELETE' && tenantId && userId) {
      const { error } = await supabase
        .from('user_limits')
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[master-user-limits] Error deleting limits:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[master-user-limits] Limits deleted for user:', userId);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-user-limits] Exception:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
