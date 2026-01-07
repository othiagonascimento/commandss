import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Pause, Play, Filter } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LogEntry } from '@/types/dashboard';

interface LiveFeedProps {
  logs: LogEntry[];
  delay?: number;
}

const typeColors = {
  info: 'text-neon-cyan',
  warning: 'text-neon-yellow',
  error: 'text-neon-magenta',
  success: 'text-neon-green',
  debug: 'text-neon-purple',
};

const typeBadgeColors = {
  info: 'bg-neon-cyan/20 text-neon-cyan',
  warning: 'bg-neon-yellow/20 text-neon-yellow',
  error: 'bg-neon-magenta/20 text-neon-magenta',
  success: 'bg-neon-green/20 text-neon-green',
  debug: 'bg-neon-purple/20 text-neon-purple',
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
    <GlassCard span={2} rowSpan={2} delay={delay} glowColor="accent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-semibold">Live Feed</h3>
          {!paused && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-neon-green font-mono">LIVE</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPaused(!paused)}
          >
            {paused ? (
              <Play className="h-4 w-4 text-neon-green" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[240px] lg:h-[320px] overflow-y-auto custom-scrollbar space-y-1 font-mono text-xs"
      >
        <AnimatePresence mode="popLayout">
          {displayedLogs.slice(0, 30).map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 p-2 rounded hover:bg-muted/30 transition-colors"
            >
              <span className="text-muted-foreground shrink-0 w-[70px]">
                {log.timestamp.toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold shrink-0',
                typeBadgeColors[log.type]
              )}>
                {log.type}
              </span>
              {log.source && (
                <span className="text-muted-foreground shrink-0">
                  [{log.source}]
                </span>
              )}
              <span className={cn('flex-1', typeColors[log.type])}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
