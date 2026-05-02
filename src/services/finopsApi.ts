import { supabase } from '@/integrations/supabase/client';
import type {
  FinOpsFilters,
  FinOpsOverview,
  FinOpsTenantRow,
  FinOpsUserRow,
  FinOpsAIPayload,
  FinOpsMediaPayload,
  FinOpsInfraPayload,
  FinOpsInvestorPayload,
  FinOpsAnomaliesPayload,
  FinOpsPricingRow,
  FinOpsBudgetRow,
} from '@/types/finops';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  unsupported?: boolean;
}

const TIMEOUT_MS = 30_000;

/**
 * Calls master-analytics with body.action and resilient 401 retry/refresh.
 * The edge function lives in the external Supabase (CRM/backopas) and accepts
 * either body.action, query param action, or x-path-suffix header.
 */
async function callFinOps<T>(action: string, params: Record<string, unknown> | object = {}): Promise<ApiResponse<T>> {
  const body = { action, ...(params as Record<string, unknown>) };

  const invoke = async () => {
    // Timeout via AbortController — supabase-js doesn't pass signal to functions.invoke,
    // but we race to surface a friendly error when the backend is slow.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('__finops_timeout__')), TIMEOUT_MS),
    );
    const call = supabase.functions.invoke('master-analytics', { method: 'POST', body });
    const { data, error, response } = (await Promise.race([call, timeout])) as {
      data: unknown;
      error: { message: string } | null;
      response?: Response;
    };
    return { data, error, response };
  };

  try {
    let { data, error, response } = await invoke();

    if (error) {
      const status = response?.status;
      let bodyMsg: string | null = null;
      try {
        if (response) {
          const cloned = response.clone();
          const ct = response.headers.get('Content-Type') || '';
          const parsed = ct.includes('application/json') ? await cloned.json() : await cloned.text();
          bodyMsg =
            typeof parsed === 'object' && parsed !== null && 'error' in (parsed as Record<string, unknown>)
              ? String((parsed as Record<string, unknown>).error)
              : null;
        }
      } catch {
        /* noop */
      }

      if (status === 401) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          await supabase.auth.signOut();
          window.location.href = '/auth';
          return { data: null, error: 'Sessão expirada. Faça login novamente.' };
        }
        ({ data, error, response } = await invoke());
        if (error) {
          return { data: null, error: 'Sessão expirada. Faça login novamente.' };
        }
        return { data: data as T, error: null };
      }

      // Detect "Unknown endpoint" coming from the CRM backend so the UI can fall back gracefully
      const isUnsupported = !!bodyMsg && /unknown endpoint/i.test(bodyMsg);

      console.error('[finopsApi]', action, { status, error: error.message, bodyMsg });
      return { data: null, error: bodyMsg || error.message, unsupported: isUnsupported };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === '__finops_timeout__') {
      console.warn('[finopsApi] timeout', action);
      return { data: null, error: 'Tempo esgotado — backend lento. Tente novamente em instantes.' };
    }
    console.error('[finopsApi] exception', action, err);
    return { data: null, error: msg };
  }
}

/**
 * Direct read from external Postgres (RLS allows is_master_tenant() SELECT).
 * Bypasses the missing finops-pricing-list / finops-budgets-list endpoints
 * in the CRM's master-analytics edge function.
 */
async function readPricingDirect(): Promise<ApiResponse<{ rows: FinOpsPricingRow[] }>> {
  const { data, error } = await supabase
    .from('ai_model_pricing_history' as never)
    .select('*')
    .order('effective_from', { ascending: false });
  if (error) return { data: null, error: error.message };
  return { data: { rows: (data ?? []) as unknown as FinOpsPricingRow[] }, error: null };
}

async function readBudgetsDirect(): Promise<ApiResponse<{ rows: FinOpsBudgetRow[] }>> {
  const { data, error } = await supabase
    .from('ai_output_token_budgets' as never)
    .select('*')
    .order('layer', { ascending: true, nullsFirst: false })
    .order('operation', { ascending: true });
  if (error) return { data: null, error: error.message };
  return { data: { rows: (data ?? []) as unknown as FinOpsBudgetRow[] }, error: null };
}

export const finopsApi = {
  overview: (filters: FinOpsFilters = {}) => callFinOps<FinOpsOverview>('finops-overview', filters),
  tenants: (filters: FinOpsFilters = {}) =>
    callFinOps<{ rows: FinOpsTenantRow[] }>('finops-tenants', filters),
  users: (filters: FinOpsFilters & { tenant_id?: string } = {}) =>
    callFinOps<{ rows: FinOpsUserRow[] }>('finops-users', filters),
  aiModels: (filters: FinOpsFilters = {}) => callFinOps<FinOpsAIPayload>('finops-ai-models', filters),
  aiLayers: (filters: FinOpsFilters = {}) => callFinOps<FinOpsAIPayload>('finops-ai-layers', filters),
  aiOperations: (filters: FinOpsFilters = {}) =>
    callFinOps<FinOpsAIPayload>('finops-ai-operations', filters),
  media: (filters: FinOpsFilters = {}) => callFinOps<FinOpsMediaPayload>('finops-media', filters),
  infra: (filters: FinOpsFilters = {}) => callFinOps<FinOpsInfraPayload>('finops-infra', filters),
  investorSummary: (filters: FinOpsFilters = {}) =>
    callFinOps<FinOpsInvestorPayload>('finops-investor-summary', filters),
  anomalies: (filters: FinOpsFilters = {}) =>
    callFinOps<FinOpsAnomaliesPayload>('finops-anomalies', filters),

  // Pricing/Budgets: direct DB read (CRM backend doesn't expose these endpoints yet)
  pricingList: () => readPricingDirect(),
  budgetsList: () => readBudgetsDirect(),

  // Mutations remain proxied through the edge function but will return unsupported
  // until the CRM team implements them. UI checks `unsupported` to show a banner.
  pricingCreate: (payload: Partial<FinOpsPricingRow>) =>
    callFinOps<FinOpsPricingRow>('finops-pricing-create', { payload }),
  budgetsUpdate: (payload: Partial<FinOpsBudgetRow> & { id: string }) =>
    callFinOps<FinOpsBudgetRow>('finops-budgets-update', { payload }),
};

export type FinOpsApi = typeof finopsApi;
