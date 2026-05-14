import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStore } from '@/lib/command/store';
import { Search, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  { label: '3 posts sobre IA pra restaurantes, tom provocador', kind: 'content' },
  { label: 'Como tá o Uôpa esse mês?', kind: 'intel' },
  { label: 'Briefing de campanha de Black Friday — 7 dias', kind: 'mission' },
  { label: 'Replay da última campanha', kind: 'analyst' },
];

export function CommandBar() {
  const open = useCommandStore((s) => s.commandBarOpen);
  const close = useCommandStore((s) => s.closeCommandBar);
  const toggle = useCommandStore((s) => s.toggleCommandBar);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, toggle]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-[hsl(var(--canvas)/0.7)] backdrop-blur-xl" />
          <motion.div
            initial={{ y: -16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-[min(720px,92vw)] rounded-2xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-2)/0.92)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 h-14 border-b border-[hsl(var(--hairline))]">
              <Search className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
              <input
                autoFocus
                placeholder="Diga o que precisa. O sistema decide o módulo."
                className="flex-1 bg-transparent border-0 outline-none text-[15px] text-[hsl(var(--ink-primary))] placeholder:text-[hsl(var(--ink-muted))] font-display"
              />
              <kbd className="font-mono text-[10px] text-[hsl(var(--ink-faint))] border border-[hsl(var(--hairline))] rounded px-1.5 py-0.5">esc</kbd>
            </div>

            <div className="py-2">
              <div className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                Sugestões
              </div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-[hsl(var(--surface-3))] group transition-colors"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'hsl(var(--brand-magenta))' }}
                  />
                  <span className="flex-1 text-[13.5px] text-[hsl(var(--ink-primary))]">{s.label}</span>
                  <span className="font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-wider">
                    {s.kind}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--ink-faint))] group-hover:text-[hsl(var(--brand-magenta))] transition-colors" />
                </button>
              ))}
            </div>

            <div className="border-t border-[hsl(var(--hairline))] px-5 py-2.5 flex items-center justify-between font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-widest">
              <span>roteador de intenção · em ativação</span>
              <span>⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
