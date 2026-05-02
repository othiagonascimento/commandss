import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Activity, Brain, Calculator, Trophy,
  CreditCard, Link2, ClipboardList, Bell, BarChart3, Cog, UserCog,
  FileText, Clock, Package, FlaskConical, DollarSign, Settings as SettingsIcon,
  Radio, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import uopaSymbol from '@/assets/uopa-symbol.png';

interface NavItem { icon: React.ComponentType<{ className?: string }>; label: string; path: string; permissionCheck?: () => boolean; }
interface NavZone { id: string; label: string; items: NavItem[]; permissionCheck?: () => boolean; }

interface Props {
  collapsed: boolean;
  onCollapse: (c: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const permissions = usePermissions();

  const zones: NavZone[] = useMemo(() => [
    {
      id: 'comando', label: 'Comando',
      permissionCheck: permissions.canViewDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard',           path: '/',                permissionCheck: permissions.canViewDashboard },
        { icon: Radio,           label: 'Operações',           path: '/operations',      permissionCheck: permissions.canViewDashboard },
        { icon: Activity,        label: 'Saúde dos Tenants',   path: '/tenant-health',   permissionCheck: permissions.canViewTenants },
        { icon: BarChart3,       label: 'Inteligência Receita',path: '/analytics',       permissionCheck: permissions.canViewDashboard },
        { icon: Brain,           label: 'Diagnóstico de IA',   path: '/ai-diagnostics',  permissionCheck: permissions.canViewSettings },
        { icon: Calculator,      label: 'Simulador',           path: '/simulator',       permissionCheck: permissions.canViewDashboard },
      ],
    },
    {
      id: 'clientes', label: 'Clientes',
      permissionCheck: () => permissions.canViewTenants() || permissions.canViewUsers(),
      items: [
        { icon: Building2,     label: 'Tenants',     path: '/tenants',          permissionCheck: permissions.canViewTenants },
        { icon: Trophy,        label: 'Rankings',    path: '/rankings',         permissionCheck: permissions.canViewUsers },
        { icon: ClipboardList, label: 'Cadastros',   path: '/admin/cadastros',  permissionCheck: permissions.canViewTenants },
        { icon: Brain,         label: 'Templates',   path: '/admin/templates',  permissionCheck: permissions.canViewTemplates },
      ],
    },
    {
      id: 'plataforma', label: 'Plataforma',
      permissionCheck: () => true,
      items: [
        { icon: CreditCard,  label: 'Assinaturas',  path: '/subscriptions',  permissionCheck: permissions.canViewSubscriptions },
        { icon: Link2,       label: 'Convites',     path: '/invite-links',   permissionCheck: permissions.canViewInviteLinks },
        { icon: Bell,        label: 'Comunicados',  path: '/comunicados',    permissionCheck: permissions.canViewBroadcasts },
        { icon: Package,     label: 'Planos',       path: '/plans',          permissionCheck: permissions.canViewSettings },
        { icon: DollarSign,  label: 'FinOps',       path: '/finops',         permissionCheck: () => permissions.isSuperAdmin() },
        { icon: Calculator,  label: 'Custos API',   path: '/api-costs',      permissionCheck: permissions.canViewSettings },
        { icon: UserCog,     label: 'Master Users', path: '/master-users',   permissionCheck: permissions.canViewMasterUsers },
        { icon: FileText,    label: 'Logs',         path: '/activity-logs',  permissionCheck: permissions.canViewSettings },
        { icon: Clock,       label: 'Tarefas',      path: '/scheduled-tasks',permissionCheck: permissions.canViewSettings },
        { icon: FlaskConical,label: 'Beta',         path: '/feature-flags',  permissionCheck: permissions.canViewFeatureFlags },
        { icon: SettingsIcon,label: 'Configurações',path: '/settings',       permissionCheck: permissions.canViewSettings },
      ],
    },
  ], [permissions]);

  const filtered = useMemo(() => {
    const allow = permissions.isSuperAdmin() || !permissions.masterUser
      || ((permissions.userRoles?.length ?? 0) === 0 && (permissions.userPermissions?.length ?? 0) === 0);
    return zones
      .filter(z => allow || !z.permissionCheck || z.permissionCheck())
      .map(z => ({ ...z, items: z.items.filter(i => allow || !i.permissionCheck || i.permissionCheck!()) }))
      .filter(z => z.items.length > 0);
  }, [zones, permissions]);

  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  useEffect(() => { if (mobileOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; }, [mobileOpen]);

  const Item = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    const btn = (
      <button
        onClick={() => { navigate(item.path); onMobileClose(); }}
        className={cn(
          'group relative w-full flex items-center gap-3 h-9 transition-all duration-200',
          collapsed ? 'justify-center' : 'px-3',
          active ? 'text-ink' : 'text-ink-2 hover:text-ink hover:bg-surface-2/50',
        )}
      >
        {active && (
          <>
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
              style={{ background: 'var(--brand-gradient)' }}
            />
            <span
              className="absolute inset-0 opacity-100 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, hsl(var(--brand-magenta) / 0.10), transparent 60%)' }}
            />
          </>
        )}
        <item.icon className={cn(
          'h-[15px] w-[15px] shrink-0 transition-all relative',
          active ? 'text-plasma' : 'group-hover:text-plasma',
        )} />
        {!collapsed && <span className="text-[13px] truncate relative">{item.label}</span>}
      </button>
    );
    if (collapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-[11px] uppercase tracking-wider">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  const content = (
    <>
      {/* Brand */}
      <div className={cn('h-14 flex items-center hairline-b px-4', collapsed && 'justify-center px-0')}>
        <div className="flex items-center gap-2.5">
          <img src={uopaSymbol} alt="UÔPA" className="h-7 w-auto" />
          {!collapsed && (
            <div className="leading-none">
              <div className="font-display text-[13px] font-semibold tracking-tight text-ink">UÔPA</div>
              <div className="editorial-label mt-0.5">Master Console</div>
            </div>
          )}
        </div>
      </div>

      {/* Zones */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-3">
        {filtered.map((zone, zi) => (
          <div key={zone.id} className={cn('mb-4', zi > 0 && 'pt-3 hairline-t')}>
            {!collapsed && (
              <div className="px-4 mb-1.5 flex items-center justify-between">
                <span className="editorial-label">{zone.label}</span>
                <span className="font-mono text-[10px] text-ink-faint tabular">{String(zi + 1).padStart(2, '0')}</span>
              </div>
            )}
            <div className="flex flex-col">
              {zone.items.map(item => <Item key={item.path} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse */}
      <div className="hidden lg:flex hairline-t p-2 justify-end">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="h-8 px-2 inline-flex items-center gap-1.5 text-ink-3 hover:text-ink font-mono text-[10px] uppercase tracking-wider"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : (<><ChevronsLeft className="h-3.5 w-3.5" /> recolher</>)}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-canvas hairline-r flex flex-col">
            {content}
          </aside>
        </div>
      )}

      {/* Desktop rail */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-canvas hairline-r transition-[width] duration-200',
          collapsed ? 'w-[56px]' : 'w-[232px]'
        )}
      >
        {content}
      </aside>
    </>
  );
}
