import { Clock, Layers, BookOpen } from 'lucide-react';

interface DocHeroProps {
  index: number;
  total: number;
  subtitle: string;
  title: string;
  description: string;
  sectionsCount: number;
  readingMinutes: number;
}

export function DocHero({
  index,
  total,
  subtitle,
  title,
  description,
  sectionsCount,
  readingMinutes,
}: DocHeroProps) {
  return (
    <header className="relative mb-10 pb-8 border-b border-hairline overflow-hidden">
      <div
        className="absolute -top-24 -right-20 h-72 w-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(closest-side, hsl(var(--plasma) / 0.55), transparent 70%)',
        }}
      />
      <div className="relative">
        <div className="flex items-end gap-5 mb-6">
          <div className="doc-cover-num">{String(index).padStart(2, '0')}</div>
          <div className="pb-1.5">
            <div className="doc-eyebrow text-plasma">
              Documento {index} / {total}
            </div>
            <div className="text-xs font-mono text-ink-faint uppercase tracking-wider mt-1">
              {subtitle}
            </div>
          </div>
        </div>

        <h1 className="doc-display-title mb-4">{title}</h1>
        <p className="text-base sm:text-lg text-ink-2 leading-relaxed max-w-3xl">
          {description}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono uppercase tracking-wider text-ink-faint">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-plasma" /> {sectionsCount} seções
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-plasma" /> ~{readingMinutes} min de leitura
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-plasma" /> Documento institucional · v1
          </span>
        </div>
      </div>
    </header>
  );
}
