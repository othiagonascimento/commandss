import { NavLink, useLocation } from 'react-router-dom';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useCommandStore } from '@/lib/command/store';
import { Search } from 'lucide-react';

const NAV = [
  { to: '/command', label: 'Cockpit', end: true },
  { to: '/command/agents', label: 'Agentes' },
  { to: '/command/timeline', label: 'Timeline' },
  { to: '/command/missions', label: 'Missões' },
  { to: '/command/content', label: 'Conteúdo' },
  { to: '/command/calendar', label: 'Calendário' },
  { to: '/command/campaigns', label: 'Campanhas' },
  { to: '/command/brand', label: 'Brand' },
  { to: '/command/commercial', label: 'Comercial' },
  { to: '/command/automations', label: 'Automações' },
  { to: '/command/intel', label: 'Intel' },
  { to: '/command/inbox', label: 'Inbox' },
];

export function Topbar() {
  const openBar = useCommandStore((s) => s.openCommandBar);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 bg-[hsl(var(--canvas)/0.85)] backdrop-blur-xl border-b border-[hsl(var(--hairline))]">
      <div className="flex items-center h-12 px-4 gap-4">
        {/* Brand mark */}
        <NavLink to="/command" className="flex items-center gap-2 group">
          <span className="text-[18px] font-display font-bold tracking-tighter text-[hsl(var(--ink-primary))]">
            U<span className="text-[hsl(var(--brand-magenta))] group-hover:animate-pulse">·</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-secondary))]">
            command
          </span>
        </NavLink>

        <div className="w-px h-5 bg-[hsl(var(--hairline))]" />

        <WorkspaceSwitcher />

        {/* Nav */}
        <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative px-3 h-12 flex items-center text-[12.5px] whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[hsl(var(--ink-primary))]'
                    : 'text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-px"
                      style={{ background: 'hsl(var(--brand-magenta))' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Command bar trigger */}
        <button
          onClick={openBar}
          className="flex items-center gap-2 h-8 px-3 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))] transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))]" />
          <span className="text-[12px] text-[hsl(var(--ink-muted))]">Comandar…</span>
          <kbd className="font-mono text-[10px] text-[hsl(var(--ink-faint))] ml-2">⌘K</kbd>
        </button>
      </div>

      {/* Magenta hairline accent */}
      <div
        className="absolute bottom-0 left-0 h-px w-24"
        style={{ background: 'linear-gradient(90deg, hsl(var(--brand-magenta)), transparent)' }}
      />
    </header>
  );
}
