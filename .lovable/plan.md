
# Plano de Correção do Motor de IA

## Diagnóstico Confirmado

Seus dados SQL mostraram claramente:

| Campo | Valor |
|-------|-------|
| `value` | `{}` (vazio) |
| `ai_layer_1_model` | `gemini-2.0-flash` |
| `ai_layer_2_model` | `gpt-4o-standard` |
| `ai_layer_3_model` | `claude-3-5-sonnet-20241022` |
| `has_layer1_instructions` | `true` |

**O banco tem colunas separadas e elas já estão preenchidas!** O problema está em:

1. **Edge Function** - Salva no `value` JSONB (errado)
2. **Frontend** - Lê do `value` JSONB (errado)

---

## Correções Necessárias

### 1. Edge Function (`master-settings/index.ts`)

**Problema (linhas 209-230):** Monta objeto para `value` ao invés de usar colunas separadas.

**Correção:**
```typescript
// ANTES: salva no value
const updateData = {
  value: valueToSave,
  updated_at: new Date().toISOString(),
  updated_by: userId,
};

// DEPOIS: salva nas colunas corretas
if (key === 'ai_global_engine') {
  const updateData = {
    ai_layer_1_model,
    ai_layer_2_model,
    ai_layer_3_model,
    ai_layer_1_instructions,
    ai_layer_2_instructions,
    ai_layer_3_instructions,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };
  // UPDATE usando estas colunas
}
```

### 2. Frontend (`Settings.tsx`)

**Problema (linhas 115-126):** Lê do `value` JSONB.

**Correção:**
```typescript
// ANTES: lê do value
useEffect(() => {
  if (aiEngineSettings?.value) {
    const v = aiEngineSettings.value as Record<string, string>;
    setAiLayer1Model(v.ai_layer_1_model || '');
    // ...
  }
}, [aiEngineSettings]);

// DEPOIS: lê das colunas diretas
useEffect(() => {
  if (aiEngineSettings) {
    setAiLayer1Model(aiEngineSettings.ai_layer_1_model || '');
    setAiLayer1Instructions(aiEngineSettings.ai_layer_1_instructions || '');
    setAiLayer2Model(aiEngineSettings.ai_layer_2_model || '');
    setAiLayer2Instructions(aiEngineSettings.ai_layer_2_instructions || '');
    setAiLayer3Model(aiEngineSettings.ai_layer_3_model || '');
    setAiLayer3Instructions(aiEngineSettings.ai_layer_3_instructions || '');
  }
}, [aiEngineSettings]);
```

---

## Sobre o Erro `t.slug does not exist`

Isso confirma que a tabela `tenants` no Supabase externo **não tem coluna `slug`**. Execute este SQL para verificar as colunas existentes:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public'
ORDER BY ordinal_position;
```

Provavelmente existe uma coluna com nome diferente (como `subdomain` ou `domain`) que deve ser usada no lugar.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/master-settings/index.ts` | Usar colunas separadas `ai_layer_X_model` ao invés do JSONB `value` |
| `src/pages/Settings.tsx` | Ler diretamente das colunas ao invés do objeto `value` |

---

## Resultado Esperado

Após as correções:
- Salvar Motor de IA funcionará sem erros
- Os dados existentes (já configurados) aparecerão no frontend
- Atualizações serão persistidas corretamente
- Webhook para tenants continuará funcionando
