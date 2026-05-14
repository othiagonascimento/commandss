import { useQuery } from '@tanstack/react-query';
import { commandDb } from '@/lib/command/db';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useCommandStore } from '@/lib/command/store';

interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  avatar_emoji: string | null;
  color_hex: string;
}

interface Run {
  id: string;
  agent_id: string;
  status: string;
  started_at: string;
}

export function LiveOpsDock() {
  const openRun = useCommandStore((s) => s.openRun);
  const { data: agents } = useQuery({
    queryKey: ['command', 'agents'],
    queryFn: async (): Promise<Agent[]> => {
      const { data, error } = await commandDb
        .from('agents')
        .select('id,slug,name,role,avatar_emoji,color_hex')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as Agent[];
    },
    staleTime: 5 * 60_000,
  });

  const { data: activeRuns } = useQuery({
    queryKey: ['command', 'live-runs'],
    queryFn: async (): Promise<Run[]> => {
      const { data, error } = await commandDb
        .from('agent_runs')
        .select('id,agent_id,status,started_at')
        .in('status', ['thinking', 'acting', 'waiting_approval'])
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Run[];
    },
    refetchInterval: 8000,
    staleTime: 4000,
  });

  const activeByAgent = new Map<string, Run>();
  activeRuns?.forEach((r) => {
    if (!activeByAgent.has(r.agent_id)) activeByAgent.set(r.agent_id, r);
  });

  return (
    <aside className="hidden xl:flex flex-col w-[280px] border-l border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))]">
      <div className="flex items-center justify-between px-5 h-12 border-b border-[hsl(var(--hairline))]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[hsl(var(--brand-magenta))]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-secondary))]">
            Live Ops
          </span>
        </div>
        <span className="font-mono text-[10px] text-[hsl(var(--ink-faint))]">
          {activeRuns?.length ?? 0} ativo{(activeRuns?.length ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-1.5 px-3">
        {agents?.map((agent) => {
          const run = activeByAgent.get(agent.id);
          const isLive = !!run;
          return (
            <motion.button
              key={agent.id}
              layout
              onClick={() => run && openRun(run.id)}
              disabled={!isLive}
              className="relative w-full text-left rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] p-3 overflow-hidden enabled:hover:bg-[hsl(var(--surface-3))] transition-colors disabled:cursor-default"
            >
              {isLive && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: agent.color_hex }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[14px]"
                  style={{
                    background: isLive ? `${agent.color_hex}20` : 'hsl(var(--surface-3))',
                    color: agent.color_hex,
                  }}
                >
                  {agent.avatar_emoji ?? agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium text-[hsl(var(--ink-primary))] truncate">
                    {agent.name}
                  </div>
                  <div className="text-[10.5px] text-[hsl(var(--ink-muted))] truncate">
                    {isLive ? statusLabel(run!.status) : 'idle'}
                  </div>
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isLive ? agent.color_hex : 'hsl(var(--ink-faint))',
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="border-t border-[hsl(var(--hairline))] px-4 py-2.5 font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-widest">
        agentes operacionais
      </div>
    </aside>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case 'thinking':
      return 'pensando…';
    case 'acting':
      return 'executando…';
    case 'waiting_approval':
      return 'aguarda aprovação';
    default:
      return s;
  }
}
