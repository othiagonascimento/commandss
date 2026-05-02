import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PrivacyCtx {
  hidden: boolean;
  toggle: () => void;
  setHidden: (v: boolean) => void;
}

const Ctx = createContext<PrivacyCtx | null>(null);
const KEY = 'ui:privacy:financial';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHiddenState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === '1'; // default oculto (estilo bancário)
  });

  useEffect(() => {
    localStorage.setItem(KEY, hidden ? '1' : '0');
  }, [hidden]);

  return (
    <Ctx.Provider value={{ hidden, toggle: () => setHiddenState(v => !v), setHidden: setHiddenState }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePrivacy() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrivacy must be used inside PrivacyProvider');
  return v;
}
