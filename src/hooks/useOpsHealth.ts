import { useMasterRead } from '@/hooks/useMasterRead';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { OpsSnapshotSchema } from '@/lib/masterSchemas';
import { callMasterApiRaw } from '@/services/masterApi';
import { opsHealthApi, alertsApi } from '@/services/masterApi';
import type { MasterReadMeta } from '@/lib/masterContract';
import type { AlertRecord } from '@/hooks/useAlerts';

const AlertSchema = z.object({
  id: z.string(),
  alert_type: z.string(),
  severity: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  tenant_id: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  created_at: z.string(),
}).passthrough();

const AlertsArraySchema = z.array(AlertSchema);

export interface UseOpsHealthResult {
  snapshot: z.infer<typeof OpsSnapshotSchema> | null;
  snapshotMeta: MasterReadMeta | null;
  snapshotSchemaInvalid: boolean;
  alerts: AlertRecord[];
  alertsMeta: MasterReadMeta | null;
  alertCount: number;
  alertStats: { total_active: number; by_severity: Record<string, number>; by_type: Record<string, number> } | undefined;
  history: Array<{ hour: string; metrics: Record<string, unknown> }>;
  isLoading: boolean;
  isAlertsLoading: boolean;
  refetch: () => void;
}

export function useOpsHealth(tenantId?: string): UseOpsHealthResult {
  // v2 envelope read for the snapshot (the most quality-sensitive piece)
  const snapshot = useMasterRead({
    widget: tenantId ? `ops.snapshot.${tenantId}` : 'ops.snapshot.global',
    queryKey: ['ops-health-snapshot-v2', tenantId],
    queryFn: () => callMasterApiRaw(
      'ops-health-query',
      'GET',
      tenantId ? `?action=latest&tenant_id=${tenantId}` : '?action=latest'
    ),
    dataSchema: OpsSnapshotSchema,
    options: { refetchInterval: 60_000, refetchOnWindowFocus: true, staleTime: 30_000 },
  });

  // Alerts also v2
  const alerts = useMasterRead({
    widget: tenantId ? `ops.alerts.${tenantId}` : 'ops.alerts.global',
    queryKey: ['ops-health-alerts-v2', tenantId],
    queryFn: () => callMasterApiRaw(
      'ops-health-query',
      'GET',
      tenantId ? `?action=alerts&tenant_id=${tenantId}` : '?action=alerts'
    ),
    dataSchema: AlertsArraySchema,
    options: { refetchInterval: 60_000, refetchOnWindowFocus: true, staleTime: 30_000 },
  });

  // Stats + history stay v1 (not surfaced as critical metrics)
  const alertStats = useQuery({
    queryKey: ['ops-health-alert-stats'],
    queryFn: async () => {
      const res = await alertsApi.getStats();
      if (res.error) throw new Error(res.error);
      return res.data as { total_active: number; by_severity: Record<string, number>; by_type: Record<string, number> };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: !tenantId,
  });

  const history = useQuery({
    queryKey: ['ops-health-history', tenantId],
    queryFn: async () => {
      const res = await opsHealthApi.getHistory(tenantId, 24);
      if (res.error) throw new Error(res.error);
      // history endpoint now returns v2 envelope; unwrap defensively
      const raw = res.data as unknown;
      const arr = (raw && typeof raw === 'object' && 'data' in raw)
        ? (raw as { data: unknown }).data
        : raw;
      return (Array.isArray(arr) ? arr : []) as Array<{ hour: string; metrics: Record<string, unknown> }>;
    },
    staleTime: 60_000,
  });

  return {
    snapshot: snapshot.data,
    snapshotMeta: snapshot.meta,
    snapshotSchemaInvalid: snapshot.schemaInvalid,
    alerts: (alerts.data ?? []) as unknown as AlertRecord[],
    alertsMeta: alerts.meta,
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
