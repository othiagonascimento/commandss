
# Plano: Atualização do Master Panel + Prompt Integrado para CRM

## Diagnóstico Completo

### O que Já Existe

**Supabase Externo (btoyclznuuwvxbsacemw)** - Tudo criado e funcionando:
| Item | Status |
|------|--------|
| `credit_rates` (layer_1=1, layer_2=2, layer_3=8, etc) | ✅ |
| `credit_debit_logs` (auditoria) | ✅ |
| `api_cost_config.layer_category` | ✅ |
| `debit_ai_credits()` RPC | ✅ |
| `check_credit_status()` RPC | ✅ |
| `check_copilot_daily_debit()` RPC | ✅ |

**Master Panel** - Precisa atualizar:
| Item | Problema |
|------|----------|
| `docs/sql/credits_rpc_functions.sql` | Usa `credits_consumed` (legado) em vez de `ai_credits_used` |
| `src/hooks/useTenantCredits.ts` | Parâmetro `tenant_id_param` vs `p_tenant_id` |
| `src/pages/APICosts.tsx` | Não mostra coluna `layer_category` |
| `supabase/functions/log-api-usage/index.ts` | Calcula créditos por custo R$, não por layer |

**CRM** - Já tem visual de créditos, precisa integrar:
| Item | Existente | Precisa |
|------|-----------|---------|
| Widget de créditos | ✅ Visual bonito | Chamar RPCs novas |
| Barras por categoria | ✅ | Mapear para layers |
| Degradação | ❌ | Implementar lógica |
| Banner de aviso | ❌ | Criar componente |
| Modal de compra | ❌ | Criar componente |

---

## Parte 1: Atualizações no Master Panel

### 1.1 Atualizar `docs/sql/credits_rpc_functions.sql`

Mudar de `credits_consumed` para `ai_credits_used`:

```sql
-- ANTES:
COALESCE(SUM(tu.credits_consumed), 0)::BIGINT,

-- DEPOIS:
COALESCE(SUM(tu.ai_credits_used), 0)::BIGINT,
```

### 1.2 Corrigir `src/hooks/useTenantCredits.ts`

O parâmetro da RPC mudou:

```typescript
// ANTES:
.rpc('get_tenant_credits_summary', { tenant_id_param: tenantId })

// DEPOIS:
.rpc('get_tenant_credits_summary', { p_tenant_id: tenantId })
```

### 1.3 Adicionar Coluna Layer em `APICosts.tsx`

Na tabela de modelos, mostrar a camada:

```typescript
<TableHead>Camada</TableHead>
...
<TableCell>
  <Badge variant="outline" className={cn(
    config.layer_category === 'layer_1' && 'bg-blue-100 text-blue-700',
    config.layer_category === 'layer_2' && 'bg-green-100 text-green-700',
    config.layer_category === 'layer_3' && 'bg-purple-100 text-purple-700',
  )}>
    {config.layer_category?.replace('layer_', 'Layer ')}
  </Badge>
</TableCell>
```

### 1.4 Atualizar `log-api-usage/index.ts`

Usar créditos por layer em vez de calcular por custo:

```typescript
// 1. Buscar layer_category do modelo
const layerCategory = costConfig?.layer_category || 'layer_2';

// 2. Buscar taxa de créditos para essa camada
const { data: creditRate } = await supabaseAdmin
  .from('credit_rates')
  .select('credits_per_unit')
  .eq('operation_type', layerCategory)
  .eq('is_active', true)
  .single();

// 3. Créditos = taxa * 1 (por mensagem)
let creditsConsumed = creditRate?.credits_per_unit || 2;

// Para transcrição: 3 créditos/minuto
if (payload.operation === 'transcription' && payload.audio_seconds) {
  const minutes = Math.ceil(payload.audio_seconds / 60);
  const { data: transcriptionRate } = await supabaseAdmin
    .from('credit_rates')
    .select('credits_per_unit')
    .eq('operation_type', 'transcription')
    .single();
  creditsConsumed = minutes * (transcriptionRate?.credits_per_unit || 3);
}
```

### 1.5 Criar Widget de Zonas de Crédito

Novo componente para dashboard mostrando tenants por zona:

```text
┌─────────────────────────────────────────────────────┐
│  Saúde dos Créditos                                 │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │   42    │  │    5    │  │    2    │              │
│  │  Verde  │  │ Amarelo │  │Vermelho │              │
│  │ 0-100%  │  │100-115% │  │  >115%  │              │
│  └─────────┘  └─────────┘  └─────────┘              │
│                                                     │
│  Tenants em modo degradado: 2                       │
│  • Loja XYZ (128%)                                  │
│  • Store ABC (119%)                                 │
└─────────────────────────────────────────────────────┘
```

---

## Parte 2: Prompt Completo para o CRM

Este é o prompt atualizado e contextualizado para usar no outro projeto Lovable:

---

```
## INTEGRAÇÃO DO SISTEMA DE CRÉDITOS DE IA (v5.0)

### ⚠️ IMPORTANTE - LEIA ANTES DE QUALQUER COISA

1. **TODAS as tabelas e funções RPC já existem no Supabase externo (btoyclznuuwvxbsacemw)**
2. **NÃO criar tabelas** - elas já foram criadas
3. **NÃO criar funções SQL** - já existem e estão funcionando
4. O CRM **já tem um widget de créditos** funcionando (veja imagens anexas)
5. A tarefa é **INTEGRAR** o código que chama as RPCs, não recriar do zero

### CONTEXTO DO SISTEMA

O Master Panel e o CRM compartilham o **mesmo banco de dados** (Supabase externo).

**Arquitetura:**
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPABASE EXTERNO (btoyclznuuwvxbsacemw)                                    │
│  ─────────────────────────────────────────                                   │
│  • Banco de dados ÚNICO e CENTRAL                                            │
│  • Contém: tenants, profiles, tenant_usage, user_usage, credit_rates, etc   │
│  • Tanto o Master Panel quanto o CRM conectam neste mesmo banco             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### O QUE JÁ EXISTE NO SUPABASE EXTERNO

#### Tabela: public.credit_rates (JÁ CRIADA)
| operation_type | credits_per_unit | Descrição |
|----------------|------------------|-----------|
| layer_1 | 1 | Chat Router - respostas rápidas |
| layer_2 | 2 | Chat Standard - conversas normais |
| layer_3 | 8 | Chat Elite - análises complexas |
| transcription | 3 | Transcrição de áudio (por minuto) |
| copilot_daily | 2 | Acesso diário ao Copiloto IA |
| image_generation | 10 | Geração de imagem |
| crm_background | 0 | Ações automáticas (gratuito) |

#### RPC: public.debit_ai_credits (JÁ CRIADA)
Parâmetros: `p_tenant_id`, `p_user_id`, `p_operation_type`, `p_units`, `p_metadata`

Retorna:
- `success`: boolean
- `credits_debited`: numeric
- `credits_remaining`: bigint
- `credits_limit`: bigint
- `usage_percent`: numeric
- `is_degraded`: boolean (true se uso > 115%)
- `can_use_layer_2`: boolean
- `can_use_layer_3`: boolean
- `can_transcribe`: boolean
- `error_message`: text

**REGRAS DE NEGÓCIO (já implementadas na RPC):**
- Soft limit de 115% (permite negativo até 15% do limite)
- Acima de 115%: modo degradado ativo automaticamente
- Em modo degradado: layer_2, layer_3 e transcription retornam `success: false`
- Apenas layer_1 e crm_background continuam funcionando

#### RPC: public.check_credit_status (JÁ CRIADA)
Parâmetro: `p_tenant_id`

Retorna:
- `credits_used`, `credits_limit`, `credits_remaining`
- `usage_percent`
- `zone`: 'green' | 'yellow' | 'red'
- `is_degraded`: boolean
- `can_use_layer_2`, `can_use_layer_3`, `can_transcribe`
- `message`: texto de aviso

**Zonas:**
- **Green (0-100%)**: Tudo normal
- **Yellow (100-115%)**: Aviso, mas tudo funciona
- **Red (>115%)**: Modo degradado, apenas Layer 1

#### RPC: public.check_copilot_daily_debit (JÁ CRIADA)
Parâmetros: `p_tenant_id`, `p_user_id`

Se não debitou taxa diária hoje, debita automaticamente 2 créditos.
Retorna: boolean (true se debitou agora)

---

### O QUE O CRM JÁ TEM (veja screenshots anexas)

1. **Widget de créditos** mostrando "234 de 500 créditos usados" com barra de progresso
2. **Barras por categoria**: Chat IA, Transcrição, Copiloto IA, Geração de imagem, Ações CRM
3. **Custo estimado**: R$ X,XX no mês
4. **Visual bonito** já implementado

---

### O QUE PRECISA SER IMPLEMENTADO

#### 1. Criar arquivo: src/utils/creditDebit.ts

Funções utilitárias para interagir com as RPCs:

```typescript
import { supabase } from '@/integrations/supabase/client';

export type CreditZone = 'green' | 'yellow' | 'red';
export type OperationType = 'layer_1' | 'layer_2' | 'layer_3' | 'transcription' | 'copilot_daily' | 'image_generation' | 'crm_background';

export interface CreditStatus {
  credits_used: number;
  credits_limit: number;
  credits_remaining: number;
  usage_percent: number;
  zone: CreditZone;
  is_degraded: boolean;
  can_use_layer_2: boolean;
  can_use_layer_3: boolean;
  can_transcribe: boolean;
  message: string;
}

export interface DebitResult {
  success: boolean;
  credits_debited: number;
  credits_remaining: number;
  credits_limit: number;
  usage_percent: number;
  is_degraded: boolean;
  can_use_layer_2: boolean;
  can_use_layer_3: boolean;
  can_transcribe: boolean;
  error_message: string | null;
}

// Verificar status de créditos
export async function checkCreditStatus(tenantId: string): Promise<CreditStatus | null> {
  const { data, error } = await supabase.rpc('check_credit_status', { 
    p_tenant_id: tenantId 
  });
  
  if (error) {
    console.error('Erro ao verificar créditos:', error);
    return null;
  }
  
  return data?.[0] || null;
}

// Debitar créditos (chamar APÓS operação de IA bem-sucedida)
export async function debitCredits(
  tenantId: string,
  userId: string,
  operationType: OperationType,
  units: number = 1,
  metadata?: Record<string, unknown>
): Promise<DebitResult> {
  const { data, error } = await supabase.rpc('debit_ai_credits', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_operation_type: operationType,
    p_units: units,
    p_metadata: metadata || {}
  });
  
  if (error) {
    console.error('Erro ao debitar créditos:', error);
    return {
      success: false,
      credits_debited: 0,
      credits_remaining: 0,
      credits_limit: 500,
      usage_percent: 0,
      is_degraded: false,
      can_use_layer_2: true,
      can_use_layer_3: true,
      can_transcribe: true,
      error_message: error.message
    };
  }
  
  return data?.[0] || {
    success: false,
    credits_debited: 0,
    credits_remaining: 0,
    credits_limit: 500,
    usage_percent: 0,
    is_degraded: false,
    can_use_layer_2: true,
    can_use_layer_3: true,
    can_transcribe: true,
    error_message: 'Resposta inválida'
  };
}

// Verificar e debitar taxa diária do copiloto
export async function checkAndDebitCopilot(
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_copilot_daily_debit', {
    p_tenant_id: tenantId,
    p_user_id: userId
  });
  
  if (error) {
    console.error('Erro no débito do copiloto:', error);
    return false;
  }
  
  return data ?? false;
}

// Determinar layer disponível considerando degradação
export async function selectAvailableLayer(
  tenantId: string,
  preferredLayer: 1 | 2 | 3
): Promise<1 | 2 | 3> {
  const status = await checkCreditStatus(tenantId);
  
  if (!status) return preferredLayer;
  
  // Se degradado, forçar Layer 1
  if (status.is_degraded) {
    console.warn('⚠️ Modo degradado ativo - forçando Layer 1');
    return 1;
  }
  
  return preferredLayer;
}

// Mapear nome do modelo para layer
export function getLayerFromModel(modelName: string): OperationType {
  const lower = modelName.toLowerCase();
  
  // Layer 1: modelos rápidos/baratos
  if (lower.includes('flash') || lower.includes('mini') || lower.includes('haiku') || lower.includes('nano')) {
    return 'layer_1';
  }
  
  // Layer 3: modelos premium
  if (lower.includes('sonnet') || lower.includes('opus') || lower.includes('claude-3-5') || lower.includes('gpt-4-turbo')) {
    return 'layer_3';
  }
  
  // Default: Layer 2
  return 'layer_2';
}
```

#### 2. Criar componente: src/components/CreditWarningBanner.tsx

Banner que aparece quando zona é amarela ou vermelha:

```typescript
import { useEffect, useState } from 'react';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkCreditStatus, CreditStatus } from '@/utils/creditDebit';

interface Props {
  tenantId: string;
  onBuyCredits: () => void;
}

export function CreditWarningBanner({ tenantId, onBuyCredits }: Props) {
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    checkCreditStatus(tenantId).then(setStatus);
    
    const interval = setInterval(() => {
      checkCreditStatus(tenantId).then(setStatus);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [tenantId]);
  
  // Não mostrar se verde ou já dispensado
  if (!status || status.zone === 'green' || dismissed) return null;
  
  const isRed = status.zone === 'red';
  
  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-xl border-2 shadow-2xl z-50 backdrop-blur-sm ${
      isRed 
        ? 'bg-red-50/95 border-red-300' 
        : 'bg-amber-50/95 border-amber-300'
    }`}>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${isRed ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-5 h-5 ${isRed ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        
        <div className="flex-1">
          <p className={`font-semibold ${isRed ? 'text-red-900' : 'text-amber-900'}`}>
            {isRed ? '🔴 Recursos Premium Bloqueados' : '🟡 Créditos Acabando!'}
          </p>
          
          <p className="text-sm text-gray-600 mt-1">
            {status.credits_remaining < 0 
              ? `${Math.abs(status.credits_remaining)} créditos negativos`
              : `Apenas ${status.credits_remaining} créditos restantes`
            }
          </p>
          
          {isRed && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              ⚡ Apenas respostas básicas estão funcionando
            </p>
          )}
          
          <Button 
            size="sm" 
            className="mt-3 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg"
            onClick={onBuyCredits}
          >
            <Zap className="w-4 h-4 mr-2" />
            Comprar Créditos - 50% OFF 🔥
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### 3. Criar componente: src/components/BuyCreditsModal.tsx

Modal com pacotes promocionais (50% OFF visual):

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onPurchase: (packageId: 'starter' | 'plus' | 'pro') => void;
  isPurchasing?: boolean;
}

const packages = [
  { id: 'starter' as const, credits: 300, price: 5, originalPrice: 10, color: 'blue' },
  { id: 'plus' as const, credits: 600, price: 10, originalPrice: 20, color: 'violet', popular: true },
  { id: 'pro' as const, credits: 1000, price: 15, originalPrice: 30, color: 'amber' },
];

export function BuyCreditsModal({ open, onClose, onPurchase, isPurchasing }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            <span className="text-2xl">Créditos de IA</span>
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
              50% OFF
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-center text-gray-500 text-sm">
          Promoção por tempo limitado! Potencialize sua equipe.
        </p>
        
        <div className="space-y-3 mt-4">
          {packages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                pkg.popular 
                  ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => !isPurchasing && onPurchase(pkg.id)}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2.5 left-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow">
                  ⭐ Mais Popular
                </Badge>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{pkg.credits}</span>
                    <span className="text-gray-500">créditos</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-emerald-600">R$ {pkg.price}</span>
                    <span className="text-sm text-gray-400 line-through">R$ {pkg.originalPrice}</span>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                      -50%
                    </Badge>
                  </div>
                </div>
                
                <Button 
                  className={`shadow-md ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700' 
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                  disabled={isPurchasing}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  {isPurchasing ? '...' : 'Comprar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold">Créditos nunca expiram!</p>
              <p className="text-emerald-600">Use quando quiser, sem prazo de validade.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 4. Integrar no Orquestrador de IA

No código que processa mensagens de IA (onde quer que esteja), adicionar:

```typescript
import { debitCredits, selectAvailableLayer, getLayerFromModel } from '@/utils/creditDebit';

async function processAIMessage(message, context) {
  // 1. Verificar qual layer está disponível (considerando degradação)
  const preferredLayer = determineIdealLayer(message); // sua lógica atual
  const availableLayer = await selectAvailableLayer(context.tenantId, preferredLayer);
  
  // 2. Se forçou downgrade, pode avisar o usuário
  if (availableLayer !== preferredLayer) {
    console.log('⚠️ Usando layer básico por falta de créditos');
    // Opcional: mostrar toast ou indicador visual
  }
  
  // 3. Processar com a IA
  const model = getModelForLayer(availableLayer); // sua função que mapeia layer → modelo
  const response = await callAI(model, message);
  
  // 4. Debitar créditos APÓS sucesso
  const operationType = `layer_${availableLayer}`;
  const debitResult = await debitCredits(
    context.tenantId,
    context.userId,
    operationType,
    1, // 1 mensagem
    { model: response.model, tokens: response.usage?.total_tokens }
  );
  
  // 5. Verificar se entrou em modo degradado
  if (debitResult.is_degraded) {
    // Disparar evento para mostrar banner
    window.dispatchEvent(new CustomEvent('credits-degraded'));
  }
  
  return response;
}
```

#### 5. Integrar Transcrição de Áudio

```typescript
import { debitCredits, checkCreditStatus } from '@/utils/creditDebit';

async function transcribeAudio(audioUrl: string, durationSeconds: number, context) {
  // 1. Verificar se PODE transcrever
  const status = await checkCreditStatus(context.tenantId);
  
  if (status?.is_degraded) {
    throw new Error('Transcrição bloqueada por falta de créditos. Adquira mais créditos para continuar.');
  }
  
  // 2. Transcrever
  const result = await whisperTranscribe(audioUrl);
  
  // 3. Debitar por minuto (arredondar para cima)
  const minutes = Math.ceil(durationSeconds / 60);
  await debitCredits(
    context.tenantId,
    context.userId,
    'transcription',
    minutes, // 3 créditos * minutos
    { duration_seconds: durationSeconds, file: audioUrl }
  );
  
  return result;
}
```

#### 6. Integrar Copiloto (Taxa Diária)

```typescript
import { checkAndDebitCopilot } from '@/utils/creditDebit';

// Chamar UMA VEZ no início da sessão do copiloto
async function initCopilotSession(tenantId: string, userId: string) {
  const debitedNow = await checkAndDebitCopilot(tenantId, userId);
  
  if (debitedNow) {
    console.log('✅ Taxa diária do copiloto debitada (2 créditos)');
  } else {
    console.log('ℹ️ Taxa diária do copiloto já foi debitada hoje');
  }
}
```

#### 7. Adicionar Banner no Layout Global

No layout principal da aplicação (provavelmente onde já tem o widget de créditos):

```typescript
import { useState } from 'react';
import { CreditWarningBanner } from '@/components/CreditWarningBanner';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

function AppLayout({ children }) {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { tenantId, userId } = useAuth(); // seu hook de autenticação
  
  const handlePurchase = async (packageId: 'starter' | 'plus' | 'pro') => {
    // Integrar com seu sistema de pagamento (Stripe, etc)
    // Após sucesso do pagamento:
    // 1. Atualizar total_credits_purchased no tenant_usage
    // 2. Fechar modal
    // 3. Mostrar toast de sucesso
    setShowBuyModal(false);
  };
  
  return (
    <div>
      {children}
      
      {tenantId && (
        <CreditWarningBanner 
          tenantId={tenantId} 
          onBuyCredits={() => setShowBuyModal(true)} 
        />
      )}
      
      <BuyCreditsModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onPurchase={handlePurchase}
      />
    </div>
  );
}
```

#### 8. Atualizar Widget de Créditos Existente

O widget que já existe pode ser atualizado para usar as novas RPCs e mostrar a zona:

```typescript
// No widget existente, adicionar:
const { data: status } = useQuery({
  queryKey: ['credit-status', tenantId],
  queryFn: () => checkCreditStatus(tenantId),
  refetchInterval: 60000,
});

// No visual, adicionar indicador de zona:
<Badge className={cn(
  'text-xs',
  status?.zone === 'green' && 'bg-emerald-100 text-emerald-700',
  status?.zone === 'yellow' && 'bg-amber-100 text-amber-700',
  status?.zone === 'red' && 'bg-red-100 text-red-700',
)}>
  {status?.zone === 'green' && '✅ Normal'}
  {status?.zone === 'yellow' && '⚠️ Limite próximo'}
  {status?.zone === 'red' && '🔴 Modo básico'}
</Badge>
```

---

### RESUMO DE ALTERAÇÕES

| Arquivo | Ação |
|---------|------|
| `src/utils/creditDebit.ts` | **CRIAR** - funções utilitárias para RPCs |
| `src/components/CreditWarningBanner.tsx` | **CRIAR** - banner de aviso |
| `src/components/BuyCreditsModal.tsx` | **CRIAR** - modal de compra com 50% OFF |
| Orquestrador de IA | **MODIFICAR** - adicionar chamadas de débito |
| Transcrição de áudio | **MODIFICAR** - verificar e debitar |
| Copiloto | **MODIFICAR** - taxa diária no início |
| Layout principal | **MODIFICAR** - adicionar banner global |
| Widget de créditos existente | **MODIFICAR** - mostrar zona e integrar RPCs |

### ⛔ NÃO FAZER

- ❌ NÃO criar tabelas (credit_rates, credit_debit_logs já existem)
- ❌ NÃO criar funções SQL (debit_ai_credits, check_credit_status já existem)
- ❌ NÃO modificar o schema do banco de dados
- ❌ NÃO bloquear 100% quando créditos acabam (apenas degradar para Layer 1)
- ❌ NÃO cobrar por mensagem do copiloto (é taxa diária fixa)
```

---

## Resumo das Entregas

### Master Panel (Este Projeto)

| Arquivo | Mudança |
|---------|---------|
| `docs/sql/credits_rpc_functions.sql` | Atualizar `credits_consumed` → `ai_credits_used` |
| `src/hooks/useTenantCredits.ts` | Corrigir parâmetro `p_tenant_id` |
| `src/pages/APICosts.tsx` | Adicionar coluna `layer_category` |
| `supabase/functions/log-api-usage/index.ts` | Usar créditos por layer |
| `src/components/dashboard/CreditZonesWidget.tsx` | **NOVO** - indicadores visuais de zonas |

### CRM (Prompt Acima)

| Arquivo | Ação |
|---------|------|
| `src/utils/creditDebit.ts` | Criar |
| `src/components/CreditWarningBanner.tsx` | Criar |
| `src/components/BuyCreditsModal.tsx` | Criar |
| Orquestrador de IA | Integrar débito |
| Transcrição | Integrar débito |
| Copiloto | Integrar taxa diária |
| Layout | Adicionar banner |
| Widget existente | Atualizar para mostrar zona |
