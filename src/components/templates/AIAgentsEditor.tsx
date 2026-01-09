import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, X, Bot, Target, Zap, ArrowRight, Trash2, Copy } from "lucide-react";
import { AIAgent } from "@/types/templates";
import { useState } from "react";

interface AIAgentsEditorProps {
  agents: AIAgent[];
  onChange: (agents: AIAgent[]) => void;
}

const AGENT_TEMPLATES = [
  {
    name: "Agente de Qualificação",
    description: "Coleta informações BANT/SPIN para qualificar leads",
    objective: "Identificar leads qualificados coletando Budget, Authority, Need e Timeline",
    prompt: `Você é um especialista em qualificação de leads. Seu objetivo é:
1. Entender o orçamento disponível do cliente
2. Identificar quem toma as decisões
3. Mapear a necessidade real
4. Descobrir o prazo esperado

Seja consultivo e nunca pareça estar fazendo um interrogatório.`,
    allowed_actions: ["qualify_lead", "add_tag", "update_score"],
    transfer_rules: ["Lead qualificado → Agente de Fechamento", "Lead frio → Agente de Nurturing"]
  },
  {
    name: "Agente de Follow-up",
    description: "Reativa leads que esfriaram ou não responderam",
    objective: "Reengajar leads que pararam de responder com abordagens personalizadas",
    prompt: `Você é especialista em reativação de leads. Seu objetivo é:
1. Retomar contato de forma natural
2. Relembrar o interesse anterior
3. Oferecer valor agregado
4. Identificar o motivo do silêncio

Nunca seja insistente ou pareça desesperado.`,
    allowed_actions: ["send_followup", "schedule_task", "add_tag"],
    transfer_rules: ["Lead reativado → Agente de Qualificação", "Sem interesse → Arquivo"]
  },
  {
    name: "Agente de Fechamento",
    description: "Conduz leads qualificados para a conversão final",
    objective: "Converter leads qualificados em vendas usando técnicas de fechamento",
    prompt: `Você é um especialista em fechamento de vendas. Seu objetivo é:
1. Reforçar os benefícios já discutidos
2. Criar senso de urgência genuíno
3. Contornar últimas objeções
4. Facilitar a decisão de compra

Seja assertivo mas nunca agressivo.`,
    allowed_actions: ["send_proposal", "apply_discount", "create_deal", "schedule_call"],
    transfer_rules: ["Venda fechada → Agente de Pós-Venda", "Objeção forte → Supervisor humano"]
  },
  {
    name: "Agente de Pós-Venda",
    description: "Cuida da satisfação e busca indicações/upsell",
    objective: "Garantir satisfação do cliente e identificar oportunidades de expansão",
    prompt: `Você é especialista em sucesso do cliente. Seu objetivo é:
1. Verificar a satisfação com a compra
2. Resolver eventuais problemas
3. Identificar oportunidades de upsell
4. Solicitar indicações e depoimentos

Seja genuinamente interessado no sucesso do cliente.`,
    allowed_actions: ["send_nps", "create_support_ticket", "offer_upsell", "request_referral"],
    transfer_rules: ["Problema crítico → Suporte humano", "Oportunidade de upsell → Agente de Fechamento"]
  }
];

export function AIAgentsEditor({ agents, onChange }: AIAgentsEditorProps) {
  const [newAction, setNewAction] = useState<Record<string, string>>({});
  const [newRule, setNewRule] = useState<Record<string, string>>({});

  const addAgent = (template?: typeof AGENT_TEMPLATES[0]) => {
    const newAgent: AIAgent = {
      id: `agent_${Date.now()}`,
      name: template?.name || "Novo Agente",
      description: template?.description || "",
      objective: template?.objective || "",
      prompt: template?.prompt || "",
      temperature: 0.7,
      allowed_actions: template?.allowed_actions || [],
      transfer_rules: template?.transfer_rules || [],
      is_active: true
    };
    onChange([...agents, newAgent]);
  };

  const updateAgent = (id: string, updates: Partial<AIAgent>) => {
    onChange(agents.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAgent = (id: string) => {
    onChange(agents.filter(a => a.id !== id));
  };

  const duplicateAgent = (agent: AIAgent) => {
    const newAgent: AIAgent = {
      ...agent,
      id: `agent_${Date.now()}`,
      name: `${agent.name} (cópia)`
    };
    onChange([...agents, newAgent]);
  };

  const addAction = (agentId: string) => {
    const action = newAction[agentId]?.trim();
    if (action) {
      const agent = agents.find(a => a.id === agentId);
      if (agent && !agent.allowed_actions.includes(action)) {
        updateAgent(agentId, {
          allowed_actions: [...agent.allowed_actions, action]
        });
        setNewAction({ ...newAction, [agentId]: "" });
      }
    }
  };

  const removeAction = (agentId: string, action: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      updateAgent(agentId, {
        allowed_actions: agent.allowed_actions.filter(a => a !== action)
      });
    }
  };

  const addRule = (agentId: string) => {
    const rule = newRule[agentId]?.trim();
    if (rule) {
      const agent = agents.find(a => a.id === agentId);
      if (agent && !agent.transfer_rules.includes(rule)) {
        updateAgent(agentId, {
          transfer_rules: [...agent.transfer_rules, rule]
        });
        setNewRule({ ...newRule, [agentId]: "" });
      }
    }
  };

  const removeRule = (agentId: string, rule: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      updateAgent(agentId, {
        transfer_rules: agent.transfer_rules.filter(r => r !== rule)
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Texto Educativo */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
        <p className="font-medium text-foreground mb-1">🤖 O que são Agentes de IA?</p>
        <p className="leading-relaxed">
          Agentes são IAs especializadas que atuam em momentos específicos do funil. Cada agente tem seu próprio prompt, 
          ações permitidas e regras de transferência. Eles trabalham de forma autônoma, sem intervenção humana.
        </p>
        <p className="mt-2 text-primary/80">
          <span className="font-medium">Impacto no tenant:</span> Partes do funil serão automatizadas (qualificação, follow-up, fechamento).
        </p>
      </div>

      {/* Templates de Agentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bot className="h-5 w-5 text-primary" />
            Templates de Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione agentes pré-configurados para começar rapidamente
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENT_TEMPLATES.map((template, i) => (
              <Button
                key={i}
                variant="outline"
                className="h-auto py-3 px-4 justify-start text-left"
                onClick={() => addAgent(template)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {template.description}
                  </span>
                </div>
              </Button>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-3"
            onClick={() => addAgent()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Agente do Zero
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Agentes */}
      {agents.length > 0 && (
        <Accordion type="multiple" defaultValue={[agents[0]?.id]} className="space-y-4">
          {agents.map((agent) => (
            <AccordionItem key={agent.id} value={agent.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                  <div className="text-left">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.description || "Sem descrição"}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6 pt-4">
                  {/* Info Básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Agente</Label>
                      <Input
                        value={agent.name}
                        onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={agent.description}
                        onChange={(e) => updateAgent(agent.id, { description: e.target.value })}
                        placeholder="Breve descrição do agente"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Objetivo Principal</Label>
                    <Textarea
                      value={agent.objective}
                      onChange={(e) => updateAgent(agent.id, { objective: e.target.value })}
                      placeholder="O que este agente deve alcançar?"
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Prompt */}
                  <div className="space-y-2">
                    <Label>Prompt do Agente</Label>
                    <Textarea
                      value={agent.prompt}
                      onChange={(e) => updateAgent(agent.id, { prompt: e.target.value })}
                      placeholder="Instruções detalhadas para o agente..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>

                  {/* Temperatura */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Criatividade: {agent.temperature}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (antigo: Temperature)
                        </span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {agent.temperature < 0.3 ? "🎯 Focado e previsível" : agent.temperature > 0.7 ? "🎨 Criativo e variado" : "⚖️ Balanceado"}
                      </span>
                    </div>
                    <Slider
                      value={[agent.temperature]}
                      onValueChange={([value]) => updateAgent(agent.id, { temperature: value })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = respostas focadas e consistentes | 1 = respostas mais criativas e variadas
                    </p>
                  </div>

                  {/* Ações Permitidas */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Ações Permitidas
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {agent.allowed_actions.map((action) => (
                        <Badge key={action} variant="secondary" className="py-1.5">
                          {action}
                          <button onClick={() => removeAction(agent.id, action)} className="ml-2">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nova ação..."
                        value={newAction[agent.id] || ""}
                        onChange={(e) => setNewAction({ ...newAction, [agent.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addAction(agent.id)}
                        className="flex-1"
                      />
                      <Button onClick={() => addAction(agent.id)} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Regras de Transferência */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      Regras de Transferência
                    </Label>
                    <div className="space-y-2">
                      {agent.transfer_rules.map((rule) => (
                        <div key={rule} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <span className="flex-1">{rule}</span>
                          <button onClick={() => removeRule(agent.id, rule)}>
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Lead qualificado → Agente de Fechamento"
                        value={newRule[agent.id] || ""}
                        onChange={(e) => setNewRule({ ...newRule, [agent.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addRule(agent.id)}
                        className="flex-1"
                      />
                      <Button onClick={() => addRule(agent.id)} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Ações do Agente */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={(checked) => updateAgent(agent.id, { is_active: checked })}
                      />
                      <Label className="text-sm">Agente Ativo</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateAgent(agent)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAgent(agent.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {agents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum agente configurado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione agentes para automatizar diferentes partes do funil de vendas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
