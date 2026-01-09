import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Clock, AlertTriangle, Target, Calendar, Trash2 } from "lucide-react";
import { SLAConfig, EscalationRule, SuccessMetric, OperatingHours } from "@/types/templates";
import { useState } from "react";

interface OperationsConfigEditorProps {
  slaConfig: SLAConfig;
  escalationRules: EscalationRule[];
  successMetrics: SuccessMetric[];
  operatingHours: OperatingHours;
  onChange: (data: {
    slaConfig: SLAConfig;
    escalationRules: EscalationRule[];
    successMetrics: SuccessMetric[];
    operatingHours: OperatingHours;
  }) => void;
}

export function OperationsConfigEditor({
  slaConfig,
  escalationRules,
  successMetrics,
  operatingHours,
  onChange
}: OperationsConfigEditorProps) {
  const [activeTab, setActiveTab] = useState("sla");

  const updateSLA = (updates: Partial<SLAConfig>) => {
    onChange({ slaConfig: { ...slaConfig, ...updates }, escalationRules, successMetrics, operatingHours });
  };

  const addEscalationRule = () => {
    const newRule: EscalationRule = {
      id: `er_${Date.now()}`,
      condition: "",
      escalate_to: "",
      transition_message: "",
      max_time_without_human: 30,
      priority: "medium"
    };
    onChange({ slaConfig, escalationRules: [...escalationRules, newRule], successMetrics, operatingHours });
  };

  const updateEscalationRule = (id: string, updates: Partial<EscalationRule>) => {
    onChange({
      slaConfig,
      escalationRules: escalationRules.map(r => r.id === id ? { ...r, ...updates } : r),
      successMetrics,
      operatingHours
    });
  };

  const removeEscalationRule = (id: string) => {
    onChange({
      slaConfig,
      escalationRules: escalationRules.filter(r => r.id !== id),
      successMetrics,
      operatingHours
    });
  };

  const addSuccessMetric = () => {
    const newMetric: SuccessMetric = {
      id: `sm_${Date.now()}`,
      name: "",
      target_value: 0,
      unit: "percent",
      description: ""
    };
    onChange({ slaConfig, escalationRules, successMetrics: [...successMetrics, newMetric], operatingHours });
  };

  const updateSuccessMetric = (id: string, updates: Partial<SuccessMetric>) => {
    onChange({
      slaConfig,
      escalationRules,
      successMetrics: successMetrics.map(m => m.id === id ? { ...m, ...updates } : m),
      operatingHours
    });
  };

  const removeSuccessMetric = (id: string) => {
    onChange({
      slaConfig,
      escalationRules,
      successMetrics: successMetrics.filter(m => m.id !== id),
      operatingHours
    });
  };

  const updateOperatingHours = (updates: Partial<OperatingHours>) => {
    onChange({ slaConfig, escalationRules, successMetrics, operatingHours: { ...operatingHours, ...updates } });
  };

  return (
    <div className="space-y-6">
      {/* Texto Educativo */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
        <p className="font-medium text-foreground mb-1">⚙️ Configurações Operacionais</p>
        <p className="leading-relaxed">
          Defina regras de negócio: tempos de resposta (SLA), quando escalar para humanos, 
          metas de performance (KPIs) e horários de atendimento.
        </p>
        <p className="mt-2 text-primary/80">
          <span className="font-medium">Impacto no tenant:</span> Define qualidade mínima de atendimento e gera alertas automáticos.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="sla" className="flex-1 min-w-[80px] text-xs sm:text-sm">
            <Clock className="h-4 w-4 mr-1 hidden sm:inline" />
            SLA
          </TabsTrigger>
          <TabsTrigger value="escalation" className="flex-1 min-w-[80px] text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline" />
            Escalação
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex-1 min-w-[80px] text-xs sm:text-sm">
            <Target className="h-4 w-4 mr-1 hidden sm:inline" />
            Metas (KPIs)
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 min-w-[80px] text-xs sm:text-sm">
            <Calendar className="h-4 w-4 mr-1 hidden sm:inline" />
            Horários
          </TabsTrigger>
        </TabsList>

        {/* SLA Config */}
        <TabsContent value="sla" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tempo de Resposta (SLA)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                SLA significa "Acordo de Nível de Serviço" - define tempos máximos aceitáveis de atendimento
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primeira Resposta (segundos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[slaConfig.first_response_seconds || 30]}
                      onValueChange={([value]) => updateSLA({ first_response_seconds: value })}
                      min={5}
                      max={300}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-16 text-right font-medium">{slaConfig.first_response_seconds || 30}s</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tempo máximo para responder uma nova mensagem
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Resolução (minutos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[slaConfig.resolution_minutes || 30]}
                      onValueChange={([value]) => updateSLA({ resolution_minutes: value })}
                      min={1}
                      max={60}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-16 text-right font-medium">{slaConfig.resolution_minutes || 30}min</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tempo alvo para resolver a conversa
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tempo de Inatividade (minutos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[slaConfig.idle_timeout_minutes || 10]}
                      onValueChange={([value]) => updateSLA({ idle_timeout_minutes: value })}
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-16 text-right font-medium">{slaConfig.idle_timeout_minutes || 10}min</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quando considerar a conversa inativa
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Máximo de Mensagens IA</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[slaConfig.max_ai_messages || 10]}
                      onValueChange={([value]) => updateSLA({ max_ai_messages: value })}
                      min={1}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-16 text-right font-medium">{slaConfig.max_ai_messages || 10}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Limite de mensagens antes de escalar para humano
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation Rules */}
        <TabsContent value="escalation" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Regras de Escalação</h3>
              <p className="text-sm text-muted-foreground">Quando transferir para um humano</p>
            </div>
            <Button onClick={addEscalationRule} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {escalationRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Condição</Label>
                      <Input
                        value={rule.condition}
                        onChange={(e) => updateEscalationRule(rule.id, { condition: e.target.value })}
                        placeholder="Ex: Cliente irritado, 3+ objeções..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Escalar Para</Label>
                      <Input
                        value={rule.escalate_to}
                        onChange={(e) => updateEscalationRule(rule.id, { escalate_to: e.target.value })}
                        placeholder="Ex: Supervisor, Especialista..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={rule.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent' | 'critical') =>
                          updateEscalationRule(rule.id, { priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tempo Máximo sem Humano (min)</Label>
                      <Input
                        type="number"
                        value={rule.max_time_without_human}
                        onChange={(e) => updateEscalationRule(rule.id, { max_time_without_human: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem de Transição</Label>
                    <Textarea
                      value={rule.transition_message}
                      onChange={(e) => updateEscalationRule(rule.id, { transition_message: e.target.value })}
                      placeholder="Mensagem enviada ao cliente durante a transferência..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEscalationRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {escalationRules.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma regra de escalação cadastrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Success Metrics / KPIs */}
        <TabsContent value="metrics" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Métricas de Sucesso (KPIs)</h3>
              <p className="text-sm text-muted-foreground">Metas para monitorar performance</p>
            </div>
            <Button onClick={addSuccessMetric} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {successMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Métrica</Label>
                      <Input
                        value={metric.name}
                        onChange={(e) => updateSuccessMetric(metric.id, { name: e.target.value })}
                        placeholder="Ex: Taxa de Conversão"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Alvo</Label>
                      <Input
                        type="number"
                        value={metric.target_value}
                        onChange={(e) => updateSuccessMetric(metric.id, { target_value: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Select
                        value={metric.unit}
                        onValueChange={(value: 'percent' | 'number' | 'seconds' | 'minutes') =>
                          updateSuccessMetric(metric.id, { unit: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Porcentagem (%)</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="seconds">Segundos</SelectItem>
                          <SelectItem value="minutes">Minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={metric.description}
                      onChange={(e) => updateSuccessMetric(metric.id, { description: e.target.value })}
                      placeholder="Como essa métrica é calculada..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSuccessMetric(metric.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {successMetrics.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma métrica de sucesso cadastrada</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="pt-4">
            <Label className="mb-2 block">KPIs Sugeridos</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: "Taxa de Resposta", target_value: 95, unit: "percent" as const, description: "% de mensagens respondidas em até 1 min" },
                { name: "Taxa de Conversão", target_value: 15, unit: "percent" as const, description: "% de leads que viram clientes" },
                { name: "Tempo Médio de Atendimento", target_value: 5, unit: "minutes" as const, description: "Tempo médio por conversa" },
                { name: "NPS Mínimo", target_value: 70, unit: "number" as const, description: "Score mínimo de satisfação" }
              ].map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => {
                    const newMetric: SuccessMetric = {
                      id: `sm_${Date.now()}_${i}`,
                      ...suggestion
                    };
                    onChange({ slaConfig, escalationRules, successMetrics: [...successMetrics, newMetric], operatingHours });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{suggestion.name}: {suggestion.target_value}{suggestion.unit === 'percent' ? '%' : ''}</span>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Horário de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Respeitar Horário Comercial</Label>
                  <p className="text-sm text-muted-foreground">
                    Comportamento diferente fora do horário
                  </p>
                </div>
                <Switch
                  checked={operatingHours.respect_business_hours}
                  onCheckedChange={(checked) => 
                    updateOperatingHours({ respect_business_hours: checked })
                  }
                />
              </div>

              {operatingHours.respect_business_hours && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Início do Expediente</Label>
                      <Input
                        type="time"
                        value={operatingHours.start_time}
                        onChange={(e) => updateOperatingHours({ start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim do Expediente</Label>
                      <Input
                        type="time"
                        value={operatingHours.end_time}
                        onChange={(e) => updateOperatingHours({ end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuso Horário</Label>
                    <Select
                      value={operatingHours.timezone}
                      onValueChange={(value) => updateOperatingHours({ timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="America/Fortaleza">Fernando de Noronha (GMT-2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de Funcionamento</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, i) => {
                        const dayIndex = i;
                        const isActive = operatingHours.working_days.includes(dayIndex);
                        return (
                          <Button
                            key={day}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newDays = isActive
                                ? operatingHours.working_days.filter(d => d !== dayIndex)
                                : [...operatingHours.working_days, dayIndex].sort();
                              updateOperatingHours({ working_days: newDays });
                            }}
                          >
                            {day}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem Fora do Horário</Label>
                    <Textarea
                      value={operatingHours.off_hours_message}
                      onChange={(e) => updateOperatingHours({ off_hours_message: e.target.value })}
                      placeholder="Mensagem enviada quando alguém contata fora do horário comercial..."
                      className="min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
