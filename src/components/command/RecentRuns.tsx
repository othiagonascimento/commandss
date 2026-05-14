/**
 * RecentRuns — últimas execuções de agente (cliques abrem o RunTheater).
 */
import { useQuery } from '@tanstack/react-query';
import { commandDb } from '@/lib/command/db';
import { motion } from 'framer-motion';
import { useCommandStore } from '@/lib/command/store';
import { useEffect } from 'react';

interface RunRow {
  id: string;
  agent_id: string;
  status: string;
  input: string;
  started_at: string;
  duration_ms: number | null;
}
interface AgentLite {
  id: string;
  name: string;
  color_hex: string;
  avatar_emoji: string | null;
}

export function RecentRuns() {
  const openRun = useCommandStore((s) => s.openRun);
  const wsId = useCommandStore((s) => s.activeWorkspaceId);

  const { data: agents } = useQuery({
    queryKey: ['command', 'agents-lite'],
    queryFn: async () => {
      const { data } = await commandDb
        .from('agents')
        .select('id,name,color_hex,avatar_emoji');
      return (data ?? []) as AgentLite[];
    },
    staleTime: 5 * 60_000,
  });

  const { data: runs, refetch } = useQuery({
    queryKey: ['command', 'recent-runs', wsId],
    queryFn: async () => {
      const { data } = await commandDb
        .from('agent_runs')
        .select('id,agent_id,status,input,started_at,duration_ms')
        .order('started_at', { ascending: false })
        .limit(8);
      return (data ?? []) as RunRow[];
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const ch = commandDb
      .channel('recent-runs-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'command_ai', table: 'agent_runs' },
        () => refetch(),
      )
      .subscribe();
    return () => {
      commandDb.removeChannel(ch);
    };
  }, [refetch]);

  const agentMap = new Map(agents?.map((a) => [a.id, a]) ?? []);

  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-3">
        Atividade dos agentes
      </div>
      <div className="rounded-xl border border-[hsl(var(--hairline))] overflow-hidden bg-[hsl(var(--surface-1))]">
        {!runs || runs.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12.5px] text-[hsl(var(--ink-muted))]">
            Sem execuções ainda. Aperte ⌘K e brifear o primeiro agente.
          </div>
        ) : (
          runs.map((r, idx) => {
            const a = agentMap.get(r.agent_id);
            const live = r.status === 'thinking' || r.status === 'acting';
            return (
              <motion.button
                key={r.id}
                onClick={() => openRun(r.id)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[hsl(var(--surface-2))] border-b border-[hsl(var(--hairline))] last:border-b-0 text-left transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[13px] shrink-0"
                  style={{
                    background: a ? `${a.color_hex}20` : 'hsl(var(--surface-3))',
                    color: a?.color_hex,
                  }}
                >
                  {a?.avatar_emoji ?? '•'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-[hsl(var(--ink-primary))] truncate">
                    {r.input}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mt-0.5">
                    {a?.name ?? '—'} · {r.status} ·{' '}
                    {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : timeSince(r.started_at)}
                  </div>
                </div>
                {live && (
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: a?.color_hex ?? 'hsl(var(--brand-magenta))' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

function timeSince(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  return `${h}h atrás`;
}
