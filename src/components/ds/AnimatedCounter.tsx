import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface Props {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Contador discreto. Anima do valor anterior até o novo com easing suave. */
export function AnimatedCounter({ value, format = (n) => Math.round(n).toString(), duration = 700, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const prev = useRef(0);
  const [display, setDisplay] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const from = prev.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { prev.current = to; setFlash(true); setTimeout(() => setFlash(false), 800); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, duration]);

  return (
    <span ref={ref} className={`${className ?? ''} ${flash ? 'animate-data-flash' : ''}`}>
      {format(display)}
    </span>
  );
}
