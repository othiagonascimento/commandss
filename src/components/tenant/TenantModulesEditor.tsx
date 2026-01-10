import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Mic, 
  Workflow, 
  Send, 
  ShoppingCart, 
  Database, 
  Code, 
  Palette, 
  Smartphone 
} from 'lucide-react';

interface TenantModulesEditorProps {
  modules: {
    module_ai_agent: boolean;
    module_ai_transcription: boolean;
    module_automation_flows: boolean;
    module_campaigns: boolean;
    module_ecommerce: boolean;
    module_erp_integration: boolean;
    module_api_access: boolean;
    module_whitelabel: boolean;
    module_multi_whatsapp: boolean;
  };
  onChange: (modules: TenantModulesEditorProps['modules']) => void;
  disabled?: boolean;
}

const moduleConfig = [
  {
    key: 'module_ai_agent',
    label: 'IA de Atendimento',
    description: 'Habilita o agente de IA para atendimento automatizado',
    icon: Bot,
    category: 'IA',
  },
  {
    key: 'module_ai_transcription',
    label: 'Transcrição de Áudio',
    description: 'Permite transcrever áudios recebidos automaticamente',
    icon: Mic,
    category: 'IA',
  },
  {
    key: 'module_automation_flows',
    label: 'Fluxos de Automação',
    description: 'Crie automações e workflows personalizados',
    icon: Workflow,
    category: 'Comunicação',
  },
  {
    key: 'module_campaigns',
    label: 'Campanhas e Disparos',
    description: 'Envie mensagens em massa e campanhas de marketing',
    icon: Send,
    category: 'Comunicação',
  },
  {
    key: 'module_ecommerce',
    label: 'Catálogo de Produtos',
    description: 'Gerencie produtos e catálogo de vendas',
    icon: ShoppingCart,
    category: 'Vendas',
  },
  {
    key: 'module_erp_integration',
    label: 'Integração ERP',
    description: 'Conecte com sistemas ERP externos',
    icon: Database,
    category: 'Integrações',
  },
  {
    key: 'module_api_access',
    label: 'Acesso à API',
    description: 'Permite acesso programático via API REST',
    icon: Code,
    category: 'Integrações',
  },
  {
    key: 'module_whitelabel',
    label: 'Marca Branca',
    description: 'Remove branding Uopa e permite personalização completa',
    icon: Palette,
    category: 'Premium',
  },
  {
    key: 'module_multi_whatsapp',
    label: 'Multi-WhatsApp',
    description: 'Conecte múltiplas instâncias de WhatsApp',
    icon: Smartphone,
    category: 'Premium',
  },
] as const;

const categoryColors: Record<string, string> = {
  'IA': 'bg-purple-500/10 text-purple-500',
  'Comunicação': 'bg-blue-500/10 text-blue-500',
  'Vendas': 'bg-green-500/10 text-green-500',
  'Integrações': 'bg-orange-500/10 text-orange-500',
  'Premium': 'bg-amber-500/10 text-amber-500',
};

export function TenantModulesEditor({ modules, onChange, disabled }: TenantModulesEditorProps) {
  const [localModules, setLocalModules] = useState(modules);

  const handleToggle = (key: keyof typeof modules) => {
    const updated = { ...localModules, [key]: !localModules[key] };
    setLocalModules(updated);
    onChange(updated);
  };

  // Group modules by category
  const groupedModules = moduleConfig.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof moduleConfig[number][]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Módulos Habilitados
        </CardTitle>
        <CardDescription>
          Configure quais funcionalidades estão disponíveis para este tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedModules).map(([category, categoryModules]) => (
          <div key={category} className="space-y-3">
            <Badge variant="outline" className={categoryColors[category]}>
              {category}
            </Badge>
            <div className="grid gap-4">
              {categoryModules.map((module) => {
                const Icon = module.icon;
                const isEnabled = localModules[module.key as keyof typeof modules];
                
                return (
                  <div
                    key={module.key}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`w-5 h-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <Label htmlFor={module.key} className="font-medium cursor-pointer">
                          {module.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    <Switch
                      id={module.key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(module.key as keyof typeof modules)}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
