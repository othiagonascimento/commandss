import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Activity,
  CreditCard,
  UserPlus,
  Target,
} from 'lucide-react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: number;
  loading?: boolean;
}

function StatCard({ title, value, description, icon: Icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "gap-1",
                  trend >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </Badge>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { overview, revenue, isLoading, error, refetch } = useMasterDashboard();

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
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema multi-tenant
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Erro ao carregar dados</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={refetch}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total de Tenants"
            value={overview ? formatNumber(overview.tenants.total) : '-'}
            description={`${overview?.tenants.active || 0} ativos`}
            icon={Building2}
            loading={isLoading}
          />
          <StatCard
            title="Usuários Totais"
            value={overview ? formatNumber(overview.usage.total_users) : '-'}
            icon={Users}
            loading={isLoading}
          />
          <StatCard
            title="Leads Totais"
            value={overview ? formatNumber(overview.usage.total_leads) : '-'}
            icon={Target}
            loading={isLoading}
          />
          <StatCard
            title="MRR"
            value={revenue ? formatCurrency(revenue.mrr) : '-'}
            trend={revenue?.growth_percentage}
            icon={DollarSign}
            loading={isLoading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Mensagens Enviadas"
            value={overview ? formatNumber(overview.usage.total_messages) : '-'}
            icon={MessageSquare}
            loading={isLoading}
          />
          <StatCard
            title="Assinaturas Ativas"
            value={overview ? formatNumber(overview.subscriptions.active) : '-'}
            description={`${overview?.subscriptions.trial || 0} em trial`}
            icon={CreditCard}
            loading={isLoading}
          />
          <StatCard
            title="Novos Tenants (7d)"
            value={overview ? formatNumber(overview.recent_activity.new_tenants_7d) : '-'}
            icon={UserPlus}
            loading={isLoading}
          />
          <StatCard
            title="Novos Leads (7d)"
            value={overview ? formatNumber(overview.recent_activity.new_leads_7d) : '-'}
            icon={Activity}
            loading={isLoading}
          />
        </div>

        {/* Plans Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Plano</CardTitle>
              <CardDescription>Tenants por tipo de plano</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : overview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                      <span className="font-medium">Basic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{overview.tenants.basic}</span>
                      <span className="text-muted-foreground text-sm">
                        ({Math.round((overview.tenants.basic / overview.tenants.total) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="font-medium">Pro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{overview.tenants.pro}</span>
                      <span className="text-muted-foreground text-sm">
                        ({Math.round((overview.tenants.pro / overview.tenants.total) * 100)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <span className="font-medium">Enterprise</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{overview.tenants.enterprise}</span>
                      <span className="text-muted-foreground text-sm">
                        ({Math.round((overview.tenants.enterprise / overview.tenants.total) * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status das Assinaturas</CardTitle>
              <CardDescription>Visão geral das assinaturas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : overview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="font-medium">Ativas</span>
                    </div>
                    <span className="text-2xl font-bold">{overview.subscriptions.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-info" />
                      <span className="font-medium">Em Trial</span>
                    </div>
                    <span className="text-2xl font-bold">{overview.subscriptions.trial}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="font-medium">Canceladas</span>
                    </div>
                    <span className="text-2xl font-bold">{overview.subscriptions.cancelled}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <CardTitle>Receita</CardTitle>
            <CardDescription>Métricas financeiras do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : revenue ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">MRR</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(revenue.mrr)}</p>
                  {revenue.growth_percentage !== undefined && (
                    <Badge variant="secondary" className={cn("mt-2", revenue.growth_percentage >= 0 ? "text-success" : "text-destructive")}>
                      {revenue.growth_percentage >= 0 ? '+' : ''}{revenue.growth_percentage}%
                    </Badge>
                  )}
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">ARR</p>
                  <p className="text-3xl font-bold">{formatCurrency(revenue.arr)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-3xl font-bold">{formatCurrency(revenue.total)}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados de receita disponíveis</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
