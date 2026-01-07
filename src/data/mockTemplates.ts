import type { Template, TemplateData, TemplateVersion, TemplateSubscriber, SyncResponse } from '@/types/templates';

// Mock Templates Data
export const mockTemplates: Template[] = [
  {
    id: 'tpl_001',
    slug: 'vendas-pro',
    name: 'Vendas Pro',
    description: 'Template universal de vendas com funil completo, respostas rápidas e automações de follow-up.',
    category: 'universal',
    icon: '🚀',
    is_base_template: true,
    version: '2.3',
    created_at: '2025-06-15T10:00:00Z',
    updated_at: '2026-01-05T14:30:00Z',
    published_at: '2026-01-05T14:30:00Z',
    subscriber_count: 45,
  },
  {
    id: 'tpl_002',
    slug: 'veiculos',
    name: 'Template Veículos',
    description: 'Especializado em concessionárias e revendas de veículos. Inclui etapas de test drive e financiamento.',
    category: 'vendas',
    icon: '🚗',
    is_base_template: false,
    parent_template_id: 'tpl_001',
    version: '1.8',
    created_at: '2025-08-20T09:00:00Z',
    updated_at: '2026-01-02T11:00:00Z',
    published_at: '2026-01-02T11:00:00Z',
    subscriber_count: 12,
  },
  {
    id: 'tpl_003',
    slug: 'imobiliario',
    name: 'Template Imobiliário',
    description: 'Para corretores e imobiliárias. Funil com visitas, propostas e documentação.',
    category: 'vendas',
    icon: '🏠',
    is_base_template: false,
    parent_template_id: 'tpl_001',
    version: '1.5',
    created_at: '2025-09-10T08:00:00Z',
    updated_at: '2025-12-20T16:00:00Z',
    published_at: '2025-12-20T16:00:00Z',
    subscriber_count: 8,
  },
  {
    id: 'tpl_004',
    slug: 'ecommerce',
    name: 'E-commerce',
    description: 'Para lojas online. Integração com carrinho abandonado e pós-venda.',
    category: 'vendas',
    icon: '🛒',
    is_base_template: false,
    version: '1.2',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-12-15T09:00:00Z',
    subscriber_count: 23,
  },
  {
    id: 'tpl_005',
    slug: 'saas-b2b',
    name: 'SaaS B2B',
    description: 'Para empresas de software. Funil com demo, trial e onboarding.',
    category: 'custom',
    icon: '💼',
    is_base_template: true,
    version: '1.0',
    created_at: '2025-12-01T14:00:00Z',
    updated_at: '2025-12-28T10:00:00Z',
    subscriber_count: 5,
  },
];

// Mock Template Full Data
export const mockTemplateData: Record<string, TemplateData> = {
  'tpl_001': {
    slug: 'vendas-pro',
    name: 'Vendas Pro',
    description: 'Template universal de vendas com funil completo, respostas rápidas e automações de follow-up.',
    category: 'universal',
    icon: '🚀',
    is_base_template: true,
    funnel_config: {
      stages: [
        { name: 'Novo Lead', slug: 'novo', color: '#3B82F6', sort_order: 1, is_won: false, is_lost: false },
        { name: 'Qualificado', slug: 'qualificado', color: '#8B5CF6', sort_order: 2, is_won: false, is_lost: false },
        { name: 'Em Negociação', slug: 'negociacao', color: '#F59E0B', sort_order: 3, is_won: false, is_lost: false },
        { name: 'Proposta Enviada', slug: 'proposta', color: '#06B6D4', sort_order: 4, is_won: false, is_lost: false },
        { name: 'Fechado Ganho', slug: 'ganho', color: '#10B981', sort_order: 5, is_won: true, is_lost: false },
        { name: 'Fechado Perdido', slug: 'perdido', color: '#EF4444', sort_order: 6, is_won: false, is_lost: true },
      ],
    },
    tags: {
      categories: [
        { name: 'Interesse', color: '#10B981', tags: ['alto', 'médio', 'baixo'] },
        { name: 'Urgência', color: '#F59E0B', tags: ['imediato', 'esta semana', 'este mês', 'futuro'] },
        { name: 'Origem', color: '#3B82F6', tags: ['site', 'indicação', 'anúncio', 'orgânico'] },
      ],
    },
    quick_replies_config: [
      { id: 'qr_01', label: 'Saudação', trigger: 'oi|olá|bom dia', message: 'Olá! 👋 Seja bem-vindo! Como posso ajudar você hoje?', technique: 'Rapport' },
      { id: 'qr_02', label: 'Preço', trigger: 'quanto custa|preço|valor', message: 'Ótima pergunta! Para te passar o melhor preço, preciso entender melhor suas necessidades. Pode me contar mais sobre o que você procura?', technique: 'Qualificação' },
      { id: 'qr_03', label: 'Prazo', trigger: 'prazo|entrega|quando', message: 'Trabalhamos com prazos flexíveis! Qual seria a sua urgência?', technique: 'Qualificação' },
      { id: 'qr_04', label: 'Formas de Pagamento', trigger: 'pagamento|parcela|pix', message: 'Aceitamos PIX, cartão (até 12x) e boleto. Qual forma seria melhor para você?', technique: 'Fechamento' },
    ],
    prompts: {
      greeting: 'Olá! 👋 Bem-vindo! Sou seu assistente virtual. Como posso ajudar você hoje?',
      system_prompt: `Você é um assistente de vendas especializado e prestativo.

## Diretrizes:
- Seja sempre cordial e profissional
- Faça perguntas para qualificar o lead
- Use técnicas de SPIN selling quando apropriado
- Nunca pressione o cliente, guie-o naturalmente
- Sempre busque agendar uma próxima ação

## Tom de voz:
- Amigável mas profissional
- Confiante sem ser arrogante
- Prestativo e paciente`,
      objection_handlers: {
        'preco': 'Entendo sua preocupação com o investimento. Vamos ver juntos como esse valor se paga rapidamente com os benefícios que você terá?',
        'prazo': 'Compreendo a urgência! Deixa eu verificar o que consigo fazer para atender seu prazo.',
        'concorrente': 'Que bom que está pesquisando! Posso te mostrar nossos diferenciais para você fazer a melhor escolha?',
      },
      qualification_criteria: {
        'budget': { weight: 30, question: 'Qual o orçamento disponível para esse projeto?' },
        'authority': { weight: 25, question: 'Você é o decisor ou precisa consultar alguém?' },
        'need': { weight: 25, question: 'Qual problema principal você quer resolver?' },
        'timing': { weight: 20, question: 'Para quando precisa dessa solução?' },
      },
    },
    ai_config: {
      personality: 'Consultor de vendas amigável, prestativo e focado em resultados',
      mode: 'copilot',
      temperature: 0.7,
      max_tokens: 500,
      techniques: ['SPIN', 'rapport', 'escassez', 'prova social'],
    },
    automation_flows_config: [
      {
        id: 'auto_01',
        name: 'Follow-up 24h',
        trigger: { type: 'no_response', hours: 24 },
        action: { type: 'send_message', message: 'Oi {nome}! Tudo bem? Vi que você estava interessado(a) em {produto}. Posso te ajudar com mais alguma informação?' },
        is_active: true,
      },
      {
        id: 'auto_02',
        name: 'Follow-up 72h',
        trigger: { type: 'no_response', hours: 72 },
        action: { type: 'send_message', message: '{nome}, ainda tem interesse? Estou à disposição caso precise de algo! 😊' },
        is_active: true,
      },
      {
        id: 'auto_03',
        name: 'Lembrete Proposta',
        trigger: { type: 'stage_change', hours: 48 },
        action: { type: 'notify_team', message: 'Proposta enviada há 48h sem resposta - fazer follow-up' },
        is_active: true,
      },
    ],
    sla_config: {
      first_response_minutes: 5,
      follow_up_hours: 24,
      escalation_hours: 48,
      working_hours: { start: '08:00', end: '18:00' },
      working_days: [1, 2, 3, 4, 5],
    },
    product_categories: [
      { name: 'Mais Vendidos', description: 'Produtos com maior saída', icon: '🔥' },
      { name: 'Lançamentos', description: 'Novidades do catálogo', icon: '✨' },
      { name: 'Promoções', description: 'Ofertas especiais', icon: '🏷️' },
    ],
  },
  'tpl_002': {
    slug: 'veiculos',
    name: 'Template Veículos',
    description: 'Especializado em concessionárias e revendas de veículos.',
    category: 'vendas',
    icon: '🚗',
    is_base_template: false,
    parent_template_id: 'tpl_001',
    funnel_config: {
      stages: [
        { name: 'Novo Lead', slug: 'novo', color: '#3B82F6', sort_order: 1, is_won: false, is_lost: false },
        { name: 'Interesse Confirmado', slug: 'interesse', color: '#8B5CF6', sort_order: 2, is_won: false, is_lost: false },
        { name: 'Agendou Visita', slug: 'visita', color: '#06B6D4', sort_order: 3, is_won: false, is_lost: false },
        { name: 'Test Drive', slug: 'test-drive', color: '#F59E0B', sort_order: 4, is_won: false, is_lost: false },
        { name: 'Negociação', slug: 'negociacao', color: '#EC4899', sort_order: 5, is_won: false, is_lost: false },
        { name: 'Financiamento', slug: 'financiamento', color: '#10B981', sort_order: 6, is_won: false, is_lost: false },
        { name: 'Vendido', slug: 'vendido', color: '#22C55E', sort_order: 7, is_won: true, is_lost: false },
        { name: 'Perdido', slug: 'perdido', color: '#EF4444', sort_order: 8, is_won: false, is_lost: true },
      ],
    },
    tags: {
      categories: [
        { name: 'Tipo Veículo', color: '#3B82F6', tags: ['novo', 'seminovo', 'usado'] },
        { name: 'Forma Pagamento', color: '#10B981', tags: ['à vista', 'financiamento', 'consórcio', 'troca'] },
      ],
    },
    quick_replies_config: [
      { id: 'qr_v01', label: 'Boas-vindas', trigger: 'oi|olá', message: 'Olá! 🚗 Bem-vindo! Está procurando um veículo novo ou seminovo?', technique: 'Rapport' },
      { id: 'qr_v02', label: 'Test Drive', trigger: 'test drive|testar|experimentar', message: 'Claro! Podemos agendar um test drive. Qual dia e horário seria melhor para você?', technique: 'Compromisso' },
    ],
    prompts: {
      greeting: 'Olá! 🚗 Seja bem-vindo à nossa concessionária! Posso ajudar você a encontrar o veículo ideal?',
      system_prompt: 'Você é um consultor de vendas de veículos especializado. Conhece bem carros, financiamentos e o processo de compra.',
      objection_handlers: {
        'preco': 'Entendo! Temos opções de financiamento em até 60x e aceitamos seu usado como entrada. Quer simular?',
      },
      qualification_criteria: {
        'budget': { weight: 35, question: 'Qual faixa de valor você está considerando?' },
        'tradeIn': { weight: 25, question: 'Você tem um veículo para dar como entrada?' },
      },
    },
    ai_config: {
      personality: 'Consultor automotivo entusiasmado e conhecedor',
      mode: 'copilot',
      temperature: 0.7,
      techniques: ['rapport', 'demonstração', 'escassez'],
    },
    automation_flows_config: [
      {
        id: 'auto_v01',
        name: 'Lembrete Test Drive',
        trigger: { type: 'scheduled', hours: 24 },
        action: { type: 'send_message', message: 'Oi {nome}! Lembrete do seu test drive amanhã às {horario}. Estamos te esperando! 🚗' },
        is_active: true,
      },
    ],
    sla_config: {
      first_response_minutes: 3,
      follow_up_hours: 12,
      escalation_hours: 24,
      working_hours: { start: '08:00', end: '20:00' },
      working_days: [1, 2, 3, 4, 5, 6],
    },
    product_categories: [
      { name: 'Novos', description: '0km direto da fábrica', icon: '✨' },
      { name: 'Seminovos', description: 'Até 3 anos, garantia inclusa', icon: '🌟' },
      { name: 'SUVs', description: 'Espaço e conforto', icon: '🚙' },
      { name: 'Populares', description: 'Economia e praticidade', icon: '💰' },
    ],
  },
};

// Mock Version History
export const mockVersionHistory: Record<string, TemplateVersion[]> = {
  'tpl_001': [
    { id: 'v_001', template_id: 'tpl_001', version: '2.3', changelog: 'Adicionadas novas automações de follow-up', published_by: 'Admin Master', published_at: '2026-01-05T14:30:00Z', data_snapshot: mockTemplateData['tpl_001'] },
    { id: 'v_002', template_id: 'tpl_001', version: '2.2', changelog: 'Ajustes nos prompts de qualificação', published_by: 'Admin Master', published_at: '2025-12-20T10:00:00Z', data_snapshot: mockTemplateData['tpl_001'] },
    { id: 'v_003', template_id: 'tpl_001', version: '2.1', changelog: 'Nova etapa de proposta no funil', published_by: 'Admin Master', published_at: '2025-11-15T16:00:00Z', data_snapshot: mockTemplateData['tpl_001'] },
    { id: 'v_004', template_id: 'tpl_001', version: '2.0', changelog: 'Reformulação completa do template', published_by: 'Admin Master', published_at: '2025-10-01T09:00:00Z', data_snapshot: mockTemplateData['tpl_001'] },
  ],
  'tpl_002': [
    { id: 'v_010', template_id: 'tpl_002', version: '1.8', changelog: 'Adicionada etapa de financiamento', published_by: 'Admin Master', published_at: '2026-01-02T11:00:00Z', data_snapshot: mockTemplateData['tpl_002'] },
    { id: 'v_011', template_id: 'tpl_002', version: '1.7', changelog: 'Novos prompts para test drive', published_by: 'Admin Master', published_at: '2025-12-10T14:00:00Z', data_snapshot: mockTemplateData['tpl_002'] },
  ],
};

// Mock Subscribers
export const mockSubscribers: Record<string, TemplateSubscriber[]> = {
  'tpl_001': [
    { tenant_id: 't_001', tenant_name: 'Auto Shop Centro', subscribed_at: '2025-07-01T10:00:00Z', last_synced_at: '2026-01-05T14:30:00Z', has_overrides: false, overridden_sections: [] },
    { tenant_id: 't_002', tenant_name: 'Móveis Express', subscribed_at: '2025-08-15T09:00:00Z', last_synced_at: '2026-01-05T14:30:00Z', has_overrides: true, overridden_sections: ['quick_replies', 'prompts'] },
    { tenant_id: 't_003', tenant_name: 'TechStore', subscribed_at: '2025-09-20T11:00:00Z', last_synced_at: '2026-01-03T10:00:00Z', has_overrides: false, overridden_sections: [] },
    { tenant_id: 't_004', tenant_name: 'Fitness Pro', subscribed_at: '2025-10-01T08:00:00Z', last_synced_at: '2026-01-05T14:30:00Z', has_overrides: true, overridden_sections: ['sla_config'] },
  ],
  'tpl_002': [
    { tenant_id: 't_010', tenant_name: 'Concessionária ABC', subscribed_at: '2025-09-01T10:00:00Z', last_synced_at: '2026-01-02T11:00:00Z', has_overrides: false, overridden_sections: [] },
    { tenant_id: 't_011', tenant_name: 'Revenda Premium', subscribed_at: '2025-10-15T14:00:00Z', last_synced_at: '2026-01-02T11:00:00Z', has_overrides: true, overridden_sections: ['quick_replies'] },
  ],
};

// Mock Sync Response
export const createMockSyncResponse = (templateId: string): SyncResponse => {
  const subscribers = mockSubscribers[templateId] || [];
  return {
    success: true,
    version: mockTemplates.find(t => t.id === templateId)?.version || '1.0',
    results: {
      total: subscribers.length,
      synced: Math.floor(subscribers.length * 0.8),
      skipped: Math.ceil(subscribers.length * 0.15),
      errors: Math.ceil(subscribers.length * 0.05),
      details: subscribers.map((s, i) => ({
        tenant_id: s.tenant_id,
        tenant_name: s.tenant_name,
        status: i === 0 ? 'success' : (i === 1 && s.has_overrides ? 'skipped' : 'success'),
        applied: s.has_overrides ? ['funnel_config', 'sla_config'] : ['funnel_config', 'prompts', 'quick_replies', 'sla_config'],
        skipped: s.has_overrides ? s.overridden_sections : [],
      })),
    },
  };
};
