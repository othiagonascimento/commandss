import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tenantsApi, subscriptionsApi, usersApi, TenantUser } from '@/services/masterApi';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ImpersonateButton } from '@/components/tenant/ImpersonateButton';
import { OnboardingChecklist } from '@/components/tenant/OnboardingChecklist';
import { UnitEconomicsCard } from '@/components/tenant/UnitEconomicsCard';
import { BrandingManagement } from '@/components/tenant/BrandingManagement';
import { DomainsManagement } from '@/components/tenant/DomainsManagement';

const planColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const result = await tenantsApi.get(id!);
      return result.data;
    },
    enabled: !!id,
  });

  const { data: users } = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: async () => {
      const result = await usersApi.list(id!);
      return result.data?.data || [];
    },
    enabled: !!id,
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
            <Badge className={planColors[tenant.plan_type]}>
              {tenant.plan_type}
            </Badge>
            {tenant.subscription_status === 'active' ? (
              <Badge variant="default" className="bg-success text-success-foreground">
                Assinatura Ativa
              </Badge>
            ) : tenant.subscription_status === 'lifetime' ? (
              <Badge variant="default" className="bg-amber-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Vitalício
              </Badge>
            ) : tenant.subscription_status === 'partnership' ? (
              <Badge variant="default" className="bg-green-600 text-white">
                <Handshake className="w-3 h-3 mr-1" />
                Parceria
              </Badge>
            ) : tenant.subscription_status === 'trialing' ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Gift className="w-3 h-3 mr-1" />
                Em Trial
              </Badge>
            ) : tenant.subscription_status === 'past_due' ? (
              <Badge variant="destructive">
                Pagamento Atrasado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-warning text-warning">
                Aguardando Pagamento
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{tenant.slug}</p>
        </div>
        <ImpersonateButton tenantId={id!} tenantName={tenant.name} />
      </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          {/* Mobile: Dropdown for tabs */}
          <div className="md:hidden">
            <select 
              className="w-full p-2 rounded-md border bg-background text-sm"
              onChange={(e) => {
                const tab = document.querySelector(`[data-state="active"][value="${e.target.value}"]`) as HTMLElement;
                tab?.click();
              }}
              defaultValue="overview"
            >
              <option value="overview">📊 Visão Geral</option>
              <option value="users">👥 Usuários</option>
              <option value="subscription">💳 Assinatura</option>
              <option value="branding">🎨 Branding</option>
              <option value="domains">🌐 Domínios</option>
              <option value="onboarding">✅ Onboarding</option>
              <option value="economics">💰 Unit Economics</option>
            </select>
          </div>

          {/* Desktop: Tab list */}
          <TabsList className="hidden md:flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="gap-1 text-xs lg:text-sm">
              <Building2 className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Visão Geral</span>
              <span className="lg:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs lg:text-sm">
              <Users className="w-3 h-3 lg:w-4 lg:h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1 text-xs lg:text-sm">
              <CreditCard className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Assinatura</span>
              <span className="lg:hidden">$</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-1 text-xs lg:text-sm">
              <Palette className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Branding</span>
              <span className="lg:hidden">🎨</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-1 text-xs lg:text-sm">
              <Globe className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Domínios</span>
              <span className="lg:hidden">🌐</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-1 text-xs lg:text-sm">
              <ClipboardList className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Onboarding</span>
              <span className="lg:hidden">✅</span>
            </TabsTrigger>
            <TabsTrigger value="economics" className="gap-1 text-xs lg:text-sm">
              <DollarSign className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Economics</span>
              <span className="lg:hidden">💰</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <CardDescription>Créditos IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tenant.ai_credits}</p>
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

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Usuários do Tenant</CardTitle>
                  <Button size="sm">
                    Adicionar Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {users && users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: TenantUser) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </p>
                )}
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
        </Tabs>
    </DashboardLayout>
  );
}
