import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3-geo';
import { tenantsApi } from '@/services/masterApi';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Surface } from '@/components/ds/Surface';

interface Tenant { id: string; name: string; state?: string | null; city?: string | null; plan_type?: string | null; }
type FC = { type: string; features: Array<{ type: 'Feature'; properties: { uf: string; name: string }; geometry: any }> };

export function HomeBrazilMap() {
  const [geo, setGeo] = useState<FC | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [hover, setHover] = useState<{ uf: string; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });

  useEffect(() => {
    fetch('/geo/brasil-estados.json').then(r => r.json()).then(setGeo).catch(() => setGeo(null));
    tenantsApi.list({ limit: 500 }).then(res => {
      const list = (res.data as any)?.tenants ?? (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setTenants(Array.isArray(list) ? list : []);
    }).catch(() => setTenants([]));
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      const r = ref.current!.getBoundingClientRect();
      setSize({ w: r.width, h: r.width * 0.95 });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const byUF = useMemo(() => {
    const m = new Map<string, Tenant[]>();
    for (const t of tenants) {
      const uf = (t.state || '').toUpperCase().slice(0, 2);
      if (!uf) continue;
      if (!m.has(uf)) m.set(uf, []);
      m.get(uf)!.push(t);
    }
    return m;
  }, [tenants]);

  const max = useMemo(() => Math.max(1, ...Array.from(byUF.values()).map(v => v.length)), [byUF]);
  const noLoc = tenants.filter(t => !t.state).length;

  const projection = useMemo(() => {
    if (!geo) return null;
    return d3.geoMercator().fitSize([size.w, size.h], geo as any);
  }, [geo, size]);

  const pathGen = useMemo(() => projection ? d3.geoPath(projection as any) : null, [projection]);

  const fillFor = (uf: string) => {
    const n = byUF.get(uf)?.length ?? 0;
    if (n === 0) return 'hsl(var(--surface-2))';
    const alpha = Math.max(0.1, Math.min(0.85, 0.15 + (n / max) * 0.7));
    return `hsl(var(--plasma) / ${alpha})`;
  };

  const selList = selected ? (byUF.get(selected) ?? []) : [];

  return (
    <Surface className="p-4 sm:p-5" crosshairs>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="editorial-label">/ DISTRIBUIÇÃO NACIONAL</div>
          <h3 className="font-display text-lg font-semibold text-ink mt-0.5">Tenants por estado</h3>
        </div>
        <div className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">
          {tenants.length} TOTAL · {byUF.size} UF
        </div>
      </div>

      <div ref={ref} className="relative w-full grid-blueprint rounded-sm overflow-hidden" style={{ minHeight: 320 }}>
        {!geo || !pathGen ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="skeleton-sweep w-3/4 h-3/4 rounded-md" />
          </div>
        ) : (
          <svg width={size.w} height={size.h} className="block">
            {geo.features.map((f, i) => {
              const uf = f.properties.uf;
              const n = byUF.get(uf)?.length ?? 0;
              const isSel = selected === uf;
              return (
                <path
                  key={uf}
                  d={pathGen(f as any) || ''}
                  fill={fillFor(uf)}
                  stroke={isSel ? 'hsl(var(--plasma))' : 'hsl(var(--hairline-strong))'}
                  strokeWidth={isSel ? 1.2 : 0.6}
                  className="cursor-pointer transition-colors"
                  style={{ animation: `fade-in .4s cubic-bezier(.2,.7,.1,1) both`, animationDelay: `${i * 12}ms` }}
                  onMouseMove={e => setHover({ uf, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(uf)}
                />
              );
            })}
            {/* UF labels for top states */}
            {geo.features.map(f => {
              const uf = f.properties.uf;
              const n = byUF.get(uf)?.length ?? 0;
              if (n === 0 || !projection) return null;
              const c = (d3.geoPath(projection as any) as any).centroid(f);
              if (!isFinite(c[0])) return null;
              return (
                <text key={`l-${uf}`} x={c[0]} y={c[1]} textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none fill-ink font-mono"
                  style={{ fontSize: 9, letterSpacing: '0.08em' }}>
                  {uf}
                </text>
              );
            })}
          </svg>
        )}

        {hover && (
          <div className="absolute pointer-events-none bg-surface-3 border border-hairline-strong rounded-sm px-2 py-1.5 text-[11px] font-mono"
            style={{ left: Math.min(hover.x + 12, size.w - 140), top: Math.max(hover.y - 12, 0) }}>
            <div className="text-ink">{hover.uf}</div>
            <div className="text-ink-2">{byUF.get(hover.uf)?.length ?? 0} tenants</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-[10px] text-ink-3 uppercase tracking-wider">
          <span>densidade</span>
          <span className="inline-block w-16 h-1.5" style={{ background: 'linear-gradient(90deg, hsl(var(--surface-2)), hsl(var(--plasma)))' }} />
          <span>baixa → alta</span>
        </div>
        {noLoc > 0 && (
          <button onClick={() => setSelected('__none__')} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma">
            sem geolocalização ({noLoc})
          </button>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent side="right" className="bg-surface-1 border-l border-hairline w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display tracking-tight text-ink">
              {selected === '__none__' ? 'Sem geolocalização' : `${selected} — ${selList.length} tenants`}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1.5 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {(selected === '__none__' ? tenants.filter(t => !t.state) : selList).map(t => (
              <a key={t.id} href={`/tenants/${t.id}`} className="block px-3 py-2 bg-surface-2 hover:border-plasma/40 border border-hairline rounded-sm">
                <div className="text-sm text-ink">{t.name}</div>
                <div className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">
                  {[t.city, t.state, t.plan_type].filter(Boolean).join(' · ') || '—'}
                </div>
              </a>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </Surface>
  );
}
