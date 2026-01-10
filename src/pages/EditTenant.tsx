import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { tenantsApi, TenantDetail } from '@/services/masterApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Building2,
  CreditCard,
  Settings,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  slug: string;
}

export default function EditTenant() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    plan_type: 'basic',
    trial_enabled: false,
    trial_days: 7,
  });

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const result = await tenantsApi.get(id!);
      return result.data;
    },
    enabled: !!id,
  });

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

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        subdomain: tenant.slug || tenant.subdomain || '',
        plan_type: tenant.plan_type || 'basic',
        trial_enabled: tenant.trial_enabled || false,
        trial_days: tenant.trial_days || 7,
      });
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await tenantsApi.update(id!, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Tenant atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate(`/tenants/${id}`);
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
    });
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

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Tenant não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/tenants')}>
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Editar Tenant"
        description={`Editando: ${tenant.name}`}
        icon={Building2}
        actions={
          <Button variant="outline" onClick={() => navigate(`/tenants/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        }
      />

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
                  <span className="text-muted-foreground ml-2">.uopa.com.br</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plano e Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Plano e Assinatura
            </CardTitle>
            <CardDescription>Configurações de plano e cobrança</CardDescription>
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

        {/* Info do Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações Adicionais
            </CardTitle>
            <CardDescription>Dados somente leitura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono">{tenant.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className={tenant.is_active ? 'text-success' : 'text-destructive'}>
                  {tenant.is_active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Stripe Customer</p>
                <p className="font-mono text-xs">{tenant.stripe_customer_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status Assinatura</p>
                <p>{tenant.subscription_status || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/tenants/${id}`)}
          >
            Cancelar
          </Button>
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
    </DashboardLayout>
  );
}
