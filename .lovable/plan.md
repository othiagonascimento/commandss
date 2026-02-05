
# Plano: Implementar Sincronização Direta Master → CRM para AI Settings

## Objetivo
Adicionar endpoint `sync-to-crm` na Edge Function `master-settings` e botão na UI para forçar sincronização das configurações de IA diretamente no banco externo do CRM.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/master-settings/index.ts` | Adicionar ação POST `sync-to-crm` |
| `src/services/masterApi.ts` | Adicionar API `settingsApi.syncAISettingsToCRM()` |
| `src/pages/Settings.tsx` | Adicionar botão "Sincronizar com CRM" |

---

## Implementação Detalhada

### 1. Edge Function: `master-settings/index.ts`

Adicionar handler para `POST` com `action=sync-to-crm` que:

1. Busca as configurações atuais de `ai_global_engine` no banco local
2. Conecta ao CRM externo usando `REMOTE_SUPABASE_SERVICE_ROLE_KEY`
3. Faz upsert do registro no CRM com `onConflict: 'key,tenant_id'`
4. Retorna status de sucesso/erro

```typescript
// POST /master-settings com body { action: 'sync-to-crm' }
if (method === 'POST') {
  const body = await req.json();
  
  if (body.action === 'sync-to-crm') {
    // 1. Buscar settings locais
    const { data: localSettings } = await supabaseAdmin
      .from('master_settings')
      .select('*')
      .eq('key', 'ai_global_engine')
      .single();
    
    // 2. Conectar ao CRM externo
    const crmUrl = Deno.env.get('REMOTE_SUPABASE_URL');
    const crmKey = Deno.env.get('REMOTE_SUPABASE_SERVICE_ROLE_KEY');
    const crmSupabase = createClient(crmUrl, crmKey);
    
    // 3. Upsert no CRM
    const { error } = await crmSupabase
      .from('master_settings')
      .upsert({
        key: 'ai_global_engine',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        ai_layer_1_model: localSettings.ai_layer_1_model,
        ai_layer_1_instructions: localSettings.ai_layer_1_instructions,
        // ... demais campos
      }, { onConflict: 'key,tenant_id' });
    
    // 4. Retornar resultado
    return new Response(JSON.stringify({ success: !error }));
  }
}
```

### 2. Service Layer: `masterApi.ts`

Adicionar nova API `settingsApi`:

```typescript
// Settings API
export const settingsApi = {
  syncAISettingsToCRM: async (): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const { data, error } = await supabase.functions.invoke('master-settings', {
      method: 'POST',
      body: { action: 'sync-to-crm' },
    });
    if (error) return { data: null, error: error.message };
    return { data: data as { success: boolean; message: string }, error: null };
  },
};
```

### 3. UI: `Settings.tsx`

Adicionar botão ao lado de "Salvar Configurações" na aba Motor de IA:

```tsx
// Após o botão "Salvar Configurações"
<Button
  variant="outline"
  onClick={async () => {
    setIsSyncingToCRM(true);
    const result = await settingsApi.syncAISettingsToCRM();
    if (result.error) {
      toast.error(`Erro ao sincronizar: ${result.error}`);
    } else {
      toast.success('Configurações sincronizadas com o CRM!');
    }
    setIsSyncingToCRM(false);
  }}
  disabled={isSyncingToCRM}
>
  {isSyncingToCRM ? <Loader2 className="animate-spin" /> : <RefreshCw />}
  Sincronizar com CRM
</Button>
```

---

## Fluxo Após Implementação

```text
[Usuário clica "Sincronizar com CRM"]
       │
       ▼
Settings.tsx → settingsApi.syncAISettingsToCRM()
       │
       ▼
Edge Function master-settings (POST action=sync-to-crm)
       │
       ├── 1. Busca ai_global_engine no banco LOCAL
       │
       ├── 2. Conecta ao CRM via REMOTE_SUPABASE_SERVICE_ROLE_KEY
       │
       └── 3. Upsert no CRM.master_settings com tenant_id fixo
                     │
                     ▼
              CRM (btoyclznuuwvxbsacemw)
              master_settings.ai_global_engine
                     │
                     ▼
              AI Agent busca prompts corretamente ✓
```

---

## Seção Técnica

### Constantes e Secrets Necessárias

| Secret | Descrição | Status |
|--------|-----------|--------|
| `REMOTE_SUPABASE_URL` | URL do Supabase externo | Já configurada |
| `REMOTE_SUPABASE_SERVICE_ROLE_KEY` | Chave de service role para bypass RLS | Já configurada |

### UUID do Master Tenant
```typescript
const MASTER_TENANT_ID = '00000000-0000-0000-0000-000000000001';
```

### Campos sincronizados
- `ai_layer_1_model`, `ai_layer_1_instructions`
- `ai_layer_2_model`, `ai_layer_2_instructions`
- `ai_layer_3_model`, `ai_layer_3_instructions`
- `ai_layer_1_cost`, `ai_layer_2_cost`, `ai_layer_3_cost`
- `updated_at`

---

## Pré-requisitos no CRM (SQL Manual)

Antes de usar o botão, execute no Supabase externo:

```sql
-- 1. Corrigir nulls existentes
UPDATE master_settings 
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- 2. Tornar coluna NOT NULL
ALTER TABLE master_settings 
ALTER COLUMN tenant_id SET NOT NULL,
ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- 3. Criar constraint UNIQUE (se não existir)
ALTER TABLE master_settings 
ADD CONSTRAINT master_settings_key_tenant_unique 
UNIQUE (key, tenant_id);
```

---

## Resultado Esperado

1. Botão "Sincronizar com CRM" aparece na aba Motor de IA
2. Ao clicar, as configurações são enviadas diretamente ao CRM externo
3. O registro `ai_global_engine` é criado/atualizado no CRM
4. O agente do CRM passa a usar os prompts corretos
