

## Fix: Erro ao criar usuário do tenant

### Problema identificado

O erro "Edge Function returned a non-2xx status code" e generico -- o frontend nao exibe a mensagem real de erro retornada pela Edge Function. Existem dois problemas:

### 1. Frontend nao extrai o erro real da resposta

Quando a Edge Function retorna um status nao-2xx (ex: 400, 500), o Supabase client coloca a mensagem generica no `error.message`, mas o corpo da resposta com o erro real vai para `data`. O `callMasterApi` ignora o `data` quando ha `error`.

**Correcao:** Modificar `callMasterApi` em `src/services/masterApi.ts` para extrair a mensagem real do `data` quando houver erro.

### 2. Edge Function com possivel falha no upsert de `user_roles`

A Edge Function faz `upsert` com `onConflict: 'user_id,tenant_id'`, mas pode nao existir uma constraint UNIQUE nessa combinacao no banco. Alem disso, `listUsers()` sem filtros busca TODOS os usuarios do Auth para verificar duplicatas, o que pode causar timeout.

**Correcoes na Edge Function `master-users/index.ts`:**
- Substituir `listUsers()` por uma busca filtrada via `listUsers({ filter: email })` ou query direta
- Tratar o upsert de `user_roles` com fallback para insert/update separados caso o onConflict falhe
- Melhorar o log de erros para facilitar diagnostico

### Arquivos a modificar

1. **`src/services/masterApi.ts`** -- Melhorar extracaco de erros reais:
   - Quando `error` existe, verificar se `data` contem uma mensagem de erro mais especifica
   - Usar `data?.error || error.message` como mensagem

2. **`supabase/functions/master-users/index.ts`** -- Corrigir criacao de usuario:
   - Substituir `listUsers()` (busca todos) por busca filtrada por email
   - Tratar o upsert de `user_roles` com try/catch e fallback para delete+insert
   - Adicionar logs mais detalhados

### Detalhes tecnicos

**masterApi.ts - callMasterApi:**
```typescript
if (error) {
  // Extract real error from response body
  const realMessage = typeof data === 'object' && data?.error 
    ? data.error 
    : error.message;
  return { data: null, error: realMessage };
}
```

**master-users/index.ts - Busca de usuario existente:**
```typescript
// ANTES (busca TODOS os usuarios):
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
const existingUser = existingUsers?.users?.find(u => u.email === body.email);

// DEPOIS (busca filtrada):
const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers({
  filter: body.email,
});
const existingUser = existingUsers?.find(u => u.email === body.email);
```

**master-users/index.ts - Upsert de roles com fallback:**
```typescript
// Tentar upsert, se falhar por falta de constraint, fazer delete+insert
try {
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .upsert({ user_id: authUser.id, tenant_id: tenantId, role: appRole }, 
      { onConflict: 'user_id,tenant_id' });
  if (roleError) throw roleError;
} catch {
  // Fallback: delete existing + insert new
  await supabaseAdmin.from('user_roles')
    .delete().eq('user_id', authUser.id).eq('tenant_id', tenantId);
  await supabaseAdmin.from('user_roles')
    .insert({ user_id: authUser.id, tenant_id: tenantId, role: appRole });
}
```

