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
  ScrollText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  User,
  Building2,
  Calendar,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  Key,
  Shield,
  Settings,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HelpTooltip } from '@/components/ui/help-tooltip';

interface AuditLog {
  id: string;
  user_id: string | null;
  tenant_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined data
  user_email?: string;
  tenant_name?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'CREATE': { label: 'Criação', color: 'bg-success/10 text-success', icon: Plus },
  'UPDATE': { label: 'Atualização', color: 'bg-warning/10 text-warning', icon: Edit },
  'DELETE': { label: 'Exclusão', color: 'bg-destructive/10 text-destructive', icon: Trash2 },
  'LOGIN': { label: 'Login', color: 'bg-primary/10 text-primary', icon: Key },
  'LOGOUT': { label: 'Logout', color: 'bg-muted text-muted-foreground', icon: Key },
  'VIEW': { label: 'Visualização', color: 'bg-secondary text-secondary-foreground', icon: Eye },
  'IMPERSONATE': { label: 'Impersonação', color: 'bg-chart-4/10 text-chart-4', icon: Shield },
};

const ENTITY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  'tenant': { label: 'Tenant', icon: Building2 },
  'user': { label: 'Usuário', icon: User },
  'subscription': { label: 'Assinatura', icon: FileText },
  'template': { label: 'Template', icon: FileText },
  'settings': { label: 'Configuração', icon: Settings },
  'session': { label: 'Sessão', icon: Key },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action.toUpperCase()] || { 
    label: action, 
    color: 'bg-muted text-muted-foreground', 
    icon: FileText 
  };
}

function getEntityInfo(entity: string) {
  return ENTITY_LABELS[entity.toLowerCase()] || { 
    label: entity, 
    icon: FileText 
  };
}

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [pageSize, setPageSize] = useState<number>(50);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['activity-logs', actionFilter, entityFilter, dateRange, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('master-analytics', {
        body: {
          endpoint: 'activity-logs',
          limit: pageSize,
          filters: {
            action: actionFilter !== 'all' ? actionFilter : undefined,
            entity_type: entityFilter !== 'all' ? entityFilter : undefined,
            date_range: dateRange,
          }
        }
      });
      if (error) throw error;
      // Endpoint may return v2 envelope or raw array
      const payload = (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>))
        ? (data as { data: unknown }).data
        : data;
      return safeArray<AuditLog>(payload);
    },
    staleTime: 60000,
  });

  const filteredLogs = (logs || []).filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.user_email?.toLowerCase().includes(search) ||
      log.tenant_name?.toLowerCase().includes(search)
    );
  });

  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    
    const headers = ['Data/Hora', 'Ação', 'Tipo', 'Usuário', 'Tenant', 'IP'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      getActionInfo(log.action).label,
      getEntityInfo(log.entity_type).label,
      log.user_email || '-',
      log.tenant_name || '-',
      log.ip_address || '-',
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Logs de Atividade"
        description="Histórico completo de ações no sistema"
        icon={ScrollText}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredLogs.length}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
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
          <ScrollText className="h-8 w-8 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-primary">Auditoria Completa</h3>
            <p className="text-sm text-muted-foreground">
              Aqui você visualiza todas as ações realizadas no sistema: criações, edições, exclusões, logins e impersonações.
              Use os filtros para investigar problemas específicos ou exportar para análise externa.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, tenant, ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="CREATE">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="IMPERSONATE">Impersonação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Entidades</SelectItem>
                <SelectItem value="tenant">Tenants</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="subscription">Assinaturas</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="settings">Configurações</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24 horas</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
            <span>Registros de Atividade</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Mostrando últimos {filteredLogs.length} de até {pageSize}</Badge>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                  <SelectItem value="200">200 por página</SelectItem>
                  <SelectItem value="500">500 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
          <CardDescription>
            Histórico detalhado de todas as ações realizadas no sistema. A consulta é limitada ao tamanho da página configurado acima — para investigação completa, use Exportar CSV ou aumente o limite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum log encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Data/Hora
                      </div>
                    </TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    const entityInfo = getEntityInfo(log.entity_type);
                    const ActionIcon = actionInfo.icon;
                    const EntityIcon = entityInfo.icon;
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={actionInfo.color}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {actionInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EntityIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{entityInfo.label}</span>
                            {log.entity_id && (
                              <span className="text-xs text-muted-foreground font-mono">
                                #{log.entity_id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">
                              {log.user_email || 'Sistema'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.tenant_name ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[120px]">{log.tenant_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
