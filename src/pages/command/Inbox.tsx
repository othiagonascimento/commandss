/**
 * Command AI — Inbox de Decisões
 * Decisões pendentes do agente esperando sinal do master.
 * Atalhos: J/K (navegar), A (aprovar), R (rejeitar), S (snooze 1h), Enter (abrir).
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Inbox, Check, X, Clock, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  listDecisions,
  decideDecision,
  snoozeDecision,
  seedDecision,
  type Decision,
} from "@/lib/command/decisions";
import { commandDb } from "@/lib/command/db";
import { useCommandStore } from "@/lib/command/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MASTER_WS = "00000000-0000-0000-0000-000000000001"; // fallback se store vazio

export default function Inbox_Page() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId) ?? MASTER_WS;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [cursor, setCursor] = useState(0);

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ["command-decisions", wsId, filter],
    queryFn: () => listDecisions(wsId, filter),
    refetchInterval: 15_000,
  });

  // Realtime
  useEffect(() => {
    const ch = commandDb
      .channel(`decisions-${wsId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "command_ai", table: "decisions", filter: `workspace_id=eq.${wsId}` },
        () => qc.invalidateQueries({ queryKey: ["command-decisions"] }),
      )
      .subscribe();
    return () => { commandDb.removeChannel(ch); };
  }, [wsId, qc]);

  const active = decisions[cursor];

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      decideDecision(id, status),
    onSuccess: (_, vars) => {
      toast.success(vars.status === "approved" ? "Decisão aprovada — agendando execução" : "Decisão recusada");
      qc.invalidateQueries({ queryKey: ["command-decisions"] });
      setCursor((c) => Math.max(0, c - (decisions.length === 1 ? 0 : 0)));
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  const snooze = useMutation({
    mutationFn: (id: string) => snoozeDecision(id, 60),
    onSuccess: () => {
      toast.success("Adiado por 1h");
      qc.invalidateQueries({ queryKey: ["command-decisions"] });
    },
  });

  const seed = useMutation({
    mutationFn: () => seedDecision(
      wsId,
      "Aprovar publicação do carrossel de Black Friday",
      "Atelier gerou 3 variações e Curator selecionou a #2. Pronto pra ir ao ar amanhã às 09:00.",
      { execute_job: { kind: "noop", payload: {} } },
    ),
    onSuccess: () => {
      toast.success("Decisão de teste criada");
      qc.invalidateQueries({ queryKey: ["command-decisions"] });
    },
  });

  // Atalhos
  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/)) return;
    if (e.key === "j") setCursor((c) => Math.min(decisions.length - 1, c + 1));
    if (e.key === "k") setCursor((c) => Math.max(0, c - 1));
    if (!active) return;
    if (e.key === "a") decide.mutate({ id: active.id, status: "approved" });
    if (e.key === "r") decide.mutate({ id: active.id, status: "rejected" });
    if (e.key === "s") snooze.mutate(active.id);
  }, [decisions.length, active, decide, snooze]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  useEffect(() => { if (cursor >= decisions.length) setCursor(0); }, [decisions.length, cursor]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-8 py-6">
        <div>
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl tracking-tight">Inbox de Decisão</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {decisions.length}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            J/K navegar · A aprovar · R rejeitar · S adiar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
            <Sparkles className="mr-2 h-3 w-3" />
            Seed teste
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[380px_1fr] overflow-hidden">
        {/* Lista */}
        <aside className="overflow-y-auto border-r border-border/40">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : decisions.length === 0 ? (
            <EmptyState onSeed={() => seed.mutate()} />
          ) : (
            decisions.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setCursor(i)}
                className={`group w-full border-b border-border/20 px-5 py-4 text-left transition-all ${
                  i === cursor
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-foreground/5"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <StatusDot status={d.status} />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {timeAgo(d.created_at)}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-sm font-medium">{d.title}</h3>
                {d.summary && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.summary}</p>
                )}
              </button>
            ))
          )}
        </aside>

        {/* Detalhe */}
        <main className="overflow-y-auto px-10 py-8">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="mb-6 flex items-center gap-2">
                  <StatusDot status={active.status} />
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {active.kind}
                  </Badge>
                  {active.expires_at && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      expira {timeAgo(active.expires_at)}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-3xl leading-tight tracking-tight">{active.title}</h2>

                {active.summary && (
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{active.summary}</p>
                )}

                {active.reasoning && (
                  <section className="mt-8">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      raciocínio
                    </div>
                    <div className="rounded-lg border border-border/40 bg-foreground/[0.02] p-5 text-sm leading-relaxed">
                      {active.reasoning}
                    </div>
                  </section>
                )}

                {active.preview && Object.keys(active.preview).length > 0 && (
                  <section className="mt-8">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      preview
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-border/40 bg-foreground/[0.02] p-5 text-xs">
                      {JSON.stringify(active.preview, null, 2)}
                    </pre>
                  </section>
                )}

                {active.status === "pending" && (
                  <div className="mt-10 flex gap-3">
                    <Button
                      onClick={() => decide.mutate({ id: active.id, status: "approved" })}
                      disabled={decide.isPending}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" /> Aprovar <kbd className="ml-2 font-mono text-[10px] opacity-60">A</kbd>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => decide.mutate({ id: active.id, status: "rejected" })}
                      disabled={decide.isPending}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" /> Rejeitar <kbd className="ml-2 font-mono text-[10px] opacity-60">R</kbd>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => snooze.mutate(active.id)}
                      disabled={snooze.isPending}
                      className="gap-2"
                    >
                      <Clock className="h-4 w-4" /> Adiar 1h <kbd className="ml-2 font-mono text-[10px] opacity-60">S</kbd>
                    </Button>
                  </div>
                )}

                {active.status !== "pending" && (
                  <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                    Decisão {active.status} em {active.decided_at ? new Date(active.decided_at).toLocaleString("pt-BR") : "—"}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Sem decisões pendentes
                </p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40" />
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Inbox vazio
      </p>
      <Button variant="outline" size="sm" onClick={onSeed}>
        <Sparkles className="mr-2 h-3 w-3" /> Criar decisão de teste
      </Button>
    </div>
  );
}

function StatusDot({ status }: { status: Decision["status"] }) {
  const map: Record<Decision["status"], string> = {
    pending: "bg-amber-400 shadow-[0_0_8px_hsl(38_95%_55%/0.6)]",
    approved: "bg-emerald-400",
    rejected: "bg-rose-400",
    snoozed: "bg-sky-400",
    expired: "bg-muted-foreground/40",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status]}`} />;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
