import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIModel {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  layer_category: string;
  is_active: boolean | null;
  cost_per_1k_tokens: number | null;
  max_context_tokens: number | null;
  created_at?: string | null;
}

export interface GroupedModels {
  router: AIModel[];
  standard: AIModel[];
  elite: AIModel[];
}

export function useAvailableModels() {
  return useQuery({
    queryKey: ['ai-available-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_available_models')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) {
        console.error('Erro ao buscar modelos de IA:', error);
        throw error;
      }
      return data as AIModel[];
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useGroupedModels() {
  const query = useAvailableModels();
  
  const grouped: GroupedModels = {
    router: [],
    standard: [],
    elite: [],
  };
  
  if (query.data) {
    query.data.forEach((model) => {
      if (model.layer_category in grouped) {
        grouped[model.layer_category].push(model);
      }
    });
  }
  
  return {
    ...query,
    grouped,
  };
}
