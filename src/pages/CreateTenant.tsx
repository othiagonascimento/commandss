import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tenantsApi, CreateTenantPayload } from '@/services/masterApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Building2, AlertCircle, Gift, Handshake, Crown, Check, Users, Database, Cpu, HardDrive, Brain, Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  max_users: number;
  max_leads: number | null;
  max_channels: number;
  max_storage_gb: number;
  max_ai_tokens: number;
  features_enabled: string[];
}

interface NicheTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

const promoTypes = [
  { value: 'trial', label: 'Trial Normal', description: 'Período de teste padrão' },
  { value: 'partnership', label: 'Parceria', description: 'Acesso gratuito por parceria comercial' },
  { value: 'lifetime', label: 'Acesso Vitalício', description: 'Sem data de expiração' },
] as const;

const createTenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  plan_id: z.string().uuid('Selecione um plano'),
  template_id: z.string().optional(),
  promo_enabled: z.boolean().optional(),
  promo_type: z.enum(['trial', 'partnership', 'lifetime']).optional(),
  promo_days: z.number().min(1).max(365).optional(),
  promo_reason: z.string().max(500).optional(),
  company_name: z.string().optional(),
  primary_color: z.string().optional(),
  admin_email: z.string().email('Email inválido').optional().or(z.literal('')),
  admin_name: z.string().optional(),
  admin_password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
});

type FormData = z.infer<typeof createTenantSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatLimit(value: number | null): string {
  if (value === null || value === -1) return '∞';
  return value.toLocaleString('pt-BR');
}

export default function CreateTenant() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Plan[];
    },
  });

  // Fetch niche templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['niche-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niche_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as NicheTemplate[];
    },
  });

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    contact_email: '',
    plan_id: '',
    template_id: '',
    promo_enabled: false,
    promo_type: 'trial',
    promo_days: 14,
    promo_reason: '',
    company_name: '',
    primary_color: '#3b82f6',
    admin_email: '',
    admin_name: '',
    admin_password: '',
  });

  // Set default plan when plans load
  if (plans && plans.length > 0 && !formData.plan_id) {
    const defaultPlan = plans.find(p => p.slug === 'basic') || plans[0];
    setFormData(prev => ({ ...prev, plan_id: defaultPlan.id }));
  }

  const selectedPlan = plans?.find(p => p.id === formData.plan_id);
  const selectedTemplate = templates?.find(t => t.id === formData.template_id);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const plan = plans?.find(p => p.id === data.plan_id);
      const payload: CreateTenantPayload = {
        name: data.name,
        slug: data.slug,
        subdomain: data.slug,
        plan_type: plan?.slug || 'basic',
        plan_id: data.plan_id,
        promo_enabled: data.promo_enabled,
        promo_type: data.promo_enabled ? data.promo_type : undefined,
        promo_days: data.promo_enabled && data.promo_type !== 'lifetime' ? data.promo_days : undefined,
        promo_reason: data.promo_enabled ? data.promo_reason : undefined,
        branding: {
          company_name: data.company_name || data.name,
          primary_color: data.primary_color,
        },
      };
      
      const result = await tenantsApi.create(payload);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Tenant criado com sucesso!');
      navigate(`/tenants/${data?.id || ''}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = createTenantSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    createMutation.mutate(formData);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  if (plansLoading) {
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Novo Tenant
          </h1>
          <p className="text-muted-foreground">
            Crie uma nova empresa no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Minha Empresa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="minha-empresa"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Será usado na URL: {formData.slug || 'slug'}.suaapp.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Plano *</CardTitle>
            <CardDescription>Selecione o plano para este tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans?.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setFormData(prev => ({ ...prev, plan_id: plan.id }))}
                  className={cn(
                    "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                    formData.plan_id === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {formData.plan_id === plan.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                  
                  <div className="text-2xl font-bold mb-3">
                    R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatLimit(plan.max_users)} usuários</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatLimit(plan.max_leads)} leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatLimit(plan.max_ai_tokens)} créditos IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{plan.max_storage_gb} GB storage</span>
                    </div>
                  </div>

                  {(plan.features_enabled as string[])?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-1">
                        {(plan.features_enabled as string[]).slice(0, 4).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {(plan.features_enabled as string[]).length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{(plan.features_enabled as string[]).length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Promotional Access Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Acesso Promocional
                </CardTitle>
                <CardDescription>Trial, parceria ou acesso vitalício gratuito</CardDescription>
              </div>
              <Switch
                checked={formData.promo_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, promo_enabled: checked }))}
              />
            </div>
          </CardHeader>
          {formData.promo_enabled && (
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Tipo de Acesso</Label>
                <RadioGroup
                  value={formData.promo_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, promo_type: v as FormData['promo_type'] }))}
                  className="grid gap-3"
                >
                  {promoTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                        {type.value === 'trial' && <Gift className="w-4 h-4 text-blue-500" />}
                        {type.value === 'partnership' && <Handshake className="w-4 h-4 text-green-500" />}
                        {type.value === 'lifetime' && <Crown className="w-4 h-4 text-amber-500" />}
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {formData.promo_type !== 'lifetime' && (
                <div className="space-y-2">
                  <Label htmlFor="promo_days">Duração</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="promo_days"
                      type="number"
                      min={1}
                      max={365}
                      value={formData.promo_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, promo_days: parseInt(e.target.value) || 14 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[7, 14, 30, 90, 180, 365].map((days) => (
                      <Button
                        key={days}
                        type="button"
                        variant={formData.promo_days === days ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, promo_days: days }))}
                      >
                        {days <= 30 ? `${days}d` : days === 365 ? '1 ano' : `${days / 30}m`}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="promo_reason">
                  Motivo / Observações {formData.promo_type === 'partnership' && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="promo_reason"
                  value={formData.promo_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, promo_reason: e.target.value }))}
                  placeholder={
                    formData.promo_type === 'partnership' 
                      ? "Nome do parceiro, acordo, condições..." 
                      : "Opcional: motivo do acesso gratuito"
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Personalização visual (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome de Exibição</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Nome para exibir no sistema"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Principal</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin User (optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Usuário Administrador</CardTitle>
            <CardDescription>Criar um admin inicial (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin_name">Nome do Admin</Label>
                <Input
                  id="admin_name"
                  value={formData.admin_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_email">Email do Admin</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_password">Senha Inicial</Label>
              <Input
                id="admin_password"
                type="password"
                value={formData.admin_password}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres. O usuário poderá alterar depois.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={createMutation.isPending || !formData.plan_id}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Tenant'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/tenants')}>
            Cancelar
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}