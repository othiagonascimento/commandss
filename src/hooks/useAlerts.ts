import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/services/masterApi';
import { toast } from 'sonner';

export interface AlertRecord {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  tenant_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface ResolvedAlertRecord extends AlertRecord {
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_notes: string | null;
  resolution_reason: string | null;
}

export function useAlerts(tenantId?: string, severity?: string) {
  const queryClient = useQueryClient();

  const alerts = useQuery({
    queryKey: ['master-alerts', tenantId, severity],
    queryFn: async () => {
      const res = await alertsApi.getActive(tenantId, severity);
      if (res.error) throw new Error(res.error);
      return (res.data || []) as AlertRecord[];
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, notes, reason }: { alertId: string; notes: string; reason: string }) => {
      const res = await alertsApi.resolve(alertId, notes, reason);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Alerta resolvido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['master-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ops-health-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['ops-health-alert-stats'] });
      queryClient.invalidateQueries({ queryKey: ['resolved-alerts'] });
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

export function useResolvedAlerts(limit = 50, offset = 0, tenantId?: string, alertType?: string) {
  return useQuery({
    queryKey: ['resolved-alerts', limit, offset, tenantId, alertType],
    queryFn: async () => {
      const res = await alertsApi.getResolved(limit, offset, tenantId, alertType);
      if (res.error) throw new Error(res.error);
      return (res.data || []) as ResolvedAlertRecord[];
    },
  });
}
