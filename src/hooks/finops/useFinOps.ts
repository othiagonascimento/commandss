import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { finopsApi } from '@/services/finopsApi';
import type { FinOpsFilters } from '@/types/finops';

const k = (parts: unknown[]) => parts;

export const useFinOpsOverview = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'overview', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.overview(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsTenants = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'tenants', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.tenants(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsUsers = (filters: FinOpsFilters & { tenant_id?: string }) =>
  useQuery({
    queryKey: k(['finops', 'users', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.users(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsAI = (
  scope: 'models' | 'layers' | 'operations',
  filters: FinOpsFilters,
) =>
  useQuery({
    queryKey: k(['finops', 'ai', scope, filters]),
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
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsMedia = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'media', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.media(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsInfra = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'infra', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.infra(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsInvestor = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'investor', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.investorSummary(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsAnomalies = (filters: FinOpsFilters) =>
  useQuery({
    queryKey: k(['finops', 'anomalies', filters]),
    queryFn: async () => {
      const { data, error } = await finopsApi.anomalies(filters);
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useFinOpsAnomaliesCount = () =>
  useQuery({
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
    staleTime: 60_000,
    retry: false,
  });

export const useFinOpsPricing = () =>
  useQuery({
    queryKey: k(['finops', 'pricing']),
    queryFn: async () => {
      const { data, error } = await finopsApi.pricingList();
      if (error) throw new Error(error);
      return data;
    },
    staleTime: 5 * 60_000,
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
  });
