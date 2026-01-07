import { useQuery } from '@tanstack/react-query';
import { analyticsApi, AnalyticsOverview, RevenueData, TimeSeriesResponse } from '@/services/masterApi';

export interface MasterDashboardData {
  overview: AnalyticsOverview | null;
  revenue: RevenueData | null;
  timeSeries: TimeSeriesResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMasterDashboard(): MasterDashboardData {
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['master-analytics-overview'],
    queryFn: async () => {
      const result = await analyticsApi.getOverview();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ['master-analytics-revenue'],
    queryFn: async () => {
      const result = await analyticsApi.getRevenue();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const {
    data: timeSeriesData,
    isLoading: timeSeriesLoading,
    error: timeSeriesError,
    refetch: refetchTimeSeries,
  } = useQuery({
    queryKey: ['master-analytics-timeseries'],
    queryFn: async () => {
      const result = await analyticsApi.getTimeSeries('monthly');
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const refetch = () => {
    refetchOverview();
    refetchRevenue();
    refetchTimeSeries();
  };

  return {
    overview: overviewData || null,
    revenue: revenueData || null,
    timeSeries: timeSeriesData || null,
    isLoading: overviewLoading || revenueLoading || timeSeriesLoading,
    error: overviewError?.message || revenueError?.message || timeSeriesError?.message || null,
    refetch,
  };
}
