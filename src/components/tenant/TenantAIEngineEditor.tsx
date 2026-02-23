import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Cpu, Globe, Loader2, Save, Sparkles, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import { featuresApi } from '@/services/masterApi';
import { useGroupedModels } from '@/hooks/useAvailableModels';
import { supabase } from '@/integrations/supabase/client';

interface AIEngineConfig {
  ai_use_global_config: boolean;
  ai_layer_1_model: string | null;
  ai_layer_1_instructions: string | null;
  ai_layer_2_model: string | null;
  ai_layer_2_instructions: string | null;
  ai_layer_3_model: string | null;
  ai_layer_3_instructions: string | null;
}

interface TenantAIEngineEditorProps {
  tenantId: string;
  config: AIEngineConfig;
  isLoading?: boolean;
}

const LAYER_CONFIG = [
  {
    key: 'layer_1',
    name: 'Camada 1 - Router',
    description: 'Modelo rápido para roteamento e tarefas simples',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    category: 'router' as const,
  },
  {
    key: 'layer_2',
    name: 'Camada 2 - Standard',
    description: 'Modelo balanceado para a maioria das conversas',
    icon: Cpu,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    category: 'standard' as const,
  },
  {
    key: 'layer_3',
    name: 'Camada 3 - Elite',
    description: 'Modelo avançado para objeções complexas e fechamento',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    category: 'elite' as const,
  },
];

export function TenantAIEngineEditor({ tenantId, config, isLoading }: TenantAIEngineEditorProps) {
  const queryClient = useQueryClient();
  const { allActive: allModels, grouped: modelsByCategory, isLoading: isLoadingModels } = useGroupedModels();
  
  const [localConfig, setLocalConfig] = useState<AIEngineConfig>({
    ai_use_global_config: config?.ai_use_global_config ?? true,
    ai_layer_1_model: config?.ai_layer_1_model || '',
    ai_layer_1_instructions: config?.ai_layer_1_instructions || '',
    ai_layer_2_model: config?.ai_layer_2_model || '',
    ai_layer_2_instructions: config?.ai_layer_2_instructions || '',
    ai_layer_3_model: config?.ai_layer_3_model || '',
    ai_layer_3_instructions: config?.ai_layer_3_instructions || '',
  });

  // Fetch global AI settings to show what would be inherited
  const { data: globalSettings } = useQuery({
    queryKey: ['global-ai-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_settings')
        .select('ai_layer_1_model, ai_layer_2_model, ai_layer_3_model, ai_layer_1_instructions, ai_layer_2_instructions, ai_layer_3_instructions')
        .eq('key', 'ai_global_engine')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Update local state when config prop changes
  useEffect(() => {
    if (config) {
      setLocalConfig({
        ai_use_global_config: config.ai_use_global_config ?? true,
        ai_layer_1_model: config.ai_layer_1_model || '',
        ai_layer_1_instructions: config.ai_layer_1_instructions || '',
        ai_layer_2_model: config.ai_layer_2_model || '',
        ai_layer_2_instructions: config.ai_layer_2_instructions || '',
        ai_layer_3_model: config.ai_layer_3_model || '',
        ai_layer_3_instructions: config.ai_layer_3_instructions || '',
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AIEngineConfig>) => {
      const result = await featuresApi.update(tenantId, { ai_config: data });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Configuração de IA salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant-features', tenantId] });
    },
    onError: () => {
      toast.error('Erro ao salvar configuração de IA.');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(localConfig);
  };

  const handleToggleGlobal = (checked: boolean) => {
    setLocalConfig(prev => ({ ...prev, ai_use_global_config: checked }));
  };

  const handleLayerChange = (layer: string, field: 'model' | 'instructions', value: string) => {
    const key = `ai_${layer}_${field}` as keyof AIEngineConfig;
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const getModelDisplayName = (modelId: string | null) => {
    if (!modelId) return 'Não definido';
    const allModels = [...modelsByCategory.router, ...modelsByCategory.standard, ...modelsByCategory.elite];
    const found = allModels.find(m => m.model_id === modelId);
    return found ? `${found.display_name} (${found.provider})` : modelId;
  };

  if (isLoading || isLoadingModels) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Motor de IA</CardTitle>
                <CardDescription>
                  Configure os modelos de IA utilizados por este tenant
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Usar Configuração Global</p>
                <p className="text-sm text-muted-foreground">
                  {localConfig.ai_use_global_config 
                    ? 'Este tenant herda as configurações globais do Motor de IA'
                    : 'Este tenant usa configuração personalizada'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {localConfig.ai_use_global_config ? (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  Global
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                  Personalizado
                </Badge>
              )}
              <Switch
                checked={localConfig.ai_use_global_config}
                onCheckedChange={handleToggleGlobal}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Config Preview when using global */}
      {localConfig.ai_use_global_config && globalSettings && (
        <Card className="border-dashed border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-green-600" />
              Configuração Global Herdada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between p-2 rounded bg-background">
                <span className="text-muted-foreground">Camada 1 (Router):</span>
                <span className="font-medium">{getModelDisplayName(globalSettings.ai_layer_1_model)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-background">
                <span className="text-muted-foreground">Camada 2 (Standard):</span>
                <span className="font-medium">{getModelDisplayName(globalSettings.ai_layer_2_model)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-background">
                <span className="text-muted-foreground">Camada 3 (Elite):</span>
                <span className="font-medium">{getModelDisplayName(globalSettings.ai_layer_3_model)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layer Cards */}
      <div className={`space-y-4 ${localConfig.ai_use_global_config ? 'opacity-50 pointer-events-none' : ''}`}>
        {LAYER_CONFIG.map((layer) => {
          const Icon = layer.icon;
          const modelKey = `ai_${layer.key}_model` as keyof AIEngineConfig;
          const instructionsKey = `ai_${layer.key}_instructions` as keyof AIEngineConfig;
          const currentModel = (localConfig[modelKey] as string) || '';
          const currentInstructions = (localConfig[instructionsKey] as string) || '';
          return (
            <Card key={layer.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${layer.bgColor}`}>
                    <Icon className={`h-4 w-4 ${layer.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{layer.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {layer.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select
                    value={currentModel}
                    onValueChange={(value) => handleLayerChange(layer.key, 'model', value)}
                    disabled={localConfig.ai_use_global_config}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {allModels.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          <div className="flex items-center gap-2">
                            <span>{model.display_name}</span>
                            <span className="text-xs text-muted-foreground">({model.provider})</span>
                            <span className="text-[10px] px-1 rounded bg-muted">{model.layer_category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Instruções Adicionais (opcional)</Label>
                  <Textarea
                    value={currentInstructions}
                    onChange={(e) => handleLayerChange(layer.key, 'instructions', e.target.value)}
                    placeholder={`Instruções específicas para a ${layer.name}...`}
                    rows={3}
                    className="text-sm"
                    disabled={localConfig.ai_use_global_config}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {localConfig.ai_use_global_config && (
        <p className="text-sm text-muted-foreground text-center">
          Desative "Usar Configuração Global" para personalizar os modelos de IA deste tenant
        </p>
      )}
    </div>
  );
}