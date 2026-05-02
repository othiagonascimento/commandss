import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tenantsApi, Tenant } from '@/services/masterApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState as ShadEmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  Power,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowUpRight,
  MapPin,
  Users,
  ExternalLink,
  Edit,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Surface, SectionHeader } from '@/components/ds/Surface';
import { StatusDot, Tag } from '@/components/ds/Atoms';
import { AnimatedCounter } from '@/components/ds/AnimatedCounter';

type PlanTone = 'neutral' | 'plasma' | 'ember' | 'jade' | 'cobalt';
const planTone = (plan: string): PlanTone => {
  switch ((plan || '').toLowerCase()) {
    case 'enterprise': return 'ember';
    case 'pro': return 'plasma';
    case 'basic': return 'cobalt';
    default: return 'neutral';
  }
};

function fmtNum(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat('pt-BR').format(v);
}

export default function Tenants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [tenantToToggle, setTenantToToggle] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants', page, search, planFilter, statusFilter],
    queryFn: async () => {
      const result = await tenantsApi.list({
        page,
        limit,
        search: search || undefined,
        plan_type: planFilter !== 'all' ? planFilter : undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      });
      return result.data;
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) return tenantsApi.deactivate(id);
      return tenantsApi.update(id, { is_active: true, status: 'active' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success(variables.isActive ? 'Tenant desativado' : 'Tenant ativado');
      setTenantToToggle(null);
    },
    onError: (error) => toast.error('Erro ao alterar status: ' + (error as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => tenantsApi.deletePermanently(id),
    onMutate: async (id) => {
      setTenantToDelete(null);
      toast.loading('Excluindo tenant...', { id: `delete-${id}` });
      await queryClient.cancelQueries({ queryKey: ['tenants'] });
      const previousData = queryClient.getQueryData(['tenants', page, search, planFilter, statusFilter]);
      queryClient.setQueryData(['tenants', page, search, planFilter, statusFilter], (old: typeof data) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((t: Tenant) => t.id !== id), total: old.total - 1 };
      });
      return { previousData };
    },
    onSuccess: (_, id) => {
      toast.success('Tenant excluído permanentemente', { id: `delete-${id}` });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tenants', page, search, planFilter, statusFilter], context.previousData);
      }
      toast.error('Erro ao excluir: ' + (error as Error).message, { id: `delete-${id}` });
    },
  });

  const tenants = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const kpis = useMemo(() => {
    const active = tenants.filter((t: Tenant) => t.is_active).length;
    const trial = tenants.filter((t: Tenant) => t.subscription_status === 'trialing' || t.trial_enabled).length;
    const enterprise = tenants.filter((t: Tenant) => t.plan_type === 'enterprise').length;
    return { active, trial, enterprise };
  }, [tenants]);

  const hasFilters = !!search || planFilter !== 'all' || statusFilter !== 'all';

  return (
    <DashboardLayout>
      {/* ─── 01 HERO EDITORIAL ─────────────────────────────────────── */}
      <section className="mb-8 sm:mb-10 animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-baseline gap-3">
            <span className="editorial-numeral">01 /</span>
            <span className="editorial-label">Empresas</span>
            <span className="editorial-label text-ink-faint hidden sm:inline">·</span>
            <span className="editorial-label text-ink-faint hidden sm:inline">painel operacional</span>
          </div>
          <Button onClick={() => navigate('/tenants/new')} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Nova empresa
          </Button>
        </div>

        <Surface variant="raised" crosshairs className="relative overflow-hidden glow-hover">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-20"
            style={{ background: 'var(--brand-gradient)', filter: 'blur(80px)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-0 relative">
            {/* Esquerda: contagem hero */}
            <div className="p-6 sm:p-8 flex flex-col justify-between min-w-0 lg:border-r lg:border-hairline">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <StatusDot tone="success" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-2">
                    {hasFilters ? 'resultado filtrado' : 'base completa'}
                  </span>
                </div>
                <div className="editorial-label mb-2">EMPRESAS CADASTRADAS</div>
                <div className="font-display font-bold leading-[0.85] tracking-tighter text-brand-gradient"
                  style={{ fontSize: 'clamp(2.75rem, 7vw, 6rem)' }}>
                  <AnimatedCounter value={total} format={(n) => fmtNum(n)} />
                </div>
                <div className="mt-4 flex items-center gap-4 flex-wrap font-mono text-xs text-ink-2 tabular">
                  <span className="flex items-center gap-1.5">
                    <span className="text-ink font-semibold">{kpis.active}</span> ativos
                  </span>
                  <span className="text-ink-faint">/</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-ink font-semibold">{kpis.trial}</span> em trial
                  </span>
                  <span className="text-ink-faint">/</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-ink font-semibold">{kpis.enterprise}</span> enterprise
                  </span>
                </div>
              </div>
            </div>

            {/* Direita: filtros densos */}
            <div className="p-6 sm:p-8 flex flex-col gap-4 min-w-0">
              <div className="editorial-label">/ FILTROS OPERACIONAIS</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou slug..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setPlanFilter('all'); setStatusFilter('all'); setPage(1); }}
                  className="self-start font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma transition-colors"
                >
                  limpar filtros
                </button>
              )}
            </div>
          </div>
        </Surface>
      </section>

      {/* ─── 02 LISTA EDITORIAL ────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeader
          numeral="02 /"
          label="Diretório"
          title={hasFilters ? `${total} empresa${total === 1 ? '' : 's'} encontrada${total === 1 ? '' : 's'}` : 'Todas as empresas'}
          actions={
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              página {page} / {Math.max(1, totalPages)}
            </span>
          }
        />

        {isLoading ? (
          <Surface className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-plasma" />
          </Surface>
        ) : error ? (
          <Surface className="p-8">
            <ShadEmptyState
              icon={Building2}
              title="Erro ao carregar tenants"
              description="Ocorreu um erro ao buscar os dados. Tente novamente."
              action={{ label: 'Tentar novamente', onClick: () => window.location.reload(), variant: 'outline' }}
              size="md"
            />
          </Surface>
        ) : tenants.length === 0 ? (
          <Surface className="p-8">
            <ShadEmptyState
              icon={Building2}
              title={hasFilters ? 'Nenhum resultado encontrado' : 'Nenhum tenant cadastrado'}
              description={hasFilters ? 'Tente ajustar os filtros de busca' : 'Crie a primeira empresa para começar'}
              action={!hasFilters ? { label: 'Criar empresa', onClick: () => navigate('/tenants/new') } : undefined}
              size="md"
            />
          </Surface>
        ) : (
          <Surface className="overflow-hidden p-0">
            {/* Header bar */}
            <div className="hidden md:grid grid-cols-[1.6fr_0.9fr_0.9fr_1fr_0.7fr_auto] gap-4 px-5 py-3 border-b border-hairline font-mono text-[10px] uppercase tracking-wider text-ink-faint bg-ink/[0.02]">
              <span>Empresa</span>
              <span>Plano</span>
              <span>Status</span>
              <span>Localização</span>
              <span>Criado</span>
              <span className="text-right">Ações</span>
            </div>

            <div className="divide-y divide-hairline">
              {tenants.map((tenant: Tenant) => {
                const isTrial = tenant.subscription_status === 'trialing' || tenant.trial_enabled;
                const tone: 'success' | 'warning' | 'error' | 'offline' = !tenant.is_active
                  ? 'offline'
                  : isTrial ? 'warning' : 'success';
                const geo = [tenant.city, tenant.state].filter(Boolean).join(', ');
                return (
                  <div
                    key={tenant.id}
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                    className="group grid grid-cols-1 md:grid-cols-[1.6fr_0.9fr_0.9fr_1fr_0.7fr_auto] gap-4 px-5 py-4 hover:bg-plasma/[0.04] transition-colors cursor-pointer items-center"
                  >
                    {/* Empresa */}
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-gradient-to-br from-plasma/20 to-cobalt/10 border border-hairline flex items-center justify-center shrink-0 font-display font-bold text-sm text-ink">
                        {(tenant.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate text-ink flex items-center gap-1.5">
                          {tenant.name}
                          <ArrowUpRight className="w-3 h-3 text-ink-faint opacity-0 group-hover:opacity-100 group-hover:text-plasma transition-all" />
                        </div>
                        <div className="font-mono text-[11px] text-ink-3 truncate">{tenant.slug}</div>
                      </div>
                    </div>

                    {/* Plano */}
                    <div className="md:block">
                      <Tag tone={planTone(tenant.plan_type)}>{tenant.plan_type || '—'}</Tag>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <StatusDot tone={tone} />
                      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-2">
                        {!tenant.is_active ? 'Inativo' : isTrial ? 'Trial' : 'Ativo'}
                      </span>
                    </div>

                    {/* Geo */}
                    <div className="font-mono text-[11px] text-ink-2 flex items-center gap-1.5 truncate">
                      {geo ? (
                        <><MapPin className="w-3 h-3 text-ink-faint shrink-0" /> <span className="truncate">{geo}</span></>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </div>

                    {/* Criado */}
                    <div className="font-mono text-[11px] text-ink-2 tabular">
                      {format(new Date(tenant.created_at), 'dd MMM yy', { locale: ptBR })}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Abrir CRM"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://${tenant.subdomain || tenant.slug}.uopacrm.com`, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 text-ink-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-8 w-8', tenant.is_active ? 'text-warning hover:text-warning' : 'text-success hover:text-success')}
                        title={tenant.is_active ? 'Desativar' : 'Ativar'}
                        onClick={() => setTenantToToggle(tenant)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Excluir"
                        onClick={() => setTenantToDelete(tenant)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-hairline bg-ink/[0.02]">
                <p className="font-mono text-[11px] text-ink-3 tabular">
                  {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-mono text-[11px] text-ink-2 tabular">
                    {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Surface>
        )}
      </section>

      {/* Toggle Status Dialog */}
      <AlertDialog open={!!tenantToToggle} onOpenChange={() => setTenantToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tenantToToggle?.is_active ? 'Desativar Tenant?' : 'Ativar Tenant?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tenantToToggle?.is_active
                ? `O tenant "${tenantToToggle?.name}" será desativado e seus usuários perderão acesso.`
                : `O tenant "${tenantToToggle?.name}" será reativado e seus usuários terão acesso novamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tenantToToggle) {
                  toggleStatusMutation.mutate({ id: tenantToToggle.id, isActive: tenantToToggle.is_active });
                }
              }}
              className={tenantToToggle?.is_active ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {toggleStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : tenantToToggle?.is_active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Permanently Dialog */}
      <AlertDialog open={!!tenantToDelete} onOpenChange={() => setTenantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Excluir Permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                O tenant <strong className="text-foreground">"{tenantToDelete?.name}"</strong> será removido permanentemente do sistema.
              </span>
              <span className="block p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <span className="block text-destructive font-medium text-sm">⚠️ Esta ação é irreversível!</span>
                <span className="block text-xs text-muted-foreground mt-1">
                  Todos os dados associados (usuários, configurações, logs, etc.) serão excluídos permanentemente.
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (tenantToDelete) deleteMutation.mutate(tenantToDelete.id); }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
