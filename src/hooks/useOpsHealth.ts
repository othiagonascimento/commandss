import { useQuery } from '@tanstack/react-query';
import { opsHealthApi, alertsApi } from '@/services/masterApi';

export function useOpsHealth(tenantId?: string) {
  const snapshot = useQuery({
    queryKey: ['ops-health-snapshot', tenantId],
    queryFn: async () => {
      const res = await opsHealthApi.getLatest(tenantId);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const alerts = useQuery({
    queryKey: ['ops-health-alerts', tenantId],
    queryFn: async () => {
      const res = await alertsApi.getActive(tenantId);
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
    staleTime: 30_000,
  });

  const alertStats = useQuery({
    queryKey: ['ops-health-alert-stats'],
    queryFn: async () => {
      const res = await alertsApi.getStats();
      if (res.error) throw new Error(res.error);
      return res.data as {
        total_active: number;
        by_severity: Record<string, number>;
        by_type: Record<string, number>;
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: !tenantId, // Only fetch global stats when no tenant filter
  });

  const history = useQuery({
    queryKey: ['ops-health-history', tenantId],
    queryFn: async () => {
      const res = await opsHealthApi.getHistory(tenantId, 24);
      if (res.error) throw new Error(res.error);
      return (res.data || []) as Array<{
        hour: string;
        metrics: Record<string, unknown>;
      }>;
    },
    staleTime: 60_000,
  });

  return {
    snapshot: snapshot.data,
    alerts: alerts.data || [],
    alertCount: alertStats.data?.total_active ?? alerts.data?.length ?? 0,
    alertStats: alertStats.data,
    history: history.data || [],
    isLoading: snapshot.isLoading,
    isAlertsLoading: alerts.isLoading,
    refetch: () => {
      snapshot.refetch();
      alerts.refetch();
      alertStats.refetch();
      history.refetch();
    },
  };
}
