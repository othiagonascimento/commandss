import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { 
  Users, 
  Target, 
  Package, 
  Smartphone, 
  Cpu, 
  HardDrive,
  Infinity,
  Settings2,
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
  };
  onChange: (limits: TenantLimitsEditorProps['limits']) => void;
  disabled?: boolean;
}

interface LimitConfig {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  unit: string;
  presets: number[];
  formatValue?: (v: number) => string;
}

const limitConfig: LimitConfig[] = [
  {
    key: 'limit_users',
    label: 'Máx. Usuários',
    description: 'Número máximo de usuários permitidos',
    icon: Users,
    unit: 'usuários',
    presets: [5, 10, 25, 50, 100],
  },
  {
    key: 'limit_leads',
    label: 'Máx. Leads',
    description: 'Número máximo de leads/contatos',
    icon: Target,
    unit: 'leads',
    presets: [1000, 5000, 10000, 50000, 100000],
  },
  {
    key: 'limit_products',
    label: 'Máx. Produtos',
    description: 'Número máximo de produtos no catálogo',
    icon: Package,
    unit: 'produtos',
    presets: [100, 500, 1000, 5000, 10000],
  },
  {
    key: 'limit_whatsapp_instances',
    label: 'Instâncias WhatsApp',
    description: 'Número de conexões WhatsApp permitidas',
    icon: Smartphone,
    unit: 'instâncias',
    presets: [1, 2, 5, 10],
  },
  {
    key: 'limit_ai_tokens_monthly',
    label: 'Tokens IA/mês',
    description: 'Limite de tokens de IA por mês',
    icon: Cpu,
    unit: 'tokens',
    presets: [100000, 500000, 1000000, 5000000],
    formatValue: (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}k`,
  },
  {
    key: 'limit_storage_mb',
    label: 'Storage',
    description: 'Limite de armazenamento em MB',
    icon: HardDrive,
    unit: 'MB',
    presets: [500, 1024, 2048, 5120, 10240],
    formatValue: (v: number) => v >= 1024 ? `${(v/1024).toFixed(1)} GB` : `${v} MB`,
  },
];

export function TenantLimitsEditor({ limits, onChange, disabled }: TenantLimitsEditorProps) {
  const [localLimits, setLocalLimits] = useState(limits);

  const handleChange = (key: keyof typeof limits, value: number) => {
    const updated = { ...localLimits, [key]: value };
    setLocalLimits(updated);
    onChange(updated);
  };

  const handleInputChange = (key: keyof typeof limits, inputValue: string) => {
    const value = inputValue === '' ? 0 : parseInt(inputValue, 10);
    if (!isNaN(value) && value >= -1) {
      handleChange(key, value);
    }
  };

  const setUnlimited = (key: keyof typeof limits) => {
    handleChange(key, -1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Limites de Recursos
        </CardTitle>
        <CardDescription>
          Defina os limites de uso para este tenant. Use -1 para ilimitado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {limitConfig.map((config) => {
          const Icon = config.icon;
          const currentValue = localLimits[config.key as keyof typeof limits];
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
                    onChange={(e) => handleInputChange(config.key as keyof typeof limits, e.target.value)}
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
                  onClick={() => setUnlimited(config.key as keyof typeof limits)}
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
                    onClick={() => handleChange(config.key as keyof typeof limits, preset)}
                    disabled={disabled}
                    className="text-xs h-7"
                  >
                    {config.formatValue ? config.formatValue(preset) : preset.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
