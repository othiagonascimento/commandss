import { ArrowDown, Quote } from 'lucide-react';
import type { DocBlock } from '@/content/docs/parseDocBody';

const MANIFESTO_VARIANTS = ['quote', 'centered', 'side-bar', 'boxed'] as const;
type ManifestoVariant = (typeof MANIFESTO_VARIANTS)[number];

function ManifestoBlock({ text, variant }: { text: string; variant: ManifestoVariant }) {
  if (variant === 'quote') {
    return (
      <div className="doc-manifesto-quote">
        <Quote className="h-5 w-5 text-plasma/60 shrink-0 mt-1" />
        <span>{text}</span>
      </div>
    );
  }
  if (variant === 'centered') {
    return (
      <div className="doc-manifesto-centered">
        <span className="h-px w-12 bg-plasma" />
        <span>{text}</span>
        <span className="h-px w-12 bg-plasma" />
      </div>
    );
  }
  if (variant === 'boxed') {
    return (
      <div className="doc-manifesto-boxed">
        <span>{text}</span>
      </div>
    );
  }
  return (
    <div className="doc-manifesto">
      <span>{text}</span>
    </div>
  );
}

export function DocBlockRenderer({ blocks }: { blocks: DocBlock[] }) {
  let manifestoCount = 0;
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
          case 'manifesto': {
            const variant = MANIFESTO_VARIANTS[manifestoCount % MANIFESTO_VARIANTS.length];
            manifestoCount++;
            return <ManifestoBlock key={i} text={b.text} variant={variant} />;
          }
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
