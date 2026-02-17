

## Plano: Dashboard de Metricas RAG Elite no Master

### Visao Geral

Adicionar um sistema completo de monitoramento RAG no Master Panel, incluindo tabelas, ingestao via webhook, agregacao diaria e dashboard visual integrado a pagina de Diagnostico de IA existente.

---

### Passo 1: Migracoes de banco de dados

Criar as tabelas e RPCs no Supabase Master (btoyclznuuwvxbsacemw).

**Migracao 1 - Tabelas**:

- `rag_events`: tabela principal com todos os campos especificados (tenant_id, query_length, was_reformulated, vector/keyword counts, hybrid_rrf_used, reranker_used, top_similarity_score, knowledge_items_used UUID[], contextos, fallbacks, layer_used, model_used, response_confidence, chunked_results_count, feedback_type)
  - Indices em (tenant_id, created_at) e (created_at)
  - RLS habilitada: master admins podem ler cross-tenant

- `rag_quality_daily`: tabela de agregacao pre-computada
  - Todas as taxas (vector_hit_rate, keyword_fallback_rate, general_fallback_rate, avg_similarity, avg_confidence, hybrid/reranker/uopa/product/reformulation/chunk usage rates, feedback rates)
  - UNIQUE(tenant_id, date)
  - RLS habilitada

**Migracao 2 - RPCs**:

- `get_rag_quality_summary(p_tenant_id, p_days)`: retorna metricas agregadas + top knowledge items + trend vs periodo anterior
- `get_rag_quality_by_tenant(p_days)`: ranking cross-tenant por qualidade RAG
- `get_rag_daily_timeline(p_tenant_id, p_days)`: serie temporal diaria

---

### Passo 2: Edge Function `rag-metrics-ingest`

**Novo arquivo**: `supabase/functions/rag-metrics-ingest/index.ts`

- Recebe POST com batch de eventos RAG do CRM
- Valida `x-webhook-signature` com `MASTER_WEBHOOK_SECRET` usando o algoritmo `btoa(secret + payload.substring(0, 32))` (reutiliza `validateWebhookSignature` de `_shared/webhookSignature.ts`)
- Insere em `rag_events` via service role
- Responde 200 com count de eventos inseridos

---

### Passo 3: Edge Function `rag-metrics-query`

**Novo arquivo**: `supabase/functions/rag-metrics-query/index.ts`

- GET autenticado (valida JWT do usuario master)
- Aceita parametros: `action` (summary | by-tenant | timeline), `tenant_id`, `days`
- Chama as RPCs correspondentes e retorna dados formatados
- Inclui calculo do RAG Health Score: `vector_hit_rate * 0.4 + avg_confidence * 0.3 + (1 - general_fallback_rate) * 0.3`

---

### Passo 4: Cron de agregacao diaria

Usar `pg_cron` + `pg_net` para:
- Executar diariamente as 03:00 UTC
- Agregar `rag_events` do dia anterior em `rag_quality_daily`
- Limpar `rag_events` com mais de 90 dias

Sera executado via SQL insert (nao migracao, pois contem dados especificos do projeto).

---

### Passo 5: Frontend - API e Tipos

**Editar**: `src/services/masterApi.ts`

- Novos tipos: `RAGQualitySummary`, `RAGTenantRanking`, `RAGDailyTimeline`
- Novo service `ragMetricsApi`:
  - `getSummary(tenantId?, days?)` -> chama `rag-metrics-query?action=summary`
  - `getByTenant(days?)` -> chama `rag-metrics-query?action=by-tenant`
  - `getTimeline(tenantId?, days?)` -> chama `rag-metrics-query?action=timeline`

---

### Passo 6: Frontend - Dashboard RAG na pagina AIDiagnostics

**Editar**: `src/pages/AIDiagnostics.tsx`

Adicionar nova aba/secao "RAG Elite" abaixo dos graficos existentes de IA, usando Tabs para separar "Motor IA" e "RAG Elite". Componentes:

1. **RAG Health Score** (0-100): card com gauge visual, cores verde/amarelo/vermelho
2. **Grafico de linha**: vector_hit_rate vs keyword_fallback_rate (30 dias) usando Recharts AreaChart
3. **Tabela Top 10 Knowledge Items**: mais usados por tenant, com count
4. **Heatmap de qualidade por tenant**: grid com cores (verde >80%, amarelo >50%, vermelho <50%) baseado no health score
5. **Feedback Loop**: pie chart positive vs negative vs edited
6. **Filtros**: seletor de tenant_id e periodo (7d/14d/30d) - reutiliza o seletor de dias ja existente

---

### Passo 7: Registrar no config.toml

**Editar**: `supabase/config.toml`

Adicionar:
```text
[functions.rag-metrics-ingest]
verify_jwt = false

[functions.rag-metrics-query]
verify_jwt = false
```

---

### Arquivos alterados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/migrations/XXXX_rag_tables.sql` | NOVO | Tabelas rag_events e rag_quality_daily |
| `supabase/migrations/XXXX_rag_rpcs.sql` | NOVO | RPCs de consulta |
| `supabase/functions/rag-metrics-ingest/index.ts` | NOVO | Webhook de ingestao |
| `supabase/functions/rag-metrics-query/index.ts` | NOVO | API de consulta |
| `supabase/config.toml` | EDITAR | Registrar novas functions |
| `src/services/masterApi.ts` | EDITAR | Tipos + ragMetricsApi |
| `src/pages/AIDiagnostics.tsx` | EDITAR | Adicionar aba RAG Elite com dashboard |

### Pre-requisitos

- CRM precisa ser configurado para enviar eventos RAG via `createMasterClient()` para o endpoint `rag-metrics-ingest`
- `MASTER_WEBHOOK_SECRET` ja esta configurado nos secrets
- Extensoes `pg_cron` e `pg_net` habilitadas no Supabase para o cron de agregacao

