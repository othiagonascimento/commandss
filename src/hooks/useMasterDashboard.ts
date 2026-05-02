import { useMasterRead } from '@/hooks/useMasterRead';
import { callMasterApiRaw } from '@/services/masterApi';
import {
  AnalyticsOverviewSchema,
  RevenueSchema,
  TimeSeriesResponseSchema,
} from '@/lib/masterSchemas';
import type { z } from 'zod';
import type { MasterReadMeta } from '@/lib/masterContract';

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;
export type RevenueData = z.infer<typeof RevenueSchema>;
export type TimeSeriesResponse = z.infer<typeof TimeSeriesResponseSchema>;

export interface MasterDashboardData {
  overview: AnalyticsOverview | null;
  overviewMeta: MasterReadMeta | null;
  overviewSchemaInvalid: boolean;
  revenue: RevenueData | null;
  revenueMeta: MasterReadMeta | null;
  revenueSchemaInvalid: boolean;
  timeSeries: TimeSeriesResponse | null;
  timeSeriesMeta: MasterReadMeta | null;
  timeSeriesSchemaInvalid: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMasterDashboard(): MasterDashboardData {
  const overview = useMasterRead({
    widget: 'dashboard.overview',
    queryKey: ['master-analytics-overview-v2'],
    queryFn: () => callMasterApiRaw('master-analytics', 'GET', 'overview'),
    dataSchema: AnalyticsOverviewSchema,
    options: { staleTime: 30_000, gcTime: 60_000 },
  });

  const revenue = useMasterRead({
    widget: 'dashboard.revenue',
    queryKey: ['master-analytics-revenue-v2'],
    queryFn: () => callMasterApiRaw('master-analytics', 'GET', 'revenue'),
    dataSchema: RevenueSchema,
    options: { staleTime: 30_000, gcTime: 60_000 },
  });

  const timeSeries = useMasterRead({
    widget: 'dashboard.timeseries',
    queryKey: ['master-analytics-timeseries-v2'],
    queryFn: () => callMasterApiRaw('master-analytics', 'GET', 'timeseries?period=monthly'),
    dataSchema: TimeSeriesResponseSchema,
    options: { staleTime: 60_000, gcTime: 120_000 },
  });

  return {
    overview: overview.data,
    overviewMeta: overview.meta,
    overviewSchemaInvalid: overview.schemaInvalid,
    revenue: revenue.data,
    revenueMeta: revenue.meta,
    revenueSchemaInvalid: revenue.schemaInvalid,
    timeSeries: timeSeries.data,
    timeSeriesMeta: timeSeries.meta,
    timeSeriesSchemaInvalid: timeSeries.schemaInvalid,
    isLoading: overview.isLoading || revenue.isLoading || timeSeries.isLoading,
    error: overview.error?.message || revenue.error?.message || timeSeries.error?.message || null,
    refetch: () => {
      overview.refetch();
      revenue.refetch();
      timeSeries.refetch();
    },
  };
}
