/**
 * Glossário centralizado de termos técnicos com traduções e explicações em português.
 * Use estas definições para manter consistência em todo o sistema.
 */

export const GLOSSARY = {
  // Termos de Negócio
  tenant: {
    label: "Empresa/Cliente",
    shortLabel: "Empresa",
    description:
      "Cada cliente (empresa) que usa a plataforma Uôpa. Cada tenant tem seus próprios usuários, leads e configurações isoladas.",
    example: "Ex: Loja do João, Imobiliária ABC",
    icon: "🏢",
  },
  template: {
    label: "Template de Nicho",
    shortLabel: "Template",
    description:
      "Configuração pré-definida de IA, funil e automações para um segmento específico. Quando aplicado a um tenant, injeta todos os prompts e fluxos automaticamente.",
    example: "Ex: Template Imobiliárias, Template Veículos",
    icon: "📋",
  },
  slug: {
    label: "Identificador (Slug)",
    shortLabel: "Slug",
    description:
      "Nome técnico usado em URLs e integrações. Deve ser único, sem espaços ou caracteres especiais. Use letras minúsculas, números e hífens.",
    example: "Ex: minha-empresa → usado em api.uopa.com/minha-empresa",
    icon: "🔗",
  },

  // Métricas Financeiras
  mrr: {
    label: "MRR (Receita Mensal Recorrente)",
    shortLabel: "MRR",
    description:
      "Soma de todas as assinaturas ativas convertidas para valor mensal. Principal métrica de saúde financeira de um SaaS.",
    example: "Ex: 10 clientes pagando R$100/mês = MRR de R$1.000",
    icon: "💰",
  },
  arr: {
    label: "ARR (Receita Anual Recorrente)",
    shortLabel: "ARR",
    description: "MRR multiplicado por 12. Projeção anual de receita.",
    example: "Ex: MRR de R$1.000 = ARR de R$12.000",
    icon: "📊",
  },
  churn: {
    label: "Churn (Taxa de Cancelamento)",
    shortLabel: "Churn",
    description:
      "Porcentagem de clientes que cancelaram no período. Quanto menor, melhor.",
    example: "Ex: 5% de churn = 5 a cada 100 clientes cancelaram",
    icon: "📉",
  },
  ltv: {
    label: "LTV (Valor Vitalício)",
    shortLabel: "LTV",
    description:
      "Receita total esperada de um cliente durante todo seu relacionamento com a empresa.",
    example: "Ex: Cliente fica 24 meses pagando R$100 = LTV de R$2.400",
    icon: "💎",
  },
  cac: {
    label: "CAC (Custo de Aquisição)",
    shortLabel: "CAC",
    description: "Quanto custa para conquistar um novo cliente.",
    example: "Ex: R$500 gastos em marketing para 1 novo cliente = CAC de R$500",
    icon: "💸",
  },

  // SLA e Operações
  sla: {
    label: "SLA (Acordo de Nível de Serviço)",
    shortLabel: "SLA",
    description:
      "Tempo máximo para responder ou resolver uma solicitação. Define a qualidade do atendimento.",
    example: "Ex: SLA de 5 min = cliente deve receber resposta em até 5 minutos",
    icon: "⏱️",
  },
  escalation: {
    label: "Escalação",
    shortLabel: "Escalação",
    description:
      "Transferir uma conversa para um atendente humano quando a IA não consegue resolver.",
    example:
      "Ex: Cliente muito irritado → escalar para supervisor",
    icon: "⬆️",
  },

  // Tipos de Negócio
  b2b: {
    label: "B2B (Venda para Empresas)",
    shortLabel: "B2B",
    description:
      "Modelo onde você vende produtos ou serviços para outras empresas, não para consumidores finais.",
    example: "Ex: Vender software para escritórios de contabilidade",
    icon: "🏭",
  },
  b2c: {
    label: "B2C (Venda para Consumidor)",
    shortLabel: "B2C",
    description:
      "Modelo onde você vende diretamente para pessoas físicas, consumidores finais.",
    example: "Ex: Loja de roupas vendendo para clientes no shopping",
    icon: "🛍️",
  },
  d2c: {
    label: "D2C (Venda Direta)",
    shortLabel: "D2C",
    description:
      "Fabricante vendendo diretamente ao consumidor, sem intermediários como distribuidores ou varejistas.",
    example: "Ex: Fábrica de colchões vendendo direto pelo site",
    icon: "🏭➡️👤",
  },
  b2b2c: {
    label: "B2B2C (Híbrido)",
    shortLabel: "B2B2C",
    description:
      "Você vende para uma empresa que revende para o consumidor final.",
    example: "Ex: Software para corretores que atendem compradores de imóveis",
    icon: "🔄",
  },

  // IA e Automação
  copilot: {
    label: "Copiloto de IA",
    shortLabel: "Copiloto",
    description:
      "Assistente de IA que ajuda vendedores humanos, sugerindo respostas em tempo real. O vendedor decide quando usar as sugestões.",
    example:
      "Ex: IA sugere 3 opções de resposta, vendedor escolhe a melhor",
    icon: "🤖",
  },
  insights: {
    label: "Insights de IA",
    shortLabel: "Insights",
    description:
      "Análises automáticas de conversas. A IA identifica padrões, objeções comuns e oportunidades.",
    example: "Ex: 'Preço' foi mencionado em 40% das objeções desta semana",
    icon: "💡",
  },
  agents: {
    label: "Agentes de IA",
    shortLabel: "Agentes",
    description:
      "Robôs especializados que atuam em diferentes momentos do funil (qualificação, follow-up, fechamento).",
    example: "Ex: Agente de Qualificação coleta informações BANT do lead",
    icon: "🤖",
  },
  playbook: {
    label: "Manual de Vendas (Playbook)",
    shortLabel: "Playbook",
    description:
      "Conjunto de scripts, respostas rápidas e técnicas que a IA e os vendedores usam.",
    example: "Ex: Script para contornar objeção 'está muito caro'",
    icon: "📖",
  },
  temperature: {
    label: "Criatividade (Temperature)",
    shortLabel: "Criatividade",
    description:
      "Controla quão criativa ou previsível a IA será. Valores baixos = respostas mais focadas. Valores altos = respostas mais variadas.",
    example: "Ex: 0 = muito focado | 0.7 = balanceado | 1 = muito criativo",
    icon: "🎨",
  },

  // Status e Estados
  trial: {
    label: "Período de Teste (Trial)",
    shortLabel: "Trial",
    description:
      "Período gratuito para o cliente testar a plataforma antes de decidir pela assinatura.",
    example: "Ex: 14 dias grátis para experimentar todas as funcionalidades",
    icon: "🆓",
  },
  active: {
    label: "Ativo",
    shortLabel: "Ativo",
    description: "Cliente pagante com acesso completo à plataforma.",
    icon: "✅",
  },
  cancelled: {
    label: "Cancelado",
    shortLabel: "Cancelado",
    description: "Cliente que encerrou a assinatura.",
    icon: "❌",
  },
  pastDue: {
    label: "Pagamento Atrasado",
    shortLabel: "Atrasado",
    description:
      "Cliente com pagamento pendente. Pode ter acesso limitado ou bloqueado.",
    icon: "⚠️",
  },

  // Onboarding
  pending: {
    label: "Pendente",
    shortLabel: "Pendente",
    description: "Onboarding ainda não iniciado.",
    icon: "⏳",
  },
  configuring: {
    label: "Em Configuração",
    shortLabel: "Configurando",
    description: "Cliente está configurando a conta (logo, cores, equipe).",
    icon: "⚙️",
  },
  whatsappConnected: {
    label: "WhatsApp Conectado",
    shortLabel: "WhatsApp OK",
    description: "Integração com WhatsApp Business configurada e funcionando.",
    icon: "📱",
  },
  trainingDone: {
    label: "Treinamento Concluído",
    shortLabel: "Treinado",
    description: "Equipe do cliente foi treinada na plataforma.",
    icon: "🎓",
  },
  goLive: {
    label: "Ativo (Go Live)",
    shortLabel: "Go Live",
    description: "Cliente operando em produção, atendendo leads reais.",
    icon: "🚀",
  },

  // Fechamento e Vendas
  assumptive: {
    label: "Fechamento Assumptivo",
    shortLabel: "Assumptivo",
    description:
      "Técnica onde você assume que o cliente vai comprar e segue com próximos passos.",
    example: "Ex: 'Qual endereço para entrega?'",
    icon: "🎯",
  },
  alternative: {
    label: "Fechamento por Alternativa",
    shortLabel: "Alternativa",
    description: "Oferece duas opções, ambas levam à compra.",
    example: "Ex: 'Prefere começar com 5 ou 10 unidades?'",
    icon: "🔀",
  },
  urgency: {
    label: "Fechamento por Urgência",
    shortLabel: "Urgência",
    description: "Cria senso de escassez ou prazo limitado.",
    example: "Ex: 'Promoção válida só até sexta-feira'",
    icon: "⏰",
  },
  summary: {
    label: "Fechamento por Resumo",
    shortLabel: "Resumo",
    description: "Recapitula todos os benefícios antes de pedir a decisão.",
    example: "Ex: 'Então você terá X, Y e Z. Podemos fechar?'",
    icon: "📋",
  },

  // Intensidade de Objeções
  softObjection: {
    label: "Objeção Leve",
    shortLabel: "Leve",
    description: "Objeção inicial, cliente ainda está interessado. Fácil de contornar.",
    example: "Ex: 'Hmm, preciso pensar um pouco'",
    icon: "🟢",
  },
  moderateObjection: {
    label: "Objeção Moderada",
    shortLabel: "Moderada",
    description: "Cliente tem uma preocupação real. Requer argumentação.",
    example: "Ex: 'Achei um pouco caro para meu orçamento'",
    icon: "🟡",
  },
  strongObjection: {
    label: "Objeção Forte",
    shortLabel: "Forte",
    description: "Cliente muito resistente. Pode precisar de condição especial ou escalar.",
    example: "Ex: 'Não tenho interesse, já fechei com concorrente'",
    icon: "🔴",
  },

  // Features e Planos
  customDomain: {
    label: "Domínio Próprio",
    shortLabel: "Domínio",
    description:
      "Usar seu próprio domínio (ex: atendimento.suaempresa.com) em vez do domínio padrão Uôpa.",
    icon: "🌐",
  },
  apiAccess: {
    label: "Acesso à API",
    shortLabel: "API",
    description:
      "Integração técnica para conectar a Uôpa com outros sistemas (CRM, ERP, etc).",
    icon: "🔌",
  },
  prioritySupport: {
    label: "Suporte Prioritário",
    shortLabel: "Suporte VIP",
    description: "Atendimento mais rápido e dedicado para resolver problemas.",
    icon: "⭐",
  },
  dedicatedSuccess: {
    label: "Sucesso do Cliente Dedicado",
    shortLabel: "CS Dedicado",
    description:
      "Um profissional exclusivo para ajudar você a extrair o máximo valor da plataforma.",
    icon: "🏆",
  },

  // Feature Flags
  featureFlags: {
    label: "Recursos Beta",
    shortLabel: "Beta",
    description:
      "Funcionalidades experimentais que podem ser ativadas ou desativadas para tenants específicos.",
    example:
      "Ex: Novo relatório de IA disponível para 10% dos clientes para testes",
    icon: "🧪",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

/**
 * Retorna a definição completa de um termo do glossário
 */
export function getTerm(key: GlossaryKey) {
  return GLOSSARY[key];
}

/**
 * Retorna apenas o label traduzido de um termo
 */
export function getLabel(key: GlossaryKey): string {
  return GLOSSARY[key].label;
}

/**
 * Retorna o label curto de um termo (para espaços limitados)
 */
export function getShortLabel(key: GlossaryKey): string {
  return GLOSSARY[key].shortLabel;
}

// Textos educativos para abas do TemplateEditor
export const TEMPLATE_TAB_EDUCATION = {
  identity: {
    title: "Identidade do Template",
    description:
      "Defina o nome, categoria e contexto de negócio. Essas informações ajudam a IA a entender o segmento do cliente e adaptar suas respostas.",
    impact:
      "Tenants que usarem este template terão a IA pré-configurada para este tipo de negócio.",
  },
  funnel: {
    title: "Etapas do Funil de Vendas",
    description:
      "Configure as etapas pelas quais cada lead passa. A IA usará isso para sugerir próximos passos e identificar gargalos.",
    impact:
      "Define o kanban de leads e métricas de conversão entre etapas.",
  },
  "uopa-core": {
    title: "Cérebro da IA (Uôpa AI Core)",
    description:
      "Configure personalidade, tom de voz, base de conhecimento e exemplos de conversa. Este é o 'DNA' da IA.",
    impact:
      "Todas as mensagens automáticas seguirão estas configurações.",
  },
  copilot: {
    title: "Copiloto para Vendedores",
    description:
      "Assistente que sugere respostas em tempo real para vendedores humanos. Eles decidem quando usar as sugestões.",
    impact: "Aumenta produtividade dos vendedores sem substituí-los.",
  },
  insights: {
    title: "Análises Automáticas (Insights)",
    description:
      "A IA analisa conversas para identificar objeções, sentimentos e oportunidades. Gera relatórios para gestores.",
    impact: "Gestores recebem alertas e podem tomar decisões baseadas em dados.",
  },
  agents: {
    title: "Agentes de IA Especializados",
    description:
      "Robôs que atuam em momentos específicos: qualificação, follow-up, fechamento. Cada um com suas regras.",
    impact: "Automatiza partes do funil sem intervenção humana.",
  },
  playbook: {
    title: "Manual de Vendas (Playbook)",
    description:
      "Respostas rápidas, tratamento de objeções e scripts de fechamento. A IA e vendedores consultam este manual.",
    impact:
      "Padroniza a comunicação e aumenta taxa de conversão.",
  },
  automations: {
    title: "Fluxos Automáticos",
    description:
      "Automações que rodam sem intervenção: follow-up, lembretes, nutrição de leads.",
    impact:
      "Leads não ficam sem resposta mesmo quando equipe está ocupada.",
  },
  operations: {
    title: "Regras de Operação",
    description:
      "Horários de atendimento, SLA, regras de escalação para humanos e metas (KPIs).",
    impact:
      "Define qualidade mínima de atendimento e alertas para gestores.",
  },
  catalog: {
    title: "Catálogo de Produtos",
    description:
      "Base de conhecimento sobre produtos/serviços. A IA usa para responder perguntas sobre preços e disponibilidade.",
    impact:
      "IA pode informar preços e características sem intervenção humana.",
  },
} as const;

export type TemplateTabKey = keyof typeof TEMPLATE_TAB_EDUCATION;
