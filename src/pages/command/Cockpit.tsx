import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commandDb } from '@/lib/command/db';
import { motion } from 'framer-motion';
import { useCommandStore } from '@/lib/command/store';
import { RecentRuns } from '@/components/command/RecentRuns';

interface PulseStats {
  publishedToday: number;
  activeMissions: number;
  pendingDecisions: number;
  liveAgents: number;
}

export default function CommandCockpit() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['command', 'pulse', wsId],
    queryFn: async (): Promise<PulseStats> => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const iso = startOfDay.toISOString();

      const [pub, miss, dec, runs] = await Promise.all([
        commandDb
          .from('content_items')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published')
          .gte('published_at', iso),
        commandDb
          .from('missions')
          .select('id', { count: 'exact', head: true })
          .in('status', ['planning', 'approved', 'executing']),
        commandDb
          .from('decisions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        commandDb
          .from('agent_runs')
          .select('id', { count: 'exact', head: true })
          .in('status', ['thinking', 'acting']),
      ]);

      return {
        publishedToday: pub.count ?? 0,
        activeMissions: miss.count ?? 0,
        pendingDecisions: dec.count ?? 0,
        liveAgents: runs.count ?? 0,
      };
    },
    refetchInterval: 15_000,
    enabled: !!wsId,
  });

  const greeting = getGreeting(now);

  return (
    <div className="px-8 lg:px-14 py-12 max-w-[1400px] mx-auto">
      {/* Top tag */}
      <div className="flex items-center justify-between mb-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))]">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-widest">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'hsl(var(--jade))' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          sistema operando
        </div>
      </div>

      {/* Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="font-display text-[44px] sm:text-[64px] leading-[0.95] tracking-tight text-[hsl(var(--ink-primary))]"
      >
        {greeting}.
      </motion.h1>

      {/* Pulse line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-6 text-[20px] sm:text-[28px] leading-snug text-[hsl(var(--ink-secondary))] font-display"
      >
        Hoje:{' '}
        <PulseNumber n={stats?.publishedToday ?? 0} /> {plural(stats?.publishedToday, 'post', 'posts')} publicado
        {stats?.publishedToday === 1 ? '' : 's'} ·{' '}
        <PulseNumber n={stats?.activeMissions ?? 0} /> {plural(stats?.activeMissions, 'missão', 'missões')} ativa
        {stats?.activeMissions === 1 ? '' : 's'} ·{' '}
        <PulseNumber n={stats?.pendingDecisions ?? 0} accent /> {plural(stats?.pendingDecisions, 'decisão', 'decisões')} pendente
        {stats?.pendingDecisions === 1 ? '' : 's'}.
      </motion.div>

      {/* Section grid */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tile label="Missões" value={stats?.activeMissions ?? 0} hint="em execução" to="/command/missions" />
        <Tile label="Decisões" value={stats?.pendingDecisions ?? 0} hint="aguardando você" to="/command/inbox" accent />
        <Tile label="Agentes" value={stats?.liveAgents ?? 0} hint="trabalhando agora" to="/command/agents" />
      </div>

      {/* Recent agent activity */}
      <div className="mt-16">
        <RecentRuns />
      </div>

      {/* Footer */}
      <div className="mt-24 pt-6 border-t border-[hsl(var(--hairline))] flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
        <span>command ai · v1 · onda 1 de 9</span>
        <span>⌘K para comandar</span>
      </div>
    </div>
  );
}

function getGreeting(d: Date) {
  const h = d.getHours();
  if (h < 6) return 'Madrugada operando';
  if (h < 12) return 'Bom dia, comandante';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function plural(n: number | undefined, s: string, p: string) {
  return (n ?? 0) === 1 ? s : p;
}

function PulseNumber({ n, accent }: { n: number; accent?: boolean }) {
  return (
    <motion.span
      key={n}
      initial={{ opacity: 0.4, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`font-display tabular-nums ${
        accent ? 'text-[hsl(var(--brand-magenta))]' : 'text-[hsl(var(--ink-primary))]'
      }`}
    >
      {n}
    </motion.span>
  );
}

function Tile({
  label,
  value,
  hint,
  to,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  to: string;
  accent?: boolean;
}) {
  return (
    <a
      href={to}
      className="group relative rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-6 hover:bg-[hsl(var(--surface-2))] transition-colors overflow-hidden"
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
        {label}
      </div>
      <div
        className={`mt-4 font-display text-[56px] leading-none tracking-tight tabular-nums ${
          accent ? 'text-[hsl(var(--brand-magenta))]' : 'text-[hsl(var(--ink-primary))]'
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-[12px] text-[hsl(var(--ink-secondary))]">{hint}</div>
      <div
        className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500"
        style={{ background: 'hsl(var(--brand-magenta))' }}
      />
    </a>
  );
}
