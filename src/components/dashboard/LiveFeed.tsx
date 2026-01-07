import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Pause, Play, HelpCircle } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LogEntry } from '@/types/dashboard';

interface LiveFeedProps {
  logs: LogEntry[];
  delay?: number;
}

const typeLabels = {
  info: { label: 'Info', color: 'bg-info/10 text-info', description: 'Informação normal do sistema' },
  warning: { label: 'Aviso', color: 'bg-warning/10 text-warning', description: 'Algo que merece atenção' },
  error: { label: 'Erro', color: 'bg-destructive/10 text-destructive', description: 'Algo deu errado' },
  success: { label: 'OK', color: 'bg-success/10 text-success', description: 'Ação completada com sucesso' },
  debug: { label: 'Debug', color: 'bg-muted text-muted-foreground', description: 'Informação técnica' },
};

export function LiveFeed({ logs, delay = 0 }: LiveFeedProps) {
  const [paused, setPaused] = useState(false);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>(logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paused) {
      setDisplayedLogs(logs);
    }
  }, [logs, paused]);

  useEffect(() => {
    if (scrollRef.current && !paused) {
      scrollRef.current.scrollTop = 0;
    }
  }, [displayedLogs, paused]);

  return (
    <InfoCard
      title="Atividade em Tempo Real"
      description="O que está acontecendo agora no sistema"
      helpText="Este é um 'diário' do sistema que mostra tudo que está acontecendo: usuários entrando, mensagens sendo enviadas, pagamentos processados, etc. É útil para sua equipe técnica identificar problemas rapidamente. Você pode pausar para ler com calma."
      icon={<ScrollText className="w-5 h-5" />}
      delay={delay}
      span={2}
    >
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {!paused ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="status-dot status-dot-success" />
              <span className="text-success font-medium">Ao vivo</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pause className="w-4 h-4" />
              Pausado
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaused(!paused)}
          className="h-8"
        >
          {paused ? (
            <>
              <Play className="h-4 w-4 mr-1" />
              Continuar
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </>
          )}
        </Button>
      </div>

      {/* Log List */}
      <div
        ref={scrollRef}
        className="h-[280px] overflow-y-auto custom-scrollbar space-y-2 pr-2"
      >
        <AnimatePresence mode="popLayout">
          {displayedLogs.slice(0, 25).map((log) => {
            const typeInfo = typeLabels[log.type];
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">
                  {log.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium shrink-0',
                  typeInfo.color
                )}>
                  {typeInfo.label}
                </span>
                <span className="text-sm text-foreground flex-1">
                  {log.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 flex-wrap text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Legenda:
        </span>
        {Object.entries(typeLabels).slice(0, 4).map(([key, info]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={cn('px-1.5 py-0.5 rounded', info.color)}>{info.label}</span>
          </span>
        ))}
      </div>
    </InfoCard>
  );
}
