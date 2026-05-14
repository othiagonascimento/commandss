/**
 * Command AI — Campanhas
 * Pipeline kanban (draft / active / paused / done).
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Megaphone, Plus, Loader2, Trash2, Play, Pause, Check } from "lucide-react";
import { toast } from "sonner";
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  type Campaign,
} from "@/lib/command/intel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS: { id: Campaign["status"]; title: string; tone: string }[] = [
  { id: "draft", title: "Rascunho", tone: "border-l-muted-foreground/40" },
  { id: "active", title: "Ativas", tone: "border-l-emerald-400" },
  { id: "paused", title: "Pausadas", tone: "border-l-amber-400" },
  { id: "done", title: "Concluídas", tone: "border-l-sky-400" },
];

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["cmd-campaigns"],
    queryFn: () => listCampaigns("all"),
  });

  const create = useMutation({
    mutationFn: (input: Partial<Campaign>) => createCampaign(input),
    onSuccess: () => {
      toast.success("Campanha criada");
      qc.invalidateQueries({ queryKey: ["cmd-campaigns"] });
      setOpen(false);
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Campaign> }) => updateCampaign(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cmd-campaigns"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      toast.success("Removida");
      qc.invalidateQueries({ queryKey: ["cmd-campaigns"] });
    },
  });

  const grouped = useMemo(() => {
    const m = new Map<Campaign["status"], Campaign[]>();
    COLUMNS.forEach((c) => m.set(c.id, []));
    for (const c of campaigns) m.get(c.status)?.push(c);
    return m;
  }, [campaigns]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-8 py-6">
        <div>
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl tracking-tight">Campanhas</h1>
            <Badge variant="outline" className="font-mono text-xs">{campaigns.length}</Badge>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Lançamento, monitoramento e replay narrativo
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Nova campanha</Button>
          </DialogTrigger>
          <CampaignDialog onSubmit={(input) => create.mutate(input)} busy={create.isPending} />
        </Dialog>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="space-y-3">
                <div className={`flex items-center justify-between border-l-2 pl-3 ${col.tone}`}>
                  <h3 className="font-mono text-xs uppercase tracking-widest">{col.title}</h3>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {grouped.get(col.id)?.length ?? 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(grouped.get(col.id) ?? []).map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/40 bg-foreground/[0.02] p-4 transition-colors hover:bg-foreground/[0.04]">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">{c.name}</h4>
                        <button
                          onClick={() => { if (confirm(`Remover "${c.name}"?`)) remove.mutate(c.id); }}
                          className="text-muted-foreground/60 hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {c.objective && (
                        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{c.objective}</p>
                      )}
                      <div className="mb-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {c.channel && <Badge variant="outline" className="text-[10px]">{c.channel}</Badge>}
                        {c.budget_cents > 0 && (
                          <span>R$ {(c.budget_cents / 100).toLocaleString("pt-BR")}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {c.status !== "active" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => update.mutate({ id: c.id, patch: { status: "active" } })}>
                            <Play className="mr-1 h-3 w-3" /> Ativar
                          </Button>
                        )}
                        {c.status === "active" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => update.mutate({ id: c.id, patch: { status: "paused" } })}>
                            <Pause className="mr-1 h-3 w-3" /> Pausar
                          </Button>
                        )}
                        {c.status !== "done" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => update.mutate({ id: c.id, patch: { status: "done" } })}>
                            <Check className="mr-1 h-3 w-3" /> Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(grouped.get(col.id) ?? []).length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/40 p-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      vazio
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignDialog({
  onSubmit,
  busy,
}: {
  onSubmit: (input: Partial<Campaign>) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<Campaign["status"]>("draft");

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Nova campanha</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea placeholder="Objetivo / hipótese" value={objective} onChange={(e) => setObjective(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="meta-ads">Meta Ads</SelectItem>
              <SelectItem value="google-ads">Google Ads</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Orçamento R$" value={budget} onChange={(e) => setBudget(e.target.value)} />
          <Select value={status} onValueChange={(v) => setStatus(v as Campaign["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
              <SelectItem value="done">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!name || busy}
          onClick={() => onSubmit({
            name,
            objective,
            channel,
            status,
            budget_cents: Math.round((parseFloat(budget) || 0) * 100),
          })}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Criar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
