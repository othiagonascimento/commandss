import { Cpu, HardDrive, Wifi, Zap, HelpCircle } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { cn } from '@/lib/utils';
import type { SystemMetrics } from '@/types/dashboard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SystemStatsProps {
  data: SystemMetrics;
  delay?: number;
}

export function SystemStats({ data, delay = 0 }: SystemStatsProps) {
  const stats = [
    { 
      icon: Cpu, 
      label: 'Processador', 
      value: data.cpu, 
      suffix: '%', 
      threshold: [60, 85],
      description: 'Quanto do "cérebro" do servidor está sendo usado. Abaixo de 60% é ótimo.'
    },
    { 
      icon: HardDrive, 
      label: 'Memória', 
      value: data.memory, 
      suffix: '%', 
      threshold: [70, 90],
      description: 'Espaço temporário de trabalho. Abaixo de 70% é saudável.'
    },
    { 
      icon: Wifi, 
      label: 'Conexões', 
      value: data.connections, 
      suffix: '', 
      threshold: [3000, 5000],
      description: 'Número de pessoas/sistemas conectados simultaneamente.'
    },
    { 
      icon: Zap, 
      label: 'Requisições/s', 
      value: data.requestsPerSecond, 
      suffix: '', 
      threshold: [5000, 8000],
      description: 'Quantas ações o sistema processa por segundo.'
    },
  ];

  return (
    <InfoCard
      title="Recursos do Servidor"
      description="Capacidade da infraestrutura"
      helpText="O servidor é o computador que roda seu sistema na nuvem. Estes números mostram se ele está trabalhando confortavelmente ou se está sobrecarregado. Verde = tranquilo, Amarelo = ficando apertado, Vermelho = precisa de mais capacidade (pode ser hora de fazer upgrade)."
      icon={<Cpu className="w-5 h-5" />}
      delay={delay}
      span={2}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const status = stat.value < stat.threshold[0] ? 'good' : stat.value < stat.threshold[1] ? 'warning' : 'critical';
          const Icon = stat.icon;
          
          return (
            <Tooltip key={stat.label}>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Icon className={cn(
                    'w-6 h-6 mx-auto mb-2',
                    status === 'good' && 'text-success',
                    status === 'warning' && 'text-warning',
                    status === 'critical' && 'text-destructive'
                  )} />
                  <div className={cn(
                    'text-2xl font-bold font-mono',
                    status === 'good' && 'text-success',
                    status === 'warning' && 'text-warning',
                    status === 'critical' && 'text-destructive'
                  )}>
                    {stat.value.toLocaleString()}{stat.suffix}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{stat.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                <div className="mt-2 pt-2 border-t border-border text-xs">
                  <p className="text-success">🟢 Bom: abaixo de {stat.threshold[0]}{stat.suffix}</p>
                  <p className="text-warning">🟡 Atenção: {stat.threshold[0]}-{stat.threshold[1]}{stat.suffix}</p>
                  <p className="text-destructive">🔴 Crítico: acima de {stat.threshold[1]}{stat.suffix}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </InfoCard>
  );
}
