import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCommandMeta, type Tool } from '@/lib/command/meta';
import { Loader2, Search } from 'lucide-react';

const RISK_COLOR: Record<string, string> = {
  read: 'text-[hsl(var(--jade))] bg-[hsl(var(--jade)/0.1)]',
  write_low: 'text-[hsl(var(--cobalt))] bg-[hsl(var(--cobalt)/0.1)]',
  write_high: 'text-[hsl(var(--ember))] bg-[hsl(var(--ember)/0.1)]',
  destructive: 'text-[hsl(var(--coral))] bg-[hsl(var(--coral)/0.1)]',
};

function ToolRow({ t }: { t: Tool }) {
  const risk = RISK_COLOR[t.risk_level] ?? 'text-[hsl(var(--ink-muted))] bg-[hsl(var(--surface-3))]';
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 px-3 border-b border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-1))] transition-colors">
      <div>
        <div className="font-mono text-[12px] text-[hsl(var(--ink-primary))]">{t.tool_name}</div>
        {t.description && (
          <div className="text-[11.5px] text-[hsl(var(--ink-secondary))] mt-0.5">{t.description}</div>
        )}
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${risk}`}>
        {t.risk_level}
      </span>
      <span className="text-[10.5px] font-mono text-[hsl(var(--ink-muted))]">{t.domain}</span>
    </div>
  );
}

export default function CommandToolCatalog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['command-meta'],
    queryFn: fetchCommandMeta,
    staleTime: 60_000,
  });

  const [q, setQ] = useState('');
  const [domain, setDomain] = useState<string>('all');

  const tools = data?.tools ?? [];
  const domains = useMemo(
    () => Array.from(new Set(tools.map((t) => t.domain))).sort(),
    [tools],
  );

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (domain !== 'all' && t.domain !== domain) return false;
      if (q && !t.tool_name.toLowerCase().includes(q.toLowerCase()) &&
          !(t.description ?? '').toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tools, q, domain]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--brand-magenta))]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-[hsl(var(--coral))] text-[13px]">
        Erro ao carregar ferramentas: {String((error as Error).message)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header>
        <h2 className="text-[20px] font-display tracking-tight text-[hsl(var(--ink-primary))]">
          Catálogo de ferramentas
        </h2>
        <p className="text-[13px] text-[hsl(var(--ink-secondary))] mt-1">
          {tools.length} ferramentas disponíveis para as divisões. Cada uma tem nível de risco
          e escopos requeridos.
        </p>
      </header>

      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 h-9 px-3 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))]">
          <Search className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou descrição…"
            className="flex-1 bg-transparent text-[12.5px] outline-none text-[hsl(var(--ink-primary))] placeholder:text-[hsl(var(--ink-muted))]"
          />
        </div>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="h-9 px-3 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] text-[12.5px] text-[hsl(var(--ink-primary))]"
        >
          <option value="all">Todos os domínios</option>
          {domains.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 bg-[hsl(var(--surface-2))] border-b border-[hsl(var(--hairline))] font-mono text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--ink-faint))]">
          <span>Ferramenta</span>
          <span>Risco</span>
          <span>Domínio</span>
        </div>
        {filtered.map((t) => <ToolRow key={t.id} t={t} />)}
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-[12.5px] text-[hsl(var(--ink-muted))]">
            Nenhuma ferramenta corresponde ao filtro.
          </div>
        )}
      </div>
    </div>
  );
}
