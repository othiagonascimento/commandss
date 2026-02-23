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
  BarChart,
  Bar,
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
  Clock,
  Star,
  MessageSquare,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/help-tooltip';
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

  // Channel distribution pie data
  const channelData = summary?.channel_distribution
    ? Object.entries(summary.channel_distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  // Latency by tenant (bar chart)
  const latencyByTenant = (tenantRanking || [])
    .filter(t => t.avg_latency_ms > 0)
    .sort((a, b) => b.avg_latency_ms - a.avg_latency_ms)
    .slice(0, 10)
    .map(t => ({
      name: t.tenant_name || t.tenant_id.slice(0, 8),
      latency: Math.round(t.avg_latency_ms),
    }));

  // CQS ranking
  const cqsRanking = (tenantRanking || [])
    .filter(t => t.avg_cqs > 0)
    .sort((a, b) => b.avg_cqs - a.avg_cqs);

  // A/B testing data
  const variantStats = summary?.prompt_variant_stats || [];

  return (
    <div className="space-y-6">
      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Health Score */}
        <Card className={cn('border', getHealthBg(healthScore))}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">RAG Health Score <HelpTooltip description="Nota geral da qualidade das respostas da IA. Combina taxa de acerto vetorial (40%), confiança média (30%) e taxa de fallback (30%). Acima de 80 é ótimo." /></p>
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
            <p className="text-sm text-muted-foreground flex items-center">Vector Hit Rate <HelpTooltip description="Percentual de perguntas em que a IA encontrou informações relevantes na base de conhecimento. Quanto maior, melhor — significa que a base está bem alimentada." example="90% = a cada 10 perguntas, 9 foram respondidas com dados reais." /></p>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{pct(summary?.vector_hit_rate ?? 0)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Buscas com resultado na base</p>
          </CardContent>
        </Card>

        {/* Avg Confidence */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center">Confiança Média <HelpTooltip description="Nível de certeza que a IA tem ao responder. Quanto maior, mais segura ela está de que a resposta é correta. Abaixo de 60% indica que a base de conhecimento precisa de melhorias." /></p>
            {loadingSummary ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{pct(summary?.avg_confidence ?? 0)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Certeza média das respostas</p>
          </CardContent>
        </Card>

        {/* CQS */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">CQS Médio <HelpTooltip description="Conversation Quality Score — nota de qualidade da conversa inteira. Combina relevância, clareza e satisfação do cliente. De 0 a 1, sendo 0.8+ excelente." /></p>
                {loadingSummary ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{(summary?.avg_cqs ?? 0).toFixed(2)}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-chart-3/10">
                <Star className="h-5 w-5 text-chart-3" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Nota geral de qualidade da conversa</p>
          </CardContent>
        </Card>

        {/* Total Queries */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">Queries RAG <HelpTooltip description="Total de perguntas que passaram pelo sistema de busca inteligente (RAG) no período. Cada pergunta de cliente gera uma query." /></p>
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

      {/* Latency + Usage Rates */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> RAG <HelpTooltip description="Tempo que o sistema leva para buscar informações na base de conhecimento." /></p>
              <p className="text-lg font-bold">{Math.round(summary.avg_latency_rag_ms)}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> LLM <HelpTooltip description="Tempo que o modelo de IA leva para gerar a resposta após receber as informações." /></p>
              <p className="text-lg font-bold">{Math.round(summary.avg_latency_llm_ms)}ms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Total <HelpTooltip description="Tempo total de resposta = busca (RAG) + geração (LLM). É o que o cliente percebe." /></p>
              <p className="text-lg font-bold">{Math.round(summary.avg_latency_total_ms)}ms</p>
            </CardContent>
          </Card>
          {[
            { label: 'Hybrid RRF', value: summary.hybrid_usage_rate, tip: 'Busca híbrida que combina vetorial + palavras-chave para resultados mais precisos.' },
            { label: 'Reranker', value: summary.reranker_usage_rate, tip: 'Reordena os resultados por relevância antes de enviar para a IA. Melhora a qualidade.' },
            { label: 'UOPA Ctx', value: summary.uopa_usage_rate, tip: 'Uso do contexto da loja (identidade, regras) nas respostas. Quanto maior, mais personalizado.' },
            { label: 'Product Ctx', value: summary.product_usage_rate, tip: 'Inclusão de dados de produtos nas respostas. Importante para perguntas sobre catálogo.' },
            { label: 'Reformulação', value: summary.reformulation_rate, tip: 'Vezes em que a IA reformulou a pergunta do cliente para buscar melhor. Indica perguntas ambíguas.' },
            { label: 'Chunks', value: summary.chunk_usage_rate, tip: 'Uso de trechos específicos da base de conhecimento. Quanto maior, mais precisa a resposta.' },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground flex items-center">{item.label} <HelpTooltip description={item.tip} /></p>
                <p className="text-lg font-bold">{pct(item.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row 1: Timeline + Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">Vector Hit vs Fallback <HelpTooltip description="Mostra a evolução diária entre respostas com dados reais (Vector Hit) e respostas genéricas (Fallback). O ideal é Vector Hit alto e Fallback baixo." /></CardTitle>
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
                  <Area type="monotone" dataKey="Vector Hit" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="Keyword Fallback" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="General Fallback" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
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
            <CardTitle className="text-lg flex items-center">Feedback Loop <HelpTooltip description="Avaliações dos clientes sobre as respostas da IA. Positivo = resposta útil. Negativo = resposta insatisfatória. Editado = operador corrigiu a resposta." /></CardTitle>
            <CardDescription>Como os clientes avaliam as respostas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-[250px] w-full" />
            ) : feedbackData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={feedbackData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
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

      {/* Charts Row 2: Channel Distribution + Latency by Tenant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Distribuição de Canais
              <HelpTooltip description="De onde vêm as perguntas dos clientes — WhatsApp, Instagram, Messenger, etc. Ajuda a priorizar melhorias por canal." />
            </CardTitle>
            <CardDescription>Perguntas por canal de atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-[250px] w-full" />
            ) : channelData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {channelData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {channelData.map((ch, i) => (
                    <div key={ch.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{ch.name}</span>
                      <span className="ml-auto font-bold text-sm">{ch.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Sem dados de canais
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latency by Tenant */}
        {!tenantId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Latência Média por Loja
                <HelpTooltip description="Tempo médio de resposta por loja. Lojas com latência alta podem ter bases de conhecimento muito grandes ou problemas de configuração." />
              </CardTitle>
              <CardDescription>Top 10 lojas por tempo de resposta (ms)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTenants ? (
                <Skeleton className="h-[250px] w-full" />
              ) : latencyByTenant.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={latencyByTenant} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" unit="ms" className="text-xs fill-muted-foreground" />
                    <YAxis dataKey="name" type="category" width={80} className="text-xs fill-muted-foreground" tickLine={false} />
                    <Tooltip formatter={(v: number) => [`${v}ms`, 'Latência']} />
                    <Bar dataKey="latency" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Sem dados de latência
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row 3: CQS Ranking + A/B Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CQS Ranking by Tenant */}
        {!tenantId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-4 w-4" />
                CQS por Loja
                <HelpTooltip description="Ranking de qualidade das conversas por loja. Lojas com CQS baixo podem precisar de ajustes no prompt ou na base de conhecimento." />
              </CardTitle>
              <CardDescription>Ranking de qualidade das conversas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTenants ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : cqsRanking.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">CQS</TableHead>
                      <TableHead className="text-right">Queries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cqsRanking.slice(0, 10).map((t, idx) => (
                      <TableRow key={t.tenant_id}>
                        <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{t.tenant_name || t.tenant_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={t.avg_cqs >= 0.8 ? 'default' : t.avg_cqs >= 0.5 ? 'secondary' : 'destructive'}>
                            {t.avg_cqs.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{t.total_queries}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">Sem dados de CQS</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* A/B Testing Results */}
        <Card className={tenantId ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              A/B Testing de Prompts
              <HelpTooltip description="Comparação entre diferentes versões de prompt para ver qual gera respostas melhores. A variante com maior CQS e confiança é a mais eficaz." />
            </CardTitle>
            <CardDescription>Qual versão de prompt funciona melhor</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-[200px] w-full" />
            ) : variantStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variante</TableHead>
                    <TableHead className="text-right">Queries</TableHead>
                    <TableHead className="text-right">CQS Médio</TableHead>
                    <TableHead className="text-right">Confiança</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variantStats.map((v) => (
                    <TableRow key={v.prompt_variant}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {v.prompt_variant}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">{v.total}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={v.avg_cqs >= 0.8 ? 'default' : v.avg_cqs >= 0.5 ? 'secondary' : 'destructive'}>
                          {v.avg_cqs.toFixed(3)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{pct(v.avg_confidence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhum teste A/B ativo
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
                Qualidade RAG por Loja
                <HelpTooltip description="Visão geral de saúde do RAG por loja. Verde (80+) = excelente, Amarelo (50-79) = precisa atenção, Vermelho (&lt;50) = crítico." />
              </CardTitle>
              <CardDescription>Nota de saúde por loja</CardDescription>
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
            <CardTitle className="text-lg flex items-center">Top 10 Knowledge Items <HelpTooltip description="Os 10 trechos da base de conhecimento mais usados pela IA para responder perguntas. Útil para entender quais informações são mais procuradas pelos clientes." /></CardTitle>
            <CardDescription>Conteúdos mais usados nas respostas</CardDescription>
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
