import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from 'recharts';

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

// Custom tooltip for charts
function CustomTooltip({ active, payload, label, valuePrefix = '', valueSuffix = '' }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {valuePrefix}{formatNumber(entry.value)}{valueSuffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function Index() {
  const [chartView, setChartView] = useState<'mrr' | 'growth' | 'activity'>('mrr');
  const { overview, revenue, timeSeries, isLoading, error, refetch } = useMasterDashboard();

  const chartData = timeSeries?.data || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema multi-tenant"
        icon={LayoutDashboard}
        actions={
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

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

        {/* Charts Section */}
        <Card className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Evolução Temporal</CardTitle>
              <CardDescription>Métricas dos últimos 12 meses</CardDescription>
            </div>
            <Tabs value={chartView} onValueChange={(v) => setChartView(v as typeof chartView)}>
              <TabsList>
                <TabsTrigger value="mrr" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">MRR</span>
                </TabsTrigger>
                <TabsTrigger value="growth" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Crescimento</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Atividade</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            ) : (
              <div className="h-[350px]">
                {chartView === 'mrr' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                      <Area
                        type="monotone"
                        dataKey="mrr"
                        name="MRR"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorMrr)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {chartView === 'growth' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                      />
                      <Bar 
                        dataKey="tenants" 
                        name="Tenants" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="users" 
                        name="Usuários" 
                        fill="hsl(var(--chart-2))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartView === 'activity' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="leads" 
                        name="Leads" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="messages" 
                        name="Mensagens" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Plans Distribution & Status */}
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
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-muted-foreground h-2 rounded-full transition-all"
                      style={{ width: `${(overview.tenants.basic / overview.tenants.total) * 100}%` }}
                    />
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
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(overview.tenants.pro / overview.tenants.total) * 100}%` }}
                    />
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
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full transition-all"
                      style={{ width: `${(overview.tenants.enterprise / overview.tenants.total) * 100}%` }}
                    />
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <span className="font-medium">Ativas</span>
                    </div>
                    <span className="text-3xl font-bold text-success">{overview.subscriptions.active}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-info/5 border border-info/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-info" />
                      </div>
                      <span className="font-medium">Em Trial</span>
                    </div>
                    <span className="text-3xl font-bold text-info">{overview.subscriptions.trial}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      </div>
                      <span className="font-medium">Canceladas</span>
                    </div>
                    <span className="text-3xl font-bold text-destructive">{overview.subscriptions.cancelled}</span>
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
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : revenue ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">MRR</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(revenue.mrr)}</p>
                  {revenue.growth_percentage !== undefined && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "mt-3 gap-1",
                        revenue.growth_percentage >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {revenue.growth_percentage >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {revenue.growth_percentage >= 0 ? '+' : ''}{revenue.growth_percentage}% este mês
                    </Badge>
                  )}
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">ARR</p>
                  <p className="text-4xl font-bold">{formatCurrency(revenue.arr)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Receita anual recorrente</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">Receita Total</p>
                  <p className="text-4xl font-bold">{formatCurrency(revenue.total)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Histórico acumulado</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados de receita disponíveis</p>
            )}
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}
