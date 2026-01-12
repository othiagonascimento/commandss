import { Brain, Clock, MessageSquare, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepIAProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

const HOUR_PRESETS = [
  { label: "Comercial", weekdays: { start: "08:00", end: "18:00" }, saturday: { start: "09:00", end: "13:00" } },
  { label: "Estendido", weekdays: { start: "07:00", end: "21:00" }, saturday: { start: "08:00", end: "18:00" } },
  { label: "Dia todo", weekdays: { start: "06:00", end: "22:00" }, saturday: { start: "06:00", end: "22:00" } },
];

const PERSONALITY_SUGGESTIONS = [
  "Amigável e informal, usando emojis com moderação 😊",
  "Profissional e direto, sem rodeios",
  "Consultivo, sempre pergunta antes de sugerir",
  "Vendedor persuasivo mas respeitoso",
];

export function StepIA({ formData, updateFormData }: StepIAProps) {
  const updateWorkingHours = (
    period: "weekdays" | "saturday" | "sunday",
    field: "start" | "end" | "enabled",
    value: string | boolean
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

  const applyPreset = (preset: typeof HOUR_PRESETS[0]) => {
    updateFormData({
      working_hours: {
        ...formData.working_hours,
        weekdays: preset.weekdays,
        saturday: preset.saturday,
      },
    });
  };

  const applySuggestion = (suggestion: string) => {
    updateFormData({ ai_personality: suggestion });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Treinando sua IA</h2>
        <p className="text-sm text-muted-foreground">
          Configure como a IA vai atender seus clientes
        </p>
      </div>

      {/* Personality */}
      <Card className="border-border/50">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <Label htmlFor="ai_personality" className="text-base font-medium">
              Personalidade da IA
            </Label>
          </div>
          
          <Textarea
            id="ai_personality"
            placeholder="Ex: Sou um consultor amigável e atencioso. Uso emojis com moderação, foco em entender a necessidade do cliente..."
            value={formData.ai_personality}
            onChange={(e) => updateFormData({ ai_personality: e.target.value })}
            className="min-h-[100px] resize-none text-base"
          />
          
          {/* Quick suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Sugestões rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="text-xs px-3 py-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="border-border/50">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-base font-medium">Horário de Funcionamento</span>
          </div>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            {HOUR_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="gap-1 min-h-[40px]"
              >
                <Zap className="w-3 h-3" />
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {/* Weekdays */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <p className="font-medium text-sm mb-3">Segunda a Sexta</p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={formData.working_hours.weekdays.start}
                  onChange={(e) => updateWorkingHours("weekdays", "start", e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-center text-base"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <input
                  type="time"
                  value={formData.working_hours.weekdays.end}
                  onChange={(e) => updateWorkingHours("weekdays", "end", e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-center text-base"
                />
              </div>
            </div>

            {/* Saturday */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <p className="font-medium text-sm mb-3">Sábado</p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={formData.working_hours.saturday.start}
                  onChange={(e) => updateWorkingHours("saturday", "start", e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-center text-base"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <input
                  type="time"
                  value={formData.working_hours.saturday.end}
                  onChange={(e) => updateWorkingHours("saturday", "end", e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-center text-base"
                />
              </div>
            </div>

            {/* Sunday */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-sm">Domingo</p>
                <Switch
                  checked={formData.working_hours.sunday.enabled}
                  onCheckedChange={(checked) => updateWorkingHours("sunday", "enabled", checked)}
                />
              </div>
              {formData.working_hours.sunday.enabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={formData.working_hours.sunday.start}
                    onChange={(e) => updateWorkingHours("sunday", "start", e.target.value)}
                    className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-center text-base"
                  />
                  <span className="text-muted-foreground text-sm">até</span>
                  <input
                    type="time"
                    value={formData.working_hours.sunday.end}
                    onChange={(e) => updateWorkingHours("sunday", "end", e.target.value)}
                    className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-center text-base"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Outside hours switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="ai_respond_outside" className="cursor-pointer text-sm font-medium">
                IA responde fora do horário?
              </Label>
              <p className="text-xs text-muted-foreground">
                Se não, ela avisa que está fora do expediente
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
