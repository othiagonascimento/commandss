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
    // Build the full path for the function URL
    const functionPath = pathSuffix ? `${functionName}/${pathSuffix}` : functionName;
    
    const { data, error } = await supabase.functions.invoke(functionPath, {
      method,
      body: body || undefined,
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
  
  update: (tenantId: string, userId: string, data: Partial<TenantUser>) => 
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

// Types
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
  trial_enabled?: boolean;
  trial_days?: number;
  branding?: {
    company_name: string;
    logo_url?: string;
    primary_color?: string;
  };
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
  role: 'admin' | 'user' | string;
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
