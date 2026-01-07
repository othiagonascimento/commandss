import { Mail, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { cn } from '@/lib/utils';
import type { QueueMetrics } from '@/types/dashboard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QueueStatusProps {
  queues: QueueMetrics[];
  delay?: number;
}

const queueDescriptions: Record<string, string> = {
  'Messages': 'Mensagens de WhatsApp aguardando envio',
  'Emails': 'Emails que serão enviados aos clientes',
  'Webhooks': 'Notificações para outros sistemas',
};

export function QueueStatus({ queues, delay = 0 }: QueueStatusProps) {
  const totalPending = queues.reduce((sum, q) => sum + q.pending, 0);

  return (
    <InfoCard
      title="Fila de Mensagens"
      description={`${totalPending.toLocaleString()} mensagens aguardando envio`}
      helpText="Quando um cliente faz uma ação (como uma compra), o sistema coloca as mensagens numa fila para serem enviadas. Este painel mostra quantas mensagens estão esperando. Se a barra ficar grande e vermelha, significa que as mensagens estão demorando para sair - pode ser um problema."
      icon={<Mail className="w-5 h-5" />}
      delay={delay}
      span={2}
    >
      <div className="space-y-4">
        {queues.map((queue) => {
          const health = queue.pending < 500 ? 'good' : queue.pending < 2000 ? 'warning' : 'critical';
          const percentage = Math.min(100, (queue.pending / 3000) * 100);
          
          return (
            <Tooltip key={queue.name}>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{queue.name}</span>
                      {health === 'critical' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      {health === 'good' && (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono font-medium">
                        {queue.pending.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        pendentes
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        health === 'good' && 'bg-success',
                        health === 'warning' && 'bg-warning',
                        health === 'critical' && 'bg-destructive animate-pulse'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {queue.processingRate}/min sendo enviadas
                    </span>
                    <span>
                      {queue.failed > 0 && (
                        <span className="text-destructive">{queue.failed} falharam</span>
                      )}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{queue.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {queueDescriptions[queue.name] || 'Fila de processamento'}
                </p>
                <div className="mt-2 pt-2 border-t border-border text-xs space-y-1">
                  <p>✅ Processadas hoje: {queue.processed.toLocaleString()}</p>
                  <p>⏱️ Tempo médio: {queue.avgProcessingTime}ms por mensagem</p>
                  {queue.failed > 0 && (
                    <p className="text-destructive">❌ Falhas: {queue.failed}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </InfoCard>
  );
}
