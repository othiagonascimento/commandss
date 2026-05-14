import { motion } from 'framer-motion';
import { ArenaSnapshot, STATE_PRIORITY } from '@/lib/command/arena';

interface Props {
  snapshots: Record<string, ArenaSnapshot>;
  now: Date;
  tvMode: boolean;
}

export function GlobalPulse({ snapshots, now, tvMode }: Props) {
  const all = Object.values(snapshots);
  const live = all.filter((s) => s.state !== 'standby').length;
  const critical = all.filter((s) => s.state === 'critical').length;
  const points = all.reduce((sum, s) => sum + s.scoreToday, 0);
  const failures = all.reduce((sum, s) => sum + s.scoreOpponent, 0);
  const climate = Math.max(...all.map((s) => STATE_PRIORITY[s.state]));

  const climateLabel =
    climate >= 100 ? 'tempestade' : climate >= 60 ? 'alta pressão' : climate >= 30 ? 'estável' : 'calmaria';

  return (
    <header className="flex items-center justify-between px-6 lg:px-10 h-14 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))]">
      <div className="flex items-center gap-3">
        <span className="font-display text-[18px] tracking-tighter text-[hsl(var(--ink-primary))]">
          UÔPA<span className="text-[hsl(var(--brand-magenta))]"> ARENA</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))]">
          {tvMode ? 'wallboard · live' : 'cockpit · live'}
        </span>
      </div>

      <div className="flex items-center gap-7 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))]">
        <Stat label="clima" value={climateLabel} accent={critical > 0 ? 'bad' : climate >= 60 ? 'warn' : 'good'} />
        <Stat label="ao vivo" value={`${live}/9`} />
        <Stat label="placar dia" value={`${points} · ${failures}`} accent={failures > 0 ? 'bad' : 'good'} />
        <Stat
          label="agora"
          value={now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        />
        <motion.span
          className="block w-1.5 h-1.5 rounded-full"
          style={{ background: critical > 0 ? 'hsl(var(--brand-magenta))' : 'hsl(var(--jade))' }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'good' | 'warn' | 'bad' }) {
  const color =
    accent === 'bad'
      ? 'text-[hsl(var(--brand-magenta))]'
      : accent === 'warn'
        ? 'text-[#F2A93B]'
        : accent === 'good'
          ? 'text-[hsl(var(--jade))]'
          : 'text-[hsl(var(--ink-primary))]';
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      <span className={`font-display tabular-nums text-[13px] tracking-tight ${color}`}>{value}</span>
    </span>
  );
}
