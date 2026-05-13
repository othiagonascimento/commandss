import { ArrowDown } from 'lucide-react';
import type { DocBlock } from '@/content/docs/parseDocBody';

export function DocBlockRenderer({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'paragraph':
            return (
              <p key={i} className="doc-paragraph">
                {b.text}
              </p>
            );
          case 'manifesto':
            return (
              <div key={i} className="doc-manifesto">
                <span>{b.text}</span>
              </div>
            );
          case 'subheading':
            return (
              <div key={i} className="doc-subheading">
                {b.numbering && <span className="doc-subheading-num">{b.numbering}</span>}
                <span>{b.text}</span>
              </div>
            );
          case 'arrow':
            return (
              <div key={i} className="flex justify-center py-1" aria-hidden>
                <ArrowDown className="h-4 w-4 text-plasma/60" />
              </div>
            );
          case 'bullets':
            return (
              <ul key={i} className="doc-bullets">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <span className="doc-bullet-dot" aria-hidden />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
