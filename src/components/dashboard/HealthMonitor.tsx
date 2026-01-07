import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, HelpCircle } from 'lucide-react';
import { InfoCard } from './InfoCard';
import type { LatencyDataPoint } from '@/types/dashboard';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HealthMonitorProps {
  data: LatencyDataPoint[];
  delay?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-mono text-lg font-semibold">{data.value}ms</p>
        <p className="text-muted-foreground text-xs">
          Tempo de resposta neste momento
        </p>
      </div>
    );
  }
  return null;
};

export function HealthMonitor({ data, delay = 0 }: HealthMonitorProps) {
  const currentLatency = data[data.length - 1]?.value ?? 0;
  const status = data[data.length - 1]?.status ?? 'healthy';
  
  const chartData = useMemo(() => 
    data.map((d, i) => ({
      ...d,
      index: i,
      timestamp: d.timestamp.getTime(),
    })),
    [data]
  );

  const getStatusInfo = () => {
    if (status === 'healthy') {
      return { 
        color: 'hsl(142, 71%, 45%)', 
        bg: 'bg-success/10',
        text: 'text-success',
        label: 'Excelente',
        message: 'O sistema está respondendo rapidamente'
      };
    }
    if (status === 'warning') {
      return { 
        color: 'hsl(38, 92%, 50%)', 
        bg: 'bg-warning/10',
        text: 'text-warning',
        label: 'Atenção',
        message: 'O sistema está um pouco mais lento que o normal'
      };
    }
    return { 
      color: 'hsl(0, 84%, 60%)', 
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      label: 'Lento',
      message: 'O sistema está demorando para responder'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <InfoCard
      title="Velocidade do Sistema"
      description="Quanto tempo o sistema demora para responder"
      helpText="Este gráfico mostra o tempo de resposta do seu sistema em milissegundos (ms). Quanto menor o número, mais rápido está. Abaixo de 80ms é excelente, entre 80-150ms é aceitável, acima de 150ms pode causar lentidão para seus usuários."
      icon={<Activity className="w-5 h-5" />}
      delay={delay}
      span={2}
    >
      {/* Current Status */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bg}`}>
          <span className={`status-dot ${status === 'healthy' ? 'status-dot-success' : status === 'warning' ? 'status-dot-warning' : 'status-dot-error'}`} />
          <span className={`text-sm font-medium ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className={`font-mono text-2xl font-bold ${statusInfo.text}`}>
              {currentLatency}
            </span>
            <span className="text-sm text-muted-foreground">ms</span>
            <UITooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-muted-foreground ml-1" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Milissegundos - quanto menor, melhor!</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-xs text-muted-foreground">{statusInfo.message}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[160px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={statusInfo.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={statusInfo.color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="index" hide />
            <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={statusInfo.color}
              strokeWidth={2}
              fill="url(#latencyGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Rápido (menos de 80ms)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Moderado (80-150ms)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Lento (mais de 150ms)</span>
        </div>
      </div>
    </InfoCard>
  );
}
