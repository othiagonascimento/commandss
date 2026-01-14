import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, EyeOff, ChevronDown, Plus, X, Layers, GitMerge, Replace, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TemplateFormData, PromptMode, ComposedPrompts } from '@/types/templates';
import type { Json } from '@/integrations/supabase/types';

interface BasePrompts {
  greeting: string;
  system_prompt: string;
  objection_handlers: string;
  qualification_criteria: string;
}

const PROMPT_SECTIONS = [
  { key: 'greeting', label: 'Saudação', description: 'Primeira mensagem ao cliente' },
  { key: 'system_prompt', label: 'System Prompt', description: 'Instruções gerais para a IA' },
  { key: 'objection_handlers', label: 'Objeções', description: 'Scripts para objeções comuns' },
  { key: 'qualification_criteria', label: 'Qualificação', description: 'Critérios de qualificação' },
] as const;

type PromptSectionKey = typeof PROMPT_SECTIONS[number]['key'];

const MODE_INFO = {
  inherit: {
    label: 'Herdar',
    description: 'Usa exatamente o prompt base das configurações gerais',
    icon: Layers,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  extend: {
    label: 'Complementar',
    description: 'Adiciona conteúdo ao prompt base (qualidade garantida)',
    icon: GitMerge,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  override: {
    label: 'Substituir',
    description: 'Substitui completamente o prompt base',
    icon: Replace,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
};

export function PromptCompositionEditor() {
  const { watch, setValue, getValues } = useFormContext<TemplateFormData>();
  const [activeTab, setActiveTab] = useState<string>('greeting');
  const [showPreview, setShowPreview] = useState(false);
  const [expandedExclusions, setExpandedExclusions] = useState(false);
  const [localComposition, setLocalComposition] = useState<ComposedPrompts>({
    greeting: { mode: 'inherit', content: '', excludes: [] },
    system_prompt: { mode: 'inherit', content: '', excludes: [] },
    objection_handlers: { mode: 'inherit', content: '', excludes: [] },
    qualification_criteria: { mode: 'inherit', content: '', excludes: [] },
  });

  const prompts = watch('prompts');

  // Load base prompts from master_settings
  const { data: basePromptsData } = useQuery({
    queryKey: ['base-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_settings')
        .select('*')
        .eq('key', 'base_prompts')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.value) {
        const val = data.value as unknown as Record<string, unknown>;
        return {
          greeting: String(val.greeting || ''),
          system_prompt: String(val.system_prompt || ''),
          objection_handlers: String(val.objection_handlers || ''),
          qualification_criteria: String(val.qualification_criteria || ''),
        } as BasePrompts;
      }
      
      // Fallback to AI engine settings if base_prompts not found
      const { data: aiData, error: aiError } = await supabase
        .from('master_settings')
        .select('*')
        .eq('key', 'ai_global_engine')
        .single();
      
      if (aiError && aiError.code !== 'PGRST116') throw aiError;
      
      return {
        greeting: 'Olá! Bem-vindo. Como posso ajudar você hoje?',
        system_prompt: aiData?.ai_layer_2_instructions || 'Você é um assistente de vendas prestativo e profissional.',
        objection_handlers: 'Quando o cliente expressar objeções, valide o sentimento, faça perguntas de esclarecimento e apresente soluções.',
        qualification_criteria: 'Identifique: orçamento disponível, autoridade de decisão, necessidade real e timing de compra.',
      } as BasePrompts;
    },
  });

  const basePrompts = basePromptsData || {
    greeting: '',
    system_prompt: '',
    objection_handlers: '',
    qualification_criteria: '',
  };

  // Sync local state with form data
  useEffect(() => {
    if (prompts?.composition) {
      setLocalComposition(prompts.composition);
    }
  }, [prompts?.composition]);

  // Update form when local state changes
  const updateComposition = (section: PromptSectionKey, field: 'mode' | 'content' | 'excludes', value: unknown) => {
    const updated = {
      ...localComposition,
      [section]: {
        ...localComposition[section],
        [field]: value,
      },
    };
    setLocalComposition(updated);
    
    // Update form value using type assertion
    const currentPrompts = getValues('prompts');
    setValue('prompts', {
      ...currentPrompts,
      composition: updated,
    } as typeof currentPrompts);
    
    // Also update legacy field for backward compatibility
    if (field === 'content' && (section === 'greeting' || section === 'system_prompt')) {
      const mode = updated[section].mode;
      if (mode === 'override') {
        setValue(`prompts.${section}`, String(value));
      }
    }
  };

  // Helper functions for accessing composition data
  const getMode = (section: PromptSectionKey): PromptMode => {
    return localComposition[section]?.mode || 'inherit';
  };

  const getContent = (section: PromptSectionKey): string => {
    return localComposition[section]?.content || '';
  };

  const getExcludes = (section: PromptSectionKey): string[] => {
    return localComposition[section]?.excludes || [];
  };

  const setMode = (section: PromptSectionKey, mode: PromptMode) => {
    updateComposition(section, 'mode', mode);
  };

  const setContent = (section: PromptSectionKey, content: string) => {
    updateComposition(section, 'content', content);
  };

  const addExclusion = (section: PromptSectionKey) => {
    const current = getExcludes(section);
    updateComposition(section, 'excludes', [...current, '']);
  };

  const removeExclusion = (section: PromptSectionKey, index: number) => {
    const current = getExcludes(section);
    updateComposition(section, 'excludes', current.filter((_, i) => i !== index));
  };

  const updateExclusion = (section: PromptSectionKey, index: number, value: string) => {
    const current = getExcludes(section);
    const updated = [...current];
    updated[index] = value;
    updateComposition(section, 'excludes', updated);
  };

  // Compose the final prompt for preview
  const composePrompt = (section: PromptSectionKey): string => {
    const mode = getMode(section);
    const content = getContent(section);
    const excludes = getExcludes(section);
    const base = basePrompts[section] || '';

    let result = '';

    switch (mode) {
      case 'inherit':
        result = base;
        break;
      case 'extend':
        result = `${base}\n\n---\n\n### Adições do Template:\n${content}`;
        break;
      case 'override':
        result = content;
        break;
    }

    // Apply exclusions
    if (excludes.length > 0 && result) {
      excludes.forEach(exclusion => {
        if (exclusion.trim()) {
          // Mark exclusions with strikethrough for preview
          const regex = new RegExp(exclusion.trim(), 'gi');
          result = result.replace(regex, `~~$&~~`);
        }
      });
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            Composição de Prompts
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure como os prompts deste template interagem com as configurações gerais
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showPreview ? 'Ocultar Preview' : 'Ver Preview Composto'}
        </Button>
      </div>

      {/* Info Box */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Como funciona a composição inteligente</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li><strong className="text-blue-500">Herdar:</strong> Usa o prompt base das configurações gerais (recomendado para começar)</li>
                <li><strong className="text-green-500">Complementar:</strong> Adiciona instruções específicas do nicho ao prompt base</li>
                <li><strong className="text-amber-500">Substituir:</strong> Ignora o prompt base e usa apenas o definido aqui</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {PROMPT_SECTIONS.map((section) => (
            <TabsTrigger key={section.key} value={section.key} className="relative">
              {section.label}
              {getMode(section.key) !== 'inherit' && (
                <Badge 
                  variant="secondary" 
                  className={`absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] ${
                    getMode(section.key) === 'extend' ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/20 text-amber-600'
                  }`}
                >
                  {getMode(section.key) === 'extend' ? '+' : '↻'}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {PROMPT_SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key} className="space-y-4 mt-4">
            {/* Mode Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Modo de Composição</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={getMode(section.key)}
                  onValueChange={(value) => setMode(section.key, value as PromptMode)}
                  className="grid grid-cols-3 gap-4"
                >
                  {(Object.entries(MODE_INFO) as [PromptMode, typeof MODE_INFO.inherit][]).map(([mode, info]) => {
                    const Icon = info.icon;
                    return (
                      <Label
                        key={mode}
                        htmlFor={`${section.key}-${mode}`}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          getMode(section.key) === mode 
                            ? `border-primary ${info.bgColor}` 
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <RadioGroupItem value={mode} id={`${section.key}-${mode}`} className="sr-only" />
                        <Icon className={`h-5 w-5 ${info.color}`} />
                        <span className="font-medium text-sm">{info.label}</span>
                        <span className="text-xs text-muted-foreground text-center">{info.description}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Base Prompt Preview (for inherit/extend modes) */}
            {getMode(section.key) !== 'override' && (
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    Prompt Base (Configurações Gerais)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-background/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                      {basePrompts[section.key as keyof BasePrompts] || '(não configurado)'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Editor (for extend/override modes) */}
            {getMode(section.key) !== 'inherit' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getMode(section.key) === 'extend' ? (
                      <>
                        <GitMerge className="h-4 w-4 text-green-500" />
                        Adicionar ao Prompt Base
                      </>
                    ) : (
                      <>
                        <Replace className="h-4 w-4 text-amber-500" />
                        Substituir Prompt Completo
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={
                      getMode(section.key) === 'extend'
                        ? 'Adicione instruções específicas para este nicho...'
                        : 'Escreva o prompt completo que substituirá o base...'
                    }
                    rows={8}
                    className="font-mono text-sm"
                    value={getContent(section.key)}
                    onChange={(e) => setContent(section.key, e.target.value)}
                  />

                  {/* Exclusions */}
                  <Collapsible open={expandedExclusions} onOpenChange={setExpandedExclusions}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Exclusões ({getExcludes(section.key).filter(e => e.trim()).length})
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedExclusions ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      <p className="text-xs text-muted-foreground">
                        Termos ou frases do prompt base que devem ser ignorados (ex: "não use gírias", "evite emojis")
                      </p>
                      {getExcludes(section.key).map((exclusion, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder='Ex: "sempre use emojis"'
                            value={exclusion}
                            onChange={(e) => updateExclusion(section.key, index, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExclusion(section.key, index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addExclusion(section.key)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Exclusão
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}

            {/* Composed Preview */}
            {showPreview && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Preview do Prompt Final
                  </CardTitle>
                  <CardDescription>
                    Este é o prompt que será enviado à IA após a composição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-background rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {composePrompt(section.key) || '(vazio)'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
