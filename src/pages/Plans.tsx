import { useState } from 'react';
import { safeArray } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { moduleConfig, categoryColors, groupModulesByCategory } from '@/lib/modules';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_leads: number | null;
  max_products: number | null;
  max_channels: number;
  max_storage_gb: number;
  max_ai_tokens: number;
  max_messages_month: number | null;
  max_automations: number | null;
  features_enabled: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

const defaultPlan: Partial<Plan> = {
  name: '',
  slug: '',
  description: '',
  is_active: true,
  is_default: false,
  price_monthly: 0,
  price_yearly: 0,
  features_enabled: [],
  display_order: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function Plans() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Plan[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (plan: Partial<Plan>) => {
      const { id, created_at, updated_at, ...planData } = plan as Plan;
      if (id) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(planData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Plano salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast.error('Erro ao salvar plano: ' + error.message);
    },
  });

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan({ ...defaultPlan });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPlan?.name || !editingPlan?.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }
    saveMutation.mutate(editingPlan);
  };

  const toggleFeature = (feature: string) => {
    if (!editingPlan) return;
    const current = safeArray<string>(editingPlan.features_enabled);
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature];
    setEditingPlan({ ...editingPlan, features_enabled: updated });
  };

  const groupedModules = groupModulesByCategory();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">Defina quais módulos cada plano inclui</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans?.map((plan) => {
          const enabledModules = safeArray<string>(plan.features_enabled);
          return (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.is_default && (
                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                  {plan.price_yearly > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ou R$ {plan.price_yearly.toFixed(2).replace('.', ',')}/ano
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Modules by category */}
                {Object.entries(groupedModules).map(([category, catModules]) => {
                  const included = catModules.filter(m => enabledModules.includes(m.key));
                  if (included.length === 0) return null;
                  return (
                    <div key={category}>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{category}</p>
                      <div className="flex flex-wrap gap-1">
                        {included.map((m) => {
                          const Icon = m.icon;
                          return (
                            <Badge
                              key={m.key}
                              variant="outline"
                              className={`text-xs gap-1 ${categoryColors[category]}`}
                            >
                              <Icon className="w-3 h-3" />
                              {m.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {enabledModules.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Nenhum módulo habilitado</p>
                )}

                {!plan.is_active && (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>O plano define quais módulos estão incluídos. Limites numéricos são configurados por tenant.</DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      name: e.target.value,
                      slug: editingPlan.id ? editingPlan.slug : slugify(e.target.value),
                    })}
                    placeholder="Pro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={editingPlan.slug}
                    onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                    placeholder="pro"
                    disabled={!!editingPlan.id}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Recursos avançados para escalar"
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_monthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Anual (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_yearly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_yearly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Modules by category */}
              <div>
                <h4 className="font-medium mb-3">Módulos Incluídos no Plano</h4>
                <div className="space-y-4">
                  {Object.entries(groupedModules).map(([category, catModules]) => (
                    <div key={category} className="space-y-2">
                      <Badge variant="outline" className={categoryColors[category]}>
                        {category}
                      </Badge>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {catModules.map((module) => {
                          const isEnabled = safeArray<string>(editingPlan.features_enabled).includes(module.key);
                          const Icon = module.icon;
                          return (
                            <div
                              key={module.key}
                              onClick={() => toggleFeature(module.key)}
                              className={`
                                p-3 rounded-lg border cursor-pointer transition-all
                                ${isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`
                                  w-5 h-5 rounded flex items-center justify-center
                                  ${isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                                `}>
                                  {isEnabled && <Check className="w-3 h-3" />}
                                </div>
                                <Icon className={`w-4 h-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div>
                                  <p className="text-sm font-medium">{module.label}</p>
                                  <p className="text-xs text-muted-foreground">{module.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.is_active}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.is_default}
                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_default: checked })}
                  />
                  <Label>Plano Padrão</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Ordem:</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={editingPlan.display_order}
                    onChange={(e) => setEditingPlan({ ...editingPlan, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
