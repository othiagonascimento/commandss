/**
 * ArenaCard — direção "Arquitetônica detalhada".
 * Estrutura 60% cena + 40% dados narrativos.
 *   Linha A: rótulo do esporte (small caps) + nome da divisão grande + chip de estado
 *   Linha B: missão atual (linguagem natural) + tempo decorrido
 *   Linha C: barra de progresso fina + Wins/Fails + próximo evento
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
      className={`relative rounded-xl bg-[hsl(var(--surface-1))] overflow-hidden text-left group grid w-full ${
        fill
          ? 'h-full min-h-0 grid-rows-[minmax(72px,1fr)_auto]'
          : 'aspect-[16/10] grid-rows-[minmax(92px,1fr)_auto]'
      }`}
      style={{ borderColor: tone.border }}
    >
      {/* ─────── CENA (60%) ─────── */}
      <div className="relative min-h-0 w-full overflow-hidden">
        {/* Ambient glow — só sob a cena */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${tone.glow} 0%, transparent 70%)`,
            opacity: focused ? 1 : 0.55,
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

        {/* Badge "Arena 0X" canto superior esquerdo */}
        <div className="absolute top-2 left-2 z-10">
          <div className="px-1.5 py-0.5 border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas)/0.55)] backdrop-blur-md rounded font-mono text-[8px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))]">
            arena {String(index + 1).padStart(2, '0')}
          </div>
        </div>

        {/* Chip de estado canto superior direito */}
        <div className="absolute top-2 right-2 z-10">
          <StateChip state={snapshot.state} />
        </div>
      </div>

      {/* ─────── DADOS (40%) ─────── */}
      <div className={`relative flex min-h-0 flex-col gap-1.5 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] ${
        tv ? 'px-4 py-2.5' : 'px-3 py-2'
      }`}>
        {/* Linha A — esporte / divisão */}
        <div className="flex items-baseline justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className={`font-mono uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] leading-none ${
              tv ? 'text-[9px]' : 'text-[7.5px]'
            }`}>
              {arena.sportLabel}
            </div>
            <div className={`font-display leading-tight tracking-tight text-[hsl(var(--ink-primary))] mt-0.5 truncate ${
              tv ? 'text-[18px]' : 'text-[12px]'
            }`}>
              {arena.division}
            </div>
          </div>
        </div>

        {/* Linha B — missão atual + tempo */}
        <div className="flex items-end justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className={`font-mono uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))] leading-none mb-0.5 ${
              tv ? 'text-[8.5px]' : 'text-[7.5px]'
            }`}>
              {hasMission ? 'missão' : 'streak'}
            </div>
            <div className={`text-[hsl(var(--ink-secondary))] leading-tight truncate ${
              tv ? 'text-[12px]' : 'text-[10px]'
            }`}>
              {hasMission ? snapshot.currentMission : `${snapshot.streak}d sem crítico`}
            </div>
          </div>
          {hasMission && (
            <div className={`font-mono tabular-nums text-[hsl(var(--ink-muted))] shrink-0 ${
              tv ? 'text-[11px]' : 'text-[9px]'
            }`}>
              {formatElapsed(snapshot.elapsedSec)}
            </div>
          )}
        </div>

        {/* Linha C — progresso + W/F + próximo */}
        <div className="space-y-1">
          <div className={`w-full bg-[hsl(var(--hairline))] rounded-full overflow-hidden ${tv ? 'h-[3px]' : 'h-[2px]'}`}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: tone.border }}
              animate={{ width: `${Math.round((hasMission ? snapshot.progress : 0) * 100)}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className={`flex items-center justify-between gap-2 font-mono uppercase tracking-[0.14em] text-[hsl(var(--ink-faint))] ${
            tv ? 'text-[9px]' : 'text-[7.5px]'
          }`}>
            <div className="flex items-center gap-2 shrink-0">
              <span>
                W <span className="text-[hsl(var(--ink-primary))] tabular-nums ml-0.5">
                  {String(snapshot.scoreToday).padStart(2, '0')}
                </span>
              </span>
              <span className={snapshot.scoreOpponent > 0 ? 'text-[hsl(var(--brand-magenta))]' : ''}>
                F <span className="tabular-nums ml-0.5">
                  {String(snapshot.scoreOpponent).padStart(2, '0')}
                </span>
              </span>
            </div>
            {snapshot.nextEvent && (
              <div className="truncate min-w-0 text-right">
                <span className="opacity-60">próx</span>{' '}
                <span className="text-[hsl(var(--ink-secondary))] normal-case tracking-normal">
                  {snapshot.nextEvent}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function StateChip({ state }: { state: ArenaSnapshot['state'] }) {
  const tone = STATE_TONE[state];
  const pulsing = state === 'critical' || state === 'attention' || state === 'queue';
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-[hsl(var(--canvas)/0.55)] backdrop-blur-md border border-[hsl(var(--hairline))]">
      <motion.span
        className="block w-1.5 h-1.5 rounded-full"
        style={{ background: tone.border }}
        animate={pulsing ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-secondary))]">
        {tone.label}
      </span>
    </div>
  );
}
