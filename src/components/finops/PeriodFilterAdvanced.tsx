import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';

export function PeriodFilterAdvanced() {
  const { filters, label, setMonth, setRange, setPreset, setCompare } = useFinOpsPeriod();
  const [from, setFrom] = useState(filters.start_date || '');
  const [to, setTo] = useState(filters.end_date || '');
  const [month, setMonthInput] = useState(filters.month || '');

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{label}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Período rápido</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setPreset('today')}>Hoje</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPreset('7d')}>Últimos 7 dias</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPreset('30d')}>Últimos 30 dias</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPreset('mtd')}>Mês atual</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPreset('prev_month')}>Mês anterior</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMonth('2026-04')}>Abril/2026 (referência)</DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Mês específico</DropdownMenuLabel>
          <div className="px-2 pb-2 flex gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonthInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button size="sm" className="h-8" onClick={() => month && setMonth(month)}>
              OK
            </Button>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Range customizado</DropdownMenuLabel>
          <div className="px-2 pb-2 flex flex-col gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" className="h-8" onClick={() => from && to && setRange(from, to)}>
              Aplicar range
            </Button>
          </div>

          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 flex items-center justify-between">
            <Label htmlFor="compare-toggle" className="text-xs">
              Comparar com período anterior
            </Label>
            <Switch
              id="compare-toggle"
              checked={filters.compare !== 'none'}
              onCheckedChange={(v) => setCompare(v ? 'prev' : 'none')}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
