import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-path-suffix, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

// Plan configuration
const PLANS: Record<string, { name: string; pricePerUser: number }> = {
  starter: { name: 'Starter', pricePerUser: 49 },
  basic: { name: 'Basic', pricePerUser: 69 },
  pro: { name: 'Pro', pricePerUser: 99 },
  professional: { name: 'Professional', pricePerUser: 99 },
  enterprise: { name: 'Enterprise', pricePerUser: 149 },
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

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

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
    let tenantId: string | undefined;
    let action: string | undefined;
    
    if (pathSuffix) {
      const suffixParts = pathSuffix.split('/').filter(Boolean);
      tenantId = suffixParts[0];
      action = suffixParts[1];
    } else {
      tenantId = pathParts[1];
      action = pathParts[2];
    }
    const method = req.method;

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`${method} request`, { tenantId, action, pathSuffix });

    // Get tenant from database
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // GET /master-subscriptions/:tenantId - Get subscription details
    if (method === 'GET' && !action) {
      let stripeSubscription = null;
      
      // Try to get Stripe subscription if we have a subscription ID
      if (stripeKey && tenant.stripe_subscription_id) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
          stripeSubscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
        } catch (e) {
          logStep('Could not fetch Stripe subscription', { error: (e as Error).message });
        }
      }

      const planConfig = PLANS[tenant.plan_type] || PLANS.basic;
      const monthlyAmount = (tenant.price_per_user || planConfig.pricePerUser) * (tenant.contracted_users || 1);

      const subscription = {
        tenant_id: tenantId,
        plan: tenant.plan_type,
        status: tenant.subscription_status || (stripeSubscription?.status) || 'active',
        started_at: tenant.created_at,
        expires_at: tenant.current_period_end || (stripeSubscription ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : null),
        billing_cycle: 'monthly',
        amount: monthlyAmount,
        currency: 'BRL',
        features: getFeaturesByPlan(tenant.plan_type),
        stripe_subscription_id: tenant.stripe_subscription_id,
        stripe_customer_id: tenant.stripe_customer_id,
      };

      return new Response(
        JSON.stringify(subscription),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST actions (upgrade, downgrade, cancel, reactivate)
    if (method === 'POST' && action) {
      const body = await req.json().catch(() => ({}));

      switch (action) {
        case 'upgrade':
        case 'downgrade': {
          const newPlan = body.plan || body.new_plan;
          if (!newPlan || !PLANS[newPlan]) {
            throw new Error('Invalid plan specified');
          }

          const newPlanConfig = PLANS[newPlan];
          
          // Update in database
          const { data: updatedTenant, error: updateError } = await supabaseAdmin
            .from('tenants')
            .update({
              plan_type: newPlan,
              price_per_user: newPlanConfig.pricePerUser,
            })
            .eq('id', tenantId)
            .select()
            .single();

          if (updateError) throw updateError;

          // If has Stripe subscription, update it
          if (stripeKey && tenant.stripe_subscription_id) {
            try {
              const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
              const subscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
              
              // Update the subscription item with new price
              await stripe.subscriptions.update(tenant.stripe_subscription_id, {
                items: [{
                  id: subscription.items.data[0].id,
                  price_data: {
                    currency: 'brl',
                    product_data: {
                      name: `UOPA - ${newPlanConfig.name}`,
                    },
                    unit_amount: Math.round(newPlanConfig.pricePerUser * 100),
                    recurring: { interval: 'month' },
                  },
                  quantity: tenant.contracted_users || 1,
                }],
                proration_behavior: 'create_prorations',
              });

              logStep(`Stripe subscription updated for ${action}`, { newPlan });
            } catch (e) {
              logStep('Stripe update failed, but DB updated', { error: (e as Error).message });
            }
          }

          logStep(`Plan ${action}d`, { tenantId, newPlan });

          return new Response(
            JSON.stringify({
              success: true,
              plan: newPlan,
              status: 'active',
              amount: newPlanConfig.pricePerUser * (tenant.contracted_users || 1),
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'cancel': {
          // Update database
          await supabaseAdmin
            .from('tenants')
            .update({
              subscription_status: 'cancelled',
              is_blocked: true,
              blocked_at: new Date().toISOString(),
              blocked_reason: 'Assinatura cancelada',
            })
            .eq('id', tenantId);

          // Cancel in Stripe if exists
          if (stripeKey && tenant.stripe_subscription_id) {
            try {
              const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
              await stripe.subscriptions.update(tenant.stripe_subscription_id, {
                cancel_at_period_end: true,
              });
              logStep('Stripe subscription set to cancel at period end');
            } catch (e) {
              logStep('Stripe cancellation failed', { error: (e as Error).message });
            }
          }

          logStep('Subscription cancelled', { tenantId });

          return new Response(
            JSON.stringify({
              success: true,
              status: 'cancelled',
              expires_at: tenant.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        case 'reactivate': {
          // Update database
          await supabaseAdmin
            .from('tenants')
            .update({
              subscription_status: 'active',
              is_blocked: false,
              blocked_at: null,
              blocked_reason: null,
            })
            .eq('id', tenantId);

          // Reactivate in Stripe if exists
          if (stripeKey && tenant.stripe_subscription_id) {
            try {
              const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
              await stripe.subscriptions.update(tenant.stripe_subscription_id, {
                cancel_at_period_end: false,
              });
              logStep('Stripe subscription reactivated');
            } catch (e) {
              logStep('Stripe reactivation failed', { error: (e as Error).message });
            }
          }

          logStep('Subscription reactivated', { tenantId });

          return new Response(
            JSON.stringify({
              success: true,
              status: 'active',
              expires_at: null,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
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

function getFeaturesByPlan(plan: string): string[] {
  const features: Record<string, string[]> = {
    starter: ['basic_leads', 'email_support'],
    basic: ['unlimited_leads', 'email_support', 'basic_reports'],
    pro: ['unlimited_leads', 'api_access', 'priority_support', 'advanced_reports', 'custom_integrations'],
    professional: ['unlimited_leads', 'api_access', 'priority_support', 'advanced_reports', 'custom_integrations'],
    enterprise: ['unlimited_everything', 'dedicated_support', 'sla_99', 'custom_development', 'white_label', 'unlimited_storage'],
  };
  return features[plan] || features.basic;
}
