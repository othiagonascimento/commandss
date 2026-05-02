import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  DollarSign, 
  RefreshCw, 
  Plus, 
  Pencil,
  TrendingUp,
  Cpu,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostConfig {
  id: string;
  provider: string;
  model: string;
  operation: string;
  display_name: string | null;
  input_cost_per_1m_usd: number;
  output_cost_per_1m_usd: number;
  audio_cost_per_minute_usd: number;
  image_cost_per_unit_usd: number;
  usd_to_brl_rate: number;
  markup_percent: number;
  is_active: boolean;
  updated_at: string;
  layer_category?: 'layer_1' | 'layer_2' | 'layer_3' | null;
}

const PROVIDERS = ['openai', 'anthropic', 'google'];
const OPERATIONS = ['chat', 'embedding', 'transcription', 'image'];

export default function APICosts() {
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<CostConfig | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [globalRate, setGlobalRate] = useState<string>('5.50');
  const [globalMarkup, setGlobalMarkup] = useState<string>('0');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['api-cost-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_cost_config')
        .select('*')
        .order('provider', { ascending: true })
        .order('model', { ascending: true });
      if (error) throw error;
      return data as CostConfig[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (config: Partial<CostConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('api_cost_config')
        .update({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cost-config'] });
      toast.success('Configuração atualizada');
      setEditingConfig(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (config: Omit<CostConfig, 'id' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('api_cost_config')
        .insert(config)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cost-config'] });
      toast.success('Modelo adicionado');
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao adicionar: ' + error.message);
    },
  });

  const updateGlobalSettings = useMutation({
    mutationFn: async ({ rate, markup }: { rate: number; markup: number }) => {
      const { error } = await supabase
        .from('api_cost_config')
        .update({
          usd_to_brl_rate: rate,
          markup_percent: markup,
          updated_at: new Date().toISOString(),
        })
        .gt('id', '00000000-0000-0000-0000-000000000000'); // Update all
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-cost-config'] });
      toast.success('Configurações globais atualizadas');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const toggleActive = async (config: CostConfig) => {
    await updateMutation.mutateAsync({
      id: config.id,
      is_active: !config.is_active,
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number, currency: 'USD' | 'BRL' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const calculateBRLCost = (usdCost: number, rate: number, markup: number) => {
    return usdCost * (1 + markup / 100) * rate;
  };

  // Get summary stats
  const activeModels = configs?.filter(c => c.is_active).length || 0;
  const avgRate = configs?.[0]?.usd_to_brl_rate || 5.50;
  const avgMarkup = configs?.[0]?.markup_percent || 0;

  // Fetch real usage data for context
  const { data: usageContext } = useQuery({
    queryKey: ['api-costs-usage-context'],
    queryFn: async () => {
      const { data: tenantUsage } = await supabase
        .from('tenant_usage')
        .select('ai_tokens_used, messages_sent');
      
      const totalTokens = tenantUsage?.reduce((sum, t) => sum + (t.ai_tokens_used || 0), 0) || 0;
      const totalMessages = tenantUsage?.reduce((sum, t) => sum + (t.messages_sent || 0), 0) || 0;
      
      // Get event count from last 30 days for actual AI usage
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { count: aiEventsCount } = await supabase
        .from('ai_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', cutoff.toISOString());
      
      return { totalTokens, totalMessages, aiEventsCount: aiEventsCount || 0 };
    },
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Custos de API"
        description="Configure os custos por modelo de IA e taxa de conversão"
        icon={DollarSign}
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Modelo
          </Button>
        }
      />

      <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <strong>Contrato legado.</strong> Esta tela edita <code className="font-mono">api_cost_config</code>, que está sendo
        substituída por <code className="font-mono">ai_model_pricing_history</code> (fonte primária do FinOps). Use{' '}
        <a href="/finops/pricing-settings" className="underline font-medium">FinOps → Pricing Settings</a> para o novo histórico
        de preços. Esta página continua funcionando para overrides manuais e taxa USD→BRL.
      </div>

      {/* Global Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Taxa USD → BRL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={globalRate}
                onChange={(e) => setGlobalRate(e.target.value)}
                className="w-24"
              />
              <Button
                size="sm"
                onClick={() => updateGlobalSettings.mutate({ 
                  rate: parseFloat(globalRate), 
                  markup: parseFloat(globalMarkup) 
                })}
                disabled={updateGlobalSettings.isPending}
              >
                <RefreshCw className={cn("h-4 w-4", updateGlobalSettings.isPending && "animate-spin")} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atual: R$ {avgRate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Markup Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="1"
                value={globalMarkup}
                onChange={(e) => setGlobalMarkup(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atual: {avgMarkup}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Modelos Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeModels}</p>
            <p className="text-xs text-muted-foreground">de {configs?.length || 0} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Real Usage Context */}
      {usageContext && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">📊 Consumo Real (Contexto)</CardTitle>
            <CardDescription className="text-xs">Dados reais de uso para referência ao configurar custos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{formatNumber(usageContext.totalTokens)}</p>
                <p className="text-xs text-muted-foreground">Tokens IA usados</p>
              </div>
              <div>
                <p className="text-lg font-bold">{formatNumber(usageContext.totalMessages)}</p>
                <p className="text-xs text-muted-foreground">Mensagens totais</p>
              </div>
              <div>
                <p className="text-lg font-bold">{formatNumber(usageContext.aiEventsCount)}</p>
                <p className="text-xs text-muted-foreground">Eventos IA (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle>Configuração de Custos por Modelo</CardTitle>
          <CardDescription>
            Custos são baseados em preços oficiais das APIs. 1M = 1.000.000 tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Camada</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead className="text-right">Input/1M (USD)</TableHead>
                  <TableHead className="text-right">Output/1M (USD)</TableHead>
                  <TableHead className="text-right">Custo BRL/1M</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs?.map((config) => {
                  const inputBrl = calculateBRLCost(
                    config.input_cost_per_1m_usd,
                    config.usd_to_brl_rate,
                    config.markup_percent
                  );
                  const outputBrl = calculateBRLCost(
                    config.output_cost_per_1m_usd,
                    config.usd_to_brl_rate,
                    config.markup_percent
                  );

                  return (
                    <TableRow key={config.id} className={cn(!config.is_active && 'opacity-50')}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {config.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {config.display_name || config.model}
                      </TableCell>
                      <TableCell>
                        {config.layer_category ? (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'font-medium',
                              config.layer_category === 'layer_1' && 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
                              config.layer_category === 'layer_2' && 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                              config.layer_category === 'layer_3' && 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                            )}
                          >
                            {config.layer_category.replace('layer_', 'Layer ')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {config.operation}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {config.input_cost_per_1m_usd > 0 
                          ? formatCurrency(config.input_cost_per_1m_usd)
                          : config.audio_cost_per_minute_usd > 0
                          ? `${formatCurrency(config.audio_cost_per_minute_usd)}/min`
                          : config.image_cost_per_unit_usd > 0
                          ? `${formatCurrency(config.image_cost_per_unit_usd)}/img`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {config.output_cost_per_1m_usd > 0 
                          ? formatCurrency(config.output_cost_per_1m_usd)
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        {config.input_cost_per_1m_usd > 0 
                          ? `R$ ${inputBrl.toFixed(2)} / R$ ${outputBrl.toFixed(2)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={() => toggleActive(config)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingConfig(config)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Custos - {editingConfig?.display_name || editingConfig?.model}</DialogTitle>
            <DialogDescription>
              Atualize os custos para este modelo de IA
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custo Input (USD/1M tokens)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={editingConfig.input_cost_per_1m_usd}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      input_cost_per_1m_usd: parseFloat(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Output (USD/1M tokens)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={editingConfig.output_cost_per_1m_usd}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      output_cost_per_1m_usd: parseFloat(e.target.value) || 0,
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Áudio (USD/minuto)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={editingConfig.audio_cost_per_minute_usd}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      audio_cost_per_minute_usd: parseFloat(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagem (USD/unidade)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={editingConfig.image_cost_per_unit_usd}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      image_cost_per_unit_usd: parseFloat(e.target.value) || 0,
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taxa USD→BRL</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingConfig.usd_to_brl_rate}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      usd_to_brl_rate: parseFloat(e.target.value) || 5.50,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Markup (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editingConfig.markup_percent}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      markup_percent: parseFloat(e.target.value) || 0,
                    })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => editingConfig && updateMutation.mutate(editingConfig)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <AddModelDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={(config) => createMutation.mutate(config)}
        isLoading={createMutation.isPending}
      />
    </DashboardLayout>
  );
}

interface AddModelDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (config: Omit<CostConfig, 'id' | 'updated_at'>) => void;
  isLoading: boolean;
}

function AddModelDialog({ open, onClose, onAdd, isLoading }: AddModelDialogProps) {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [operation, setOperation] = useState('chat');
  const [inputCost, setInputCost] = useState('0');
  const [outputCost, setOutputCost] = useState('0');

  const handleSubmit = () => {
    if (!model) {
      toast.error('Modelo é obrigatório');
      return;
    }
    onAdd({
      provider,
      model,
      display_name: displayName || model,
      operation,
      input_cost_per_1m_usd: parseFloat(inputCost) || 0,
      output_cost_per_1m_usd: parseFloat(outputCost) || 0,
      audio_cost_per_minute_usd: 0,
      image_cost_per_unit_usd: 0,
      usd_to_brl_rate: 5.50,
      markup_percent: 0,
      is_active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Modelo</DialogTitle>
          <DialogDescription>
            Configure os custos para um novo modelo de IA
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operação</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONS.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>ID do Modelo</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-2024-01-01"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome de Exibição</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="GPT-4o (Jan 2024)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Input (USD/1M tokens)</Label>
              <Input
                type="number"
                step="0.0001"
                value={inputCost}
                onChange={(e) => setInputCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Output (USD/1M tokens)</Label>
              <Input
                type="number"
                step="0.0001"
                value={outputCost}
                onChange={(e) => setOutputCost(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
