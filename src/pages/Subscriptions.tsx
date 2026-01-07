import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { tenantsApi, subscriptionsApi, Tenant, SubscriptionDetail } from '@/services/masterApi';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Loader2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TenantSubscription {
  tenant: Tenant;
  subscription: SubscriptionDetail | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success',
  trial: 'bg-info/10 text-info',
  cancelled: 'bg-destructive/10 text-destructive',
  past_due: 'bg-warning/10 text-warning',
};

const planColors: Record<string, string> = {
  starter: 'bg-muted text-muted-foreground',
  professional: 'bg-primary/10 text-primary',
  enterprise: 'bg-warning/10 text-warning',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [actionDialog, setActionDialog] = useState<{
    type: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | null;
    tenant: Tenant | null;
  }>({ type: null, tenant: null });
  const [selectedPlan, setSelectedPlan] = useState('');

  // Fetch tenants
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: async () => {
      const result = await tenantsApi.list({ limit: 100 });
      return result.data;
    },
  });

  const tenants = tenantsData?.data || [];

  // Fetch subscriptions for all tenants
  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['all-subscriptions', tenants.map(t => t.id).join(',')],
    queryFn: async () => {
      const results: TenantSubscription[] = [];
      for (const tenant of tenants) {
        const subResult = await subscriptionsApi.get(tenant.id);
        results.push({
          tenant,
          subscription: subResult.data,
        });
      }
      return results;
    },
    enabled: tenants.length > 0,
  });

  const subscriptions = subscriptionsData || [];

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(item => {
    const matchesSearch = !search || 
      item.tenant.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.subscription?.status === statusFilter;
    const matchesPlan = planFilter === 'all' || item.subscription?.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate stats
  const totalMRR = subscriptions.reduce((sum, item) => {
    if (item.subscription?.status === 'active') {
      return sum + (item.subscription.billing_cycle === 'monthly' 
        ? item.subscription.amount 
        : item.subscription.amount / 12);
    }
    return sum;
  }, 0);

  const activeCount = subscriptions.filter(s => s.subscription?.status === 'active').length;
  const trialCount = subscriptions.filter(s => s.subscription?.status === 'trial').length;
  const cancelledCount = subscriptions.filter(s => s.subscription?.status === 'cancelled').length;

  // Mutations
  const upgradeMutation = useMutation({
    mutationFn: ({ tenantId, plan }: { tenantId: string; plan: string }) =>
      subscriptionsApi.upgrade(tenantId, plan),
    onSuccess: () => {
      toast.success('Plano atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      setActionDialog({ type: null, tenant: null });
    },
    onError: () => toast.error('Erro ao atualizar plano.'),
  });

  const downgradeMutation = useMutation({
    mutationFn: ({ tenantId, plan }: { tenantId: string; plan: string }) =>
      subscriptionsApi.downgrade(tenantId, plan),
    onSuccess: () => {
      toast.success('Plano alterado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      setActionDialog({ type: null, tenant: null });
    },
    onError: () => toast.error('Erro ao alterar plano.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (tenantId: string) => subscriptionsApi.cancel(tenantId),
    onSuccess: () => {
      toast.success('Assinatura cancelada.');
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      setActionDialog({ type: null, tenant: null });
    },
    onError: () => toast.error('Erro ao cancelar assinatura.'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (tenantId: string) => subscriptionsApi.reactivate(tenantId),
    onSuccess: () => {
      toast.success('Assinatura reativada!');
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      setActionDialog({ type: null, tenant: null });
    },
    onError: () => toast.error('Erro ao reativar assinatura.'),
  });

  const handleAction = () => {
    if (!actionDialog.tenant) return;
    
    switch (actionDialog.type) {
      case 'upgrade':
        upgradeMutation.mutate({ tenantId: actionDialog.tenant.id, plan: selectedPlan });
        break;
      case 'downgrade':
        downgradeMutation.mutate({ tenantId: actionDialog.tenant.id, plan: selectedPlan });
        break;
      case 'cancel':
        cancelMutation.mutate(actionDialog.tenant.id);
        break;
      case 'reactivate':
        reactivateMutation.mutate(actionDialog.tenant.id);
        break;
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Assinaturas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie planos e cobranças dos tenants
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                MRR Estimado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalMRR)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                Assinaturas Ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-info" />
                Em Trial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{trialCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                Canceladas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{cancelledCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="past_due">Atrasado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Assinaturas</CardTitle>
            <CardDescription>
              {filteredSubscriptions.length} assinatura(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma assinatura encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((item) => (
                    <TableRow key={item.tenant.id}>
                      <TableCell className="font-medium">{item.tenant.name}</TableCell>
                      <TableCell>
                        <Badge className={planColors[item.subscription?.plan || 'starter']}>
                          {item.subscription?.plan || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.subscription?.status || 'cancelled']}>
                          {item.subscription?.status === 'active' && 'Ativo'}
                          {item.subscription?.status === 'trial' && 'Trial'}
                          {item.subscription?.status === 'cancelled' && 'Cancelado'}
                          {item.subscription?.status === 'past_due' && 'Atrasado'}
                          {!item.subscription?.status && 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.subscription?.amount 
                          ? formatCurrency(item.subscription.amount)
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.subscription?.billing_cycle === 'monthly' && 'Mensal'}
                        {item.subscription?.billing_cycle === 'yearly' && 'Anual'}
                        {!item.subscription?.billing_cycle && '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.subscription?.expires_at 
                          ? format(new Date(item.subscription.expires_at), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Sem expiração'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.subscription?.status === 'active' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Upgrade"
                                onClick={() => {
                                  setSelectedPlan('enterprise');
                                  setActionDialog({ type: 'upgrade', tenant: item.tenant });
                                }}
                              >
                                <ArrowUp className="w-4 h-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Downgrade"
                                onClick={() => {
                                  setSelectedPlan('starter');
                                  setActionDialog({ type: 'downgrade', tenant: item.tenant });
                                }}
                              >
                                <ArrowDown className="w-4 h-4 text-warning" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Cancelar"
                                onClick={() => setActionDialog({ type: 'cancel', tenant: item.tenant })}
                              >
                                <XCircle className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {item.subscription?.status === 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reativar"
                              onClick={() => setActionDialog({ type: 'reactivate', tenant: item.tenant })}
                            >
                              <RefreshCw className="w-4 h-4 text-success" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={() => setActionDialog({ type: null, tenant: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'upgrade' && 'Upgrade de Plano'}
              {actionDialog.type === 'downgrade' && 'Downgrade de Plano'}
              {actionDialog.type === 'cancel' && 'Cancelar Assinatura'}
              {actionDialog.type === 'reactivate' && 'Reativar Assinatura'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'cancel' 
                ? `Tem certeza que deseja cancelar a assinatura de ${actionDialog.tenant?.name}?`
                : actionDialog.type === 'reactivate'
                ? `Deseja reativar a assinatura de ${actionDialog.tenant?.name}?`
                : `Selecione o novo plano para ${actionDialog.tenant?.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {(actionDialog.type === 'upgrade' || actionDialog.type === 'downgrade') && (
            <div className="py-4">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter - R$ 99/mês</SelectItem>
                  <SelectItem value="professional">Professional - R$ 299/mês</SelectItem>
                  <SelectItem value="enterprise">Enterprise - R$ 999/mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, tenant: null })}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAction}
              variant={actionDialog.type === 'cancel' ? 'destructive' : 'default'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
