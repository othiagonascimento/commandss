import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollableTabsList, MobileTabSelector, TabItem } from '@/components/ui/scrollable-tabs';
import { 
  tenantsApi, 
  subscriptionsApi, 
  usersApi, 
  featuresApi, 
  usageApi,
  TenantUser,
  TenantFeatures,
  TenantUsageDetail,
} from '@/services/masterApi';
import { useTenantCredits } from '@/hooks/useTenantCredits';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Loader2, 
  Building2,
  Users,
  CreditCard,
  Palette,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  XCircle,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Gift,
  Handshake,
  Crown,
  Ban,
  Globe,
  Settings2,
  Brain,
  Briefcase,
  Coins,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ImpersonateButton } from '@/components/tenant/ImpersonateButton';
import { OnboardingChecklist } from '@/components/tenant/OnboardingChecklist';
import { UnitEconomicsCard } from '@/components/tenant/UnitEconomicsCard';
import { BrandingManagement } from '@/components/tenant/BrandingManagement';
import { DomainsManagement } from '@/components/tenant/DomainsManagement';
import { TenantModulesEditor } from '@/components/tenant/TenantModulesEditor';
import { TenantLimitsEditor } from '@/components/tenant/TenantLimitsEditor';
import { TenantUsageProgress } from '@/components/tenant/TenantUsageProgress';
import { TenantOverridesForm } from '@/components/tenant/TenantOverridesForm';
import { TenantAIEngineEditor } from '@/components/tenant/TenantAIEngineEditor';
import { TenantCommercialEditor } from '@/components/tenant/TenantCommercialEditor';
import { UserManagement } from '@/components/tenant/UserManagement';
import { TenantTemplateManager } from '@/components/tenant/TenantTemplateManager';

const TENANT_TABS: TabItem[] = [
  { value: 'overview', label: 'Visão Geral', shortLabel: 'Geral', icon: Building2 },
  { value: 'template', label: 'Template', shortLabel: 'Template', icon: ClipboardList },
  { value: 'commercial', label: 'Comercial', shortLabel: 'Comercial', icon: Briefcase },
  { value: 'resources', label: 'Recursos', shortLabel: 'Recursos', icon: Settings2 },
  { value: 'ai-engine', label: 'Motor de IA', shortLabel: 'IA', icon: Brain },
  { value: 'users', label: 'Usuários', shortLabel: 'Usuários', icon: Users },
  { value: 'subscription', label: 'Assinatura', shortLabel: 'Assin.', icon: CreditCard },
  { value: 'branding', label: 'Branding', shortLabel: 'Brand', icon: Palette },
  { value: 'domains', label: 'Domínios', shortLabel: 'Domínios', icon: Globe },
  { value: 'onboarding', label: 'Onboarding', shortLabel: 'Onboard', icon: ClipboardList },
  { value: 'economics', label: 'Economics', shortLabel: 'Econ.', icon: DollarSign },
];

const planColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

// Helper to validate UUID format
const isValidUUID = (str: string | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Validate that id is a valid UUID
  const isIdValid = isValidUUID(id);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const result = await tenantsApi.get(id!);
      return result.data;
    },
    enabled: isIdValid,
    staleTime: 30000,
    gcTime: 60000,
  });

  const { data: users } = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: async () => {
      const result = await usersApi.list(id!);
      return result.data?.data || [];
    },
    enabled: isIdValid,
    staleTime: 30000,
    gcTime: 60000,
  });

  // Fetch tenant features
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ['tenant-features', id],
    queryFn: async () => {
      const result = await featuresApi.get(id!);
      return result.data;
    },
    enabled: isIdValid,
    staleTime: 30000,
    gcTime: 60000,
  });

  // Fetch tenant usage
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['tenant-usage', id],
    queryFn: async () => {
      const result = await usageApi.get(id!);
      return result.data;
    },
    enabled: isIdValid,
    staleTime: 30000,
    gcTime: 60000,
  });

  // Fetch tenant credits summary via RPC
  const { data: tenantCredits, isLoading: creditsLoading } = useTenantCredits(isIdValid ? id : undefined);

  // Update features mutation
  const updateFeaturesMutation = useMutation({
    mutationFn: async (data: { modules?: Record<string, boolean>; limits?: Record<string, number> }) => {
      const result = await featuresApi.update(id!, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      toast.success('Configurações salvas com sucesso!');
      // Force invalidate and refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['tenant-features', id] });
      await queryClient.refetchQueries({ queryKey: ['tenant-features', id] });
    },
    onError: () => {
      toast.error('Erro ao salvar configurações.');
    },
  });

  // Apply override mutation
  const applyOverrideMutation = useMutation({
    mutationFn: async ({ overrides, reason }: { overrides: Record<string, unknown>; reason: string }) => {
      const result = await featuresApi.applyOverride(id!, { overrides, reason });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Override aplicado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant-features', id] });
    },
    onError: () => {
      toast.error('Erro ao aplicar override.');
    },
  });

  // Clear override mutation
  const clearOverrideMutation = useMutation({
    mutationFn: async () => {
      const result = await featuresApi.clearOverride(id!);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Override removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant-features', id] });
    },
    onError: () => {
      toast.error('Erro ao remover override.');
    },
  });

  // Recalculate usage mutation
  const recalculateUsageMutation = useMutation({
    mutationFn: async () => {
      const result = await usageApi.recalculate(id!);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Consumo recalculado!');
      refetchUsage();
    },
    onError: () => {
      toast.error('Erro ao recalcular consumo.');
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => subscriptionsApi.upgrade(id!, plan),
    onSuccess: () => {
      toast.success('Plano atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
    },
    onError: () => {
      toast.error('Erro ao atualizar plano.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel(id!),
    onSuccess: () => {
      toast.success('Assinatura cancelada.');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
    },
    onError: () => {
      toast.error('Erro ao cancelar assinatura.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => subscriptionsApi.reactivate(id!),
    onSuccess: () => {
      toast.success('Assinatura reativada!');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
    },
    onError: () => {
      toast.error('Erro ao reativar assinatura.');
    },
  });

  const customerPortalMutation = useMutation({
    mutationFn: () => subscriptionsApi.openCustomerPortal(id!),
    onSuccess: (result) => {
      if (result.data?.url) {
        window.open(result.data.url, '_blank');
      } else {
        toast.error('Não foi possível abrir o portal.');
      }
    },
    onError: () => {
      toast.error('Erro ao abrir portal do cliente.');
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: () => subscriptionsApi.createCheckout(id!),
    onSuccess: (result) => {
      if (result.data?.url) {
        window.open(result.data.url, '_blank');
      } else {
        toast.error('Não foi possível criar o checkout.');
      }
    },
    onError: () => {
      toast.error('Erro ao criar checkout.');
    },
  });

  const revokePromoMutation = useMutation({
    mutationFn: async () => {
      const result = await tenantsApi.update(id!, {
        trial_enabled: false,
        trial_days: null,
        subscription_status: 'pending',
        current_period_end: null,
        config: null,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Acesso promocional revogado.');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
    },
    onError: () => {
      toast.error('Erro ao revogar acesso.');
    },
  });

  // Handle invalid ID (e.g., literal ":id" in URL)
  if (!isIdValid) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">ID de tenant inválido</h2>
          <p className="text-muted-foreground mt-2">O identificador fornecido não é válido.</p>
          <Button className="mt-4" onClick={() => navigate('/tenants')}>
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Tenants', href: '/tenants' },
          { label: tenant.name, current: true },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')} className="shrink-0 hidden sm:flex">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{tenant.name}</h1>
            <Badge className={cn("shrink-0", planColors[tenant.plan_type])}>
              {tenant.plan_type}
            </Badge>
            {tenant.subscription_status === 'active' ? (
              <Badge variant="default" className="bg-success text-success-foreground shrink-0">
                Ativa
              </Badge>
            ) : tenant.subscription_status === 'lifetime' ? (
              <Badge variant="default" className="bg-amber-500 text-white shrink-0">
                <Crown className="w-3 h-3 mr-1" />
                Vitalício
              </Badge>
            ) : tenant.subscription_status === 'partnership' ? (
              <Badge variant="default" className="bg-green-600 text-white shrink-0">
                <Handshake className="w-3 h-3 mr-1" />
                Parceria
              </Badge>
            ) : tenant.subscription_status === 'trialing' ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0">
                <Gift className="w-3 h-3 mr-1" />
                Trial
              </Badge>
            ) : tenant.subscription_status === 'past_due' ? (
              <Badge variant="destructive" className="shrink-0">
                Atrasado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-warning text-warning shrink-0">
                Pendente
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
        </div>
        <ImpersonateButton tenantId={id!} tenantName={tenant.name} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile Tab Selector */}
        <MobileTabSelector
          tabs={TENANT_TABS}
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-4"
        />

        {/* Desktop Scrollable Tabs */}
        <div className="hidden sm:block">
          <ScrollableTabsList tabs={TENANT_TABS} />

        </div>

          {/* Resources & Limits Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Progress */}
              <TenantUsageProgress 
                usage={usage || null} 
                isLoading={usageLoading || recalculateUsageMutation.isPending}
                onRecalculate={() => recalculateUsageMutation.mutate()}
              />

              {/* Modules Editor */}
              {features && (
                <TenantModulesEditor
                  modules={{
                    module_ai_agent: features.module_ai_agent,
                    module_ai_transcription: features.module_ai_transcription,
                    module_automation_flows: features.module_automation_flows,
                    module_campaigns: features.module_campaigns,
                    module_ecommerce: features.module_ecommerce,
                    module_erp_integration: features.module_erp_integration,
                    module_api_access: features.module_api_access,
                    module_whitelabel: features.module_whitelabel,
                    module_multi_whatsapp: features.module_multi_whatsapp,
                  }}
                  onChange={(modules) => updateFeaturesMutation.mutate({ modules })}
                  disabled={updateFeaturesMutation.isPending}
                />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Limits Editor */}
              {features && (
                <TenantLimitsEditor
                  limits={{
                    limit_users: features.limit_users,
                    limit_leads: features.limit_leads,
                    limit_products: features.limit_products,
                    limit_whatsapp_instances: features.limit_whatsapp_instances,
                    limit_ai_tokens_monthly: features.limit_ai_tokens_monthly,
                    limit_storage_mb: features.limit_storage_mb,
                    credits_per_user: features.credits_per_user,
                    storage_mb_per_user: features.storage_mb_per_user,
                  }}
                  onChange={(limits) => updateFeaturesMutation.mutate({ limits })}
                  disabled={updateFeaturesMutation.isPending}
                  usersCount={users?.length || 0}
                />
              )}

              {/* Overrides Form */}
              {features && (
                <TenantOverridesForm
                  currentOverrides={features.overrides || {}}
                  overrideReason={features.override_reason}
                  overriddenBy={features.overridden_by}
                  overriddenAt={features.overridden_at}
                  onApply={(overrides, reason) => applyOverrideMutation.mutate({ overrides, reason })}
                  onClear={() => clearOverrideMutation.mutate()}
                  disabled={applyOverrideMutation.isPending || clearOverrideMutation.isPending}
                />
              )}
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Créditos Consumidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {creditsLoading ? '...' : tenantCredits?.total_credits_consumed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {tenantCredits?.total_cost_brl?.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tenant.usage?.leads || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Usuários</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tenant.usage?.users || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mensagens</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tenant.usage?.messages || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Créditos IA (por Usuário)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{features?.credits_per_user ?? 500}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{tenant.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p>{format(new Date(tenant.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <Badge className={planColors[tenant.plan_type]}>{tenant.plan_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                      {tenant.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commercial Tab */}
          <TabsContent value="commercial">
            <TenantCommercialEditor tenant={tenant} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardContent className="pt-6">
                <UserManagement 
                  tenantId={id!} 
                  users={users || []} 
                  isLoading={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Assinatura</CardTitle>
                <CardDescription>
                  Gerencie o plano e status da assinatura deste tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={cn('text-lg py-1 px-4', planColors[tenant.plan_type])}>
                    {tenant.plan_type.toUpperCase()}
                  </Badge>
                  {tenant.subscription && (
                    <Badge variant={tenant.subscription.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.subscription.status}
                    </Badge>
                  )}
                </div>

                {/* Promotional Access Card */}
                {(tenant.trial_enabled || tenant.subscription_status === 'trialing' || tenant.subscription_status === 'partnership' || tenant.subscription_status === 'lifetime') && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {tenant.subscription_status === 'lifetime' && <Crown className="w-4 h-4 text-amber-500" />}
                        {tenant.subscription_status === 'partnership' && <Handshake className="w-4 h-4 text-green-500" />}
                        {tenant.subscription_status === 'trialing' && <Gift className="w-4 h-4 text-primary" />}
                        Acesso Promocional Ativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">
                            {tenant.subscription_status === 'lifetime' && 'Vitalício'}
                            {tenant.subscription_status === 'partnership' && 'Parceria'}
                            {tenant.subscription_status === 'trialing' && 'Trial'}
                          </p>
                        </div>
                        {tenant.current_period_end && (
                          <div>
                            <span className="text-muted-foreground">Expira em:</span>
                            <p className="font-medium">
                              {format(new Date(tenant.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                        {tenant.subscription_status === 'lifetime' && (
                          <div>
                            <span className="text-muted-foreground">Expiração:</span>
                            <p className="font-medium text-amber-600">Nunca expira</p>
                          </div>
                        )}
                      </div>
                      {tenant.config?.promo?.reason && (
                        <div>
                          <span className="text-sm text-muted-foreground">Motivo:</span>
                          <p className="text-sm bg-background/50 rounded p-2 mt-1">{tenant.config.promo.reason}</p>
                        </div>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full mt-2">
                            <Ban className="w-4 h-4 mr-2" />
                            Revogar Acesso Gratuito
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar Acesso Promocional?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O tenant perderá o acesso gratuito imediatamente e precisará fazer o pagamento para continuar usando o sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokePromoMutation.mutate()}
                              disabled={revokePromoMutation.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {revokePromoMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Ban className="w-4 h-4 mr-2" />
                              )}
                              Revogar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Portal */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      Portal Stripe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tenant.stripe_customer_id ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => customerPortalMutation.mutate()}
                          disabled={customerPortalMutation.isPending}
                        >
                          {customerPortalMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Abrir Customer Portal
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="w-full"
                          onClick={() => createCheckoutMutation.mutate()}
                          disabled={createCheckoutMutation.isPending}
                        >
                          {createCheckoutMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Criar Checkout Stripe
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tenant não possui customer ID no Stripe
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Upgrade Options */}
                {tenant.plan_type !== 'enterprise' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        Upgrade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {tenant.plan_type === 'basic' && (
                          <>
                            <Button 
                              className="w-full" 
                              onClick={() => upgradeMutation.mutate('pro')}
                              disabled={upgradeMutation.isPending}
                            >
                              Upgrade para Pro
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => upgradeMutation.mutate('enterprise')}
                              disabled={upgradeMutation.isPending}
                            >
                              Upgrade para Enterprise
                            </Button>
                          </>
                        )}
                        {tenant.plan_type === 'pro' && (
                          <Button 
                            className="w-full"
                            onClick={() => upgradeMutation.mutate('enterprise')}
                            disabled={upgradeMutation.isPending}
                          >
                            Upgrade para Enterprise
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Downgrade Options */}
                  {tenant.plan_type !== 'basic' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-warning" />
                          Downgrade
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tenant.plan_type === 'enterprise' && (
                          <>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => upgradeMutation.mutate('pro')}
                              disabled={upgradeMutation.isPending}
                            >
                              Downgrade para Pro
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => upgradeMutation.mutate('basic')}
                              disabled={upgradeMutation.isPending}
                            >
                              Downgrade para Basic
                            </Button>
                          </>
                        )}
                        {tenant.plan_type === 'pro' && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => upgradeMutation.mutate('basic')}
                            disabled={upgradeMutation.isPending}
                          >
                            Downgrade para Basic
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Cancel/Reactivate */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {tenant.is_active ? (
                          <>
                            <XCircle className="w-4 h-4 text-destructive" />
                            Cancelar
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 text-success" />
                            Reativar
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tenant.is_active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              Cancelar Assinatura
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação irá desativar o tenant e cancelar sua assinatura.
                                O tenant poderá ser reativado posteriormente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate()}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Confirmar Cancelamento
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => reactivateMutation.mutate()}
                          disabled={reactivateMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reativar Assinatura
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <BrandingManagement
              tenantId={id!}
              branding={tenant.branding}
              planType={tenant.plan_type}
            />
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding">
            <OnboardingChecklist tenantId={id!} />
          </TabsContent>

          {/* Domains Tab */}
          <TabsContent value="domains">
            <DomainsManagement tenantId={id!} tenantSubdomain={tenant.slug || tenant.subdomain} />
          </TabsContent>

          {/* Unit Economics Tab */}
          <TabsContent value="economics">
            <UnitEconomicsCard tenantId={id!} />
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template">
            <TenantTemplateManager tenantId={id!} tenantName={tenant.name} />
          </TabsContent>

          {/* AI Engine Tab */}
          <TabsContent value="ai-engine">
            {features && (
              <TenantAIEngineEditor
                tenantId={id!}
                config={{
                  ai_use_global_config: features.ai_use_global_config ?? true,
                  ai_layer_1_model: features.ai_layer_1_model ?? null,
                  ai_layer_1_instructions: features.ai_layer_1_instructions ?? null,
                  ai_layer_2_model: features.ai_layer_2_model ?? null,
                  ai_layer_2_instructions: features.ai_layer_2_instructions ?? null,
                  ai_layer_3_model: features.ai_layer_3_model ?? null,
                  ai_layer_3_instructions: features.ai_layer_3_instructions ?? null,
                }}
                isLoading={featuresLoading}
              />
            )}
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
}
