import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Save, 
  Trash2, 
  Loader2,
  Infinity,
  Cpu,
  HardDrive,
  MessageSquare,
  Code,
  Bot,
  Mic,
  Send,
  Workflow,
} from 'lucide-react';
import { UserLimitsDetail, UserLimitsPayload } from '@/services/masterApi';
import { cn } from '@/lib/utils';

interface UserLimitsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  limitsDetail: UserLimitsDetail | null;
  isLoading?: boolean;
  onSave: (data: UserLimitsPayload) => void;
  onRemove: () => void;
}

export function UserLimitsModal({
  open,
  onOpenChange,
  user,
  limitsDetail,
  isLoading,
  onSave,
  onRemove,
}: UserLimitsModalProps) {
  const [limits, setLimits] = useState<UserLimitsPayload['limits']>({
    ai_tokens_monthly: limitsDetail?.limits?.ai_tokens_monthly ?? null,
    storage_mb: limitsDetail?.limits?.storage_mb ?? null,
    messages_monthly: limitsDetail?.limits?.messages_monthly ?? null,
    api_calls_monthly: limitsDetail?.limits?.api_calls_monthly ?? null,
  });

  const [permissions, setPermissions] = useState<UserLimitsPayload['permissions']>({
    can_use_ai: limitsDetail?.limits?.can_use_ai ?? null,
    can_transcribe: limitsDetail?.limits?.can_transcribe ?? null,
    can_use_api: limitsDetail?.limits?.can_use_api ?? null,
    can_send_campaigns: limitsDetail?.limits?.can_send_campaigns ?? null,
    can_manage_automations: limitsDetail?.limits?.can_manage_automations ?? null,
  });

  const [reason, setReason] = useState('');

  const hasCustomLimits = limitsDetail?.has_custom_limits;
  const usage = limitsDetail?.usage;
  const tenantLimits = limitsDetail?.tenant_limits;

  const handleLimitChange = (key: keyof NonNullable<UserLimitsPayload['limits']>, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setLimits({ ...limits, [key]: numValue });
  };

  const handlePermissionChange = (key: keyof NonNullable<UserLimitsPayload['permissions']>, value: boolean | null) => {
    setPermissions({ ...permissions, [key]: value });
  };

  const handleSave = () => {
    onSave({ limits, permissions, reason: reason || undefined });
  };

  // Get per-user defaults from tenant
  const creditsPerUser = tenantLimits?.credits_per_user ?? 500;
  const storageMbPerUser = tenantLimits?.storage_mb_per_user ?? 100;

  const limitFields = [
    { 
      key: 'ai_tokens_monthly', 
      label: 'Créditos IA/mês', 
      icon: Cpu,
      tenantValue: creditsPerUser, // Now uses per-user default
      usageValue: usage?.ai_tokens_month,
      format: (v: number) => v.toLocaleString('pt-BR'),
      description: 'Cota mensal de créditos de IA para este usuário',
    },
    { 
      key: 'storage_mb', 
      label: 'Storage (MB)', 
      icon: HardDrive,
      tenantValue: storageMbPerUser, // Now uses per-user default
      usageValue: usage?.storage_bytes ? Math.round(usage.storage_bytes / 1048576) : 0,
      format: (v: number) => v >= 1024 ? `${(v/1024).toFixed(1)} GB` : `${v} MB`,
      description: 'Limite de armazenamento para este usuário',
    },
    { 
      key: 'messages_monthly', 
      label: 'Mensagens/mês', 
      icon: MessageSquare,
      tenantValue: null,
      usageValue: usage?.messages_sent_month,
      format: (v: number) => v.toLocaleString(),
      description: 'Limite de mensagens mensais',
    },
    { 
      key: 'api_calls_monthly', 
      label: 'Chamadas API/mês', 
      icon: Code,
      tenantValue: null,
      usageValue: usage?.api_calls_month,
      format: (v: number) => v.toLocaleString(),
      description: 'Limite de chamadas à API por mês',
    },
  ];

  const permissionFields = [
    { key: 'can_use_ai', label: 'Pode usar IA', icon: Bot },
    { key: 'can_transcribe', label: 'Pode transcrever áudios', icon: Mic },
    { key: 'can_use_api', label: 'Pode usar API', icon: Code },
    { key: 'can_send_campaigns', label: 'Pode enviar campanhas', icon: Send },
    { key: 'can_manage_automations', label: 'Pode gerenciar automações', icon: Workflow },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Limites do Usuário</DialogTitle>
          <DialogDescription>
            Configure limites e permissões individuais para{' '}
            <span className="font-medium">{user?.name}</span>
            <span className="text-muted-foreground"> ({user?.email})</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {hasCustomLimits ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Limites Customizados
                </Badge>
              ) : (
                <Badge variant="outline">
                  Usando Limites do Tenant
                </Badge>
              )}
            </div>

            {/* Limits section */}
            <div className="space-y-4">
              <h4 className="font-medium">Limites de Recursos (Por Usuário)</h4>
              <p className="text-sm text-muted-foreground">
                Cada usuário tem sua própria cota. Deixe em branco para usar o padrão do tenant.
              </p>

              <div className="space-y-4">
                {limitFields.map((field) => {
                  const Icon = field.icon;
                  const currentValue = limits[field.key as keyof typeof limits];
                  const isInherited = currentValue === null;
                  const effectiveLimit = isInherited ? field.tenantValue : currentValue;
                  const usagePercent = effectiveLimit && field.usageValue 
                    ? Math.round((field.usageValue / effectiveLimit) * 100)
                    : 0;

                  return (
                    <div key={field.key} className="space-y-2 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <Label className="font-medium">{field.label}</Label>
                        </div>
                        {isInherited && field.tenantValue && (
                          <Badge variant="outline" className="text-xs bg-primary/5 text-primary">
                            Padrão: {field.format(field.tenantValue)}/usuário
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={field.tenantValue ? `Herdar: ${field.format(field.tenantValue)}` : 'Ilimitado'}
                          value={currentValue ?? ''}
                          onChange={(e) => handleLimitChange(field.key as keyof typeof limits, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleLimitChange(field.key as keyof typeof limits, '')}
                          title="Usar limite do tenant"
                        >
                          <Infinity className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Usage progress */}
                      {field.usageValue !== undefined && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Uso atual: {field.format(field.usageValue)}</span>
                          {effectiveLimit && (
                            <>
                              <Progress 
                                value={Math.min(usagePercent, 100)} 
                                className={cn("flex-1 h-1", usagePercent > 80 && "bg-amber-100")}
                              />
                              <span>({usagePercent}%)</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Permissions section */}
            <div className="space-y-4">
              <h4 className="font-medium">Permissões</h4>
              <p className="text-sm text-muted-foreground">
                Ative/desative funcionalidades específicas
              </p>

              <div className="space-y-3">
                {permissionFields.map((field) => {
                  const Icon = field.icon;
                  const currentValue = permissions[field.key as keyof typeof permissions];
                  const isEnabled = currentValue ?? true; // Default to true if null

                  return (
                    <div 
                      key={field.key} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isEnabled ? 'border-primary/30 bg-primary/5' : ''
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4 h-4", isEnabled ? 'text-primary' : 'text-muted-foreground')} />
                        <Label className="cursor-pointer">{field.label}</Label>
                        {currentValue === null && (
                          <Badge variant="outline" className="text-xs">Herda</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermissionChange(field.key as keyof typeof permissions, null)}
                          className="text-xs h-7"
                        >
                          Reset
                        </Button>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handlePermissionChange(field.key as keyof typeof permissions, checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motivo da configuração</Label>
              <Textarea
                placeholder="Ex: Usuário com acesso restrito, Período de teste, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasCustomLimits && (
            <Button variant="destructive" onClick={onRemove} disabled={isLoading} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Remover Limites
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
