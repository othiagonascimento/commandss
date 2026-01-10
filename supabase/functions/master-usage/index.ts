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
    const functionIndex = pathParts.indexOf('master-usage');
    const tenantId = pathParts[functionIndex + 1];
    const subPath = pathParts[functionIndex + 2];

    console.log(`[master-usage] ${req.method} tenantId=${tenantId} subPath=${subPath}`);

    // GET /master-usage/:tenantId - Get tenant usage with limits comparison
    if (req.method === 'GET' && tenantId && !subPath) {
      // Get tenant usage
      const { data: usage, error: usageError } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      // Get tenant features (limits)
      const { data: features, error: featuresError } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Build response with usage vs limits
      const defaultLimits = {
        limit_users: 5,
        limit_leads: 1000,
        limit_products: 100,
        limit_whatsapp_instances: 1,
        limit_ai_tokens_monthly: 100000,
        limit_storage_mb: 500,
      };

      const limits = features || defaultLimits;
      const currentUsage = usage || {
        users_count: 0,
        leads_count: 0,
        products_count: 0,
        whatsapp_instances_count: 0,
        ai_tokens_used: 0,
        storage_used_mb: 0,
        messages_sent: 0,
        active_users: 0,
      };

      // Apply overrides to limits if they exist
      const effectiveLimits = { ...limits };
      if (features?.overrides) {
        Object.entries(features.overrides).forEach(([key, value]) => {
          if (key in effectiveLimits) {
            (effectiveLimits as Record<string, unknown>)[key] = value;
          }
        });
      }

      const response = {
        usage: {
          users: userCount || currentUsage.users_count || 0,
          leads: currentUsage.leads_count || 0,
          products: currentUsage.products_count || 0,
          whatsapp_instances: currentUsage.whatsapp_instances_count || 0,
          ai_tokens: currentUsage.ai_tokens_used || 0,
          storage_mb: currentUsage.storage_used_mb || 0,
          messages: currentUsage.messages_sent || 0,
          active_users: currentUsage.active_users || 0,
        },
        limits: {
          users: effectiveLimits.limit_users,
          leads: effectiveLimits.limit_leads,
          products: effectiveLimits.limit_products,
          whatsapp_instances: effectiveLimits.limit_whatsapp_instances,
          ai_tokens: effectiveLimits.limit_ai_tokens_monthly,
          storage_mb: effectiveLimits.limit_storage_mb,
        },
        percentages: {
          users: calculatePercentage(userCount || 0, effectiveLimits.limit_users),
          leads: calculatePercentage(currentUsage.leads_count || 0, effectiveLimits.limit_leads),
          products: calculatePercentage(currentUsage.products_count || 0, effectiveLimits.limit_products),
          whatsapp_instances: calculatePercentage(currentUsage.whatsapp_instances_count || 0, effectiveLimits.limit_whatsapp_instances),
          ai_tokens: calculatePercentage(currentUsage.ai_tokens_used || 0, effectiveLimits.limit_ai_tokens_monthly),
          storage_mb: calculatePercentage(currentUsage.storage_used_mb || 0, effectiveLimits.limit_storage_mb),
        },
        alerts: getAlerts(currentUsage, effectiveLimits, userCount || 0),
        last_calculated_at: currentUsage.last_calculated_at || usage?.updated_at || null,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-usage/:tenantId/users - Get per-user usage
    if (req.method === 'GET' && tenantId && subPath === 'users') {
      const { data: userUsage, error } = await supabase
        .from('user_usage')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            role
          ),
          user_limits:user_id (
            ai_tokens_monthly,
            storage_mb,
            messages_monthly,
            can_use_ai,
            can_transcribe
          )
        `)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[master-usage] Error fetching user usage:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: userUsage, total: userUsage?.length || 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /master-usage/alerts - Get all tenants with usage alerts
    if (req.method === 'GET' && tenantId === 'alerts') {
      const threshold = parseInt(url.searchParams.get('threshold') || '80');

      // Get all tenants with their usage and features
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          subdomain,
          tenant_usage (*),
          tenant_features (*)
        `)
        .eq('status', 'active');

      if (error) {
        console.error('[master-usage] Error fetching tenants:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Filter tenants with usage above threshold
      const alertTenants = tenants?.filter(tenant => {
        const usage = tenant.tenant_usage?.[0];
        const features = tenant.tenant_features?.[0] || {
          limit_users: 5,
          limit_leads: 1000,
          limit_ai_tokens_monthly: 100000,
          limit_storage_mb: 500,
        };

        if (!usage) return false;

        const percentages = {
          leads: calculatePercentage(usage.leads_count || 0, features.limit_leads),
          ai_tokens: calculatePercentage(usage.ai_tokens_used || 0, features.limit_ai_tokens_monthly),
          storage: calculatePercentage(usage.storage_used_mb || 0, features.limit_storage_mb),
        };

        return percentages.leads >= threshold || 
               percentages.ai_tokens >= threshold || 
               percentages.storage >= threshold;
      }).map(tenant => {
        const usage = tenant.tenant_usage?.[0];
        const features = tenant.tenant_features?.[0];
        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          alerts: getAlerts(usage, features, usage?.users_count || 0),
        };
      });

      return new Response(JSON.stringify({ data: alertTenants, total: alertTenants?.length || 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /master-usage/:tenantId/recalculate - Recalculate tenant usage
    if (req.method === 'POST' && tenantId && subPath === 'recalculate') {
      // Call the database function to recalculate
      const { error } = await supabase.rpc('calculate_tenant_usage', {
        _tenant_id: tenantId,
      });

      if (error) {
        console.error('[master-usage] Error recalculating usage:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch the updated usage
      const { data: usage } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      console.log('[master-usage] Usage recalculated for tenant:', tenantId);
      return new Response(JSON.stringify({ success: true, usage }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-usage] Exception:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculatePercentage(used: number, limit: number): number {
  if (limit <= 0 || limit === -1) return 0; // -1 = unlimited
  return Math.round((used / limit) * 100);
}

function getAlerts(usage: Record<string, unknown>, limits: Record<string, unknown>, userCount: number): string[] {
  const alerts: string[] = [];
  const usageData = usage || {};
  const limitsData = limits || {};

  const checks = [
    { name: 'users', used: userCount, limit: limitsData.limit_users as number },
    { name: 'leads', used: usageData.leads_count as number, limit: limitsData.limit_leads as number },
    { name: 'products', used: usageData.products_count as number, limit: limitsData.limit_products as number },
    { name: 'ai_tokens', used: usageData.ai_tokens_used as number, limit: limitsData.limit_ai_tokens_monthly as number },
    { name: 'storage', used: usageData.storage_used_mb as number, limit: limitsData.limit_storage_mb as number },
  ];

  checks.forEach(({ name, used, limit }) => {
    if (!limit || limit === -1) return; // Unlimited
    const percentage = calculatePercentage(used || 0, limit);
    if (percentage >= 100) {
      alerts.push(`${name}_limit_exceeded`);
    } else if (percentage >= 90) {
      alerts.push(`${name}_90_percent`);
    } else if (percentage >= 80) {
      alerts.push(`${name}_80_percent`);
    }
  });

  return alerts;
}
