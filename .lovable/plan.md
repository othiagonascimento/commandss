
# PLANO ELITE: REFATORACAO COMPLETA DO MASTER UOPA

## GARANTIA DE SEGURANCA

Todas as alteracoes seguem o principio **ADITIVO**, nao **SUBSTITUTIVO**:
- Nenhuma logica de negocio sera alterada
- Nenhuma integracao com Supabase sera modificada
- Nenhuma rota ou endpoint sera removido
- Apenas OTIMIZACOES de performance e MELHORIAS visuais

---

## FASE 1: PERFORMANCE CRITICA (Zero quebras)

### 1.1 Consolidar usePermissions.ts - ELIMINAR WATERFALL

**Problema atual:** 3 queries sequenciais (waterfall) causando ~1.5s de delay.

**Solucao:**
```
ANTES:                           DEPOIS:
Query 1 (master-user) →          Query UNICA (master-user-full) →
   wait...                          Retorna: { user, roles, permissions }
Query 2 (roles) →                   staleTime: 60000ms
   wait...
Query 3 (permissions) →
   wait...
```

**Mudanca no arquivo:** `src/hooks/usePermissions.ts`
- Criar novo endpoint no `master-data` Edge Function que retorna tudo de uma vez
- Adicionar `staleTime: 60000` para cache de 1 minuto
- Manter todas as funcoes de permissao EXATAMENTE iguais

### 1.2 Adicionar staleTime em Todas as Queries Criticas

| Arquivo | Query | staleTime Atual | Novo staleTime |
|---------|-------|-----------------|----------------|
| `Tenants.tsx` | tenants | 0 | 30000ms |
| `TenantDetail.tsx` | tenant, users, features, usage | 0 | 30000ms |
| `Settings.tsx` | master-settings, ai-engine-settings | 0 | 60000ms |
| `TemplateEditor.tsx` | template | 0 | 30000ms |
| `Index.tsx` (Dashboard) | useMasterDashboard | 0 | 30000ms |

**Garantia:** Apenas adiciona opcao de cache, nao altera dados.

### 1.3 Lazy Loading para Componentes Pesados

Aplicar `React.lazy()` nos componentes de tabs para carregar sob demanda:

```typescript
// TenantDetail.tsx - Exemplo
const TenantModulesEditor = lazy(() => import('@/components/tenant/TenantModulesEditor'));
const TenantLimitsEditor = lazy(() => import('@/components/tenant/TenantLimitsEditor'));
// ... outros 15 componentes
```

**Garantia:** Comportamento identico, apenas carrega quando necessario.

---

## FASE 2: RESPONSIVIDADE MOBILE-FIRST

### 2.1 Corrigir AppSidebar.tsx

**Problemas:**
- Breakpoint de mobile em `lg:` (1024px), deveria ser `md:` (768px)
- Menu mobile sem animacao de slide
- Overlay sem gesto de swipe
- Botao de fechar pequeno demais (44x44 minimo para touch)

**Correcoes:**
1. Mudar de `lg:hidden` para `md:hidden` no botao de menu
2. Adicionar `transition-transform` + `translate-x` para animacao de slide
3. Aumentar botao de fechar para `size="lg"` (48x48)
4. Adicionar logo UOPA no header do menu mobile

### 2.2 Corrigir TabsList em Todas as Paginas

**Paginas afetadas:** TenantDetail.tsx, Settings.tsx, TemplateEditor.tsx

**Solucao UNICA aplicada em todas:**

```typescript
// Componente reutilizavel: ScrollableTabsList
<ScrollArea className="w-full" orientation="horizontal">
  <TabsList className="inline-flex w-max gap-1 p-1">
    {tabs.map(tab => (
      <TabsTrigger key={tab.value} value={tab.value} className="min-w-fit whitespace-nowrap">
        {tab.icon}
        <span className="hidden sm:inline ml-2">{tab.label}</span>
      </TabsTrigger>
    ))}
  </TabsList>
</ScrollArea>
```

**Garantia:** Mantem todos os valores e comportamentos de tabs, apenas melhora scroll.

### 2.3 Tabelas Responsivas

**Arquivo:** `Tenants.tsx` (e outras tabelas)

**Solucao:**
```typescript
// Mobile: Cards empilhados
// Desktop: Tabela tradicional

<div className="md:hidden space-y-3">
  {tenants.map(tenant => (
    <TenantCard key={tenant.id} tenant={tenant} />
  ))}
</div>

<div className="hidden md:block">
  <Table>...</Table>
</div>
```

**Garantia:** Dados identicos, apenas layout diferente por breakpoint.

---

## FASE 3: UI/UX ELITE

### 3.1 Header Dinamico com Dados Reais

**Arquivo:** `src/components/dashboard/Header.tsx`

**Mudancas:**
1. Usar dados do AuthContext para nome do usuario
2. Buscar status real do sistema (health check simples)
3. Contador de notificacoes real (ou ocultar badge se zero)

```typescript
// ANTES (hardcoded)
<span className="text-sm font-medium">Admin</span>

// DEPOIS (dinamico)
const { user } = useAuth();
const { masterUser } = usePermissions();
<span className="text-sm font-medium">
  {masterUser?.full_name || user?.email?.split('@')[0] || 'Usuario'}
</span>
```

### 3.2 Breadcrumbs em Paginas de Detalhe

**Paginas:** TenantDetail.tsx, TemplateEditor.tsx, EditTenant.tsx

**Componente novo:** `src/components/ui/breadcrumbs.tsx`

```typescript
<Breadcrumbs items={[
  { label: 'Tenants', href: '/tenants' },
  { label: tenant.name, current: true },
]} />
```

### 3.3 Estados Vazios Melhorados

**Problema atual:**
```typescript
<div className="text-center py-12 text-muted-foreground">
  Nenhum tenant encontrado.
</div>
```

**Solucao ELITE:**
```typescript
<EmptyState
  icon={Building2}
  title="Nenhum tenant encontrado"
  description="Crie o primeiro tenant para comecar a gerenciar empresas"
  action={{ label: "Criar Tenant", onClick: () => navigate('/tenants/new') }}
/>
```

### 3.4 Feedback de Acoes Consistente

**Padronizar em TODOS os mutations:**
1. Toast de loading durante operacao
2. Toast de sucesso com mensagem clara
3. Toast de erro com detalhes uteis
4. Indicador visual no botao (spinner)

```typescript
// Padrao a seguir
onMutate: () => toast.loading('Salvando...', { id: 'save' }),
onSuccess: () => toast.success('Salvo com sucesso!', { id: 'save' }),
onError: (err) => toast.error(`Erro: ${err.message}`, { id: 'save' }),
```

---

## FASE 4: LIMPEZA DE CODIGO

### 4.1 Remover Arquivo Morto

**Remover:** `src/App.css` (58 linhas de CSS do boilerplate Vite, nao usado)

### 4.2 Consolidar use-toast

**Situacao atual:**
- `src/hooks/use-toast.ts` (real)
- `src/components/ui/use-toast.ts` (re-export)

**Acao:** Manter apenas `src/hooks/use-toast.ts`, atualizar imports.

### 4.3 Remover Hook Nao Usado

**Arquivo:** `src/hooks/useTenantByDomain.ts`

Esse hook resolve tenant por dominio, funcionalidade do CRM, nao do Master.
Verificar se ha algum import antes de remover.

---

## FASE 5: LAYOUT ELITE PROPOSTO

### 5.1 Dashboard Redesign

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (dinamico com usuario real)                          │
├────────┬────────────────────────────────────────────────────┤
│        │ ┌──────────┬──────────┬──────────┬──────────┐      │
│ SIDE   │ │ TENANTS  │ USUARIOS │ LEADS    │ MRR      │      │
│ BAR    │ │ ████     │ ████     │ ████     │ ████     │      │
│        │ └──────────┴──────────┴──────────┴──────────┘      │
│ (com   │                                                     │
│ grupos │ ┌─────────────────────────────────────────────┐    │
│ colap- │ │ GRAFICO DE EVOLUCAO (tabs: MRR/Growth/Act) │    │
│ saveis)│ └─────────────────────────────────────────────┘    │
│        │                                                     │
│        │ ┌──────────┬──────────┬──────────┬──────────┐      │
│        │ │ MSGS     │ ASSINA.  │ NOVOS 7d │ LEADS 7d │      │
│        │ └──────────┴──────────┴──────────┴──────────┘      │
│        │                                                     │
│        │ ┌─────────────────────────────────────────────┐    │
│        │ │ AI INSIGHTS (full width)                    │    │
│        │ └─────────────────────────────────────────────┘    │
│        │                                                     │
│        │ ┌─────────────┬─────────────┬─────────────────┐    │
│        │ │ ALERTAS     │ API COSTS   │ DIST. PLANOS    │    │
│        │ └─────────────┴─────────────┴─────────────────┘    │
└────────┴────────────────────────────────────────────────────┘
```

### 5.2 TenantDetail Redesign

**Tabs atuais (11):**
Overview, Template, Commercial, Resources, AI Engine, Users, Subscription, Branding, Domains, Onboarding, Economics

**Proposta de agrupamento:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar   NOME DO TENANT   [Badge Plano] [Status]          │
│            slug-do-tenant                    [Impersonate]  │
├─────────────────────────────────────────────────────────────┤
│ [Geral] [Comercial] [Recursos] [IA] [Branding] [Avancado]   │
│  ↓                                                          │
│  ScrollArea horizontal com setas em mobile                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTEUDO DA TAB ATIVA                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mapeamento:**
- Geral: Overview + Onboarding
- Comercial: Commercial + Subscription + Economics
- Recursos: Resources (Modules + Limits)
- IA: AI Engine + Template
- Branding: Branding + Domains
- Avancado: Users + Overrides

### 5.3 Settings Redesign

**Tabs atuais (6):** Geral, Motor IA, Prompts Base, Notificacoes, Seguranca, API

**Layout proposto:**
```
┌─────────────────────────────────────────────────────────────┐
│ CONFIGURACOES                         [Salvar Alteracoes]   │
├─────────────────────────────────────────────────────────────┤
│ [Geral] [IA & Prompts] [Notificacoes] [Seguranca] [API]     │
│                                                             │
│  Cada tab com cards bem organizados                         │
│  Botao de salvar contextual por secao                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FASE 6: POLISH FINAL

### 6.1 Animacoes Suaves

Adicionar transicoes em:
- Troca de tabs: `transition-opacity duration-200`
- Cards ao aparecer: `motion.div` com fade-in
- Sidebar collapse: ja tem, verificar suavidade

### 6.2 Atalhos de Teclado

| Atalho | Acao |
|--------|------|
| `Cmd/Ctrl + K` | Abrir busca global |
| `Esc` | Fechar modais/sidebars |
| `Cmd/Ctrl + S` | Salvar formulario ativo |

### 6.3 Tipografia Hierarquica

**Escala definida:**
- H1 (Page Title): `text-2xl font-bold`
- H2 (Section Title): `text-lg font-semibold`
- H3 (Card Title): `text-base font-medium`
- Body: `text-sm`
- Caption: `text-xs text-muted-foreground`

---

## ARQUIVOS A MODIFICAR (Ordem de execucao)

### Prioridade CRITICA (Performance)

| # | Arquivo | Tipo de Mudanca |
|---|---------|-----------------|
| 1 | `supabase/functions/master-data/index.ts` | Adicionar endpoint `master-user-full` |
| 2 | `src/hooks/usePermissions.ts` | Consolidar queries + staleTime |
| 3 | `src/pages/Tenants.tsx` | Adicionar staleTime |
| 4 | `src/pages/TenantDetail.tsx` | staleTime + lazy loading |
| 5 | `src/pages/Settings.tsx` | staleTime |
| 6 | `src/pages/Index.tsx` | staleTime no useMasterDashboard |

### Prioridade ALTA (Responsividade)

| # | Arquivo | Tipo de Mudanca |
|---|---------|-----------------|
| 7 | `src/components/layout/AppSidebar.tsx` | Breakpoints + animacao mobile |
| 8 | `src/components/ui/scrollable-tabs.tsx` | NOVO componente reutilizavel |
| 9 | `src/pages/TenantDetail.tsx` | Usar ScrollableTabs |
| 10 | `src/pages/Settings.tsx` | Usar ScrollableTabs |
| 11 | `src/pages/TemplateEditor.tsx` | Usar ScrollableTabs |
| 12 | `src/pages/Tenants.tsx` | Tabela responsiva (cards mobile) |

### Prioridade MEDIA (UI/UX)

| # | Arquivo | Tipo de Mudanca |
|---|---------|-----------------|
| 13 | `src/components/dashboard/Header.tsx` | Dados dinamicos |
| 14 | `src/components/ui/breadcrumbs.tsx` | NOVO componente |
| 15 | `src/components/ui/empty-state.tsx` | NOVO componente |
| 16 | `src/pages/TenantDetail.tsx` | Adicionar breadcrumbs |
| 17 | `src/pages/TemplateEditor.tsx` | Adicionar breadcrumbs |
| 18 | `src/pages/Tenants.tsx` | Empty state melhorado |

### Prioridade BAIXA (Limpeza)

| # | Arquivo | Tipo de Mudanca |
|---|---------|-----------------|
| 19 | `src/App.css` | REMOVER |
| 20 | `src/components/ui/use-toast.ts` | Atualizar para re-export simples |
| 21 | `src/hooks/useTenantByDomain.ts` | REMOVER se nao usado |

---

## METRICAS DE SUCESSO

| Metrica | Atual (Estimado) | Meta ELITE | Como Medir |
|---------|------------------|------------|------------|
| Time to Interactive | ~3.5s | <1.5s | Lighthouse |
| Queries por navegacao | 3-7 | 1-2 | Network tab |
| Mobile Usability | ~70 | >95 | Lighthouse |
| staleTime medio | 0ms | 30-60s | Codigo |
| Componentes lazy | 0 | 15+ | Codigo |

---

## CHECKLIST DE VALIDACAO (pos-implementacao)

- [ ] Login continua funcionando?
- [ ] Dashboard carrega dados reais?
- [ ] Criar/editar tenant funciona?
- [ ] Publicar template funciona?
- [ ] Salvar configuracoes de IA propaga para CRM?
- [ ] Menu mobile abre/fecha corretamente?
- [ ] Todas as tabs funcionam em todas as paginas?
- [ ] Nenhum erro no console?
- [ ] Responsivo em 320px, 768px, 1024px, 1440px?
