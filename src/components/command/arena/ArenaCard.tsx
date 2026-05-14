/**
 * ArenaCard — direção "Bastidores".
 * Layout split: header com esporte/divisão/estado, corpo em 2 colunas
 * (cena à esquerda, painel de dados à direita: missão atual + stats grid).
 * Inspirado no SpotlightSheet — mesma hierarquia, sem cortes.
 */
import { motion } from 'framer-motion';
import { Arena, ArenaSnapshot, STATE_TONE, formatElapsed } from '@/lib/command/arena';
import { ArenaScene } from './ArenaScenes';

interface Props {
  arena: Arena;
  snapshot: ArenaSnapshot;
  index: number;
  focused?: boolean;
  tv?: boolean;
  fill?: boolean;
  onClick?: () => void;
}

export function ArenaCard({ arena, snapshot, index, focused, tv, fill, onClick }: Props) {
  const tone = STATE_TONE[snapshot.state];
  const isCritical = snapshot.state === 'critical';
  const hasMission = !!snapshot.currentMission;
  const compact = tv || fill;

  // Sizing tokens — modo TV prioriza informação completa sem depender de clique.
  const t = {
    header: compact ? 'min-h-8 px-2 py-1' : 'min-h-10 px-3 py-1.5',
    bodyPad: compact ? 'p-1.5' : 'p-2.5',
    bodyGap: compact ? 'gap-1.5' : 'gap-2.5',
    sport: compact ? 'text-[6px] sm:text-[6.5px]' : 'text-[7.5px]',
    division: compact ? 'text-[11px] sm:text-[12px]' : 'text-[14px] sm:text-[15px]',
    stateLabel: compact ? 'text-[6.5px]' : 'text-[7.5px]',
    fieldLabel: compact ? 'text-[6px]' : 'text-[7px]',
    mission: compact ? 'text-[10px]' : 'text-[12px]',
    meta: compact ? 'text-[7px]' : 'text-[9px]',
    statLabel: compact ? 'text-[5.5px]' : 'text-[6.5px]',
    statValue: compact ? 'text-[11px]' : 'text-[15px]',
    statBox: compact ? 'px-1 py-0.5 rounded-[4px]' : 'px-1.5 py-1 rounded-md',
  };

  return (
    <motion.button
      onClick={onClick}
      animate={{
        scale: 1,
        boxShadow: focused
          ? `0 30px 80px -20px ${tone.glow}, 0 0 0 1px ${tone.border}`
          : `0 0 0 1px ${tone.border}`,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-xl bg-[hsl(var(--surface-1))] overflow-hidden text-left group flex w-full flex-col ${
        fill ? 'h-full min-h-0' : 'min-h-[250px] sm:min-h-[220px]'
      }`}
      style={{ borderColor: tone.border }}
    >
      {/* ─────── HEADER ─────── */}
      <div className={`flex items-center justify-between gap-2 ${t.header} border-b border-[hsl(var(--hairline))] shrink-0`}>
        <div className="min-w-0">
          <div className={`font-mono uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] leading-none ${t.sport}`}>
            bastidores · {arena.sportLabel}
          </div>
          <div className={`font-display leading-tight text-[hsl(var(--ink-primary))] mt-0.5 truncate ${t.division}`}>
            {arena.division}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`font-mono uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] ${t.sport} hidden sm:inline`}>
            arena {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ─────── CORPO SPLIT ─────── */}
      <div className="grid flex-1 min-h-0 grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        {/* Cena */}
        <div className="relative min-h-0 overflow-hidden border-r border-[hsl(var(--hairline))]">
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${tone.glow} 0%, transparent 70%)`,
              opacity: focused ? 1 : 0.55,
            }}
          />
          <motion.div
            className="absolute inset-0"
            animate={isCritical ? { x: [-0.6, 0.6, -0.6] } : { x: 0 }}
            transition={{ duration: 0.18, repeat: isCritical ? Infinity : 0 }}
          >
            <ArenaScene sport={arena.sport} state={snapshot.state} intensity={snapshot.intensity} />
          </motion.div>
        </div>

        {/* Painel de dados */}
        <div className={`flex min-h-0 flex-col ${t.bodyGap} ${t.bodyPad} bg-[hsl(var(--surface-1))] overflow-hidden`}>
          {/* Estado */}
          <div className="min-w-0">
            <div className={`font-mono uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] leading-none mb-1 ${t.fieldLabel}`}>
              estado
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <motion.span
                className="block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: tone.border }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <span className={`text-[hsl(var(--ink-primary))] truncate ${t.stateLabel} uppercase tracking-[0.18em] font-mono`}>
                {tone.label}
              </span>
            </div>
          </div>

          {/* Missão atual */}
          <div className="min-w-0">
            <div className={`font-mono uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] leading-none mb-1 ${t.fieldLabel}`}>
              {hasMission ? 'missão atual' : 'sem missão'}
            </div>
            <div className={`text-[hsl(var(--ink-primary))] leading-snug break-words ${t.mission}`}>
              {hasMission ? snapshot.currentMission : `${snapshot.streak}d sem crítico`}
            </div>
            {hasMission && (
              <div className="mt-1.5 w-full bg-[hsl(var(--hairline))] rounded-full overflow-hidden h-[2px]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: tone.border }}
                  animate={{ width: `${Math.round(snapshot.progress * 100)}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            <InfoChip label="tempo" value={hasMission ? formatElapsed(snapshot.elapsedSec) : '—'} sizes={t} />
            <InfoChip label="próximo" value={snapshot.nextEvent ?? '—'} sizes={t} />
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-1.5 shrink-0">
            <MiniStat label="pts" value={snapshot.scoreToday} sizes={t} />
            <MiniStat label="falhas" value={snapshot.scoreOpponent} sizes={t} accent={snapshot.scoreOpponent > 0} />
            <MiniStat label="streak" value={`${snapshot.streak}d`} sizes={t} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function MiniStat({
  label,
  value,
  sizes,
  accent,
}: {
  label: string;
  value: string | number;
  sizes: { statLabel: string; statValue: string };
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] px-1.5 py-1 min-w-0">
      <div className={`font-mono uppercase tracking-[0.16em] text-[hsl(var(--ink-faint))] leading-none ${sizes.statLabel}`}>
        {label}
      </div>
      <div
        className={`mt-0.5 font-display tabular-nums leading-none tracking-tight truncate ${sizes.statValue} ${
          accent ? 'text-[hsl(var(--brand-magenta))]' : 'text-[hsl(var(--ink-primary))]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
