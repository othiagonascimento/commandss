import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3-geo';
import { tenantsApi } from '@/services/masterApi';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Surface } from '@/components/ds/Surface';
import { lookupCity } from '@/lib/brazilCapitals';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface Tenant {
  id: string; name: string;
  state?: string | null; city?: string | null;
  plan_type?: string | null; status?: string | null;
}
type FC = { type: string; features: Array<{ type: 'Feature'; properties: { uf: string; name: string }; geometry: any }> };

interface CityCluster {
  uf: string; city: string;
  coords: [number, number];
  tenants: Tenant[];
}

export function HomeBrazilMap() {
  const [geo, setGeo] = useState<FC | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [hover, setHover] = useState<{ uf: string; x: number; y: number; n: number } | null>(null);
  const [hoverPin, setHoverPin] = useState<{ key: string; x: number; y: number; cluster: CityCluster } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });

  useEffect(() => {
    fetch('/geo/brasil-estados.json').then(r => r.json()).then(setGeo).catch(() => setGeo(null));
    tenantsApi.list({ limit: 500 })
      .then(res => {
        const list = (res.data as any)?.tenants ?? (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
        setTenants(Array.isArray(list) ? list : []);
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const node = ref.current;
      if (!node) return;
      const r = node.getBoundingClientRect();
      if (r.width > 0) setSize({ w: r.width, h: Math.max(420, r.width * 0.95) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [geo]);

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

  const cityClusters = useMemo(() => {
    const m = new Map<string, CityCluster>();
    for (const t of tenants) {
      if (!t.state || !t.city) continue;
      const coords = lookupCity(t.state, t.city);
      if (!coords) continue;
      const key = `${t.state}:${t.city.trim().toUpperCase()}`;
      const cur = m.get(key);
      if (cur) cur.tenants.push(t);
      else m.set(key, { uf: t.state.toUpperCase(), city: t.city, coords, tenants: [t] });
    }
    return Array.from(m.values());
  }, [tenants]);

  const max = useMemo(() => Math.max(1, ...Array.from(byUF.values()).map(v => v.length)), [byUF]);
  const noLoc = tenants.filter(t => !t.state).length;
  const noCity = tenants.filter(t => t.state && !t.city).length;

  const projection = useMemo(() => geo ? d3.geoMercator().fitSize([size.w, size.h], geo as any) : null, [geo, size]);
  const pathGen = useMemo(() => projection ? d3.geoPath(projection as any) : null, [projection]);

  const fillFor = (uf: string) => {
    const n = byUF.get(uf)?.length ?? 0;
    if (n === 0) return 'hsl(var(--surface-2))';
    const ratio = n / max;
    const alpha = Math.max(0.12, Math.min(0.65, 0.18 + ratio * 0.5));
    return `hsl(var(--brand-magenta) / ${alpha})`;
  };

  const selList = selected && selected !== '__none__' ? (byUF.get(selected) ?? []) : [];

  return (
    <Surface className="p-4 sm:p-5 overflow-hidden" crosshairs>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="editorial-label">/ CARTOGRAFIA OPERACIONAL</div>
          <h3 className="font-display text-lg font-semibold text-ink mt-0.5">Distribuição nacional</h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-ink-3 uppercase tracking-wider">
          <span><span className="text-ink">{tenants.length}</span> tenants</span>
          <span className="text-ink-faint">·</span>
          <span><span className="text-ink">{byUF.size}</span> uf</span>
          <span className="text-ink-faint">·</span>
          <span><span className="text-ink">{cityClusters.length}</span> cidades</span>
        </div>
      </div>

      <div
        ref={ref}
        className="relative w-full grid-blueprint rounded-md overflow-hidden border border-hairline"
        style={{ minHeight: 380, background: 'hsl(var(--surface-1))' }}
      >
        {/* Glow ambiente */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle at 50% 60%, hsl(var(--brand-purple) / 0.10), transparent 70%)',
          }}
        />

        {!geo || !pathGen ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {loading ? (
              <div className="skeleton-sweep w-full h-full max-w-[480px] max-h-[420px] rounded-md" />
            ) : (
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-ink-3 mx-auto mb-2" />
                <p className="text-sm text-ink-2">Mapa indisponível</p>
                <p className="text-xs text-ink-3 mt-1 font-mono">geojson não carregado</p>
              </div>
            )}
          </div>
        ) : (
          <svg width={size.w} height={size.h} className="block relative z-10">
            <defs>
              <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--brand-magenta))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--brand-magenta))" stopOpacity="0" />
              </radialGradient>
              <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dy="1" />
                <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Estados */}
            {geo.features.map((f, i) => {
              const uf = f.properties.uf;
              const n = byUF.get(uf)?.length ?? 0;
              const isSel = selected === uf;
              const isHover = hover?.uf === uf;
              return (
                <path
                  key={uf}
                  d={pathGen(f as any) || ''}
                  fill={fillFor(uf)}
                  stroke={isSel || isHover ? 'hsl(var(--brand-magenta))' : 'hsl(var(--hairline-strong))'}
                  strokeWidth={isSel ? 1.4 : isHover ? 1 : 0.6}
                  className="cursor-pointer transition-all duration-200"
                  style={{ animation: `fade-in .4s cubic-bezier(.2,.7,.1,1) both`, animationDelay: `${i * 14}ms` }}
                  onMouseMove={e => setHover({ uf, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, n })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(uf)}
                />
              );
            })}

            {/* UF labels */}
            {geo.features.map(f => {
              const uf = f.properties.uf;
              const n = byUF.get(uf)?.length ?? 0;
              if (!projection) return null;
              const c = (d3.geoPath(projection as any) as any).centroid(f);
              if (!isFinite(c[0])) return null;
              return (
                <text
                  key={`l-${uf}`} x={c[0]} y={c[1]}
                  textAnchor="middle" dominantBaseline="middle"
                  className={`pointer-events-none font-mono ${n > 0 ? 'fill-ink' : 'fill-ink-3'}`}
                  style={{ fontSize: 9, letterSpacing: '0.08em', fontWeight: n > 0 ? 600 : 400 }}
                >
                  {uf}
                </text>
              );
            })}

            {/* Pins de cidades */}
            {cityClusters.map((c, i) => {
              if (!projection) return null;
              const xy = projection(c.coords);
              if (!xy) return null;
              const [x, y] = xy;
              const r = Math.min(10, 3 + Math.log2(c.tenants.length + 1) * 2.2);
              const isHover = hoverPin?.key === `${c.uf}:${c.city}`;
              return (
                <g
                  key={`pin-${i}`}
                  transform={`translate(${x},${y})`}
                  className="cursor-pointer"
                  onMouseEnter={e => setHoverPin({ key: `${c.uf}:${c.city}`, x, y, cluster: c })}
                  onMouseLeave={() => setHoverPin(null)}
                  onClick={() => setSelected(c.uf)}
                  style={{ animation: 'fade-in .5s cubic-bezier(.2,.7,.1,1) both', animationDelay: `${300 + i * 30}ms` }}
                >
                  <circle r={r * 2.4} fill="url(#pinGlow)" />
                  <circle
                    r={r}
                    fill="hsl(var(--brand-magenta))"
                    stroke="hsl(var(--canvas))"
                    strokeWidth={1.5}
                    filter="url(#pinShadow)"
                    className="transition-all duration-200"
                    style={{ transform: isHover ? 'scale(1.25)' : 'scale(1)', transformOrigin: 'center', transformBox: 'fill-box' as any }}
                  />
                  {c.tenants.length > 1 && (
                    <text
                      textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize={Math.max(8, r - 1)} fontWeight={600}
                      className="pointer-events-none font-mono"
                    >
                      {c.tenants.length}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip estado */}
        {hover && !hoverPin && (
          <div
            className="absolute pointer-events-none bg-surface-3 border border-hairline-strong rounded-sm px-2.5 py-1.5 text-[11px] font-mono shadow-lg z-20 backdrop-blur"
            style={{ left: Math.min(hover.x + 14, size.w - 160), top: Math.max(hover.y - 8, 0) }}
          >
            <div className="flex items-center gap-2">
              <span className="text-plasma font-semibold">{hover.uf}</span>
              <span className="text-ink-faint">·</span>
              <span className="text-ink">{hover.n} {hover.n === 1 ? 'tenant' : 'tenants'}</span>
            </div>
          </div>
        )}

        {/* Tooltip pin (cidade) */}
        {hoverPin && (
          <div
            className="absolute pointer-events-none bg-surface-3 border border-brand-magenta/60 rounded-md px-3 py-2 text-[11px] font-mono shadow-xl z-20 backdrop-blur ring-brand"
            style={{ left: Math.min(hoverPin.x + 14, size.w - 220), top: Math.max(hoverPin.y - 30, 0) }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Navigation className="h-3 w-3 text-plasma" />
              <span className="text-ink uppercase tracking-wider font-semibold">{hoverPin.cluster.city}</span>
              <span className="text-ink-faint">/{hoverPin.cluster.uf}</span>
            </div>
            <div className="text-ink-2">
              {hoverPin.cluster.tenants.length} {hoverPin.cluster.tenants.length === 1 ? 'tenant' : 'tenants'}
              {hoverPin.cluster.tenants[0] && (
                <span className="text-ink-faint"> · {hoverPin.cluster.tenants[0].name}{hoverPin.cluster.tenants.length > 1 ? '…' : ''}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / legenda */}
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 font-mono text-[10px] text-ink-3 uppercase tracking-wider flex-wrap">
          <span className="flex items-center gap-1.5">
            <span>densidade</span>
            <span
              className="inline-block w-16 h-1.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(var(--surface-2)), hsl(var(--brand-magenta)))' }}
            />
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-plasma" /> cidades mapeadas
          </span>
        </div>
        {(noLoc > 0 || noCity > 0) && (
          <button
            onClick={() => setSelected('__none__')}
            className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-plasma transition-colors flex items-center gap-1.5"
          >
            <AlertCircle className="h-3 w-3" />
            sem geo {noLoc > 0 && `(${noLoc} estado)`} {noCity > 0 && `(${noCity} cidade)`}
          </button>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent side="right" className="bg-surface-1 border-l border-hairline w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display tracking-tight text-ink flex items-baseline gap-2">
              <span>{selected === '__none__' ? 'Sem geolocalização' : selected}</span>
              <span className="font-mono text-xs text-ink-3 tabular">
                {(selected === '__none__' ? tenants.filter(t => !t.state).length : selList.length)} tenants
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1.5 max-h-[80vh] overflow-y-auto custom-scrollbar pr-1">
            {(selected === '__none__' ? tenants.filter(t => !t.state) : selList).map(t => (
              <a
                key={t.id} href={`/tenants/${t.id}`}
                className="block px-3 py-2 bg-surface-2 hover:border-brand-magenta/50 border border-hairline rounded-sm transition-colors group"
              >
                <div className="text-sm text-ink group-hover:text-plasma transition-colors">{t.name}</div>
                <div className="font-mono text-[10px] text-ink-3 uppercase tracking-wider mt-0.5">
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
