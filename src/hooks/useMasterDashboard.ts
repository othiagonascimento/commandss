import { useQuery } from '@tanstack/react-query';
import { analyticsApi, AnalyticsOverview, RevenueData } from '@/services/masterApi';

export interface MasterDashboardData {
  overview: AnalyticsOverview | null;
  revenue: RevenueData | null;
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
    refetchInterval: 30000, // Refresh every 30 seconds
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

  const refetch = () => {
    refetchOverview();
    refetchRevenue();
  };

  return {
    overview: overviewData || null,
    revenue: revenueData || null,
    isLoading: overviewLoading || revenueLoading,
    error: overviewError?.message || revenueError?.message || null,
    refetch,
  };
}
