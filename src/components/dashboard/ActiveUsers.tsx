import { Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { InfoCard } from './InfoCard';
import type { ActiveUsersData } from '@/types/dashboard';

interface ActiveUsersProps {
  data: ActiveUsersData;
  delay?: number;
}

export function ActiveUsers({ data, delay = 0 }: ActiveUsersProps) {
  const isGrowing = data.trend > 0;

  return (
    <InfoCard
      title="Usuários Online Agora"
      description="Pessoas usando o sistema neste momento"
      helpText="Este número mostra quantas pessoas estão conectadas ao seu sistema agora. Quanto mais alto, mais seu negócio está sendo usado! A seta verde (↑) significa que está crescendo, vermelha (↓) significa que está diminuindo em relação à última hora."
      icon={<Users className="w-5 h-5" />}
      delay={delay}
    >
      <div className="flex items-end justify-between">
        <div>
          <span className="font-mono text-4xl font-bold text-foreground">
            {data.current.toLocaleString()}
          </span>
          <div className="flex items-center gap-2 mt-2">
            {isGrowing ? (
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+{data.trend.toFixed(1)}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-destructive">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">{data.trend.toFixed(1)}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">vs. última hora</span>
          </div>
        </div>
        
        {/* Mini Chart */}
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history.slice(-12)}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(262, 83%, 58%)" 
                strokeWidth={2} 
                fill="url(#usersGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Peak Info */}
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          Recorde hoje: <span className="font-medium text-foreground">{data.peak.toLocaleString()}</span> pessoas às {data.peakTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </InfoCard>
  );
}
