import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { TemplateFormData } from '@/types/templates';

export function PromptEditor() {
  const { register, watch, setValue } = useFormContext<TemplateFormData>();
  const [activePromptTab, setActivePromptTab] = useState('greeting');
  const [showPreview, setShowPreview] = useState(false);

  const prompts = watch('prompts');
  const objectionHandlers = prompts?.objection_handlers || {};
  const qualificationCriteria = prompts?.qualification_criteria || {};

  const handleAddObjection = () => {
    const key = `objection_${Date.now()}`;
    setValue(`prompts.objection_handlers.${key}`, '');
  };

  const handleRemoveObjection = (key: string) => {
    const updated = { ...objectionHandlers };
    delete updated[key];
    setValue('prompts.objection_handlers', updated);
  };

  const handleAddCriteria = () => {
    const key = `criteria_${Date.now()}`;
    setValue(`prompts.qualification_criteria.${key}`, { weight: 25, question: '' });
  };

  const handleRemoveCriteria = (key: string) => {
    const updated = { ...qualificationCriteria };
    delete updated[key];
    setValue('prompts.qualification_criteria', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Configuração de Prompts</h3>
          <p className="text-sm text-muted-foreground">
            Configure os textos e prompts que serão usados pela IA
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
        </Button>
      </div>

      <Tabs value={activePromptTab} onValueChange={setActivePromptTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="greeting">Saudação</TabsTrigger>
          <TabsTrigger value="system">System Prompt</TabsTrigger>
          <TabsTrigger value="objections">Objeções</TabsTrigger>
          <TabsTrigger value="qualification">Qualificação</TabsTrigger>
        </TabsList>

        <TabsContent value="greeting" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="greeting">Mensagem de Saudação *</Label>
            <Textarea
              id="greeting"
              placeholder="Olá! Bem-vindo. Como posso ajudar você hoje?"
              rows={4}
              {...register('prompts.greeting', { required: true })}
            />
            <p className="text-xs text-muted-foreground">
              Primeira mensagem enviada ao cliente quando ele inicia uma conversa
            </p>
          </div>

          {showPreview && prompts?.greeting && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/10 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">{prompts.greeting}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt *</Label>
            <Textarea
              id="system_prompt"
              placeholder="Você é um assistente de vendas especializado..."
              rows={10}
              className="font-mono text-sm"
              {...register('prompts.system_prompt', { required: true })}
            />
            <p className="text-xs text-muted-foreground">
              Instruções gerais para o comportamento da IA. Suporta markdown.
            </p>
          </div>

          {showPreview && prompts?.system_prompt && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview (primeiras 500 chars)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {prompts.system_prompt.slice(0, 500)}
                  {prompts.system_prompt.length > 500 && '...'}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="objections" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Tratadores de Objeções</h4>
              <p className="text-xs text-muted-foreground">
                Scripts para responder objeções comuns
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddObjection}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(objectionHandlers).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo de Objeção</Label>
                        <Input
                          placeholder="Ex: preço, prazo, confiança"
                          value={key.replace('objection_', '')}
                          onChange={(e) => {
                            const newHandlers = { ...objectionHandlers };
                            delete newHandlers[key];
                            newHandlers[e.target.value] = value;
                            setValue('prompts.objection_handlers', newHandlers);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Script de Resposta</Label>
                        <Textarea
                          placeholder="Como responder quando o cliente menciona essa objeção..."
                          rows={3}
                          value={value}
                          onChange={(e) => setValue(`prompts.objection_handlers.${key}`, e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveObjection(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Object.keys(objectionHandlers).length === 0 && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Nenhum tratador de objeção configurado
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="qualification" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Critérios de Qualificação</h4>
              <p className="text-xs text-muted-foreground">
                Perguntas para qualificar leads com pesos
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddCriteria}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(qualificationCriteria).map(([key, criteria]) => (
              <Card key={key}>
                <CardContent className="pt-4">
                  <div className="flex gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Critério</Label>
                        <Input
                          placeholder="Ex: budget, timing"
                          value={key.replace('criteria_', '')}
                          onChange={(e) => {
                            const newCriteria = { ...qualificationCriteria };
                            delete newCriteria[key];
                            newCriteria[e.target.value] = criteria;
                            setValue('prompts.qualification_criteria', newCriteria);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Peso (0-100)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={criteria.weight}
                          onChange={(e) =>
                            setValue(`prompts.qualification_criteria.${key}.weight`, parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Pergunta</Label>
                        <Input
                          placeholder="Qual seu orçamento?"
                          value={criteria.question}
                          onChange={(e) =>
                            setValue(`prompts.qualification_criteria.${key}.question`, e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveCriteria(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Object.keys(qualificationCriteria).length === 0 && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Nenhum critério de qualificação configurado
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
