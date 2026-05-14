import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { commandDb } from '@/lib/command/db';
import { useCommandStore } from '@/lib/command/store';
import { planMission } from '@/lib/command/missions';
import { Plus, Loader2, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Mission {
  id: string;
  objective: string;
  status: string;
  plan: { summary?: string; node_count?: number } | null;
  created_at: string;
  due_at: string | null;
}

const STATUS_TONE: Record<string, string> = {
  planning: 'hsl(var(--ink-muted))',
  approved: 'hsl(var(--brand-magenta))',
  executing: 'hsl(var(--jade))',
  completed: 'hsl(var(--ink-muted))',
  failed: 'hsl(var(--brand-magenta))',
};

export default function MissionsPage() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: missions, refetch } = useQuery({
    queryKey: ['command', 'missions', wsId],
    queryFn: async () => {
      const { data } = await commandDb
        .from('missions')
        .select('id,objective,status,plan,created_at,due_at')
        .eq('workspace_id', wsId!)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data ?? []) as Mission[];
    },
    enabled: !!wsId,
  });

  return (
    <div className="px-8 lg:px-14 py-12 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-2">
            command · missões
          </div>
          <h1 className="font-display text-[44px] leading-[0.95] tracking-tight text-[hsl(var(--ink-primary))]">
            Constelações em curso.
          </h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-md border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))] transition-colors text-[13px]"
        >
          <Plus className="w-3.5 h-3.5 text-[hsl(var(--brand-magenta))]" />
          Nova missão
        </button>
      </div>

      {!missions || missions.length === 0 ? (
        <EmptyState onNew={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {missions.map((m) => (
            <motion.button
              key={m.id}
              onClick={() => navigate(`/command/missions/${m.id}`)}
              whileHover={{ y: -2 }}
              className="text-left rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-5 hover:border-[hsl(var(--hairline-strong))] transition-colors"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: STATUS_TONE[m.status] ?? 'hsl(var(--ink-muted))' }}
                />
                {m.status} · {m.plan?.node_count ?? 0} nodes
              </div>
              <div className="font-display text-[18px] leading-snug text-[hsl(var(--ink-primary))] mb-2">
                {m.objective}
              </div>
              {m.plan?.summary && (
                <div className="text-[12.5px] text-[hsl(var(--ink-secondary))] line-clamp-2">
                  {m.plan.summary}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <NewMissionDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(id) => {
          refetch();
          navigate(`/command/missions/${id}`);
        }}
        wsId={wsId}
      />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[hsl(var(--hairline-strong))] py-20 px-6 text-center">
      <div className="font-display text-[24px] text-[hsl(var(--ink-secondary))] mb-3">
        Nenhuma missão ainda.
      </div>
      <div className="text-[13.5px] text-[hsl(var(--ink-muted))] mb-6 max-w-md mx-auto">
        Diga um objetivo. Strategos decompõe em uma constelação de tarefas e atribui aos agentes certos.
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[hsl(var(--brand-magenta))] text-[hsl(var(--brand-magenta))] text-[13px] hover:bg-[hsl(var(--brand-magenta)/0.08)] transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Brifear Strategos
      </button>
    </div>
  );
}

function NewMissionDialog({
  open,
  onClose,
  onCreated,
  wsId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  wsId: string | null;
}) {
  const [objective, setObjective] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!wsId || !objective.trim()) return;
    setBusy(true);
    try {
      const r = await planMission({
        workspace_id: wsId,
        objective: objective.trim(),
        context: context.trim() || undefined,
      });
      toast.success(`Plano gerado: ${r.nodes} nodes`);
      setObjective('');
      setContext('');
      onClose();
      onCreated(r.mission_id);
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[hsl(var(--canvas)/0.78)] backdrop-blur-2xl" />
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-[min(620px,94vw)] rounded-2xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-2)/0.94)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-14 border-b border-[hsl(var(--hairline))]">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                nova missão · strategos planeja
              </div>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-[hsl(var(--surface-3))]">
                <X className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] block mb-2">
                  objetivo
                </label>
                <textarea
                  autoFocus
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={2}
                  placeholder="Ex.: Lançar campanha de Black Friday em 7 dias com foco em conversão para Pro."
                  className="w-full bg-[hsl(var(--surface-1))] border border-[hsl(var(--hairline))] rounded-md px-3 py-2.5 text-[14px] text-[hsl(var(--ink-primary))] placeholder:text-[hsl(var(--ink-muted))] focus:outline-none focus:border-[hsl(var(--hairline-strong))]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] block mb-2">
                  contexto (opcional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  placeholder="Restrições, métricas-alvo, tom, prazos…"
                  className="w-full bg-[hsl(var(--surface-1))] border border-[hsl(var(--hairline))] rounded-md px-3 py-2.5 text-[13px] text-[hsl(var(--ink-secondary))] placeholder:text-[hsl(var(--ink-muted))] focus:outline-none focus:border-[hsl(var(--hairline-strong))]"
                />
              </div>
            </div>

            <div className="border-t border-[hsl(var(--hairline))] px-6 py-3 flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                {busy ? 'planejando…' : 'gemini 2.5 pro'}
              </div>
              <button
                onClick={submit}
                disabled={busy || !objective.trim()}
                className="flex items-center gap-2 h-9 px-4 rounded-md bg-[hsl(var(--brand-magenta))] text-white text-[12.5px] hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Planejar missão
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
