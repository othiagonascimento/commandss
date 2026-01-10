import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  Package, 
  Smartphone, 
  Cpu, 
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Infinity,
  Database,
  Cloud,
} from 'lucide-react';
import { TenantUsageDetail } from '@/services/masterApi';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TenantUsageProgressProps {
  usage: TenantUsageDetail | null;
  isLoading?: boolean;
  onRecalculate?: () => void;
}

const usageConfig = [
  { key: 'users', label: 'Usuários', icon: Users, format: (v: number) => v.toLocaleString() },
  { key: 'leads', label: 'Leads', icon: Target, format: (v: number) => v.toLocaleString() },
  { key: 'products', label: 'Produtos', icon: Package, format: (v: number) => v.toLocaleString() },
  { key: 'whatsapp_instances', label: 'WhatsApp', icon: Smartphone, format: (v: number) => v.toLocaleString() },
  { key: 'ai_tokens', label: 'Créditos IA', icon: Cpu, format: (v: number) => v.toLocaleString('pt-BR') },
  { key: 'storage_mb', label: 'Storage', icon: HardDrive, format: (v: number) => v >= 1024 ? `${(v/1024).toFixed(1)} GB` : `${v} MB` },
] as const;

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-destructive';
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-amber-500';
  return 'bg-primary';
}

function getStatusIcon(percentage: number) {
  if (percentage >= 100) return <AlertTriangle className="w-4 h-4 text-destructive" />;
  if (percentage >= 90) return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (percentage >= 70) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <CheckCircle2 className="w-4 h-4 text-success" />;
}

function getStatusBadge(percentage: number, limit: number) {
  if (limit === -1) {
    return (
      <Badge variant="outline" className="gap-1">
        <Infinity className="w-3 h-3" />
        Ilimitado
      </Badge>
    );
  }
  if (percentage >= 100) {
    return <Badge variant="destructive">Limite Excedido</Badge>;
  }
  if (percentage >= 90) {
    return <Badge variant="destructive" className="bg-red-500">90%+ Usado</Badge>;
  }
  if (percentage >= 70) {
    return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">70%+ Usado</Badge>;
  }
  return <Badge variant="secondary" className="text-success">OK</Badge>;
}

export function TenantUsageProgress({ usage, isLoading, onRecalculate }: TenantUsageProgressProps) {
  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consumo Atual</CardTitle>
          <CardDescription>Carregando dados de consumo...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageConfig.map((config) => (
              <div key={config.key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{config.label}</span>
                  <span>--</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = usage.alerts && usage.alerts.length > 0;
  const dataSource = (usage as TenantUsageDetail & { data_source?: string }).data_source;

  return (
    <TooltipProvider>
      <Card className={cn(hasAlerts && 'border-amber-500/50')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {hasAlerts ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                )}
                Consumo Atual
                {dataSource && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 gap-1 text-xs">
                        {dataSource === 'remote' ? (
                          <>
                            <Cloud className="w-3 h-3" />
                            Remoto
                          </>
                        ) : (
                          <>
                            <Database className="w-3 h-3" />
                            Local
                          </>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dataSource === 'remote' 
                        ? 'Dados obtidos do sistema remoto (fonte real)'
                        : 'Dados obtidos do banco local (pode estar desatualizado)'
                      }
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <CardDescription>
                Uso de recursos vs limites configurados
                {usage.last_calculated_at && (
                  <span className="block text-xs mt-1">
                    Última atualização: {new Date(usage.last_calculated_at).toLocaleString('pt-BR')}
                  </span>
                )}
              </CardDescription>
            </div>
            {onRecalculate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onRecalculate} disabled={isLoading}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                    Recalcular
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Buscar dados atualizados do sistema
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {usageConfig.map((config) => {
            const used = usage.usage[config.key as keyof typeof usage.usage] || 0;
            const limit = usage.limits[config.key as keyof typeof usage.limits] || 0;
            const percentage = usage.percentages[config.key as keyof typeof usage.percentages] || 0;
            const isUnlimited = limit === -1;
            const Icon = config.icon;
            
            return (
              <div key={config.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(isUnlimited ? 0 : percentage)}
                    {getStatusBadge(percentage, limit)}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Progress 
                        value={isUnlimited ? 0 : Math.min(percentage, 100)} 
                        className="h-3"
                      />
                      <div 
                        className={cn(
                          "absolute inset-0 h-3 rounded-full transition-all",
                          getProgressColor(percentage)
                        )}
                        style={{ width: `${Math.min(isUnlimited ? 0 : percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-right min-w-[100px]">
                    <span className="font-medium">{config.format(used)}</span>
                    <span className="text-muted-foreground">
                      {' / '}
                      {isUnlimited ? (
                        <span className="inline-flex items-center gap-1">
                          <Infinity className="w-3 h-3" />
                        </span>
                      ) : (
                        config.format(limit)
                      )}
                    </span>
                    {!isUnlimited && (
                      <span className="text-muted-foreground ml-1">
                        ({percentage}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Alerts section */}
          {hasAlerts && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-amber-600 mb-2">Alertas Ativos:</p>
              <div className="flex flex-wrap gap-2">
                {usage.alerts.map((alert) => (
                  <Badge key={alert} variant="outline" className="border-amber-500 text-amber-600">
                    {alert.replace(/_/g, ' ').replace(/percent/g, '%')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
