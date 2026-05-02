import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionHeader } from '@/components/ds/Surface';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { useAlerts, useResolvedAlerts, type AlertRecord } from '@/hooks/useAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Radio, Activity, Shield, Wifi, WifiOff, RefreshCw, CheckCircle2,
  AlertTriangle, ShieldAlert, Clock, History, Copy, Users, CreditCard,
  Settings, ExternalLink, Cpu, Brain, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { TenantSelector } from '@/components/ui/tenant-selector';
import { DataQualityBadge } from '@/components/quality/DataQualityBadge';
import { DataQualityNotice } from '@/components/quality/MetricValue';

// ─── Constants ────────────────────────────────────────────────────────────────

const severityConfig: Record<string, { color: string; border: string; icon: React.ElementType; label: string }> = {
  critical: { color: 'bg-destructive text-destructive-foreground', border: 'border-destructive/50 animate-pulse', icon: ShieldAlert, label: 'Crítico' },
  warning: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', border: 'border-amber-500/40', icon: AlertTriangle, label: 'Atenção' },
  info: { color: 'bg-primary/10 text-primary', border: 'border-border', icon: Activity, label: 'Info' },
};

const alertTypeLabels: Record<string, string> = {
  queue_overload: 'Fila Sobrecarregada', channel_down: 'Canal Offline', ai_leak: 'Vazamento IA',
  trial_expiring: 'Trial Expirando', limit_reached: 'Limite Atingido', cron_failure: 'Cron Falho',
  security_alert: 'Segurança', user_inconsistency: 'Inconsistência',
};

const reasonLabels: Record<string, string> = {
  manual_fix: 'Corrigido manualmente', false_positive: 'Falso positivo',
  auto_resolved: 'Resolvido automaticamente', escalated: 'Escalado',
};

const resolutionGuides: Record<string, { what: string; steps: string[] }> = {
  user_inconsistency: {
    what: 'Perfis sem role ou sem user_usage — causa erros de permissão e relatórios.',
    steps: ['Identifique os usuários afetados via Tenants → Equipe', 'Atribua roles ou execute INSERT de user_usage', 'Desative contas de teste órfãs'],
  },
  queue_overload: {
    what: 'Fila acumulando — processamento lento ou travado.',
    steps: ['Verifique o cron "process-event-queue"', 'Analise eventos falhados', 'Reinicie o worker se necessário'],
  },
  channel_down: {
    what: 'Canal WhatsApp/Meta desconectado — mensagens não chegam.',
    steps: ['Peça ao tenant reconectar o WhatsApp Web', 'Verifique expiração do token Meta', 'Confira status da instância no CRM'],
  },
  trial_expiring: {
    what: 'Trial do tenant expira em breve — acesso será limitado.',
    steps: ['Contate o tenant sobre conversão', 'Ofereça extensão se necessário', 'Ative plano em Assinaturas'],
  },
  limit_reached: {
    what: 'Tenant no limite do plano (leads, mensagens, storage).',
    steps: ['Verifique qual limite em Tenants → Limites', 'Considere upgrade de plano', 'Notifique o tenant'],
  },
  cron_failure: {
    what: 'Job agendado falhando — funcionalidades dependentes afetadas.',
    steps: ['Verifique logs do cron no Supabase', 'Analise timeouts ou erros de conexão', 'Reinicie manualmente'],
  },
  ai_leak: {
    what: 'IA enviou dados fora do escopo permitido.',
    steps: ['Analise mensagem e contexto do leak', 'Ajuste system prompts e guardrails', 'Revise regras no template'],
  },
  security_alert: {
    what: 'Atividade suspeita detectada no sistema.',
    steps: ['Revise logs de acesso', 'Considere bloquear/resetar senha', 'Verifique dados comprometidos'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQuickAction(alert: AlertRecord) {
  const tid = alert.tenant_id || (alert.metadata?.tenant_id as string);
  switch (alert.alert_type) {
    case 'user_inconsistency': return tid ? { label: 'Ver Usuários', path: `/tenants/${tid}`, icon: Users } : null;
    case 'channel_down': return tid ? { label: 'Ver Tenant', path: `/tenants/${tid}`, icon: Wifi } : null;
    case 'trial_expiring': return { label: 'Assinaturas', path: '/subscriptions', icon: CreditCard };
    case 'limit_reached': return tid ? { label: 'Ajustar Limites', path: `/tenants/${tid}`, icon: Settings } : null;
    default: return null;
  }
}

function getMetaLabel(alertType: string, key: string): string {
  const labels: Record<string, Record<string, string>> = {
    user_inconsistency: { users_without_usage: 'Sem registro de uso', profiles_without_role: 'Sem role' },
    queue_overload: { pending: 'Pendentes', failed: 'Falhados', processing: 'Processando' },
    channel_down: { downtime_minutes: 'Offline (min)', last_heartbeat: 'Último heartbeat' },
    trial_expiring: { days_remaining: 'Dias restantes' },
    limit_reached: { limit_type: 'Limite', usage_percent: 'Uso (%)' },
    cron_failure: { job_name: 'Job', consecutive_failures: 'Falhas', last_success: 'Último OK' },
  };
  return labels[alertType]?.[key] || key.replace(/_/g, ' ');
}

function fmtValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    try { return new Date(v).toLocaleString('pt-BR'); } catch { return v; }
  }
  if (Array.isArray(v)) return v.length === 0 ? '(vazio)' : v.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(', ');
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

// ─── Status Indicator ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'ok' | 'warn' | 'error' | 'off' }) {
  const colors = { ok: 'bg-emerald-500', warn: 'bg-amber-500', error: 'bg-destructive animate-pulse', off: 'bg-muted-foreground/30' };
  return <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', colors[status])} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Operations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('painel');
  const [alertToResolve, setAlertToResolve] = useState<AlertRecord | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveReason, setResolveReason] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const { snapshot, snapshotMeta, snapshotSchemaInvalid, alerts, alertCount, history, isLoading, refetch } = useOpsHealth();
  const { resolve, isResolving } = useAlerts();

  // History
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const resolvedAlerts = useResolvedAlerts(20, historyPage * 20, undefined, historyTypeFilter === 'all' ? undefined : historyTypeFilter);

  // Filter alerts by selected tenant
  const filteredAlerts = selectedTenantId
    ? alerts.filter(a => a.tenant_id === selectedTenantId || (a.metadata as Record<string, unknown>)?.tenant_id === selectedTenantId)
    : alerts;
  const filteredAlertCount = filteredAlerts.length;

  const snap = (snapshot as Record<string, unknown>)?.snapshot_data as Record<string, unknown> | undefined;
  const snapAt = (snapshot as Record<string, unknown>)?.created_at as string | undefined;

  // Metrics extraction
  const eq = snap?.event_queue as Record<string, unknown> | undefined;
  const mq = snap?.message_queue as Record<string, unknown> | undefined;
  const channels = snap?.channels as Record<string, unknown[]> | undefined;
  const ai = snap?.ai_performance as Record<string, unknown> | undefined;
  const cron = snap?.cron_health as { jobs?: Array<Record<string, unknown>> } | undefined;
  const conversations = snap?.conversations as Record<string, unknown> | undefined;

  const eqPending = (eq?.pending as number) ?? 0;
  const eqFailed = (eq?.failed as number) ?? 0;
  const mqPending = (mq?.pending as number) ?? 0;
  const whatsappChannels = (channels?.whatsapp ?? []) as Array<Record<string, unknown>>;
  const metaChannels = (channels?.meta ?? []) as Array<Record<string, unknown>>;
  const connectedWA = whatsappChannels.filter(w => w.status === 'connected').length;
  const activeMeta = metaChannels.filter(m => m.status === 'active').length;
  const cronJobs = cron?.jobs ?? [];
  const failedCrons = cronJobs.filter(j => ((j.consecutive_failures as number) ?? 0) >= 2).length;
  const activeCrons = cronJobs.filter(j => j.last_success).length;
  const noData = !snap;

  const queueStatus: 'ok' | 'warn' | 'error' = eqPending > 200 || mqPending > 50 ? 'error' : eqPending > 50 ? 'warn' : 'ok';
  const channelStatus: 'ok' | 'warn' | 'error' | 'off' = noData ? 'off' : connectedWA === whatsappChannels.length && whatsappChannels.length > 0 ? 'ok' : connectedWA > 0 ? 'warn' : whatsappChannels.length > 0 ? 'error' : 'off';
  const cronStatus: 'ok' | 'warn' | 'error' | 'off' = noData ? 'off' : failedCrons > 0 ? 'error' : 'ok';
  const alertStatus: 'ok' | 'warn' | 'error' = filteredAlertCount === 0 ? 'ok' : filteredAlerts.some(a => a.severity === 'critical') ? 'error' : 'warn';

  const handleResolve = () => {
    if (!alertToResolve || !resolveNotes.trim() || !resolveReason) return;
    resolve(
      { alertId: alertToResolve.id, notes: resolveNotes.trim(), reason: resolveReason },
      { onSuccess: () => { setAlertToResolve(null); setResolveNotes(''); setResolveReason(''); } }
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        numeral="01 /"
        label="Operação · Centro de Comando"
        title="Centro de operações"
        description={snapAt
          ? `Snapshot de ${formatDistanceToNow(new Date(snapAt), { addSuffix: true, locale: ptBR })}`
          : 'Aguardando primeiro snapshot'
        }
        icon={Radio}
        actions={
          <div className="flex items-center gap-2">
            {snapshotMeta && <DataQualityBadge meta={snapshotMeta} />}
            <TenantSelector
              value={selectedTenantId}
              onChange={setSelectedTenantId}
              placeholder="Todas as Lojas"
            />
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} /> Atualizar
            </Button>
          </div>
        }
      />

      {snapshotSchemaInvalid && (
        <DataQualityNotice
          variant="error"
          message="O snapshot de operações retornou em formato inesperado (schema v2 inválido). Os números abaixo podem estar parciais."
        />
      )}
      {snapshotMeta?.warnings && snapshotMeta.warnings.length > 0 && (
        <DataQualityNotice variant="warning" message={snapshotMeta.warnings.join(' • ')} />
      )}

      {/* ─── Status Strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatusCard label="Alertas" value={filteredAlertCount === 0 ? 'OK' : `${filteredAlertCount}`} status={alertStatus} detail={filteredAlertCount > 0 ? `${filteredAlerts.filter(a => a.severity === 'critical').length} crítico` : 'Tudo limpo'} />
        <StatusCard label="Filas" value={noData ? '—' : `${eqPending + mqPending}`} status={noData ? 'off' as any : queueStatus} detail={noData ? '' : `${eqFailed} falhados`} />
        <StatusCard label="Canais" value={noData ? '—' : `${connectedWA + activeMeta}/${whatsappChannels.length + metaChannels.length}`} status={channelStatus} detail={noData ? '' : `${whatsappChannels.length - connectedWA} offline`} />
        <StatusCard label="Cron Jobs" value={noData ? '—' : `${activeCrons}/${cronJobs.length}`} status={cronStatus} detail={noData ? '' : failedCrons > 0 ? `${failedCrons} falhando` : 'Todos OK'} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* ─── PAINEL ──────────────────────────────────────────────────── */}
        <TabsContent value="painel" className="space-y-6">

          {/* Alertas Ativos */}
          {filteredAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                {filteredAlerts.length} Alerta{filteredAlerts.length > 1 ? 's' : ''} Ativo{filteredAlerts.length > 1 ? 's' : ''}
              </h3>
              {filteredAlerts.map(alert => {
                const cfg = severityConfig[alert.severity] || severityConfig.info;
                const Icon = cfg.icon;
                const meta = alert.metadata || {};
                const tenantName = (meta.tenant_name as string) || null;
                const scope = tenantName || (alert.tenant_id ? `Tenant ${alert.tenant_id.slice(0, 8)}…` : 'Global');
                const quickAction = getQuickAction(alert);
                const metaEntries = Object.entries(meta).filter(([k]) => !['tenant_name', 'tenant_id', 'orphan_profiles'].includes(k));

                return (
                  <Card key={alert.id} className={cn('border-2', cfg.border)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-1.5 rounded', cfg.color)}><Icon className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{alert.title}</span>
                            <Badge variant="outline" className="text-[10px]">{alertTypeLabels[alert.alert_type] || alert.alert_type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>

                          {/* Inline key metrics — no expand needed */}
                          {metaEntries.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              {metaEntries.map(([k, v]) => (
                                <span key={k} className="text-xs">
                                  <span className="text-muted-foreground">{getMetaLabel(alert.alert_type, k)}:</span>{' '}
                                  <span className="font-medium text-foreground">{fmtValue(v)}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>📍 {scope}</span>
                            <span>⏱ {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {quickAction && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(quickAction.path)}>
                              <quickAction.icon className="h-3 w-3 mr-1" />{quickAction.label}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setAlertToResolve(alert); setResolveNotes(''); setResolveReason(''); }}>
                            Resolver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredAlerts.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center gap-3 py-8">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-muted-foreground">Nenhum alerta ativo — sistema operacional</span>
              </CardContent>
            </Card>
          )}

          {/* ─── Saúde do Sistema ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Canais — com nomes dos tenants */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wifi className="h-4 w-4" /> Canais por Tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noData ? (
                  <p className="text-sm text-muted-foreground">Aguardando dados</p>
                ) : whatsappChannels.length === 0 && metaChannels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem canais configurados</p>
                ) : (
                  <div className="space-y-2">
                    {whatsappChannels.map((ch, i) => (
                      <div key={`wa-${i}`} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusDot status={ch.status === 'connected' ? 'ok' : 'error'} />
                          <span className="text-sm font-medium truncate">{(ch.tenant_name as string) || 'Sem nome'}</span>
                          <Badge variant="outline" className="text-[9px] shrink-0">WhatsApp</Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ch.status !== 'connected' && ch.last_heartbeat && (
                            <span className="text-[10px] text-muted-foreground">
                              offline {formatDistanceToNow(new Date(ch.last_heartbeat as string), { locale: ptBR })}
                            </span>
                          )}
                          {ch.tenant_id && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(`/tenants/${ch.tenant_id}`)}>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {metaChannels.map((ch, i) => (
                      <div key={`meta-${i}`} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusDot status={(ch.status as string) === 'active' ? 'ok' : 'warn'} />
                          <span className="text-sm font-medium truncate">{(ch.tenant_name as string) || 'Sem nome'}</span>
                          <Badge variant="outline" className="text-[9px] shrink-0">{(ch.type as string) || 'Meta'}</Badge>
                        </div>
                        {ch.tenant_id && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(`/tenants/${ch.tenant_id}`)}>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cron Jobs — compacto */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Cron Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noData || cronJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-2">
                    {cronJobs.map((job, i) => {
                      const failures = (job.consecutive_failures as number) ?? 0;
                      const st: 'ok' | 'warn' | 'error' = failures >= 2 ? 'error' : failures >= 1 ? 'warn' : job.last_success ? 'ok' : 'off' as any;
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <StatusDot status={st} />
                            <span className="text-sm font-mono">{job.name as string}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {job.last_success ? (
                              <span>{formatDistanceToNow(new Date(job.last_success as string), { addSuffix: true, locale: ptBR })}</span>
                            ) : (
                              <span className="text-muted-foreground/50">Nunca executou</span>
                            )}
                            {failures > 0 && (
                              <Badge variant="destructive" className="text-[9px]">{failures}x falha</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Filas + IA — compact row ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniMetric label="Event Queue" value={noData ? '—' : eqPending} sub={`${eqFailed} falhados`} status={queueStatus} />
            <MiniMetric label="Message Queue" value={noData ? '—' : mqPending} sub={`${(mq?.sent as number) ?? 0} enviados`} status={mqPending > 0 ? 'warn' : 'ok'} />
            <MiniMetric label="IA Latência" value={noData ? '—' : `${((ai?.latency_avg as number) ?? 0).toFixed(0)}ms`} sub={`Fallback: ${(((ai?.fallback_rate as number) ?? 0) * 100).toFixed(0)}%`} status={((ai?.fallback_rate as number) ?? 0) > 0.3 ? 'warn' : 'ok'} />
            <MiniMetric label="Conversas" value={noData ? '—' : (conversations?.active as number) ?? 0} sub={`${(conversations?.unassigned as number) ?? 0} sem atendente`} status={((conversations?.unassigned as number) ?? 0) > 100 ? 'warn' : 'ok'} />
          </div>

          {/* Event type breakdown if there's data */}
          {eq?.by_type && Object.keys(eq.by_type as object).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Eventos por Tipo (fila)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(eq.by_type as Record<string, number>).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs font-mono">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── HISTÓRICO ───────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" /> Alertas Resolvidos
                </CardTitle>
                <Select value={historyTypeFilter} onValueChange={v => { setHistoryTypeFilter(v); setHistoryPage(0); }}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Filtrar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(alertTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {resolvedAlerts.isLoading ? (
                <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : !resolvedAlerts.data?.length ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum alerta resolvido</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead className="w-[80px]">Sev.</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead>Resolvido</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolvedAlerts.data.map(a => (
                        <TableRow key={a.id}>
                          <TableCell><Badge variant="outline" className="text-[10px]">{alertTypeLabels[a.alert_type] || a.alert_type}</Badge></TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{a.title}</TableCell>
                          <TableCell><Badge className={cn('text-[10px]', severityConfig[a.severity]?.color)}>{severityConfig[a.severity]?.label || a.severity}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.resolved_at ? new Date(a.resolved_at).toLocaleString('pt-BR') : '—'}</TableCell>
                          <TableCell className="text-xs">{a.resolution_reason ? <Badge variant="secondary" className="text-[10px]">{reasonLabels[a.resolution_reason] || a.resolution_reason}</Badge> : '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{a.resolved_notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">Página {historyPage + 1}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={(resolvedAlerts.data?.length || 0) < 20} onClick={() => setHistoryPage(p => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Resolve Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!alertToResolve} onOpenChange={open => { if (!open) setAlertToResolve(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>Registre a ação tomada para auditoria.</DialogDescription>
          </DialogHeader>
          {alertToResolve && (() => {
            const cfg = severityConfig[alertToResolve.severity] || severityConfig.info;
            const meta = alertToResolve.metadata || {};
            const tenantName = (meta.tenant_name as string) || null;
            const scope = tenantName || (alertToResolve.tenant_id ? `Tenant ${alertToResolve.tenant_id.slice(0, 8)}…` : 'Global');
            const guide = resolutionGuides[alertToResolve.alert_type];
            const metaEntries = Object.entries(meta).filter(([k]) => !['tenant_name', 'tenant_id', 'orphan_profiles'].includes(k));

            return (
              <div className="space-y-4">
                {/* Summary */}
                <div className={cn('p-3 rounded-lg border-2 space-y-1', cfg.border)}>
                  <p className="font-semibold text-sm">{alertToResolve.title}</p>
                  <p className="text-xs text-muted-foreground">{alertToResolve.description}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground pt-1">
                    <span>📍 {scope}</span>
                    <span>⏱ {formatDistanceToNow(new Date(alertToResolve.created_at), { locale: ptBR })}</span>
                  </div>
                  {metaEntries.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t border-border/50 mt-1">
                      {metaEntries.map(([k, v]) => (
                        <span key={k} className="text-[11px]">
                          <span className="text-muted-foreground">{getMetaLabel(alertToResolve.alert_type, k)}:</span>{' '}
                          <span className="font-medium">{fmtValue(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guide */}
                {guide && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs space-y-1">
                    <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Sugestão de resolução</p>
                    <p className="text-foreground/80">{guide.what}</p>
                    <ol className="list-decimal list-inside text-foreground/70 space-y-0.5 mt-1">
                      {guide.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Motivo *</Label>
                  <Select value={resolveReason} onValueChange={setResolveReason}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-sm">O que foi feito? *</Label>
                  <Textarea
                    placeholder='Ex: "Executei INSERT de user_usage para 6 perfis órfãos"'
                    value={resolveNotes}
                    onChange={e => setResolveNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertToResolve(null)}>Cancelar</Button>
            <Button onClick={handleResolve} disabled={!resolveNotes.trim() || !resolveReason || isResolving}>
              {isResolving ? 'Resolvendo…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusCard({ label, value, status, detail }: { label: string; value: string | number; status: 'ok' | 'warn' | 'error' | 'off'; detail?: string }) {
  const bg = { ok: 'bg-emerald-500/10', warn: 'bg-amber-500/10', error: 'bg-destructive/10', off: 'bg-muted' };
  const text = { ok: 'text-emerald-600 dark:text-emerald-400', warn: 'text-amber-600 dark:text-amber-400', error: 'text-destructive', off: 'text-muted-foreground' };
  return (
    <Card className={cn('border-none', bg[status])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <StatusDot status={status} />
        </div>
        <p className={cn('text-2xl font-bold mt-1', text[status])}>{value}</p>
        {detail && <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>}
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value, sub, status }: { label: string; value: string | number; sub?: string; status: 'ok' | 'warn' | 'error' }) {
  const accent = { ok: 'text-foreground', warn: 'text-amber-600 dark:text-amber-400', error: 'text-destructive' };
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className={cn('text-xl font-bold mt-0.5', accent[status])}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
