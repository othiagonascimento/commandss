import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useAlerts, useResolvedAlerts, type AlertRecord } from '@/hooks/useAlerts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Radio,
  Activity,
  Shield,
  Cpu,
  Wifi,
  WifiOff,
  Brain,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  ChevronDown,
  ExternalLink,
  History,
  Copy,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const severityConfig: Record<string, { color: string; borderColor: string; icon: React.ElementType; label: string }> = {
  critical: { color: 'bg-destructive text-destructive-foreground', borderColor: 'border-destructive/50 animate-pulse', icon: ShieldAlert, label: 'Crítico' },
  warning: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', borderColor: 'border-amber-500/40', icon: AlertTriangle, label: 'Atenção' },
  info: { color: 'bg-primary/10 text-primary', borderColor: 'border-border', icon: Activity, label: 'Info' },
};

const alertTypeLabels: Record<string, string> = {
  queue_overload: 'Fila Sobrecarregada',
  channel_down: 'Canal Desconectado',
  ai_leak: 'Vazamento de IA',
  trial_expiring: 'Trial Expirando',
  limit_reached: 'Limite Atingido',
  cron_failure: 'Cron Falhando',
  security_alert: 'Segurança',
  user_inconsistency: 'Inconsistência',
};

const reasonLabels: Record<string, string> = {
  manual_fix: 'Corrigido manualmente',
  false_positive: 'Falso positivo',
  auto_resolved: 'Resolvido automaticamente',
  escalated: 'Escalado',
};

// Quick action links per alert type
function getQuickAction(alert: AlertRecord): { label: string; path: string; icon: React.ElementType } | null {
  const tenantId = alert.tenant_id || (alert.metadata?.tenant_id as string);
  switch (alert.alert_type) {
    case 'user_inconsistency':
      return tenantId ? { label: 'Ir para Usuários', path: `/tenants/${tenantId}`, icon: Users } : null;
    case 'channel_down':
      return tenantId ? { label: 'Ver Tenant', path: `/tenants/${tenantId}`, icon: Wifi } : null;
    case 'trial_expiring':
      return { label: 'Ir para Assinaturas', path: '/subscriptions', icon: CreditCard };
    case 'limit_reached':
      return tenantId ? { label: 'Ajustar Limites', path: `/tenants/${tenantId}`, icon: Settings } : null;
    default:
      return null;
  }
}

function StatCard({ title, value, subtitle, icon: Icon, status }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
}) {
  const statusColors = {
    green: 'text-emerald-500',
    yellow: 'text-amber-500',
    red: 'text-destructive',
    neutral: 'text-primary',
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', statusColors[status || 'neutral'])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// Human-readable metadata labels per alert type
const metadataLabels: Record<string, Record<string, string>> = {
  user_inconsistency: {
    users_without_usage: 'Usuários sem registro de uso',
    profiles_without_role: 'Perfis sem role atribuída',
    orphan_profiles: 'Perfis órfãos (sem auth)',
    affected_users: 'Usuários afetados',
    tenant_name: 'Tenant',
    tenant_id: 'ID do Tenant',
  },
  queue_overload: {
    pending: 'Eventos pendentes',
    failed: 'Eventos falhados',
    processing: 'Em processamento',
    queue_type: 'Tipo de fila',
    by_type: 'Distribuição por tipo',
  },
  channel_down: {
    instance_id: 'ID da Instância',
    channel_id: 'ID do Canal',
    last_heartbeat: 'Último heartbeat',
    tenant_name: 'Tenant',
    status: 'Status',
    downtime_minutes: 'Tempo offline (min)',
  },
  trial_expiring: {
    days_remaining: 'Dias restantes',
    trial_end: 'Fim do trial',
    tenant_name: 'Tenant',
    plan_type: 'Plano atual',
  },
  limit_reached: {
    limit_type: 'Tipo de limite',
    current_value: 'Valor atual',
    max_value: 'Limite máximo',
    usage_percent: 'Uso (%)',
    tenant_name: 'Tenant',
  },
  cron_failure: {
    job_name: 'Nome do Job',
    schedule: 'Agendamento',
    consecutive_failures: 'Falhas consecutivas',
    last_success: 'Último sucesso',
    lag_seconds: 'Atraso (seg)',
  },
  ai_leak: {
    leak_type: 'Tipo de vazamento',
    context: 'Contexto',
    tenant_name: 'Tenant',
    message_id: 'ID da Mensagem',
  },
  security_alert: {
    alert_source: 'Fonte',
    severity_detail: 'Detalhamento',
    tenant_name: 'Tenant',
    ip_address: 'IP',
  },
};

// Resolution instructions per alert type
const resolutionGuide: Record<string, { what: string; howToFix: string[]; where: string }> = {
  user_inconsistency: {
    what: 'Existem perfis de usuário no banco que não possuem role atribuída ou não possuem registros na tabela user_usage. Isso pode causar erros de permissão e inconsistências nos relatórios.',
    howToFix: [
      'Acesse o tenant afetado e verifique os usuários na aba "Equipe"',
      'Para perfis sem role: atribua a role correta (admin, manager ou seller)',
      'Para perfis sem usage: execute a recalculação de uso do tenant',
      'Se são usuários de teste/inativos, considere desativá-los',
    ],
    where: 'Tenants → Detalhe do Tenant → Equipe',
  },
  queue_overload: {
    what: 'A fila de eventos está acumulando mais itens do que o normal, indicando possível lentidão ou falha no processamento.',
    howToFix: [
      'Verifique o status do cron job "process-event-queue"',
      'Analise se há eventos falhados que estão travando a fila',
      'Considere reiniciar o worker de processamento',
    ],
    where: 'Centro de Operações → Filas',
  },
  channel_down: {
    what: 'Um canal de comunicação (WhatsApp/Meta) está desconectado há mais de 2 horas. Mensagens não estão sendo enviadas nem recebidas.',
    howToFix: [
      'Verifique a conexão do WhatsApp no tenant afetado',
      'Solicite que o tenant faça login novamente no WhatsApp Web',
      'Verifique se o token Meta não expirou',
    ],
    where: 'Tenants → Detalhe do Tenant → Canais',
  },
  trial_expiring: {
    what: 'O período de trial de um tenant está prestes a expirar. Após o vencimento, o acesso será limitado.',
    howToFix: [
      'Entre em contato com o tenant sobre a conversão para plano pago',
      'Verifique se há interesse em extensão do trial',
      'Acesse Assinaturas para ativar o plano correto',
    ],
    where: 'Assinaturas',
  },
  limit_reached: {
    what: 'Um tenant está próximo ou atingiu o limite de uso do plano (leads, mensagens, storage, etc).',
    howToFix: [
      'Verifique qual limite foi atingido no detalhe do tenant',
      'Considere upgrade de plano ou ajuste de limites customizados',
      'Notifique o tenant sobre a situação',
    ],
    where: 'Tenants → Detalhe do Tenant → Limites',
  },
  cron_failure: {
    what: 'Um job agendado falhou em 2+ execuções consecutivas. Funcionalidades dependentes podem estar comprometidas.',
    howToFix: [
      'Verifique os logs do cron job no painel do Supabase',
      'Analise se há erro de timeout ou de conexão',
      'Considere reiniciar o job manualmente',
    ],
    where: 'Centro de Operações → Cron Jobs',
  },
  ai_leak: {
    what: 'A IA enviou informações sensíveis ou fora do escopo permitido (dados de outros tenants, informações pessoais, etc).',
    howToFix: [
      'Analise o contexto e a mensagem que gerou o leak',
      'Ajuste as system prompts e guardrails da IA',
      'Revise as regras de bloqueio no template do tenant',
    ],
    where: 'Templates → Editor de IA',
  },
  security_alert: {
    what: 'Foi detectada uma atividade suspeita: login incomum, tentativa de acesso não autorizado, ou vulnerabilidade.',
    howToFix: [
      'Revise os logs de acesso do usuário/IP suspeito',
      'Considere bloquear ou redefinir a senha do usuário',
      'Verifique se há dados comprometidos',
    ],
    where: 'Centro de Operações → Segurança',
  },
};

function getHumanLabel(alertType: string, key: string): string {
  return metadataLabels[alertType]?.[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatMetaValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Try to format as date
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try { return new Date(value).toLocaleString('pt-BR'); } catch { return value; }
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '(nenhum)';
    return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
  }
  return JSON.stringify(value);
}

// Contextual metadata renderer per alert type
function AlertMetadataPanel({ alert }: { alert: AlertRecord }) {
  const meta = alert.metadata || {};
  const entries = Object.entries(meta).filter(([k]) => k !== 'tenant_name' && k !== 'tenant_id');
  const guide = resolutionGuide[alert.alert_type];

  return (
    <div className="mt-2 space-y-3">
      {/* What is this alert */}
      {guide && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
          <p className="font-semibold text-primary text-xs uppercase tracking-wider mb-1.5">📋 O que significa este alerta?</p>
          <p className="text-foreground/80 text-[13px] leading-relaxed">{guide.what}</p>
        </div>
      )}

      {/* Metadata details */}
      {entries.length > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-2 border border-border/50">
          <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider mb-1">📊 Dados do Alerta</p>
          {entries.map(([key, value]) => (
            <div key={key} className="flex gap-2 items-baseline">
              <span className="font-medium text-foreground min-w-[180px] shrink-0">
                {getHumanLabel(alert.alert_type, key)}:
              </span>
              <span className="text-muted-foreground break-all font-mono">
                {Array.isArray(value) && value.length > 0
                  ? value.map((v, i) => (
                      <span key={i} className="inline-block bg-background rounded px-1.5 py-0.5 mr-1 mb-0.5 border text-foreground">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    ))
                  : formatMetaValue(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* How to fix */}
      {guide && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider mb-1.5">🔧 Como resolver?</p>
          <ol className="list-decimal list-inside space-y-1 text-[13px] text-foreground/80">
            {guide.howToFix.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Onde:</span> {guide.where}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Operations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [alertToResolve, setAlertToResolve] = useState<AlertRecord | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveReason, setResolveReason] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const { snapshot, alerts, alertCount, history, isLoading, refetch } = useOpsHealth();
  const { resolve, isResolving } = useAlerts();
  
  // History tab state
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const resolvedAlerts = useResolvedAlerts(
    20,
    historyPage * 20,
    undefined,
    historyTypeFilter === 'all' ? undefined : historyTypeFilter
  );

  const snapshotData = (snapshot as Record<string, unknown>)?.snapshot_data as Record<string, unknown> | undefined;
  const snapshotCreatedAt = (snapshot as Record<string, unknown>)?.created_at as string | undefined;

  // Extract metrics from snapshot
  const eq = snapshotData?.event_queue as Record<string, unknown> | undefined;
  const mq = snapshotData?.message_queue as Record<string, unknown> | undefined;
  const channels = snapshotData?.channels as Record<string, unknown[]> | undefined;
  const ai = snapshotData?.ai_performance as Record<string, unknown> | undefined;
  const cron = snapshotData?.cron_health as { jobs?: Array<Record<string, unknown>> } | undefined;
  const security = snapshotData?.security as Record<string, number> | undefined;
  const userConsistency = snapshotData?.user_consistency as Record<string, number> | undefined;

  const eqPending = (eq?.pending as number) ?? 0;
  const eqFailed = (eq?.failed as number) ?? 0;
  const mqPending = (mq?.pending as number) ?? 0;
  const whatsappChannels = (channels?.whatsapp ?? []) as Array<Record<string, unknown>>;
  const metaChannels = (channels?.meta ?? []) as Array<Record<string, unknown>>;
  const connectedChannels = whatsappChannels.filter(w => w.connection_status === 'connected').length + metaChannels.filter(m => m.is_active).length;
  const totalChannels = whatsappChannels.length + metaChannels.length;
  const cronJobs = cron?.jobs ?? [];
  const failedCrons = cronJobs.filter(j => ((j.consecutive_failures as number) ?? 0) >= 2).length;

  const queueStatus = eqPending > 200 || mqPending > 50 ? 'red' : eqPending > 100 ? 'yellow' : 'green';
  const channelStatus = whatsappChannels.some(w => w.is_active && w.connection_status !== 'connected') ? 'red' : totalChannels > 0 ? 'green' : 'neutral';

  const chartData = history.map((h) => {
    const m = h.metrics as Record<string, Record<string, number>>;
    return {
      hour: new Date(h.hour).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      event_pending: m?.event_queue?.pending ?? 0,
      msg_pending: m?.message_queue?.pending ?? 0,
      ai_latency: m?.ai_performance?.latency_avg ?? 0,
    };
  }).reverse();

  const eventTypeBreakdown = Object.entries((eq?.by_type as Record<string, number>) ?? {}).map(([type, count]) => ({
    type,
    count,
  }));

  const noData = !snapshotData;

  const toggleExpanded = (id: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleResolve = () => {
    if (!alertToResolve || !resolveNotes.trim() || !resolveReason) return;
    resolve(
      { alertId: alertToResolve.id, notes: resolveNotes.trim(), reason: resolveReason },
      {
        onSuccess: () => {
          setAlertToResolve(null);
          setResolveNotes('');
          setResolveReason('');
        },
      }
    );
  };

  const renderAlertCard = (alert: AlertRecord) => {
    const config = severityConfig[alert.severity] || severityConfig.info;
    const Icon = config.icon;
    const meta = alert.metadata || {};
    const tenantName = (meta.tenant_name as string) || null;
    const quickAction = getQuickAction(alert);
    const isExpanded = expandedAlerts.has(alert.id);
    const scopeLabel = tenantName
      ? tenantName
      : alert.tenant_id
        ? `Tenant ${alert.tenant_id.slice(0, 8)}...`
        : 'Global (todos os tenants)';

    return (
      <div key={alert.id} className={cn('rounded-lg border-2 transition-all', config.borderColor)}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(alert.id)}>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn('p-1.5 rounded mt-0.5', config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {alertTypeLabels[alert.alert_type] || alert.alert_type}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-medium text-foreground">Escopo:</span> {scopeLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Detalhes <ChevronDown className={cn('h-3 w-3 ml-1 transition-transform', isExpanded && 'rotate-180')} />
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setAlertToResolve(alert);
                    setResolveNotes('');
                    setResolveReason('');
                  }}
                  disabled={isResolving}
                >
                  Resolver
                </Button>
              </div>
            </div>
          </div>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              <AlertMetadataPanel alert={alert} />
              <div className="flex items-center gap-2 flex-wrap">
                {quickAction && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate(quickAction.path)}
                  >
                    <quickAction.icon className="h-3 w-3 mr-1" />
                    {quickAction.label}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(alert.id);
                    toast.info('ID copiado');
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copiar ID
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Centro de Operações"
        description={snapshotCreatedAt
          ? `Último snapshot: ${formatDistanceToNow(new Date(snapshotCreatedAt), { addSuffix: true, locale: ptBR })}`
          : 'Aguardando primeiro snapshot do CRM'
        }
        icon={Radio}
        actions={
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Atualizar
          </Button>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Alertas Ativos"
          value={alertCount}
          subtitle={alertCount > 0 ? `${alerts.filter(a => a.severity === 'critical').length} crítico(s)` : 'Tudo operacional'}
          icon={ShieldAlert}
          status={alertCount > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Filas"
          value={noData ? '-' : `${eqPending + mqPending}`}
          subtitle={noData ? 'Sem dados' : `Event: ${eqPending} | Msg: ${mqPending} | Failed: ${eqFailed}`}
          icon={Activity}
          status={noData ? 'neutral' : queueStatus}
        />
        <StatCard
          title="Canais"
          value={noData ? '-' : `${connectedChannels}/${totalChannels}`}
          subtitle={noData ? 'Sem dados' : connectedChannels === totalChannels ? 'Todos conectados' : `${totalChannels - connectedChannels} desconectado(s)`}
          icon={Wifi}
          status={noData ? 'neutral' : channelStatus}
        />
        <StatCard
          title="Cron Jobs"
          value={noData ? '-' : `${cronJobs.length - failedCrons}/${cronJobs.length}`}
          subtitle={noData ? 'Sem dados' : failedCrons > 0 ? `${failedCrons} falhando` : 'Todos OK'}
          icon={Cpu}
          status={noData ? 'neutral' : failedCrons > 0 ? 'red' : 'green'}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="queues">Filas</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Métricas das Últimas 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                      <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="event_pending" name="Event Queue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="msg_pending" name="Msg Queue" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Ativos</CardTitle>
              <CardDescription>{alerts.length === 0 ? 'Nenhum alerta ativo' : `${alerts.length} alerta(s)`}</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                  <p>Tudo operacional</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(renderAlertCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUEUES TAB */}
        <TabsContent value="queues" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Queue</CardTitle>
                <CardDescription>Fila central de processamento</CardDescription>
              </CardHeader>
              <CardContent>
                {noData ? (
                  <p className="text-muted-foreground text-sm">Aguardando dados do CRM</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-amber-500">{eqPending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{(eq?.processing as number) ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Processing</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{eqFailed}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Message Queue</CardTitle>
                <CardDescription>Fila de envio de mensagens</CardDescription>
              </CardHeader>
              <CardContent>
                {noData ? (
                  <p className="text-muted-foreground text-sm">Aguardando dados do CRM</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-amber-500">{mqPending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">{(mq?.sent as number) ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{(mq?.failed as number) ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {eventTypeBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis dataKey="type" type="category" width={140} className="text-xs fill-muted-foreground" />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CHANNELS TAB */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Instances</CardTitle>
            </CardHeader>
            <CardContent>
              {noData || whatsappChannels.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados de instâncias WhatsApp</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instância</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsappChannels.map((ch, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{(ch.name as string) || `Instância ${i + 1}`}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ch.connection_status === 'connected' ? (
                              <Wifi className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-sm">{(ch.connection_status as string) || 'unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ch.is_active ? 'default' : 'secondary'}>
                            {ch.is_active ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {metaChannels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Canais Meta (Instagram/Messenger)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metaChannels.map((ch, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{(ch.name as string) || `Canal ${i + 1}`}</TableCell>
                        <TableCell>{(ch.type as string) || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={ch.is_active ? 'default' : 'secondary'}>
                            {ch.is_active ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Latência Média" value={noData ? '-' : `${((ai?.latency_avg as number) ?? 0).toFixed(0)}ms`} icon={Clock} status="neutral" />
            <StatCard title="Taxa de Fallback" value={noData ? '-' : `${(((ai?.fallback_rate as number) ?? 0) * 100).toFixed(1)}%`} icon={Brain} status={((ai?.fallback_rate as number) ?? 0) > 0.3 ? 'yellow' : 'green'} />
            <StatCard title="Leaks Detectados" value={noData ? '-' : String((ai?.leak_count as number) ?? 0)} icon={ShieldAlert} status={((ai?.leak_count as number) ?? 0) > 0 ? 'red' : 'green'} />
            <StatCard title="Taxa de Escalação" value={noData ? '-' : `${(((ai?.escalation_rate as number) ?? 0) * 100).toFixed(1)}%`} icon={Activity} status="neutral" />
          </div>

          {ai?.by_layer && (
            <Card>
              <CardHeader><CardTitle>Uso por Layer</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ai.by_layer as Record<string, number>).map(([layer, count]) => (
                    <div key={layer} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{layer}</span>
                      <span className="text-sm text-muted-foreground">{count} chamadas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CRON TAB */}
        <TabsContent value="cron">
          <Card>
            <CardHeader>
              <CardTitle>Cron Jobs</CardTitle>
              <CardDescription>Status de execução dos jobs agendados</CardDescription>
            </CardHeader>
            <CardContent>
              {noData || cronJobs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem dados de cron jobs</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Último Sucesso</TableHead>
                      <TableHead>Lag (s)</TableHead>
                      <TableHead>Falhas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronJobs.map((job, i) => {
                      const failures = (job.consecutive_failures as number) ?? 0;
                      const status = failures >= 2 ? 'red' : failures >= 1 ? 'yellow' : 'green';
                      const statusColor = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-destructive' };
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{(job.name as string) || `Job ${i + 1}`}</TableCell>
                          <TableCell className="text-sm">
                            {job.last_success
                              ? formatDistanceToNow(new Date(job.last_success as string), { addSuffix: true, locale: ptBR })
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>{(job.lag_seconds as number) ?? '-'}</TableCell>
                          <TableCell>{failures}</TableCell>
                          <TableCell>
                            <div className={cn('h-3 w-3 rounded-full', statusColor[status])} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Alertas Abertos" value={noData ? '-' : String(security?.open_alerts ?? 0)} icon={Shield} status={(security?.high_severity_count ?? 0) > 0 ? 'red' : 'green'} />
            <StatCard title="Alta Severidade" value={noData ? '-' : String(security?.high_severity_count ?? 0)} icon={ShieldAlert} status={(security?.high_severity_count ?? 0) > 0 ? 'red' : 'green'} />
            <StatCard title="Inconsistências" value={noData ? '-' : String((userConsistency?.profiles_without_role ?? 0) + (userConsistency?.users_without_usage ?? 0))} subtitle={noData ? '' : `${userConsistency?.profiles_without_role ?? 0} sem role | ${userConsistency?.users_without_usage ?? 0} sem usage`} icon={Activity} status={(userConsistency?.profiles_without_role ?? 0) > 0 ? 'yellow' : 'green'} />
          </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" /> Histórico de Alertas Resolvidos
                  </CardTitle>
                  <CardDescription>Rastreabilidade completa de todas as resoluções</CardDescription>
                </div>
                <Select value={historyTypeFilter} onValueChange={v => { setHistoryTypeFilter(v); setHistoryPage(0); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(alertTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {resolvedAlerts.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !resolvedAlerts.data?.length ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mb-2 opacity-30" />
                  <p>Nenhum alerta resolvido encontrado</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Resolvido em</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolvedAlerts.data.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {alertTypeLabels[alert.alert_type] || alert.alert_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">{alert.title}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-[10px]', severityConfig[alert.severity]?.color)}>
                              {severityConfig[alert.severity]?.label || alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {alert.resolution_reason ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {reasonLabels[alert.resolution_reason] || alert.resolution_reason}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                            {alert.resolved_notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Página {historyPage + 1}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)}>
                        Anterior
                      </Button>
                      <Button variant="outline" size="sm" disabled={(resolvedAlerts.data?.length || 0) < 20} onClick={() => setHistoryPage(p => p + 1)}>
                        Próxima
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog with Notes */}
      <Dialog open={!!alertToResolve} onOpenChange={(open) => { if (!open) setAlertToResolve(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Resolver Alerta
            </DialogTitle>
            <DialogDescription>
              Revise todos os detalhes abaixo, registre a ação tomada e confirme a resolução.
            </DialogDescription>
          </DialogHeader>
          {alertToResolve && (() => {
            const rConfig = severityConfig[alertToResolve.severity] || severityConfig.info;
            const rMeta = alertToResolve.metadata || {};
            const rTenantName = (rMeta.tenant_name as string) || null;
            const rScopeLabel = rTenantName
              ? rTenantName
              : alertToResolve.tenant_id
                ? `Tenant ${alertToResolve.tenant_id.slice(0, 8)}...`
                : 'Global (todos os tenants)';
            const rGuide = resolutionGuide[alertToResolve.alert_type];
            const rMetaEntries = Object.entries(rMeta).filter(([k]) => k !== 'tenant_name' && k !== 'tenant_id');

            return (
              <div className="space-y-4">
                {/* Alert header */}
                <div className={cn('p-4 rounded-lg border-2 space-y-2', rConfig.borderColor)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {alertTypeLabels[alertToResolve.alert_type] || alertToResolve.alert_type}
                    </Badge>
                    <Badge className={cn('text-[10px]', rConfig.color)}>
                      {rConfig.label}
                    </Badge>
                  </div>
                  <p className="font-semibold text-base">{alertToResolve.title}</p>
                  <p className="text-sm text-muted-foreground">{alertToResolve.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span><span className="font-medium text-foreground">Escopo:</span> {rScopeLabel}</span>
                    <span><span className="font-medium text-foreground">Criado:</span> {new Date(alertToResolve.created_at).toLocaleString('pt-BR')}</span>
                    <span><span className="font-medium text-foreground">Duração:</span> {formatDistanceToNow(new Date(alertToResolve.created_at), { locale: ptBR })}</span>
                  </div>
                </div>

                {/* What this means */}
                {rGuide && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <p className="font-semibold text-primary text-xs uppercase tracking-wider mb-1">📋 O que significa</p>
                    <p className="text-foreground/80 text-[13px]">{rGuide.what}</p>
                  </div>
                )}

                {/* Metadata */}
                {rMetaEntries.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1.5 border border-border/50">
                    <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider mb-1">📊 Dados técnicos</p>
                    {rMetaEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-2 items-baseline">
                        <span className="font-medium text-foreground min-w-[180px] shrink-0">
                          {getHumanLabel(alertToResolve.alert_type, key)}:
                        </span>
                        <span className="text-muted-foreground font-mono">{formatMetaValue(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* How to fix suggestion */}
                {rGuide && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm">
                    <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider mb-1">🔧 Sugestões de resolução</p>
                    <ol className="list-decimal list-inside space-y-1 text-[13px] text-foreground/80">
                      {rGuide.howToFix.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Motivo da resolução *</Label>
                  <Select value={resolveReason} onValueChange={setResolveReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Descreva a ação tomada *</Label>
                  <Textarea
                    placeholder='Ex: "Atribuído role agent aos 6 usuários via Supabase SQL no tenant Ume Design"'
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Seja específico: o que foi feito, onde, e para quem. Isso será auditável no histórico.
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertToResolve(null)}>Cancelar</Button>
            <Button
              onClick={handleResolve}
              disabled={!resolveNotes.trim() || !resolveReason || isResolving}
            >
              {isResolving ? 'Resolvendo...' : 'Confirmar Resolução'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
