import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CommandGuard } from './CommandGuard';
import { BootSequence } from './BootSequence';
import { Topbar } from './Topbar';
import { LiveOpsDock } from './LiveOpsDock';
import { CommandBar } from './CommandBar';
import { useCommandStore } from '@/lib/command/store';

export function CommandShell() {
  const bootSeenAt = useCommandStore((s) => s.bootSeenAt);
  // Replay boot once per session: if bootSeenAt is older than 30 min, show again.
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

  return (
    <CommandGuard>
      <div className="min-h-screen bg-[hsl(var(--canvas))] text-[hsl(var(--ink-primary))] flex flex-col">
        {!bootDone && <BootSequence onDone={() => setBootDone(true)} />}
        <Topbar />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 min-w-0 overflow-y-auto">
            <Outlet />
          </main>
          <LiveOpsDock />
        </div>
        <CommandBar />
      </div>
    </CommandGuard>
  );
}
