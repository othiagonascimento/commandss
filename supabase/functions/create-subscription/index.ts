import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

interface ContractPayload {
  // Tenant info
  name: string;
  subdomain: string;
  document: string; // CPF/CNPJ
  contact_email: string;
  
  // Pricing
  price_per_user: number;
  contracted_users: number;
  extra_channels: number;
  implementation_fee: number;
  charge_implementation: boolean;
  
  // Discount
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number;
  
  // Trial
  trial_enabled: boolean;
  trial_days: number;
  
  // Limits
  ai_token_limit: number;
  storage_limit_gb: number;
  
  // Branding
  company_name?: string;
  primary_color?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse payload
    const payload: ContractPayload = await req.json();
    logStep("Payload received", payload);

    // Validate required fields
    if (!payload.name || !payload.subdomain || !payload.contact_email) {
      throw new Error("Missing required fields: name, subdomain, contact_email");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Calculate pricing
    const channelPrice = 19.90;
    const extraChannelsCost = Math.max(0, payload.extra_channels) * channelPrice;
    const usersCost = payload.price_per_user * payload.contracted_users;
    let subtotal = usersCost + extraChannelsCost;
    
    // Apply discount
    let discountAmount = 0;
    if (payload.discount_type === 'percentage' && payload.discount_value > 0) {
      discountAmount = subtotal * (payload.discount_value / 100);
    } else if (payload.discount_type === 'fixed' && payload.discount_value > 0) {
      discountAmount = payload.discount_value;
    }
    
    const monthlyTotal = Math.max(0, subtotal - discountAmount);
    logStep("Pricing calculated", { usersCost, extraChannelsCost, subtotal, discountAmount, monthlyTotal });

    // Create or get Stripe customer
    let customerId: string;
    const customers = await stripe.customers.list({ email: payload.contact_email, limit: 1 });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: payload.contact_email,
        name: payload.name,
        metadata: {
          document: payload.document,
          subdomain: payload.subdomain,
        },
      });
      customerId = customer.id;
      logStep("Customer created", { customerId });
    }

    // Build subscription items using price_data for flexible pricing
    const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = [];

    // Per-seat subscription item
    if (payload.contracted_users > 0) {
      subscriptionItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `UOPA - Licença por Usuário (${payload.contracted_users} usuários)`,
            metadata: {
              type: 'per_seat',
              contracted_users: String(payload.contracted_users),
              original_price: String(payload.price_per_user),
            },
          },
          unit_amount: Math.round(payload.price_per_user * 100), // Convert to cents
          recurring: { interval: 'month' },
        },
        quantity: payload.contracted_users,
      });
    }

    // Extra channels item
    if (payload.extra_channels > 0) {
      subscriptionItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `UOPA - Canais Extras (${payload.extra_channels} canais)`,
            metadata: {
              type: 'extra_channels',
            },
          },
          unit_amount: Math.round(channelPrice * 100),
          recurring: { interval: 'month' },
        },
        quantity: payload.extra_channels,
      });
    }

    // Create subscription with trial if enabled
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: subscriptionItems,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenant_subdomain: payload.subdomain,
        discount_type: payload.discount_type || 'none',
        discount_value: String(payload.discount_value),
      },
    };

    // Add trial if enabled
    if (payload.trial_enabled && payload.trial_days > 0) {
      subscriptionParams.trial_period_days = payload.trial_days;
      logStep("Trial enabled", { days: payload.trial_days });
    }

    // Apply discount as coupon if applicable
    if (payload.discount_type && payload.discount_value > 0) {
      const couponParams: Stripe.CouponCreateParams = {
        duration: 'forever',
        name: `Desconto Beta - ${payload.name}`,
      };

      if (payload.discount_type === 'percentage') {
        couponParams.percent_off = payload.discount_value;
      } else {
        couponParams.amount_off = Math.round(payload.discount_value * 100);
        couponParams.currency = 'brl';
      }

      const coupon = await stripe.coupons.create(couponParams);
      subscriptionParams.coupon = coupon.id;
      logStep("Discount coupon created", { couponId: coupon.id });
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);
    logStep("Subscription created", { subscriptionId: subscription.id, status: subscription.status });

    // Add implementation fee as invoice item if applicable
    if (payload.charge_implementation && payload.implementation_fee > 0) {
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(payload.implementation_fee * 100),
        currency: 'brl',
        description: 'Taxa de Implementação UOPA',
        metadata: {
          type: 'implementation_fee',
          tenant_subdomain: payload.subdomain,
        },
      });
      logStep("Implementation fee added", { amount: payload.implementation_fee });
    }

    // Create tenant in Supabase
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .insert({
        name: payload.name,
        subdomain: payload.subdomain,
        document: payload.document,
        contact_email: payload.contact_email,
        plan_type: 'beta',
        status: 'active',
        price_per_user: payload.price_per_user,
        contracted_users: payload.contracted_users,
        extra_channels: payload.extra_channels,
        channel_price: channelPrice,
        implementation_fee: payload.implementation_fee,
        implementation_paid_externally: !payload.charge_implementation,
        discount_type: payload.discount_type,
        discount_value: payload.discount_value,
        trial_enabled: payload.trial_enabled,
        trial_days: payload.trial_days,
        ai_token_limit: payload.ai_token_limit,
        storage_limit_gb: payload.storage_limit_gb,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        config: {
          branding: {
            company_name: payload.company_name || payload.name,
            primary_color: payload.primary_color || '#3b82f6',
          },
        },
      })
      .select()
      .single();

    if (tenantError) {
      logStep("Tenant creation failed", { error: tenantError.message });
      throw new Error(`Failed to create tenant: ${tenantError.message}`);
    }

    logStep("Tenant created", { tenantId: tenant.id });

    // Get payment URL if subscription requires payment
    let paymentUrl: string | null = null;
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    if (invoice?.hosted_invoice_url) {
      paymentUrl = invoice.hosted_invoice_url;
    }

    return new Response(
      JSON.stringify({
        success: true,
        tenant,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
        },
        stripe_customer_id: customerId,
        payment_url: paymentUrl,
        monthly_total: monthlyTotal,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
