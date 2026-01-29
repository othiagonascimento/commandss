

# Plano de Implementacao: Catalogo de Modelos de IA (Fase 6)

## Situacao Atual

A UI do Motor de IA ja existe e funciona corretamente:
- Selects dinamicos buscam da tabela `ai_available_models` via hook `useGroupedModels()`
- Textareas de instructions por layer funcionam
- Salvamento propaga para tenants via Edge Function `master-settings`

O que falta: **Interface para gerenciar o catalogo de modelos** (CRUD)

---

## Arquitetura Simplificada

Como o Supabase externo (`btoyclznuuwvxbsacemw`) e o MESMO banco usado pelo projeto Master, NAO precisamos de Edge Function proxy para CRUD!

```text
+------------------------+     +----------------------------------+
|   FRONTEND (Master)    |     |   SUPABASE EXTERNO               |
|                        |     |   btoyclznuuwvxbsacemw           |
+------------------------+     +----------------------------------+
|                        |     |                                  |
| useAvailableModels ----|--->|   ai_available_models (SELECT)   |
| useAIModelsCatalog ----|---->|   ai_available_models (CRUD)     |
|                        |     |                                  |
+------------------------+     +----------------------------------+
```

---

## Entregas

### 1. Novo Hook: `useAIModelsCatalog.ts`

Hook React Query para CRUD completo da tabela `ai_available_models`:

- `useAIModelsCatalog()` - Lista todos modelos (ativos e inativos)
- `useCreateAIModel()` - Criar novo modelo
- `useUpdateAIModel()` - Atualizar modelo existente
- `useToggleAIModelActive()` - Toggle is_active inline
- `useDeleteAIModel()` - Excluir modelo

### 2. Novo Componente: `ModelCatalogManager.tsx`

Interface de gerenciamento com:

| Elemento | Descricao |
|----------|-----------|
| Tabela | Display Name, Provider (badge), Categoria (badge), Custo, Status (toggle), Acoes |
| Filtros | Por provider (Google/OpenAI/Anthropic) e categoria (Router/Standard/Elite) |
| Busca | Por nome do modelo |
| Botao Novo | Abre dialog de criacao |
| Dialog Form | model_id, display_name, provider, layer_category, custo, contexto |
| Acoes por linha | Editar, Excluir (com confirmacao) |

### 3. Modificar `Settings.tsx`

Adicionar sub-tabs dentro da tab "Motor de IA":

```text
[Tab: Motor de IA]
  |
  +-- [Sub-Tab: Configuracao] <- UI atual (selects + instructions)
  |
  +-- [Sub-Tab: Catalogo de Modelos] <- NOVO (ModelCatalogManager)
```

---

## Detalhes Tecnicos

### Hook useAIModelsCatalog.ts

```typescript
// Arquivo: src/hooks/useAIModelsCatalog.ts

export interface AIModelCatalog {
  id: string;
  model_id: string;
  display_name: string;
  provider: 'google' | 'openai' | 'anthropic';
  layer_category: 'router' | 'standard' | 'elite';
  is_active: boolean;
  cost_per_1k_tokens: number | null;
  max_context_tokens: number | null;
  created_at: string;
}

// Lista TODOS os modelos (nao apenas ativos)
export function useAIModelsCatalog() {
  return useQuery({
    queryKey: ['ai-models-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_available_models')
        .select('*')
        .order('provider')
        .order('display_name');
      if (error) throw error;
      return data as AIModelCatalog[];
    },
  });
}

// Criar modelo
export function useCreateAIModel() {
  return useMutation({
    mutationFn: async (model) => {
      const { data, error } = await supabase
        .from('ai_available_models')
        .insert(model)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(['ai-models-catalog', 'ai-available-models']),
  });
}

// Toggle ativo/inativo
export function useToggleAIModelActive() {
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      await supabase
        .from('ai_available_models')
        .update({ is_active })
        .eq('id', id);
    },
  });
}
```

### Componente ModelCatalogManager.tsx

```typescript
// Arquivo: src/components/ai-engine/ModelCatalogManager.tsx

// - Usa useAIModelsCatalog() para listar
// - Tabela com colunas: Nome, Provider, Categoria, Custo, Ativo, Acoes
// - Badges coloridos:
//   - Provider: Google (azul), OpenAI (verde), Anthropic (roxo)
//   - Categoria: Router (sky), Standard (amber), Elite (purple)
// - Dialog para criar/editar com campos do schema
// - AlertDialog para confirmar exclusao
```

### Modificacao em Settings.tsx

```typescript
// Dentro da TabsContent value="ai-engine":

<Tabs defaultValue="config">
  <TabsList>
    <TabsTrigger value="config">Configuracao</TabsTrigger>
    <TabsTrigger value="catalog">Catalogo de Modelos</TabsTrigger>
  </TabsList>
  
  <TabsContent value="config">
    {/* UI atual dos 3 cards de layer */}
  </TabsContent>
  
  <TabsContent value="catalog">
    <ModelCatalogManager />
  </TabsContent>
</Tabs>
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useAIModelsCatalog.ts` | Hook CRUD para ai_available_models |
| `src/components/ai-engine/ModelCatalogManager.tsx` | Componente de gerenciamento |
| `src/components/ai-engine/ModelFormDialog.tsx` | Dialog de criar/editar modelo |

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Settings.tsx` | Adicionar sub-tabs no Motor de IA |

---

## Validacoes

| Validacao | Comportamento |
|-----------|---------------|
| model_id unico | Verificar antes de criar, exibir erro se existir |
| Campos obrigatorios | model_id, display_name, provider, layer_category |
| Toggle inline | Atualiza imediatamente sem recarregar pagina |
| Exclusao | AlertDialog de confirmacao antes de deletar |

---

## Fluxo de Dados

```text
1. Usuario acessa Settings > Motor de IA > Catalogo de Modelos
   |
   v
2. useAIModelsCatalog() busca todos modelos do Supabase
   |
   v
3. Tabela exibe modelos com filtros e busca
   |
   v
4. Usuario clica "Novo Modelo"
   |
   v
5. Dialog abre, usuario preenche campos
   |
   v
6. useCreateAIModel() insere no Supabase
   |
   v
7. React Query invalida cache, tabela atualiza
   |
   v
8. Selects de layer no Motor de IA atualizam automaticamente
```

---

## Resultado Final

Apos implementacao:

1. Administrador pode cadastrar novos modelos de IA (ex: GPT-5, Gemini 3)
2. Modelos aparecem automaticamente nos selects do Motor de IA
3. Toggle rapido para ativar/desativar modelos
4. Historico de modelos mantido (soft delete via is_active)

