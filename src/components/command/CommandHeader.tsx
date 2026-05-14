import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useCommandStore } from '@/lib/command/store';

const TITLES: Record<string, string> = {
  '/command': 'Cockpit',
  '/command/missions': 'Missões',
  '/command/divisions': 'Divisões',
  '/command/tools': 'Catálogo de Ferramentas',
  '/command/grants': 'Grants',
  '/command/qa': 'QA / Tester',
};

export function CommandHeader() {
  const { pathname } = useLocation();
  const openBar = useCommandStore((s) => s.openCommandBar);

  let title = TITLES[pathname] ?? '';
  if (!title) {
    if (pathname.startsWith('/command/layers/')) {
      const slug = pathname.split('/')[3];
      title = `Camada · ${slug.charAt(0).toUpperCase() + slug.slice(1)}`;
    } else if (pathname.startsWith('/command/missions/')) {
      title = 'Missão';
    } else {
      title = 'Command';
    }
  }

  return (
    <header className="sticky top-0 z-30 h-12 bg-[hsl(var(--canvas)/0.85)] backdrop-blur-xl border-b border-[hsl(var(--hairline))] flex items-center px-4 gap-4">
      <h1 className="text-[13px] font-medium text-[hsl(var(--ink-primary))]">{title}</h1>
      <div className="w-px h-5 bg-[hsl(var(--hairline))]" />
      <WorkspaceSwitcher />
      <div className="flex-1" />
      <button
        onClick={openBar}
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))] transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))]" />
        <span className="text-[12px] text-[hsl(var(--ink-muted))]">Comandar…</span>
        <kbd className="font-mono text-[10px] text-[hsl(var(--ink-faint))] ml-2">⌘K</kbd>
      </button>
    </header>
  );
}
