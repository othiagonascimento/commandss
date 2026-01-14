import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Brain,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  Coins,
  RefreshCw,
  AlertCircle,
  ChevronUp,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiagnosticsSummary {
  totals: {
    calls: number;
    tokens: number;
    costUsd: number;
    credits: number;
    avgLatencyMs: number;
  };
  last24h: {
    calls: number;
  };
  escalation: {
    layer2Rate: number;
    layer3Rate: number;
    escalationTrend: Array<{
      day: string;
      layer_1_calls: number;
      layer_2_calls: number;
      layer_3_calls: number;
    }>;
  };
  modelDistribution: Array<{
    model: string;
    calls: number;
    percentage: number;
    avgLatency: number;
    tokens: number;
    cost: number;
  }>;
}

interface TenantConsumption {
  tenantId: string;
  tenantName: string;
  totalCalls: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  lastAiCall: string;
  creditsConsumed: number;
}

interface LiveFeedItem {
  id: string;
  model: string;
  tenantId: string;
  tenantName: string;
  stage: string;
  latencyMs: number;
  tokens: number;
  costUsd: number;
  confidence: number;
  hasObjection: boolean;
  createdAt: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getLayerFromModel(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes('flash') || lower.includes('router') || lower.includes('layer_1')) {
    return 'Router';
  }
  if (lower.includes('pro') || lower.includes('standard') || lower.includes('layer_2')) {
    return 'Standard';
  }
  if (lower.includes('sonnet') || lower.includes('opus') || lower.includes('elite') || lower.includes('layer_3')) {
    return 'Elite';
  }
  return 'Outro';
}

function getLayerColor(layer: string): string {
  switch (layer) {
    case 'Router': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'Standard': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'Elite': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function AIDiagnostics() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['ai-diagnostics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<DiagnosticsSummary>('master-ai-diagnostics', {
        body: null,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });

  const { data: tenantConsumption, isLoading: tenantsLoading } = useQuery({
    queryKey: ['ai-diagnostics-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<TenantConsumption[]>('master-ai-diagnostics/by-tenant', {
        body: null,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });

  const { data: liveFeed, isLoading: feedLoading, refetch: refetchFeed } = useQuery({
    queryKey: ['ai-diagnostics-feed'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<LiveFeedItem[]>('master-ai-diagnostics/live-feed', {
        body: null,
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchSummary(), refetchFeed()]);
    setIsRefreshing(false);
  };

  const isLoading = summaryLoading || tenantsLoading || feedLoading;

  return (
    <DashboardLayout>
      <PageHeader
        title="Diagnóstico de IA"
        description="Monitoramento em tempo real do motor de inteligência artificial"
        icon={Brain}
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
        }
      />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chamadas (mês)</p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{formatNumber(summary?.totals.calls || 0)}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatNumber(summary?.last24h.calls || 0)} nas últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Créditos Consumidos</p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{formatNumber(summary?.totals.credits || 0)}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ~R$ {((summary?.totals.credits || 0) / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Usados</p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{formatNumber(summary?.totals.tokens || 0)}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-chart-2/10">
                <Zap className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latência Média</p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{summary?.totals.avgLatencyMs || 0}ms</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-chart-3/10">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Escalação</p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">
                    {((summary?.escalation.layer2Rate || 0) + (summary?.escalation.layer3Rate || 0)).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <ChevronUp className="h-5 w-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              L2: {summary?.escalation.layer2Rate || 0}% | L3: {summary?.escalation.layer3Rate || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Model Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Modelo</CardTitle>
            <CardDescription>Uso de cada modelo de IA no mês</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : summary?.modelDistribution && summary.modelDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.modelDistribution}
                        dataKey="calls"
                        nameKey="model"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {summary.modelDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${formatNumber(value)} chamadas`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {summary.modelDistribution.slice(0, 5).map((model, index) => (
                    <div key={model.model} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {model.model}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{model.percentage}%</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatNumber(model.calls)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Sem dados de uso
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escalation Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Escalação</CardTitle>
            <CardDescription>Chamadas por camada nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : summary?.escalation.escalationTrend && summary.escalation.escalationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={summary.escalation.escalationTrend.slice(0, 14).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis className="text-xs fill-muted-foreground" tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="layer_1_calls" 
                    name="Router (L1)" 
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="layer_2_calls" 
                    name="Standard (L2)" 
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="layer_3_calls" 
                    name="Elite (L3)" 
                    stackId="1"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Sem dados de escalação
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants and Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tenants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Top Consumidores
                </CardTitle>
                <CardDescription>Tenants com maior consumo de IA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : tenantConsumption && tenantConsumption.length > 0 ? (
              <div className="space-y-3">
                {tenantConsumption.slice(0, 8).map((tenant, index) => (
                  <div 
                    key={tenant.tenantId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{tenant.tenantName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tenant.totalCalls)} chamadas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatNumber(tenant.creditsConsumed || 0)} créditos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(tenant.totalTokens || 0)} tokens
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum consumo registrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  Feed em Tempo Real
                </CardTitle>
                <CardDescription>Últimas chamadas de IA</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Auto-refresh 30s
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {feedLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : liveFeed && liveFeed.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {liveFeed.slice(0, 15).map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getLayerColor(getLayerFromModel(item.model)))}
                        >
                          {getLayerFromModel(item.model)}
                        </Badge>
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {item.tenantName}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.latencyMs}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {formatNumber(item.tokens || 0)} tokens
                      </span>
                      {item.hasObjection && (
                        <Badge variant="secondary" className="text-xs">
                          Objeção
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhuma chamada recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
