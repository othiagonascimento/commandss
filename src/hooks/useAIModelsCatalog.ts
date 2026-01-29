import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIModelCatalog {
  id: string;
  model_id: string;
  display_name: string;
  provider: 'google' | 'openai' | 'anthropic';
  layer_category: 'router' | 'standard' | 'elite';
  is_active: boolean;
  cost_per_1k_tokens: number | null;
  max_context_tokens: number | null;
  created_at: string;
}

export type CreateAIModelInput = Omit<AIModelCatalog, 'id' | 'created_at' | 'is_active'>;
export type UpdateAIModelInput = Partial<CreateAIModelInput> & { id: string };

// List ALL models (active and inactive)
export function useAIModelsCatalog() {
  return useQuery({
    queryKey: ['ai-models-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_available_models')
        .select('*')
        .order('provider')
        .order('display_name');
      if (error) throw error;
      return data as AIModelCatalog[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Create new model
export function useCreateAIModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (model: CreateAIModelInput) => {
      const { data, error } = await supabase
        .from('ai_available_models')
        .insert({
          ...model,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Modelo criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ai-models-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['ai-available-models'] });
    },
    onError: (err: Error) => {
      if (err.message.includes('duplicate key')) {
        toast.error('Já existe um modelo com este ID');
      } else {
        toast.error(`Erro ao criar modelo: ${err.message}`);
      }
    },
  });
}

// Update existing model
export function useUpdateAIModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateAIModelInput) => {
      const { data, error } = await supabase
        .from('ai_available_models')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Modelo atualizado!');
      queryClient.invalidateQueries({ queryKey: ['ai-models-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['ai-available-models'] });
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar modelo: ${err.message}`),
  });
}

// Toggle is_active
export function useToggleAIModelActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('ai_available_models')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.is_active ? 'Modelo ativado!' : 'Modelo desativado!');
      queryClient.invalidateQueries({ queryKey: ['ai-models-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['ai-available-models'] });
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar status: ${err.message}`),
  });
}

// Delete model
export function useDeleteAIModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_available_models')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Modelo excluído!');
      queryClient.invalidateQueries({ queryKey: ['ai-models-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['ai-available-models'] });
    },
    onError: (err: Error) => toast.error(`Erro ao excluir modelo: ${err.message}`),
  });
}
