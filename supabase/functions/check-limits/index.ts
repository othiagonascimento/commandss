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

interface TenantFeatures {
  credits_per_user: number | null;
  storage_mb_per_user: number | null;
  limit_users: number | null;
  limit_leads: number | null;
  limit_products: number | null;
  limit_whatsapp_instances: number | null;
  limit_ai_tokens_monthly: number | null;
  limit_storage_mb: number | null;
}

interface UserLimits {
  ai_tokens_monthly: number | null;
  storage_mb: number | null;
  messages_monthly: number | null;
  api_calls_monthly: number | null;
}

interface UserUsage {
  ai_tokens_month: number;
  storage_bytes: number;
  messages_sent_month: number;
  api_calls_month: number;
}

interface Tenant {
  id: string;
  plan_id: string | null;
  plan_type: string;
  limits_override: Record<string, number> | null;
}

interface LimitCheckRequest {
  tenant_id: string;
  user_id?: string; // For per-user limit checks
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
  is_per_user?: boolean;
}

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[check-limits] ${step}${detailsStr}`);
}

// Resources that are counted per-user (not per-tenant)
const PER_USER_RESOURCES = ['ai_tokens', 'storage', 'credits'];

function getTenantLimit(
  plan: Plan | null, 
  override: Record<string, number> | null, 
  tenantFeatures: TenantFeatures | null,
  resource: string
): number | null {
  // First check tenant features override
  if (tenantFeatures) {
    const featureMap: Record<string, keyof TenantFeatures> = {
      users: "limit_users",
      leads: "limit_leads",
      products: "limit_products",
      channels: "limit_whatsapp_instances",
    };
    const featureKey = featureMap[resource];
    if (featureKey && tenantFeatures[featureKey] !== null && tenantFeatures[featureKey] !== undefined) {
      const value = tenantFeatures[featureKey] as number;
      return value === -1 ? null : value;
    }
  }

  // Then check limits_override
  if (override && resource in override) {
    const value = override[resource];
    return value === -1 ? null : value;
  }
  
  // Then check plan
  if (!plan) return null;
  
  const resourceMap: Record<string, keyof Plan> = {
    users: "max_users",
    leads: "max_leads",
    products: "max_products",
    channels: "max_channels",
    messages: "max_messages_month",
    automations: "max_automations",
  };
  
  const planKey = resourceMap[resource];
  if (!planKey) return null;
  
  const value = plan[planKey];
  if (typeof value === "number") {
    return value === -1 ? null : value;
  }
  
  return null;
}

function getUserLimit(
  tenantFeatures: TenantFeatures | null,
  userLimits: UserLimits | null,
  resource: string
): number | null {
  // First check user-specific limits
  if (userLimits) {
    const userLimitMap: Record<string, keyof UserLimits> = {
      ai_tokens: "ai_tokens_monthly",
      credits: "ai_tokens_monthly",
      storage: "storage_mb",
      messages: "messages_monthly",
      api_calls: "api_calls_monthly",
    };
    const userKey = userLimitMap[resource];
    if (userKey && userLimits[userKey] !== null && userLimits[userKey] !== undefined) {
      const value = userLimits[userKey] as number;
      return value === -1 ? null : value;
    }
  }

  // Fallback to tenant's per-user defaults
  if (tenantFeatures) {
    if (resource === 'ai_tokens' || resource === 'credits') {
      const value = tenantFeatures.credits_per_user ?? 500; // Default 500 credits per user
      return value === -1 ? null : value;
    }
    if (resource === 'storage') {
      const value = tenantFeatures.storage_mb_per_user ?? 100; // Default 100 MB per user
      return value === -1 ? null : value;
    }
  }

  // Ultimate fallback defaults
  if (resource === 'ai_tokens' || resource === 'credits') return 500;
  if (resource === 'storage') return 100;
  
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
    const { tenant_id, user_id, resource, current_usage = 0, requested_amount = 1 } = body;

    if (!tenant_id || !resource) {
      return new Response(
        JSON.stringify({ error: "tenant_id and resource are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isPerUserResource = PER_USER_RESOURCES.includes(resource);
    
    logStep("Checking limit", { tenant_id, user_id, resource, current_usage, requested_amount, isPerUserResource });

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

    // Get tenant features
    const { data: tenantFeatures } = await supabase
      .from("tenant_features")
      .select("credits_per_user, storage_mb_per_user, limit_users, limit_leads, limit_products, limit_whatsapp_instances, limit_ai_tokens_monthly, limit_storage_mb")
      .eq("tenant_id", tenant_id)
      .single();

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
      const { data: planData } = await supabase
        .from("plans")
        .select("*")
        .eq("slug", tenant.plan_type)
        .single();
      plan = planData as Plan | null;
    }

    logStep("Found plan", { plan_slug: plan?.slug, plan_id: plan?.id });

    let limit: number | null = null;
    let actualCurrentUsage = current_usage;

    // For per-user resources, check user-specific limits
    if (isPerUserResource && user_id) {
      // Get user-specific limits
      const { data: userLimits } = await supabase
        .from("user_limits")
        .select("ai_tokens_monthly, storage_mb, messages_monthly, api_calls_monthly")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .single();

      // Get user's current usage
      const { data: userUsage } = await supabase
        .from("user_usage")
        .select("ai_tokens_month, storage_bytes, messages_sent_month, api_calls_month")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .single();

      // Calculate limit based on user limits or tenant defaults
      limit = getUserLimit(
        tenantFeatures as TenantFeatures | null, 
        userLimits as UserLimits | null, 
        resource
      );

      // Get actual usage from user_usage
      if (userUsage) {
        if (resource === 'ai_tokens' || resource === 'credits') {
          actualCurrentUsage = userUsage.ai_tokens_month || 0;
        } else if (resource === 'storage') {
          // Convert bytes to MB for comparison
          actualCurrentUsage = Math.round((userUsage.storage_bytes || 0) / 1048576);
        }
      }

      logStep("Per-user limit check", { user_id, limit, actualCurrentUsage, userLimits, tenantFeatures });
    } else {
      // For tenant-level resources, use the original logic
      limit = getTenantLimit(
        plan, 
        tenant.limits_override as Record<string, number> | null,
        tenantFeatures as TenantFeatures | null, 
        resource
      );
      logStep("Tenant limit calculated", { limit, current_usage, requested_amount });
    }

    // Check if allowed
    let allowed = true;
    let remaining: number | null = null;
    let message = "";

    if (limit !== null) {
      remaining = limit - actualCurrentUsage;
      const afterAction = actualCurrentUsage + requested_amount;
      
      if (afterAction > limit) {
        allowed = false;
        const resourceLabel = isPerUserResource ? `${resource} (por usuário)` : resource;
        message = `Limite de ${resourceLabel} atingido. Máximo: ${limit}, Atual: ${actualCurrentUsage}`;
      } else {
        message = `OK. Restam ${remaining} de ${limit}`;
      }
    } else {
      message = "Sem limite definido (ilimitado)";
    }

    const response: LimitCheckResponse = {
      allowed,
      limit,
      current: actualCurrentUsage,
      remaining,
      message,
      is_per_user: isPerUserResource,
    };

    logStep("Result", { allowed, limit, current: actualCurrentUsage, remaining, isPerUserResource });

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
