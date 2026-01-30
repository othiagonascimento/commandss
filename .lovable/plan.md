

# Plano: Flexibilização dos Templates de Nicho + Documentação Completa

## 1. Problema Identificado

Atualmente, a validação de publicação no `TemplateEditor.tsx` (linhas 143-200) exige **muitos campos obrigatórios**:

| Campo | Linha | Obrigatório Atual |
|-------|-------|-------------------|
| `slug` | 146-150 | Sim |
| `name` | 152-156 | Sim |
| `funnel_stages` (mínimo 3) | 158-162 | Sim |
| Etapa "Ganho" (`is_won`) | 165-173 | Sim |
| Etapa "Perdido" (`is_lost`) | 166-178 | Sim |
| Etapa de entrada | 167-185 | Sim |
| `prompts.greeting` | 187-191 | Sim |
| `prompts.system_prompt` | 193-197 | Sim |

**Impacto**: Um template que só quer aproveitar o funil não pode ser criado porque exige prompts. E vice-versa.

## 2. Solução Proposta

### Mudança 1: Remover Obrigatoriedade de Prompts

Os prompts (greeting e system_prompt) não devem ser obrigatórios porque:
- O tenant já herda o prompt global do Master
- O template é um "boost" personalizado, não uma substituição completa

**Remover validações das linhas 187-197**.

### Mudança 2: Permitir Funil Mínimo Opcional

Se o template não quiser configurar funil, permitir usar o padrão. Mas se configurar, manter as regras de consistência (ter ganho/perdido).

**Tornar a validação de funil condicional**: só validar se houver customização.

### Mudança 3: Adicionar Flag de Seções Ativas

Adicionar ao formulário uma forma de indicar quais seções o template customiza:

```typescript
active_sections: {
  funnel: boolean;      // Customiza funil?
  prompts: boolean;     // Customiza prompts?
  ai_models: boolean;   // Customiza modelos de IA?
  playbook: boolean;    // Customiza playbook?
  operations: boolean;  // Customiza SLA/operações?
  catalog: boolean;     // Customiza catálogo?
}
```

## 3. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/templates.ts` | Adicionar `active_sections` ao `TemplateFormData` |
| `src/pages/TemplateEditor.tsx` | Remover validações obrigatórias de prompts e funil |
| `src/components/templates/TemplateIdentityEditor.tsx` | Adicionar checkboxes de seções ativas |

## 4. Nova Lógica de Validação

```typescript
const handlePublish = () => {
  const formData = methods.getValues();
  
  // Apenas nome e slug são REALMENTE obrigatórios
  if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
    toast.error('Slug inválido.');
    return;
  }
  
  if (!formData.name) {
    toast.error('Nome do template é obrigatório');
    return;
  }

  // Validação de funil SÓ SE tiver etapas customizadas além das padrão
  const hasCustomFunnel = formData.funnel_stages.length > 0 && 
    !arraysEqual(formData.funnel_stages, defaultTemplateFormData.funnel_stages);
  
  if (hasCustomFunnel) {
    if (formData.funnel_stages.length < 3) {
      toast.error('Funil customizado precisa ter pelo menos 3 etapas');
      return;
    }
    // ... validações de ganho/perdido
  }
  
  // Prompts não são mais obrigatórios - herdam do global
  setShowPublishModal(true);
};
```

---

# Documentação: Campos do Template de Nicho

## Campos Obrigatórios (Mínimo para Criar)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | `string` | Nome exibido do template (Ex: "Veículos") |
| `slug` | `string` | Identificador único (Ex: "veiculos") - apenas minúsculas, números e hífens |

## Campos de Identidade (Opcionais)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `description` | `string` | `""` | Descrição do propósito do template |
| `category` | `'universal' \| 'vendas' \| 'custom'` | `'universal'` | Categoria para organização |
| `icon` | `string` | `'📋'` | Emoji representativo |
| `is_base_template` | `boolean` | `false` | Se pode ser herdado por outros templates |

## Contexto de Negócio (business_context)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `business_type` | `'B2B' \| 'B2C' \| 'D2C' \| 'B2B2C'` | `'B2C'` | Modelo de negócio |
| `market_segment` | `string` | `""` | Segmento (Ex: "Automotivo") |
| `average_ticket` | `number` | `0` | Ticket médio em R$ |
| `sales_cycle_days` | `number` | `7` | Duração média do ciclo de vendas |
| `value_proposition` | `string` | `""` | Proposta de valor única |
| `competitive_advantages` | `string[]` | `[]` | Lista de diferenciais |
| `target_audience` | `string` | `""` | Descrição do público-alvo |
| `main_products_services` | `string` | `""` | Principais produtos/serviços |

## Funil de Vendas (funnel_stages)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | `string` | Nome da etapa (Ex: "Novos") |
| `slug` | `string` | Identificador (Ex: "novos") |
| `color` | `string` | Cor em hex (Ex: "#3B82F6") |
| `sort_order` | `number` | Ordem de exibição (1, 2, 3...) |
| `is_won` | `boolean` | Marca como etapa de ganho |
| `is_lost` | `boolean` | Marca como etapa de perda |
| `is_system` | `boolean` | Etapa protegida (não pode remover) |
| `objective` | `string` | Objetivo da etapa |
| `criteria_to_advance` | `string[]` | Critérios para avançar |
| `max_time_hours` | `number` | SLA máximo na etapa |
| `stage_prompt` | `string` | Prompt específico da etapa |

**Etapas padrão** (criadas automaticamente):
- Novos (entrada)
- Frio
- Morno  
- Quente
- Ganho (is_won: true)
- Perdido (is_lost: true)

## Configuração de IA (uopa_ai_core)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `tone_of_voice` | `'formal' \| 'casual' \| 'technical' \| 'friendly' \| 'consultative'` | `'friendly'` | Tom de comunicação |
| `proactivity_level` | `'low' \| 'medium' \| 'high'` | `'medium'` | Nível de proatividade |
| `communication_style` | `'direct' \| 'consultative' \| 'educational' \| 'empathetic'` | `'consultative'` | Estilo de comunicação |
| `language_regionalism` | `string` | `'pt-BR'` | Variação linguística |
| `layer_1_model` | `string \| undefined` | `undefined` (herda global) | Modelo Router |
| `layer_2_model` | `string \| undefined` | `undefined` (herda global) | Modelo Standard |
| `layer_3_model` | `string \| undefined` | `undefined` (herda global) | Modelo Elite |

## Prompts (prompts)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `greeting` | `string` | `"Olá! Bem-vindo..."` | Mensagem inicial |
| `system_prompt` | `string` | `"Você é um assistente..."` | Prompt principal |
| `objection_handlers` | `Record<string, string>` | `{}` | Mapa de objeções e respostas |
| `qualification_criteria` | `Record<string, QualificationCriterion>` | `{}` | Critérios de qualificação |

**Importante**: Se vazio, herda automaticamente do prompt global do Master.

## Configuração Copilot (copilot_config)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `is_enabled` | `boolean` | `true` | Habilita modo copilot |
| `assistance_level` | `'suggestion' \| 'draft' \| 'autocomplete'` | `'suggestion'` | Nível de assistência |
| `suggestion_triggers` | `string[]` | `['pergunta detectada'...]` | Gatilhos para sugestões |
| `suggestion_format` | `'bullet' \| 'prose' \| 'options'` | `'options'` | Formato das sugestões |
| `options_count` | `1 \| 2 \| 3` | `2` | Quantidade de opções |
| `response_speed` | `'fast' \| 'balanced' \| 'elaborate'` | `'balanced'` | Velocidade de resposta |
| `confidence_threshold` | `number` | `0.7` | Limiar de confiança (0-1) |

## Configuração Insights (insights_config)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `metrics_to_track` | `string[]` | `['tempo_resposta',...]` | Métricas monitoradas |
| `intent_detection_enabled` | `boolean` | `true` | Detectar intenção de compra |
| `sentiment_analysis_enabled` | `boolean` | `true` | Análise de sentimento |
| `competitor_detection_enabled` | `boolean` | `false` | Detectar menções a concorrentes |
| `auto_summary_enabled` | `boolean` | `true` | Gerar resumos automáticos |
| `suggested_tags_enabled` | `boolean` | `true` | Sugerir tags |
| `auto_tags_enabled` | `boolean` | `false` | Aplicar tags automaticamente |

## Agentes de IA (agents)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador único |
| `name` | `string` | Nome do agente |
| `type` | `'qualification' \| 'followup' \| 'closing' \| 'post_sale' \| 'support' \| 'custom'` | Tipo do agente |
| `description` | `string` | Descrição da função |
| `objective` | `string` | Objetivo principal |
| `prompt` | `string` | System prompt específico |
| `temperature` | `number` | Temperatura (0-1) |
| `allowed_actions` | `string[]` | Ações permitidas |
| `transfer_rules` | `string[]` | Regras de transferência |
| `is_active` | `boolean` | Ativo/inativo |

## Playbook de Vendas (playbook)

### Metodologias (playbook.methodologies)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador |
| `name` | `string` | Nome (Ex: "SPIN Selling") |
| `description` | `string` | Descrição da metodologia |
| `steps` | `MethodologyStep[]` | Etapas da metodologia |
| `is_active` | `boolean` | Ativo/inativo |

### Tratadores de Objeções (playbook.objection_handlers)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador |
| `objection` | `string` | A objeção (Ex: "Está caro") |
| `root_cause` | `string` | Causa raiz da objeção |
| `responses` | `ObjectionResponse[]` | Respostas por intensidade |
| `severity` | `'light' \| 'moderate' \| 'strong'` | Severidade da objeção |

### Scripts de Fechamento (playbook.closing_scripts)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador |
| `name` | `string` | Nome do script |
| `type` | `'assumptive' \| 'alternative' \| 'urgency' \| 'summary' \| 'trial' \| 'custom'` | Tipo |
| `content` | `string` | Conteúdo do script |
| `transition_phrases` | `string[]` | Frases de transição |

## Respostas Rápidas (quick_replies)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador |
| `label` | `string` | Rótulo exibido |
| `trigger` | `string` | Gatilho de ativação |
| `message` | `string` | Mensagem a enviar |
| `technique` | `string` | Técnica de vendas associada |
| `category` | `string` | Categoria (organização) |
| `tags` | `string[]` | Tags para contexto |

## Automações (automations)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador |
| `name` | `string` | Nome da automação |
| `trigger_type` | `string` | Tipo de gatilho |
| `trigger_value` | `number` | Valor (ex: horas) |
| `action_type` | `string` | Tipo de ação |
| `action_message` | `string` | Mensagem da ação |
| `is_active` | `boolean` | Ativo/inativo |

## Operações e SLA (operations)

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `sla.first_response_minutes` | `number` | `5` | SLA primeira resposta |
| `sla.follow_up_hours` | `number` | `24` | Horas para follow-up |
| `sla.escalation_hours` | `number` | `48` | Horas para escalonar |
| `sla.working_hours_start` | `string` | `'08:00'` | Início expediente |
| `sla.working_hours_end` | `string` | `'18:00'` | Fim expediente |
| `sla.working_days` | `number[]` | `[1,2,3,4,5]` | Dias úteis (1=Seg) |
| `escalation_rules` | `EscalationRule[]` | `[]` | Regras de escalonamento |
| `success_metrics` | `SuccessMetric[]` | `[]` | Métricas de sucesso |
| `out_of_hours_message` | `string` | `"Obrigado..."` | Mensagem fora do horário |

## Catálogo (catalog)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `categories` | `ProductCategory[]` | Categorias de produtos |
| `products` | `Product[]` | Lista de produtos |
| `competitors` | `Competitor[]` | Concorrentes conhecidos |
| `general_policies` | `FAQItem[]` | Políticas gerais (FAQ) |

---

## Exemplo de Template Mínimo (Só Funil)

```json
{
  "name": "Funil Básico E-commerce",
  "slug": "ecommerce-basico",
  "category": "vendas",
  "icon": "🛒",
  "funnel_stages": [
    { "name": "Lead", "slug": "lead", "color": "#3B82F6", "sort_order": 1 },
    { "name": "Carrinho", "slug": "carrinho", "color": "#F59E0B", "sort_order": 2 },
    { "name": "Checkout", "slug": "checkout", "color": "#EF4444", "sort_order": 3 },
    { "name": "Comprou", "slug": "comprou", "color": "#10B981", "sort_order": 4, "is_won": true },
    { "name": "Abandonou", "slug": "abandonou", "color": "#6B7280", "sort_order": 5, "is_lost": true }
  ]
}
```

## Exemplo de Template Mínimo (Só Prompts)

```json
{
  "name": "IA Especializada Moda",
  "slug": "moda-ia",
  "category": "custom",
  "icon": "👗",
  "prompts": {
    "system_prompt": "Você é uma consultora de moda especializada em ajudar clientes a escolher looks...",
    "greeting": "Olá! Sou a Ana, sua consultora de moda virtual. Como posso ajudar?"
  },
  "uopa_ai_core": {
    "tone_of_voice": "friendly",
    "communication_style": "empathetic"
  }
}
```

---

## Seção Técnica

### Mudanças no TemplateEditor.tsx

**Remover** (linhas 187-197):
```typescript
// REMOVER - Prompts não são mais obrigatórios
if (!formData.prompts.greeting) {
  toast.error('Mensagem de saudação é obrigatória');
  setActiveTab('uopa-core');
  return;
}

if (!formData.prompts.system_prompt) {
  toast.error('System prompt é obrigatório');
  setActiveTab('uopa-core');
  return;
}
```

**Modificar** validação de funil (linhas 158-185):
```typescript
// Validação de funil SÓ SE tiver customização
const defaultSlugs = ['novos', 'frio', 'morno', 'quente', 'ganho', 'perdido'];
const currentSlugs = formData.funnel_stages.map(s => s.slug);
const hasCustomFunnel = JSON.stringify(currentSlugs) !== JSON.stringify(defaultSlugs);

if (hasCustomFunnel && formData.funnel_stages.length > 0) {
  if (formData.funnel_stages.length < 3) {
    toast.error('Funil customizado precisa ter pelo menos 3 etapas');
    setActiveTab('funnel');
    return;
  }
  
  const hasWonStage = formData.funnel_stages.some(s => s.is_won === true);
  const hasLostStage = formData.funnel_stages.some(s => s.is_lost === true);
  
  if (!hasWonStage || !hasLostStage) {
    toast.error('Funil customizado precisa ter etapas de Ganho e Perdido');
    setActiveTab('funnel');
    return;
  }
}
```

