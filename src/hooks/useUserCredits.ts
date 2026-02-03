import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function useUserCredits(tenantId: string | undefined, filter?: UserCreditsFilter) {
  return useQuery({
    queryKey: ['tenant-user-credits', tenantId, filter?.periodStart, filter?.periodEnd],
    queryFn: async (): Promise<UserCreditData[]> => {
      if (!tenantId) return [];

      // Call RPC directly since it's in external Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_tenant_user_credits', {
        p_tenant_id: tenantId,
        p_start: filter?.periodStart || null,
        p_end: filter?.periodEnd || null,
      });

      if (error) {
        console.error('Error fetching user credits:', error);
        throw error;
      }

      const results = data as Array<{
        user_id: string;
        user_name: string;
        user_role: string;
        credits_consumed: number;
        ai_tokens: number;
        api_calls: number;
        transcription_minutes: number;
      }> | null;

      return (results || []).map((row) => ({
        user_id: row.user_id,
        user_name: row.user_name,
        user_role: row.user_role,
        credits_consumed: Number(row.credits_consumed) || 0,
        ai_tokens: Number(row.ai_tokens) || 0,
        api_calls: Number(row.api_calls) || 0,
        transcription_minutes: Number(row.transcription_minutes) || 0,
      }));
    },
    enabled: !!tenantId,
    staleTime: 30000,
    gcTime: 60000,
  });
}
