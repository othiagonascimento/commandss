import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-TENANT-CHECKOUT] ${step}${detailsStr}`);
};

function appendForm(
  form: URLSearchParams,
  value: unknown,
  keyPrefix: string
): void {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      form.append(keyPrefix, String(item));
    }
    return;
  }

  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      appendForm(form, v, `${keyPrefix}[${k}]`);
    }
    return;
  }

  form.append(keyPrefix, String(value));
}

async function stripeRequest<T>(
  stripeKey: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params?: Record<string, unknown>,
  stripeVersion = "2025-08-27.basil"
): Promise<T> {
  const url = new URL(`https://api.stripe.com/v1/${path.replace(/^\/+/, "")}`);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeKey}`,
    "Stripe-Version": stripeVersion,
  };

  let body: string | undefined;

  if (method === "GET") {
    if (params) {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        appendForm(search, v, k);
      }
      search.forEach((v, k) => url.searchParams.append(k, v));
    }
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    const form = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        appendForm(form, v, k);
      }
    }
    body = form.toString();
  }

  const res = await fetch(url.toString(), { method, headers, body });
  const text = await res.text();

  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message = json?.error?.message || `Stripe error (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

Deno.serve(async (req) => {
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
    const { tenant_id } = await req.json();
    if (!tenant_id) throw new Error("tenant_id is required");
    logStep("Tenant ID received", { tenant_id });

    // Get tenant data
    const { data: tenant, error: tenantError } = await supabaseClient
      .from("tenants")
      .select("*")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Tenant not found: ${tenantError?.message || "Not found"}`);
    }
    logStep("Tenant found", { name: tenant.name, subdomain: tenant.subdomain });

    // Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    // Calculate pricing
    const channelPrice = tenant.channel_price || 19.9;
    const pricePerUser = tenant.price_per_user || 199;
    const contractedUsers = tenant.contracted_users || 1;
    const extraChannels = tenant.extra_channels || 0;

    const extraChannelsCost = Math.max(0, extraChannels) * channelPrice;
    const usersCost = pricePerUser * contractedUsers;
    const subtotal = usersCost + extraChannelsCost;

    // Apply discount
    let discountAmount = 0;
    if (tenant.discount_type === "percentage" && tenant.discount_value > 0) {
      discountAmount = subtotal * (tenant.discount_value / 100);
    } else if (tenant.discount_type === "fixed" && tenant.discount_value > 0) {
      discountAmount = tenant.discount_value;
    }

    const monthlyTotal = Math.max(0, subtotal - discountAmount);
    logStep("Pricing calculated", { usersCost, extraChannelsCost, subtotal, discountAmount, monthlyTotal });

    // Create or get Stripe customer
    let customerId = tenant.stripe_customer_id;

    if (!customerId) {
      // Check if customer exists by email
      const customers = await stripeRequest<{ data: Array<{ id: string }> }>(
        stripeKey,
        "GET",
        "customers",
        { email: tenant.contact_email, limit: 1 }
      );

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        const customer = await stripeRequest<{ id: string }>(stripeKey, "POST", "customers", {
          email: tenant.contact_email,
          name: tenant.name,
          metadata: {
            document: tenant.document || "",
            subdomain: tenant.subdomain,
            tenant_id: tenant.id,
          },
        });
        customerId = customer.id;
        logStep("Customer created", { customerId });
      }

      // Update tenant with customer ID
      await supabaseClient
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenant_id);
    }

    // Build checkout line items
    const lineItems: any[] = [];

    if (contractedUsers > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: `UOPA - Licença por Usuário (${contractedUsers} usuários)`,
            metadata: {
              type: "per_seat",
              tenant_id: tenant.id,
            },
          },
          unit_amount: Math.round(pricePerUser * 100),
          recurring: { interval: "month" },
        },
        quantity: contractedUsers,
      });
    }

    if (extraChannels > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: `UOPA - Canais Extras (${extraChannels} canais)`,
            metadata: { type: "extra_channels", tenant_id: tenant.id },
          },
          unit_amount: Math.round(channelPrice * 100),
          recurring: { interval: "month" },
        },
        quantity: extraChannels,
      });
    }

    // Implementation fee (one-time)
    if (!tenant.implementation_paid_externally && tenant.implementation_fee && tenant.implementation_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: "UOPA - Taxa de Implementação",
            metadata: { type: "implementation_fee", tenant_id: tenant.id },
          },
          unit_amount: Math.round(tenant.implementation_fee * 100),
        },
        quantity: 1,
      });
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "https://btoyclznuuwvxbsacemw.lovableproject.com";
    
    const checkoutParams: Record<string, unknown> = {
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/tenants/${tenant_id}?checkout=success`,
      cancel_url: `${origin}/tenants/${tenant_id}?checkout=cancelled`,
      subscription_data: {
        metadata: {
          tenant_id: tenant.id,
          subdomain: tenant.subdomain,
        },
      },
    };

    // Add discount if applicable
    if (tenant.discount_type && tenant.discount_value > 0) {
      const couponParams: Record<string, unknown> = {
        duration: "forever",
        name: `Desconto - ${tenant.name}`,
      };

      if (tenant.discount_type === "percentage") {
        couponParams.percent_off = tenant.discount_value;
      } else {
        couponParams.amount_off = Math.round(tenant.discount_value * 100);
        couponParams.currency = "brl";
      }

      const coupon = await stripeRequest<{ id: string }>(stripeKey, "POST", "coupons", couponParams);
      checkoutParams.discounts = [{ coupon: coupon.id }];
      logStep("Discount coupon created", { couponId: coupon.id });
    }

    // Trial
    if (tenant.trial_enabled && tenant.trial_days > 0) {
      checkoutParams.subscription_data = {
        ...(checkoutParams.subscription_data as object),
        trial_period_days: tenant.trial_days,
      };
      logStep("Trial enabled", { days: tenant.trial_days });
    }

    const session = await stripeRequest<{ id: string; url: string }>(
      stripeKey,
      "POST",
      "checkout/sessions",
      checkoutParams
    );

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        session_id: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
