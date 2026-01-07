import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';
import type { TemplateFormData } from '@/types/templates';

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function SLAConfigForm() {
  const { register, watch, setValue } = useFormContext<TemplateFormData>();
  const sla = watch('sla');

  const toggleDay = (day: number) => {
    const currentDays = sla?.working_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    setValue('sla.working_days', newDays);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Configuração de SLA</h3>
        <p className="text-sm text-muted-foreground">
          Defina os níveis de serviço esperados para atendimento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Response */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm">Primeira Resposta</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tempo máximo para primeiro contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                className="w-20"
                {...register('sla.first_response_minutes', { valueAsNumber: true })}
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          </CardContent>
        </Card>

        {/* Follow Up */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm">Follow-up</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tempo máximo entre interações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                className="w-20"
                {...register('sla.follow_up_hours', { valueAsNumber: true })}
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
          </CardContent>
        </Card>

        {/* Escalation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm">Escalação</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tempo para escalar para supervisor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                className="w-20"
                {...register('sla.escalation_hours', { valueAsNumber: true })}
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Hours */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Horário de Funcionamento</CardTitle>
          </div>
          <CardDescription className="text-xs">
            SLAs são calculados apenas dentro deste horário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Range */}
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input
                type="time"
                className="w-32"
                {...register('sla.working_hours_start')}
              />
            </div>
            <span className="text-muted-foreground mt-6">até</span>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input
                type="time"
                className="w-32"
                {...register('sla.working_hours_end')}
              />
            </div>
          </div>

          {/* Days */}
          <div className="space-y-2">
            <Label className="text-xs">Dias de Funcionamento</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = sla?.working_days?.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                    `}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-2">Resumo do SLA</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Primeira resposta em até <strong>{sla?.first_response_minutes || 5} minutos</strong></li>
            <li>• Follow-up a cada <strong>{sla?.follow_up_hours || 24} horas</strong></li>
            <li>• Escalação após <strong>{sla?.escalation_hours || 48} horas</strong></li>
            <li>• Funcionamento: <strong>{sla?.working_hours_start || '08:00'}</strong> às <strong>{sla?.working_hours_end || '18:00'}</strong></li>
            <li>• Dias: <strong>{WEEKDAYS.filter(d => sla?.working_days?.includes(d.value)).map(d => d.label).join(', ') || 'Seg-Sex'}</strong></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
