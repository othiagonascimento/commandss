/**
 * Command AI — Brand Intel
 * Voz da marca + ativos + concorrentes monitorados.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Palette, Plus, Loader2, Trash2, Save, Target } from "lucide-react";
import { toast } from "sonner";
import {
  listAssets, createAsset, deleteAsset,
  getVoice, upsertVoice,
  listCompetitors, createCompetitor, deleteCompetitor,
  type BrandAsset, type BrandCompetitor,
} from "@/lib/command/intel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BrandIntelPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/40 px-8 py-6">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl tracking-tight">Brand Intel</h1>
        </div>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Voz · ativos · concorrentes — base de verdade para todos os agentes
        </p>
      </header>

      <Tabs defaultValue="voice" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-8 mt-4 w-fit">
          <TabsTrigger value="voice">Voz</TabsTrigger>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
          <TabsTrigger value="competitors">Concorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="flex-1 overflow-auto p-8">
          <VoicePanel />
        </TabsContent>
        <TabsContent value="assets" className="flex-1 overflow-auto p-8">
          <AssetsPanel />
        </TabsContent>
        <TabsContent value="competitors" className="flex-1 overflow-auto p-8">
          <CompetitorsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VoicePanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["cmd-brand-voice"], queryFn: () => getVoice() });
  const [tone, setTone] = useState("");
  const [persona, setPersona] = useState("");
  const [doList, setDoList] = useState("");
  const [dontList, setDontList] = useState("");

  useEffect(() => {
    if (data) {
      setTone(data.tone ?? "");
      setPersona(data.persona ?? "");
      setDoList((data.do_list ?? []).join("\n"));
      setDontList((data.dont_list ?? []).join("\n"));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => upsertVoice({
      scope: "global",
      tone, persona,
      do_list: doList.split("\n").map((s) => s.trim()).filter(Boolean),
      dont_list: dontList.split("\n").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      toast.success("Voz salva");
      qc.invalidateQueries({ queryKey: ["cmd-brand-voice"] });
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tom</label>
        <Input placeholder="Ex.: confiante, calorosa, premium sem ser distante" value={tone} onChange={(e) => setTone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Persona</label>
        <Textarea rows={3} placeholder="Quem fala? Como fala? Para quem?" value={persona} onChange={(e) => setPersona(e.target.value)} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Do · uma por linha</label>
          <Textarea rows={8} value={doList} onChange={(e) => setDoList(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-rose-400">Don't · uma por linha</label>
          <Textarea rows={8} value={dontList} onChange={(e) => setDontList(e.target.value)} />
        </div>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
        Salvar voz
      </Button>
    </div>
  );
}

function AssetsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: assets = [], isLoading } = useQuery({ queryKey: ["cmd-brand-assets"], queryFn: listAssets });

  const create = useMutation({
    mutationFn: (input: Partial<BrandAsset>) => createAsset(input),
    onSuccess: () => {
      toast.success("Ativo adicionado");
      qc.invalidateQueries({ queryKey: ["cmd-brand-assets"] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cmd-brand-assets"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{assets.length} ativo(s)</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Novo ativo</Button>
          </DialogTrigger>
          <AssetDialog onSubmit={(i) => create.mutate(i)} busy={create.isPending} />
        </Dialog>
      </div>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-lg border border-border/40 bg-foreground/[0.02] p-4">
              <div className="mb-2 flex items-start justify-between">
                <Badge variant="outline" className="text-[10px] uppercase">{a.asset_type}</Badge>
                <button onClick={() => remove.mutate(a.id)} className="text-muted-foreground/60 hover:text-rose-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <h4 className="text-sm font-medium">{a.name}</h4>
              {a.asset_type === "color" && a.value && (
                <div className="mt-2 h-12 rounded border border-border/40" style={{ background: a.value }} />
              )}
              {a.asset_type !== "color" && a.value && (
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{a.value}</p>
              )}
              {a.description && <p className="mt-2 text-xs text-muted-foreground">{a.description}</p>}
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border/40 p-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
              nenhum ativo cadastrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssetDialog({ onSubmit, busy }: { onSubmit: (i: Partial<BrandAsset>) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("color");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo ativo de marca</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Cor</SelectItem>
            <SelectItem value="logo">Logo (URL)</SelectItem>
            <SelectItem value="font">Fonte</SelectItem>
            <SelectItem value="photo">Foto (URL)</SelectItem>
            <SelectItem value="voice">Snippet de voz</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder={type === "color" ? "#hex ou hsl(...)" : "Valor / URL"} value={value} onChange={(e) => setValue(e.target.value)} />
        <Textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <DialogFooter>
        <Button disabled={!name || busy} onClick={() => onSubmit({ name, asset_type: type, value, description })}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CompetitorsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["cmd-competitors"], queryFn: listCompetitors });

  const create = useMutation({
    mutationFn: (i: Partial<BrandCompetitor>) => createCompetitor(i),
    onSuccess: () => {
      toast.success("Concorrente adicionado");
      qc.invalidateQueries({ queryKey: ["cmd-competitors"] });
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCompetitor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cmd-competitors"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{items.length} monitorado(s)</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Novo</Button>
          </DialogTrigger>
          <CompetitorDialog onSubmit={(i) => create.mutate(i)} busy={create.isPending} />
        </Dialog>
      </div>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-foreground/[0.02] p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-sm font-medium">{c.name}</h4>
                  <Badge variant="outline" className="font-mono text-[10px]">força {c.strength}/5</Badge>
                </div>
                {c.site && <p className="mt-1 font-mono text-xs text-muted-foreground">{c.site}</p>}
                {c.notes && <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>}
              </div>
              <button onClick={() => remove.mutate(c.id)} className="text-muted-foreground/60 hover:text-rose-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/40 p-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
              nenhum concorrente monitorado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompetitorDialog({ onSubmit, busy }: { onSubmit: (i: Partial<BrandCompetitor>) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [strength, setStrength] = useState(3);
  const [notes, setNotes] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo concorrente</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Site" value={site} onChange={(e) => setSite(e.target.value)} />
        <Select value={String(strength)} onValueChange={(v) => setStrength(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>Força {n}/5</SelectItem>)}
          </SelectContent>
        </Select>
        <Textarea placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <DialogFooter>
        <Button disabled={!name || busy} onClick={() => onSubmit({ name, site, strength, notes })}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
