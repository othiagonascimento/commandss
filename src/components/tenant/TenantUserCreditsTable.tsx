import { useState } from 'react';
import { useUserCredits, UserCreditData } from '@/hooks/useUserCredits';
import { useTenantCreditsFull } from '@/hooks/credits/useCredits';
import { PeriodFilter, PeriodFilterValue, getDefaultPeriod } from '@/components/ui/period-filter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  Coins,
  Brain,
  Zap,
  Mic,
  AlertCircle,
  TrendingUp,
  Settings2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RechargeModal } from './RechargeModal';
import { UserCreditOverrideModal } from './UserCreditOverrideModal';

interface TenantUserCreditsTableProps {
  tenantId: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedor',
};

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  manager: 'bg-warning/10 text-warning border-warning/20',
  seller: 'bg-muted text-muted-foreground border-border',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString('pt-BR');
}

import { useTenantUserBalances } from '@/hooks/credits/useCredits';

export function TenantUserCreditsTable({ tenantId }: TenantUserCreditsTableProps) {
  const [period, setPeriod] = useState<PeriodFilterValue>(getDefaultPeriod());
  const [rechargeTarget, setRechargeTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<{ userId: string; userName: string } | null>(null);

  // Fonte canônica do CRM: list_tenant_user_credit_balances (RPC)
  const { data: balances, isLoading, error } = useTenantUserBalances(tenantId);
  const { data: creditsFull } = useTenantCreditsFull(tenantId);
  const tenantBase = creditsFull?.per_user_base ?? 500;

  const users = (balances || []).map((b) => ({
    user_id: b.user_id,
    user_name: b.full_name || b.email || 'Usuário',
    user_role: b.role || 'seller',
    credits_consumed: b.used_credits,
    ai_tokens: b.used_credits,
    api_calls: 0,
    transcription_minutes: 0,
    base_credits: b.base_credits,
    extra_credits: b.extra_credits,
    remaining_credits: b.remaining_credits,
    suspicious_credits: b.suspicious_credits,
    is_active: b.is_active !== false,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar consumo por usuário</p>
        </CardContent>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Consumo por Usuário
              </CardTitle>
              <CardDescription>Nenhum usuário com consumo registrado neste período</CardDescription>
            </div>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Sem dados de consumo disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals and max for progress bars
  const totalCredits = users.reduce((sum, u) => sum + u.credits_consumed, 0);
  const maxCredits = Math.max(...users.map((u) => u.credits_consumed), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Consumo por Usuário
            </CardTitle>
            <CardDescription>
              {users.length} usuário{users.length !== 1 ? 's' : ''} com consumo • Total: {formatNumber(totalCredits)} créditos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <PeriodFilter value={period} onChange={setPeriod} />
            <Badge variant="outline" className="font-mono hidden sm:flex">
              <TrendingUp className="h-3 w-3 mr-1" />
              {formatNumber(totalCredits)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Usuário</TableHead>
                <TableHead className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 justify-end">
                        <Coins className="h-4 w-4" />
                        Créditos
                      </TooltipTrigger>
                      <TooltipContent>Créditos de IA consumidos no período</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 justify-end">
                        <Brain className="h-4 w-4" />
                        Tokens
                      </TooltipTrigger>
                      <TooltipContent>Tokens de IA processados</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 justify-end">
                        <Zap className="h-4 w-4" />
                        API
                      </TooltipTrigger>
                      <TooltipContent>Chamadas de API realizadas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 justify-end">
                        <Mic className="h-4 w-4" />
                        Transc.
                      </TooltipTrigger>
                      <TooltipContent>Minutos de transcrição de áudio</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="w-[120px] hidden sm:table-cell">Proporção</TableHead>
                <TableHead className="w-[180px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => {
                const proportion = totalCredits > 0 
                  ? (user.credits_consumed / totalCredits) * 100 
                  : 0;
                const barWidth = (user.credits_consumed / maxCredits) * 100;

                return (
                  <TableRow key={user.user_id} className={cn(index === 0 && "bg-primary/5")}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(user.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {user.user_name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5 py-0 w-fit", roleColors[user.user_role])}
                          >
                            {roleLabels[user.user_role] || user.user_role}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatNumber(user.credits_consumed)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground hidden md:table-cell">
                      {formatNumber(user.ai_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground hidden lg:table-cell">
                      {formatNumber(user.api_calls)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground hidden lg:table-cell">
                      {user.transcription_minutes}min
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={barWidth}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                          {proportion.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setOverrideTarget({ userId: user.user_id, userName: user.user_name })}
                        >
                          <Settings2 className="h-3 w-3 mr-1" />
                          Override
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setRechargeTarget({ userId: user.user_id, userName: user.user_name })}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Recarregar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {rechargeTarget && (
        <RechargeModal
          open={!!rechargeTarget}
          onOpenChange={(v) => { if (!v) setRechargeTarget(null); }}
          tenantId={tenantId}
          tenantName=""
          userId={rechargeTarget.userId}
          userName={rechargeTarget.userName}
          defaultScope="user"
        />
      )}

      {overrideTarget && (
        <UserCreditOverrideModal
          open={!!overrideTarget}
          onOpenChange={(v) => { if (!v) setOverrideTarget(null); }}
          tenantId={tenantId}
          userId={overrideTarget.userId}
          userName={overrideTarget.userName}
          currentBase={tenantBase}
          tenantBase={tenantBase}
        />
      )}
    </Card>
  );
}
