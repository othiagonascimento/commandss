/**
 * Command AI — Automations & Scheduled Jobs
 * Lista jobs agendados e seu status. Permite cancelar e criar jobs ad-hoc.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Zap, Clock, CheckCircle2, XCircle, Loader2, Plus, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { listJobs, scheduleJob, cancelJob, type ScheduledJob } from "@/lib/command/decisions";
import { commandDb } from "@/lib/command/db";
import { useCommandStore } from "@/lib/command/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const MASTER_WS = "00000000-0000-0000-0000-000000000001";

export default function Automations_Page() {
  const wsId = useCommandStore((s) => s.activeWorkspaceId) ?? MASTER_WS;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "done" | "failed">("all");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["command-jobs", wsId, filter],
    queryFn: () => listJobs(wsId, filter),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const ch = commandDb
      .channel(`jobs-${wsId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "command_ai", table: "scheduled_jobs", filter: `workspace_id=eq.${wsId}` },
        () => qc.invalidateQueries({ queryKey: ["command-jobs"] }),
      )
      .subscribe();
    return () => { commandDb.removeChannel(ch); };
  }, [wsId, qc]);

  const cancel = useMutation({
    mutationFn: (id: string) => cancelJob(id),
    onSuccess: () => {
      toast.success("Job cancelado");
      qc.invalidateQueries({ queryKey: ["command-jobs"] });
    },
  });

  const counts = {
    pending: jobs.filter((j) => j.status === "pending").length,
    running: jobs.filter((j) => j.status === "running").length,
    done: jobs.filter((j) => j.status === "done").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-8 py-6">
        <div>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl tracking-tight">Automações</h1>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Scheduler tickando a cada minuto · {counts.pending} pendente{counts.pending === 1 ? "" : "s"} · {counts.running} executando
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterChip label="Todos" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterChip label={`Pendentes (${counts.pending})`} active={filter === "pending"} onClick={() => setFilter("pending")} />
          <FilterChip label={`OK (${counts.done})`} active={filter === "done"} onClick={() => setFilter("done")} />
          <FilterChip label={`Falhas (${counts.failed})`} active={filter === "failed"} onClick={() => setFilter("failed")} />
          <NewJobDialog wsId={wsId} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Nenhum job nesse filtro
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((j, i) => (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="group flex items-center gap-4 rounded-lg border border-border/40 bg-foreground/[0.02] px-5 py-4 transition-all hover:border-border/80"
              >
                <StatusIcon status={j.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{j.kind}</span>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {j.status}
                    </Badge>
                    {j.attempts > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {j.attempts} tentativa{j.attempts === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  {j.last_error && (
                    <p className="mt-1 line-clamp-1 text-xs text-rose-400">{j.last_error}</p>
                  )}
                  <p className="mt-1 line-clamp-1 font-mono text-[11px] text-muted-foreground/80">
                    {JSON.stringify(j.payload).slice(0, 120)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">{j.run_at ? formatDate(j.run_at) : "—"}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {j.run_at ? relativeTime(j.run_at) : "sem horário"}
                  </div>
                </div>
                {(j.status === "pending" || j.status === "failed") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancel.mutate(j.id)}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Ban className="h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? "default" : "ghost"} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

function StatusIcon({ status }: { status: ScheduledJob["status"] }) {
  if (status === "done") return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-rose-400" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-sky-400" />;
  if (status === "cancelled") return <Ban className="h-5 w-5 text-muted-foreground/60" />;
  return <Clock className="h-5 w-5 text-amber-400" />;
}

function NewJobDialog({ wsId }: { wsId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("agent_run");
  const [agent, setAgent] = useState("scribe");
  const [input, setInput] = useState("");
  const [whenMin, setWhenMin] = useState("1");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => {
      const runAt = new Date(Date.now() + parseInt(whenMin) * 60_000).toISOString();
      const payload = kind === "agent_run"
        ? { agent_slug: agent, input }
        : kind === "noop" ? {} : { input };
      return scheduleJob(wsId, kind, payload, runAt);
    },
    onSuccess: () => {
      toast.success("Job agendado");
      qc.invalidateQueries({ queryKey: ["command-jobs"] });
      setOpen(false);
      setInput("");
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-3 w-3" /> Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Novo job agendado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-widest">Tipo</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agent_run">Disparar agente</SelectItem>
                <SelectItem value="noop">Heartbeat (teste)</SelectItem>
                <SelectItem value="content_publish">Publicar conteúdo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "agent_run" && (
            <>
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest">Agente</Label>
                <Select value={agent} onValueChange={setAgent}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["strategos", "scribe", "atelier", "curator", "publisher", "analyst", "closer", "ops"].map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest">Briefing</Label>
                <Input value={input} onChange={(e) => setInput(e.target.value)} className="mt-1" placeholder="Ex: post sobre lançamento" />
              </div>
            </>
          )}
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-widest">Disparar em (minutos)</Label>
            <Input type="number" value={whenMin} onChange={(e) => setWhenMin(e.target.value)} className="mt-1" min="1" />
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || (kind === "agent_run" && !input)}
            className="w-full"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const m = Math.round(diff / 60_000);
  if (m === 0) return "agora";
  if (m > 0) return `em ${m}m`;
  if (m > -60) return `há ${-m}m`;
  return `há ${Math.round(-m / 60)}h`;
}
