/**
 * Command AI — Agents catalog + stats.
 * Lê o catálogo global (8 agentes) e agrega métricas de runs por agente.
 */
import { commandDb } from './db';
import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string | null;
  avatar_emoji: string | null;
  avatar_url: string | null;
  color_hex: string;
  model: string | null;
  provider: string | null;
  model_id: string | null;
  system_prompt: string | null;
  capabilities: string[] | Record<string, unknown> | null;
  is_active: boolean;
  is_global: boolean;
  sort_order: number;
}

export interface AvailableModel {
  provider: string;
  model_id: string;
  display_name: string;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  supports_tools: boolean;
}

export interface AgentStats {
  agent_id: string;
  total_runs: number;
  completed: number;
  failed: number;
  in_flight: number;
  avg_duration_ms: number | null;
  total_tokens: number;
  total_cost_usd: number;
  last_run_at: string | null;
}

export async function listAgents(): Promise<Agent[]> {
  const { data, error } = await commandDb
    .from('agents')
    .select(
      'id,slug,name,role,description,avatar_emoji,avatar_url,color_hex,model,provider,model_id,system_prompt,capabilities,is_active,is_global,sort_order',
    )
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Agent[];
}

export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  const { data, error } = await commandDb
    .from('agents')
    .select(
      'id,slug,name,role,description,avatar_emoji,avatar_url,color_hex,model,provider,model_id,system_prompt,capabilities,is_active,is_global,sort_order',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Agent) ?? null;
}

/** Catálogo de modelos disponíveis (com tool-calling) — alimenta o seletor por agente. */
export async function listAvailableModels(): Promise<AvailableModel[]> {
  const { data, error } = await supabase
    .from('ai_available_models')
    .select('provider,model_id,display_name,cost_per_1k_input,cost_per_1k_output,supports_tools')
    .eq('is_active', true)
    .eq('supports_tools', true)
    .order('provider', { ascending: true })
    .order('model_id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AvailableModel[];
}

/** Persiste provider+model_id (e o legado `model = provider/model_id`) em command_ai.agents. */
export async function updateAgentModel(agentId: string, provider: string, modelId: string) {
  const { error } = await commandDb
    .from('agents')
    .update({ provider, model_id: modelId, model: `${provider}/${modelId}` })
    .eq('id', agentId);
  if (error) throw error;
}

interface RunRow {
  agent_id: string;
  status: string;
  duration_ms: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  started_at: string;
}

export async function getAgentsStats(workspaceId?: string | null): Promise<Map<string, AgentStats>> {
  let q = commandDb
    .from('agent_runs')
    .select('agent_id,status,duration_ms,tokens_in,tokens_out,cost_usd,started_at')
    .order('started_at', { ascending: false })
    .limit(1000);
  if (workspaceId) q = q.eq('workspace_id', workspaceId);
  const { data, error } = await q;
  if (error) throw error;

  const map = new Map<string, AgentStats>();
  for (const r of (data ?? []) as RunRow[]) {
    const s =
      map.get(r.agent_id) ??
      ({
        agent_id: r.agent_id,
        total_runs: 0,
        completed: 0,
        failed: 0,
        in_flight: 0,
        avg_duration_ms: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        last_run_at: null,
      } as AgentStats);
    s.total_runs += 1;
    if (r.status === 'completed') s.completed += 1;
    else if (r.status === 'failed') s.failed += 1;
    else if (r.status === 'thinking' || r.status === 'acting' || r.status === 'waiting_approval')
      s.in_flight += 1;
    s.total_tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
    s.total_cost_usd += Number(r.cost_usd ?? 0);
    if (!s.last_run_at || r.started_at > s.last_run_at) s.last_run_at = r.started_at;
    // running average via accumulator stored in avg_duration_ms (only completed)
    if (r.duration_ms != null && r.status === 'completed') {
      const prev = s.avg_duration_ms ?? 0;
      const n = s.completed;
      s.avg_duration_ms = (prev * (n - 1) + r.duration_ms) / n;
    }
    map.set(r.agent_id, s);
  }
  return map;
}

export async function getAgentRecentRuns(agentId: string, limit = 12) {
  const { data, error } = await commandDb
    .from('agent_runs')
    .select('id,status,input,started_at,duration_ms,tokens_in,tokens_out,cost_usd')
    .eq('agent_id', agentId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
