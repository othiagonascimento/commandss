

## Plano: Integrar API `ai_advanced` do CRM e Corrigir Sincronizacao de Dados

### Diagnostico

Investiguei profundamente e confirmei **6 problemas criticos**:

1. **APICostsWidget** (dashboard) chama `supabase.rpc('get_global_credits_summary')` e `supabase.rpc('get_top_credit_consumers')` diretamente no cliente Supabase do Lovable Cloud — essas RPCs existem apenas no Supabase externo, resultando em erro permanente no widget.

2. **useGlobalCredits** tenta a mesma RPC `get_global_credits_summary` no cliente local antes de fazer fallback para edge function — mas o fallback depende de `master-usage/global-summary` que tambem pode nao retornar dados corretos de IA.

3. **AIDiagnostics** faz 3 chamadas separadas (`master-ai-diagnostics`, `master-ai-diagnostics/by-tenant`, `master-ai-diagnostics/live-feed`) que processam `orchestrator_logs` manualmente no servidor, com mapeamento de colunas por tentativa-e-erro. A nova API `ai_advanced` do CRM ja faz isso de forma otimizada.

4. **master-ai-diagnostics** classifica layers com arrays hardcoded (`gemini-2.0-flash` = L1, `claude-3-5-sonnet` = L3) que podem nao refletir a configuracao real do Motor de IA.

5. **master-analytics** estima MRR no time series como `tenants * 200` (linha 274) ao inves de calcular com a logica real que ja existe em `getRevenueData()`.

6. **master-ai-insights** busca custos de API apenas de `api_usage_logs` local — nao acessa dados reais de orquestracao do CRM.

---

### Solucao em 6 passos

#### Passo 1: Nova Edge Function `master-ai-advanced`

**Novo arquivo**: `supabase/functions/master-ai-advanced/index.ts`

Proxy autenticado que faz fetch para o CRM:
```text
GET {REMOTE_SUPABASE_URL}/functions/v1/master-core?action=ai_advanced&days={days}&tenant_id={tenant_id}
```

Retorna dados completos: layers, modelos, providers, tenants, timeline, summary (fallbacks, blocks, feedback).

#### Passo 2: Adicionar tipos e API no `masterApi.ts`

- Novo tipo `AIAdvancedData` com as interfaces para layers, models, providers, tenants, timeline, summary
- Novo `aiAdvancedApi` service:
  - `get(days?, tenantId?)` -> chama `master-ai-advanced`

#### Passo 3: Refatorar `APICostsWidget.tsx`

**Problema atual**: Chama RPCs que nao existem no Supabase local.

**Solucao**: Substituir as 2 chamadas RPC por uma unica chamada a `aiAdvancedApi.get()` ou ao `usageApi.getGlobalSummary()` via edge function. Os dados de top consumers virao do breakdown por tenant do `ai_advanced`.

#### Passo 4: Refatorar `AIDiagnostics.tsx`

**Problema atual**: 3 chamadas separadas com processamento manual.

**Solucao**: Uma unica chamada ao `master-ai-advanced` que retorna:
- `summary` -> totals, last24h, escalation rates
- `layers` -> breakdown L1/L2/L3 com modelos reais
- `models` -> distribuicao com latencia e creditos
- `providers` -> breakdown Google/OpenAI/Anthropic
- `tenants` -> top consumidores
- `timeline` -> tendencia diaria (substitui `escalationTrend` vazio)

#### Passo 5: Corrigir `master-analytics` time series

**Problema atual (linha 274)**: `estimatedMrr = (tenantsCount || 0) * 200`

**Solucao**: Reutilizar a logica de `getRevenueData()` para calcular MRR real por periodo, usando `price_per_user * contracted_users + channel_price * extra_channels - descontos`.

#### Passo 6: Enriquecer `master-ai-insights`

**Problema atual**: `gatherMetrics()` busca custos de API apenas de `api_usage_logs` local.

**Solucao**: Adicionar fetch interno para `{REMOTE_SUPABASE_URL}/functions/v1/master-core?action=ai_advanced&days=30` dentro de `gatherMetrics()`. Incluir dados reais de layers, escalacao, fallbacks e feedback nos prompts enviados para a IA gerar insights.

---

### Arquivos alterados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/master-ai-advanced/index.ts` | NOVO | Proxy para `ai_advanced` do CRM |
| `supabase/config.toml` | EDITAR | Adicionar `[functions.master-ai-advanced]` |
| `src/services/masterApi.ts` | EDITAR | Adicionar `AIAdvancedData` types + `aiAdvancedApi` |
| `src/components/dashboard/APICostsWidget.tsx` | EDITAR | Trocar RPCs quebradas por edge function |
| `src/pages/AIDiagnostics.tsx` | EDITAR | Consumir `ai_advanced` como fonte unica |
| `supabase/functions/master-analytics/index.ts` | EDITAR | Corrigir MRR estimado no time series |
| `supabase/functions/master-ai-insights/index.ts` | EDITAR | Enriquecer com dados reais de IA do CRM |

### Pre-requisitos

- A Edge Function `master-core` do CRM precisa estar deployada com `action=ai_advanced` funcional
- Os secrets `REMOTE_SUPABASE_URL` e `REMOTE_SUPABASE_ANON_KEY` ja estao configurados (confirmado pela arquitetura existente em `master-ai-diagnostics`)

