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
}

/**
 * Calls master-analytics with body.action and resilient 401 retry/refresh.
 * The edge function lives in the external Supabase (CRM/backopas) and accepts
 * either body.action, query param action, or x-path-suffix header.
 */
async function callFinOps<T>(action: string, params: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const body = { action, ...params };

  const invoke = async () => {
    const { data, error, response } = await supabase.functions.invoke('master-analytics', {
      method: 'POST',
      body,
    });
    return { data, error, response } as { data: unknown; error: { message: string } | null; response?: Response };
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

      console.error('[finopsApi]', action, { status, error: error.message, bodyMsg });
      return { data: null, error: bodyMsg || error.message };
    }

    return { data: data as T, error: null };
  } catch (err) {
    console.error('[finopsApi] exception', action, err);
    return { data: null, error: (err as Error).message };
  }
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
  pricingList: () => callFinOps<{ rows: FinOpsPricingRow[] }>('finops-pricing-list'),
  pricingCreate: (payload: Partial<FinOpsPricingRow>) =>
    callFinOps<FinOpsPricingRow>('finops-pricing-create', { payload }),
  budgetsList: () => callFinOps<{ rows: FinOpsBudgetRow[] }>('finops-budgets-list'),
  budgetsUpdate: (payload: Partial<FinOpsBudgetRow> & { id: string }) =>
    callFinOps<FinOpsBudgetRow>('finops-budgets-update', { payload }),
};

export type FinOpsApi = typeof finopsApi;
