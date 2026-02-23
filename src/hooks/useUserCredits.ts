import { useQuery } from '@tanstack/react-query';
import { usageApi } from '@/services/masterApi';

export interface UserCreditData {
  user_id: string;
  user_name: string;
  user_role: string;
  credits_consumed: number;
  ai_tokens: number;
  api_calls: number;
  transcription_minutes: number;
}

export interface UserCreditsFilter {
  periodStart?: string;
  periodEnd?: string;
}

export function useUserCredits(tenantId: string | undefined, _filter?: UserCreditsFilter) {
  return useQuery({
    queryKey: ['tenant-user-credits', tenantId],
    queryFn: async (): Promise<UserCreditData[]> => {
      if (!tenantId) return [];

      const result = await usageApi.getUsers(tenantId);
      if (result.error) {
        console.error('Error fetching user credits:', result.error);
        throw new Error(result.error);
      }

      const raw = result.data?.data || [];

      return raw.map((row) => {
        const profile = row.profiles as { full_name?: string; name?: string; role?: string } | undefined;
        // credits_consumed may exist on the raw response even if not in the TS type
        const rawRow = row as unknown as Record<string, unknown>;
        return {
          user_id: row.user_id || '',
          user_name: profile?.full_name || profile?.name || 'Sem nome',
          user_role: profile?.role || 'seller',
          credits_consumed: Number(rawRow.credits_consumed || 0),
          ai_tokens: Number(row.ai_tokens_month || 0),
          api_calls: Number(row.api_calls_month || 0),
          transcription_minutes: Math.round(Number(row.transcription_seconds_month || 0) / 60),
        };
      });
    },
    enabled: !!tenantId,
    staleTime: 30000,
    gcTime: 60000,
  });
}