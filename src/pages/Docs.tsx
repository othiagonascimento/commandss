import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { docsLibrary } from '@/content/docs/uopa-base';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronRight, Search, FileText, Compass, List, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export default function Docs() {
  const { docId, sectionId } = useParams();
  const navigate = useNavigate();

  const doc = useMemo(
    () => docsLibrary.find((d) => d.id === docId) ?? docsLibrary[0],
    [docId],
  );
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | undefined>(sectionId);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (!docId) return;
    if (sectionId) {
      const el = document.getElementById(`sec-${sectionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(sectionId);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [sectionId, doc.id, docId]);

  useEffect(() => {
    if (!docId) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id.replace('sec-', ''));
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    doc.sections.forEach((s) => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [doc, docId]);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return doc.sections;
    const q = query.toLowerCase();
    return doc.sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q),
    );
  }, [query, doc]);

  const goToSection = (id: string) => {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  // ===== LIBRARY INDEX (no doc selected) =====
  if (!docId) {
    return (
      <DashboardLayout>
        <div className="mb-6 flex items-center gap-2 text-xs text-ink-faint font-mono uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Biblioteca</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink-2">Documentos institucionais</span>
        </div>

        <header className="mb-8 pb-6 hairline-b">
          <div className="text-xs font-mono uppercase tracking-wider text-plasma mb-3">
            Norte estratégico do UÔPA
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-3">
            Documentos institucionais
          </h1>
          <p className="text-base text-ink-2 leading-relaxed max-w-2xl">
            Documentos oficiais de consulta rápida. Texto preservado na íntegra. Escolha qual documento abrir.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docsLibrary.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/docs/${d.id}`)}
              className="group text-left bg-surface-1 border border-hairline rounded-md p-6 hover:bg-surface-2 hover:border-plasma/40 transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-md bg-plasma/10 text-plasma flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-plasma mb-1.5 leading-tight">
                    {d.subtitle}
                  </div>
                  <h2 className="text-lg font-semibold text-ink leading-tight">{d.title}</h2>
                </div>
              </div>
              <p className="text-sm text-ink-2 leading-relaxed line-clamp-3">{d.description}</p>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="font-mono uppercase tracking-wider text-ink-faint">
                  {d.sections.length} seções
                </span>
                <span className="flex items-center gap-1 text-plasma group-hover:gap-2 transition-all">
                  Abrir <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ===== DOC READER =====
  const TocList = ({ onSelect }: { onSelect?: (id: string) => void }) => (
    <nav className="space-y-0.5">
      {doc.sections.map((s) => (
        <button
          key={s.id}
          onClick={() => (onSelect ?? goToSection)(s.id)}
          className={cn(
            'w-full text-left text-[13px] leading-snug py-2 px-2 rounded transition-colors flex gap-2',
            activeId === s.id
              ? 'text-ink bg-surface-2'
              : 'text-ink-faint hover:text-ink-2',
          )}
        >
          {s.number !== null && (
            <span className="font-mono tabular text-plasma/70 shrink-0">
              {String(s.number).padStart(2, '0')}
            </span>
          )}
          <span className="truncate">{s.title}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-ink-faint font-mono uppercase tracking-wider">
        <button onClick={() => navigate('/docs')} className="flex items-center gap-1.5 hover:text-ink-2 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Biblioteca
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink-2 truncate">{doc.title}</span>
      </div>

      {/* Mobile doc switcher + TOC */}
      <div className="lg:hidden mb-5 flex gap-2 sticky top-2 z-30">
        <select
          value={doc.id}
          onChange={(e) => navigate(`/docs/${e.target.value}`)}
          className="flex-1 h-10 rounded-md bg-surface-1 border border-hairline text-sm text-ink px-3"
        >
          {docsLibrary.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
        <Sheet open={tocOpen} onOpenChange={setTocOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-1.5">
              <List className="h-4 w-4" /> Sumário
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Sumário</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <TocList />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_240px] gap-8">
        {/* Library (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div>
              <div className="editorial-label mb-2">Documentos</div>
              <ul className="space-y-1">
                {docsLibrary.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => navigate(`/docs/${d.id}`)}
                      className={cn(
                        'w-full text-left flex items-start gap-2 px-3 py-2 rounded-md transition-colors text-sm',
                        d.id === doc.id
                          ? 'bg-surface-2 text-ink'
                          : 'text-ink-2 hover:text-ink hover:bg-surface-2/50',
                      )}
                    >
                      <FileText className="h-4 w-4 mt-0.5 shrink-0 text-plasma" />
                      <span className="leading-tight">{d.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hairline-t pt-4">
              <div className="editorial-label mb-2 flex items-center gap-1.5">
                <Compass className="h-3 w-3" /> Norte
              </div>
              <p className="text-[12px] text-ink-faint leading-relaxed">
                Documentos de consulta rápida que servem como o norte estratégico do UÔPA.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <header className="mb-8 pb-6 hairline-b">
            <div className="text-xs font-mono uppercase tracking-wider text-plasma mb-3">
              {doc.subtitle}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-3">
              {doc.title}
            </h1>
            <p className="text-base text-ink-2 leading-relaxed max-w-2xl">{doc.description}</p>
            <div className="mt-5 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no documento..."
                className="pl-9 h-9 bg-surface-2/50 border-border"
              />
            </div>
          </header>

          <article className="space-y-12">
            {filteredSections.map((s) => (
              <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-24">
                <div className="flex items-baseline gap-3 mb-4">
                  {s.number !== null && (
                    <span className="font-mono text-xs text-plasma tabular">
                      {String(s.number).padStart(2, '0')}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
                    {s.title}
                  </h2>
                </div>
                <div className="prose-doc">
                  {s.body.split('\n').map((line, i) => (
                    <p key={i} className={cn(line.trim() === '' && 'h-2')}>
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            ))}
            {filteredSections.length === 0 && (
              <div className="text-center py-16 text-ink-faint">
                Nenhum trecho encontrado para "{query}".
              </div>
            )}
          </article>

          <footer className="mt-16 pt-6 hairline-t text-xs text-ink-faint font-mono uppercase tracking-wider">
            Da descoberta à recompra.
          </footer>
        </main>

        {/* TOC desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="editorial-label mb-3">Sumário</div>
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar pr-2">
              <TocList />
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
