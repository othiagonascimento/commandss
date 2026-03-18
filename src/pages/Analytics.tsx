import { useState } from 'react';
import { safeArray } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart3, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  Percent,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { analyticsApi } from '@/services/masterApi';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { TenantSelector } from '@/components/ui/tenant-selector';
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
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface CohortData {
  cohort: string;
  total: number;
  month_1: number;
  month_2: number;
  month_3: number;
  month_4: number;
  month_5: number;
  month_6: number;
}

interface ChurnRiskTenant {
  id: string;
  name: string;
  risk_score: number;
  risk_factors: string[];
  last_activity: string;
  mrr: number;
  days_since_login: number;
}

interface RevenueBreakdown {
  by_plan: Array<{ plan: string; revenue: number; count: number }>;
  by_period: Array<{ month: string; revenue: number; new: number; churned: number }>;
  by_sales_rep: Array<{ name: string; revenue: number; tenants: number }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '0.0%';
  return `${value.toFixed(1)}%`;
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
              {valuePrefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}{valueSuffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function CohortTable({ data }: { data: CohortData[] }) {
  const getRetentionColor = (value: number) => {
    if (value >= 80) return 'bg-success/20 text-success';
    if (value >= 60) return 'bg-success/10 text-success';
    if (value >= 40) return 'bg-warning/20 text-warning';
    if (value >= 20) return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Cohort</TableHead>
            <TableHead className="text-center">Clientes</TableHead>
            <TableHead className="text-center">Mês 1</TableHead>
            <TableHead className="text-center">Mês 2</TableHead>
            <TableHead className="text-center">Mês 3</TableHead>
            <TableHead className="text-center">Mês 4</TableHead>
            <TableHead className="text-center">Mês 5</TableHead>
            <TableHead className="text-center">Mês 6</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.cohort}>
              <TableCell className="font-medium">{row.cohort}</TableCell>
              <TableCell className="text-center">{row.total}</TableCell>
              <TableCell className="text-center">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRetentionColor(row.month_1))}>
                  {formatPercent(row.month_1)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRetentionColor(row.month_2))}>
                  {formatPercent(row.month_2)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRetentionColor(row.month_3))}>
                  {formatPercent(row.month_3)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRetentionColor(row.month_4))}>
                  {formatPercent(row.month_4)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRetentionColor(row.month_5))}>
                  {formatPercent(row.month_5)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getRetentionColor(row.month_6))}>
                  {formatPercent(row.month_6)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ChurnRiskCard({ tenant }: { tenant: ChurnRiskTenant }) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-destructive bg-destructive/10 border-destructive/30';
    if (score >= 50) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-success bg-success/10 border-success/30';
  };

  return (
    <Card className={cn("border", getRiskColor(tenant.risk_score))}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold">{tenant.name}</h4>
            <p className="text-sm text-muted-foreground">{formatCurrency(tenant.mrr)}/mês</p>
          </div>
          <Badge className={getRiskColor(tenant.risk_score)}>
            {tenant.risk_score}% risco
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {tenant.days_since_login} dias sem login
          </div>
          <div className="flex flex-wrap gap-1">
            {tenant.risk_factors.map((factor, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {factor}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState('6m');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['billing-analytics', period, selectedTenantId],
    queryFn: async () => {
      const suffix = selectedTenantId
        ? `billing-intelligence?period=${period}&tenant_id=${selectedTenantId}`
        : `billing-intelligence?period=${period}`;
      const result = await analyticsApi.custom(suffix);
      if (result.error) throw new Error(result.error);
      const raw = result.data || {};
      return {
        cohort: safeArray<CohortData>(raw.cohort),
        churn_risk: safeArray<ChurnRiskTenant>(raw.churn_risk),
        revenue_breakdown: {
          by_plan: safeArray(raw.revenue_breakdown?.by_plan),
          by_period: safeArray(raw.revenue_breakdown?.by_period),
          by_sales_rep: safeArray(raw.revenue_breakdown?.by_sales_rep),
        },
        metrics: raw.metrics || { ltv: 0, cac: 0, ltv_cac_ratio: 0, churn_rate: 0, expansion_revenue: 0, net_revenue_retention: 0 },
      };
    },
    staleTime: 300000,
  });

  const cohortData = analyticsData?.cohort || [];
  const churnRisk = analyticsData?.churn_risk || [];
  const revenueBreakdown = analyticsData?.revenue_breakdown || { by_plan: [], by_period: [], by_sales_rep: [] };
  const metrics = analyticsData?.metrics || {
    ltv: 0,
    cac: 0,
    ltv_cac_ratio: 0,
    churn_rate: 0,
    expansion_revenue: 0,
    net_revenue_retention: 0,
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Inteligência de Receita"
        description="Análise avançada de cohort, LTV, churn e receita"
        icon={BarChart3}
        actions={
          <div className="flex gap-2">
            <TenantSelector
              value={selectedTenantId}
              onChange={setSelectedTenantId}
              placeholder="Todas as Lojas"
            />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Educational Banner */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 py-4">
          <BarChart3 className="h-8 w-8 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-primary">Métricas de SaaS Avançadas</h3>
            <p className="text-sm text-muted-foreground">
              LTV (Lifetime Value) mostra o valor total de um cliente. CAC (Custo de Aquisição) é quanto custa trazer um cliente.
              A relação LTV/CAC ideal é &gt;3x. Churn é a taxa de cancelamento mensal.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">LTV</span>
              <HelpTooltip 
                title="Lifetime Value" 
                description="Valor médio que um cliente gera durante toda sua vida útil na plataforma."
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-xl font-bold">{formatCurrency(metrics.ltv)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">CAC</span>
              <HelpTooltip 
                title="Custo de Aquisição" 
                description="Investimento médio para conquistar cada novo cliente (marketing + vendas)."
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-xl font-bold">{formatCurrency(metrics.cac)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">LTV/CAC</span>
              <HelpTooltip 
                title="Relação LTV/CAC" 
                description="Retorno sobre investimento em aquisição. Ideal é acima de 3x."
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={cn("text-xl font-bold", metrics.ltv_cac_ratio >= 3 ? "text-success" : "text-warning")}>
                {metrics.ltv_cac_ratio.toFixed(1)}x
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Churn</span>
              <HelpTooltip 
                title="Taxa de Cancelamento" 
                description="Porcentagem de clientes que cancelam por mês. Ideal é abaixo de 5%."
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={cn("text-xl font-bold", metrics.churn_rate <= 5 ? "text-success" : "text-destructive")}>
                {formatPercent(metrics.churn_rate)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Expansão</span>
              <HelpTooltip 
                title="Receita de Expansão" 
                description="Receita adicional de clientes existentes (upgrades, add-ons)."
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-xl font-bold text-success">{formatCurrency(metrics.expansion_revenue)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">NRR</span>
              <HelpTooltip 
                title="Net Revenue Retention" 
                description="Retenção líquida de receita considerando churn e expansão. Acima de 100% significa crescimento orgânico."
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={cn("text-xl font-bold", metrics.net_revenue_retention >= 100 ? "text-success" : "text-warning")}>
                {formatPercent(metrics.net_revenue_retention)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analyses */}
      <Tabs defaultValue="cohort" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="cohort" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Análise de Cohort</span>
            <span className="sm:hidden">Cohort</span>
          </TabsTrigger>
          <TabsTrigger value="churn" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Risco de Churn</span>
            <span className="sm:hidden">Churn</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Breakdown de Receita</span>
            <span className="sm:hidden">Receita</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Tendências</span>
            <span className="sm:hidden">Tendências</span>
          </TabsTrigger>
        </TabsList>

        {/* Cohort Analysis */}
        <TabsContent value="cohort">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Retenção por Cohort
                <HelpTooltip 
                  title="Análise de Cohort" 
                  description="Agrupa clientes pelo mês de entrada e mostra quantos permanecem ativos ao longo do tempo. Permite identificar problemas de retenção."
                />
              </CardTitle>
              <CardDescription>
                Porcentagem de clientes retidos por mês após a aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : cohortData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Dados insuficientes para análise de cohort</p>
                </div>
              ) : (
                <CohortTable data={cohortData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Risk */}
        <TabsContent value="churn">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Clientes em Risco de Churn
                <HelpTooltip 
                  title="Previsão de Churn" 
                  description="Score calculado com base em: dias sem login, queda de uso, tickets de suporte, e padrões históricos de cancelamento."
                />
              </CardTitle>
              <CardDescription>
                Clientes com maior probabilidade de cancelamento nos próximos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[140px]" />
                  ))}
                </div>
              ) : churnRisk.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-success">Nenhum cliente em risco alto!</p>
                  <p className="text-sm">Todos os clientes estão saudáveis</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {churnRisk.map((tenant: ChurnRiskTenant) => (
                    <ChurnRiskCard key={tenant.id} tenant={tenant} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Breakdown */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Plano</CardTitle>
                <CardDescription>Distribuição de MRR entre os planos</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueBreakdown.by_plan} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis type="category" dataKey="plan" width={100} />
                        <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                        <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Sales Rep */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Vendedor</CardTitle>
                <CardDescription>Performance da equipe comercial</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : revenueBreakdown.by_sales_rep.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>Sem dados de vendedores</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revenueBreakdown.by_sales_rep.map((rep: { name: string; revenue: number; tenants: number }, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{rep.name}</p>
                          <p className="text-sm text-muted-foreground">{rep.tenants} clientes</p>
                        </div>
                        <p className="font-bold">{formatCurrency(rep.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Receita</CardTitle>
              <CardDescription>MRR, novos clientes e churn ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueBreakdown.by_period}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip valuePrefix="R$ " />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="MRR"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="new" 
                        name="Novos" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="churned" 
                        name="Cancelados" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
