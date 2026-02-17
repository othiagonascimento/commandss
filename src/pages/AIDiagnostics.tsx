import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Target,
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
import { aiAdvancedApi, type AIAdvancedData } from '@/services/masterApi';
import RAGEliteDashboard from '@/components/dashboard/RAGEliteDashboard';

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

function getLayerColor(layer: string): string {
  const lower = layer.toLowerCase();
  if (lower.includes('l1') || lower.includes('layer_1') || lower.includes('router'))
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  if (lower.includes('l2') || lower.includes('layer_2') || lower.includes('standard'))
    return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
  if (lower.includes('l3') || lower.includes('layer_3') || lower.includes('elite'))
    return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
  return 'bg-muted text-muted-foreground';
}

function getLayerLabel(layer: string): string {
  const lower = layer.toLowerCase();
  if (lower.includes('l1') || lower.includes('layer_1')) return 'Router (L1)';
  if (lower.includes('l2') || lower.includes('layer_2')) return 'Standard (L2)';
  if (lower.includes('l3') || lower.includes('layer_3')) return 'Elite (L3)';
  return layer;
}

export default function AIDiagnostics() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('motor-ia');

  const { data: aiData, isLoading, refetch } = useQuery({
    queryKey: ['ai-advanced-diagnostics', days],
    queryFn: async () => {
      const result = await aiAdvancedApi.get(days);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const summary = aiData?.summary;
  const models = aiData?.models || [];
  const layers = aiData?.layers || [];
  const providers = aiData?.providers || [];
  const tenants = aiData?.tenants || [];
  const timeline = aiData?.timeline || [];

  const timelineForChart = timeline.map(item => ({
    day: item.date,
    messages: item.messages,
    credits: item.credits,
    escalations: item.escalations,
    blocks: item.blocks,
  }));

  const layerAggregated = layers.reduce((acc, item) => {
    const label = getLayerLabel(item.layer);
    if (!acc[label]) acc[label] = 0;
    acc[label] += item.count;
    return acc;
  }, {} as Record<string, number>);

  const layerPieData = Object.entries(layerAggregated).map(([name, value]) => ({
    name,
    value,
  }));

  const providerChartData = providers.map(p => ({
    name: p.provider,
    chamadas: p.count,
    creditos: p.credits,
  }));

  return (
    <DashboardLayout>
      <PageHeader
        title="Diagnóstico de IA"
        description="Monitoramento em tempo real do motor de inteligência artificial"
        icon={Brain}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="motor-ia" className="gap-2">
            <Brain className="h-4 w-4" />
            Motor IA
          </TabsTrigger>
          <TabsTrigger value="rag-elite" className="gap-2">
            <Target className="h-4 w-4" />
            RAG Elite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="motor-ia" className="mt-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mensagens</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold">{formatNumber(summary?.total_messages || 0)}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-primary">{formatNumber(summary?.total_credits || 0)}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tokens</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold">{formatNumber(summary?.total_tokens || 0)}</p>
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
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold">{summary?.avg_latency_ms || 0}ms</p>
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
                    <p className="text-sm text-muted-foreground">Fallbacks</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold">{summary?.fallbacks || 0}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10">
                    <ShieldAlert className="h-5 w-5 text-warning" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Bloqueios: {summary?.blocks || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Row */}
          {summary && (summary.feedback_positive > 0 || summary.feedback_negative > 0 || summary.feedback_edited > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                  <ThumbsUp className="h-5 w-5 text-chart-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Feedback Positivo</p>
                    <p className="text-xl font-bold text-chart-2">{summary.feedback_positive}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                  <ThumbsDown className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">Feedback Negativo</p>
                    <p className="text-xl font-bold text-destructive">{summary.feedback_negative}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Editados</p>
                    <p className="text-xl font-bold text-primary">{summary.feedback_edited}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Modelo</CardTitle>
                <CardDescription>Uso de cada modelo de IA</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : models.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="w-[200px] h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={models}
                            dataKey="count"
                            nameKey="model"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {models.map((_, index) => (
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
                      {models.slice(0, 5).map((model, index) => (
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
                            <span className="text-sm font-bold">{model.pct.toFixed(1)}%</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({formatNumber(model.count)})
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline Diária</CardTitle>
                <CardDescription>Mensagens, créditos e escalações por dia</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : timelineForChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={timelineForChart}>
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
                        dataKey="messages" 
                        name="Mensagens" 
                        stackId="1"
                        stroke="hsl(var(--chart-2))"
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="credits" 
                        name="Créditos" 
                        stackId="2"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="escalations" 
                        name="Escalações" 
                        stackId="3"
                        stroke="hsl(var(--chart-4))"
                        fill="hsl(var(--chart-4))"
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Sem dados de timeline
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Layers + Providers Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Layer</CardTitle>
                <CardDescription>Router (L1) → Standard (L2) → Elite (L3)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : layerPieData.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="w-[180px] h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={layerPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {layerPieData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`${formatNumber(v)} chamadas`]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {layerPieData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold">{formatNumber(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Sem dados de layers
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown por Provider</CardTitle>
                <CardDescription>Google, OpenAI, Anthropic</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : providerChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={providerChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="chamadas" name="Chamadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="creditos" name="Créditos" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Sem dados de providers
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Tenants + Models Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Top Consumidores
                </CardTitle>
                <CardDescription>Tenants com maior consumo de IA</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : tenants.length > 0 ? (
                  <div className="space-y-3">
                    {tenants.slice(0, 8).map((tenant, index) => (
                      <div 
                        key={tenant.tenant_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{tenant.tenant_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(tenant.messages)} mensagens
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {formatNumber(tenant.credits)} créditos
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.escalations} escalações
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Detalhamento por Modelo
                </CardTitle>
                <CardDescription>Performance individual de cada modelo</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : models.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Latência</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.map((model) => (
                        <TableRow key={model.model}>
                          <TableCell className="font-medium text-sm">{model.model}</TableCell>
                          <TableCell className="text-right">{formatNumber(model.count)}</TableCell>
                          <TableCell className="text-right">{model.avg_latency}ms</TableCell>
                          <TableCell className="text-right">{formatNumber(model.credits)}</TableCell>
                          <TableCell className="text-right font-bold">{model.pct.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum modelo registrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rag-elite" className="mt-6">
          <RAGEliteDashboard days={days} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
