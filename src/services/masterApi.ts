import { supabase } from '@/integrations/supabase/client';

const PROXY_FUNCTION = 'master-proxy';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function callMasterApi<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(PROXY_FUNCTION, {
      method: 'POST',
      body: {
        path,
        method,
        payload: body,
      },
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
  getOverview: () => callMasterApi<AnalyticsOverview>('/master-analytics/overview'),
  getRevenue: () => callMasterApi<RevenueData>('/master-analytics/revenue'),
  getTenantMetrics: (tenantId: string) => 
    callMasterApi<TenantMetrics>(`/master-analytics/tenant/${tenantId}`),
  getUsage: () => callMasterApi<UsageData>('/master-analytics/usage'),
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
    return callMasterApi<TenantsListResponse>(`/master-tenants${query ? `?${query}` : ''}`);
  },
  
  get: (id: string) => callMasterApi<TenantDetail>(`/master-tenants/${id}`),
  
  create: (data: CreateTenantPayload) => 
    callMasterApi<Tenant>('/master-tenants', 'POST', data),
  
  update: (id: string, data: Partial<Tenant>) => 
    callMasterApi<Tenant>(`/master-tenants/${id}`, 'PATCH', data),
  
  deactivate: (id: string) => 
    callMasterApi<void>(`/master-tenants/${id}`, 'DELETE'),
};

// Subscriptions API
export const subscriptionsApi = {
  get: (tenantId: string) => 
    callMasterApi<SubscriptionDetail>(`/master-subscriptions/${tenantId}`),
  
  upgrade: (tenantId: string, plan: string) => 
    callMasterApi<void>(`/master-subscriptions/${tenantId}/upgrade`, 'POST', { plan }),
  
  downgrade: (tenantId: string, plan: string) => 
    callMasterApi<void>(`/master-subscriptions/${tenantId}/downgrade`, 'POST', { plan }),
  
  cancel: (tenantId: string) => 
    callMasterApi<void>(`/master-subscriptions/${tenantId}/cancel`, 'POST'),
  
  reactivate: (tenantId: string) => 
    callMasterApi<void>(`/master-subscriptions/${tenantId}/reactivate`, 'POST'),
};

// Users API
export const usersApi = {
  list: (tenantId: string) => 
    callMasterApi<TenantUser[]>(`/master-users/${tenantId}`),
  
  get: (tenantId: string, userId: string) => 
    callMasterApi<TenantUser>(`/master-users/${tenantId}/${userId}`),
  
  create: (tenantId: string, data: CreateUserPayload) => 
    callMasterApi<TenantUser>(`/master-users/${tenantId}`, 'POST', data),
  
  update: (tenantId: string, userId: string, data: Partial<TenantUser>) => 
    callMasterApi<TenantUser>(`/master-users/${tenantId}/${userId}`, 'PATCH', data),
  
  deactivate: (tenantId: string, userId: string) => 
    callMasterApi<void>(`/master-users/${tenantId}/${userId}`, 'DELETE'),
};

// Branding API
export const brandingApi = {
  get: (tenantId: string) => 
    callMasterApi<BrandingData>(`/master-branding/${tenantId}`),
  
  update: (tenantId: string, data: BrandingPayload) => 
    callMasterApi<BrandingData>(`/master-branding/${tenantId}`, 'PUT', data),
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

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_master: boolean;
  plan_type: 'basic' | 'pro' | 'enterprise';
  settings: Record<string, unknown>;
  limits: Record<string, unknown>;
  plan_features: Record<string, unknown>;
  ai_credits: number;
  created_at: string;
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
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  plan_type: 'basic' | 'pro' | 'enterprise';
  branding?: {
    company_name: string;
    logo_url?: string;
    primary_color?: string;
  };
}

export interface SubscriptionDetail {
  id: string;
  tenant_id: string;
  plan: string;
  status: 'active' | 'trial' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
}

export interface BrandingData {
  company_name: string;
  logo_url?: string;
  logo_white_url?: string;
  symbol_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  allowed_fields: string[];
}

export interface BrandingPayload {
  company_name?: string;
  logo_url?: string;
  logo_white_url?: string;
  symbol_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
}
