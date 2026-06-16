import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  creditsReadApi, creditsAdminApi,
  type CreditsFullSnapshot, type LedgerDay, type ResourceBreakdown,
  type RechargeRow, type CreditRate, type RechargePayload, type UserBalanceRow,
} from '@/services/creditsApi';

const DEFAULTS = { staleTime: 30_000, gcTime: 60_000, refetchOnWindowFocus: false } as const;

export function useTenantCreditsFull(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['credits', 'full', tenantId],
    queryFn: async (): Promise<CreditsFullSnapshot | null> => {
      if (!tenantId) return null;
      const { data, error } = await creditsReadApi.full(tenantId);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!tenantId,
    ...DEFAULTS,
  });
}

export function useCreditLedgerHistory(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['credits', 'ledger', tenantId],
    queryFn: async (): Promise<LedgerDay[]> => {
      if (!tenantId) return [];
      const { data, error } = await creditsReadApi.ledger(tenantId);
      if (error) throw new Error(error);
      return data?.rows ?? [];
    },
    enabled: !!tenantId,
    ...DEFAULTS,
  });
}

export function useCreditByResource(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['credits', 'resources', tenantId],
    queryFn: async (): Promise<ResourceBreakdown[]> => {
      if (!tenantId) return [];
      const { data, error } = await creditsReadApi.resources(tenantId);
      if (error) throw new Error(error);
      return data?.rows ?? [];
    },
    enabled: !!tenantId,
    ...DEFAULTS,
  });
}

export function useRechargeHistory(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['credits', 'recharges', tenantId],
    queryFn: async (): Promise<RechargeRow[]> => {
      if (!tenantId) return [];
      const { data, error } = await creditsReadApi.recharges(tenantId);
      if (error) throw new Error(error);
      return data?.rows ?? [];
    },
    enabled: !!tenantId,
    ...DEFAULTS,
  });
}

export function useCreditRates() {
  return useQuery({
    queryKey: ['credits', 'rates'],
    queryFn: async (): Promise<CreditRate[]> => {
      const { data, error } = await creditsReadApi.rates();
      if (error) throw new Error(error);
      return data?.rows ?? [];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Subscribe a tenant_usage e credit_ledger no Realtime — invalida queries quando muda */
export function useTenantUsageRealtime(tenantId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!tenantId) return;
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['credits', 'full', tenantId] });
      qc.invalidateQueries({ queryKey: ['credits', 'ledger', tenantId] });
      qc.invalidateQueries({ queryKey: ['credits', 'recharges', tenantId] });
    };
    const ch = supabase
      .channel(`credits:${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_usage', filter: `tenant_id=eq.${tenantId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_ledger', filter: `tenant_id=eq.${tenantId}` }, invalidate)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tenantId, qc]);
}

// ---------------- Mutations ----------------

export function useRechargeMutation(tenantId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<RechargePayload, 'tenant_id'>) => {
      if (!tenantId) throw new Error('tenant_id ausente');
      const { data, error } = await creditsAdminApi.recharge({ ...payload, tenant_id: tenantId });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', 'full', tenantId] });
      qc.invalidateQueries({ queryKey: ['credits', 'ledger', tenantId] });
      qc.invalidateQueries({ queryKey: ['credits', 'recharges', tenantId] });
    },
  });
}

export function useReverseMutation(tenantId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { source_ledger_id: string; reason: string; idempotency_key: string }) => {
      const { data, error } = await creditsAdminApi.reverse(vars.source_ledger_id, vars.reason, vars.idempotency_key);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', 'full', tenantId] });
      qc.invalidateQueries({ queryKey: ['credits', 'recharges', tenantId] });
    },
  });
}

export function useSetUserOverrideMutation(tenantId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { user_id: string; monthly_credits_base: number; notes?: string; effective_from?: string }) => {
      if (!tenantId) throw new Error('tenant_id ausente');
      const { data, error } = await creditsAdminApi.setUserOverride({ tenant_id: tenantId, ...vars });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', 'full', tenantId] });
      qc.invalidateQueries({ queryKey: ['tenant-user-credits', tenantId] });
    },
  });
}

export function useClearUserOverrideMutation(tenantId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      if (!tenantId) throw new Error('tenant_id ausente');
      const { data, error } = await creditsAdminApi.clearUserOverride(tenantId, user_id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', 'full', tenantId] });
      qc.invalidateQueries({ queryKey: ['tenant-user-credits', tenantId] });
    },
  });
}

export function useSetTenantBaseMutation(tenantId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credits_per_user: number) => {
      if (!tenantId) throw new Error('tenant_id ausente');
      const { data, error } = await creditsAdminApi.setTenantBase(tenantId, credits_per_user);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits', 'full', tenantId] });
      qc.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
  });
}

export function useUpdateCreditRateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<CreditRate> }) => {
      const { data, error } = await creditsReadApi.updateRate(vars.id, vars.patch);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits', 'rates'] }); },
  });
}
