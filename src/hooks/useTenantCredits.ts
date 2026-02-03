import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TenantCreditsSummary {
  total_credits_consumed: number;
  total_cost_brl: number;
  total_api_calls: number;
  users_with_usage: number;
  period_start: string;
  period_end: string;
}

export interface TenantCreditsFilter {
  periodStart?: string;
  periodEnd?: string;
}

export function useTenantCredits(tenantId: string | undefined, filter?: TenantCreditsFilter) {
  return useQuery({
    queryKey: ['tenant-credits-summary', tenantId, filter?.periodStart, filter?.periodEnd],
    queryFn: async () => {
      if (!tenantId) return null;
      // Using type cast since RPC functions are on external Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_tenant_credits_summary', { 
        p_tenant_id: tenantId,
        p_start: filter?.periodStart || null,
        p_end: filter?.periodEnd || null,
      });
      if (error) throw error;
      const result = data as unknown as TenantCreditsSummary[];
      return result?.[0] || null;
    },
    enabled: !!tenantId,
    staleTime: 30000,
    gcTime: 60000,
  });
}
