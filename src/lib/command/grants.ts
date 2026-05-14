/**
 * Command AI — Tenant Grants & Tool Executions helpers.
 * Concessões definem quais scopes o Command AI pode rodar em cada tenant.
 */
import { commandDb } from './db';
import { supabase } from '@/integrations/supabase/client';

export interface TenantGrant {
  id: string;
  workspace_id: string | null;
  target_tenant_id: string;
  scopes: string[];
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  notes: string | null;
}

export interface ToolExecution {
  id: string;
  workspace_id: string | null;
  run_id: string | null;
  agent_id: string | null;
  mission_id: string | null;
  decision_id: string | null;
  target_tenant_id: string | null;
  tool_name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: 'pending' | 'ok' | 'denied' | 'queued_for_decision' | 'error';
  error: string | null;
  duration_ms: number | null;
  executed_at: string;
}

export const ALL_SCOPES = [
  'leads:read',
  'leads:message',
  'products:write',
  'campaigns:write',
] as const;

export async function listGrants(): Promise<TenantGrant[]> {
  const { data, error } = await commandDb
    .from('tenant_grants')
    .select('*')
    .is('revoked_at', null)
    .order('granted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TenantGrant[];
}

export async function listTenantsBasic(): Promise<Array<{ id: string; name: string; subdomain: string | null }>> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, subdomain')
    .eq('status', 'active')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertGrant(input: {
  target_tenant_id: string;
  scopes: string[];
  expires_at?: string | null;
  notes?: string | null;
}) {
  const { data: u } = await supabase.auth.getUser();
  const granted_by = u.user?.id;
  if (!granted_by) throw new Error('not_authenticated');

  const { data: existing } = await commandDb
    .from('tenant_grants')
    .select('id')
    .eq('target_tenant_id', input.target_tenant_id)
    .is('revoked_at', null)
    .maybeSingle();

  if (existing) {
    const { error } = await commandDb
      .from('tenant_grants')
      .update({
        scopes: input.scopes,
        expires_at: input.expires_at ?? null,
        notes: input.notes ?? null,
      })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id as string;
  }

  const { data, error } = await commandDb
    .from('tenant_grants')
    .insert({
      target_tenant_id: input.target_tenant_id,
      scopes: input.scopes,
      granted_by,
      expires_at: input.expires_at ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function revokeGrant(id: string) {
  const { error } = await commandDb
    .from('tenant_grants')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function listRecentExecutions(limit = 25): Promise<ToolExecution[]> {
  const { data, error } = await commandDb
    .from('tool_executions')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ToolExecution[];
}
