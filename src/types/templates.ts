// Types for Niche Template Manager - Uôpa AI Training Platform

// ==================== Base Types ====================

export interface FunnelStage {
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
  is_system?: boolean; // System stages cannot be removed or have their is_won/is_lost changed
  // Enhanced fields
  objective?: string;
  criteria_to_advance?: string[];
  max_time_hours?: number;
  stage_prompt?: string;
  auto_actions?: string[];
}

export interface TagCategory {
  name: string;
  color: string;
  tags: string[];
}

export interface QuickReply {
  id: string;
  label: string;
  title?: string;
  trigger: string;
  message: string;
  content?: string;
  technique: string;
  category?: string;
  context_tags?: string[];
  tags?: string[];
  variations?: string[];
}

export interface ObjectionHandler {
  id?: string;
  objection?: string;
  root_cause?: string;
  responses?: ObjectionResponse[];
  [key: string]: string | ObjectionResponse[] | undefined;
}

export interface QualificationCriterion {
  weight: number;
  question: string;
}

// ==================== Enhanced Types ====================

// Business Context for Template Identity
export interface BusinessContext {
  business_type: 'B2B' | 'B2C' | 'D2C' | 'B2B2C';
  market_segment: string;
  average_ticket: number;
  sales_cycle_days: number;
  value_proposition: string;
  competitive_advantages: string[];
  target_audience: string;
  main_products_services: string;
}

// Customer Personas
export interface CustomerPersona {
  id: string;
  name: string;
  demographic_profile: string;
  main_pains: string[];
  purchase_motivations: string[];
  typical_objections: string[];
  approach_strategy: string;
  preferred_communication_style: string;
  avatar_emoji: string;
}

// Conversation Examples for Few-shot learning
export interface ConversationMessage {
  role: 'customer' | 'agent';
  content: string;
  annotation?: string;
}

export interface ConversationExample {
  id: string;
  title: string;
  context: string;
  messages: ConversationMessage[];
  outcome: 'success' | 'objection_handled' | 'qualified' | 'scheduled' | 'lost';
  tags: string[];
}

// FAQ Item for Knowledge Base
export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

// AI Agents Configuration
export interface AIAgent {
  id: string;
  name: string;
  type?: 'qualification' | 'followup' | 'closing' | 'post_sale' | 'support' | 'custom';
  description: string;
  objective: string;
  prompt: string;
  temperature: number;
  allowed_actions: string[];
  transfer_rules: string[];
  triggers?: string[];
  is_active: boolean;
  icon?: string;
}

// Copilot Mode Configuration
export interface CopilotConfig {
  assistance_level: 'suggestion' | 'draft' | 'autocomplete';
  suggestion_triggers: string[];
  suggestion_format: 'bullet' | 'prose' | 'options';
  options_count: 1 | 2 | 3;
  response_speed: 'fast' | 'balanced' | 'elaborate';
  no_suggest_rules: string[];
  human_transition_phrases: string[];
  confidence_threshold: number;
  is_enabled: boolean;
}

// Insights Mode Configuration
export interface AutomaticAlert {
  id: string;
  condition: string;
  action: string;
  is_active: boolean;
}

export interface QualificationWeight {
  criterion: string;
  weight: number;
}

export interface InsightsConfig {
  metrics_to_track: string[];
  automatic_alerts: AutomaticAlert[];
  qualification_score_weights: QualificationWeight[];
  intent_detection_enabled: boolean;
  sentiment_analysis_enabled: boolean;
  competitor_detection_enabled: boolean;
  auto_summary_enabled: boolean;
  suggested_tags_enabled: boolean;
  auto_tags_enabled: boolean;
}

// Sales Methodologies
export interface MethodologyStep {
  name: string;
  description: string;
  questions: string[];
  success_indicators: string[];
}

export interface SalesMethodology {
  id: string;
  name: string;
  description: string;
  steps: MethodologyStep[];
  is_active: boolean;
}

// Enhanced Objection Handler
export interface ObjectionResponse {
  content: string;
  intensity: 'soft' | 'moderate' | 'strong';
}

export interface EnhancedObjectionHandler {
  id: string;
  objection: string;
  objection_type?: string;
  root_cause: string;
  severity?: 'light' | 'moderate' | 'strong';
  responses: ObjectionResponse[];
  follow_up_questions?: string[];
  avoid_phrases?: string[];
}

// Closing Scripts
export interface ClosingScript {
  id: string;
  name: string;
  type: 'assumptive' | 'alternative' | 'urgency' | 'summary' | 'trial' | 'custom';
  content: string;
  script?: string;
  best_for?: string;
  transition_phrases: string[];
}

// Product/Service Details
export interface Product {
  id: string;
  name: string;
  description: string;
  price_range: { min: number; max: number };
  benefits: string[];
  features?: string[];
  common_objections: string[];
  complementary_products: string[];
  faq: FAQItem[];
  keywords?: string[];
}

// Knowledge Article
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

// Competitor Info
export interface Competitor {
  id: string;
  name: string;
  strengths?: string[];
  weaknesses?: string[];
  differentiators: string[];
  response_when_mentioned: string;
}

// Escalation Rules
export interface EscalationRule {
  id: string;
  name?: string;
  condition: string;
  escalate_to: string;
  transition_message: string;
  max_time_without_human: number;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  is_active?: boolean;
}

// Success Metrics / KPIs
export interface SuccessMetric {
  id: string;
  name: string;
  target_value: number;
  unit: 'percent' | 'number' | 'seconds' | 'minutes';
  measurement_period?: 'daily' | 'weekly' | 'monthly';
  description?: string;
}

// Operating Hours
export interface OperatingHours {
  respect_business_hours: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
  working_days: number[];
  off_hours_message: string;
}

// Prohibited Phrases
export interface ProhibitedPhrase {
  id?: string;
  phrase: string;
  reason: string;
  alternative: string;
}

// ==================== Prompt Composition Types ====================

export type PromptMode = 'inherit' | 'extend' | 'override';

export interface PromptSection {
  mode: PromptMode;
  content: string;
  excludes?: string[];
}

export interface ComposedPrompts {
  greeting: PromptSection;
  system_prompt: PromptSection;
  objection_handlers: PromptSection;
  qualification_criteria: PromptSection;
}

// Legacy prompts interface (for backward compatibility)
export interface Prompts {
  greeting: string;
  system_prompt: string;
  objection_handlers: ObjectionHandler;
  qualification_criteria: Record<string, QualificationCriterion>;
  // Composition metadata (optional)
  composition?: ComposedPrompts;
}

export interface AIConfig {
  personality: string;
  mode: 'autonomous' | 'copilot' | 'suggestion';
  temperature: number;
  max_tokens?: number;
  techniques: string[];
}

// ==================== Automation Types ====================

export interface AutomationTrigger {
  type: string;
  hours?: number;
  value?: string | number;
  condition?: string;
}

export interface AutomationAction {
  type: string;
  message?: string;
  target?: string;
  metadata?: Record<string, any>;
}

export interface AutomationFlow {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  conditions?: string[];
  is_active?: boolean;
}

// ==================== SLA Types ====================

export interface SLAConfig {
  first_response_minutes: number;
  first_response_seconds?: number;
  resolution_minutes?: number;
  idle_timeout_minutes?: number;
  max_ai_messages?: number;
  follow_up_hours: number;
  escalation_hours: number;
  working_hours: {
    start: string;
    end: string;
  };
  working_days: number[];
}

export interface OperationsConfig extends SLAConfig {
  escalation_rules: EscalationRule[];
  success_metrics: SuccessMetric[];
  out_of_hours_message: string;
  queue_priority_rules: string[];
}

// ==================== Product Types ====================

export interface ProductCategory {
  name: string;
  description: string;
  icon: string;
}

// ==================== Main Template Data ====================

export interface UopaAICoreConfig {
  // Personality & Voice
  tone_of_voice: 'formal' | 'casual' | 'technical' | 'friendly' | 'consultative';
  proactivity_level: 'low' | 'medium' | 'high';
  communication_style: 'direct' | 'consultative' | 'educational' | 'empathetic';
  language_regionalism: string;
  
  // AI Engine Layers (3 layers)
  layer_1_model?: string;
  layer_2_model?: string;
  layer_3_model?: string;
  
  // Context
  business_context: BusinessContext;
  personas: CustomerPersona[];
  
  // Knowledge
  knowledge_base: FAQItem[];
  conversation_examples: ConversationExample[];
  
  // Boundaries
  prohibited_phrases: ProhibitedPhrase[];
  confidential_topics: string[];
}

export interface PlaybookConfig {
  methodologies: SalesMethodology[];
  quick_replies: QuickReply[];
  objection_handlers: EnhancedObjectionHandler[];
  closing_scripts: ClosingScript[];
}

export interface CatalogConfig {
  categories: ProductCategory[];
  products: Product[];
  competitors: Competitor[];
  general_policies: FAQItem[];
}

export interface TemplateData {
  slug: string;
  name: string;
  description?: string;
  category: 'universal' | 'vendas' | 'custom';
  icon: string;
  is_base_template: boolean;
  parent_template_id?: string;
  
  // Core Configurations
  funnel_config: {
    stages: FunnelStage[];
  };
  tags: {
    categories: TagCategory[];
  };
  prompts: Prompts;
  ai_config: AIConfig;
  
  // Enhanced Configurations (Uôpa AI Platform)
  uopa_ai_core?: UopaAICoreConfig;
  copilot_config?: CopilotConfig;
  insights_config?: InsightsConfig;
  agents_config?: AIAgent[];
  playbook_config?: PlaybookConfig;
  operations_config?: OperationsConfig;
  catalog_config?: CatalogConfig;
  
  // Legacy (for backward compatibility)
  quick_replies_config: QuickReply[];
  automation_flows_config: AutomationFlow[];
  sla_config: SLAConfig;
  product_categories: ProductCategory[];
}

// ==================== API Response Types ====================

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

// ==================== Form Data Structure ====================

export interface TemplateFormData {
  // Identity
  slug: string;
  name: string;
  description: string;
  category: 'universal' | 'vendas' | 'custom';
  icon: string;
  is_base_template: boolean;
  parent_template_id?: string;
  
  // Business Context
  business_context: BusinessContext;
  
  // Funnel
  funnel_stages: FunnelStage[];
  tag_categories: TagCategory[];
  
  // Uôpa AI Core
  uopa_ai_core: {
    tone_of_voice: 'formal' | 'casual' | 'technical' | 'friendly' | 'consultative';
    proactivity_level: 'low' | 'medium' | 'high';
    communication_style: 'direct' | 'consultative' | 'educational' | 'empathetic';
    language_regionalism: string;
    layer_1_model?: string;
    layer_2_model?: string;
    layer_3_model?: string;
    personas: CustomerPersona[];
    knowledge_base: FAQItem[];
    conversation_examples: ConversationExample[];
    prohibited_phrases: ProhibitedPhrase[];
    confidential_topics: string[];
  };
  
  // Copilot Config
  copilot_config: CopilotConfig;
  
  // Insights Config
  insights_config: InsightsConfig;
  
  // Agents
  agents: AIAgent[];
  
  // Playbook
  playbook: {
    methodologies: SalesMethodology[];
    objection_handlers: EnhancedObjectionHandler[];
    closing_scripts: ClosingScript[];
  };
  
  // Legacy prompts & quick replies (for compatibility)
  quick_replies: QuickReply[];
  prompts: {
    greeting: string;
    system_prompt: string;
    objection_handlers: Record<string, string>;
    qualification_criteria: Record<string, QualificationCriterion>;
    // Composition metadata
    composition?: ComposedPrompts;
  };
  ai_config: {
    personality: string;
    mode: 'autonomous' | 'copilot' | 'suggestion';
    temperature: number;
    techniques: string[];
  };
  
  // Automations
  automations: Array<{
    id: string;
    name: string;
    description?: string;
    trigger_type: string;
    trigger_value: number;
    trigger_condition?: string;
    action_type: string;
    action_message: string;
    action_target?: string;
    is_active: boolean;
  }>;
  
  // Operations
  operations: {
    sla: {
      first_response_minutes: number;
      follow_up_hours: number;
      escalation_hours: number;
      working_hours_start: string;
      working_hours_end: string;
      working_days: number[];
    };
    escalation_rules: EscalationRule[];
    success_metrics: SuccessMetric[];
    out_of_hours_message: string;
  };
  
  // Catalog
  catalog: {
    categories: ProductCategory[];
    products: Product[];
    competitors: Competitor[];
    general_policies: FAQItem[];
  };
  
  // Legacy
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

// ==================== Default Values ====================

export const defaultBusinessContext: BusinessContext = {
  business_type: 'B2C',
  market_segment: '',
  average_ticket: 0,
  sales_cycle_days: 7,
  value_proposition: '',
  competitive_advantages: [],
  target_audience: '',
  main_products_services: '',
};

export const defaultCopilotConfig: CopilotConfig = {
  is_enabled: true,
  assistance_level: 'suggestion',
  suggestion_triggers: ['pergunta detectada', 'objeção detectada', 'inatividade 30s'],
  suggestion_format: 'options',
  options_count: 2,
  response_speed: 'balanced',
  no_suggest_rules: [],
  human_transition_phrases: ['Vou verificar isso com nosso especialista', 'Um momento, vou consultar'],
  confidence_threshold: 0.7,
};

export const defaultInsightsConfig: InsightsConfig = {
  metrics_to_track: ['tempo_resposta', 'sentimento', 'intencao_compra', 'qualificacao'],
  automatic_alerts: [],
  qualification_score_weights: [
    { criterion: 'budget', weight: 30 },
    { criterion: 'authority', weight: 25 },
    { criterion: 'need', weight: 25 },
    { criterion: 'timing', weight: 20 },
  ],
  intent_detection_enabled: true,
  sentiment_analysis_enabled: true,
  competitor_detection_enabled: false,
  auto_summary_enabled: true,
  suggested_tags_enabled: true,
  auto_tags_enabled: false,
};

export const defaultTemplateFormData: TemplateFormData = {
  slug: '',
  name: '',
  description: '',
  category: 'universal',
  icon: '📋',
  is_base_template: false,
  
  business_context: defaultBusinessContext,
  
  funnel_stages: [
    { name: 'Novos', slug: 'novos', color: '#3B82F6', sort_order: 1, is_won: false, is_lost: false, is_system: true },
    { name: 'Frio', slug: 'frio', color: '#06B6D4', sort_order: 2, is_won: false, is_lost: false },
    { name: 'Morno', slug: 'morno', color: '#F59E0B', sort_order: 3, is_won: false, is_lost: false },
    { name: 'Quente', slug: 'quente', color: '#EF4444', sort_order: 4, is_won: false, is_lost: false },
    { name: 'Ganho', slug: 'ganho', color: '#10B981', sort_order: 5, is_won: true, is_lost: false, is_system: true },
    { name: 'Perdido', slug: 'perdido', color: '#6B7280', sort_order: 6, is_won: false, is_lost: true, is_system: true },
  ],
  tag_categories: [
    { name: 'Interesse', color: '#10B981', tags: ['alto', 'médio', 'baixo'] },
  ],
  
  uopa_ai_core: {
    tone_of_voice: 'friendly',
    proactivity_level: 'medium',
    communication_style: 'consultative',
    language_regionalism: 'pt-BR',
    personas: [],
    knowledge_base: [],
    conversation_examples: [],
    prohibited_phrases: [],
    confidential_topics: [],
  },
  
  copilot_config: defaultCopilotConfig,
  insights_config: defaultInsightsConfig,
  
  agents: [],
  
  playbook: {
    methodologies: [],
    objection_handlers: [],
    closing_scripts: [],
  },
  
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
  
  operations: {
    sla: {
      first_response_minutes: 5,
      follow_up_hours: 24,
      escalation_hours: 48,
      working_hours_start: '08:00',
      working_hours_end: '18:00',
      working_days: [1, 2, 3, 4, 5],
    },
    escalation_rules: [],
    success_metrics: [],
    out_of_hours_message: 'Obrigado pelo contato! Retornaremos em breve durante nosso horário comercial.',
  },
  
  catalog: {
    categories: [],
    products: [],
    competitors: [],
    general_policies: [],
  },
  
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
