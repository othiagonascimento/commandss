export const brl = (v: number | null | undefined, opts: Intl.NumberFormatOptions = {}) => {
  if (v == null || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
    ...opts,
  }).format(v);
};

export const num = (v: number | null | undefined, digits = 0) => {
  if (v == null || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
};

export const pct = (v: number | null | undefined, digits = 1) => {
  if (v == null || Number.isNaN(v)) return '—';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)}%`;
};

export const bytes = (v: number | null | undefined) => {
  if (v == null || Number.isNaN(v)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = v;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
};

export const compactNum = (v: number | null | undefined) => {
  if (v == null || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
};

export const dateBR = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

export const monthLabelBR = (yyyymm: string) => {
  const [y, m] = yyyymm.split('-').map(Number);
  if (!y || !m) return yyyymm;
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const toCSV = (rows: Record<string, unknown>[], headers?: { key: string; label: string }[]) => {
  if (!rows.length) return '';
  const cols = headers ?? Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
  const escape = (val: unknown) => {
    if (val == null) return '';
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.map((c) => escape(c.label)).join(';');
  const body = rows.map((r) => cols.map((c) => escape(r[c.key])).join(';')).join('\n');
  return `${head}\n${body}`;
};

export const downloadCSV = (filename: string, csv: string) => {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
