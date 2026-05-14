import { motion, AnimatePresence } from 'framer-motion';
import { ArenaEvent } from '@/lib/command/arena';

const TONE_COLOR: Record<ArenaEvent['tone'], string> = {
  good: 'hsl(var(--jade))',
  warn: '#F2A93B',
  bad: 'hsl(var(--brand-magenta))',
  neutral: 'hsl(var(--ink-faint))',
};

export function EventTicker({ events }: { events: ArenaEvent[] }) {
  return (
    <div className="border-t border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] h-9 flex items-center overflow-hidden">
      <span className="shrink-0 px-4 font-mono text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] border-r border-[hsl(var(--hairline))] h-full flex items-center">
        live
      </span>
      <div className="flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={events[0]?.id ?? 'empty'}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-6 px-5 whitespace-nowrap"
          >
            {events.slice(0, 6).map((e) => (
              <span
                key={e.id}
                className="flex items-center gap-2 font-mono text-[11px] text-[hsl(var(--ink-secondary))]"
              >
                <span className="block w-1 h-1 rounded-full" style={{ background: TONE_COLOR[e.tone] }} />
                {e.text}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
