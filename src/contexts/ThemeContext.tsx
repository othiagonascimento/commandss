import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Mode = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeCtx {
  mode: Mode;
  resolved: Resolved;
  setMode: (m: Mode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = 'ui:theme:mode';

function readSystem(): Resolved {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function apply(resolved: Resolved) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(KEY) as Mode) || 'system';
  });
  const [resolved, setResolved] = useState<Resolved>(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem(KEY)) as Mode | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return readSystem();
  });

  useEffect(() => {
    const r: Resolved = mode === 'system' ? readSystem() : mode;
    setResolved(r);
    apply(r);
    localStorage.setItem(KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const r = mq.matches ? 'light' : 'dark';
      setResolved(r);
      apply(r);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  return <Ctx.Provider value={{ mode, resolved, setMode: setModeState }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
