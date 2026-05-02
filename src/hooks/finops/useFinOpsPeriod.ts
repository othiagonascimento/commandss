import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { FinOpsFilters } from '@/types/finops';

const todayMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function useFinOpsPeriod() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<FinOpsFilters>(() => {
    const month = params.get('period') || undefined;
    const start_date = params.get('from') || undefined;
    const end_date = params.get('to') || undefined;
    const compare = (params.get('compare') as 'prev' | 'none') || 'prev';

    if (start_date && end_date) {
      return { start_date, end_date, compare };
    }
    return { month: month || todayMonth(), compare };
  }, [params]);

  const setMonth = useCallback(
    (yyyymm: string) => {
      const next = new URLSearchParams(params);
      next.set('period', yyyymm);
      next.delete('from');
      next.delete('to');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const setRange = useCallback(
    (from: string, to: string) => {
      const next = new URLSearchParams(params);
      next.set('from', from);
      next.set('to', to);
      next.delete('period');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const setPreset = useCallback(
    (preset: 'today' | '7d' | '30d' | 'mtd' | 'prev_month') => {
      const now = new Date();
      if (preset === 'today') {
        const d = isoDay(now);
        return setRange(d, d);
      }
      if (preset === '7d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        return setRange(isoDay(start), isoDay(now));
      }
      if (preset === '30d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        return setRange(isoDay(start), isoDay(now));
      }
      if (preset === 'mtd') {
        return setMonth(todayMonth());
      }
      if (preset === 'prev_month') {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    },
    [setMonth, setRange],
  );

  const setCompare = useCallback(
    (mode: 'prev' | 'none') => {
      const next = new URLSearchParams(params);
      next.set('compare', mode);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const label = useMemo(() => {
    if (filters.start_date && filters.end_date) {
      return `${filters.start_date} → ${filters.end_date}`;
    }
    if (filters.month) {
      const [y, m] = filters.month.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    return '—';
  }, [filters]);

  return { filters, label, setMonth, setRange, setPreset, setCompare };
}
