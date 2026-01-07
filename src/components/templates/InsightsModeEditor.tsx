import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, X, BarChart3, Bell, Target, Brain, Zap } from "lucide-react";
import { InsightsConfig, QualificationWeight, AutomaticAlert } from "@/types/templates";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InsightsModeEditorProps {
  config: InsightsConfig;
  onChange: (config: InsightsConfig) => void;
}

export function InsightsModeEditor({ config, onChange }: InsightsModeEditorProps) {
  const [newMetric, setNewMetric] = useState("");
  const [newAlertCondition, setNewAlertCondition] = useState("");
  const [newAlertAction, setNewAlertAction] = useState("");

  const addMetric = () => {
    if (newMetric.trim() && !config.metrics_to_track.includes(newMetric.trim())) {
      onChange({
        ...config,
        metrics_to_track: [...config.metrics_to_track, newMetric.trim()]
      });
      setNewMetric("");
    }
  };

  const removeMetric = (index: number) => {
    onChange({
      ...config,
      metrics_to_track: config.metrics_to_track.filter((_, i) => i !== index)
    });
  };

  const addAlert = () => {
    if (newAlertCondition.trim() && newAlertAction.trim()) {
      const newAlert: AutomaticAlert = {
        id: `alert_${Date.now()}`,
        condition: newAlertCondition.trim(),
        action: newAlertAction.trim(),
        is_active: true
      };
      onChange({
        ...config,
        automatic_alerts: [...config.automatic_alerts, newAlert]
      });
      setNewAlertCondition("");
      setNewAlertAction("");
    }
  };

  const removeAlert = (id: string) => {
    onChange({
      ...config,
      automatic_alerts: config.automatic_alerts.filter(a => a.id !== id)
    });
  };

  const updateWeight = (criterion: string, weight: number) => {
    const existing = config.qualification_score_weights.find(w => w.criterion === criterion);
    if (existing) {
      onChange({
        ...config,
        qualification_score_weights: config.qualification_score_weights.map(w =>
          w.criterion === criterion ? { ...w, weight } : w
        )
      });
    }
  };

  const addWeight = (criterion: string) => {
    if (!config.qualification_score_weights.find(w => w.criterion === criterion)) {
      onChange({
        ...config,
        qualification_score_weights: [
          ...config.qualification_score_weights,
          { criterion, weight: 10 }
        ]
      });
    }
  };

  const removeWeight = (criterion: string) => {
    onChange({
      ...config,
      qualification_score_weights: config.qualification_score_weights.filter(w => w.criterion !== criterion)
    });
  };

  return (
    <div className="space-y-6">
      {/* Recursos Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Recursos de Análise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Detecção de Intenção</Label>
                <p className="text-xs text-muted-foreground">
                  Identificar quando cliente quer comprar
                </p>
              </div>
              <Switch
                checked={config.intent_detection_enabled}
                onCheckedChange={(checked) => 
                  onChange({ ...config, intent_detection_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Detecção de Concorrentes</Label>
                <p className="text-xs text-muted-foreground">
                  Alertar quando concorrente é mencionado
                </p>
              </div>
              <Switch
                checked={config.competitor_detection_enabled}
                onCheckedChange={(checked) => 
                  onChange({ ...config, competitor_detection_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Resumo Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Gerar resumo ao final da conversa
                </p>
              </div>
              <Switch
                checked={config.auto_summary_enabled}
                onCheckedChange={(checked) => 
                  onChange({ ...config, auto_summary_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Tags Automáticas</Label>
                <p className="text-xs text-muted-foreground">
                  Sugerir tags baseado no conteúdo
                </p>
              </div>
              <Switch
                checked={config.auto_tags_enabled}
                onCheckedChange={(checked) => 
                  onChange({ ...config, auto_tags_enabled: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas a Monitorar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-5 w-5 text-green-500" />
            Métricas a Monitorar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Métricas que serão calculadas para cada conversa
          </p>

          <div className="flex flex-wrap gap-2">
            {config.metrics_to_track.map((metric, index) => (
              <Badge key={index} variant="secondary" className="py-1.5 px-3">
                {metric}
                <button onClick={() => removeMetric(index)} className="ml-2">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ex: Tempo de resposta, Sentimento..."
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMetric()}
              className="flex-1"
            />
            <Button onClick={addMetric} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "Tempo de primeira resposta",
              "Tempo médio de resposta",
              "Número de mensagens",
              "Sentimento geral",
              "Score de qualificação",
              "Taxa de engajamento"
            ].filter(m => !config.metrics_to_track.includes(m)).map((metric) => (
              <Button
                key={metric}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-auto py-2"
                onClick={() => {
                  onChange({
                    ...config,
                    metrics_to_track: [...config.metrics_to_track, metric]
                  });
                }}
              >
                <Plus className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">{metric}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score de Qualificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-5 w-5 text-orange-500" />
            Score de Qualificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure os pesos para cada critério de qualificação do lead
          </p>

          <div className="space-y-4">
            {config.qualification_score_weights.map((item) => (
              <div key={item.criterion} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{item.criterion}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8 text-right">{item.weight}%</span>
                    <button onClick={() => removeWeight(item.criterion)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
                <Slider
                  value={[item.weight]}
                  onValueChange={([value]) => updateWeight(item.criterion, value)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Label className="text-sm mb-2 block">Adicionar Critério</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                "Budget confirmado",
                "Decisor identificado",
                "Necessidade clara",
                "Timeline definido",
                "Fit de produto",
                "Engajamento alto"
              ].filter(c => !config.qualification_score_weights.find(w => w.criterion === c)).map((criterion) => (
                <Button
                  key={criterion}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => addWeight(criterion)}
                >
                  <Plus className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{criterion}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-5 w-5 text-red-500" />
            Alertas Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure alertas baseados em condições detectadas
          </p>

          <div className="space-y-3">
            {config.automatic_alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Se</Badge>
                    <span className="text-sm font-medium">{alert.condition}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Então</Badge>
                    <span className="text-sm text-muted-foreground">{alert.action}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={(checked) => {
                      onChange({
                        ...config,
                        automatic_alerts: config.automatic_alerts.map(a =>
                          a.id === alert.id ? { ...a, is_active: checked } : a
                        )
                      });
                    }}
                  />
                  <button onClick={() => removeAlert(alert.id)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Condição</Label>
                <Input
                  placeholder="Ex: Sentimento negativo detectado"
                  value={newAlertCondition}
                  onChange={(e) => setNewAlertCondition(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Ação</Label>
                <Input
                  placeholder="Ex: Notificar supervisor"
                  value={newAlertAction}
                  onChange={(e) => setNewAlertAction(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addAlert} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Alerta
            </Button>
          </div>

          <div className="pt-4">
            <Label className="text-sm mb-2 block">Alertas Sugeridos</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { condition: "Sentimento negativo por 3+ mensagens", action: "Escalar para supervisor" },
                { condition: "Cliente menciona cancelar", action: "Notificar retenção" },
                { condition: "Score de qualificação > 80", action: "Marcar como lead quente" },
                { condition: "Tempo sem resposta > 5min", action: "Alertar atendente" }
              ].map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => {
                    const newAlert: AutomaticAlert = {
                      id: `alert_${Date.now()}_${i}`,
                      condition: suggestion.condition,
                      action: suggestion.action,
                      is_active: true
                    };
                    onChange({
                      ...config,
                      automatic_alerts: [...config.automatic_alerts, newAlert]
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-2 shrink-0" />
                  <span className="truncate">{suggestion.condition} → {suggestion.action}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
