import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing Stripe configuration" });
    return new Response(JSON.stringify({ error: "Missing configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR", { message: "No signature provided" });
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      logStep("ERROR", { message: "Invalid signature", error: err?.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription update", { 
          subscriptionId: subscription.id, 
          status: subscription.status,
          customerId 
        });

        // Find tenant by stripe_customer_id
        const { data: tenant, error: tenantError } = await supabaseAdmin
          .from("tenants")
          .select("id, name")
          .eq("stripe_customer_id", customerId)
          .single();

        if (tenantError || !tenant) {
          logStep("Tenant not found for customer", { customerId });
          break;
        }

        // Update tenant subscription info
        const updateData: any = {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        // If subscription is canceled, update status
        if (subscription.cancel_at_period_end) {
          updateData.subscription_status = "canceling";
        }

        const { error: updateError } = await supabaseAdmin
          .from("tenants")
          .update(updateData)
          .eq("id", tenant.id);

        if (updateError) {
          logStep("ERROR updating tenant", { error: updateError.message });
        } else {
          logStep("Tenant updated successfully", { tenantId: tenant.id, tenantName: tenant.name });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription deletion", { subscriptionId: subscription.id, customerId });

        const { data: tenant } = await supabaseAdmin
          .from("tenants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (tenant) {
          await supabaseAdmin
            .from("tenants")
            .update({
              subscription_status: "canceled",
              stripe_subscription_id: null,
            })
            .eq("id", tenant.id);

          logStep("Subscription canceled for tenant", { tenantId: tenant.id });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        logStep("Payment succeeded", { 
          invoiceId: invoice.id, 
          amount: invoice.amount_paid / 100,
          customerId 
        });

        // Clear any payment failures for this tenant
        const { data: tenant } = await supabaseAdmin
          .from("tenants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (tenant) {
          // Unblock tenant if it was blocked due to payment
          await supabaseAdmin
            .from("tenants")
            .update({
              is_blocked: false,
              blocked_at: null,
              blocked_reason: null,
            })
            .eq("id", tenant.id)
            .eq("blocked_reason", "payment_failed");

          // Mark payment failures as resolved
          await supabaseAdmin
            .from("payment_failures")
            .update({ resolved_at: new Date().toISOString() })
            .eq("tenant_id", tenant.id)
            .is("resolved_at", null);

          logStep("Cleared payment failures for tenant", { tenantId: tenant.id });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        logStep("Payment failed", { 
          invoiceId: invoice.id, 
          attemptCount: invoice.attempt_count,
          customerId 
        });

        const { data: tenant } = await supabaseAdmin
          .from("tenants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (tenant) {
          // Record payment failure
          await supabaseAdmin
            .from("payment_failures")
            .insert({
              tenant_id: tenant.id,
              stripe_invoice_id: invoice.id,
              amount_brl: invoice.amount_due / 100,
              failure_reason: invoice.last_finalization_error?.message || "Payment declined",
              attempt_number: invoice.attempt_count,
            });

          // Block after 3 failed attempts
          if (invoice.attempt_count >= 3) {
            await supabaseAdmin
              .from("tenants")
              .update({
                is_blocked: true,
                blocked_at: new Date().toISOString(),
                blocked_reason: "payment_failed",
              })
              .eq("id", tenant.id);

            logStep("Tenant blocked due to payment failures", { tenantId: tenant.id });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
