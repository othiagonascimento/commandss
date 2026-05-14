/**
 * Command AI — disparador de runs de agente.
 * Chama a edge function `command-agent-run` e retorna o run_id.
 */
import { supabase } from '@/integrations/supabase/client';

export interface StartRunInput {
  agent_slug: string;
  workspace_id: string;
  input: string;
  context?: Record<string, unknown>;
  model?: string;
}

export async function startAgentRun(p: StartRunInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('command-agent-run', {
    body: p,
  });
  if (error) throw error;
  if (!data?.run_id) throw new Error('run_id ausente na resposta');
  return data.run_id as string;
}
