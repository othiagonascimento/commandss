// Types for Niche Template Manager

export interface FunnelStage {
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface TagCategory {
  name: string;
  color: string;
  tags: string[];
}

export interface QuickReply {
  id: string;
  label: string;
  trigger: string;
  message: string;
  technique: string;
}

export interface ObjectionHandler {
  [key: string]: string;
}

export interface QualificationCriterion {
  weight: number;
  question: string;
}

export interface Prompts {
  greeting: string;
  system_prompt: string;
  objection_handlers: ObjectionHandler;
  qualification_criteria: Record<string, QualificationCriterion>;
}

export interface AIConfig {
  personality: string;
  mode: 'autonomous' | 'copilot' | 'suggestion';
  temperature: number;
  max_tokens?: number;
  techniques: string[];
}

export interface AutomationTrigger {
  type: string;
  hours?: number;
  value?: string | number;
}

export interface AutomationAction {
  type: string;
  message?: string;
}

export interface AutomationFlow {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  is_active?: boolean;
}

export interface SLAConfig {
  first_response_minutes: number;
  follow_up_hours: number;
  escalation_hours: number;
  working_hours: {
    start: string;
    end: string;
  };
  working_days: number[];
}

export interface ProductCategory {
  name: string;
  description: string;
  icon: string;
}

export interface TemplateData {
  slug: string;
  name: string;
  description?: string;
  category: 'universal' | 'vendas' | 'custom';
  icon: string;
  is_base_template: boolean;
  parent_template_id?: string;
  funnel_config: {
    stages: FunnelStage[];
  };
  tags: {
    categories: TagCategory[];
  };
  quick_replies_config: QuickReply[];
  prompts: Prompts;
  ai_config: AIConfig;
  automation_flows_config: AutomationFlow[];
  sla_config: SLAConfig;
  product_categories: ProductCategory[];
}

export interface Template {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  is_base_template: boolean;
  parent_template_id?: string;
  version: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  subscriber_count?: number;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version: string;
  changelog: string;
  published_by: string;
  published_at: string;
  data_snapshot: TemplateData;
}

export interface TemplateSubscriber {
  tenant_id: string;
  tenant_name: string;
  subscribed_at: string;
  last_synced_at?: string;
  has_overrides: boolean;
  overridden_sections: string[];
}

export interface SyncResult {
  tenant_id: string;
  tenant_name?: string;
  status: 'success' | 'skipped' | 'error';
  applied?: string[];
  skipped?: string[];
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  version: string;
  results: {
    total: number;
    synced: number;
    skipped: number;
    errors: number;
    details: SyncResult[];
  };
}

export interface PublishResponse {
  success: boolean;
  template_id: string;
  version: string;
  action: 'created' | 'updated';
}

// Form data structure for React Hook Form
export interface TemplateFormData {
  slug: string;
  name: string;
  description: string;
  category: 'universal' | 'vendas' | 'custom';
  icon: string;
  is_base_template: boolean;
  parent_template_id?: string;
  funnel_stages: FunnelStage[];
  tag_categories: TagCategory[];
  quick_replies: QuickReply[];
  prompts: {
    greeting: string;
    system_prompt: string;
    objection_handlers: Record<string, string>;
    qualification_criteria: Record<string, QualificationCriterion>;
  };
  ai_config: {
    personality: string;
    mode: 'autonomous' | 'copilot' | 'suggestion';
    temperature: number;
    techniques: string[];
  };
  automations: Array<{
    id: string;
    name: string;
    trigger_type: string;
    trigger_value: number;
    action_type: string;
    action_message: string;
    is_active: boolean;
  }>;
  sla: {
    first_response_minutes: number;
    follow_up_hours: number;
    escalation_hours: number;
    working_hours_start: string;
    working_hours_end: string;
    working_days: number[];
  };
  product_categories: ProductCategory[];
}

// Default values for new template
export const defaultTemplateFormData: TemplateFormData = {
  slug: '',
  name: '',
  description: '',
  category: 'universal',
  icon: '📋',
  is_base_template: false,
  funnel_stages: [
    { name: 'Novo Lead', slug: 'novo', color: '#3B82F6', sort_order: 1, is_won: false, is_lost: false },
    { name: 'Em Negociação', slug: 'negociacao', color: '#F59E0B', sort_order: 2, is_won: false, is_lost: false },
    { name: 'Fechado Ganho', slug: 'ganho', color: '#10B981', sort_order: 3, is_won: true, is_lost: false },
    { name: 'Fechado Perdido', slug: 'perdido', color: '#EF4444', sort_order: 4, is_won: false, is_lost: true },
  ],
  tag_categories: [
    { name: 'Interesse', color: '#10B981', tags: ['alto', 'médio', 'baixo'] },
  ],
  quick_replies: [
    { id: 'qr_1', label: 'Saudação', trigger: 'oi', message: 'Olá! Como posso ajudar você hoje?', technique: 'Rapport' },
  ],
  prompts: {
    greeting: 'Olá! Bem-vindo. Como posso ajudar?',
    system_prompt: 'Você é um assistente de vendas prestativo e profissional.',
    objection_handlers: {},
    qualification_criteria: {},
  },
  ai_config: {
    personality: 'Consultor amigável e prestativo',
    mode: 'copilot',
    temperature: 0.7,
    techniques: ['rapport'],
  },
  automations: [],
  sla: {
    first_response_minutes: 5,
    follow_up_hours: 24,
    escalation_hours: 48,
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
  },
  product_categories: [],
};
