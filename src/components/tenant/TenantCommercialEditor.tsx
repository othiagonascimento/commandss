import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tenantsApi, TenantDetail } from '@/services/masterApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Loader2,
  Building2,
  CreditCard,
  DollarSign,
  Calculator,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  slug: string;
}

interface TenantCommercialEditorProps {
  tenant: TenantDetail & {
    price_per_user?: number;
    contracted_users?: number;
    channel_price?: number;
    extra_channels?: number;
    discount_type?: string;
    discount_value?: number;
    implementation_fee?: number;
    implementation_status?: string;
    implementation_paid_externally?: boolean;
    has_monthly_fee?: boolean;
  };
}

interface FormData {
  name: string;
  subdomain: string;
  plan_type: string;
  trial_enabled: boolean;
  trial_days: number;
  price_per_user: number;
  contracted_users: number;
  channel_price: number;
  extra_channels: number;
  discount_type: string;
  discount_value: number;
  implementation_fee: number;
  implementation_status: string;
  implementation_paid_externally: boolean;
  has_monthly_fee: boolean;
}

export function TenantCommercialEditor({ tenant }: TenantCommercialEditorProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    name: tenant.name || '',
    subdomain: tenant.slug || '',
    plan_type: tenant.plan_type || 'basic',
    trial_enabled: tenant.trial_enabled || false,
    trial_days: tenant.trial_days || 7,
    price_per_user: tenant.price_per_user ?? 69.90,
    contracted_users: tenant.contracted_users ?? 1,
    channel_price: tenant.channel_price ?? 0,
    extra_channels: tenant.extra_channels ?? 0,
    discount_type: tenant.discount_type || '',
    discount_value: tenant.discount_value ?? 0,
    implementation_fee: tenant.implementation_fee ?? 0,
    implementation_status: tenant.implementation_status || 'pending',
    implementation_paid_externally: tenant.implementation_paid_externally || false,
    has_monthly_fee: tenant.has_monthly_fee ?? true,
  });

  useEffect(() => {
    setFormData({
      name: tenant.name || '',
      subdomain: tenant.slug || '',
      plan_type: tenant.plan_type || 'basic',
      trial_enabled: tenant.trial_enabled || false,
      trial_days: tenant.trial_days || 7,
      price_per_user: tenant.price_per_user ?? 69.90,
      contracted_users: tenant.contracted_users ?? 1,
      channel_price: tenant.channel_price ?? 0,
      extra_channels: tenant.extra_channels ?? 0,
      discount_type: tenant.discount_type || '',
      discount_value: tenant.discount_value ?? 0,
      implementation_fee: tenant.implementation_fee ?? 0,
      implementation_status: tenant.implementation_status || 'pending',
      implementation_paid_externally: tenant.implementation_paid_externally || false,
      has_monthly_fee: tenant.has_monthly_fee ?? true,
    });
  }, [tenant]);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Plan[];
    },
  });

  const calculatedMRR = useMemo(() => {
    if (!formData.has_monthly_fee) return 0;
    
    const userRevenue = formData.price_per_user * formData.contracted_users;
    const channelRevenue = formData.channel_price * formData.extra_channels;
    let total = userRevenue + channelRevenue;

    if (formData.discount_type === 'percent' && formData.discount_value > 0) {
      total = total * (1 - formData.discount_value / 100);
    } else if (formData.discount_type === 'fixed' && formData.discount_value > 0) {
      total = Math.max(0, total - formData.discount_value);
    }

    return total;
  }, [formData.price_per_user, formData.contracted_users, formData.channel_price, formData.extra_channels, formData.discount_type, formData.discount_value, formData.has_monthly_fee]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await tenantsApi.update(tenant.id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Dados comerciais atualizados!');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + (error as Error).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      subdomain: formData.subdomain,
      plan_type: formData.plan_type,
      trial_enabled: formData.trial_enabled,
      trial_days: formData.trial_days,
      price_per_user: formData.price_per_user,
      contracted_users: formData.contracted_users,
      channel_price: formData.channel_price,
      extra_channels: formData.extra_channels,
      discount_type: formData.discount_type || null,
      discount_value: formData.discount_value || null,
      implementation_fee: formData.implementation_fee,
      implementation_status: formData.implementation_status,
      implementation_paid_externally: formData.implementation_paid_externally,
      has_monthly_fee: formData.has_monthly_fee,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>Dados principais do tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomínio *</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="minha-empresa"
                  required
                />
                <span className="text-muted-foreground ml-2 text-sm">.uopa.com.br</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plano e Tipo de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plano e Tipo de Acesso
          </CardTitle>
          <CardDescription>Nível de implementação e módulos disponíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Plano</Label>
              <Select
                value={formData.plan_type}
                onValueChange={(v) => setFormData({ ...formData, plan_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define os módulos e recursos disponíveis
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Trial Habilitado</Label>
              <p className="text-sm text-muted-foreground">Permitir período de teste gratuito</p>
            </div>
            <Switch
              checked={formData.trial_enabled}
              onCheckedChange={(v) => setFormData({ ...formData, trial_enabled: v })}
            />
          </div>

          {formData.trial_enabled && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label htmlFor="trial_days">Dias de Trial</Label>
              <Input
                id="trial_days"
                type="number"
                min={1}
                max={90}
                value={formData.trial_days}
                onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 7 })}
                className="w-32"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Precificação Negociada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Precificação Negociada
          </CardTitle>
          <CardDescription>Valores acordados com o cliente na negociação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monthly Fee Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Cobra Mensalidade?
                {!formData.has_monthly_fee && (
                  <Badge variant="secondary">Parceria/Lifetime</Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.has_monthly_fee 
                  ? 'Cliente paga mensalidade recorrente' 
                  : 'Acesso sem cobrança mensal (parceria, lifetime, etc.)'}
              </p>
            </div>
            <Switch
              checked={formData.has_monthly_fee}
              onCheckedChange={(v) => setFormData({ ...formData, has_monthly_fee: v })}
            />
          </div>

          {formData.has_monthly_fee && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_user">Preço por Usuário (R$)</Label>
                  <Input
                    id="price_per_user"
                    type="number"
                    step="0.01"
                    min={0}
                    value={formData.price_per_user}
                    onChange={(e) => setFormData({ ...formData, price_per_user: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Valor cobrado por usuário contratado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contracted_users">Usuários Contratados</Label>
                  <Input
                    id="contracted_users"
                    type="number"
                    min={1}
                    value={formData.contracted_users}
                    onChange={(e) => setFormData({ ...formData, contracted_users: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">Quantidade de licenças contratadas</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channel_price">Preço por Canal Extra (R$)</Label>
                  <Input
                    id="channel_price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={formData.channel_price}
                    onChange={(e) => setFormData({ ...formData, channel_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_channels">Canais Extras</Label>
                  <Input
                    id="extra_channels"
                    type="number"
                    min={0}
                    value={formData.extra_channels}
                    onChange={(e) => setFormData({ ...formData, extra_channels: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum desconto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="percent">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.discount_type && (
                  <div className="space-y-2">
                    <Label htmlFor="discount_value">
                      Valor do Desconto {formData.discount_type === 'percent' ? '(%)' : '(R$)'}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step={formData.discount_type === 'percent' ? '1' : '0.01'}
                      min={0}
                      max={formData.discount_type === 'percent' ? 100 : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* MRR Preview */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">MRR Calculado</span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(calculatedMRR)}
            </p>
            {formData.has_monthly_fee && (
              <p className="text-xs text-muted-foreground mt-2">
                ({formatCurrency(formData.price_per_user)} × {formData.contracted_users} usuário{formData.contracted_users > 1 ? 's' : ''})
                {formData.extra_channels > 0 && (
                  <> + ({formatCurrency(formData.channel_price)} × {formData.extra_channels} canal{formData.extra_channels > 1 ? 'is' : ''})</>
                )}
                {formData.discount_type && formData.discount_value > 0 && (
                  <> - {formData.discount_type === 'percent' ? `${formData.discount_value}%` : formatCurrency(formData.discount_value)}</>
                )}
              </p>
            )}
            {!formData.has_monthly_fee && (
              <p className="text-xs text-muted-foreground mt-2">
                Este tenant não paga mensalidade recorrente
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Implementação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Implementação (Receita Única)
          </CardTitle>
          <CardDescription>Taxa de implementação e configuração inicial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="implementation_fee">Valor da Implementação (R$)</Label>
              <Input
                id="implementation_fee"
                type="number"
                step="0.01"
                min={0}
                value={formData.implementation_fee}
                onChange={(e) => setFormData({ ...formData, implementation_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status do Pagamento</Label>
              <Select
                value={formData.implementation_status}
                onValueChange={(v) => setFormData({ ...formData, implementation_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="exempt">Isento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div className="space-y-0.5">
              <Label>Pago Externamente?</Label>
              <p className="text-sm text-muted-foreground">
                Pagamento realizado fora do sistema (transferência, boleto externo, etc.)
              </p>
            </div>
            <Switch
              checked={formData.implementation_paid_externally}
              onCheckedChange={(v) => setFormData({ ...formData, implementation_paid_externally: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
