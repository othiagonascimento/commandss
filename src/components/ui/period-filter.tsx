import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight, Calendar, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface PeriodFilterValue {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  isCustom: boolean;
  label: string;
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  availablePeriods?: { start: string; end: string }[];
  className?: string;
  showCustomOption?: boolean;
}

function getMonthLabel(date: Date): string {
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

function getCurrentMonthPeriod(): PeriodFilterValue {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return {
    periodStart: format(start, 'yyyy-MM-dd'),
    periodEnd: format(end, 'yyyy-MM-dd'),
    isCustom: false,
    label: getMonthLabel(now),
  };
}

export function getDefaultPeriod(): PeriodFilterValue {
  return getCurrentMonthPeriod();
}

export function PeriodFilter({
  value,
  onChange,
  className,
  showCustomOption = true,
}: PeriodFilterProps) {
  const [mode, setMode] = useState<'month' | 'custom'>(value.isCustom ? 'custom' : 'month');
  const [customStart, setCustomStart] = useState<Date | undefined>(
    value.isCustom ? parseISO(value.periodStart) : undefined
  );
  const [customEnd, setCustomEnd] = useState<Date | undefined>(
    value.isCustom ? parseISO(value.periodEnd) : undefined
  );

  // Parse current month from value
  const currentMonthDate = parseISO(value.periodStart);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subMonths(currentMonthDate, 1)
      : addMonths(currentMonthDate, 1);
    
    const start = startOfMonth(newDate);
    const end = endOfMonth(newDate);
    
    onChange({
      periodStart: format(start, 'yyyy-MM-dd'),
      periodEnd: format(end, 'yyyy-MM-dd'),
      isCustom: false,
      label: getMonthLabel(newDate),
    });
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        periodStart: format(customStart, 'yyyy-MM-dd'),
        periodEnd: format(customEnd, 'yyyy-MM-dd'),
        isCustom: true,
        label: `${format(customStart, 'dd/MM/yy')} - ${format(customEnd, 'dd/MM/yy')}`,
      });
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'month' | 'custom');
    if (newMode === 'month' && value.isCustom) {
      // Reset to current month
      onChange(getCurrentMonthPeriod());
    }
  };

  // Generate quick month options (last 6 months)
  const quickMonths = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: getMonthLabel(date),
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd'),
    };
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="truncate">{value.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="month" className="gap-1">
              <Calendar className="h-3 w-3" />
              Mês
            </TabsTrigger>
            {showCustomOption && (
              <TabsTrigger value="custom" className="gap-1">
                <Settings2 className="h-3 w-3" />
                Intervalo
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="month" className="p-3 space-y-3">
            {/* Month Navigator */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMonthChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm capitalize">
                {getMonthLabel(currentMonthDate)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMonthChange('next')}
                disabled={
                  format(currentMonthDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Select */}
            <Select
              value={format(currentMonthDate, 'yyyy-MM')}
              onValueChange={(val) => {
                const month = quickMonths.find(m => m.value === val);
                if (month) {
                  onChange({
                    periodStart: month.start,
                    periodEnd: month.end,
                    isCustom: false,
                    label: month.label,
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar mês" />
              </SelectTrigger>
              <SelectContent>
                {quickMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>

          {showCustomOption && (
            <TabsContent value="custom" className="p-3 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Data inicial
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStart ? format(customStart, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStart}
                      onSelect={setCustomStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Data final
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEnd ? format(customEnd, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEnd}
                      onSelect={setCustomEnd}
                      disabled={(date) => customStart ? date < customStart : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                className="w-full"
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
              >
                Aplicar
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
