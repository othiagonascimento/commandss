/**
 * Command AI — Calendário Editorial
 * Visão mensal simples com criação rápida de eventos.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listEvents, createEvent, deleteEvent, type CalendarEvent } from "@/lib/command/intel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_TONE: Record<string, string> = {
  planned: "bg-sky-400/15 text-sky-200 border-sky-400/30",
  scheduled: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  published: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
  archived: "bg-muted/30 text-muted-foreground border-border/40",
};

export default function CalendarPage() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);

  const range = useMemo(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1).toISOString();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59).toISOString();
    return { from, to };
  }, [cursor]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["cmd-calendar", range.from, range.to],
    queryFn: () => listEvents(range.from, range.to),
  });

  const create = useMutation({
    mutationFn: (input: Partial<CalendarEvent>) => createEvent(input),
    onSuccess: () => {
      toast.success("Evento criado");
      qc.invalidateQueries({ queryKey: ["cmd-calendar"] });
      setOpen(false);
    },
    onError: (e) => toast.error(`Falha: ${(e as Error).message}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      toast.success("Evento removido");
      qc.invalidateQueries({ queryKey: ["cmd-calendar"] });
    },
  });

  const monthGrid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = e.starts_at.slice(0, 10);
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-8 py-6">
        <div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl tracking-tight">Calendário Editorial</h1>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · {events.length} evento(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            ←
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const n = new Date();
            setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
          }}>
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            →
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setDraftDate(new Date().toISOString().slice(0, 10))}>
                <Plus className="mr-2 h-3 w-3" /> Novo evento
              </Button>
            </DialogTrigger>
            <EventDialog
              defaultDate={draftDate}
              onSubmit={(input) => create.mutate(input)}
              busy={create.isPending}
            />
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/40 bg-border/40">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="bg-background px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {d}
              </div>
            ))}
            {monthGrid.map((day, i) => {
              const k = day.toISOString().slice(0, 10);
              const dayEvents = eventsByDay.get(k) ?? [];
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = k === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setDraftDate(k);
                    setOpen(true);
                  }}
                  className={`min-h-[110px] bg-background p-2 text-left transition-colors hover:bg-foreground/5 ${
                    !inMonth ? "opacity-40" : ""
                  }`}
                >
                  <div className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs ${
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`group flex items-center justify-between gap-1 rounded border px-1.5 py-0.5 text-[10px] ${
                          STATUS_TONE[e.status] ?? STATUS_TONE.planned
                        }`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (confirm(`Remover "${e.title}"?`)) remove.mutate(e.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EventDialog({
  defaultDate,
  onSubmit,
  busy,
}: {
  defaultDate: string | null;
  onSubmit: (input: Partial<CalendarEvent>) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [status, setStatus] = useState("planned");

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Novo evento</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planejado</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button
          disabled={!title || busy}
          onClick={() => {
            const starts_at = new Date(`${date}T${time}:00`).toISOString();
            onSubmit({ title, description, channel, starts_at, status });
          }}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Criar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function buildMonthGrid(monthStart: Date): Date[] {
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const startWeekday = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - startWeekday);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
