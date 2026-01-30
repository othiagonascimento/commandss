import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Target, 
  Package, 
  Smartphone, 
  Cpu, 
  HardDrive,
  Infinity,
  Settings2,
  AlertTriangle,
  UserCircle,
  Building2,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface TenantLimitsEditorProps {
  limits: {
    limit_users: number;
    limit_leads: number;
    limit_products: number;
    limit_whatsapp_instances: number;
    limit_ai_tokens_monthly: number;
    limit_storage_mb: number;
    credits_per_user?: number;
    storage_mb_per_user?: number;
  };
  onChange: (limits: TenantLimitsEditorProps['limits']) => void;
  disabled?: boolean;
  usersCount?: number;
}

interface LimitConfig {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  unit: string;
  presets: number[];
  formatValue?: (v: number) => string;
  category: 'tenant' | 'per_user';
}

const limitConfig: LimitConfig[] = [
  // Tenant-level limits (counted per tenant)
  {
    key: 'limit_users',
    label: 'Máx. Usuários',
    description: 'Número máximo de usuários permitidos no tenant',
    icon: Users,
    unit: 'usuários',
    presets: [5, 10, 25, 50, 100],
    category: 'tenant',
  },
  {
    key: 'limit_leads',
    label: 'Máx. Leads',
    description: 'Número máximo de leads/contatos no tenant',
    icon: Target,
    unit: 'leads',
    presets: [1000, 5000, 10000, 50000, 100000],
    category: 'tenant',
  },
  {
    key: 'limit_products',
    label: 'Máx. Produtos',
    description: 'Número máximo de produtos no catálogo do tenant',
    icon: Package,
    unit: 'produtos',
    presets: [100, 500, 1000, 5000, 10000],
    category: 'tenant',
  },
  {
    key: 'limit_whatsapp_instances',
    label: 'Instâncias WhatsApp',
    description: 'Número de conexões WhatsApp permitidas para o tenant',
    icon: Smartphone,
    unit: 'instâncias',
    presets: [1, 2, 5, 10],
    category: 'tenant',
  },
  // Per-user limits (quota per user)
  {
    key: 'credits_per_user',
    label: 'Créditos IA por Usuário',
    description: 'Cota mensal de créditos de IA para cada usuário (500 créditos ≈ 1.25M tokens)',
    icon: Cpu,
    unit: 'créditos/usuário',
    presets: [100, 250, 500, 1000, 2500],
    formatValue: (v: number) => v.toLocaleString('pt-BR'),
    category: 'per_user',
  },
  {
    key: 'storage_mb_per_user',
    label: 'Storage por Usuário',
    description: 'Limite de armazenamento em MB para cada usuário',
    icon: HardDrive,
    unit: 'MB/usuário',
    presets: [50, 100, 250, 500, 1024],
    formatValue: (v: number) => v >= 1024 ? `${(v/1024).toFixed(1)} GB` : `${v} MB`,
    category: 'per_user',
  },
];

// NOTE: credits_per_user and storage_mb_per_user are independent fields
// limit_ai_tokens_monthly is a legacy field that should NOT be synced with credits

export function TenantLimitsEditor({ limits, onChange, disabled, usersCount = 0 }: TenantLimitsEditorProps) {
  const [localLimits, setLocalLimits] = useState(() => ({
    ...limits,
    credits_per_user: limits.credits_per_user ?? 500,
    storage_mb_per_user: limits.storage_mb_per_user ?? 100,
  }));

  useEffect(() => {
    setLocalLimits({
      ...limits,
      credits_per_user: limits.credits_per_user ?? 500,
      storage_mb_per_user: limits.storage_mb_per_user ?? 100,
    });
  }, [limits]);

  const handleChange = (key: keyof typeof localLimits, value: number) => {
    const updated = { ...localLimits, [key]: value };
    // Credits and tokens are independent - no cross-syncing
    setLocalLimits(updated);
    onChange(updated);
  };

  const handleInputChange = (key: keyof typeof localLimits, inputValue: string) => {
    const value = inputValue === '' ? 0 : parseInt(inputValue, 10);
    if (!isNaN(value) && value >= -1) {
      handleChange(key, value);
    }
  };

  const setUnlimited = (key: keyof typeof localLimits) => {
    handleChange(key, -1);
  };

  const tenantLimits = limitConfig.filter(c => c.category === 'tenant');
  const perUserLimits = limitConfig.filter(c => c.category === 'per_user');

  // Calculate totals for preview
  const effectiveUsers = Math.max(usersCount, localLimits.limit_users > 0 ? Math.min(usersCount, localLimits.limit_users) : usersCount);
  const totalCredits = (localLimits.credits_per_user || 500) * effectiveUsers;
  const totalStorage = (localLimits.storage_mb_per_user || 100) * effectiveUsers;

  const renderLimitField = (config: LimitConfig) => {
    const Icon = config.icon;
    const currentValue = localLimits[config.key as keyof typeof localLimits] as number;
    const isUnlimited = currentValue === -1;
    
    return (
      <div key={config.key} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">{config.label}</Label>
            <HelpTooltip description={config.description} />
          </div>
          {isUnlimited && (
            <Badge variant="secondary" className="gap-1">
              <Infinity className="w-3 h-3" />
              Ilimitado
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              value={currentValue === -1 ? '' : currentValue}
              onChange={(e) => handleInputChange(config.key as keyof typeof localLimits, e.target.value)}
              placeholder="Ilimitado"
              disabled={disabled}
              min={-1}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant={isUnlimited ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setUnlimited(config.key as keyof typeof localLimits)}
            disabled={disabled}
            className="gap-1"
          >
            <Infinity className="w-3 h-3" />
            <span className="hidden sm:inline">Ilimitado</span>
          </Button>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2">
          {config.presets.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={currentValue === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChange(config.key as keyof typeof localLimits, preset)}
              disabled={disabled}
              className="text-xs h-7"
            >
              {config.formatValue ? config.formatValue(preset) : preset.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Limites de Recursos
        </CardTitle>
        <CardDescription>
          Defina os limites por tenant e as cotas por usuário. Use -1 para ilimitado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tenant-level Limits Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Building2 className="w-4 h-4" />
            LIMITES DO TENANT
            <Badge variant="outline" className="ml-2 text-xs">Contabilizado por tenant</Badge>
          </div>
          {tenantLimits.map(renderLimitField)}
        </div>

        <Separator />

        {/* Per-user Limits Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <UserCircle className="w-4 h-4" />
            COTAS POR USUÁRIO
            <Badge variant="outline" className="ml-2 text-xs">Contabilizado por usuário</Badge>
          </div>
          
          {/* Credits System Explanation */}
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">Sistema de Créditos por Usuário</AlertTitle>
            <AlertDescription className="text-sm space-y-2 mt-2">
              <p>Cada usuário tem sua própria cota mensal de créditos e storage. <strong>Não é um pool compartilhado.</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Valor Padrão:</strong> 500 créditos/usuário (Custo base R$ 5,00/usuário)</li>
                <li><strong>Equivalência:</strong> 500 Créditos ≈ <strong>1.250.000 Tokens</strong> (Modelo Standard)</li>
              </ul>
              <div className="mt-2 pt-2 border-t border-amber-500/20">
                <p className="font-medium">Peso de Consumo (Regra 1 vs 10):</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li><strong>1 Crédito</strong> = 1 Interação Standard (GPT-4o-mini)</li>
                  <li><strong>10 Créditos</strong> = 1 Interação Elite (Claude 3.5 Sonnet / GPT-4o)</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {perUserLimits.map(renderLimitField)}

          {/* Preview of totals */}
          {usersCount > 0 && (
            <Alert className="bg-primary/5 border-primary/30">
              <Users className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Projeção Total do Tenant</AlertTitle>
              <AlertDescription className="text-sm mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Créditos IA:</p>
                    <p className="font-medium">
                      {(localLimits.credits_per_user || 500).toLocaleString()} × {effectiveUsers} usuários = {' '}
                      <span className="text-primary">{totalCredits.toLocaleString()} créditos/mês</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Storage:</p>
                    <p className="font-medium">
                      {localLimits.storage_mb_per_user || 100} MB × {effectiveUsers} usuários = {' '}
                      <span className="text-primary">
                        {totalStorage >= 1024 ? `${(totalStorage/1024).toFixed(1)} GB` : `${totalStorage} MB`}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * Usuários podem ter limites individuais customizados via Gestão de Usuários
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
