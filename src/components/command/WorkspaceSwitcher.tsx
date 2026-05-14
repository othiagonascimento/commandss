import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commandDb } from '@/lib/command/db';
import { useCommandStore } from '@/lib/command/store';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Workspace {
  id: string;
  slug: string;
  name: string;
  symbol: string | null;
  color_hex: string;
  is_default: boolean;
  sort_order: number;
}

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const activeId = useCommandStore((s) => s.activeWorkspaceId);
  const setActive = useCommandStore((s) => s.setActiveWorkspace);

  const { data: workspaces } = useQuery({
    queryKey: ['command', 'workspaces'],
    queryFn: async (): Promise<Workspace[]> => {
      const { data, error } = await commandDb
        .from('workspaces')
        .select('id,slug,name,symbol,color_hex,is_default,sort_order')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Workspace[];
    },
    staleTime: 60_000,
  });

  // Default to first workspace
  useEffect(() => {
    if (!activeId && workspaces?.length) {
      const def = workspaces.find((w) => w.is_default) ?? workspaces[0];
      setActive(def.id);
    }
  }, [activeId, workspaces, setActive]);

  // ⌘1 / ⌘2 / ⌘3 shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n) || n < 1 || n > 9) return;
      const ws = workspaces?.[n - 1];
      if (ws) {
        e.preventDefault();
        setActive(ws.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [workspaces, setActive]);

  const active = workspaces?.find((w) => w.id === activeId) ?? workspaces?.[0];

  if (!active) {
    return <div className="h-8 w-32 rounded bg-[hsl(var(--surface-2))] animate-pulse" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2.5 h-8 px-2.5 rounded-md hover:bg-[hsl(var(--surface-2))] transition-colors"
      >
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white"
          style={{ background: active.color_hex }}
        >
          {active.symbol ?? active.name[0]}
        </span>
        <span className="text-[13px] font-medium text-[hsl(var(--ink-primary))]">{active.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))] group-hover:text-[hsl(var(--ink-secondary))]" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute top-full left-0 mt-1 z-50 min-w-[220px] rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {workspaces!.map((ws, i) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActive(ws.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[hsl(var(--surface-3))] transition-colors ${
                    ws.id === activeId ? 'bg-[hsl(var(--surface-3))]' : ''
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white"
                    style={{ background: ws.color_hex }}
                  >
                    {ws.symbol ?? ws.name[0]}
                  </span>
                  <span className="flex-1 text-[13px] text-[hsl(var(--ink-primary))]">{ws.name}</span>
                  <span className="font-mono text-[10px] text-[hsl(var(--ink-faint))]">⌘{i + 1}</span>
                </button>
              ))}
              <div className="border-t border-[hsl(var(--hairline))] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                {workspaces!.length} workspace{workspaces!.length !== 1 ? 's' : ''}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
