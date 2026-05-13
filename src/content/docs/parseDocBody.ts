// Parser determinístico que classifica linhas do body em blocos visuais.
// IMPORTANTE: nunca altera nem remove texto — apenas agrupa.

export type DocBlock =
  | { kind: 'bullets'; items: string[] }
  | { kind: 'arrow' }
  | { kind: 'subheading'; numbering?: string; text: string }
  | { kind: 'manifesto'; text: string }
  | { kind: 'paragraph'; text: string };

const BULLET_RE = /^\s*•\s+(.*)$/;
const ARROW_RE = /^\s*↓\s*$/;
// "1. Algo" ou "5.2 Algo" ou "5.2. Algo"
const NUM_HEAD_RE = /^(\d+(?:\.\d+)?)[.)]?\s+(.+)$/;

export function parseDocBody(body: string): DocBlock[] {
  const lines = body.split('\n');
  const blocks: DocBlock[] = [];

  let i = 0;
  let pendingPara: string[] = [];

  const flushPara = () => {
    if (!pendingPara.length) return;
    const text = pendingPara.join('\n').replace(/\s+$/, '');
    pendingPara = [];
    if (!text) return;

    // manifesto: 1 linha curta, sem pontuação final pesada
    const isSingle = !text.includes('\n');
    const looksImpact =
      isSingle && text.length <= 80 && !/[.!?:;,]$/.test(text);
    blocks.push(
      looksImpact ? { kind: 'manifesto', text } : { kind: 'paragraph', text },
    );
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw ?? '';

    if (line.trim() === '') {
      flushPara();
      i++;
      continue;
    }

    if (ARROW_RE.test(line)) {
      flushPara();
      blocks.push({ kind: 'arrow' });
      i++;
      continue;
    }

    if (BULLET_RE.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && BULLET_RE.test(lines[i] ?? '')) {
        const m = (lines[i] as string).match(BULLET_RE);
        if (m) items.push(m[1].trim());
        i++;
      }
      blocks.push({ kind: 'bullets', items });
      continue;
    }

    // Subheading numerado: precisa ser linha curta-ish e ser seguido por linha em branco
    const numMatch = line.match(NUM_HEAD_RE);
    const next = lines[i + 1] ?? '';
    if (
      numMatch &&
      line.length <= 90 &&
      (next.trim() === '' || i + 1 >= lines.length)
    ) {
      flushPara();
      blocks.push({
        kind: 'subheading',
        numbering: numMatch[1],
        text: numMatch[2].trim(),
      });
      i++;
      continue;
    }

    pendingPara.push(line);
    i++;
  }

  flushPara();
  return blocks;
}
