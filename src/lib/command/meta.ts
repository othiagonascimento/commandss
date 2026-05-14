import { supabase } from '@/integrations/supabase/client';

export interface Division {
  id: string;
  slug: string;
  name: string;
  layer: string;
  description: string | null;
  manual: string | null;
  default_model: string | null;
  enabled: boolean;
  metrics: Record<string, unknown> | null;
  updated_at: string;
}

export interface Tool {
  id: string;
  tool_name: string;
  domain: string;
  risk_level: 'read' | 'write_low' | 'write_high' | 'destructive';
  required_scopes: string[] | null;
  description: string | null;
  input_schema: Record<string, unknown> | null;
  enabled: boolean;
  updated_at: string;
}

export async function fetchCommandMeta(): Promise<{ divisions: Division[]; tools: Tool[] }> {
  const { data, error } = await supabase.functions.invoke('command-meta', { method: 'GET' });
  if (error) throw error;
  return {
    divisions: (data?.divisions ?? []) as Division[],
    tools: (data?.tools ?? []) as Tool[],
  };
}

export const LAYERS = [
  { slug: 'canais', name: 'Canais', desc: 'WhatsApp, Instagram, webhooks, e-mail' },
  { slug: 'inteligencia', name: 'Inteligência', desc: 'IA, RAG, prompts, modelos, copilot' },
  { slug: 'operacao', name: 'Operação', desc: 'Funil, automações, SLAs, atividade' },
  { slug: 'dados', name: 'Dados', desc: 'Schema, qualidade, RLS, performance' },
  { slug: 'monetizacao', name: 'Monetização', desc: 'Billing, MRR, quotas, Stripe, Pay' },
  { slug: 'infra', name: 'Infraestrutura', desc: 'Edge fns, DB, jobs, storage, cache' },
] as const;

export type LayerSlug = typeof LAYERS[number]['slug'];
