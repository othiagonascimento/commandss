/**
 * ArenaCard — direção "Bastidores".
 * Layout split: header com esporte/divisão/estado, corpo em 2 colunas
 * (cena à esquerda, painel de dados à direita: missão atual + stats grid).
 * Inspirado no SpotlightSheet — mesma hierarquia, sem cortes.
 */
import { motion } from 'framer-motion';
import { Arena, ArenaSnapshot, STATE_TONE } from '@/lib/command/arena';
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

  // Sizing tokens — TV mode amplia tudo proporcionalmente
  const t = {
    headerH: tv ? 'h-12' : 'h-10',
    pad: tv ? 'px-4' : 'px-3',
    bodyPad: tv ? 'p-4' : 'p-2.5',
    sport: tv ? 'text-[9px]' : 'text-[7.5px]',
    division: tv ? 'text-[18px]' : 'text-[13px]',
    stateLabel: tv ? 'text-[9px]' : 'text-[7.5px]',
    fieldLabel: tv ? 'text-[8.5px]' : 'text-[7px]',
    mission: tv ? 'text-[14px]' : 'text-[11px]',
    statLabel: tv ? 'text-[8px]' : 'text-[6.5px]',
    statValue: tv ? 'text-[20px]' : 'text-[15px]',
  };

  return (
    <motion.button
      onClick={onClick}
      animate={{
        scale: focused ? 1.015 : 1,
        boxShadow: focused
          ? `0 30px 80px -20px ${tone.glow}, 0 0 0 1px ${tone.border}`
          : `0 0 0 1px ${tone.border}`,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-xl bg-[hsl(var(--surface-1))] overflow-hidden text-left group flex w-full flex-col ${
        fill ? 'h-full min-h-0' : 'aspect-[16/10] min-h-[240px]'
      }`}
      style={{ borderColor: tone.border }}
    >
      {/* ─────── HEADER ─────── */}
      <div className={`flex items-center justify-between gap-2 ${t.pad} ${t.headerH} border-b border-[hsl(var(--hairline))] shrink-0`}>
        <div className="min-w-0">
          <div className={`font-mono uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] leading-none ${t.sport}`}>
            bastidores · {arena.sportLabel}
          </div>
          <div className={`font-display leading-tight tracking-tight text-[hsl(var(--ink-primary))] mt-0.5 truncate ${t.division}`}>
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
      <div className="grid flex-1 min-h-0 grid-cols-[1.3fr_1fr]">
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
        <div className={`flex min-h-0 flex-col gap-2.5 ${t.bodyPad} bg-[hsl(var(--surface-1))] overflow-hidden`}>
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
          <div className="min-w-0 flex-1">
            <div className={`font-mono uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] leading-none mb-1 ${t.fieldLabel}`}>
              {hasMission ? 'missão atual' : 'sem missão'}
            </div>
            <div className={`text-[hsl(var(--ink-primary))] leading-snug line-clamp-2 ${t.mission}`}>
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
