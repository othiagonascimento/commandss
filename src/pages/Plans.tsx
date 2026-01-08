import { useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Users, 
  Database, 
  MessageSquare, 
  Cpu, 
  HardDrive,
  Zap,
  Infinity,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

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
  max_users: 1,
  max_leads: null,
  max_products: null,
  max_channels: 1,
  max_storage_gb: 5,
  max_ai_tokens: 100000,
  max_messages_month: null,
  max_automations: null,
  features_enabled: [],
  display_order: 0,
};

const availableFeatures = [
  { slug: 'crm', label: 'CRM', description: 'Gestão de leads e contatos' },
  { slug: 'leads', label: 'Leads', description: 'Captura e qualificação' },
  { slug: 'catalog', label: 'Catálogo', description: 'Produtos e serviços' },
  { slug: 'automations', label: 'Automações', description: 'Fluxos automáticos' },
  { slug: 'whatsapp', label: 'WhatsApp', description: 'Integração oficial' },
  { slug: 'ai_assistant', label: 'IA Assistente', description: 'Uôpa AI' },
  { slug: 'branding', label: 'Branding', description: 'Personalização visual' },
  { slug: 'api_access', label: 'API', description: 'Acesso à API' },
  { slug: 'custom_domain', label: 'Domínio Próprio', description: 'Site público' },
  { slug: 'priority_support', label: 'Suporte Prioritário', description: 'Atendimento VIP' },
  { slug: 'dedicated_success', label: 'CS Dedicado', description: 'Customer Success' },
];

function formatLimit(value: number | null): string {
  if (value === null || value === -1) return '∞';
  return value.toLocaleString('pt-BR');
}

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
    const current = editingPlan.features_enabled || [];
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature];
    setEditingPlan({ ...editingPlan, features_enabled: updated });
  };

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
          <p className="text-muted-foreground">Gerencie os planos e limites da plataforma</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans?.map((plan) => (
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Limits */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{formatLimit(plan.max_users)} usuários</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span>{formatLimit(plan.max_leads)} leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span>{plan.max_channels} canais</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <span>{formatLimit(plan.max_ai_tokens)} tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span>{plan.max_storage_gb} GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span>{formatLimit(plan.max_automations)} fluxos</span>
                </div>
              </div>

              {/* Features */}
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Features:</p>
                <div className="flex flex-wrap gap-1">
                  {(plan.features_enabled as string[])?.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {availableFeatures.find(f => f.slug === feature)?.label || feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {!plan.is_active && (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Limites</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead className="text-center">Usuários</TableHead>
                <TableHead className="text-center">Leads</TableHead>
                <TableHead className="text-center">Produtos</TableHead>
                <TableHead className="text-center">Canais</TableHead>
                <TableHead className="text-center">Storage</TableHead>
                <TableHead className="text-center">Tokens IA</TableHead>
                <TableHead className="text-center">Mensagens/mês</TableHead>
                <TableHead className="text-center">Automações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="text-center">{formatLimit(plan.max_users)}</TableCell>
                  <TableCell className="text-center">{formatLimit(plan.max_leads)}</TableCell>
                  <TableCell className="text-center">{formatLimit(plan.max_products)}</TableCell>
                  <TableCell className="text-center">{plan.max_channels}</TableCell>
                  <TableCell className="text-center">{plan.max_storage_gb} GB</TableCell>
                  <TableCell className="text-center">{formatLimit(plan.max_ai_tokens)}</TableCell>
                  <TableCell className="text-center">{formatLimit(plan.max_messages_month)}</TableCell>
                  <TableCell className="text-center">{formatLimit(plan.max_automations)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>Configure os detalhes e limites do plano</DialogDescription>
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

              {/* Limits */}
              <div>
                <h4 className="font-medium mb-3">Limites</h4>
                <p className="text-xs text-muted-foreground mb-3">Use -1 ou deixe vazio para ilimitado</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Usuários</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_users ?? ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_users: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Leads</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_leads ?? ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_leads: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Produtos</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_products ?? ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_products: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Canais</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_channels}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_channels: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage (GB)</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_storage_gb}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_storage_gb: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tokens IA</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_ai_tokens}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_ai_tokens: parseInt(e.target.value) || 100000 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Msgs/mês</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_messages_month ?? ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_messages_month: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Automações</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_automations ?? ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_automations: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-medium mb-3">Features Habilitadas</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableFeatures.map((feature) => {
                    const isEnabled = editingPlan.features_enabled?.includes(feature.slug);
                    return (
                      <div
                        key={feature.slug}
                        onClick={() => toggleFeature(feature.slug)}
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
                          <div>
                            <p className="text-sm font-medium">{feature.label}</p>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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