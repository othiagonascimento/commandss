import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, BookOpen, MessageSquare, Shield, Sparkles, Ban, Trash2 } from "lucide-react";
import { SalesMethodology, QuickReply, ObjectionHandler, ClosingScript, ProhibitedPhrase } from "@/types/templates";
import { useState } from "react";

interface SalesPlaybookEditorProps {
  methodologies: SalesMethodology[];
  quickReplies: QuickReply[];
  objectionHandlers: ObjectionHandler[];
  closingScripts: ClosingScript[];
  prohibitedPhrases: ProhibitedPhrase[];
  onChange: (data: {
    methodologies: SalesMethodology[];
    quickReplies: QuickReply[];
    objectionHandlers: ObjectionHandler[];
    closingScripts: ClosingScript[];
    prohibitedPhrases: ProhibitedPhrase[];
  }) => void;
}

export function SalesPlaybookEditor({
  methodologies,
  quickReplies,
  objectionHandlers,
  closingScripts,
  prohibitedPhrases,
  onChange
}: SalesPlaybookEditorProps) {
  const [activeTab, setActiveTab] = useState("quick-replies");

  // Quick Replies handlers
  const addQuickReply = () => {
    const newReply: QuickReply = {
      id: `qr_${Date.now()}`,
      title: "Nova Resposta",
      content: "",
      category: "geral",
      tags: []
    };
    onChange({ methodologies, quickReplies: [...quickReplies, newReply], objectionHandlers, closingScripts, prohibitedPhrases });
  };

  const updateQuickReply = (id: string, updates: Partial<QuickReply>) => {
    onChange({
      methodologies,
      quickReplies: quickReplies.map(r => r.id === id ? { ...r, ...updates } : r),
      objectionHandlers,
      closingScripts,
      prohibitedPhrases
    });
  };

  const removeQuickReply = (id: string) => {
    onChange({
      methodologies,
      quickReplies: quickReplies.filter(r => r.id !== id),
      objectionHandlers,
      closingScripts,
      prohibitedPhrases
    });
  };

  // Objection handlers
  const addObjectionHandler = () => {
    const newHandler: ObjectionHandler = {
      id: `oh_${Date.now()}`,
      objection: "",
      root_cause: "",
      responses: [{ content: "", intensity: "moderate" }]
    };
    onChange({ methodologies, quickReplies, objectionHandlers: [...objectionHandlers, newHandler], closingScripts, prohibitedPhrases });
  };

  const updateObjectionHandler = (id: string, updates: Partial<ObjectionHandler>) => {
    onChange({
      methodologies,
      quickReplies,
      objectionHandlers: objectionHandlers.map(h => h.id === id ? { ...h, ...updates } : h),
      closingScripts,
      prohibitedPhrases
    });
  };

  const removeObjectionHandler = (id: string) => {
    onChange({
      methodologies,
      quickReplies,
      objectionHandlers: objectionHandlers.filter(h => h.id !== id),
      closingScripts,
      prohibitedPhrases
    });
  };

  // Closing scripts
  const addClosingScript = () => {
    const newScript: ClosingScript = {
      id: `cs_${Date.now()}`,
      name: "Novo Script",
      type: "assumptive",
      content: "",
      transition_phrases: []
    };
    onChange({ methodologies, quickReplies, objectionHandlers, closingScripts: [...closingScripts, newScript], prohibitedPhrases });
  };

  const updateClosingScript = (id: string, updates: Partial<ClosingScript>) => {
    onChange({
      methodologies,
      quickReplies,
      objectionHandlers,
      closingScripts: closingScripts.map(s => s.id === id ? { ...s, ...updates } : s),
      prohibitedPhrases
    });
  };

  const removeClosingScript = (id: string) => {
    onChange({
      methodologies,
      quickReplies,
      objectionHandlers,
      closingScripts: closingScripts.filter(s => s.id !== id),
      prohibitedPhrases
    });
  };

  // Prohibited phrases
  const addProhibitedPhrase = () => {
    const newPhrase: ProhibitedPhrase = {
      id: `pp_${Date.now()}`,
      phrase: "",
      reason: "",
      alternative: ""
    };
    onChange({ methodologies, quickReplies, objectionHandlers, closingScripts, prohibitedPhrases: [...prohibitedPhrases, newPhrase] });
  };

  const updateProhibitedPhrase = (id: string, updates: Partial<ProhibitedPhrase>) => {
    onChange({
      methodologies,
      quickReplies,
      objectionHandlers,
      closingScripts,
      prohibitedPhrases: prohibitedPhrases.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const removeProhibitedPhrase = (id: string) => {
    onChange({
      methodologies,
      quickReplies,
      objectionHandlers,
      closingScripts,
      prohibitedPhrases: prohibitedPhrases.filter(p => p.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="quick-replies" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-1 hidden sm:inline" />
            Respostas
          </TabsTrigger>
          <TabsTrigger value="objections" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1 hidden sm:inline" />
            Objeções
          </TabsTrigger>
          <TabsTrigger value="closing" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <Sparkles className="h-4 w-4 mr-1 hidden sm:inline" />
            Fechamento
          </TabsTrigger>
          <TabsTrigger value="prohibited" className="flex-1 min-w-[100px] text-xs sm:text-sm">
            <Ban className="h-4 w-4 mr-1 hidden sm:inline" />
            Proibidas
          </TabsTrigger>
        </TabsList>

        {/* Quick Replies */}
        <TabsContent value="quick-replies" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Respostas Rápidas</h3>
              <p className="text-sm text-muted-foreground">Templates de resposta para situações comuns</p>
            </div>
            <Button onClick={addQuickReply} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {quickReplies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={reply.title}
                        onChange={(e) => updateQuickReply(reply.id, { title: e.target.value })}
                        placeholder="Nome da resposta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={reply.category}
                        onValueChange={(value) => updateQuickReply(reply.id, { category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral</SelectItem>
                          <SelectItem value="saudacao">Saudação</SelectItem>
                          <SelectItem value="preco">Preço</SelectItem>
                          <SelectItem value="prazo">Prazo</SelectItem>
                          <SelectItem value="suporte">Suporte</SelectItem>
                          <SelectItem value="fechamento">Fechamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={reply.content}
                      onChange={(e) => updateQuickReply(reply.id, { content: e.target.value })}
                      placeholder="Texto da resposta rápida..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuickReply(reply.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {quickReplies.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma resposta rápida cadastrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Objection Handlers */}
        <TabsContent value="objections" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Tratadores de Objeção</h3>
              <p className="text-sm text-muted-foreground">Como responder a objeções comuns</p>
            </div>
            <Button onClick={addObjectionHandler} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {objectionHandlers.map((handler) => (
              <AccordionItem key={handler.id} value={handler.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="text-left truncate">
                    {handler.objection || "Nova objeção..."}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Objeção</Label>
                    <Input
                      value={handler.objection}
                      onChange={(e) => updateObjectionHandler(handler.id, { objection: e.target.value })}
                      placeholder='Ex: "Está muito caro"'
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Causa Raiz</Label>
                    <Input
                      value={handler.root_cause}
                      onChange={(e) => updateObjectionHandler(handler.id, { root_cause: e.target.value })}
                      placeholder="Por que o cliente diz isso?"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Respostas por Intensidade</Label>
                    {handler.responses.map((response, i) => (
                      <div key={i} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Select
                            value={response.intensity}
                            onValueChange={(value: 'soft' | 'moderate' | 'strong') => {
                              const newResponses = [...handler.responses];
                              newResponses[i] = { ...response, intensity: value };
                              updateObjectionHandler(handler.id, { responses: newResponses });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="soft">Leve</SelectItem>
                              <SelectItem value="moderate">Moderada</SelectItem>
                              <SelectItem value="strong">Forte</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newResponses = handler.responses.filter((_, idx) => idx !== i);
                              updateObjectionHandler(handler.id, { responses: newResponses });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={response.content}
                          onChange={(e) => {
                            const newResponses = [...handler.responses];
                            newResponses[i] = { ...response, content: e.target.value };
                            updateObjectionHandler(handler.id, { responses: newResponses });
                          }}
                          placeholder="Resposta para esta objeção..."
                          className="min-h-[80px]"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateObjectionHandler(handler.id, {
                          responses: [...handler.responses, { content: "", intensity: "moderate" }]
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Variação
                    </Button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeObjectionHandler(handler.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover Objeção
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {objectionHandlers.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum tratador de objeção cadastrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Closing Scripts */}
        <TabsContent value="closing" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Scripts de Fechamento</h3>
              <p className="text-sm text-muted-foreground">Técnicas para converter leads em vendas</p>
            </div>
            <Button onClick={addClosingScript} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {closingScripts.map((script) => (
              <Card key={script.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Script</Label>
                      <Input
                        value={script.name}
                        onChange={(e) => updateClosingScript(script.id, { name: e.target.value })}
                        placeholder="Nome do script"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Fechamento</Label>
                      <Select
                        value={script.type}
                        onValueChange={(value: 'assumptive' | 'alternative' | 'urgency' | 'summary') =>
                          updateClosingScript(script.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assumptive">Assumptivo</SelectItem>
                          <SelectItem value="alternative">Alternativa</SelectItem>
                          <SelectItem value="urgency">Urgência</SelectItem>
                          <SelectItem value="summary">Resumo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo do Script</Label>
                    <Textarea
                      value={script.content}
                      onChange={(e) => updateClosingScript(script.id, { content: e.target.value })}
                      placeholder="Texto do script de fechamento..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeClosingScript(script.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {closingScripts.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum script de fechamento cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Prohibited Phrases */}
        <TabsContent value="prohibited" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Frases Proibidas</h3>
              <p className="text-sm text-muted-foreground">Termos que a IA nunca deve usar</p>
            </div>
            <Button onClick={addProhibitedPhrase} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {prohibitedPhrases.map((phrase) => (
              <Card key={phrase.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Frase Proibida</Label>
                      <Input
                        value={phrase.phrase}
                        onChange={(e) => updateProhibitedPhrase(phrase.id, { phrase: e.target.value })}
                        placeholder='Ex: "Não sei"'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Input
                        value={phrase.reason}
                        onChange={(e) => updateProhibitedPhrase(phrase.id, { reason: e.target.value })}
                        placeholder="Por que evitar?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alternativa</Label>
                      <Input
                        value={phrase.alternative}
                        onChange={(e) => updateProhibitedPhrase(phrase.id, { alternative: e.target.value })}
                        placeholder="O que usar no lugar?"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProhibitedPhrase(phrase.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {prohibitedPhrases.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Ban className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma frase proibida cadastrada</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="pt-4">
            <Label className="mb-2 block">Sugestões Comuns</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { phrase: "Não sei", reason: "Transmite insegurança", alternative: "Vou verificar essa informação" },
                { phrase: "Talvez", reason: "Falta de assertividade", alternative: "Posso confirmar que..." },
                { phrase: "Isso não é comigo", reason: "Falta de ownership", alternative: "Vou encaminhar para o setor responsável" },
                { phrase: "Não posso fazer nada", reason: "Negativo demais", alternative: "O que posso fazer é..." }
              ].map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => {
                    const newPhrase: ProhibitedPhrase = {
                      id: `pp_${Date.now()}_${i}`,
                      ...suggestion
                    };
                    onChange({ methodologies, quickReplies, objectionHandlers, closingScripts, prohibitedPhrases: [...prohibitedPhrases, newPhrase] });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">"{suggestion.phrase}"</span>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
