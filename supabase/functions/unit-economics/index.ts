import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UNIT-ECONOMICS] ${step}${detailsStr}`);
};

// Cost assumptions (R$) - adjust based on real costs
const COSTS = {
  AI_TOKEN_COST_PER_1K: 0.002, // R$ 0.002 per 1K tokens (Gemini)
  STORAGE_COST_PER_GB: 0.50, // R$ 0.50 per GB/month
  INFRA_BASE_COST: 5.00, // R$ 5 base infra per tenant
  MESSAGE_COST: 0.001, // R$ 0.001 per message
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
    logStep('Function started', { method: req.method });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;

    // Verify super_admin or admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['super_admin', 'admin'])
      .single();

    if (!roleData) throw new Error('Only admins can view unit economics');

    const url = new URL(req.url);

    // GET requests - no body parsing
    if (req.method === 'GET') {
      const tenantId = url.searchParams.get('tenantId');
      const period = url.searchParams.get('period') || 'current'; // current, last, all

      // Calculate period dates
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (period === 'current') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (period === 'last') {
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        // Last 3 months
        periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        periodEnd = now;
      }

      // Get tenant data
      let tenantsQuery = supabaseAdmin
        .from('tenants')
        .select(`
          id, name, subdomain,
          price_per_user, contracted_users, extra_channels, channel_price,
          subscription_status, current_period_end
        `);

      if (tenantId) {
        tenantsQuery = tenantsQuery.eq('id', tenantId);
      }

      const { data: tenants, error: tenantsError } = await tenantsQuery;
      if (tenantsError) throw tenantsError;

      // Get usage data
      const { data: usageData, error: usageError } = await supabaseAdmin
        .from('tenant_usage')
        .select('*')
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0]);

      if (usageError) throw usageError;

      // Calculate economics for each tenant
      const economics = tenants?.map(tenant => {
        const usage = usageData?.find(u => u.tenant_id === tenant.id) || {
          ai_tokens_used: 0,
          storage_used_mb: 0,
          messages_sent: 0,
        };

        // Revenue calculation
        const userRevenue = (tenant.price_per_user || 69) * (tenant.contracted_users || 1);
        const channelRevenue = Math.max(0, (tenant.extra_channels || 0)) * (tenant.channel_price || 19.90);
        const monthlyRevenue = userRevenue + channelRevenue;

        // Cost calculation
        const aiCost = ((usage.ai_tokens_used || 0) / 1000) * COSTS.AI_TOKEN_COST_PER_1K;
        const storageCost = ((usage.storage_used_mb || 0) / 1024) * COSTS.STORAGE_COST_PER_GB;
        const messageCost = (usage.messages_sent || 0) * COSTS.MESSAGE_COST;
        const totalCost = COSTS.INFRA_BASE_COST + aiCost + storageCost + messageCost;

        // Margin
        const margin = monthlyRevenue - totalCost;
        const marginPercent = monthlyRevenue > 0 ? (margin / monthlyRevenue) * 100 : 0;
        const isNegativeMargin = margin < 0;

        return {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            subscriptionStatus: tenant.subscription_status,
          },
          revenue: {
            users: userRevenue,
            channels: channelRevenue,
            total: monthlyRevenue,
          },
          costs: {
            infra: COSTS.INFRA_BASE_COST,
            ai: aiCost,
            storage: storageCost,
            messages: messageCost,
            total: totalCost,
          },
          usage: {
            aiTokens: usage.ai_tokens_used || 0,
            storageMb: usage.storage_used_mb || 0,
            messagesSent: usage.messages_sent || 0,
            activeUsers: usage.active_users || 0,
          },
          margin: {
            value: margin,
            percent: marginPercent,
            isNegative: isNegativeMargin,
          },
        };
      });

      // Summary
      const summary = {
        totalRevenue: economics?.reduce((sum, e) => sum + e.revenue.total, 0) || 0,
        totalCosts: economics?.reduce((sum, e) => sum + e.costs.total, 0) || 0,
        totalMargin: economics?.reduce((sum, e) => sum + e.margin.value, 0) || 0,
        tenantsWithNegativeMargin: economics?.filter(e => e.margin.isNegative).length || 0,
        averageMarginPercent: economics?.length 
          ? (economics.reduce((sum, e) => sum + e.margin.percent, 0) / economics.length)
          : 0,
      };

      logStep('Economics calculated', { tenantsCount: economics?.length });

      return new Response(JSON.stringify({
        economics,
        summary,
        period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
        costAssumptions: COSTS,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST requests - parse body safely
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { action, tenantId, usage } = body;

      if (action === 'record_usage') {
        // Record usage data for a tenant
        if (!tenantId) throw new Error('tenantId is required');

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Upsert usage
        const { data, error } = await supabaseAdmin
          .from('tenant_usage')
          .upsert({
            tenant_id: tenantId,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            ai_tokens_used: usage?.aiTokens || 0,
            storage_used_mb: usage?.storageMb || 0,
            messages_sent: usage?.messagesSent || 0,
            active_users: usage?.activeUsers || 0,
            api_calls: usage?.apiCalls || 0,
          }, {
            onConflict: 'tenant_id,period_start',
          })
          .select()
          .single();

        if (error) throw error;

        logStep('Usage recorded', { tenantId });

        return new Response(JSON.stringify({ success: true, usage: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('Missing or invalid action. Allowed: record_usage');
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: 'Method not allowed', allowed: ['GET', 'POST'] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
