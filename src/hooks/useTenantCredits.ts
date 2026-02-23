import { useQuery } from '@tanstack/react-query';
import { usageApi } from '@/services/masterApi';

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

export function useTenantCredits(tenantId: string | undefined, _filter?: TenantCreditsFilter) {
  return useQuery({
    queryKey: ['tenant-credits-summary', tenantId],
    queryFn: async (): Promise<TenantCreditsSummary | null> => {
      if (!tenantId) return null;

      const result = await usageApi.get(tenantId);
      if (result.error) throw new Error(result.error);

      const usage = result.data?.usage;
      if (!usage) return null;

      const now = new Date();
      return {
        total_credits_consumed: (usage as Record<string, number>).ai_credits || 0,
        total_cost_brl: ((usage as Record<string, number>).ai_credits || 0) * 0.02,
        total_api_calls: (usage as Record<string, number>).messages || 0,
        users_with_usage: (usage as Record<string, number>).active_users || 0,
        period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      };
    },
    enabled: !!tenantId,
    staleTime: 30000,
    gcTime: 60000,
  });
}
