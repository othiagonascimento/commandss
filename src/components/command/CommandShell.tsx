import { useState, useEffect } from 'react';
import { Outlet, useSearchParams, useLocation } from 'react-router-dom';
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
  // Modo TV / wallboard — esconde sidebar, header, dock e qualquer chrome.
  const tvMode = params.get('tv') === '1' && pathname.startsWith('/command/arena');

  const [bootDone, setBootDone] = useState(() => {
    if (!bootSeenAt) return false;
    return Date.now() - bootSeenAt < 30 * 60 * 1000;
  });

  // Lock scroll during boot
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
      <div className="min-h-screen bg-[hsl(var(--canvas))] text-[hsl(var(--ink-primary))] flex">
        {!bootDone && <BootSequence onDone={() => setBootDone(true)} />}
        <CommandSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <CommandHeader />
          <div className="flex flex-1 min-h-0">
            <main className="flex-1 min-w-0 overflow-y-auto">
              <Outlet />
            </main>
            <LiveOpsDock />
          </div>
        </div>
        <CommandBar />
        <RunTheater />
      </div>
    </CommandGuard>
  );
}
