import { motion } from 'framer-motion';
import { Arena, ArenaSnapshot, STATE_TONE } from '@/lib/command/arena';
import { ArenaScene } from './ArenaScenes';

interface Props {
  arena: Arena;
  snapshot: ArenaSnapshot;
  focused?: boolean;
  onClick?: () => void;
}

export function ArenaCard({ arena, snapshot, focused, onClick }: Props) {
  const tone = STATE_TONE[snapshot.state];
  const isCritical = snapshot.state === 'critical';

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
      className="relative aspect-[16/10] rounded-xl bg-[hsl(var(--surface-1))] overflow-hidden text-left group"
      style={{ borderColor: tone.border }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${tone.glow} 0%, transparent 65%)`,
          opacity: focused ? 1 : 0.6,
        }}
      />

      {/* Critical screen-shake */}
      <motion.div
        className="absolute inset-0"
        animate={isCritical ? { x: [-0.6, 0.6, -0.6] } : { x: 0 }}
        transition={{ duration: 0.18, repeat: isCritical ? Infinity : 0 }}
      >
        <ArenaScene sport={arena.sport} state={snapshot.state} intensity={snapshot.intensity} />
      </motion.div>

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 px-3 pt-2.5 flex items-start justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))]">
            {arena.sportLabel}
          </div>
          <div className="font-display text-[14px] leading-tight tracking-tight text-[hsl(var(--ink-primary))] mt-0.5">
            {arena.division}
          </div>
        </div>
        <StateBadge state={snapshot.state} />
      </div>

      {/* Footer overlay — placar + missão */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 flex items-end justify-between">
        <div className="min-h-[14px]">
          {snapshot.currentMission ? (
            <div className="text-[10.5px] text-[hsl(var(--ink-secondary))] line-clamp-1 max-w-[160px]">
              → {snapshot.currentMission}
            </div>
          ) : (
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))]">
              streak {snapshot.streak}d
            </div>
          )}
        </div>
        <Scoreboard left={snapshot.scoreToday} right={snapshot.scoreOpponent} />
      </div>
    </motion.button>
  );
}

function StateBadge({ state }: { state: ArenaSnapshot['state'] }) {
  const tone = STATE_TONE[state];
  const pulsing = state === 'critical' || state === 'attention' || state === 'queue';
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className="block w-1.5 h-1.5 rounded-full"
        style={{ background: tone.border }}
        animate={pulsing ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ink-secondary))]">
        {tone.label}
      </span>
    </div>
  );
}

function Scoreboard({ left, right }: { left: number; right: number }) {
  return (
    <div className="flex items-baseline gap-1.5 font-display tabular-nums">
      <motion.span
        key={left}
        initial={{ y: -3, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="text-[20px] leading-none text-[hsl(var(--ink-primary))]"
      >
        {String(left).padStart(2, '0')}
      </motion.span>
      <span className="text-[10px] text-[hsl(var(--ink-faint))]">·</span>
      <motion.span
        key={right}
        initial={{ y: -3, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={`text-[14px] leading-none ${
          right > 0 ? 'text-[hsl(var(--brand-magenta))]' : 'text-[hsl(var(--ink-faint))]'
        }`}
      >
        {String(right).padStart(2, '0')}
      </motion.span>
    </div>
  );
}
