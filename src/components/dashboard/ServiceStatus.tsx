import { Server, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { cn } from '@/lib/utils';
import type { ServiceHealth, ServiceStatus } from '@/types/dashboard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ServiceStatusProps {
  services: ServiceHealth[];
  delay?: number;
}

const statusInfo: Record<ServiceStatus, { icon: typeof CheckCircle; color: string; label: string; description: string }> = {
  online: { 
    icon: CheckCircle, 
    color: 'text-success', 
    label: 'Funcionando',
    description: 'Este serviço está operando normalmente'
  },
  warning: { 
    icon: AlertCircle, 
    color: 'text-warning', 
    label: 'Com Lentidão',
    description: 'Este serviço está mais lento que o normal'
  },
  error: { 
    icon: XCircle, 
    color: 'text-destructive', 
    label: 'Com Problema',
    description: 'Este serviço está apresentando falhas'
  },
  offline: { 
    icon: XCircle, 
    color: 'text-muted-foreground', 
    label: 'Fora do Ar',
    description: 'Este serviço não está respondendo'
  },
};

const serviceDescriptions: Record<string, string> = {
  'database': 'Onde todos os dados dos seus clientes ficam guardados',
  'api-whatsapp': 'Conexão com WhatsApp para envio de mensagens',
  'message-queue': 'Fila de mensagens aguardando para serem enviadas',
  'integrations': 'Conexões com outros sistemas (Zapier, etc)',
  'storage': 'Armazenamento de arquivos e imagens',
  'ai-engine': 'Motor de inteligência artificial',
};

export function ServiceStatus({ services, delay = 0 }: ServiceStatusProps) {
  const onlineCount = services.filter(s => s.status === 'online').length;
  const hasIssues = services.some(s => s.status !== 'online');

  return (
    <InfoCard
      title="Serviços do Sistema"
      description={`${onlineCount} de ${services.length} serviços funcionando`}
      helpText="Estes são os serviços que fazem seu sistema funcionar. Pense neles como os 'motores' do seu negócio. Verde = funcionando bem. Amarelo = funcionando mas com lentidão. Vermelho = com problemas. Se algum ficar vermelho, sua equipe técnica precisa ser avisada."
      icon={<Server className="w-5 h-5" />}
      delay={delay}
      span={2}
    >
      {/* Summary */}
      <div className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg mb-4',
        hasIssues ? 'bg-warning/10' : 'bg-success/10'
      )}>
        {hasIssues ? (
          <>
            <AlertCircle className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-warning">
              Alguns serviços precisam de atenção
            </span>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-success">
              Todos os serviços funcionando perfeitamente!
            </span>
          </>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((service) => {
          const info = statusInfo[service.status];
          const Icon = info.icon;
          
          return (
            <Tooltip key={service.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    'bg-muted/30 border border-border',
                    'hover:bg-muted/50 transition-colors cursor-pointer'
                  )}
                >
                  <Icon className={cn('w-5 h-5 shrink-0', info.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {service.name}
                    </p>
                    <p className={cn('text-xs', info.color)}>
                      {info.label}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {serviceDescriptions[service.id] || info.description}
                </p>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border text-xs">
                  <span className="text-muted-foreground">
                    Disponibilidade: <span className="font-mono font-medium text-foreground">{service.uptime}%</span>
                  </span>
                  {service.latency && (
                    <span className="text-muted-foreground">
                      Velocidade: <span className="font-mono font-medium text-foreground">{service.latency}ms</span>
                    </span>
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
