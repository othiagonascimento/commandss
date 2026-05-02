import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollableTabsList, MobileTabSelector, TabItem } from '@/components/ui/scrollable-tabs';
import {
  tenantsApi,
  featuresApi,
  usageApi,
  usersApi,
  subscriptionsApi,
} from '@/services/masterApi';
import { useTenantCredits } from '@/hooks/useTenantCredits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2, Building2, CreditCard, Settings2, Brain, Users, Radio, Crown,
  Handshake, Gift, Ban, ExternalLink, TrendingUp, TrendingDown, XCircle,
  RefreshCw, Palette, Globe, ClipboardList, DollarSign, Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { TenantUserCreditsTable } from '@/components/tenant/TenantUserCreditsTable';
import { TenantHero } from '@/components/tenant/TenantHero';
import { TenantIdentityForm } from '@/components/tenant/TenantIdentityForm';
import TenantOperationsTab from '@/components/tenant/TenantOperationsTabContent';

const TENANT_TABS: TabItem[] = [
  { value: 'identity', label: 'Identidade', shortLabel: 'Identidade', icon: Building2 },
  { value: 'commercial', label: 'Plano & Comercial', shortLabel: 'Comercial', icon: Briefcase },
  { value: 'resources', label: 'Recursos', shortLabel: 'Recursos', icon: Settings2 },
  { value: 'ai', label: 'Motor de IA', shortLabel: 'IA', icon: Brain },
  { value: 'people', label: 'Pessoas & Operação', shortLabel: 'Pessoas', icon: Users },
];

const planColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

const isValidUUID = (str: string | undefined): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/** Visual label for a logical sub-section inside a tab. */
function SectionTitle({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <span className="text-xs font-mono text-primary tracking-widest">{index}</span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {hint && <span className="text-xs text-muted-foreground hidden sm:inline">— {hint}</span>}
    </div>
  );
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('identity');

  const isIdValid = isValidUUID(id);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const result = await tenantsApi.get(id!);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: isIdValid,
    staleTime: 30000,
  });

  const { data: users } = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: async () => {
      const result = await usersApi.list(id!);
      if (result.error) return [];
      return result.data?.data || [];
    },
    enabled: isIdValid,
    staleTime: 30000,
  });

  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ['tenant-features', id],
    queryFn: async () => {
      const result = await featuresApi.get(id!);
      if (result.error) return null;
      return result.data;
    },
    enabled: isIdValid,
    staleTime: 30000,
  });

  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['tenant-usage', id],
    queryFn: async () => {
      const result = await usageApi.get(id!);
      if (result.error) return null;
      return result.data;
    },
    enabled: isIdValid,
    staleTime: 30000,
  });

  const { data: tenantCredits, isLoading: creditsLoading } = useTenantCredits(isIdValid ? id : undefined);

  // ============= Mutations =============
  const updateFeaturesMutation = useMutation({
    mutationFn: async (data: { modules?: Record<string, boolean>; limits?: Record<string, number> }) => {
      const r = await featuresApi.update(id!, data);
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    onSuccess: async () => {
      toast.success('Configurações salvas!');
      await queryClient.invalidateQueries({ queryKey: ['tenant-features', id] });
    },
    onError: () => toast.error('Erro ao salvar.'),
  });

  const applyOverrideMutation = useMutation({
    mutationFn: async ({ overrides, reason }: { overrides: Record<string, unknown>; reason: string }) => {
      const r = await featuresApi.applyOverride(id!, { overrides, reason });
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      toast.success('Override aplicado!');
      queryClient.invalidateQueries({ queryKey: ['tenant-features', id] });
    },
    onError: () => toast.error('Erro no override.'),
  });

  const clearOverrideMutation = useMutation({
    mutationFn: async () => {
      const r = await featuresApi.clearOverride(id!);
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      toast.success('Override removido.');
      queryClient.invalidateQueries({ queryKey: ['tenant-features', id] });
    },
    onError: () => toast.error('Erro ao remover override.'),
  });

  const recalculateUsageMutation = useMutation({
    mutationFn: async () => {
      const r = await usageApi.recalculate(id!);
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => { toast.success('Consumo recalculado!'); refetchUsage(); },
    onError: () => toast.error('Erro ao recalcular.'),
  });

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => subscriptionsApi.upgrade(id!, plan),
    onSuccess: () => { toast.success('Plano atualizado!'); queryClient.invalidateQueries({ queryKey: ['tenant', id] }); },
    onError: () => toast.error('Erro ao atualizar plano.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel(id!),
    onSuccess: () => { toast.success('Assinatura cancelada.'); queryClient.invalidateQueries({ queryKey: ['tenant', id] }); },
    onError: () => toast.error('Erro ao cancelar.'),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => subscriptionsApi.reactivate(id!),
    onSuccess: () => { toast.success('Assinatura reativada!'); queryClient.invalidateQueries({ queryKey: ['tenant', id] }); },
    onError: () => toast.error('Erro ao reativar.'),
  });

  const customerPortalMutation = useMutation({
    mutationFn: () => subscriptionsApi.openCustomerPortal(id!),
    onSuccess: (r) => {
      if (r.data?.url) window.open(r.data.url, '_blank');
      else toast.error('Não foi possível abrir o portal.');
    },
    onError: () => toast.error('Erro ao abrir portal.'),
  });

  const createCheckoutMutation = useMutation({
    mutationFn: () => subscriptionsApi.createCheckout(id!),
    onSuccess: (r) => {
      if (r.data?.url) window.open(r.data.url, '_blank');
      else toast.error('Não foi possível criar o checkout.');
    },
    onError: () => toast.error('Erro ao criar checkout.'),
  });

  const revokePromoMutation = useMutation({
    mutationFn: async () => {
      const r = await tenantsApi.update(id!, {
        trial_enabled: false, trial_days: null,
        subscription_status: 'pending', current_period_end: null, config: null,
      });
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => { toast.success('Acesso promocional revogado.'); queryClient.invalidateQueries({ queryKey: ['tenant', id] }); },
    onError: () => toast.error('Erro ao revogar.'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      if (tenant?.is_active) return tenantsApi.deactivate(id!);
      return tenantsApi.update(id!, { is_active: true, status: 'active' });
    },
    onSuccess: () => {
      toast.success(tenant?.is_active ? 'Tenant desativado' : 'Tenant ativado');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
    },
    onError: (e) => toast.error('Erro: ' + (e as Error).message),
  });

  // ============= Derived: alerts =============
  const alerts = useMemo(() => {
    const out: Array<{ id: string; severity: 'critical' | 'warning' | 'info'; label: string; hint?: string }> = [];
    if (!tenant) return out;
    if (tenant.subscription_status === 'past_due') {
      out.push({ id: 'past_due', severity: 'critical', label: 'Pagamento atrasado', hint: 'Assinatura em past_due — ação imediata necessária.' });
    }
    if (!tenant.is_active) {
      out.push({ id: 'inactive', severity: 'warning', label: 'Tenant inativo', hint: 'Usuários sem acesso.' });
    }
    // Usage thresholds
    if (usage && features) {
      const checks: Array<[string, number | undefined, number | undefined]> = [
        ['mensagens', usage.messages, features.limit_ai_tokens_monthly],
        ['leads', usage.leads, features.limit_leads],
        ['usuários', usage.users, features.limit_users],
      ];
      checks.forEach(([label, used, limit]) => {
        if (used && limit && limit > 0 && used / limit >= 0.9) {
          out.push({
            id: `lim-${label}`,
            severity: used >= limit ? 'critical' : 'warning',
            label: `Limite de ${label} ${used >= limit ? 'excedido' : 'próximo do teto'}`,
            hint: `${used} / ${limit}`,
          });
        }
      });
    }
    return out;
  }, [tenant, usage, features]);

  // ============= Guards =============
  if (!isIdValid) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">ID de tenant inválido</h2>
          <Button className="mt-4" onClick={() => navigate('/tenants')}>Voltar para lista</Button>
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
          <Button className="mt-4" onClick={() => navigate('/tenants')}>Voltar para lista</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Breadcrumbs
        items={[{ label: 'Tenants', href: '/tenants' }, { label: tenant.name, current: true }]}
        className="mb-4"
      />

      {/* HERO */}
      <TenantHero
        tenant={tenant}
        tenantId={id!}
        alerts={alerts}
        onRecalculateUsage={() => recalculateUsageMutation.mutate()}
        recalculating={recalculateUsageMutation.isPending}
        onToggleStatus={() => toggleStatusMutation.mutate()}
      />

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-6">
        <MobileTabSelector tabs={TENANT_TABS} value={activeTab} onValueChange={setActiveTab} className="mb-4" />
        <div className="hidden sm:block">
          <ScrollableTabsList tabs={TENANT_TABS} />
        </div>

        {/* ============ IDENTIDADE ============ */}
        <TabsContent value="identity" className="space-y-8">
          <div>
            <SectionTitle index="01" title="Dados gerais" hint="Nome, subdomínio, localização e plano" />
            <TenantIdentityForm tenantId={id!} tenant={tenant} />
          </div>

          <div>
            <SectionTitle index="02" title="Branding" hint="Logo, cores e identidade visual" />
            <BrandingManagement tenantId={id!} branding={tenant.branding} planType={tenant.plan_type} />
          </div>

          <div>
            <SectionTitle index="03" title="Domínios" hint="Subdomínio padrão e domínios customizados" />
            <DomainsManagement tenantId={id!} tenantSubdomain={tenant.slug || tenant.subdomain} />
          </div>

          <div>
            <SectionTitle index="04" title="Metadados do sistema" />
            <Card>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-6">
                <div>
                  <p className="text-muted-foreground text-xs">ID</p>
                  <p className="font-mono text-xs break-all">{tenant.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Criado em</p>
                  <p>{format(new Date(tenant.created_at), "dd 'de' MMM yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Stripe Customer</p>
                  <p className="font-mono text-xs break-all">{tenant.stripe_customer_id || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status assinatura</p>
                  <p className="capitalize">{tenant.subscription_status || '—'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ PLANO & COMERCIAL ============ */}
        <TabsContent value="commercial" className="space-y-8">
          <div>
            <SectionTitle index="01" title="Configuração comercial" hint="Precificação, mensalidade, descontos e implementação" />
            <TenantCommercialEditor tenant={tenant} />
          </div>

          <div>
            <SectionTitle index="02" title="Assinatura & cobrança" />
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center gap-3">
                  <Badge className={cn('text-lg py-1 px-4 capitalize', planColors[tenant.plan_type])}>
                    {tenant.plan_type}
                  </Badge>
                  {tenant.subscription && (
                    <Badge variant={tenant.subscription.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.subscription.status}
                    </Badge>
                  )}
                </div>

                {(tenant.trial_enabled || ['trialing', 'partnership', 'lifetime'].includes(tenant.subscription_status)) && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {tenant.subscription_status === 'lifetime' && <Crown className="w-4 h-4 text-amber-500" />}
                        {tenant.subscription_status === 'partnership' && <Handshake className="w-4 h-4 text-green-500" />}
                        {tenant.subscription_status === 'trialing' && <Gift className="w-4 h-4 text-primary" />}
                        Acesso promocional ativo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium capitalize">{tenant.subscription_status}</p>
                        </div>
                        {tenant.current_period_end && tenant.subscription_status !== 'lifetime' && (
                          <div>
                            <span className="text-muted-foreground">Expira em:</span>
                            <p className="font-medium">{format(new Date(tenant.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}</p>
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
                            <Ban className="w-4 h-4 mr-2" />Revogar acesso gratuito
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar acesso promocional?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O tenant perderá acesso gratuito imediatamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokePromoMutation.mutate()}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Revogar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-primary" />Portal Stripe
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tenant.stripe_customer_id ? (
                        <Button variant="outline" className="w-full" onClick={() => customerPortalMutation.mutate()} disabled={customerPortalMutation.isPending}>
                          {customerPortalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                          Abrir portal
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => createCheckoutMutation.mutate()} disabled={createCheckoutMutation.isPending}>
                          {createCheckoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                          Criar checkout
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {tenant.plan_type !== 'enterprise' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-success" />Upgrade
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tenant.plan_type === 'basic' && (
                          <>
                            <Button className="w-full" onClick={() => upgradeMutation.mutate('pro')} disabled={upgradeMutation.isPending}>Para Pro</Button>
                            <Button variant="outline" className="w-full" onClick={() => upgradeMutation.mutate('enterprise')} disabled={upgradeMutation.isPending}>Para Enterprise</Button>
                          </>
                        )}
                        {tenant.plan_type === 'pro' && (
                          <Button className="w-full" onClick={() => upgradeMutation.mutate('enterprise')} disabled={upgradeMutation.isPending}>Para Enterprise</Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {tenant.plan_type !== 'basic' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-warning" />Downgrade
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tenant.plan_type === 'enterprise' && (
                          <>
                            <Button variant="outline" className="w-full" onClick={() => upgradeMutation.mutate('pro')} disabled={upgradeMutation.isPending}>Para Pro</Button>
                            <Button variant="outline" className="w-full" onClick={() => upgradeMutation.mutate('basic')} disabled={upgradeMutation.isPending}>Para Basic</Button>
                          </>
                        )}
                        {tenant.plan_type === 'pro' && (
                          <Button variant="outline" className="w-full" onClick={() => upgradeMutation.mutate('basic')} disabled={upgradeMutation.isPending}>Para Basic</Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {tenant.is_active ? <><XCircle className="w-4 h-4 text-destructive" />Cancelar</> : <><RefreshCw className="w-4 h-4 text-success" />Reativar</>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tenant.is_active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">Cancelar assinatura</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                              <AlertDialogDescription>O tenant será desativado. Pode ser reativado depois.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelMutation.mutate()} className="bg-destructive text-destructive-foreground">Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button className="w-full" onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}>
                          <RefreshCw className="w-4 h-4 mr-2" />Reativar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionTitle index="03" title="Unit economics" hint="CAC, LTV, payback e margem" />
            <UnitEconomicsCard tenantId={id!} />
          </div>
        </TabsContent>

        {/* ============ RECURSOS ============ */}
        <TabsContent value="resources" className="space-y-8">
          <div>
            <SectionTitle index="01" title="Consumo atual" hint="Uso vs. limites contratados" />
            <TenantUsageProgress
              usage={usage || null}
              isLoading={usageLoading || recalculateUsageMutation.isPending}
              onRecalculate={() => recalculateUsageMutation.mutate()}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SectionTitle index="02" title="Módulos" hint="Funcionalidades habilitadas" />
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

            <div>
              <SectionTitle index="03" title="Limites numéricos" />
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
            </div>
          </div>

          <div>
            <SectionTitle index="04" title="Overrides ativos" hint="Customizações sobrescrevendo o plano" />
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

          <div>
            <SectionTitle index="05" title="Consumo por usuário" hint="Tokens e custo por operador" />
            <TenantUserCreditsTable tenantId={id!} />
          </div>
        </TabsContent>

        {/* ============ MOTOR IA ============ */}
        <TabsContent value="ai" className="space-y-8">
          <div>
            <SectionTitle index="01" title="Template aplicado" hint="Nicho/segmento e prompts base" />
            <TenantTemplateManager tenantId={id!} tenantName={tenant.name} />
          </div>

          <div>
            <SectionTitle index="02" title="Camadas do motor de IA" hint="Override por camada (intent, response, fallback)" />
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
          </div>
        </TabsContent>

        {/* ============ PESSOAS & OPERAÇÃO ============ */}
        <TabsContent value="people" className="space-y-8">
          <div>
            <SectionTitle index="01" title="Operação ao vivo" hint="Canais WhatsApp, jobs e saúde em tempo real" />
            <TenantOperationsTab tenantId={id!} />
          </div>

          <div>
            <SectionTitle index="02" title="Usuários do tenant" />
            <Card>
              <CardContent className="pt-6">
                <UserManagement tenantId={id!} users={users || []} isLoading={false} />
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionTitle index="03" title="Onboarding" hint="Checklist de implantação" />
            <OnboardingChecklist tenantId={id!} />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
