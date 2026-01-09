import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, X, Zap, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import { CopilotConfig } from "@/types/templates";
import { useState } from "react";

interface CopilotModeEditorProps {
  config: CopilotConfig;
  onChange: (config: CopilotConfig) => void;
}

export function CopilotModeEditor({ config, onChange }: CopilotModeEditorProps) {
  const [newTrigger, setNewTrigger] = useState("");
  const [newNoSuggestRule, setNewNoSuggestRule] = useState("");
  const [newTransition, setNewTransition] = useState("");

  const addTrigger = () => {
    if (newTrigger.trim()) {
      onChange({
        ...config,
        suggestion_triggers: [...config.suggestion_triggers, newTrigger.trim()]
      });
      setNewTrigger("");
    }
  };

  const removeTrigger = (index: number) => {
    onChange({
      ...config,
      suggestion_triggers: config.suggestion_triggers.filter((_, i) => i !== index)
    });
  };

  const addNoSuggestRule = () => {
    if (newNoSuggestRule.trim()) {
      onChange({
        ...config,
        no_suggest_rules: [...config.no_suggest_rules, newNoSuggestRule.trim()]
      });
      setNewNoSuggestRule("");
    }
  };

  const removeNoSuggestRule = (index: number) => {
    onChange({
      ...config,
      no_suggest_rules: config.no_suggest_rules.filter((_, i) => i !== index)
    });
  };

  const addTransition = () => {
    if (newTransition.trim()) {
      onChange({
        ...config,
        human_transition_phrases: [...config.human_transition_phrases, newTransition.trim()]
      });
      setNewTransition("");
    }
  };

  const removeTransition = (index: number) => {
    onChange({
      ...config,
      human_transition_phrases: config.human_transition_phrases.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Texto Educativo */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
        <p className="font-medium text-foreground mb-1">🤖 O que é o Copiloto?</p>
        <p className="leading-relaxed">
          O Copiloto é um assistente de IA que ajuda vendedores humanos em tempo real. Ele sugere respostas, 
          mas o vendedor decide quando usar. Ideal para aumentar produtividade sem substituir o toque humano.
        </p>
        <p className="mt-2 text-primary/80">
          <span className="font-medium">Impacto no tenant:</span> Vendedores receberão sugestões automáticas durante conversas.
        </p>
      </div>

      {/* Configurações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Configurações do Copiloto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nível de Assistência</Label>
              <Select
                value={config.assistance_level}
                onValueChange={(value: 'suggestion' | 'draft' | 'autocomplete') => 
                  onChange({ ...config, assistance_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Sugestão (mostra opções para escolher)</SelectItem>
                  <SelectItem value="draft">Rascunho (escreve texto para aprovação)</SelectItem>
                  <SelectItem value="autocomplete">Autocompletar (completa enquanto digita)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato das Sugestões</Label>
              <Select
                value={config.suggestion_format}
                onValueChange={(value: 'bullet' | 'prose') => 
                  onChange({ ...config, suggestion_format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet">Lista de Tópicos</SelectItem>
                  <SelectItem value="prose">Texto Corrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Velocidade de Resposta</Label>
              <Select
                value={config.response_speed}
                onValueChange={(value: 'fast' | 'elaborate') => 
                  onChange({ ...config, response_speed: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Rápida (respostas curtas e diretas)</SelectItem>
                  <SelectItem value="elaborate">Detalhada (respostas completas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Opções por Sugestão: {config.options_count}</Label>
              <Slider
                value={[config.options_count]}
                onValueChange={([value]) => onChange({ ...config, options_count: value as 1 | 2 | 3 })}
                min={1}
                max={3}
                step={1}
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground">
                Quantas opções mostrar quando o copiloto sugere respostas
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Copiloto Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Ativar assistência do copiloto para os atendentes
              </p>
            </div>
            <Switch
              checked={config.is_enabled}
              onCheckedChange={(checked) => onChange({ ...config, is_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gatilhos de Sugestão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Gatilhos de Sugestão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Defina quando o copiloto deve aparecer automaticamente com sugestões
          </p>

          <div className="flex flex-wrap gap-2">
            {config.suggestion_triggers.map((trigger, index) => (
              <Badge key={index} variant="secondary" className="py-1.5 px-3">
                {trigger}
                <button onClick={() => removeTrigger(index)} className="ml-2">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ex: Cliente menciona preço, Pergunta sobre prazo..."
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTrigger()}
              className="flex-1"
            />
            <Button onClick={addTrigger} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["Cliente hesitante", "Objeção detectada", "Pedido de desconto", "Comparação com concorrente", "Silêncio prolongado"].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => {
                  if (!config.suggestion_triggers.includes(suggestion)) {
                    onChange({
                      ...config,
                      suggestion_triggers: [...config.suggestion_triggers, suggestion]
                    });
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quando NÃO Sugerir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Quando NÃO Sugerir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Situações onde o copiloto deve ficar em silêncio
          </p>

          <div className="flex flex-wrap gap-2">
            {config.no_suggest_rules.map((rule, index) => (
              <Badge key={index} variant="outline" className="py-1.5 px-3">
                {rule}
                <button onClick={() => removeNoSuggestRule(index)} className="ml-2">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ex: Cliente já confirmou compra, Conversa muito curta..."
              value={newNoSuggestRule}
              onChange={(e) => setNewNoSuggestRule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNoSuggestRule()}
              className="flex-1"
            />
            <Button onClick={addNoSuggestRule} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Frases de Transição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Frases de Transição para Humano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Frases que o copiloto sugere quando precisa transferir para um humano
          </p>

          <div className="space-y-2">
            {config.human_transition_phrases.map((phrase, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <span className="flex-1 text-sm">{phrase}</span>
                <button onClick={() => removeTransition(index)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Ex: Vou transferir você para um especialista que poderá ajudar melhor..."
              value={newTransition}
              onChange={(e) => setNewTransition(e.target.value)}
              className="flex-1 min-h-[60px]"
            />
            <Button onClick={addTransition} size="sm" className="self-end">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
