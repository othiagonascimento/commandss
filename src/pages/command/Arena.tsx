/**
 * UÔPA ARENA — Onda A (esqueleto vivo).
 *
 * - 9 arenas em grid 3×3, sem scroll.
 * - Modo TV: ?tv=1 → esconde sidebar/header, ativa câmera automática
 *   focando a arena com maior prioridade por 8s, depois rotaciona.
 * - Mock engine roda no cliente; substitui por Realtime na Onda B.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, X } from 'lucide-react';
import {
  ARENAS,
  ArenaSnapshot,
  STATE_PRIORITY,
  STATE_TONE,
  generateMockSnapshot,
} from '@/lib/command/arena';
import { ArenaCard } from '@/components/command/arena/ArenaCard';
import { ArenaScene } from '@/components/command/arena/ArenaScenes';
import { EventTicker } from '@/components/command/arena/EventTicker';
import { GlobalPulse } from '@/components/command/arena/GlobalPulse';

export default function Arena() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tvMode = params.get('tv') === '1';

  const [now, setNow] = useState(() => new Date());
  const [data, setData] = useState(() => generateMockSnapshot(Date.now()));
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const [spotlightSlug, setSpotlightSlug] = useState<string | null>(null);
  const lastFocusRef = useRef<Map<string, number>>(new Map());

  // Mock engine tick — re-gera snapshot a cada 4s
  useEffect(() => {
    const t = setInterval(() => {
      const ts = Date.now();
      setNow(new Date(ts));
      setData(generateMockSnapshot(ts));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Camera director (apenas modo TV) — pontua arenas e foca a líder
  useEffect(() => {
    if (!tvMode) {
      setFocusSlug(null);
      return;
    }
    const tick = () => {
      const ts = Date.now();
      const scored = ARENAS.map((a) => {
        const snap = data.arenas[a.slug];
        const last = lastFocusRef.current.get(a.slug) ?? 0;
        const novelty = Math.min(1, (ts - last) / 30000);
        const priority = STATE_PRIORITY[snap.state] / 100;
        return { slug: a.slug, score: priority * 0.7 + novelty * 0.3 + snap.intensity * 0.1 };
      }).sort((a, b) => b.score - a.score);
      const next = scored[0]?.slug ?? null;
      if (next) {
        lastFocusRef.current.set(next, ts);
        setFocusSlug(next);
      }
    };
    tick();
    const t = setInterval(tick, 8000);
    return () => clearInterval(t);
  }, [tvMode, data]);

  const ordered = useMemo(() => ARENAS, []);

  const exitTv = () => {
    params.delete('tv');
    setParams(params);
  };
  const enterTv = () => {
    params.set('tv', '1');
    setParams(params);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[hsl(var(--canvas))]">
      <GlobalPulse snapshots={data.arenas} now={now} tvMode={tvMode} />

      {/* Skybox / clima global */}
      <div
        className="relative flex-1 min-h-0 overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--surface-1)) 0%, hsl(var(--canvas)) 60%),
            radial-gradient(ellipse 60% 40% at 50% 100%, hsl(var(--brand-magenta)/0.04) 0%, transparent 70%)
          `,
        }}
      >
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-screen"
          style={{
            backgroundImage:
              'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.9\' numOctaves=\'2\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
          }}
        />

        <div
          className={`relative h-full p-3 sm:p-4 lg:p-6 gap-3 lg:gap-4 ${
            tvMode
              ? 'grid grid-cols-3 grid-rows-3 overflow-hidden'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3 overflow-y-auto lg:overflow-hidden auto-rows-fr'
          }`}
        >
          {ordered.map((arena, idx) => {
            const snap = data.arenas[arena.slug];
            return (
              <ArenaCard
                key={arena.slug}
                arena={arena}
                snapshot={snap}
                index={idx}
                tv={tvMode}
                fill={tvMode}
                focused={focusSlug === arena.slug}
                onClick={() => setSpotlightSlug(arena.slug)}
              />
            );
          })}
        </div>

        {/* TV controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {tvMode ? (
            <button
              onClick={exitTv}
              className="h-8 px-3 rounded-md bg-[hsl(var(--surface-2)/0.7)] backdrop-blur-md border border-[hsl(var(--hairline))] text-[11px] text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink-primary))] flex items-center gap-1.5 transition-colors"
            >
              <Minimize2 className="w-3 h-3" /> sair tv
            </button>
          ) : (
            <button
              onClick={enterTv}
              className="h-8 px-3 rounded-md bg-[hsl(var(--surface-2)/0.7)] backdrop-blur-md border border-[hsl(var(--hairline))] text-[11px] text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink-primary))] flex items-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-3 h-3" /> modo tv
            </button>
          )}
        </div>
      </div>

      <EventTicker events={data.events} />

      {/* Spotlight modal */}
      <AnimatePresence>
        {spotlightSlug && (
          <SpotlightSheet
            slug={spotlightSlug}
            snapshot={data.arenas[spotlightSlug]}
            onClose={() => setSpotlightSlug(null)}
            onOpenMissions={() => {
              setSpotlightSlug(null);
              navigate('/command/missions');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SpotlightSheet({
  slug,
  snapshot,
  onClose,
  onOpenMissions,
}: {
  slug: string;
  snapshot: ArenaSnapshot;
  onClose: () => void;
  onOpenMissions: () => void;
}) {
  const arena = ARENAS.find((a) => a.slug === slug)!;
  const tone = STATE_TONE[snapshot.state];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[hsl(var(--canvas)/0.85)] backdrop-blur-2xl" />
      <motion.div
        initial={{ y: 24, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[min(960px,94vw)] rounded-2xl border bg-[hsl(var(--surface-1))] overflow-hidden"
        style={{ borderColor: tone.border, boxShadow: `0 50px 120px -20px ${tone.glow}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 h-14 border-b border-[hsl(var(--hairline))]">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))]">
              bastidores · {arena.sportLabel}
            </div>
            <div className="font-display text-[20px] tracking-tight text-[hsl(var(--ink-primary))] leading-tight">
              {arena.division}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-[hsl(var(--surface-2))]">
            <X className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
          </button>
        </div>

        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[320px] bg-[hsl(var(--canvas))]">
            <ArenaScene sport={arena.sport} state={snapshot.state} intensity={snapshot.intensity} />
          </div>

          <div className="p-6 space-y-5 border-l border-[hsl(var(--hairline))]">
            <Field label="Estado">
              <span className="flex items-center gap-2">
                <span className="block w-2 h-2 rounded-full" style={{ background: tone.border }} />
                <span className="text-[15px] text-[hsl(var(--ink-primary))]">{tone.label}</span>
              </span>
            </Field>
            <Field label="Missão atual">
              <span className="text-[14px] text-[hsl(var(--ink-primary))]">
                {snapshot.currentMission ?? '—'}
              </span>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Stat title="Pontos hoje" value={snapshot.scoreToday} />
              <Stat title="Falhas" value={snapshot.scoreOpponent} accent={snapshot.scoreOpponent > 0} />
              <Stat title="Streak" value={`${snapshot.streak}d`} />
            </div>
            <Field label="Metáfora">
              <span className="text-[12.5px] text-[hsl(var(--ink-secondary))] leading-relaxed">
                {arena.rationale}
              </span>
            </Field>
            <button
              onClick={onOpenMissions}
              className="mt-2 w-full h-10 rounded-md bg-[hsl(var(--brand-magenta))] text-white text-[13px] hover:opacity-90 transition-opacity"
            >
              Abrir missões da divisão →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Stat({ title, value, accent }: { title: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ink-faint))]">
        {title}
      </div>
      <div
        className={`mt-1.5 font-display tabular-nums text-[24px] leading-none tracking-tight ${
          accent ? 'text-[hsl(var(--brand-magenta))]' : 'text-[hsl(var(--ink-primary))]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
