import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
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
  Settings,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const planColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      return result.data;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Tenant não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/tenants')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'transition-[margin] duration-300 p-4 lg:p-6',
          'lg:ml-[280px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
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
              <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                {tenant.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{tenant.slug}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Building2 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Assinatura
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Card>
              <CardHeader>
                <CardTitle>Personalização Visual</CardTitle>
                <CardDescription>
                  Configure a identidade visual do tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade de branding em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Configurações gerais e limites do tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configurações avançadas em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
