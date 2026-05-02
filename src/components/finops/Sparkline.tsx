import { useMemo } from 'react';
import type { FinOpsSparkPoint } from '@/types/finops';

interface Props {
  data: FinOpsSparkPoint[] | number[] | undefined | null;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = 'currentColor',
  fill,
  className,
}: Props) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const values = data.map((d) => (typeof d === 'number' ? d : d.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return [x, y] as const;
    });
  }, [data, width, height]);

  if (points.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeOpacity={0.2} strokeWidth={1} />
      </svg>
    );
  }

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      {fill && <path d={area} fill={fill} opacity={0.18} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
