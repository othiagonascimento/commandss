import { AlertTriangle, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { cn } from '@/lib/utils';
import type { ErrorZone } from '@/types/dashboard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ErrorHeatmapProps {
  errors: ErrorZone[];
  delay?: number;
}

const severityInfo = {
  low: { 
    bg: 'bg-info/10', 
    border: 'border-info/30', 
    text: 'text-info',
    label: 'Baixo',
    description: 'Poucos erros, nada preocupante'
  },
  medium: { 
    bg: 'bg-warning/10', 
    border: 'border-warning/30', 
    text: 'text-warning',
    label: 'Médio',
    description: 'Alguns erros, vale acompanhar'
  },
  high: { 
    bg: 'bg-destructive/10', 
    border: 'border-destructive/30', 
    text: 'text-destructive',
    label: 'Alto',
    description: 'Muitos erros, precisa de atenção'
  },
  critical: { 
    bg: 'bg-destructive/20', 
    border: 'border-destructive/50', 
    text: 'text-destructive',
    label: 'Crítico',
    description: 'Urgente! Pode estar afetando usuários'
  },
};

const categoryLabels: Record<string, string> = {
  authentication: 'Problemas de Login',
  api: 'Comunicação com Servidores',
  database: 'Banco de Dados',
  integration: 'Integrações Externas',
  general: 'Erros Gerais',
};

export function ErrorHeatmap({ errors, delay = 0 }: ErrorHeatmapProps) {
  const sortedErrors = [...errors].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const totalErrors = errors.reduce((sum, e) => sum + e.errorCount, 0);

  return (
    <InfoCard
      title="Mapa de Problemas"
      description={`${totalErrors} erros detectados nas últimas horas`}
      helpText="Este painel mostra onde estão acontecendo problemas no seu sistema. Cada quadrado representa uma área diferente. Vermelho = precisa de atenção urgente. Amarelo = fique de olho. Azul = está tudo bem. Os números mostram quantos erros aconteceram e se estão aumentando (↑) ou diminuindo (↓)."
      icon={<AlertTriangle className="w-5 h-5" />}
      delay={delay}
      span={2}
    >
      <div className="grid grid-cols-2 gap-3">
        {sortedErrors.map((error) => {
          const info = severityInfo[error.severity];
          return (
            <Tooltip key={error.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer',
                    'transition-all duration-200 hover:shadow-md',
                    info.bg,
                    info.border
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-foreground block">
                        {categoryLabels[error.category] || error.name}
                      </span>
                      <span className={cn('text-xs', info.text)}>
                        {info.label}
                      </span>
                    </div>
                    <span className="font-mono text-2xl font-bold text-foreground">
                      {error.errorCount}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {error.trend > 0 ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          Subindo {error.trend}%
                        </span>
                      </div>
                    ) : error.trend < 0 ? (
                      <div className="flex items-center gap-1 text-success">
                        <TrendingDown className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          Caindo {Math.abs(error.trend)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Estável</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{categoryLabels[error.category]}</p>
                <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Último erro: {error.lastOccurrence.toLocaleTimeString()}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Help text at bottom */}
      <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong>Dica:</strong> Se você vir muitos erros de "Problemas de Login" subindo, 
          pode significar que usuários estão tendo dificuldade para acessar o sistema.
        </p>
      </div>
    </InfoCard>
  );
}
