import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/services/masterApi';
import { toast } from 'sonner';

export function useAlerts(tenantId?: string, severity?: string) {
  const queryClient = useQueryClient();

  const alerts = useQuery({
    queryKey: ['master-alerts', tenantId, severity],
    queryFn: async () => {
      const res = await alertsApi.getActive(tenantId, severity);
      if (res.error) throw new Error(res.error);
      return (res.data || []) as Array<{
        id: string;
        alert_type: string;
        severity: string;
        title: string;
        description: string;
        metadata: Record<string, unknown>;
        tenant_id: string | null;
        user_id: string | null;
        created_at: string;
      }>;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await alertsApi.resolve(alertId);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Alerta resolvido');
      queryClient.invalidateQueries({ queryKey: ['master-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ops-health-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ops-health-alert-stats'] });
    },
    onError: () => {
      toast.error('Erro ao resolver alerta');
    },
  });

  return {
    alerts: alerts.data || [],
    isLoading: alerts.isLoading,
    resolve: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
    refetch: alerts.refetch,
  };
}
