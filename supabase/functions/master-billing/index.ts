import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
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
    const functionIndex = pathParts.indexOf('master-billing');
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

    console.log(`[master-billing] ${req.method} tenantId=${tenantId} action=${action} pathSuffix=${pathSuffix}`);

    // GET /master-billing/:tenantId - Get billing subscription
    if (req.method === 'GET' && tenantId && !action) {
      const { data: subscription, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[master-billing] Error fetching subscription:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return default if no subscription exists
      if (!subscription) {
        const defaultSubscription = {
          tenant_id: tenantId,
          plan_type: 'basic',
          status: 'trial',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          cancelled_at: null,
          external_subscription_id: null,
          metadata: {},
        };
        return new Response(JSON.stringify(defaultSubscription), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(subscription), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-billing/overview - Get billing overview (all tenants)
    if (req.method === 'GET' && tenantId === 'overview') {
      const { data: subscriptions, error } = await supabase
        .from('billing_subscriptions')
        .select(`
          *,
          tenants:tenant_id (
            id,
            name,
            subdomain
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[master-billing] Error fetching overview:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate stats
      const stats = {
        total: subscriptions?.length || 0,
        active: subscriptions?.filter(s => s.status === 'active').length || 0,
        trialing: subscriptions?.filter(s => s.status === 'trialing').length || 0,
        past_due: subscriptions?.filter(s => s.status === 'past_due').length || 0,
        cancelled: subscriptions?.filter(s => s.status === 'canceled').length || 0,
        by_plan: {
          basic: subscriptions?.filter(s => s.plan_type === 'basic').length || 0,
          pro: subscriptions?.filter(s => s.plan_type === 'pro').length || 0,
          enterprise: subscriptions?.filter(s => s.plan_type === 'enterprise').length || 0,
        },
      };

      return new Response(JSON.stringify({ data: subscriptions, stats }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /master-billing/:tenantId - Update billing subscription
    if (req.method === 'PUT' && tenantId) {
      const body = await req.json();
      const { plan_type, status, current_period_end, trial_ends_at, external_subscription_id, metadata } = body;

      const updateData: Record<string, unknown> = {
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      };

      if (plan_type) updateData.plan_type = plan_type;
      if (status) updateData.status = status;
      if (current_period_end) updateData.current_period_end = current_period_end;
      if (trial_ends_at !== undefined) updateData.trial_ends_at = trial_ends_at;
      if (external_subscription_id !== undefined) updateData.external_subscription_id = external_subscription_id;
      if (metadata) updateData.metadata = metadata;

      // Handle cancel
      if (status === 'canceled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data: subscription, error } = await supabase
        .from('billing_subscriptions')
        .upsert(updateData, { onConflict: 'tenant_id' })
        .select()
        .single();

      if (error) {
        console.error('[master-billing] Error updating subscription:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[master-billing] Subscription updated:', subscription);
      return new Response(JSON.stringify(subscription), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /master-billing/:tenantId/activate - Activate subscription
    if (req.method === 'POST' && tenantId && action === 'activate') {
      const { data: subscription, error } = await supabase
        .from('billing_subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('[master-billing] Error activating subscription:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(subscription), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /master-billing/:tenantId/cancel - Cancel subscription
    if (req.method === 'POST' && tenantId && action === 'cancel') {
      const { data: subscription, error } = await supabase
        .from('billing_subscriptions')
        .update({
          status: 'canceled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('[master-billing] Error cancelling subscription:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(subscription), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-billing] Exception:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
