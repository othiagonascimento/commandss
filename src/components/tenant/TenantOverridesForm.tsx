import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Save, 
  X, 
  History,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TenantOverridesFormProps {
  currentOverrides: Record<string, unknown>;
  overrideReason?: string | null;
  overriddenBy?: string | null;
  overriddenAt?: string | null;
  onApply: (overrides: Record<string, unknown>, reason: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

const overrideOptions = [
  { key: 'limit_users', label: 'Máx. Usuários', type: 'number' },
  { key: 'limit_leads', label: 'Máx. Leads', type: 'number' },
  { key: 'limit_products', label: 'Máx. Produtos', type: 'number' },
  { key: 'limit_whatsapp_instances', label: 'Instâncias WhatsApp', type: 'number' },
  { key: 'limit_ai_tokens_monthly', label: 'Tokens IA/mês', type: 'number' },
  { key: 'limit_storage_mb', label: 'Storage (MB)', type: 'number' },
];

export function TenantOverridesForm({
  currentOverrides,
  overrideReason,
  overriddenBy,
  overriddenAt,
  onApply,
  onClear,
  disabled,
}: TenantOverridesFormProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(currentOverrides || {}).map(([k, v]) => [k, String(v)])
    )
  );
  const [reason, setReason] = useState('');

  const hasOverrides = Object.keys(currentOverrides || {}).length > 0;

  const handleOverrideChange = (key: string, value: string) => {
    if (value === '') {
      const newOverrides = { ...overrides };
      delete newOverrides[key];
      setOverrides(newOverrides);
    } else {
      setOverrides({ ...overrides, [key]: value });
    }
  };

  const handleApply = () => {
    if (!reason.trim()) {
      return;
    }
    const parsedOverrides = Object.fromEntries(
      Object.entries(overrides)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => [k, parseInt(v, 10)])
    );
    onApply(parsedOverrides, reason.trim());
    setReason('');
  };

  return (
    <Card className={hasOverrides ? 'border-amber-500/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Overrides Promocionais
        </CardTitle>
        <CardDescription>
          Configure limites especiais temporários (promoções, descontos, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current override info */}
        {hasOverrides && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-amber-700">Override Ativo</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(currentOverrides).map(([key, value]) => {
                const option = overrideOptions.find(o => o.key === key);
                return (
                  <Badge key={key} variant="secondary" className="bg-amber-500/20">
                    {option?.label || key}: {String(value)}
                  </Badge>
                );
              })}
            </div>

            {overrideReason && (
              <p className="text-sm">
                <span className="text-muted-foreground">Motivo:</span>{' '}
                <span className="font-medium">{overrideReason}</span>
              </p>
            )}

            {overriddenAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="w-3 h-3" />
                Aplicado em {format(new Date(overriddenAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={disabled}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Remover Override
            </Button>
          </div>
        )}

        {/* Override form */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Configurar novos overrides:</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {overrideOptions.map((option) => (
              <div key={option.key} className="space-y-2">
                <Label htmlFor={`override-${option.key}`} className="text-sm">
                  {option.label}
                </Label>
                <Input
                  id={`override-${option.key}`}
                  type="number"
                  placeholder="Valor do override"
                  value={overrides[option.key] || ''}
                  onChange={(e) => handleOverrideChange(option.key, e.target.value)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="override-reason" className="text-sm">
              Motivo do Override *
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Ex: Promoção Black Friday 2024, Parceria especial, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={disabled}
              rows={2}
            />
          </div>

          <Button
            onClick={handleApply}
            disabled={disabled || !reason.trim() || Object.keys(overrides).length === 0}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Aplicar Override
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
