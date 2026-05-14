import { useState, useEffect } from 'react';
import { Outlet, useSearchParams, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { CommandGuard } from './CommandGuard';
import { BootSequence } from './BootSequence';
import { CommandSidebar } from './CommandSidebar';
import { CommandHeader } from './CommandHeader';
import { LiveOpsDock } from './LiveOpsDock';
import { CommandBar } from './CommandBar';
import { RunTheater } from './RunTheater';
import { useCommandStore } from '@/lib/command/store';

export function CommandShell() {
  const bootSeenAt = useCommandStore((s) => s.bootSeenAt);
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const tvMode = params.get('tv') === '1' && pathname.startsWith('/command/arena');

  const [bootDone, setBootDone] = useState(() => {
    if (!bootSeenAt) return false;
    return Date.now() - bootSeenAt < 30 * 60 * 1000;
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // fecha drawer ao navegar
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!bootDone) {
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
      };
    }
  }, [bootDone]);

  if (tvMode) {
    return (
      <CommandGuard>
        <div className="fixed inset-0 bg-[hsl(var(--canvas))] text-[hsl(var(--ink-primary))] overflow-hidden">
          <Outlet />
        </div>
      </CommandGuard>
    );
  }

  return (
    <CommandGuard>
      <div className="min-h-screen h-screen bg-[hsl(var(--canvas))] text-[hsl(var(--ink-primary))] flex overflow-hidden">
        {!bootDone && <BootSequence onDone={() => setBootDone(true)} />}

        {/* Sidebar desktop */}
        <div className="hidden md:flex">
          <CommandSidebar />
        </div>

        {/* Drawer mobile */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative z-10 h-full">
              <CommandSidebar />
            </div>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-3 right-3 z-20 h-8 w-8 rounded-md bg-[hsl(var(--surface-2))] border border-[hsl(var(--hairline))] flex items-center justify-center text-[hsl(var(--ink-secondary))]"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Topbar mobile */}
          <div className="md:hidden h-12 flex items-center gap-2 px-3 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--canvas)/0.85)] backdrop-blur-xl">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="h-8 w-8 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] flex items-center justify-center text-[hsl(var(--ink-secondary))]"
              aria-label="Abrir menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-display text-[15px] tracking-tighter text-[hsl(var(--ink-primary))]">
              U<span className="text-[hsl(var(--brand-magenta))]">·</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ink-secondary))] ml-1.5">
                command
              </span>
            </span>
          </div>

          {/* Header (desktop) */}
          <div className="hidden md:block">
            <CommandHeader />
          </div>

          <div className="flex flex-1 min-h-0">
            <main className="flex-1 min-w-0 overflow-y-auto">
              <Outlet />
            </main>
            <div className="hidden lg:block">
              <LiveOpsDock />
            </div>
          </div>
        </div>
        <CommandBar />
        <RunTheater />
      </div>
    </CommandGuard>
  );
}
