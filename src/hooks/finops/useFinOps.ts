import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { finopsApi } from '@/services/finopsApi';
import type { FinOpsFilters } from '@/types/finops';

const k = (parts: unknown[]) => parts;

// Normalize filter object into a stable cache key fragment.
// Using only `month` (or start/end) lets multiple FinOps pages share the same overview cache.
const periodKey = (f: FinOpsFilters) => f.month ?? `${f.start_date ?? ''}_${f.end_date ?? ''}`;

const HEAVY_QUERY_DEFAULTS = {
  staleTime: 120_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
} as const;

export const useFinOpsOverview = (filters: FinOpsFilters) =>
  useQuery({
    // Period-only key → Overview, Investor and AI pages share the same fetch
    queryKey: k(['finops', 'overview', periodKey(filters)]),
    queryFn: async () => {
      const { data, error } = await finopsApi.overview(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

export const useFinOpsTenants = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'tenants', periodKey(filters)]),
    queryFn: async () => {
      const { data, error } = await finopsApi.tenants(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

export const useFinOpsUsers = (filters: FinOpsFilters & { tenant_id?: string }) =>
  useQuery({
    queryKey: k(['finops', 'users', periodKey(filters), filters.tenant_id ?? null]),
    queryFn: async () => {
      const { data, error } = await finopsApi.users(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

export const useFinOpsAI = (
  scope: 'models' | 'layers' | 'operations',
  filters: FinOpsFilters,
) =>
  useQuery({
    queryKey: k(['finops', 'ai', scope, periodKey(filters)]),
    queryFn: async () => {
      const fn =
        scope === 'models'
          ? finopsApi.aiModels
          : scope === 'layers'
            ? finopsApi.aiLayers
            : finopsApi.aiOperations;
      const { data, error } = await fn(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

export const useFinOpsMedia = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'media', periodKey(filters)]),
    queryFn: async () => {
      const { data, error } = await finopsApi.media(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

export const useFinOpsInfra = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'infra', periodKey(filters)]),
    queryFn: async () => {
      const { data, error } = await finopsApi.infra(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useFinOpsInvestor = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'investor', periodKey(filters)]),
    queryFn: async () => {
      const { data, error } = await finopsApi.investorSummary(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

export const useFinOpsAnomalies = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'anomalies', periodKey(filters)]),
    queryFn: async () => {
      const { data, error } = await finopsApi.anomalies(filters);
      if (error) throw new Error(error);
      return data;
    },
    ...HEAVY_QUERY_DEFAULTS,
  });

/**
 * Anomaly badge counter. Only polls while the user is inside /finops to avoid
 * background traffic on every page navigation across the Master panel.
 */
export const useFinOpsAnomaliesCount = () => {
  const { pathname } = useLocation();
  const enabled = pathname.startsWith('/finops');
  return useQuery({
    queryKey: k(['finops', 'anomalies-count']),
    queryFn: async () => {
      const { data, error } = await finopsApi.anomalies({});
      if (error) return { critical: 0, total: 0 };
      const rows = data?.rows ?? [];
      return {
        total: rows.length,
        critical: rows.filter((r) => r.severity === 'critical' || r.severity === 'high').length,
      };
    },
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    retry: false,
    enabled,
  });
};

export const useFinOpsPricing = () =>
  useQuery({
    queryKey: k(['finops', 'pricing']),
    queryFn: async () => {
      const { data, error } = await finopsApi.pricingList();
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

export const useFinOpsBudgets = () =>
  useQuery({
    queryKey: k(['finops', 'budgets']),
    queryFn: async () => {
      const { data, error } = await finopsApi.budgetsList();
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
