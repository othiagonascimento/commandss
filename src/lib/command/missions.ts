import { supabase } from '@/integrations/supabase/client';

export async function planMission(input: {
  workspace_id: string;
  objective: string;
  context?: string;
  due_at?: string;
}): Promise<{ mission_id: string; nodes: number; summary: string | null }> {
  const { data, error } = await supabase.functions.invoke('command-mission-plan', {
    body: input,
  });
  if (error) throw error;
  if (!data?.mission_id) throw new Error('mission_id ausente');
  return data;
}
