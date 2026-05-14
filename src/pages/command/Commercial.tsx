/**
 * Command AI — Comercial
 * Funil real do uopa: onboarding_submissions + tenants, anotado por command_ai.tenant_pipeline.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Briefcase, Loader2, Mail, Building2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  loadPipeline, entryStage, setStage, updateAnnotation,
  STAGES, type PipelineEntry, type PipelineStage,
} from "@/lib/command/commercial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CommercialPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<PipelineEntry | null>(null);
  const [filter, setFilter] = useState<"all" | "tenant" | "onboarding">("all");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["cmd-commercial"],
    queryFn: loadPipeline,
    refetchInterval: 30_000,
  });

  const move = useMutation({
    mutationFn: ({ e, stage }: { e: PipelineEntry; stage: PipelineStage }) => setStage(e, stage),
    onSuccess: () => {
      toast.success("Estágio atualizado");
      qc.invalidateQueries({ queryKey: ["cmd-commercial"] });
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.source === filter);
  }, [entries, filter]);

  const grouped = useMemo(() => {
    const m = new Map<PipelineStage, PipelineEntry[]>();
    STAGES.forEach((s) => m.set(s.id, []));
    for (const e of filtered) m.get(entryStage(e))?.push(e);
    return m;
  }, [filtered]);

  const totalMrr = useMemo(
    () => filtered.reduce((sum, e) => sum + (e.annotation?.expected_mrr_cents ?? 0), 0),
    [filtered],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-8 py-6">
        <div>
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl tracking-tight">Comercial</h1>
            <Badge variant="outline" className="font-mono text-xs">{filtered.length}</Badge>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Funil real do uopa · onboarding + tenants · MRR previsto R$ {(totalMrr / 100).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "onboarding", "tenant"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} onClick={() => setFilter(f)}>
              {f === "all" ? "Tudo" : f === "onboarding" ? "Cadastros" : "Tenants"}
            </Button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {STAGES.map((col) => {
              const items = grouped.get(col.id) ?? [];
              const stageMrr = items.reduce((s, e) => s + (e.annotation?.expected_mrr_cents ?? 0), 0);
              return (
                <div key={col.id} className="space-y-3">
                  <div className={`flex items-center justify-between border-l-2 pl-3 ${col.tone}`}>
                    <h3 className="font-mono text-xs uppercase tracking-widest">{col.title}</h3>
                    <span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>
                  </div>
                  {stageMrr > 0 && (
                    <div className="pl-3 font-mono text-[10px] text-muted-foreground">
                      R$ {(stageMrr / 100).toLocaleString("pt-BR")}
                    </div>
                  )}
                  <div className="space-y-2">
                    {items.map((e) => (
                      <button
                        key={e.key}
                        onClick={() => setSelected(e)}
                        className="block w-full rounded-lg border border-border/40 bg-foreground/[0.02] p-3 text-left transition-colors hover:bg-foreground/[0.05]"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h4 className="line-clamp-1 text-sm font-medium">{e.display_name}</h4>
                          {e.blocked && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {e.source === "tenant" ? <Building2 className="h-2.5 w-2.5" /> : <Mail className="h-2.5 w-2.5" />}
                          {e.source === "tenant" ? "tenant" : "cadastro"}
                          {e.plan_type && <span>· {e.plan_type}</span>}
                        </div>
                        {e.annotation?.next_step && (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">→ {e.annotation.next_step}</p>
                        )}
                        {e.annotation?.expected_mrr_cents ? (
                          <div className="mt-2 font-mono text-[10px] text-emerald-400">
                            R$ {(e.annotation.expected_mrr_cents / 100).toLocaleString("pt-BR")}/mês
                          </div>
                        ) : null}
                      </button>
                    ))}
                    {items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/40 p-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        vazio
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DetailSheet
        entry={selected}
        onClose={() => setSelected(null)}
        onMove={(stage) => selected && move.mutate({ e: selected, stage })}
        busy={move.isPending}
      />
    </div>
  );
}

function DetailSheet({
  entry, onClose, onMove, busy,
}: {
  entry: PipelineEntry | null;
  onClose: () => void;
  onMove: (stage: PipelineStage) => void;
  busy: boolean;
}) {
  const qc = useQueryClient();
  const [nextStep, setNextStep] = useState("");
  const [expectedMrr, setExpectedMrr] = useState("");
  const [notes, setNotes] = useState("");
  const [lostReason, setLostReason] = useState("");

  // resync when selection changes
  useMemo(() => {
    setNextStep(entry?.annotation?.next_step ?? "");
    setExpectedMrr(entry?.annotation?.expected_mrr_cents ? String(entry.annotation.expected_mrr_cents / 100) : "");
    setNotes(entry?.annotation?.notes ?? "");
    setLostReason(entry?.annotation?.lost_reason ?? "");
  }, [entry?.key]);

  const save = useMutation({
    mutationFn: () => entry ? updateAnnotation(entry, {
      next_step: nextStep || null,
      expected_mrr_cents: Math.round((parseFloat(expectedMrr) || 0) * 100),
      notes: notes || null,
      lost_reason: lostReason || null,
    }) : Promise.resolve(),
    onSuccess: () => {
      toast.success("Anotação salva");
      qc.invalidateQueries({ queryKey: ["cmd-commercial"] });
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  if (!entry) return null;
  const stage = entryStage(entry);

  return (
    <Sheet open={!!entry} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {entry.source === "tenant" ? <Building2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            {entry.display_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase">{entry.source}</Badge>
            {entry.origin_status && (
              <Badge variant="outline" className="font-mono text-[10px] uppercase">origem: {entry.origin_status}</Badge>
            )}
            {entry.plan_type && (
              <Badge variant="outline" className="font-mono text-[10px] uppercase">{entry.plan_type}</Badge>
            )}
            {entry.contact_email && (
              <span className="font-mono text-xs text-muted-foreground">{entry.contact_email}</span>
            )}
          </div>

          {entry.tenant_id && (
            <Link
              to={`/tenants/${entry.tenant_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Abrir tenant <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {entry.onboarding_id && (
            <Link
              to="/admin/cadastros"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver cadastro <ExternalLink className="h-3 w-3" />
            </Link>
          )}

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estágio</label>
            <Select value={stage} onValueChange={(v) => onMove(v as PipelineStage)} disabled={busy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Próximo passo</label>
            <Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Follow-up por WhatsApp..." />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">MRR esperado (R$)</label>
            <Input type="number" value={expectedMrr} onChange={(e) => setExpectedMrr(e.target.value)} />
          </div>

          {(stage === "lost" || stage === "churned") && (
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-rose-400">Motivo</label>
              <Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Notas</label>
            <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
