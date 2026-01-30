import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function callMasterApi<T>(
  functionName: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  pathSuffix?: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    // Build headers with query params for path-based routing
    const headers: Record<string, string> = {};
    
    // For GET requests with path suffix, pass it as a query parameter
    // For other methods, include it in the body
    let requestBody = body;
    
    if (pathSuffix) {
      // Pass pathSuffix as a header that the edge function can read
      headers['x-path-suffix'] = pathSuffix;
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      method,
      headers,
      body: requestBody || undefined,
    });

    if (error) {
      console.error('[MasterAPI] Error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as T, error: null };
  } catch (err) {
    console.error('[MasterAPI] Exception:', err);
    return { data: null, error: (err as Error).message };
  }
}

// Analytics API
export const analyticsApi = {
  getOverview: () => callMasterApi<AnalyticsOverview>('master-analytics', 'GET', 'overview'),
  getRevenue: () => callMasterApi<RevenueData>('master-analytics', 'GET', 'revenue'),
  getTimeSeries: (period: 'monthly' | 'daily' = 'monthly') => 
    callMasterApi<TimeSeriesResponse>('master-analytics', 'GET', `timeseries?period=${period}`),
  getTenantMetrics: (tenantId: string) => 
    callMasterApi<TenantMetrics>('master-analytics', 'GET', `tenant/${tenantId}`),
  getUsage: () => callMasterApi<UsageData>('master-analytics', 'GET', 'usage'),
};

// Tenants API
export const tenantsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; plan_type?: string; is_active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.plan_type) queryParams.set('plan_type', params.plan_type);
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    
    const query = queryParams.toString();
    return callMasterApi<TenantsListResponse>('master-tenants', 'GET', query ? `?${query}` : undefined);
  },
  
  get: (id: string) => callMasterApi<TenantDetail>('master-tenants', 'GET', id),
  
  create: (data: CreateTenantPayload) => 
    callMasterApi<Tenant>('master-tenants', 'POST', undefined, data),
  
  update: (id: string, data: Partial<Tenant>) => 
    callMasterApi<Tenant>('master-tenants', 'PATCH', id, data),
  
  deactivate: (id: string) => 
    callMasterApi<void>('master-tenants', 'DELETE', id),
  
  deletePermanently: (id: string) => 
    callMasterApi<void>('master-tenants', 'DELETE', `${id}?permanent=true`),
};

// Subscriptions API
export const subscriptionsApi = {
  get: (tenantId: string) => 
    callMasterApi<SubscriptionDetail>('master-subscriptions', 'GET', tenantId),
  
  upgrade: (tenantId: string, plan: string) => 
    callMasterApi<void>('master-subscriptions', 'POST', `${tenantId}/upgrade`, { plan }),
  
  downgrade: (tenantId: string, plan: string) => 
    callMasterApi<void>('master-subscriptions', 'POST', `${tenantId}/downgrade`, { plan }),
  
  cancel: (tenantId: string) => 
    callMasterApi<void>('master-subscriptions', 'POST', `${tenantId}/cancel`),
  
  reactivate: (tenantId: string) => 
    callMasterApi<void>('master-subscriptions', 'POST', `${tenantId}/reactivate`),
  
  openCustomerPortal: async (tenantId: string): Promise<ApiResponse<{ url: string }>> => {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      body: { tenantId },
    });
    if (error) return { data: null, error: error.message };
    return { data: data as { url: string }, error: null };
  },

  createCheckout: async (tenantId: string): Promise<ApiResponse<{ url: string }>> => {
    const { data, error } = await supabase.functions.invoke('create-tenant-checkout', {
      body: { tenant_id: tenantId },
    });
    if (error) return { data: null, error: error.message };
    return { data: data as { url: string }, error: null };
  },
};

// Users API
export const usersApi = {
  list: (tenantId: string) => 
    callMasterApi<UsersListResponse>('master-users', 'GET', tenantId),
  
  get: (tenantId: string, userId: string) => 
    callMasterApi<TenantUser>('master-users', 'GET', `${tenantId}/${userId}`),
  
  create: (tenantId: string, data: CreateUserPayload) => 
    callMasterApi<TenantUser>('master-users', 'POST', tenantId, data),
  
  update: (tenantId: string, userId: string, data: Partial<TenantUser> & { password?: string }) => 
    callMasterApi<TenantUser>('master-users', 'PATCH', `${tenantId}/${userId}`, data),
  
  deactivate: (tenantId: string, userId: string) => 
    callMasterApi<void>('master-users', 'DELETE', `${tenantId}/${userId}`),
};

// Branding API
export const brandingApi = {
  get: (tenantId: string) => 
    callMasterApi<BrandingData>('master-branding', 'GET', tenantId),
  
  update: (tenantId: string, data: BrandingPayload) => 
    callMasterApi<BrandingData>('master-branding', 'PUT', tenantId, data),
};

// ============================================
// NEW: Tenant Features API
// ============================================
export const featuresApi = {
  get: (tenantId: string) => 
    callMasterApi<TenantFeatures>('master-tenant-features', 'GET', tenantId),
  
  update: (tenantId: string, data: TenantFeaturesPayload) => 
    callMasterApi<TenantFeatures>('master-tenant-features', 'PUT', tenantId, data),
  
  applyOverride: (tenantId: string, override: OverridePayload) =>
    callMasterApi<TenantFeatures>('master-tenant-features', 'POST', `${tenantId}/override`, override),
  
  clearOverride: (tenantId: string) =>
    callMasterApi<TenantFeatures>('master-tenant-features', 'DELETE', `${tenantId}/override`),
};

// ============================================
// NEW: User Limits API
// ============================================
export const userLimitsApi = {
  list: (tenantId: string) =>
    callMasterApi<UserLimitsListResponse>('master-user-limits', 'GET', tenantId),
  
  get: (tenantId: string, userId: string) => 
    callMasterApi<UserLimitsDetail>('master-user-limits', 'GET', `${tenantId}/${userId}`),
  
  update: (tenantId: string, userId: string, data: UserLimitsPayload) =>
    callMasterApi<UserLimits>('master-user-limits', 'PUT', `${tenantId}/${userId}`, data),
  
  remove: (tenantId: string, userId: string) =>
    callMasterApi<{ success: boolean }>('master-user-limits', 'DELETE', `${tenantId}/${userId}`),
};

// ============================================
// NEW: Billing Subscriptions API
// ============================================
export const billingApi = {
  get: (tenantId: string) =>
    callMasterApi<BillingSubscription>('master-billing', 'GET', tenantId),
  
  getOverview: () =>
    callMasterApi<BillingOverview>('master-billing', 'GET', 'overview'),
  
  update: (tenantId: string, data: BillingUpdatePayload) =>
    callMasterApi<BillingSubscription>('master-billing', 'PUT', tenantId, data),
  
  activate: (tenantId: string) =>
    callMasterApi<BillingSubscription>('master-billing', 'POST', `${tenantId}/activate`),
  
  cancel: (tenantId: string) =>
    callMasterApi<BillingSubscription>('master-billing', 'POST', `${tenantId}/cancel`),
};

// ============================================
// NEW: Usage API
// ============================================
export const usageApi = {
  get: (tenantId: string) =>
    callMasterApi<TenantUsageDetail>('master-usage', 'GET', tenantId),
  
  getUsers: (tenantId: string) =>
    callMasterApi<UserUsageListResponse>('master-usage', 'GET', `${tenantId}/users`),
  
  getAlerts: (threshold?: number) =>
    callMasterApi<UsageAlertsResponse>('master-usage', 'GET', `alerts${threshold ? `?threshold=${threshold}` : ''}`),
  
  recalculate: (tenantId: string) =>
    callMasterApi<{ success: boolean; usage: unknown }>('master-usage', 'POST', `${tenantId}/recalculate`),
};

// ============================================
// Types
// ============================================

// Existing types
export interface AnalyticsOverview {
  tenants: {
    total: number;
    active: number;
    basic: number;
    pro: number;
    enterprise: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    cancelled: number;
  };
  usage: {
    total_leads: number;
    total_users: number;
    total_messages: number;
  };
  recent_activity: {
    new_tenants_7d: number;
    new_leads_7d: number;
  };
}

export interface RevenueData {
  mrr: number;
  arr: number;
  total: number;
  growth_percentage: number;
  by_plan?: Record<string, number>;
  breakdown?: {
    paying_tenants: number;
    free_tenants: number;
    trial_tenants: number;
    lifetime_tenants: number;
    pending_tenants: number;
    average_mrr: number;
  };
  implementation_revenue?: number;
  credits_revenue?: number;
  total_revenue_month?: number;
}

export interface TenantMetrics {
  leads: number;
  users: number;
  messages: number;
  storage_used: number;
}

export interface UsageData {
  total_leads: number;
  total_users: number;
  total_messages: number;
  total_storage: number;
}

export interface TimeSeriesDataPoint {
  month?: string;
  day?: string;
  date: string;
  mrr?: number;
  tenants?: number;
  leads: number;
  users: number;
  messages: number;
}

export interface TimeSeriesResponse {
  period: 'monthly' | 'daily';
  data: TimeSeriesDataPoint[];
}

export interface PromoInfo {
  type: 'trial' | 'partnership' | 'lifetime';
  days: number | null;
  reason: string | null;
  granted_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  status: string;
  is_active: boolean;
  is_master?: boolean;
  plan_type: string;
  implementation_level: number;
  settings?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  plan_features?: Record<string, unknown>;
  ai_credits?: number;
  created_at: string;
  user_count?: number;
  lead_count?: number;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  trial_enabled?: boolean;
  trial_days?: number | null;
  current_period_end?: string | null;
  config?: {
    promo?: PromoInfo;
  } | null;
}

export interface TenantDetail extends Tenant {
  branding?: BrandingData;
  subscription?: SubscriptionDetail;
  usage?: TenantMetrics;
}

export interface TenantsListResponse {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UsersListResponse {
  data: TenantUser[];
  total: number;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  subdomain: string;
  plan_type: string;
  plan_id?: string;
  contact_email?: string;
  promo_enabled?: boolean;
  promo_type?: 'trial' | 'partnership' | 'lifetime';
  promo_days?: number;
  promo_reason?: string;
  branding?: {
    company_name: string;
    logo_url?: string;
    primary_color?: string;
  };
  // Admin user credentials (optional)
  admin_email?: string;
  admin_name?: string;
  admin_password?: string;
}

export interface SubscriptionDetail {
  tenant_id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  billing_cycle: string;
  amount: number;
  currency: string;
  features: string[];
}

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  full_name: string;
  role: 'admin' | 'user' | string;
  status: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  full_name?: string;
  password: string;
  role: 'admin' | 'manager' | 'viewer';
}

export interface BrandingData {
  id?: string;
  tenant_id: string;
  company_name: string;
  tagline?: string | null;
  logo_url?: string | null;
  logo_white_url?: string | null;
  symbol_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  font_family?: string;
  border_radius?: string;
  login_background_url?: string | null;
  email_header_html?: string | null;
  footer_text?: string | null;
  custom_css?: string | null;
  allowed_fields?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BrandingPayload {
  company_name?: string;
  tagline?: string;
  logo_url?: string;
  logo_white_url?: string;
  symbol_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  font_family?: string;
  border_radius?: string;
  login_background_url?: string;
  email_header_html?: string;
  footer_text?: string;
  custom_css?: string;
}

// ============================================
// NEW Types for Integration
// ============================================

// Tenant Features Types
export interface TenantFeatures {
  id?: string;
  tenant_id: string;
  // Modules
  module_ai_agent: boolean;
  module_ai_transcription: boolean;
  module_automation_flows: boolean;
  module_campaigns: boolean;
  module_ecommerce: boolean;
  module_erp_integration: boolean;
  module_api_access: boolean;
  module_whitelabel: boolean;
  module_multi_whatsapp: boolean;
  // Limits (tenant-level)
  limit_users: number;
  limit_leads: number;
  limit_products: number;
  limit_whatsapp_instances: number;
  limit_ai_tokens_monthly: number; // Legacy, kept for backwards compatibility
  limit_storage_mb: number; // Legacy, kept for backwards compatibility
  // Per-user quotas
  credits_per_user?: number;
  storage_mb_per_user?: number;
  // AI Engine Config
  ai_use_global_config?: boolean;
  ai_layer_1_model?: string | null;
  ai_layer_1_instructions?: string | null;
  ai_layer_2_model?: string | null;
  ai_layer_2_instructions?: string | null;
  ai_layer_3_model?: string | null;
  ai_layer_3_instructions?: string | null;
  // Overrides
  overrides: Record<string, unknown>;
  override_reason?: string | null;
  overridden_by?: string | null;
  overridden_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantFeaturesPayload {
  modules?: {
    module_ai_agent?: boolean;
    module_ai_transcription?: boolean;
    module_automation_flows?: boolean;
    module_campaigns?: boolean;
    module_ecommerce?: boolean;
    module_erp_integration?: boolean;
    module_api_access?: boolean;
    module_whitelabel?: boolean;
    module_multi_whatsapp?: boolean;
  };
  limits?: {
    limit_users?: number;
    limit_leads?: number;
    limit_products?: number;
    limit_whatsapp_instances?: number;
    limit_ai_tokens_monthly?: number;
    limit_storage_mb?: number;
    credits_per_user?: number;
    storage_mb_per_user?: number;
  };
  ai_config?: {
    ai_use_global_config?: boolean;
    ai_layer_1_model?: string | null;
    ai_layer_1_instructions?: string | null;
    ai_layer_2_model?: string | null;
    ai_layer_2_instructions?: string | null;
    ai_layer_3_model?: string | null;
    ai_layer_3_instructions?: string | null;
  };
  overrides?: Record<string, unknown>;
  override_reason?: string;
}

export interface OverridePayload {
  overrides: Record<string, unknown>;
  reason: string;
}

// User Limits Types
export interface UserLimits {
  id?: string;
  user_id: string;
  tenant_id: string;
  // Limits (null = inherit from tenant)
  ai_tokens_monthly: number | null;
  storage_mb: number | null;
  messages_monthly: number | null;
  api_calls_monthly: number | null;
  // Permissions (null = inherit from tenant)
  can_use_ai: boolean | null;
  can_transcribe: boolean | null;
  can_use_api: boolean | null;
  can_send_campaigns: boolean | null;
  can_manage_automations: boolean | null;
  // Metadata
  configured_by?: string | null;
  configured_at?: string | null;
  reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserUsage {
  id?: string;
  user_id: string;
  tenant_id: string;
  ai_tokens_month: number;
  ai_tokens_total: number;
  storage_bytes: number;
  transcription_seconds_month: number;
  messages_sent_month: number;
  api_calls_month: number;
  billing_period_start?: string;
  last_updated_at?: string;
}

export interface UserLimitsDetail {
  limits: UserLimits;
  usage: UserUsage;
  tenant_limits: TenantFeatures;
  has_custom_limits: boolean;
}

export interface UserLimitsListResponse {
  data: (UserLimits & { profiles?: { id: string; full_name: string; role: string } })[];
  total: number;
}

export interface UserLimitsPayload {
  limits?: {
    ai_tokens_monthly?: number | null;
    storage_mb?: number | null;
    messages_monthly?: number | null;
    api_calls_monthly?: number | null;
  };
  permissions?: {
    can_use_ai?: boolean | null;
    can_transcribe?: boolean | null;
    can_use_api?: boolean | null;
    can_send_campaigns?: boolean | null;
    can_manage_automations?: boolean | null;
  };
  reason?: string;
}

// Billing Types
export interface BillingSubscription {
  id?: string;
  tenant_id: string;
  plan_type: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string | null;
  cancelled_at?: string | null;
  external_subscription_id?: string | null;
  metadata: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface BillingOverview {
  data: (BillingSubscription & { tenants?: { id: string; name: string; subdomain: string } })[];
  stats: {
    total: number;
    active: number;
    trialing: number;
    past_due: number;
    cancelled: number;
    by_plan: {
      basic: number;
      pro: number;
      enterprise: number;
    };
  };
}

export interface BillingUpdatePayload {
  plan_type?: 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete';
  current_period_end?: string;
  trial_ends_at?: string | null;
  external_subscription_id?: string | null;
  metadata?: Record<string, unknown>;
}

// Usage Types
export interface TenantUsageDetail {
  usage: {
    users: number;
    leads: number;
    products: number;
    whatsapp_instances: number;
    ai_credits: number;    // Primary metric (credits consumed)
    ai_tokens: number;     // Secondary/internal metric
    storage_mb: number;
    messages: number;
    active_users: number;
  };
  limits: {
    users: number;
    leads: number;
    products: number;
    whatsapp_instances: number;
    ai_credits: number;       // Total credits limit (credits_per_user × users)
    ai_tokens: number;        // Legacy/internal limit
    storage_mb: number;
    credits_per_user?: number; // Per-user quota for display
  };
  percentages: {
    users: number;
    leads: number;
    products: number;
    whatsapp_instances: number;
    ai_credits: number;
    ai_tokens: number;
    storage_mb: number;
  };
  alerts: string[];
  last_calculated_at: string | null;
  data_source?: 'remote' | 'local';
}

export interface UserUsageListResponse {
  data: (UserUsage & { 
    profiles?: { id: string; full_name: string; role: string };
    user_limits?: UserLimits;
  })[];
  total: number;
}

export interface UsageAlertsResponse {
  data: {
    id: string;
    name: string;
    subdomain: string;
    alerts: string[];
  }[];
  total: number;
}

// ============================================
// Domains API - for tenant domain resolution
// ============================================
export const domainsApi = {
  checkSubdomainAvailability: async (subdomain: string): Promise<ApiResponse<{ available: boolean; suggestion?: string }>> => {
    const { data, error } = await supabase.functions.invoke('verify-domains', {
      method: 'GET',
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Use query params approach
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-domains?action=check-subdomain&subdomain=${encodeURIComponent(subdomain)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return { data: null, error: 'Failed to check subdomain availability' };
    }
    
    const result = await response.json();
    return { data: result, error: null };
  },
  
  resolveTenantByDomain: async (domain: string): Promise<ApiResponse<{
    tenant_id: string;
    subdomain: string;
    name: string;
    branding: {
      company_name: string | null;
      logo_url: string | null;
      logo_white_url: string | null;
      symbol_url: string | null;
      favicon_url: string | null;
      primary_color: string | null;
      secondary_color: string | null;
    } | null;
    config?: Record<string, unknown>;
  }>> => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-domains?action=resolve&domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.error || 'Failed to resolve tenant' };
    }
    
    const result = await response.json();
    return { data: result, error: null };
  },
};
