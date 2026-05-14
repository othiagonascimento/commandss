import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStore } from '@/lib/command/store';
import { commandDb } from '@/lib/command/db';
import { startAgentRun } from '@/lib/command/runs';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Suggestion {
  label: string;
  agent: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: '3 posts sobre IA pra restaurantes, tom provocador',
    agent: 'scribe',
    prompt:
      'Crie 3 posts curtos (Instagram) sobre como IA está mudando restaurantes. Tom provocador, sem clichê, voltado para donos de operação. Para cada post: hook + corpo (até 80 palavras) + CTA.',
  },
  {
    label: 'Como tá o Uôpa esse mês?',
    agent: 'analyst',
    prompt:
      'Resuma o estado do Uôpa neste mês em 5 bullets executivos: o que evoluiu, o que travou, onde concentrar foco. Seja direto, sem floreios.',
  },
  {
    label: 'Briefing de campanha de Black Friday — 7 dias',
    agent: 'strategos',
    prompt:
      'Monte um briefing executivo de campanha Black Friday de 7 dias para o Uôpa: posicionamento, oferta, peças por canal (IG, email, WhatsApp), métricas-alvo e cronograma diário.',
  },
  {
    label: 'Replay tático da última campanha',
    agent: 'analyst',
    prompt:
      'Faça um replay tático da última campanha que rodamos: o que funcionou, o que não funcionou, hipóteses para a próxima. Estruture em 4 seções curtas.',
  },
];

export function CommandBar() {
  const open = useCommandStore((s) => s.commandBarOpen);
  const close = useCommandStore((s) => s.closeCommandBar);
  const toggle = useCommandStore((s) => s.toggleCommandBar);
  const wsId = useCommandStore((s) => s.activeWorkspaceId);
  const openRun = useCommandStore((s) => s.openRun);

  const [text, setText] = useState('');
  const [agentSlug, setAgentSlug] = useState<string>('strategos');
  const [busy, setBusy] = useState(false);

  const { data: agents } = useQuery({
    queryKey: ['command', 'agents-bar'],
    queryFn: async () => {
      const { data } = await commandDb
        .from('agents')
        .select('slug,name,avatar_emoji,color_hex')
        .eq('is_active', true)
        .order('sort_order');
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

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

  const consumePrefill = useCommandStore((s) => s.consumeBarPrefill);

  useEffect(() => {
    if (!open) {
      setText('');
      setBusy(false);
      return;
    }
    const p = consumePrefill();
    if (p) {
      if (p.agentSlug) setAgentSlug(p.agentSlug);
      if (typeof p.text === 'string') setText(p.text);
    }
  }, [open, consumePrefill]);

  const fire = async (slug: string, prompt: string) => {
    if (!wsId) {
      toast.error('Workspace não selecionado.');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Diga o que precisa.');
      return;
    }
    setBusy(true);
    try {
      const runId = await startAgentRun({
        agent_slug: slug,
        workspace_id: wsId,
        input: prompt.trim(),
      });
      openRun(runId);
    } catch (e) {
      toast.error(`Falha ao disparar: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[14vh]"
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
              {busy ? (
                <Loader2 className="w-4 h-4 text-[hsl(var(--brand-magenta))] animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
              )}
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !busy) {
                    e.preventDefault();
                    fire(agentSlug, text);
                  }
                }}
                placeholder="Diga o que precisa. Enter dispara o agente."
                className="flex-1 bg-transparent border-0 outline-none text-[15px] text-[hsl(var(--ink-primary))] placeholder:text-[hsl(var(--ink-muted))] font-display"
              />
              <kbd className="font-mono text-[10px] text-[hsl(var(--ink-faint))] border border-[hsl(var(--hairline))] rounded px-1.5 py-0.5">
                esc
              </kbd>
            </div>

            {/* Agent picker */}
            {agents && agents.length > 0 && (
              <div className="flex items-center gap-1.5 px-5 py-2 border-b border-[hsl(var(--hairline))] overflow-x-auto scrollbar-none">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mr-1">
                  agente
                </span>
                {agents.map((a) => {
                  const active = a.slug === agentSlug;
                  return (
                    <button
                      key={a.slug}
                      onClick={() => setAgentSlug(a.slug)}
                      className={`flex items-center gap-1.5 px-2 h-7 rounded-md text-[11.5px] whitespace-nowrap transition-colors border ${
                        active
                          ? 'bg-[hsl(var(--surface-3))] text-[hsl(var(--ink-primary))] border-[hsl(var(--hairline-strong))]'
                          : 'border-transparent text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))]'
                      }`}
                      style={active ? { borderColor: a.color_hex + '60' } : undefined}
                    >
                      <span style={{ color: a.color_hex }}>{a.avatar_emoji ?? '•'}</span>
                      {a.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="py-2 max-h-[44vh] overflow-y-auto">
              <div className="px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                Sugestões
              </div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  disabled={busy}
                  onClick={() => fire(s.agent, s.prompt)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-[hsl(var(--surface-3))] group transition-colors disabled:opacity-50"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'hsl(var(--brand-magenta))' }}
                  />
                  <span className="flex-1 text-[13.5px] text-[hsl(var(--ink-primary))]">{s.label}</span>
                  <span className="font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-wider">
                    {s.agent}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--ink-faint))] group-hover:text-[hsl(var(--brand-magenta))] transition-colors" />
                </button>
              ))}
            </div>

            <div className="border-t border-[hsl(var(--hairline))] px-5 py-2.5 flex items-center justify-between font-mono text-[10px] text-[hsl(var(--ink-faint))] uppercase tracking-widest">
              <span>{busy ? 'disparando…' : 'enter para executar'}</span>
              <span>⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
