import { useState } from 'react';
import { safeArray } from '@/lib/utils';
import { useMasterRead } from '@/hooks/useMasterRead';
import { callMasterApiRaw } from '@/services/masterApi';
import { TenantHealthListSchema } from '@/lib/masterSchemas';
import { DataQualityBadge } from '@/components/quality/DataQualityBadge';
import { DataQualityNotice } from '@/components/quality/MetricValue';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface, SectionHeader } from '@/components/ds/Surface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  HeartPulse, 
  Search, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingDown,
  TrendingUp,
  Users,
  MessageSquare,
  Building2,
  Eye,
  Bell,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TenantHealthData {
  id: string;
  name: string;
  subdomain: string;
  plan_type: string;
  health_score: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'inactive';
  last_activity: string | null;
  metrics: {
    active_users: number;
    total_users: number;
    messages_24h: number;
    messages_trend: number;
    leads_7d: number;
    error_count: number;
    storage_used_percent: number;
    ai_tokens_used_percent: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
  }>;
}

function getHealthColor(score: number | null) {
  if (score == null) return 'text-muted-foreground';
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getHealthBgColor(score: number | null) {
  if (score == null) return 'bg-muted';
  if (score >= 80) return 'bg-success/10';
  if (score >= 50) return 'bg-warning/10';
  return 'bg-destructive/10';
}

function getStatusInfo(status: TenantHealthData['status']) {
  switch (status) {
    case 'healthy':
      return { label: 'Saudável', icon: CheckCircle, color: 'text-success bg-success/10' };
    case 'warning':
      return { label: 'Atenção', icon: AlertTriangle, color: 'text-warning bg-warning/10' };
    case 'critical':
      return { label: 'Crítico', icon: XCircle, color: 'text-destructive bg-destructive/10' };
    case 'inactive':
      return { label: 'Inativo', icon: Clock, color: 'text-muted-foreground bg-muted' };
    default:
      return { label: 'Desconhecido', icon: Activity, color: 'text-muted-foreground bg-muted' };
  }
}

function TenantHealthCard({ tenant }: { tenant: TenantHealthData }) {
  const navigate = useNavigate();
  const statusInfo = getStatusInfo(tenant.status);
  const StatusIcon = statusInfo.icon;
  
  return (
    <Card className={cn(
      "transition-all hover:shadow-md cursor-pointer",
      tenant.status === 'critical' && "border-destructive/50",
      tenant.status === 'warning' && "border-warning/50"
    )} onClick={() => navigate(`/tenants/${tenant.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", getHealthBgColor(tenant.health_score))}>
              <Building2 className={cn("h-5 w-5", getHealthColor(tenant.health_score))} />
            </div>
            <div>
              <CardTitle className="text-base">{tenant.name}</CardTitle>
              <CardDescription className="font-mono text-xs">{tenant.subdomain}</CardDescription>
            </div>
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Score de Saúde</span>
          <div className="flex items-center gap-2">
            {tenant.health_score == null ? (
              <span className="text-xs text-muted-foreground italic">Sem dados</span>
            ) : (
              <>
                <Progress value={tenant.health_score} className="w-20 h-2" />
                <span className={cn("font-bold text-lg", getHealthColor(tenant.health_score))}>
                  {tenant.health_score}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Usuários Ativos:</span>
            <span className="font-medium">{tenant.metrics.active_users}/{tenant.metrics.total_users}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Msgs 24h:</span>
            <span className="font-medium">{tenant.metrics.messages_24h}</span>
            {tenant.metrics.messages_trend !== 0 && (
              tenant.metrics.messages_trend > 0 
                ? <TrendingUp className="h-3 w-3 text-success" />
                : <TrendingDown className="h-3 w-3 text-destructive" />
            )}
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Armazenamento</span>
            <span className={cn(
              "font-medium",
              tenant.metrics.storage_used_percent > 90 && "text-destructive",
              tenant.metrics.storage_used_percent > 75 && "text-warning"
            )}>
              {tenant.metrics.storage_used_percent}%
            </span>
          </div>
          <Progress 
            value={tenant.metrics.storage_used_percent} 
            className={cn(
              "h-1",
              tenant.metrics.storage_used_percent > 90 && "[&>div]:bg-destructive",
              tenant.metrics.storage_used_percent > 75 && "[&>div]:bg-warning"
            )}
          />
        </div>

        {/* Alerts */}
        {tenant.alerts.length > 0 && (
          <div className="space-y-1">
            {tenant.alerts.slice(0, 2).map((alert, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-center gap-2 text-xs p-2 rounded",
                  alert.type === 'error' && "bg-destructive/10 text-destructive",
                  alert.type === 'warning' && "bg-warning/10 text-warning",
                  alert.type === 'info' && "bg-primary/10 text-primary"
                )}
              >
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Last Activity */}
        {tenant.last_activity && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
            Última atividade: {formatDistanceToNow(new Date(tenant.last_activity), { locale: ptBR, addSuffix: true })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TenantHealth() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('health_score');

  const healthRead = useMasterRead({
    widget: 'tenant-health.list',
    queryKey: ['tenant-health-v2'],
    queryFn: () => callMasterApiRaw('master-analytics', 'GET', 'tenant-health'),
    dataSchema: TenantHealthListSchema,
    options: { staleTime: 60_000 },
  });
  const healthData = safeArray<TenantHealthData>(healthRead.data as unknown);
  const isLoading = healthRead.isLoading;
  const refetch = healthRead.refetch;

  const filteredTenants = (healthData || [])
    .filter(tenant => {
      if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        tenant.name.toLowerCase().includes(search) ||
        tenant.subdomain.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'health_score': {
          // Tenants with null score go to the end (no data → can't prioritize)
          const av = a.health_score ?? Number.POSITIVE_INFINITY;
          const bv = b.health_score ?? Number.POSITIVE_INFINITY;
          return av - bv; // Lower first (needs attention)
        }
        case 'name':
          return a.name.localeCompare(b.name);
        case 'activity':
          if (!a.last_activity) return 1;
          if (!b.last_activity) return -1;
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
        default:
          return 0;
      }
    });

  // Summary stats
  const summary = {
    total: healthData?.length || 0,
    healthy: healthData?.filter(t => t.status === 'healthy').length || 0,
    warning: healthData?.filter(t => t.status === 'warning').length || 0,
    critical: healthData?.filter(t => t.status === 'critical').length || 0,
    inactive: healthData?.filter(t => t.status === 'inactive').length || 0,
  };

  return (
    <DashboardLayout>
      <PageHeader
        numeral="02 /"
        label="Operação · Saúde por Tenant"
        title="Saúde dos tenants"
        description="Score realtime, status operacional e performance individual de cada cliente"
        icon={HeartPulse}
        actions={
          <div className="flex items-center gap-2">
            {healthRead.meta && <DataQualityBadge meta={healthRead.meta} />}
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Configurar Alertas
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        }
      />

      {healthRead.schemaInvalid && (
        <DataQualityNotice
          variant="error"
          message="A lista de saúde dos tenants veio em formato inesperado (schema v2 inválido). Os cards podem estar parciais."
        />
      )}
      {healthRead.meta?.warnings && healthRead.meta.warnings.length > 0 && (
        <DataQualityNotice variant="warning" message={healthRead.meta.warnings.join(' • ')} />
      )}

      {/* Resumo numérico */}
      <section className="space-y-4 mb-8">
        <SectionHeader
          numeral="01 /"
          label="Distribuição"
          title="Status atual da base"
          description="Score realtime calculado a partir de atividade, recursos, erros e engajamento"
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total, tone: 'muted' as const, Icon: Building2 },
            { label: 'Saudáveis', value: summary.healthy, tone: 'success' as const, Icon: CheckCircle },
            { label: 'Atenção', value: summary.warning, tone: 'warning' as const, Icon: AlertTriangle },
            { label: 'Críticos', value: summary.critical, tone: 'destructive' as const, Icon: XCircle },
            { label: 'Inativos', value: summary.inactive, tone: 'muted' as const, Icon: Clock },
          ].map(({ label, value, tone, Icon }) => (
            <Surface key={label} variant="raised" className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn(
                  'editorial-label',
                  tone === 'success' && 'text-success',
                  tone === 'warning' && 'text-warning',
                  tone === 'destructive' && 'text-destructive',
                  tone === 'muted' && 'text-muted-foreground',
                )}>{label}</span>
                <Icon className={cn(
                  'h-4 w-4',
                  tone === 'success' && 'text-success',
                  tone === 'warning' && 'text-warning',
                  tone === 'destructive' && 'text-destructive',
                  tone === 'muted' && 'text-muted-foreground',
                )} />
              </div>
              <p className={cn(
                'font-display text-3xl font-bold tracking-tight mt-2',
                tone === 'success' && 'text-success',
                tone === 'warning' && 'text-warning',
                tone === 'destructive' && 'text-destructive',
              )}>{value}</p>
            </Surface>
          ))}
        </div>
      </section>

      {/* Lista filtrável */}
      <section className="space-y-4">
        <SectionHeader
          numeral="02 /"
          label="Diretório"
          title="Tenants monitorados"
          description={filteredTenants.length > 0 ? `${filteredTenants.length} resultado(s)` : undefined}
          actions={
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="healthy">Saudáveis</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="critical">Críticos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[170px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health_score">Score (menor)</SelectItem>
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                  <SelectItem value="activity">Última atividade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[280px]" />
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <Surface variant="raised" className="text-center py-12 text-muted-foreground">
            <HeartPulse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum tenant encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </Surface>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTenants.map((tenant) => (
              <TenantHealthCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        )}
      </section>

    </DashboardLayout>
  );
}
