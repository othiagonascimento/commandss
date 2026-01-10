import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Trash2, 
  Brain, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Ban,
  Sparkles,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TemplateFormData, CustomerPersona, FAQItem, ConversationExample, ProhibitedPhrase } from '@/types/templates';

const PERSONA_EMOJIS = ['👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔧', '👩‍🏫', '🧑‍⚕️', '👨‍🍳', '👩‍🎨', '🧑‍🔬', '👨‍✈️', '👩‍🌾', '🧑‍🏭'];

const TABS = [
  { value: 'personality', label: 'Personalidade', icon: Sparkles },
  { value: 'personas', label: 'Personas', icon: Users },
  { value: 'knowledge', label: 'Conhecimento', icon: BookOpen },
  { value: 'examples', label: 'Exemplos', icon: MessageSquare },
  { value: 'boundaries', label: 'Limites', icon: Ban },
];

export function UopaAICoreEditor() {
  const { register, watch, setValue } = useFormContext<TemplateFormData>();
  const [activeTab, setActiveTab] = useState('personality');
  
  const uopaCore = watch('uopa_ai_core');
  const personas = uopaCore?.personas || [];
  const knowledgeBase = uopaCore?.knowledge_base || [];
  const conversationExamples = uopaCore?.conversation_examples || [];
  const prohibitedPhrases = uopaCore?.prohibited_phrases || [];
  const confidentialTopics = uopaCore?.confidential_topics || [];

  const currentTabData = TABS.find(t => t.value === activeTab);

  // Persona handlers
  const addPersona = () => {
    const newPersona: CustomerPersona = {
      id: `persona_${Date.now()}`,
      name: 'Nova Persona',
      demographic_profile: '',
      main_pains: [],
      purchase_motivations: [],
      typical_objections: [],
      approach_strategy: '',
      preferred_communication_style: 'consultivo',
      avatar_emoji: '👤',
    };
    setValue('uopa_ai_core.personas', [...personas, newPersona]);
  };

  const removePersona = (id: string) => {
    setValue('uopa_ai_core.personas', personas.filter(p => p.id !== id));
  };

  // FAQ handlers
  const addFAQ = () => {
    const newFAQ: FAQItem = {
      id: `faq_${Date.now()}`,
      category: 'Geral',
      question: '',
      answer: '',
      keywords: [],
    };
    setValue('uopa_ai_core.knowledge_base', [...knowledgeBase, newFAQ]);
  };

  const removeFAQ = (id: string) => {
    setValue('uopa_ai_core.knowledge_base', knowledgeBase.filter(f => f.id !== id));
  };

  // Example handlers
  const addExample = () => {
    const newExample: ConversationExample = {
      id: `ex_${Date.now()}`,
      title: 'Nova Conversa de Exemplo',
      context: '',
      messages: [
        { role: 'customer', content: '' },
        { role: 'agent', content: '' },
      ],
      outcome: 'success',
      tags: [],
    };
    setValue('uopa_ai_core.conversation_examples', [...conversationExamples, newExample]);
  };

  const removeExample = (id: string) => {
    setValue('uopa_ai_core.conversation_examples', conversationExamples.filter(e => e.id !== id));
  };

  // Prohibited phrase handlers
  const addProhibitedPhrase = () => {
    const newPhrase: ProhibitedPhrase = {
      phrase: '',
      reason: '',
      alternative: '',
    };
    setValue('uopa_ai_core.prohibited_phrases', [...prohibitedPhrases, newPhrase]);
  };

  const removeProhibitedPhrase = (index: number) => {
    setValue('uopa_ai_core.prohibited_phrases', prohibitedPhrases.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Centro de Treinamento Uôpa AI
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure a personalidade, conhecimento e comportamento da IA
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile Dropdown */}
        <div className="sm:hidden mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  {currentTabData && <currentTabData.icon className="h-4 w-4" />}
                  {currentTabData?.label}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {TABS.map((tab) => (
                <DropdownMenuItem
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={activeTab === tab.value ? 'bg-muted' : ''}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Tabs */}
        <TabsList className="hidden sm:grid w-full grid-cols-5 mb-4">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm">
              <tab.icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.label.slice(0, 4)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tom e Estilo de Comunicação</CardTitle>
              <CardDescription>Como a IA deve se comunicar com os clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
                  <Select 
                    value={uopaCore?.tone_of_voice || 'friendly'} 
                    onValueChange={(value) => setValue('uopa_ai_core.tone_of_voice', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="consultative">Consultivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nível de Proatividade</Label>
                  <Select 
                    value={uopaCore?.proactivity_level || 'medium'} 
                    onValueChange={(value) => setValue('uopa_ai_core.proactivity_level', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo (aguarda perguntas)</SelectItem>
                      <SelectItem value="medium">Médio (sugere quando apropriado)</SelectItem>
                      <SelectItem value="high">Alto (antecipa necessidades)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estilo de Comunicação</Label>
                  <Select 
                    value={uopaCore?.communication_style || 'consultative'} 
                    onValueChange={(value) => setValue('uopa_ai_core.communication_style', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direto</SelectItem>
                      <SelectItem value="consultative">Consultivo</SelectItem>
                      <SelectItem value="educational">Educativo</SelectItem>
                      <SelectItem value="empathetic">Empático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Idioma/Regionalismo</Label>
                  <Select 
                    value={uopaCore?.language_regionalism || 'pt-BR'} 
                    onValueChange={(value) => setValue('uopa_ai_core.language_regionalism', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português Brasil</SelectItem>
                      <SelectItem value="pt-BR-sp">Português (São Paulo)</SelectItem>
                      <SelectItem value="pt-BR-rj">Português (Rio de Janeiro)</SelectItem>
                      <SelectItem value="pt-BR-ne">Português (Nordeste)</SelectItem>
                      <SelectItem value="pt-BR-sul">Português (Sul)</SelectItem>
                    </SelectContent>
                </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Motores de Inteligência
              </CardTitle>
              <CardDescription>
                Configure quais modelos de IA serão utilizados em cada camada de processamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Camada 1 - Router
                  </Label>
                  <Select 
                    value={uopaCore?.layer_1_model || 'gemini-1.5-flash'} 
                    onValueChange={(value) => setValue('uopa_ai_core.layer_1_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modelo rápido para roteamento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Camada 2 - Standard
                  </Label>
                  <Select 
                    value={uopaCore?.layer_2_model || 'gemini-1.5-pro'} 
                    onValueChange={(value) => setValue('uopa_ai_core.layer_2_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modelo balanceado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Camada 3 - Elite
                  </Label>
                  <Select 
                    value={(uopaCore as { layer_3_model?: string })?.layer_3_model || 'gpt-4o'} 
                    onValueChange={(value) => setValue('uopa_ai_core.layer_2_model', value)} // Will be stored in layer_2 for now
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modelo avançado para vendas
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>System Prompt Base</Label>
                <Textarea
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="Instruções gerais para o comportamento da IA..."
                  {...register('prompts.system_prompt')}
                />
                <p className="text-xs text-muted-foreground">
                  Este é o prompt principal que define o comportamento da IA. Suporta markdown.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Saudação</Label>
                <Textarea
                  rows={2}
                  placeholder="Olá! 👋 Como posso ajudar você hoje?"
                  {...register('prompts.greeting')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Personas de Cliente</h4>
              <p className="text-xs text-muted-foreground">
                Perfis típicos de clientes para a IA reconhecer e adaptar abordagem
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addPersona}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          <div className="space-y-3">
            {personas.map((persona, index) => (
              <Card key={persona.id}>
                <Accordion type="single" collapsible>
                  <AccordionItem value={persona.id} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{persona.avatar_emoji}</span>
                        <span className="font-medium">{persona.name || 'Nova Persona'}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome da Persona</Label>
                            <Input
                              value={persona.name}
                              onChange={(e) => {
                                const updated = [...personas];
                                updated[index] = { ...persona, name: e.target.value };
                                setValue('uopa_ai_core.personas', updated);
                              }}
                              placeholder="Ex: João Decisor"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Avatar</Label>
                            <Select 
                              value={persona.avatar_emoji} 
                              onValueChange={(value) => {
                                const updated = [...personas];
                                updated[index] = { ...persona, avatar_emoji: value };
                                setValue('uopa_ai_core.personas', updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue>
                                  <span className="text-xl">{persona.avatar_emoji}</span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <div className="grid grid-cols-6 gap-1 p-2">
                                  {PERSONA_EMOJIS.map((emoji) => (
                                    <SelectItem key={emoji} value={emoji} className="text-center text-xl cursor-pointer">
                                      {emoji}
                                    </SelectItem>
                                  ))}
                                </div>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Perfil Demográfico</Label>
                          <Textarea
                            rows={2}
                            value={persona.demographic_profile}
                            onChange={(e) => {
                              const updated = [...personas];
                              updated[index] = { ...persona, demographic_profile: e.target.value };
                              setValue('uopa_ai_core.personas', updated);
                            }}
                            placeholder="Ex: Homem, 35-50 anos, empresário, renda alta, busca praticidade"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Principais Dores (separadas por vírgula)</Label>
                          <Input
                            value={persona.main_pains.join(', ')}
                            onChange={(e) => {
                              const updated = [...personas];
                              updated[index] = { ...persona, main_pains: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                              setValue('uopa_ai_core.personas', updated);
                            }}
                            placeholder="Ex: falta de tempo, desconfiança, experiências ruins anteriores"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Motivações de Compra (separadas por vírgula)</Label>
                          <Input
                            value={persona.purchase_motivations.join(', ')}
                            onChange={(e) => {
                              const updated = [...personas];
                              updated[index] = { ...persona, purchase_motivations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                              setValue('uopa_ai_core.personas', updated);
                            }}
                            placeholder="Ex: status, economia, conveniência"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Objeções Típicas (separadas por vírgula)</Label>
                          <Input
                            value={persona.typical_objections.join(', ')}
                            onChange={(e) => {
                              const updated = [...personas];
                              updated[index] = { ...persona, typical_objections: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                              setValue('uopa_ai_core.personas', updated);
                            }}
                            placeholder="Ex: está caro, preciso pensar, vou ver com minha esposa"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Estratégia de Abordagem</Label>
                          <Textarea
                            rows={2}
                            value={persona.approach_strategy}
                            onChange={(e) => {
                              const updated = [...personas];
                              updated[index] = { ...persona, approach_strategy: e.target.value };
                              setValue('uopa_ai_core.personas', updated);
                            }}
                            placeholder="Como abordar este tipo de cliente? Que argumentos funcionam melhor?"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePersona(persona.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Persona
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            ))}

            {personas.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma persona configurada</p>
                  <p className="text-xs mt-1">Adicione perfis de cliente para a IA adaptar a comunicação</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Base de Conhecimento (FAQ)</h4>
              <p className="text-xs text-muted-foreground">
                Perguntas e respostas que a IA deve saber responder
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFAQ}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          <div className="space-y-3">
            {knowledgeBase.map((faq, index) => (
              <Card key={faq.id}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Categoria</Label>
                          <Input
                            value={faq.category}
                            onChange={(e) => {
                              const updated = [...knowledgeBase];
                              updated[index] = { ...faq, category: e.target.value };
                              setValue('uopa_ai_core.knowledge_base', updated);
                            }}
                            placeholder="Ex: Pagamento"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-3">
                          <Label className="text-xs">Pergunta</Label>
                          <Input
                            value={faq.question}
                            onChange={(e) => {
                              const updated = [...knowledgeBase];
                              updated[index] = { ...faq, question: e.target.value };
                              setValue('uopa_ai_core.knowledge_base', updated);
                            }}
                            placeholder="Ex: Quais as formas de pagamento?"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        onClick={() => removeFAQ(faq.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Resposta</Label>
                      <Textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...knowledgeBase];
                          updated[index] = { ...faq, answer: e.target.value };
                          setValue('uopa_ai_core.knowledge_base', updated);
                        }}
                        placeholder="Resposta que a IA deve usar..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {knowledgeBase.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item na base de conhecimento</p>
                  <p className="text-xs mt-1">Adicione FAQs para a IA responder perguntas frequentes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Exemplos de Conversa (Few-shot)</h4>
              <p className="text-xs text-muted-foreground">
                Conversas modelo para a IA aprender o estilo desejado
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addExample}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          <div className="space-y-3">
            {conversationExamples.map((example, exIndex) => (
              <Card key={example.id}>
                <Accordion type="single" collapsible>
                  <AccordionItem value={example.id} className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant={example.outcome === 'success' ? 'default' : 'secondary'}>
                          {example.outcome}
                        </Badge>
                        <span className="font-medium">{example.title || 'Nova Conversa'}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                              value={example.title}
                              onChange={(e) => {
                                const updated = [...conversationExamples];
                                updated[exIndex] = { ...example, title: e.target.value };
                                setValue('uopa_ai_core.conversation_examples', updated);
                              }}
                              placeholder="Ex: Fechamento bem-sucedido"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Resultado</Label>
                            <Select 
                              value={example.outcome} 
                              onValueChange={(value) => {
                                const updated = [...conversationExamples];
                                updated[exIndex] = { ...example, outcome: value as any };
                                setValue('uopa_ai_core.conversation_examples', updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="success">Sucesso</SelectItem>
                                <SelectItem value="objection_handled">Objeção Contornada</SelectItem>
                                <SelectItem value="qualified">Lead Qualificado</SelectItem>
                                <SelectItem value="scheduled">Agendamento</SelectItem>
                                <SelectItem value="lost">Perdido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Contexto</Label>
                          <Textarea
                            rows={2}
                            value={example.context}
                            onChange={(e) => {
                              const updated = [...conversationExamples];
                              updated[exIndex] = { ...example, context: e.target.value };
                              setValue('uopa_ai_core.conversation_examples', updated);
                            }}
                            placeholder="Descreva o contexto dessa conversa..."
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Mensagens</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = [...conversationExamples];
                                updated[exIndex] = {
                                  ...example,
                                  messages: [...example.messages, { role: 'customer', content: '' }],
                                };
                                setValue('uopa_ai_core.conversation_examples', updated);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Mensagem
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {example.messages.map((msg, msgIndex) => (
                              <div key={msgIndex} className="flex gap-2">
                                <Select 
                                  value={msg.role} 
                                  onValueChange={(value) => {
                                    const updated = [...conversationExamples];
                                    updated[exIndex].messages[msgIndex] = { ...msg, role: value as any };
                                    setValue('uopa_ai_core.conversation_examples', updated);
                                  }}
                                >
                                  <SelectTrigger className="w-24 shrink-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="customer">Cliente</SelectItem>
                                    <SelectItem value="agent">IA</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={msg.content}
                                  onChange={(e) => {
                                    const updated = [...conversationExamples];
                                    updated[exIndex].messages[msgIndex] = { ...msg, content: e.target.value };
                                    setValue('uopa_ai_core.conversation_examples', updated);
                                  }}
                                  placeholder="Mensagem..."
                                  className={msg.role === 'agent' ? 'bg-primary/5' : ''}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive shrink-0"
                                  onClick={() => {
                                    const updated = [...conversationExamples];
                                    updated[exIndex].messages = example.messages.filter((_, i) => i !== msgIndex);
                                    setValue('uopa_ai_core.conversation_examples', updated);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeExample(example.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Exemplo
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            ))}

            {conversationExamples.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum exemplo de conversa</p>
                  <p className="text-xs mt-1">Adicione conversas modelo para treinar a IA</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Boundaries Tab */}
        <TabsContent value="boundaries" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                Frases Proibidas
              </CardTitle>
              <CardDescription>Termos que a IA nunca deve usar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={addProhibitedPhrase}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {prohibitedPhrases.map((phrase, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Frase proibida"
                      value={phrase.phrase}
                      onChange={(e) => {
                        const updated = [...prohibitedPhrases];
                        updated[index] = { ...phrase, phrase: e.target.value };
                        setValue('uopa_ai_core.prohibited_phrases', updated);
                      }}
                    />
                    <Input
                      placeholder="Por quê evitar"
                      value={phrase.reason}
                      onChange={(e) => {
                        const updated = [...prohibitedPhrases];
                        updated[index] = { ...phrase, reason: e.target.value };
                        setValue('uopa_ai_core.prohibited_phrases', updated);
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Alternativa"
                        value={phrase.alternative}
                        onChange={(e) => {
                          const updated = [...prohibitedPhrases];
                          updated[index] = { ...phrase, alternative: e.target.value };
                          setValue('uopa_ai_core.prohibited_phrases', updated);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        onClick={() => removeProhibitedPhrase(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {prohibitedPhrases.length === 0 && (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    Nenhuma frase proibida configurada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tópicos Confidenciais</CardTitle>
              <CardDescription>Assuntos que a IA deve evitar ou redirecionar para humanos</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                placeholder="Ex: preços de atacado, margens de lucro, estratégias internas... (um por linha)"
                value={confidentialTopics.join('\n')}
                onChange={(e) => {
                  setValue('uopa_ai_core.confidential_topics', e.target.value.split('\n').filter(Boolean));
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
