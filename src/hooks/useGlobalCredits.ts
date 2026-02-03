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
    queryFn: async (): Promise<GlobalCreditsSummary | null> => {
      // Try RPC first (if installed on external Supabase)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_global_credits_summary', {
          p_start: filter?.periodStart || null,
          p_end: filter?.periodEnd || null,
        });

        if (!rpcError && rpcData && rpcData.length > 0) {
          console.log('[useGlobalCredits] RPC success:', rpcData[0]);
          return rpcData[0] as GlobalCreditsSummary;
        }

        // If RPC failed or returned empty, log and continue to fallback
        if (rpcError) {
          console.warn('[useGlobalCredits] RPC failed, trying edge function:', rpcError.message);
        }
      } catch (e) {
        console.warn('[useGlobalCredits] RPC exception, trying edge function:', e);
      }

      // Fallback: Use Edge Function to get data from external Supabase
      const params = new URLSearchParams();
      if (filter?.periodStart) params.set('periodStart', filter.periodStart);
      if (filter?.periodEnd) params.set('periodEnd', filter.periodEnd);

      const pathSuffix = params.toString() ? `global-summary?${params.toString()}` : 'global-summary';

      const { data, error } = await supabase.functions.invoke('master-usage', {
        headers: { 'x-path-suffix': pathSuffix },
      });

      if (error) {
        console.error('[useGlobalCredits] Edge function error:', error);
        throw new Error(error.message || 'Erro ao carregar resumo de créditos');
      }

      console.log('[useGlobalCredits] Edge function success:', data);
      return data as GlobalCreditsSummary;
    },
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 60000,
    retry: 1,
  });
}
