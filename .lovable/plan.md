
# Correção das 5 Lacunas do Motor de IA

## Visao Geral

O motor de IA funciona, mas tem restrições desnecessárias que impedem flexibilidade total. Este plano corrige 5 problemas concretos para que qualquer modelo possa ser usado em qualquer camada e tudo fique sincronizado automaticamente.

---

## Lacuna 1: Modelos travados por camada

**Problema**: Os dropdowns de seleção de modelo na Settings e nos editores filtram por `layer_category`. Um modelo cadastrado como "Elite" nunca aparece na camada "Router".

**Solução**: Nos 3 arquivos que usam `useGroupedModels()`, mudar para listar **todos** os modelos ativos em cada dropdown, em vez de filtrar por categoria. A categoria passa a ser apenas informativa (badge visual), não restritiva.

**Arquivos**:
- `src/pages/Settings.tsx` -- trocar `modelsByCategory.router` / `.standard` / `.elite` por lista completa de modelos ativos
- `src/components/tenant/TenantAIEngineEditor.tsx` -- mesma mudanca
- `src/components/templates/UopaAICoreEditor.tsx` -- mesma mudanca
- `src/hooks/useAvailableModels.ts` -- adicionar export `allActive` na resposta de `useGroupedModels` para facilitar

---

## Lacuna 2: Catálogo desconectado da tabela de custos

**Problema**: Ao criar um modelo em `ai_available_models`, nenhum registro é criado em `api_cost_config`. O `log-api-usage` não encontra o custo e o tracking fica quebrado.

**Solução**: No hook `useCreateAIModel` (`useAIModelsCatalog.ts`), após inserir na `ai_available_models`, fazer upsert na `api_cost_config` com valores default:
- `provider` = mesmo do modelo
- `model` = `model_id`
- `operation` = `'chat'`
- `display_name` = mesmo
- `input_cost_per_1m_usd` = valor do `cost_per_1k_tokens * 1000` (conversao) ou null
- `is_active` = true

Mesma logica no `useUpdateAIModel` para manter sincronizado.

**Arquivo**: `src/hooks/useAIModelsCatalog.ts`

---

## Lacuna 3: Providers hardcoded (só Google, OpenAI, Anthropic)

**Problema**: O `ModelFormDialog` tem uma lista fixa de 3 providers. Não é possível cadastrar modelos DeepSeek, Mistral, Cohere, etc.

**Solução**: Expandir a lista `PROVIDERS` para incluir mais opcoes e adicionar um campo "Outro" que permite digitar o nome do provider livremente.

**Arquivo**: `src/components/ai-engine/ModelFormDialog.tsx`

Mudancas:
- Adicionar providers: `deepseek`, `mistral`, `cohere`, `meta`
- Adicionar opcao `other` que habilita um Input de texto livre
- Remover type constraint de `'google' | 'openai' | 'anthropic'` para aceitar qualquer string
- Atualizar `PROVIDER_COLORS` no `ModelCatalogManager.tsx` com cores para novos providers (e um fallback cinza para desconhecidos)

**Arquivos**: `src/components/ai-engine/ModelFormDialog.tsx`, `src/components/ai-engine/ModelCatalogManager.tsx`, `src/hooks/useAIModelsCatalog.ts` (relaxar tipo `provider`)

---

## Lacuna 4: Filtro de providers no catálogo também é hardcoded

**Problema**: O filtro de providers na tabela do catalogo so mostra Google/OpenAI/Anthropic.

**Solução**: Gerar a lista de providers dinamicamente a partir dos modelos cadastrados.

**Arquivo**: `src/components/ai-engine/ModelCatalogManager.tsx`

---

## Lacuna 5: Sem aviso quando modelo não tem custo configurado

**Problema**: Se um modelo está no catalogo mas nao tem registro na `api_cost_config`, nao ha indicação visual. O tracking de custos falha silenciosamente.

**Solução**: Na tabela do catalogo (`ModelCatalogManager`), quando `cost_per_1k_tokens` for null, mostrar um badge de aviso amarelo "Sem custo" com tooltip explicando que o tracking de API costs não funcionará para este modelo.

**Arquivo**: `src/components/ai-engine/ModelCatalogManager.tsx`

---

## Resumo de Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useAvailableModels.ts` | Adicionar `allActive` ao retorno de `useGroupedModels` |
| `src/hooks/useAIModelsCatalog.ts` | Relaxar tipo provider; auto-sync com `api_cost_config` no create/update |
| `src/components/ai-engine/ModelFormDialog.tsx` | Expandir providers com opcao "Outro" (texto livre) |
| `src/components/ai-engine/ModelCatalogManager.tsx` | Providers dinâmicos no filtro; badge "Sem custo"; cores para novos providers |
| `src/pages/Settings.tsx` | Usar todos modelos ativos em cada dropdown (sem filtro por layer) |
| `src/components/tenant/TenantAIEngineEditor.tsx` | Usar todos modelos ativos em cada dropdown |
| `src/components/templates/UopaAICoreEditor.tsx` | Usar todos modelos ativos em cada dropdown |

---

## Detalhes Tecnicos

### Auto-sync api_cost_config (Lacuna 2)
```typescript
// Após insert em ai_available_models, sincronizar custo:
await supabase.from('api_cost_config').upsert({
  provider: model.provider,
  model: model.model_id,
  operation: 'chat',
  display_name: model.display_name,
  input_cost_per_1m_usd: model.cost_per_1k_tokens 
    ? model.cost_per_1k_tokens * 1000 
    : null,
  is_active: true,
}, { onConflict: 'provider,model' });
```

### Provider livre (Lacuna 3)
```typescript
const PROVIDERS = [
  { value: 'google', label: 'Google' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'meta', label: 'Meta (Llama)' },
  { value: 'other', label: 'Outro...' },
];
// Se "other" selecionado, mostra Input para digitar
```

### Dropdowns sem restrição (Lacuna 1)
```typescript
// Antes: modelsByCategory.router.map(...)
// Depois: allActiveModels.map(model => ...)
// Com badge visual da categoria original ao lado do nome
```
