import { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Layers, GitMerge, Info, Sparkles, Plus, Minus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TemplateFormData, ComposedPrompts } from '@/types/templates';

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

// Intent detection patterns (mirrored from backend)
const OVERRIDE_PATTERNS = [
  /^(faça|seja|aja|atue|comporte-se|responda)\s/i,
  /^(você é|você será|seu papel é|seu nome é)/i,
  /^(sempre|obrigatoriamente|necessariamente)\s/i,
];

const EXCLUSION_PATTERNS = [
  /^(não|nunca|jamais|evite|ignore|remova)\s/i,
  /(não faça|não use|não mencione|não fale)/i,
  /(sem usar|sem mencionar|sem falar)/i,
];

type PromptIntent = 'extend' | 'exclude' | 'override';

function detectPromptIntent(line: string): PromptIntent {
  const trimmed = line.trim();
  if (!trimmed) return 'extend';

  if (EXCLUSION_PATTERNS.some(p => p.test(trimmed))) {
    return 'exclude';
  }
  if (OVERRIDE_PATTERNS.some(p => p.test(trimmed))) {
    return 'override';
  }
  return 'extend';
}

function analyzeContent(content: string) {
  const lines = content.trim().split('\n').filter(l => l.trim());
  return lines.map(line => ({
    line: line.trim(),
    intent: detectPromptIntent(line),
  }));
}

const INTENT_INFO = {
  extend: {
    label: 'Complemento',
    icon: Plus,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10 border-green-500/30',
  },
  exclude: {
    label: 'Exclusão',
    icon: Minus,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10 border-red-500/30',
  },
  override: {
    label: 'Substituição',
    icon: RefreshCw,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
  },
};

export function PromptCompositionEditor() {
  const { watch, setValue, getValues } = useFormContext<TemplateFormData>();
  const [activeTab, setActiveTab] = useState<string>('greeting');
  const [showPreview, setShowPreview] = useState(false);
  const [localContent, setLocalContent] = useState<Record<PromptSectionKey, string>>({
    greeting: '',
    system_prompt: '',
    objection_handlers: '',
    qualification_criteria: '',
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
      const updated = { ...localContent };
      for (const section of PROMPT_SECTIONS) {
        const comp = prompts.composition[section.key];
        if (comp?.content) {
          updated[section.key] = comp.content;
        }
      }
      setLocalContent(updated);
    }
  }, [prompts?.composition]);

  // Update form when content changes
  const updateContent = (section: PromptSectionKey, value: string) => {
    setLocalContent(prev => ({ ...prev, [section]: value }));
    
    const currentPrompts = getValues('prompts');
    const currentComposition = currentPrompts?.composition || {};
    
    setValue('prompts', {
      ...currentPrompts,
      composition: {
        ...currentComposition,
        [section]: {
          mode: 'extend', // Always use extend for intelligent composition
          content: value,
          excludes: [],
        },
      },
    } as typeof currentPrompts);
  };

  // Analyze content for each section
  const analysis = useMemo(() => {
    const result: Record<string, ReturnType<typeof analyzeContent>> = {};
    for (const section of PROMPT_SECTIONS) {
      result[section.key] = analyzeContent(localContent[section.key] || '');
    }
    return result;
  }, [localContent]);

  // Compose final prompt for preview
  const composePrompt = (section: PromptSectionKey): string => {
    const base = basePrompts[section] || '';
    const content = localContent[section] || '';
    
    if (!content.trim()) return base;
    if (!base.trim()) return content;

    const analyzed = analysis[section] || [];
    const extensions = analyzed.filter(a => a.intent === 'extend').map(a => a.line);
    const exclusions = analyzed.filter(a => a.intent === 'exclude').map(a => a.line);
    const overrides = analyzed.filter(a => a.intent === 'override').map(a => a.line);

    let result = base;

    // Mark exclusions
    exclusions.forEach(ex => {
      const target = ex.replace(/^(não|nunca|jamais|evite|ignore|remova)\s+/i, '')
                       .replace(/(faça|use|mencione|fale)\s*/i, '');
      const regex = new RegExp(target, 'gi');
      result = result.replace(regex, `~~$&~~`);
    });

    // Show overrides at top
    if (overrides.length > 0) {
      result = `🔄 **Substituições:**\n${overrides.join('\n')}\n\n---\n\n${result}`;
    }

    // Show extensions at bottom
    if (extensions.length > 0) {
      result = `${result}\n\n---\n\n✨ **Complementos:**\n${extensions.join('\n')}`;
    }

    return result;
  };

  const getContentStats = (section: PromptSectionKey) => {
    const analyzed = analysis[section] || [];
    return {
      extends: analyzed.filter(a => a.intent === 'extend').length,
      excludes: analyzed.filter(a => a.intent === 'exclude').length,
      overrides: analyzed.filter(a => a.intent === 'override').length,
      total: analyzed.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Composição Inteligente de Prompts
          </h3>
          <p className="text-sm text-muted-foreground">
            Escreva naturalmente - o sistema detecta automaticamente a intenção
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

      {/* Info Box - Simplified */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-2">Como funciona a composição inteligente</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Plus className="h-3 w-3 text-green-500" />
                  <span>Texto normal será <strong className="text-green-600">adicionado</strong> ao prompt base</span>
                </li>
                <li className="flex items-center gap-2">
                  <Minus className="h-3 w-3 text-red-500" />
                  <span>"Não faça X" ou "Evite X" será <strong className="text-red-600">removido</strong> do prompt base</span>
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 text-amber-500" />
                  <span>"Faça X", "Seja X" ou "Sempre X" <strong className="text-amber-600">substituirá</strong> comportamento similar</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {PROMPT_SECTIONS.map((section) => {
            const stats = getContentStats(section.key);
            return (
              <TabsTrigger key={section.key} value={section.key} className="relative">
                {section.label}
                {stats.total > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary/20 text-primary"
                  >
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PROMPT_SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key} className="space-y-4 mt-4">
            {/* Base Prompt Preview */}
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Prompt Base (Configurações Gerais)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-background/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                    {basePrompts[section.key as keyof BasePrompts] || '(não configurado)'}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitMerge className="h-4 w-4 text-primary" />
                  Instruções Específicas do Nicho
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`Digite instruções específicas para ${section.label.toLowerCase()}...

Exemplos:
• "Este é um e-commerce de moda feminina" (complementa)
• "Não use gírias nas respostas" (remove do base)
• "Sempre responda em português formal" (substitui)`}
                  rows={8}
                  className="font-mono text-sm"
                  value={localContent[section.key] || ''}
                  onChange={(e) => updateContent(section.key, e.target.value)}
                />

                {/* Real-time Intent Analysis */}
                {(analysis[section.key]?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Análise automática:</Label>
                    <div className="flex flex-wrap gap-2">
                      {analysis[section.key]?.map((item, idx) => {
                        const info = INTENT_INFO[item.intent];
                        const Icon = info.icon;
                        return (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded border text-xs flex items-center gap-1 ${info.bgColor}`}
                          >
                            <Icon className={`h-3 w-3 ${info.color}`} />
                            <span className="truncate max-w-[200px]" title={item.line}>
                              {item.line.length > 30 ? `${item.line.slice(0, 30)}...` : item.line}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
