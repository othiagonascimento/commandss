import { useEffect, useState } from 'react';

/**
 * Detecta se o app está rodando em modo standalone (instalado como PWA).
 * Aplica a classe `standalone` no <html> para permitir ajustes finos via CSS.
 */
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const iosStandalone = (window.navigator as any).standalone === true;
    const update = () => {
      const value = mql.matches || iosStandalone;
      setIsStandalone(value);
      document.documentElement.classList.toggle('standalone', value);
    };
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  return isStandalone;
}
