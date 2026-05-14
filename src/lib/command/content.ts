import { supabase } from '@/integrations/supabase/client';

export async function generateContent(input: {
  workspace_id: string;
  brief: string;
  channel?: string;
  format?: string;
  title?: string;
  with_image?: boolean;
}): Promise<{ content_item_id: string; variants: number; has_image: boolean }> {
  const { data, error } = await supabase.functions.invoke('command-content-generate', {
    body: input,
  });
  if (error) throw error;
  if (!data?.content_item_id) throw new Error('content_item_id ausente');
  return data;
}
