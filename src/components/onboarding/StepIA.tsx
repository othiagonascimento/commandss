import { Brain, Clock, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepIAProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

export function StepIA({ formData, updateFormData }: StepIAProps) {
  const updateWorkingHours = (
    period: "weekdays" | "saturday",
    field: "start" | "end",
    value: string
  ) => {
    updateFormData({
      working_hours: {
        ...formData.working_hours,
        [period]: {
          ...formData.working_hours[period],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Treinando sua Inteligência Artificial</h2>
        <p className="text-muted-foreground">
          Configure como a IA vai se comportar ao atender seus clientes
        </p>
      </div>

      {/* Personality */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <Label htmlFor="ai_personality" className="text-base font-medium">
              Personalidade da IA
            </Label>
          </div>
          
          <Textarea
            id="ai_personality"
            placeholder="Ex: Sou um consultor amigável e atencioso. Uso emojis com moderação, foco em entender a necessidade do cliente antes de oferecer produtos. Sou paciente e sempre pergunto se posso ajudar em algo mais..."
            value={formData.ai_personality}
            onChange={(e) => updateFormData({ ai_personality: e.target.value })}
            className="min-h-[120px] resize-none"
          />
          
          <p className="text-xs text-muted-foreground">
            Descreva como você gostaria que a IA conversasse com seus clientes. 
            Quanto mais detalhes, melhor!
          </p>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">Horário de Funcionamento</span>
          </div>

          <div className="grid gap-4">
            {/* Weekdays */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="font-medium text-sm mb-3">Segunda a Sexta</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Input
                    type="time"
                    value={formData.working_hours.weekdays.start}
                    onChange={(e) => updateWorkingHours("weekdays", "start", e.target.value)}
                    className="h-10"
                  />
                </div>
                <span className="text-muted-foreground mt-5">até</span>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Fim</Label>
                  <Input
                    type="time"
                    value={formData.working_hours.weekdays.end}
                    onChange={(e) => updateWorkingHours("weekdays", "end", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Saturday */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="font-medium text-sm mb-3">Sábado</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Input
                    type="time"
                    value={formData.working_hours.saturday.start}
                    onChange={(e) => updateWorkingHours("saturday", "start", e.target.value)}
                    className="h-10"
                  />
                </div>
                <span className="text-muted-foreground mt-5">até</span>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Fim</Label>
                  <Input
                    type="time"
                    value={formData.working_hours.saturday.end}
                    onChange={(e) => updateWorkingHours("saturday", "end", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Outside hours switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="space-y-0.5">
              <Label htmlFor="ai_respond_outside" className="cursor-pointer">
                IA pode responder fora do horário?
              </Label>
              <p className="text-xs text-muted-foreground">
                Se não, ela avisará que está fora do expediente
              </p>
            </div>
            <Switch
              id="ai_respond_outside"
              checked={formData.ai_respond_outside_hours}
              onCheckedChange={(checked) => updateFormData({ ai_respond_outside_hours: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
