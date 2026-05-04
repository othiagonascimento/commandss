import { useEffect, useState } from 'react';
import { Smartphone, Share, Plus, Download, Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|windows|linux/.test(ua)) return 'desktop';
  return 'unknown';
}

export default function Install() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink pt-safe pb-safe pl-safe pr-safe">
      <div className="max-w-md mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-ink-3 hover:text-ink mb-6 font-mono text-[11px] uppercase tracking-wider"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-20 w-20 rounded-2xl overflow-hidden ring-1 ring-hairline mb-5 shadow-2xl">
            <img src="/icons/icon-512.png" alt="Uôpa Master" className="h-full w-full object-cover" width={80} height={80} loading="lazy" />
          </div>
          <h1 className="font-display text-3xl tracking-tight">Instale o Uôpa Master</h1>
          <p className="text-ink-2 mt-2 text-sm leading-relaxed">
            Tenha o painel de comando do CRM direto na tela inicial do seu dispositivo, em tela cheia, com cara de app nativo.
          </p>
        </div>

        {installed ? (
          <div className="surface-1 rounded-lg p-6 text-center">
            <Check className="h-10 w-10 text-jade mx-auto mb-3" />
            <div className="font-display text-lg">App já instalado</div>
            <div className="text-ink-3 text-sm mt-1">Você está rodando em modo standalone.</div>
          </div>
        ) : platform === 'ios' ? (
          <Steps
            title="iPhone / iPad (Safari)"
            steps={[
              { icon: <Share className="h-4 w-4" />, label: 'Toque no botão Compartilhar', desc: 'Ícone na barra inferior do Safari' },
              { icon: <Plus className="h-4 w-4" />,  label: 'Selecione "Adicionar à Tela de Início"', desc: 'Pode estar mais abaixo na lista' },
              { icon: <Check className="h-4 w-4" />, label: 'Confirme tocando em "Adicionar"', desc: 'Pronto — abra pelo ícone na home' },
            ]}
          />
        ) : platform === 'android' ? (
          <>
            {deferred && (
              <button
                onClick={promptInstall}
                className="w-full mb-4 h-12 rounded-lg bg-brand-gradient text-white font-display tracking-tight flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="h-4 w-4" /> Instalar agora
              </button>
            )}
            <Steps
              title="Android (Chrome)"
              steps={[
                { icon: <Smartphone className="h-4 w-4" />, label: 'Toque no menu (⋮) do Chrome', desc: 'Canto superior direito' },
                { icon: <Plus className="h-4 w-4" />,       label: 'Escolha "Instalar app" ou "Adicionar à tela inicial"', desc: '' },
                { icon: <Check className="h-4 w-4" />,      label: 'Confirme a instalação', desc: 'O ícone aparece na sua home' },
              ]}
            />
          </>
        ) : (
          <Steps
            title="Desktop (Chrome / Edge)"
            steps={[
              { icon: <Download className="h-4 w-4" />, label: 'Clique no ícone de instalação na barra de URL', desc: 'Geralmente à direita' },
              { icon: <Check className="h-4 w-4" />, label: 'Confirme em "Instalar"', desc: 'O app abre em janela própria' },
            ]}
          />
        )}
      </div>
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: { icon: React.ReactNode; label: string; desc: string }[] }) {
  return (
    <div className="surface-1 rounded-lg p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3 mb-4">{title}</div>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-surface-2 hairline border flex items-center justify-center text-plasma">
              {s.icon}
            </div>
            <div className="flex-1 pt-1">
              <div className="text-sm text-ink">{s.label}</div>
              {s.desc && <div className="text-xs text-ink-3 mt-0.5">{s.desc}</div>}
            </div>
            <div className="font-mono text-[10px] text-ink-faint pt-2">0{i + 1}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
