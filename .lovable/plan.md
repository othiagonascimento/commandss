
## Plano v2: FinOps Command Center — Observabilidade Nível Bigtech

### Filosofia de UX (inspiração: Datadog, Stripe Sigma, Vercel, Linear)

1. **Drill-down universal** — toda métrica/linha clica e abre painel lateral (sheet) com breakdown, série temporal e amostras de logs reais (`api_usage_logs`).
2. **Time-travel global** — period filter no header se aplica a todas as páginas FinOps via `URLSearchParams` (compartilhável, bookmarkable). Suporta presets (Hoje, 7d, 30d, MTD, mês anterior, custom).
3. **Densidade > decoração** — tabelas estilo Linear/Stripe (sticky header, sort por qualquer coluna, column visibility toggle, pin de colunas, virtual scroll para listas grandes).
4. **Sparklines inline** — toda KPI tem mini-chart de 30d ao lado do número.
5. **Comparação automática** — toda métrica mostra delta vs período anterior (mesma duração) com indicador de tendência e cor semântica (margem ↑ verde, custo ↑ vermelho).
6. **Anomaly-first** — banner persistente no topo se houver anomalias high/critical não reconhecidas. Counter de anomalias no menu lateral.
7. **Cmd+K** — command palette global ("Ir para tenant X", "Ver custo do modelo Y", "Mudar para abril/2026", "Exportar overview CSV").
8. **Saved views** — usuário Master pode salvar combinação de filtros (ex: "Tenants deficitários jan/2026") em `localStorage`.
9. **Live mode** (opcional) — toggle que faz refetch a cada 30s com indicador pulsante.
10. **Acessibilidade & dark-first** — alta densidade de info exige contraste WCAG AA, tabular-nums em números, monospace em IDs.

### Arquitetura de informação

```text
FinOps (novo grupo no sidebar, ícone DollarSign, badge contador anomalias críticas)
├── /finops                        Command Center (overview executivo)
├── /finops/explorer               Explorer (query builder visual sobre api_usage_logs)
├── /finops/tenants                Tenants P&L
│   └── /finops/tenants/:id        Tenant deep-dive (drawer ou rota)
├── /finops/users                  Usuários CRM P&L
│   └── /finops/users/:id          User deep-dive
├── /finops/ai                     AI Economics (tabs: Modelos / Layers / Operações / Fallbacks / Tokens / Erros)
├── /finops/media                  Mídia & Storage
├── /finops/infra                  Infra & Overhead (Load Balancer, CDN, GCS)
├── /finops/investor               Investor View
├── /finops/anomalies              Anomalias & Alertas (inbox style)
└── /finops/settings
    ├── /finops/settings/pricing   Pricing IA (histórico + nova versão)
    └── /finops/settings/budgets   Output Token Budgets
```

Rotas Master-only via guard. URL params compartilhados: `?period=2026-04` ou `?from=...&to=...&compare=prev`.

### Detalhes por tela

#### 1. Command Center (`/finops`)
Layout grid 12-col denso:
- **Linha 1 — Hero KPIs (6 cards)** com sparkline 30d, delta vs período anterior, badge de confiança:
  Receita estimada • Custo total • Margem BRL • Margem % • Custo/mensagem • Custo/usuário ativo
- **Linha 2 — Decomposição de custo** (donut + legenda interativa):
  IA / Mídia / Infra / Outros — clicar segmento filtra páginas filhas.
- **Linha 3 — Time series** (área empilhada): custo IA vs custo mídia vs receita estimada, com brush para zoom temporal.
- **Linha 4 — Top 5 tenants deficitários** (mini-tabela com link "Ver todos →") + **Top 5 modelos por custo** + **Anomalias recentes** (3 cards lado a lado).
- **Footer**: badge de saúde dos dados (ex: "12.4M logs analisados • última ingestão há 2min • confiança média Alta").

#### 2. Explorer (`/finops/explorer`) — diferencial bigtech
Query builder visual sobre `api_usage_logs`:
- Linhas: GROUP BY (tenant / user / model / layer / operation / channel / day / hour)
- Métricas: SUM(cost_brl), SUM(credits_consumed), AVG(latency_ms), COUNT, error_rate, fallback_rate
- Filtros: provider, model, layer, operation, channel, mode, success, tenant, date range
- Visualizações: tabela / time series / heatmap / breakdown bars
- "Salvar como saved view" + "Exportar CSV" + "Copiar link compartilhável"
- Backend: usa `finops-explorer` action (se backend não tiver, fallback para combinação de `finops-ai-models`/`finops-ai-operations` com filtros — listar como follow-up).

#### 3. Tenants P&L (`/finops/tenants`)
Tabela densa com colunas configuráveis:
Tenant • Status • Receita • Custo IA • Custo mídia • Infra rateada • Custo total • Créditos • Mensagens • Usuários ativos • Custo/msg • Custo/usuário • Margem BRL • Margem % • Risco (badge color-coded)
- Filtro rápido: "Somente deficitários", "Top 20 por custo", "Por plano"
- Ordenação multi-coluna
- Heatmap de margem na coluna lateral
- Click → drawer com breakdown completo: histórico mensal de custo/receita/margem, top usuários do tenant, top modelos do tenant, eventos de mídia, anomalias específicas
- Bulk action: "Exportar selecionados"

#### 4. Usuários (`/finops/users`)
Mesma estrutura, agregando usuário CRM. Drawer mostra: timeline de eventos IA, custo por operação, comparação vs média do tenant, sample de últimas 20 chamadas.

#### 5. AI Economics (`/finops/ai`)
Tabs com nav sticky:
- **Modelos**: tabela + mini bar chart custo/chamada inline, coluna "Tendência 7d" sparkline
- **Layers**: 3 cards Layer 1/2/3 com KPIs próprios + tabela detalhada
- **Operações**: matriz operation × channel (heatmap de custo)
- **Fallbacks**: Sankey provider/model origem → destino com custo associado
- **Tokens**: distribuição output/input ratio (histograma) + lista outliers
- **Erros**: timeline error_rate por modelo + tabela com `usage_missing_reason` agrupado

#### 6. Mídia (`/finops/media`)
- KPIs: bytes uploaded, deleted, storage atual, custo estimado
- Treemap por folder/strategy
- Tabela tenant × folder
- Seção "Vídeo Commerce": funil status (uploading → processing → completed → failed_recoverable) com counts e tempo médio em cada fase
- Lista "Jobs presos" (>1h em uploading/processing) — actionable

#### 7. Infra (`/finops/infra`)
- Cards: Load Balancer (badge "overhead" ou "investimento" baseado em heurística — Cloud CDN ativo? Armor? domínio público?), Cloud CDN, GCS/Video, Outros
- Tabela `platform_cost_allocations` filtrada por mês
- Bloco "Análise estratégica do Load Balancer" com diagnóstico textual baseado em metadata
- Rateio simulado por tenant ativo / usuário / mensagem (3 visões)

#### 8. Investor View (`/finops/investor`)
Modo "apresentação" — full-width, fonte maior, sem chrome:
- 4 KPIs gigantes (Receita / Custo / Margem / Tenants ativos) com delta MoM
- Gráfico "Margem de contribuição ao longo do tempo"
- "Cost stack" empilhado por categoria
- Bloco "Perguntas que este painel responde" (lista do brief)
- Bloco "Riscos & Oportunidades" (top 3 cada, gerados a partir das anomalias)
- Botão "Exportar como PDF" (print stylesheet)

#### 9. Anomalias (`/finops/anomalies`)
Inbox style (Linear-like):
- Lista lateral com filtros (severidade, tipo, status: aberta/reconhecida/resolvida)
- Painel direito com detalhe da anomalia selecionada: descrição, entidade afetada, valor observado vs esperado, recomendação, link para tela relacionada, botão "Marcar como reconhecida" (persistir em localStorage por enquanto, ou tabela futura)
- Counter de não-reconhecidas no badge do menu

#### 10. Pricing Settings (`/finops/settings/pricing`)
- Tabela: provider × model com preço atual destacado e timeline horizontal de versões
- Click no modelo → drawer com histórico completo + form "Criar nova versão" (`effective_from` no futuro)
- Aviso vermelho em modelos sem pricing ativo (referenciados em logs mas sem linha em `ai_model_pricing_history`)
- Cota USD/BRL em destaque (e quem alterou por último)

#### 11. Budgets Settings (`/finops/settings/budgets`)
- Tabela editável inline: layer × operation × channel × max_output_tokens × is_active
- Toggle "modo simulação" — mostra impacto estimado no custo se aplicar (baseado nos últimos 30d)
- Banner: "alterações podem levar até ~60s para propagar"

### Componentes compartilhados (novos)

```
src/components/finops/
├── FinOpsShell.tsx              wrapper com header global + period filter URL-synced
├── PeriodFilterAdvanced.tsx     presets + custom range + comparação ON/OFF
├── KPICard.tsx                  número grande + sparkline + delta + confiança + tooltip
├── Sparkline.tsx                SVG inline (sem lib pesada)
├── DeltaBadge.tsx               variação % com cor semântica
├── ConfidenceBadge.tsx          Alta/Média/Baixa com tooltip explicativo
├── DataTable.tsx                tanstack-table: sort, pin, visibility, virtual scroll, CSV export
├── DrillDownDrawer.tsx          sheet lateral universal
├── MoneyCell.tsx                BRL com tabular-nums
├── TrendCell.tsx                sparkline pequeno em célula
├── HealthFooter.tsx             contador de logs + última ingestão + confiança média
├── AnomalyBanner.tsx            banner topo se houver crítica não reconhecida
├── CommandPalette.tsx           Cmd+K com ações FinOps
├── SavedViewsMenu.tsx           dropdown salvar/carregar filtros
├── ExportMenu.tsx               CSV / clipboard / link compartilhável
├── EmptyFinOpsState.tsx
└── MasterOnlyGuard.tsx
```

### Camada de dados

- `src/services/finopsApi.ts` — wrappers tipados; usa `body.action`; reaproveita retry 401/refresh.
- `src/types/finops.ts` — interfaces de todas as respostas.
- `src/hooks/finops/` — hooks react-query com:
  - `staleTime` 30s no overview, 60s nas listas, 5min no pricing
  - `keepPreviousData` para troca de filtros suave
  - `useFinOpsPeriod()` — hook que lê/escreve URL params
  - `useFinOpsAnomaliesCount()` — global, alimenta badge do sidebar
- Persistência local: `src/lib/finops/savedViews.ts`, `src/lib/finops/acknowledgedAnomalies.ts`.

### Modificações em arquivos existentes

- `src/App.tsx` — registrar 11 rotas lazy-loaded sob `<ProtectedRoute>`.
- `src/components/layout/AppSidebar.tsx`:
  - Novo grupo `finops` (ícone `DollarSign`), Master-only via `permissions.isSuperAdmin()`
  - Badge dinâmico no item raiz com count de anomalias críticas (via `useFinOpsAnomaliesCount`)
  - 2 itens em "Sistema": Pricing IA, Budgets IA
- `src/services/masterApi.ts` — extrair retry 401 em helper interno; exportar `callMasterAction(fn, action, body)`.
- `src/pages/APICosts.tsx` — banner: "Substituída por FinOps Pricing →" (manter rota legada por compat, sem remover ainda).
- `src/pages/Analytics.tsx` — card link "Visão de investidor →".
- `src/pages/AIDiagnostics.tsx` — link "Ver custo por modelo →".
- `src/pages/TenantHealth.tsx` — coluna nova "Margem" (lazy fetch via `finops-tenants`) + link drill-down.
- `src/components/ErrorBoundary.tsx` — sem mudança, só garantir compatibilidade.

### Segurança

- Toda página passa por `MasterOnlyGuard` (verifica `isSuperAdmin()`); `<ProtectedRoute>` já valida `isMaster`.
- Itens de menu filtrados antes de renderizar (não vazam para tenants).
- Custo real **nunca** consumido em telas de tenant. Nada novo é exposto em `/tenants/:id` que mostre `cost_brl`.
- Todas as chamadas via edge function (sem query direta a `api_usage_logs` no client).

### Dependências novas

- `@tanstack/react-table` — tabela com pin/sort/visibility/virtual (essencial para densidade bigtech).
- Já temos: `recharts` (gráficos), `cmdk` via shadcn `Command` (palette), `date-fns`.
- Sparkline: SVG manual (evita peso extra).

### Aceite

- Super Admin abre `/finops` e vê Command Center denso com drill-down em tudo.
- Period filter no header propaga via URL para todas as páginas FinOps.
- Tabelas suportam sort/pin/visibility/CSV; Explorer permite query ad-hoc.
- Cmd+K funciona; saved views persistem; anomalias aparecem no badge do menu.
- Custo real nunca visível para tenants; nenhuma mudança quebra páginas existentes.
- Nenhuma migração SQL; nenhuma edge function nova (tudo consome `master-analytics` no Supabase externo).
- Investor view exportável em PDF via print.

### Follow-ups (não bloqueiam)

- Action `finops-explorer` no backend (se ainda não existir) para queries ad-hoc parametrizadas.
- Tabela `master_acknowledged_anomalies` futura (hoje persistido em localStorage).
- Action de mutação para criar versão de pricing e atualizar budgets (se ainda não houver).
