import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ChapterNavProps {
  prev?: { id: string; title: string; number: number | null };
  next?: { id: string; title: string; number: number | null };
  onNavigate: (id: string) => void;
}

export function ChapterNav({ prev, next, onNavigate }: ChapterNavProps) {
  if (!prev && !next) return null;
  return (
    <nav className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <button
          onClick={() => onNavigate(prev.id)}
          className="group text-left rounded-lg border border-hairline bg-surface-1/60 hover:bg-surface-2/80 hover:border-plasma/40 p-4 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-1.5">
            <ArrowLeft className="h-3 w-3" /> Capítulo anterior
          </div>
          <div className="flex items-baseline gap-2">
            {prev.number !== null && (
              <span className="font-mono text-xs text-plasma tabular">
                {String(prev.number).padStart(2, '0')}
              </span>
            )}
            <span className="text-sm font-semibold text-ink group-hover:text-plasma transition-colors">
              {prev.title}
            </span>
          </div>
        </button>
      ) : (
        <div />
      )}
      {next ? (
        <button
          onClick={() => onNavigate(next.id)}
          className="group text-right rounded-lg border border-hairline bg-surface-1/60 hover:bg-surface-2/80 hover:border-plasma/40 p-4 transition-colors"
        >
          <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-1.5">
            Próximo capítulo <ArrowRight className="h-3 w-3" />
          </div>
          <div className="flex items-baseline justify-end gap-2">
            {next.number !== null && (
              <span className="font-mono text-xs text-plasma tabular">
                {String(next.number).padStart(2, '0')}
              </span>
            )}
            <span className="text-sm font-semibold text-ink group-hover:text-plasma transition-colors">
              {next.title}
            </span>
          </div>
        </button>
      ) : (
        <div />
      )}
    </nav>
  );
}
