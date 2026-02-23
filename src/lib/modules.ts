import {
  Bot,
  Mic,
  Workflow,
  Send,
  ShoppingCart,
  Database,
  Code,
  Palette,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleConfig {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: string;
}

export const moduleConfig: ModuleConfig[] = [
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
];

export const categoryColors: Record<string, string> = {
  'IA': 'bg-purple-500/10 text-purple-500',
  'Comunicação': 'bg-blue-500/10 text-blue-500',
  'Vendas': 'bg-green-500/10 text-green-500',
  'Integrações': 'bg-orange-500/10 text-orange-500',
  'Premium': 'bg-amber-500/10 text-amber-500',
};

export function groupModulesByCategory(modules: ModuleConfig[] = moduleConfig) {
  return modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModuleConfig[]>);
}
