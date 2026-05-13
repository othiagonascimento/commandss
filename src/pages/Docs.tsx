import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { docsLibrary } from '@/content/docs/uopa-base';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronRight, Search, FileText, Compass, List, ArrowLeft, ArrowRight, Clock, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { parseDocBody } from '@/content/docs/parseDocBody';
import { DocBlockRenderer } from '@/components/docs/DocBlockRenderer';
import { DocHero } from '@/components/docs/DocHero';
import { ChapterNav } from '@/components/docs/ChapterNav';
import { sectionInfographics, variantFor } from '@/components/docs/sectionInfographicMap';

const WORDS_PER_MIN = 220;

function readingMinutes(doc: { sections: { body: string }[] }) {
  const words = doc.sections.reduce((acc, s) => acc + s.body.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MIN));
}

export default function Docs() {
  const { docId, sectionId } = useParams();
  const navigate = useNavigate();

  const doc = useMemo(
    () => docsLibrary.find((d) => d.id === docId) ?? docsLibrary[0],
    [docId],
  );
  const docIndex = useMemo(
    () => docsLibrary.findIndex((d) => d.id === doc.id) + 1,
    [doc],
  );

  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | undefined>(sectionId);
  const [tocOpen, setTocOpen] = useState(false);

  // Parse all sections once per doc
  const parsedSections = useMemo(
    () => doc.sections.map((s) => ({ ...s, blocks: parseDocBody(s.body) })),
    [doc],
  );

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
    if (!query.trim()) return parsedSections;
    const q = query.toLowerCase();
    return parsedSections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q),
    );
  }, [query, parsedSections]);

  const goToSection = (id: string) => {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  // ===== LIBRARY INDEX =====
  if (!docId) {
    return (
      <DashboardLayout>
        <div className="mb-6 flex items-center gap-2 text-xs text-ink-faint font-mono uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Biblioteca</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink-2">Documentos institucionais</span>
        </div>

        <header className="relative mb-10 pb-8 border-b border-hairline overflow-hidden">
          <div
            className="absolute -top-20 -right-10 h-64 w-64 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{
              background:
                'radial-gradient(closest-side, hsl(var(--plasma) / 0.6), transparent 70%)',
            }}
          />
          <div className="relative">
            <div className="doc-eyebrow text-plasma mb-3">Norte estratégico do UÔPA</div>
            <h1 className="doc-display-title mb-3">Documentos institucionais</h1>
            <p className="text-base sm:text-lg text-ink-2 leading-relaxed max-w-2xl">
              Os documentos oficiais que definem visão, arquitetura e tese do UÔPA.
              Texto preservado na íntegra. Escolha o que abrir.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {docsLibrary.map((d, idx) => {
            const mins = readingMinutes(d);
            return (
              <button
                key={d.id}
                onClick={() => navigate(`/docs/${d.id}`)}
                className="group relative text-left bg-surface-1 border border-hairline rounded-lg p-7 hover:border-plasma/40 transition-all overflow-hidden"
              >
                <div
                  className="absolute -top-12 -right-8 h-44 w-44 rounded-full opacity-20 blur-3xl pointer-events-none group-hover:opacity-40 transition-opacity"
                  style={{
                    background:
                      'radial-gradient(closest-side, hsl(var(--plasma) / 0.7), transparent 70%)',
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="doc-cover-num">{String(idx + 1).padStart(2, '0')}</div>
                    <FileText className="h-5 w-5 text-plasma/60" />
                  </div>
                  <div className="doc-eyebrow text-plasma mb-2">{d.subtitle}</div>
                  <h2 className="text-xl font-semibold text-ink leading-tight mb-3">{d.title}</h2>
                  <p className="text-sm text-ink-2 leading-relaxed line-clamp-3 mb-5">{d.description}</p>
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-ink-faint">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-plasma" /> {d.sections.length} seções
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-plasma" /> ~{mins} min
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-plasma group-hover:gap-2 transition-all">
                      Abrir <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DashboardLayout>
    );
  }

  // ===== DOC READER =====
  const TocList = ({ onSelect }: { onSelect?: (id: string) => void }) => (
    <nav className="space-y-0.5">
      {doc.sections.map((s) => {
        const isActive = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => (onSelect ?? goToSection)(s.id)}
            className={cn(
              'w-full text-left text-[12.5px] leading-snug py-2 pl-3 pr-2 rounded transition-colors flex gap-2.5 border-l-2',
              isActive
                ? 'text-ink bg-surface-2 border-plasma'
                : 'text-ink-faint hover:text-ink-2 border-transparent hover:border-hairline-strong',
            )}
          >
            {s.number !== null ? (
              <span className="font-mono tabular text-plasma/70 shrink-0 text-[11px] mt-0.5">
                {String(s.number).padStart(2, '0')}
              </span>
            ) : (
              <span className="font-mono text-plasma/50 text-[11px] mt-0.5">—</span>
            )}
            <span className="truncate">{s.title}</span>
          </button>
        );
      })}
    </nav>
  );

  const idxInDoc = (id: string) => doc.sections.findIndex((s) => s.id === id);

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

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_240px] gap-8">
        {/* Library (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div>
              <div className="doc-eyebrow mb-2">Documentos</div>
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
              <div className="doc-eyebrow mb-2 flex items-center gap-1.5">
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
          <DocHero
            index={docIndex}
            total={docsLibrary.length}
            subtitle={doc.subtitle}
            title={doc.title}
            description={doc.description}
            sectionsCount={doc.sections.length}
            readingMinutes={readingMinutes(doc)}
          />

          <div className="mb-8 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no documento..."
              className="pl-9 h-10 bg-surface-2/50 border-border"
            />
          </div>

          <article className="space-y-16">
            {filteredSections.map((s) => {
              const Info = sectionInfographics[s.id];
              const i = idxInDoc(s.id);
              const prev = i > 0 ? doc.sections[i - 1] : undefined;
              const next = i < doc.sections.length - 1 ? doc.sections[i + 1] : undefined;
              return (
                <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-24">
                  <div className="flex items-start gap-4 mb-5 pb-3 border-b border-hairline">
                    {s.number !== null ? (
                      <div className="doc-chapter-num shrink-0">
                        {String(s.number).padStart(2, '0')}
                      </div>
                    ) : (
                      <div className="doc-eyebrow text-plasma mt-2 shrink-0">★</div>
                    )}
                    <div className="min-w-0 pt-1">
                      <div className="doc-eyebrow text-plasma mb-1">
                        {s.number !== null ? `Capítulo ${s.number}` : 'Abertura'}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight leading-tight">
                        {s.title}
                      </h2>
                    </div>
                  </div>

                  {Info && <Info />}

                  <DocBlockRenderer blocks={s.blocks} />

                  {!query.trim() && (
                    <ChapterNav prev={prev} next={next} onNavigate={goToSection} />
                  )}
                </section>
              );
            })}
            {filteredSections.length === 0 && (
              <div className="text-center py-16 text-ink-faint">
                Nenhum trecho encontrado para "{query}".
              </div>
            )}
          </article>

          <footer className="mt-20 pt-6 border-t border-hairline text-center">
            <div className="doc-eyebrow text-plasma mb-2">Fim do documento</div>
            <div className="font-display text-lg text-ink-2 italic">
              Da descoberta à recompra.
            </div>
          </footer>
        </main>

        {/* TOC desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="doc-eyebrow mb-3">Sumário</div>
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar pr-2">
              <TocList />
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
