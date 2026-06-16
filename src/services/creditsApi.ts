import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T> { data: T | null; error: string | null }

async function invoke<T>(fn: string, method: 'GET' | 'POST' | 'PUT', pathSuffix?: string, body?: unknown): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {};
    if (pathSuffix) headers['x-path-suffix'] = pathSuffix;
    const { data, error, response } = await supabase.functions.invoke(fn, { method, headers, body: body ?? undefined });
    if (error) {
      let bodyMsg: string | null = null;
      try {
        if (response) {
          const ct = response.headers.get('Content-Type') || '';
          const parsed = ct.includes('application/json') ? await response.clone().json() : null;
          bodyMsg = parsed?.error ?? null;
        }
      } catch { /* noop */ }
      return { data: null, error: bodyMsg || error.message };
    }
    return { data: data as T, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

// ---------------- READ ----------------
export interface CreditsFullSnapshot {
  cycle_start: string;
  cycle_end: string;
  days_elapsed: number;
  days_remaining: number;
  active_users: number;
  per_user_base: number;
  total_base: number;
  rollover_in: number;
  extras_recharges: number;
  extras_reversal: number;
  extras_adjustments: number;
  extras_tenant_features: number;
  total_available: number;
  used: number;
  remaining: number;
  burn_per_day: number;
  projected_days_left: number | null;
  messages_sent: number;
  suspicious_events: number;
  suspicious_credits: number;
}

export interface LedgerDay { date: string; debits: number; credits: number }
export interface ResourceBreakdown { resource_type: string; credits: number; calls: number; webhook_calls: number }
export interface UserBalanceRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
  base_credits: number;
  extra_credits: number;
  used_credits: number;
  remaining_credits: number;
  suspicious_events: number;
  suspicious_credits: number;
}
export interface RechargeRow {
  id: string;
  created_at: string;
  credits_delta: number;
  entry_type: string;
  classification: string;
  user_id: string | null;
  created_by: string | null;
  cycle_reference: string;
  source_id: string | null;
  metadata: Record<string, unknown> | null;
  target_user: { id: string; full_name: string | null; email: string | null } | null;
  actor: { id: string; full_name: string | null; email: string | null } | null;
}

export interface CreditRate {
  id: string;
  operation_type: string;
  credits_per_unit: number;
  description: string | null;
  unit_description: string | null;
  is_active: boolean | null;
  updated_at: string | null;
}

export const creditsReadApi = {
  full: (tenantId: string) =>
    invoke<CreditsFullSnapshot>('master-usage', 'GET', `${tenantId}/credits-full`),
  userBalances: (tenantId: string) =>
    invoke<{ rows: UserBalanceRow[]; cycle: string }>('master-usage', 'GET', `${tenantId}/credits-user-balances`),
  ledger: (tenantId: string) =>
    invoke<{ rows: LedgerDay[] }>('master-usage', 'GET', `${tenantId}/credits-ledger`),
  resources: (tenantId: string) =>
    invoke<{ rows: ResourceBreakdown[] }>('master-usage', 'GET', `${tenantId}/credits-resources`),
  recharges: (tenantId: string) =>
    invoke<{ rows: RechargeRow[] }>('master-usage', 'GET', `${tenantId}/credits-recharges`),
  rates: () =>
    invoke<{ rows: CreditRate[] }>('master-usage', 'GET', 'credit-rates'),
  updateRate: (id: string, patch: Partial<CreditRate>) =>
    invoke<{ success: boolean; rate: CreditRate }>('master-usage', 'PUT', `credit-rates/${id}`, patch),
};


// ---------------- WRITE ----------------
export interface RechargePayload {
  tenant_id: string;
  scope: 'user' | 'tenant';
  user_id?: string;
  credits: number;
  reason: string;
  idempotency_key: string;
  payment_method?: string | null;
  amount_brl?: number | null;
  valid_until?: string | null;
}

export const creditsAdminApi = {
  recharge: (payload: RechargePayload) =>
    invoke<{ success: boolean; ledger?: unknown; idempotent?: boolean }>(
      'master-credits-admin', 'POST', undefined, { action: 'recharge', ...payload },
    ),
  reverse: (source_ledger_id: string, reason: string, idempotency_key: string) =>
    invoke<{ success: boolean }>('master-credits-admin', 'POST', undefined, {
      action: 'reverse', source_ledger_id, reason, idempotency_key,
    }),
  setUserOverride: (payload: {
    tenant_id: string; user_id: string; monthly_credits_base: number;
    notes?: string; effective_from?: string;
  }) =>
    invoke<{ success: boolean }>('master-credits-admin', 'POST', undefined, {
      action: 'set-user-override', ...payload,
    }),
  clearUserOverride: (tenant_id: string, user_id: string) =>
    invoke<{ success: boolean }>('master-credits-admin', 'POST', undefined, {
      action: 'clear-user-override', tenant_id, user_id,
    }),
  setTenantBase: (tenant_id: string, credits_per_user: number) =>
    invoke<{ success: boolean }>('master-credits-admin', 'POST', undefined, {
      action: 'set-tenant-base', tenant_id, credits_per_user,
    }),
};
