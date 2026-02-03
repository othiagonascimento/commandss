import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalCreditsSummary {
  total_credits_consumed: number;
  total_cost_brl: number;
  total_api_calls: number;
  total_tenants_with_usage: number;
  period_start: string;
  period_end: string;
}

export interface GlobalCreditsFilter {
  periodStart?: string;
  periodEnd?: string;
}

export function useGlobalCredits(filter?: GlobalCreditsFilter) {
  return useQuery({
    queryKey: ['global-credits-summary', filter?.periodStart, filter?.periodEnd],
    queryFn: async () => {
      // Using type cast since RPC functions are on external Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_global_credits_summary', {
        p_start: filter?.periodStart || null,
        p_end: filter?.periodEnd || null,
      });
      if (error) throw error;
      const result = data as unknown as GlobalCreditsSummary[];
      return result?.[0] || null;
    },
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 60000,
    retry: 1,
  });
}
