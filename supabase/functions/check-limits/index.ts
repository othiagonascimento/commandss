import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Plan {
  id: string;
  slug: string;
  max_users: number;
  max_leads: number | null;
  max_products: number | null;
  max_channels: number;
  max_storage_gb: number;
  max_ai_tokens: number;
  max_messages_month: number | null;
  max_automations: number | null;
  features_enabled: string[];
}

interface Tenant {
  id: string;
  plan_id: string | null;
  plan_type: string;
  limits_override: Record<string, number> | null;
}

interface LimitCheckRequest {
  tenant_id: string;
  resource: string;
  current_usage?: number;
  requested_amount?: number;
}

interface LimitCheckResponse {
  allowed: boolean;
  limit: number | null;
  current: number;
  remaining: number | null;
  message: string;
}

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[check-limits] ${step}${detailsStr}`);
}

function getLimit(plan: Plan | null, override: Record<string, number> | null, resource: string): number | null {
  // First check override
  if (override && resource in override) {
    return override[resource];
  }
  
  // Then check plan
  if (!plan) return null;
  
  const resourceMap: Record<string, keyof Plan> = {
    users: "max_users",
    leads: "max_leads",
    products: "max_products",
    channels: "max_channels",
    storage: "max_storage_gb",
    ai_tokens: "max_ai_tokens",
    messages: "max_messages_month",
    automations: "max_automations",
  };
  
  const planKey = resourceMap[resource];
  if (!planKey) return null;
  
  const value = plan[planKey];
  if (typeof value === "number") {
    // -1 means unlimited
    return value === -1 ? null : value;
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body = await req.json() as LimitCheckRequest;
    const { tenant_id, resource, current_usage = 0, requested_amount = 1 } = body;

    if (!tenant_id || !resource) {
      return new Response(
        JSON.stringify({ error: "tenant_id and resource are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Checking limit", { tenant_id, resource, current_usage, requested_amount });

    // Get tenant with plan
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, plan_id, plan_type, limits_override")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan
    let plan: Plan | null = null;
    
    if (tenant.plan_id) {
      const { data: planData } = await supabase
        .from("plans")
        .select("*")
        .eq("id", tenant.plan_id)
        .single();
      plan = planData as Plan | null;
    } else if (tenant.plan_type) {
      // Fallback to plan_type for backwards compatibility
      const { data: planData } = await supabase
        .from("plans")
        .select("*")
        .eq("slug", tenant.plan_type)
        .single();
      plan = planData as Plan | null;
    }

    logStep("Found plan", { plan_slug: plan?.slug, plan_id: plan?.id });

    // Calculate limit
    const limit = getLimit(plan, tenant.limits_override as Record<string, number> | null, resource);
    
    logStep("Limit calculated", { limit, current_usage, requested_amount });

    // Check if allowed
    let allowed = true;
    let remaining: number | null = null;
    let message = "";

    if (limit !== null) {
      remaining = limit - current_usage;
      const afterAction = current_usage + requested_amount;
      
      if (afterAction > limit) {
        allowed = false;
        message = `Limite de ${resource} atingido. Máximo: ${limit}, Atual: ${current_usage}`;
      } else {
        message = `OK. Restam ${remaining} de ${limit}`;
      }
    } else {
      message = "Sem limite definido (ilimitado)";
    }

    const response: LimitCheckResponse = {
      allowed,
      limit,
      current: current_usage,
      remaining,
      message,
    };

    logStep("Result", { allowed, limit, current: current_usage, remaining });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Error", { error: String(error) });
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Batch check multiple resources at once
// POST /check-limits with body: { tenant_id, checks: [{ resource, current_usage, requested_amount }] }
// Returns: { results: { [resource]: LimitCheckResponse } }