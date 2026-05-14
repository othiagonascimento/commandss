import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { commandDb } from '@/lib/command/db';
import { useCommandStore } from '@/lib/command/store';
import { startAgentRun } from '@/lib/command/runs';
import { ArrowLeft, Play, CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface Mission {
  id: string;
  objective: string;
  context: string | null;
  status: string;
  plan: { summary?: string; node_count?: number } | null;
  workspace_id: string;
  due_at: string | null;
  created_at: string;
}

interface Node {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  status: string;
  sort_order: number;
  agent_id: string | null;
  payload: { depends_on?: string[] } | null;
  run_id: string | null;
  position: { x?: number; y?: number } | null;
}

interface AgentLite {
  id: string;
  slug: string;
  name: string;
  color_hex: string;
  avatar_emoji: string | null;
}

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const openRun = useCommandStore((s) => s.openRun);

  const { data: mission } = useQuery({
    queryKey: ['command', 'mission', id],
    queryFn: async () => {
      const { data } = await commandDb
        .from('missions')
        .select('id,objective,context,status,plan,workspace_id,due_at,created_at')
        .eq('id', id!)
        .maybeSingle();
      return data as Mission | null;
    },
    enabled: !!id,
  });

  const { data: nodes, refetch: refetchNodes } = useQuery({
    queryKey: ['command', 'mission-nodes', id],
    queryFn: async () => {
      const { data } = await commandDb
        .from('mission_nodes')
        .select('id,title,description,kind,status,sort_order,agent_id,payload,run_id,position')
        .eq('mission_id', id!)
        .order('sort_order');
      return (data ?? []) as Node[];
    },
    enabled: !!id,
    refetchInterval: 8000,
  });

  const { data: agents } = useQuery({
    queryKey: ['command', 'agents-lite'],
    queryFn: async () => {
      const { data } = await commandDb.from('agents').select('id,slug,name,color_hex,avatar_emoji');
      return (data ?? []) as AgentLite[];
    },
    staleTime: 5 * 60_000,
  });

  // Realtime updates on nodes
  useEffect(() => {
    if (!id) return;
    const ch = commandDb
      .channel(`mission-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'command_ai', table: 'mission_nodes', filter: `mission_id=eq.${id}` },
        () => refetchNodes(),
      )
      .subscribe();
    return () => {
      commandDb.removeChannel(ch);
    };
  }, [id, refetchNodes]);

  const agentMap = new Map(agents?.map((a) => [a.id, a]) ?? []);

  return (
    <div className="px-8 lg:px-14 py-10 max-w-[1400px] mx-auto">
      <Link
        to="/command/missions"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-secondary))] mb-6"
      >
        <ArrowLeft className="w-3 h-3" /> missões
      </Link>

      {mission && (
        <>
          <div className="mb-10">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-3">
              <StatusDot status={mission.status} />
              {mission.status} · {mission.plan?.node_count ?? nodes?.length ?? 0} nodes
            </div>
            <h1 className="font-display text-[36px] leading-[1.05] tracking-tight text-[hsl(var(--ink-primary))] max-w-3xl">
              {mission.objective}
            </h1>
            {mission.plan?.summary && (
              <div className="mt-4 text-[15px] text-[hsl(var(--ink-secondary))] max-w-3xl leading-relaxed">
                {mission.plan.summary}
              </div>
            )}
            {mission.context && (
              <div className="mt-3 text-[13px] text-[hsl(var(--ink-muted))] max-w-3xl">
                <span className="font-mono text-[10px] uppercase tracking-widest mr-2">contexto:</span>
                {mission.context}
              </div>
            )}
          </div>

          <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-3">
            constelação
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nodes?.map((n, i) => (
              <NodeCard
                key={n.id}
                node={n}
                index={i}
                agent={n.agent_id ? agentMap.get(n.agent_id) : undefined}
                missionId={mission.id}
                workspaceId={mission.workspace_id}
                missionObjective={mission.objective}
                onOpenRun={openRun}
                onRefetch={refetchNodes}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const c =
    status === 'completed'
      ? 'hsl(var(--jade))'
      : status === 'failed'
        ? 'hsl(var(--brand-magenta))'
        : status === 'executing' || status === 'running'
          ? 'hsl(var(--brand-magenta))'
          : 'hsl(var(--ink-muted))';
  const live = status === 'executing' || status === 'running';
  return (
    <motion.span
      className="w-1.5 h-1.5 rounded-full"
      style={{ background: c }}
      animate={live ? { opacity: [0.3, 1, 0.3] } : undefined}
      transition={live ? { duration: 1.4, repeat: Infinity } : undefined}
    />
  );
}

function NodeCard({
  node,
  index,
  agent,
  missionId,
  workspaceId,
  missionObjective,
  onOpenRun,
  onRefetch,
}: {
  node: Node;
  index: number;
  agent?: AgentLite;
  missionId: string;
  workspaceId: string;
  missionObjective: string;
  onOpenRun: (id: string) => void;
  onRefetch: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const Icon =
    node.status === 'completed'
      ? CheckCircle2
      : node.status === 'failed'
        ? AlertTriangle
        : node.status === 'executing' || node.status === 'running'
          ? Loader2
          : Circle;

  const fire = async () => {
    if (!agent) {
      toast.error('Sem agente atribuído.');
      return;
    }
    setBusy(true);
    try {
      const briefing = `MISSÃO: ${missionObjective}\n\nSUA TAREFA (${node.kind}): ${node.title}\n${node.description ?? ''}\n\nEntregue de forma direta e executável.`;
      const runId = await startAgentRun({
        agent_slug: agent.slug,
        workspace_id: workspaceId,
        input: briefing,
      });
      // marca node como executando + linka run
      await commandDb
        .from('mission_nodes')
        .update({ status: 'running', run_id: runId })
        .eq('id', node.id);
      onRefetch();
      onOpenRun(runId);
    } catch (e) {
      toast.error(`Falha: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
          <Icon
            className={`w-3 h-3 ${node.status === 'running' || node.status === 'executing' ? 'animate-spin' : ''}`}
            style={{
              color:
                node.status === 'completed'
                  ? 'hsl(var(--jade))'
                  : node.status === 'failed'
                    ? 'hsl(var(--brand-magenta))'
                    : agent?.color_hex ?? 'hsl(var(--ink-muted))',
            }}
          />
          node {String(index + 1).padStart(2, '0')} · {node.kind}
        </div>
        {agent && (
          <div className="flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ink-muted))]">
            <span style={{ color: agent.color_hex }}>{agent.avatar_emoji ?? '•'}</span>
            {agent.name}
          </div>
        )}
      </div>
      <div className="font-display text-[16px] leading-snug text-[hsl(var(--ink-primary))] mb-1.5">
        {node.title}
      </div>
      {node.description && (
        <div className="text-[12.5px] text-[hsl(var(--ink-secondary))] leading-relaxed mb-3">
          {node.description}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[hsl(var(--hairline))]">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
          {node.status}
        </div>
        {node.run_id ? (
          <button
            onClick={() => onOpenRun(node.run_id!)}
            className="text-[11.5px] text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--brand-magenta))] transition-colors"
          >
            ver execução →
          </button>
        ) : (
          <button
            onClick={fire}
            disabled={busy || !agent}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-3))] text-[11.5px] disabled:opacity-40 transition-colors"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            executar
          </button>
        )}
      </div>
    </motion.div>
  );
}
