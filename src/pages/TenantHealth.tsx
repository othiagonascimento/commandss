import { useState } from 'react';
import { safeArray } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TenantHealthData {
  id: string;
  name: string;
  subdomain: string;
  plan_type: string;
  health_score: number;
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

function getHealthColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getHealthBgColor(score: number) {
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
            <Progress value={tenant.health_score} className="w-20 h-2" />
            <span className={cn("font-bold text-lg", getHealthColor(tenant.health_score))}>
              {tenant.health_score}
            </span>
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

  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['tenant-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('master-analytics', {
        body: { endpoint: 'tenant-health' }
      });
      if (error) throw error;
      return safeArray<TenantHealthData>(data);
    },
    staleTime: 60000,
  });

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
        case 'health_score':
          return a.health_score - b.health_score; // Lower first (needs attention)
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
        title="Saúde dos Tenants"
        description="Monitore o status e performance de cada cliente"
        icon={HeartPulse}
        actions={
          <div className="flex gap-2">
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

      {/* Educational Banner */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 py-4">
          <HeartPulse className="h-8 w-8 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-primary">Monitoramento Proativo</h3>
            <p className="text-sm text-muted-foreground">
              O score de saúde é calculado com base em: atividade recente, uso de recursos, erros, 
              e engajamento dos usuários. Tenants com score baixo precisam de atenção imediata.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-success">Saudáveis</span>
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold mt-1 text-success">{summary.healthy}</p>
          </CardContent>
        </Card>
        <Card className="border-warning/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-warning">Atenção</span>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <p className="text-2xl font-bold mt-1 text-warning">{summary.warning}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-destructive">Críticos</span>
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{summary.critical}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Inativos</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{summary.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou subdomínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="healthy">Saudáveis</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="critical">Críticos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health_score">Score (menor primeiro)</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
                <SelectItem value="activity">Última Atividade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[280px]" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <HeartPulse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum tenant encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <TenantHealthCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
