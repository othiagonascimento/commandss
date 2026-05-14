import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Target,
  MessageSquare,
  Brain,
  Workflow,
  Database,
  CreditCard,
  Server,
  Users,
  Wrench,
  ShieldCheck,
  TestTube2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useState } from 'react';
import { LAYERS } from '@/lib/command/meta';

const LAYER_ICONS: Record<string, typeof MessageSquare> = {
  canais: MessageSquare,
  inteligencia: Brain,
  operacao: Workflow,
  dados: Database,
  monetizacao: CreditCard,
  infra: Server,
};

const TOP = [
  { to: '/command', label: 'Cockpit', icon: Activity, end: true },
  { to: '/command/missions', label: 'Missões', icon: Target },
];

const SETTINGS = [
  { to: '/command/divisions', label: 'Divisões', icon: Users },
  { to: '/command/tools', label: 'Ferramentas', icon: Wrench },
  { to: '/command/grants', label: 'Grants', icon: ShieldCheck },
  { to: '/command/qa', label: 'QA / Tester', icon: TestTube2 },
];

export function CommandSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  const linkClass = (active: boolean) =>
    `group flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[12.5px] transition-colors ${
      active
        ? 'bg-[hsl(var(--surface-2))] text-[hsl(var(--ink-primary))]'
        : 'text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface-1))]'
    }`;

  return (
    <aside
      className={`shrink-0 border-r border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] flex flex-col transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Brand */}
      <NavLink
        to="/command"
        className="flex items-center gap-2 h-12 px-3 border-b border-[hsl(var(--hairline))]"
      >
        <span className="text-[18px] font-display font-bold tracking-tighter text-[hsl(var(--ink-primary))]">
          U<span className="text-[hsl(var(--brand-magenta))]">·</span>
        </span>
        {!collapsed && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-secondary))]">
            command
          </span>
        )}
      </NavLink>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* Top — Cockpit + Missões */}
        <div className="space-y-0.5">
          {TOP.map((item) => {
            const active =
              item.end ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass(active)}>
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Camadas UÔPA */}
        <div>
          {!collapsed && (
            <div className="px-2.5 mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))]">
              Camadas UÔPA
            </div>
          )}
          <div className="space-y-0.5">
            {LAYERS.map((l) => {
              const to = `/command/layers/${l.slug}`;
              const Icon = LAYER_ICONS[l.slug];
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <NavLink key={l.slug} to={to} className={linkClass(active)} title={l.desc}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{l.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Ajustes */}
        <div>
          {!collapsed && (
            <div className="px-2.5 mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))]">
              Ajustes
            </div>
          )}
          <div className="space-y-0.5">
            {SETTINGS.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass(active)}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className="h-9 border-t border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-primary))] hover:bg-[hsl(var(--surface-1))] transition-colors"
        aria-label={collapsed ? 'Expandir' : 'Colapsar'}
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
