import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStore } from '@/lib/command/store';

const lines = [
  'awakening 8 agents',
  'syncing workspace · uopa',
  'binding realtime channels',
  'arming command bar · ⌘K',
  'live ops dock · online',
];

interface Props {
  onDone: () => void;
}

export function BootSequence({ onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const setBootSeen = useCommandStore((s) => s.setBootSeen);

  useEffect(() => {
    if (idx >= lines.length) {
      setDone(true);
      const t = setTimeout(() => {
        setBootSeen();
        onDone();
      }, 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 180);
    return () => clearTimeout(t);
  }, [idx, onDone, setBootSeen]);

  const skip = () => {
    setBootSeen();
    onDone();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[hsl(var(--canvas))] flex flex-col items-center justify-center cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      onClick={skip}
    >
      {/* Hairline crossing the screen */}
      <motion.div
        className="absolute top-1/2 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--brand-magenta)), transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />

      {/* Mark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative mb-10"
      >
        <div className="text-[88px] leading-none font-display tracking-tighter text-[hsl(var(--ink-primary))]">
          U<span className="text-[hsl(var(--brand-magenta))]">·</span>
        </div>
        <motion.div
          className="absolute inset-0 blur-2xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--brand-magenta) / 0.45), transparent 70%)' }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </motion.div>

      {/* Boot lines */}
      <div className="font-mono text-[11px] tracking-wide text-[hsl(var(--ink-secondary))] min-w-[280px] text-center space-y-1">
        <AnimatePresence mode="popLayout">
          {lines.slice(0, idx).map((l, i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: i === idx - 1 ? 1 : 0.4, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <span className="text-[hsl(var(--brand-magenta))] mr-2">›</span>
              {l}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 font-mono text-[10px] text-[hsl(var(--ink-faint))] tracking-widest uppercase">
        command ai · click to skip
      </div>
    </motion.div>
  );
}
