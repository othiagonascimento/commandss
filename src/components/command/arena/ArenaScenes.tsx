/**
 * Cenas SVG por esporte — abstratas, premium, sem mascote.
 * Cada cena recebe `intensity` (0..1) e `state` e anima sutilmente.
 * Onda A: 9 cenas com vocabulário visual consistente (court linhas finas,
 * atleta como silhueta geométrica, sombra spotlight).
 */
import { motion } from 'framer-motion';
import { ArenaState, SportSlug } from '@/lib/command/arena';

interface SceneProps {
  state: ArenaState;
  intensity: number;
}

const isLive = (s: ArenaState) =>
  s !== 'standby';

const speed = (state: ArenaState, intensity: number) => {
  const base = state === 'critical' ? 0.6
    : state === 'high' ? 0.9
    : state === 'attention' ? 1.1
    : state === 'recovery' ? 1.4
    : state === 'queue' ? 1.3
    : state === 'active' ? 1.6
    : 3.2;
  return base / (0.5 + intensity);
};

/* helper — cor da linha da quadra */
const COURT = 'hsl(var(--ink-secondary)/0.25)';
const COURT_BRIGHT = 'hsl(var(--ink-primary)/0.55)';
const ACCENT = 'hsl(var(--brand-magenta))';

export function ArenaScene({ sport, state, intensity }: { sport: SportSlug } & SceneProps) {
  const Comp = SCENES[sport];
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 35%, hsl(var(--ink-primary)/${
            isLive(state) ? 0.06 + intensity * 0.08 : 0.02
          }) 0%, transparent 70%)`,
        }}
      />
      <Comp state={state} intensity={intensity} />
    </div>
  );
}

/* ─────────────── Cenas ─────────────── */

function TennisScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  const ballColor = state === 'critical' ? ACCENT : 'hsl(var(--jade))';
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* Subtle clay underlay */}
      <defs>
        <linearGradient id="tennis-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(13 50% 30%)" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(13 50% 30%)" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="tennis-trail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ballColor} stopOpacity="0" />
          <stop offset="100%" stopColor={ballColor} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <polygon points="50,30 150,30 185,100 15,100" fill="url(#tennis-clay)" />

      {/* Quadra em perspectiva (trapézio) */}
      <polygon
        points="50,30 150,30 185,100 15,100"
        fill="none"
        stroke={COURT}
        strokeWidth="0.7"
      />
      {/* Linhas internas (corredor) */}
      <line x1="60" y1="30" x2="35" y2="100" stroke={COURT} strokeWidth="0.4" />
      <line x1="140" y1="30" x2="165" y2="100" stroke={COURT} strokeWidth="0.4" />
      {/* Linha de saque (atrás) */}
      <line x1="68" y1="50" x2="132" y2="50" stroke={COURT} strokeWidth="0.4" />
      {/* Linha de saque (à frente) */}
      <line x1="50" y1="78" x2="150" y2="78" stroke={COURT} strokeWidth="0.4" />
      {/* Linha central de saque */}
      <line x1="100" y1="50" x2="100" y2="78" stroke={COURT} strokeWidth="0.3" strokeDasharray="2 2" />
      {/* Rede */}
      <line x1="40" y1="65" x2="160" y2="65" stroke={COURT_BRIGHT} strokeWidth="0.7" />
      <line x1="40" y1="63" x2="40" y2="67" stroke={COURT_BRIGHT} strokeWidth="0.6" />
      <line x1="160" y1="63" x2="160" y2="67" stroke={COURT_BRIGHT} strokeWidth="0.6" />

      {/* Atleta longe (cápsula menor, mais opaca/clara) */}
      <motion.g
        animate={isLive(state) ? { x: [-4, 4, -4] } : { x: [-1, 1, -1] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="100" cy="42" rx="2" ry="1.2" fill="hsl(var(--ink-primary)/0.08)" />
        <rect x="98.5" y="36" width="3" height="6" rx="1.5" fill="hsl(var(--ink-secondary))" opacity="0.7" />
        <circle cx="100" cy="34.5" r="1.2" fill="hsl(var(--ink-secondary))" opacity="0.7" />
      </motion.g>

      {/* Atleta perto (cápsula maior, com mais peso) */}
      <motion.g
        animate={isLive(state) ? { x: [4, -4, 4] } : { x: [1, -1, 1] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="100" cy="92" rx="3.5" ry="1.6" fill="hsl(var(--ink-primary)/0.18)" />
        <rect x="97.5" y="80" width="5" height="11" rx="2.5" fill="hsl(var(--ink-primary))" />
        <circle cx="100" cy="78" r="2" fill="hsl(var(--ink-primary))" />
      </motion.g>

      {/* Bola + rastro diagonal */}
      <motion.g
        animate={
          isLive(state)
            ? { x: [-30, 30, -30], y: [10, -10, 10] }
            : { x: [-6, 6, -6], y: [2, -2, 2] }
        }
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '100px 65px' }}
      >
        {/* Rastro */}
        <line
          x1="100" y1="65"
          x2={isLive(state) ? '88' : '96'}
          y2={isLive(state) ? '69' : '67'}
          stroke="url(#tennis-trail)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle r="1.6" cx="100" cy="65" fill={ballColor} />
        <circle r="3.5" cx="100" cy="65" fill={ballColor} opacity="0.18" />
      </motion.g>
    </svg>
  );
}

function BoxingScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  const punch = state === 'critical' || state === 'attention';
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* ring */}
      <rect x="30" y="30" width="140" height="60" fill="none" stroke={COURT} strokeWidth="0.6" />
      <line x1="30" y1="40" x2="170" y2="40" stroke={COURT} strokeWidth="0.3" />
      <line x1="30" y1="80" x2="170" y2="80" stroke={COURT} strokeWidth="0.3" />
      {/* lutador A */}
      <motion.g
        animate={{ x: punch ? [0, 12, 0] : [0, 3, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="60" y="55" width="6" height="14" fill="hsl(var(--ink-primary))" />
        <circle cx="63" cy="52" r="3" fill="hsl(var(--ink-primary))" />
      </motion.g>
      {/* lutador B */}
      <motion.g
        animate={{ x: punch ? [0, -12, 0] : [0, -3, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="134" y="55" width="6" height="14" fill={state === 'critical' ? ACCENT : 'hsl(var(--ink-secondary))'} />
        <circle cx="137" cy="52" r="3" fill={state === 'critical' ? ACCENT : 'hsl(var(--ink-secondary))'} />
      </motion.g>
    </svg>
  );
}

function F1Scene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity) * 0.6;
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* pista oval */}
      <ellipse cx="100" cy="60" rx="75" ry="32" fill="none" stroke={COURT} strokeWidth="0.6" />
      <ellipse cx="100" cy="60" rx="55" ry="20" fill="none" stroke={COURT} strokeWidth="0.4" strokeDasharray="3 3" />
      {/* carros */}
      {[0, 0.33, 0.66].map((offset, i) => (
        <motion.g key={i}>
          <motion.rect
            width="6" height="3" rx="1"
            fill={i === 0 ? 'hsl(var(--jade))' : i === 1 ? ACCENT : 'hsl(var(--ink-secondary))'}
            animate={{
              offsetDistance: ['0%', '100%'],
            }}
            transition={{ duration: dur * (1 + i * 0.15), repeat: Infinity, ease: 'linear', delay: -offset * dur }}
            style={{
              offsetPath: `path("M 100 28 a 75 32 0 1 1 -0.1 0")`,
              offsetRotate: 'auto',
            }}
          />
        </motion.g>
      ))}
    </svg>
  );
}

function SurfScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* ondas */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M 0 ${70 + i * 8} Q 50 ${55 + i * 8} 100 ${70 + i * 8} T 200 ${70 + i * 8}`}
          fill="none"
          stroke={i === 0 ? COURT_BRIGHT : COURT}
          strokeWidth="0.6"
          animate={{ x: [0, -50] }}
          transition={{ duration: dur * (2 + i), repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* surfista */}
      <motion.g
        animate={{ y: isLive(state) ? [0, -3, 0] : [0, -1, 0], rotate: isLive(state) ? [-5, 5, -5] : [-2, 2, -2] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '100px 60px' }}
      >
        <line x1="92" y1="65" x2="108" y2="65" stroke="hsl(var(--ink-primary))" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="100" cy="58" r="2.5" fill="hsl(var(--ink-primary))" />
      </motion.g>
    </svg>
  );
}

function VolleyScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* rede */}
      <line x1="100" y1="35" x2="100" y2="90" stroke={COURT_BRIGHT} strokeWidth="0.5" />
      <line x1="20" y1="90" x2="180" y2="90" stroke={COURT} strokeWidth="0.6" />
      {/* jogadores */}
      <circle cx="55" cy="78" r="2.5" fill="hsl(var(--ink-primary))" />
      <circle cx="145" cy="78" r="2.5" fill="hsl(var(--ink-secondary))" />
      {/* bola arco */}
      <motion.circle
        r="2"
        fill={state === 'critical' ? ACCENT : 'hsl(var(--jade))'}
        animate={isLive(state)
          ? { cx: [55, 100, 145, 100, 55], cy: [70, 30, 70, 30, 70] }
          : { cx: [55, 60, 55], cy: [70, 65, 70] }
        }
        transition={{ duration: dur * 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

function RowingScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* rio */}
      <line x1="0" y1="80" x2="200" y2="80" stroke={COURT} strokeWidth="0.4" />
      <line x1="0" y1="50" x2="200" y2="50" stroke={COURT} strokeWidth="0.3" strokeDasharray="2 4" />
      {/* barco */}
      <motion.g
        animate={{ x: isLive(state) ? [0, 6, 0] : [0, 2, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M 50 65 L 150 65 L 145 70 L 55 70 Z" fill="hsl(var(--ink-primary))" opacity="0.85" />
        {[60, 75, 90, 105, 120, 135].map((x, i) => (
          <motion.line
            key={i}
            x1={x} y1="63" x2={x - 8} y2="55"
            stroke="hsl(var(--ink-secondary))"
            strokeWidth="0.8"
            strokeLinecap="round"
            animate={{ rotate: isLive(state) ? [-15, 25, -15] : [-5, 5, -5] }}
            transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: `${x}px 63px` }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

function FencingScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  const lunge = state === 'high' || state === 'critical';
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <line x1="20" y1="85" x2="180" y2="85" stroke={COURT_BRIGHT} strokeWidth="0.5" />
      {/* esgrimista esq */}
      <motion.g
        animate={{ x: lunge ? [0, 18, 0] : [0, 2, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="65" cy="68" r="3" fill="hsl(var(--ink-primary))" />
        <line x1="65" y1="71" x2="65" y2="85" stroke="hsl(var(--ink-primary))" strokeWidth="1.2" />
        <line x1="65" y1="74" x2="95" y2="68" stroke="hsl(var(--jade))" strokeWidth="1" strokeLinecap="round" />
      </motion.g>
      {/* esgrimista dir */}
      <motion.g
        animate={{ x: lunge ? [0, -18, 0] : [0, -2, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="135" cy="68" r="3" fill={state === 'critical' ? ACCENT : 'hsl(var(--ink-secondary))'} />
        <line x1="135" y1="71" x2="135" y2="85" stroke="hsl(var(--ink-secondary))" strokeWidth="1.2" />
        <line x1="135" y1="74" x2="105" y2="68" stroke="hsl(var(--ink-secondary))" strokeWidth="1" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

function ChessScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* tabuleiro 4x4 */}
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 4 }).map((_, c) => (
          <rect
            key={`${r}${c}`}
            x={70 + c * 16}
            y={30 + r * 16}
            width="16"
            height="16"
            fill={(r + c) % 2 === 0 ? 'hsl(var(--ink-primary)/0.06)' : 'transparent'}
            stroke={COURT}
            strokeWidth="0.3"
          />
        )),
      )}
      {/* peça que se move */}
      <motion.circle
        r="3.5"
        fill={state === 'critical' ? ACCENT : 'hsl(var(--ink-primary))'}
        animate={{
          cx: [78, 110, 142, 110, 78],
          cy: [38, 70, 38, 70, 38],
        }}
        transition={{ duration: dur * 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

function HockeyScene({ state, intensity }: SceneProps) {
  const dur = speed(state, intensity);
  const shotIncoming = state === 'attention' || state === 'critical' || state === 'queue';
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* gol */}
      <rect x="35" y="45" width="14" height="40" fill="none" stroke={COURT_BRIGHT} strokeWidth="0.6" />
      <line x1="49" y1="45" x2="49" y2="85" stroke={COURT} strokeWidth="0.3" strokeDasharray="2 2" />
      {/* goleiro */}
      <motion.g
        animate={{ y: shotIncoming ? [-6, 6, -6] : [-1, 1, -1] }}
        transition={{ duration: dur * 0.9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="52" y="58" width="6" height="14" fill="hsl(var(--ink-primary))" />
        <circle cx="55" cy="55" r="3" fill="hsl(var(--ink-primary))" />
      </motion.g>
      {/* disco */}
      <motion.circle
        r="2"
        fill={state === 'critical' ? ACCENT : 'hsl(var(--ink-secondary))'}
        animate={shotIncoming
          ? { cx: [180, 60], cy: [65, 65 + (Math.random() - 0.5) * 20] }
          : { cx: [180, 170, 180], cy: [65, 60, 65] }
        }
        transition={{ duration: dur, repeat: Infinity, ease: shotIncoming ? 'easeIn' : 'easeInOut' }}
      />
    </svg>
  );
}

const SCENES: Record<SportSlug, React.FC<SceneProps>> = {
  tennis: TennisScene,
  boxing: BoxingScene,
  f1: F1Scene,
  surf: SurfScene,
  volley: VolleyScene,
  rowing: RowingScene,
  fencing: FencingScene,
  chess: ChessScene,
  hockey: HockeyScene,
};
