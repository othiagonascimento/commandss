
# Painel Master Uôpa — Redesign Elite (Fase A revisada)

Reconstrução com **identidade visual própria**, fugindo do "look IA padrão" (Inter + cards arredondados + gradiente roxo + glass genérico). O Painel Master vira um **command center editorial**, com cara de terminal financeiro de elite cruzado com revista de design — não com mais um admin SaaS.

Backend, contratos, rotas, RLS, multitenancy e edge functions: **intocados**. Toda a refatoração é frontend.

## 1. Identidade visual Uôpa (sistema, não tema)

### Filosofia
"**Operação editorial, dados como matéria-prima**". Cada pixel comunica precisão. Inspiração conceitual: terminal Bloomberg + editorial Pentagram + densidade de informação do FT.com + sobriedade do Are.na — sem copiar nenhum.

### Tipografia (zero Inter, zero Geist)
- **Display / Hero / Numerais**: `Space Grotesk` (geométrica afiada, não-comum em SaaS) — pesos 500/600/700, tracking apertado em hero (`-0.04em`).
- **Texto / UI**: `Söhne` substituto livre → **`Inter Tight`** ❌ NÃO. Usar **`Manrope`** (mais distinto, terminações abertas, cara editorial) em 400/500/600.
- **Mono / Dados / Métricas**: `JetBrains Mono` com `font-feature-settings: "tnum","ss02","cv11"` — números tabulares, alternativas estilísticas ligadas.
- **Labels técnicos**: `JetBrains Mono` em UPPERCASE 11px, tracking `0.12em` — etiquetas tipo "MRR / 30D" como em painéis de trading.

Servidas via `@fontsource` (self-hosted, sem Google Fonts em runtime).

### Paleta — "Carbono & Plasma"
Dark exclusivo, **não roxo-IA**. HSL tokens em `index.css`:

- **Canvas**: `#0A0B0D` (carbono profundo, levemente azulado).
- **Surface 1**: `#101216` (cards).
- **Surface 2**: `#16191F` (elevated).
- **Surface 3**: `#1C2028` (overlay/sheet).
- **Hairline**: `rgba(255,255,255,0.06)` bordas; `0.10` em hover.
- **Ink primary**: `#E8EAED` (texto principal, não branco puro).
- **Ink secondary**: `#9098A3`.
- **Ink muted**: `#5A6270`.
- **Acento Uôpa "Plasma"**: `#C6FF3D` (lima-elétrico, ácido, único — vira a assinatura). Usado com parcimônia: indicadores ativos, números-chave em hero, hairline de seleção. **Nada de roxo/azul-IA**.
- **Acento "Ember"**: `#FF7A45` (alertas/atenção, terracota quente, não vermelho clichê).
- **Acento "Cobalt"**: `#3D7AFF` apenas para links/ações secundárias.
- **Sucesso**: `#5BD89A` (jade desaturado, não verde Bootstrap).
- **Crítico**: `#FF4D6A` (coral, não vermelho puro).
- **Data ramps** (mapa, charts): rampa monocromática carbono → plasma em 7 stops + rampa quente carbono → ember.

### Forma & textura
- **Radius**: `2px` padrão, `4px` cards, `8px` máximo (sheet/modal). **Zero `rounded-2xl`**. Cantos quase retos = autoridade editorial.
- **Bordas hairline 1px** sempre visíveis (não "glass borrado") — definem grid.
- **Grid base 4px** rigoroso. Spacings: 4, 8, 12, 16, 24, 32, 48, 64.
- **Sem sombras difusas**. Profundidade vem de **surfaces empilhadas + hairlines + 1 inner-glow plasma** em elementos selecionados.
- **Noise texture** sutil (8% opacity) em surface-0 — quebra o "plástico digital".
- **Régua tipográfica visível**: cabeçalhos de seção com numeração `01 — VISÃO EXECUTIVA` em mono uppercase.

### Motion
- Easings: `cubic-bezier(.2,.7,.1,1)` (quase linear, técnico, não bouncy).
- Durations: 120ms (UI), 200ms (entrada), 320ms (sheet).
- **Sem fade roxo, sem shimmer dourado**. Skeletons: barra hairline deslizando.

## 2. Linguagem visual diferenciadora

Coisas que **fazem o painel parecer Uôpa e não template**:

- **Numeração editorial das seções** (`01 / 02 / 03`) em mono uppercase no canto.
- **Crosshairs** sutis nos cantos dos KPI cards principais (4 pequenos `+` decorativos como em interfaces militares/científicas).
- **Tickers** horizontais com dados ao vivo no header (MRR · Tenants ativos · Msgs/h · Latência IA) — efeito terminal financeiro.
- **Métricas com unidade explícita ao lado** (`R$ 248k /MRR`, `1.4M /MSG/30D`) em mono.
- **Delta tipográfico**, não badge: `+12.4%` em plasma inline com o número, sem pílula.
- **Linhas de grade visíveis** em alguns cards (background blueprint sutil).
- **Hero da home** com tipografia gigante editorial (clamp 48–96px), número MRR como protagonista visual.
- **Rodapé fino** em cada card com `last_updated · source · confidence` em mono 10px — assinatura técnica.
- **Mapa do Brasil** desenhado com hairlines plasma sobre carbono, sem preenchimentos chapados — visual de mapa náutico/cartográfico.

## 3. Arquitetura visual (shell)

### Layout
- Container `max-w-[1480px]`, padding lateral `clamp(16px, 4vw, 48px)`.
- Grid base 12 colunas com gap `24px` desktop, `16px` mobile.

### Sidebar — "Rail editorial"
- Largura `232px` expandida / `56px` mini-rail.
- Fundo `surface-0` + hairline direita.
- Grupos com label mono uppercase 10px + linha hairline embaixo.
- Item ativo: **sem fundo colorido**. Apenas barra plasma `2px` à esquerda + texto em `ink-primary` + numeral mono à direita (atalho).
- 3 zonas: **COMANDO**, **CLIENTES**, **PLATAFORMA**.
- Persistência collapsed em `localStorage`.

### Header — "Faixa de comando"
Altura `52px`, fundo `surface-0` com hairline inferior, blur leve.
- Esquerda: logo Uôpa monocromática + breadcrumb mono.
- Centro: `CommandBar` (input minimalista com `⌘K` à direita, sem borda arredondada).
- Direita em ordem: **ticker compacto** (3 métricas rolando), **OpsStatus dot+label**, **NotificationsBell**, **avatar**.
- Acima do header em desktop ≥xl: **mini ticker bar** opcional (toggle) com 6 KPIs em mono.

### Mobile
- Header reduzido a 48px com logo + ⌘K + menu.
- **Bottom-nav** 5 ícones (Home, Tenants, Operações, IA, Mais) — fundo `surface-1`, hairline superior, ícone ativo com dot plasma.
- Sidebar vira drawer offcanvas (não menu lateral espremido).
- KPIs em **carrossel snap horizontal** com indicador mono `01/06`.
- Tabelas viram **cards-linha densos** com tipografia editorial.

## 4. Command Palette ⌘K

Baseado em `cmdk` (já presente). Visual:
- Modal centralizado, `surface-3`, hairline plasma `1px`, sem rounded > 4px.
- Input mono, prompt `>` à esquerda como terminal.
- Seções: `> NAVEGAR`, `> TENANTS`, `> AÇÕES`, `> RECENTES` — labels mono uppercase.
- Resultado de tenant mostra: nome em sans + `slug · estado · plano · saúde` em mono cinza.
- Atalhos visíveis à direita (`↵` `↑↓` `esc`).

## 5. Design system (`src/components/ds/`)

Primitivos com `cva`, todos compatíveis com nova linguagem:

- `Surface` (variants: `canvas | panel | raised | overlay`).
- `SectionHeader` com slot de numeração editorial.
- `MetricCard` (variants: `hero | standard | inline | ticker`) — número mono, label uppercase, delta inline, footer assinatura técnica, slot `DataQualityBadge`.
- `InsightCard` — narrativa curta + CTA (Visão→Diagnóstico→Ação).
- `AlertRow` — linha densa, severidade no marker esquerdo (barra colorida 2px, não ícone gritante).
- `StatusDot`, `HealthMarker`, `PlanTag`, `RiskTag` — todas retangulares, mono.
- `TrendDelta` — número + seta unicode em plasma/ember inline, sem badge.
- `Ticker` — strip horizontal com items animados (CSS-only).
- `Crosshair` — decoração de canto reutilizável.
- `EmptyState` editorial — número grande mono ("00"), título, subtítulo, próxima ação.
- `Skeleton` — barra hairline deslizando, não shimmer.
- `FilterBar` — chips retos, sem rounded-full.
- `TenantCard` / `TenantRow` (densidade alta, info hierarquizada).
- `ResponsiveTabs`, `MobileActionBar`, `BottomNav`.

## 6. Dashboard — "Mesa de comando"

`src/pages/Index.tsx` decomposto em `src/components/home/`:

```text
01 — VISÃO EXECUTIVA
┌──────────────────────────────────────────────────┐
│ HERO: status · período · MRR gigante editorial  │
│       + 3 KPIs satélite + ações                 │
└──────────────────────────────────────────────────┘

02 — PULSO OPERACIONAL
┌─────────┬─────────┬─────────┬─────────┬────────┐
│ Tenants │ Users   │ Msgs    │ Trials  │ Saúde  │
│ + crosshairs nos cantos, números mono           │
└─────────┴─────────┴─────────┴─────────┴────────┘

03 — DISTRIBUIÇÃO NACIONAL          04 — RADAR DE ATENÇÃO
┌──────────────────────────┬───────────────────────┐
│ Mapa hairline plasma     │ Lista densa de        │
│ por estado, side-panel   │ alertas priorizados   │
└──────────────────────────┴───────────────────────┘

05 — RECEITA & CRESCIMENTO
┌──────────────────────────────────────────────────┐
│ Area chart minimalista + insights laterais       │
└──────────────────────────────────────────────────┘

06 — MOTOR DE IA          07 — SAÚDE DA OPERAÇÃO
┌──────────────────────┬───────────────────────────┐
│ Consumo, modelos,    │ Saudáveis/atenção/críticos│
│ latência, top tenants│ + tendência               │
└──────────────────────┴───────────────────────────┘

08 — AÇÕES RÁPIDAS
```

Cada seção: numeração editorial à esquerda + título sans + ações à direita. Hero com tipografia clamp(48–96px), MRR em plasma quando saudável.

Mobile: ordem reorganizada, KPIs em carrossel snap, mapa em aspect-square, demais blocos empilhados com mesma linguagem.

## 7. Mapa do Brasil — "Cartografia operacional"

`src/components/home/HomeBrazilMap.tsx` com **D3 + GeoJSON**:

- `d3-geo` + `topojson-client` (~30kb).
- GeoJSON IBGE simplificado em `public/geo/brasil-estados.json` (~80kb, 5% precisão via mapshaper).
- **Visual cartográfico**: fundo `surface-1`, estados com fill `surface-2` + border hairline plasma `0.5px`. Estados COM tenants ganham fill em rampa carbono→plasma proporcional à densidade. Estados vazios ficam em `surface-2` com border `ink-muted`.
- **Coordenadas grid** sutis no fundo (linhas a cada 5° lat/long em opacity 4%).
- **Label mono** com sigla em estados destacados.
- Hover: estado ganha fill `plasma/12%` + tooltip mono (UF · N tenants · MRR estimado · última atividade).
- Click: `Sheet` lateral à direita com lista de cidades + tenants daquele estado.
- Tenants sem `state`: chip "Sem geolocalização (N)" em rodapé do card, abre lista própria.
- Mobile: aspect-square, mesma interação, sheet sobe de baixo.
- Skeleton: silhueta hairline do Brasil pulsando.

Hook `useTenantsByLocation` deriva no client a partir de `masterApi.listTenants` — zero alteração de backend.

## 8. Microinterações elite

- **Hover card**: hairline acende para `plasma/40%`, micro-translate `-1px`, sem glow difuso.
- **Números animam** com `AnimatedNumber` (já existe), easing técnico.
- **Ticker**: animação CSS infinita, pausa no hover.
- **Crosshairs** dos hero KPIs aparecem com leve delay (stagger 40ms).
- **Mapa**: estados aparecem com stagger 8ms (revelação cartográfica).
- **Skeleton**: barra hairline plasma deslizando 1.2s.
- **Toast (Sonner)** redesenhado: retangular, mono, hairline lateral colorida por severidade.

## 9. Preservação técnica (risco mínimo)

- Rotas (`App.tsx`) intocadas.
- `AuthContext`, `ProtectedRoute`, `usePermissions` intocados.
- Hooks de dados (`useMasterDashboard`, `useOpsHealth`, `useMasterRead`, `useAlerts`, `masterApi`) **reutilizados sem modificação**.
- `parseMasterRead` + `DataQualityBadge` + `MetricValue` continuam centrais — todo `MetricCard` novo aceita slot.
- Edge functions: zero alteração.
- Migrations: zero.
- `GlassCard` antigo vira wrapper sobre `Surface` (compat para páginas ainda não refatoradas).

## 10. Escopo desta entrega (Fase A)

1. **Tokens & fontes**: `index.css` + `tailwind.config.ts` reescritos (paleta Carbono & Plasma, Space Grotesk + Manrope + JetBrains Mono via `@fontsource`).
2. **Design system** completo em `src/components/ds/`.
3. **Shell**: novo `AppSidebar`, `Header` (com Ticker + CommandBar + OpsStatus), `DashboardLayout`, `BottomNav` mobile.
4. **CommandPalette** ⌘K global com busca de tenants + navegação + ações.
5. **Dashboard `Index.tsx`** decomposto em 8 seções editoriais.
6. **Mapa do Brasil** D3 cartográfico + GeoJSON estático.
7. **Compat**: `GlassCard` adaptado.

**Próximas fases (já alinhadas, fora deste escopo):**
- B: Tenants (lista densa editorial) + TenantDetail (dossiê).
- C: TenantHealth + Analytics + AIDiagnostics + Simulator.
- D: FinOps polish + acessibilidade + harmonização final + a11y.

## 11. Critérios de aceite

- Painel **não parece** template Lovable / shadcn padrão / admin genérico.
- Tipografia: Space Grotesk + Manrope + JetBrains Mono, **zero Inter**.
- Paleta Carbono & Plasma, **zero roxo-IA, zero azul-Stripe clichê**.
- Cantos quase retos (≤8px), hairlines ao invés de glass borrado.
- Hero com MRR em tipografia editorial gigante.
- Mapa do Brasil cartográfico funcional com drilldown.
- ⌘K abre paleta terminal-style.
- Numeração editorial 01–08 nas seções da home.
- Crosshairs nos KPI hero.
- Ticker no header com dados ao vivo.
- Mobile com bottom-nav próprio, KPIs em carrossel, sem desktop espremido.
- Nenhum endpoint, contrato ou rota alterado.

Posso seguir para implementação?
