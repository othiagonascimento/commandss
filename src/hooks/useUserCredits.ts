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

export function useUserCredits(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-user-credits', tenantId],
    queryFn: async (): Promise<UserCreditData[]> => {
      if (!tenantId) return [];

      // Call RPC directly since it's in external Supabase
      // The RPC returns: user_id, user_name, user_role, credits_consumed, ai_tokens, api_calls, transcription_minutes
      const { data, error } = await supabase.rpc('get_tenant_user_credits' as never, {
        p_tenant_id: tenantId,
      } as never);

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
