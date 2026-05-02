import { Menu, Bell, Search, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { useOpsHealth } from '@/hooks/useOpsHealth';
import { Ticker } from '@/components/ds/Feedback';
import { StatusDot } from '@/components/ds/Atoms';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { usePrivacy } from '@/contexts/PrivacyContext';
import uopaSymbol from '@/assets/uopa-symbol.png';

interface HeaderProps {
  onMenuClick?: () => void;
  onCommandOpen?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/tenants': 'Tenants',
  '/operations': 'Operações',
  '/tenant-health': 'Saúde',
  '/analytics': 'Inteligência de Receita',
  '/ai-diagnostics': 'Diagnóstico de IA',
  '/simulator': 'Simulador',
  '/rankings': 'Rankings',
  '/subscriptions': 'Assinaturas',
  '/finops': 'FinOps',
  '/api-costs': 'Custos API',
  '/master-users': 'Master Users',
  '/activity-logs': 'Logs',
  '/scheduled-tasks': 'Tarefas',
  '/plans': 'Planos',
  '/comunicados': 'Comunicados',
  '/invite-links': 'Convites',
  '/admin/cadastros': 'Cadastros',
  '/admin/templates': 'Templates',
  '/feature-flags': 'Recursos Beta',
  '/settings': 'Configurações',
};

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function Header({ onMenuClick, onCommandOpen }: HeaderProps) {
  const { user } = useAuth();
  const { masterUser } = usePermissions();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { overview, revenue } = useMasterDashboard();
  const { snapshot, snapshotMeta, alertCount } = useOpsHealth();
  const { hidden, toggle } = usePrivacy();

  const initials = (() => {
    const n = masterUser?.full_name || user?.email || '';
    const p = n.split(/[\s@]/).filter(Boolean);
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || 'U';
  })();

  const stale = snapshotMeta?.freshness.status === 'stale' || snapshotMeta?.freshness.status === 'missing';
  const opsTone: 'success' | 'warning' | 'error' = alertCount > 0 ? 'error' : stale ? 'warning' : 'success';
  const opsLabel = alertCount > 0 ? `${alertCount} alertas` : stale ? 'snapshot velho' : 'sistema ok';

  const tickerItems = [
    revenue?.mrr ? { label: 'MRR', value: hidden ? '••••' : `R$ ${fmtCompact(revenue.mrr)}`, tone: 'plasma' as const } : null,
    overview?.tenants?.active != null ? { label: 'Tenants', value: String(overview.tenants.active), tone: 'default' as const } : null,
    overview?.usage?.total_messages != null ? { label: 'MSG/30D', value: fmtCompact(overview.usage.total_messages) } : null,
    overview?.usage?.total_users != null ? { label: 'USERS', value: fmtCompact(overview.usage.total_users) } : null,
    overview?.subscriptions?.trial != null ? { label: 'TRIALS', value: String(overview.subscriptions.trial), tone: 'ember' as const } : null,
  ].filter(Boolean) as { label: string; value: string; tone?: any }[];

  const crumb = ROUTE_LABELS[pathname] || (() => {
    const k = Object.keys(ROUTE_LABELS).find(p => p !== '/' && pathname.startsWith(p));
    return k ? ROUTE_LABELS[k] : '';
  })();

  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur hairline-b">
      <div className="h-14 flex items-center gap-3 px-3 sm:px-5">
        <button onClick={onMenuClick} className="lg:hidden -ml-1 p-2 text-ink-2 hover:text-ink" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile logo — atalho para Home */}
        <button
          onClick={() => navigate('/')}
          className="lg:hidden flex items-center group"
          aria-label="Ir para o Dashboard"
        >
          <img src={uopaLogoWhite} alt="UÔPA Master Console" className="h-5 w-auto transition-opacity group-hover:opacity-80" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="editorial-label">Master</span>
          {crumb && (
            <>
              <ChevronRight className="h-3 w-3 text-ink-faint" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink truncate">{crumb}</span>
            </>
          )}
        </div>

        {/* CommandBar */}
        <button
          onClick={onCommandOpen}
          className="search-input ml-auto sm:ml-0 sm:flex-1 sm:max-w-[420px] h-9 hairline border bg-surface-1 flex items-center gap-2 px-3 rounded-md group"
        >
          <Search className="h-3.5 w-3.5 text-ink-3 group-hover:text-plasma transition-colors" />
          <span className="text-[12px] text-ink-3 font-mono hidden sm:inline">buscar tenants, ações, ir para…</span>
          <span className="text-[12px] text-ink-3 font-mono sm:hidden">buscar</span>
          <kbd className="ml-auto font-mono text-[10px] text-ink-faint hairline border px-1.5 py-0.5 rounded-sm">⌘K</kbd>
        </button>

        {/* Status + bell + avatar */}
        <div className="flex items-center gap-2 ml-auto sm:ml-2">
          <div className="hidden md:block">
            <StatusDot tone={opsTone} label={opsLabel} />
          </div>
          <button
            onClick={toggle}
            className="p-1.5 text-ink-2 hover:text-plasma transition-colors"
            aria-label={hidden ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
            title={hidden ? 'Mostrar financeiros' : 'Ocultar financeiros'}
          >
            {hidden ? <Eye className="h-[15px] w-[15px]" /> : <EyeOff className="h-[15px] w-[15px]" />}
          </button>
          <ThemeToggle />
          <button onClick={() => navigate('/operations')} className="relative p-1.5 text-ink-2 hover:text-ink transition-colors">
            <Bell className="h-[15px] w-[15px]" />
            {alertCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-coral animate-pulse-ring" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-3 hairline-l h-8">
            <div className="w-7 h-7 rounded-md bg-brand-gradient text-white font-mono text-[11px] font-semibold flex items-center justify-center shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Ticker bar */}
      {tickerItems.length > 0 && (
        <div className="hidden md:block hairline-t">
          <Ticker items={tickerItems} />
        </div>
      )}
    </header>
  );
}
