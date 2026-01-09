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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
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
