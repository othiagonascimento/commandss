import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Legend,
} from 'recharts';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Search,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ragMetricsApi,
  type RAGQualitySummary,
  type RAGTenantRanking,
  type RAGDailyTimeline,
} from '@/services/masterApi';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-destructive';
}

function getHealthBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-destructive/10 border-destructive/30';
}

interface Props {
  days: number;
  tenantId?: string;
}

export default function RAGEliteDashboard({ days, tenantId }: Props) {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['rag-summary', tenantId, days],
    queryFn: async () => {
      const r = await ragMetricsApi.getSummary(tenantId, days);
      if (r.error) throw new Error(r.error);
      return r.data as RAGQualitySummary;
    },
    staleTime: 60000,
  });

  const { data: tenantRanking, isLoading: loadingTenants } = useQuery({
    queryKey: ['rag-by-tenant', days],
    queryFn: async () => {
      const r = await ragMetricsApi.getByTenant(days);
      if (r.error) throw new Error(r.error);
      return r.data as RAGTenantRanking[];
    },
    staleTime: 60000,
    enabled: !tenantId,
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['rag-timeline', tenantId, days],
    queryFn: async () => {
      const r = await ragMetricsApi.getTimeline(tenantId, days);
      if (r.error) throw new Error(r.error);
      return r.data as RAGDailyTimeline[];
    },
    staleTime: 60000,
  });

  const healthScore = summary?.health_score ?? 0;

  // Feedback pie data
  const feedbackData = summary
    ? [
        { name: 'Positivo', value: summary.positive_count || 0 },
        { name: 'Negativo', value: summary.negative_count || 0 },
        { name: 'Editado', value: summary.edited_count || 0 },
      ].filter(d => d.value > 0)
    : [];

  const feedbackColors = ['hsl(var(--chart-2))', 'hsl(var(--destructive))', 'hsl(var(--primary))'];

  // Timeline chart data
  const timelineData = (timeline || []).map(t => ({
    date: t.date,
    'Vector Hit': +(t.vector_hit_rate * 100).toFixed(1),
    'Keyword Fallback': +(t.keyword_fallback_rate * 100).toFixed(1),
    'General Fallback': +(t.general_fallback_rate * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Health Score */}
        <Card className={cn('border', getHealthBg(healthScore))}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RAG Health Score</p>
                {loadingSummary ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <p className={cn('text-4xl font-bold', getHealthColor(healthScore))}>
                    {healthScore}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            {summary?.trend && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                {summary.trend.avg_confidence_delta >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span>vs período anterior</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vector Hit Rate */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vector Hit Rate</p>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{pct(summary?.vector_hit_rate ?? 0)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Queries com resultados vetoriais</p>
          </CardContent>
        </Card>

        {/* Avg Confidence */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Confiança Média</p>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{pct(summary?.avg_confidence ?? 0)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Score médio de confiança</p>
          </CardContent>
        </Card>

        {/* General Fallback Rate */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Fallback Geral</p>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className={cn('text-2xl font-bold', (summary?.general_fallback_rate ?? 0) > 0.2 ? 'text-destructive' : '')}>
                {pct(summary?.general_fallback_rate ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Sem resultado nenhum</p>
          </CardContent>
        </Card>

        {/* Total Queries */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queries RAG</p>
                {loadingSummary ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{summary?.total_queries ?? 0}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-chart-2/10">
                <Search className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Rates Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Hybrid RRF', value: summary.hybrid_usage_rate },
            { label: 'Reranker', value: summary.reranker_usage_rate },
            { label: 'UOPA Context', value: summary.uopa_usage_rate },
            { label: 'Product Context', value: summary.product_usage_rate },
            { label: 'Reformulação', value: summary.reformulation_rate },
            { label: 'Chunks', value: summary.chunk_usage_rate },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">{pct(item.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vector Hit vs Fallback</CardTitle>
            <CardDescription>Taxas diárias nos últimos {days} dias</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTimeline ? (
              <Skeleton className="h-[250px] w-full" />
            ) : timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis className="text-xs fill-muted-foreground" tickLine={false} unit="%" />
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Vector Hit"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="Keyword Fallback"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4))"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="General Fallback"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Sem dados de timeline RAG
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Loop</CardTitle>
            <CardDescription>Distribuição de feedback do usuário</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-[250px] w-full" />
            ) : feedbackData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feedbackData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {feedbackData.map((_, i) => (
                          <Cell key={i} fill={feedbackColors[i % feedbackColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-chart-2" />
                    <span className="text-sm">Positivo</span>
                    <span className="ml-auto font-bold">{summary?.positive_count ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Negativo</span>
                    <span className="ml-auto font-bold">{summary?.negative_count ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-primary" />
                    <span className="text-sm">Editado</span>
                    <span className="ml-auto font-bold">{summary?.edited_count ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Sem dados de feedback
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Tenant Heatmap + Top Knowledge Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Heatmap */}
        {!tenantId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Qualidade RAG por Tenant
              </CardTitle>
              <CardDescription>Health score por tenant</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTenants ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (tenantRanking || []).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(tenantRanking || []).map((t) => (
                    <div
                      key={t.tenant_id}
                      className={cn(
                        'p-3 rounded-lg border text-center',
                        getHealthBg(t.health_score)
                      )}
                    >
                      <p className="text-xs font-medium truncate">{t.tenant_name || t.tenant_id.slice(0, 8)}</p>
                      <p className={cn('text-xl font-bold', getHealthColor(t.health_score))}>
                        {t.health_score}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.total_queries} queries</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum dado de tenant
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Knowledge Items */}
        <Card className={tenantId ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Knowledge Items</CardTitle>
            <CardDescription>Itens de conhecimento mais utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (summary?.top_knowledge_items || []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Knowledge Item ID</TableHead>
                    <TableHead className="text-right">Usos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.top_knowledge_items || []).map((item, idx) => (
                    <TableRow key={item.knowledge_item_id}>
                      <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.knowledge_item_id}</TableCell>
                      <TableCell className="text-right font-bold">{item.usage_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum knowledge item encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
