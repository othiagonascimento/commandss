
# PLANO: CORRIGIR FALLBACK DO master-user-full

## PROBLEMA RAIZ IDENTIFICADO

Os logs do Supabase confirmam:
```
Resource requested - {"resource":"master-user-full"}
ERROR - {"message":"Unknown resource: master-user-full"}
```

A Edge Function no Supabase externo **NÃO FOI ATUALIZADA** - ela ainda está com o código antigo que não tem o `case 'master-user-full'`.

## POR QUE O FALLBACK NÃO FUNCIONA

O problema está em **como o Supabase SDK trata status 500**:

1. Quando a Edge Function retorna `500`, o SDK pode:
   - Colocar a mensagem no `error.message`
   - Ou colocar no `data` como JSON parseado
   - Ou lançar uma exceção diferente

2. O fallback atual verifica apenas:
   ```typescript
   if (msg.includes('Unknown resource: master-user-full'))
   ```
   
3. Mas o erro pode vir como:
   - `error = { message: "FunctionsHttpError" }` (genérico)
   - `data = { error: "Unknown resource: master-user-full" }` (corpo da resposta)

## SOLUÇÃO: DETECTAR ERRO DE FORMA ROBUSTA

### Modificar src/hooks/usePermissions.ts

Verificar o erro de múltiplas formas:

```typescript
const { data, error } = await supabase.functions.invoke('master-data', {
  headers: { 'x-path-suffix': 'master-user-full' },
});

// Detectar erro de múltiplas formas
const errorMessage = 
  (error as any)?.message || 
  (data as any)?.error ||
  '';

// Verificar se é o erro conhecido de resource não implementado
if (errorMessage.includes('Unknown resource') || 
    (error && data?.error)) {
  console.log('[usePermissions] Falling back to legacy queries');
  return await fetchConsolidatedUserDataFallback();
}
```

---

## ARQUIVOS A MODIFICAR

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePermissions.ts` | Melhorar detecção de erro para ativar fallback |

---

## LÓGICA DE FALLBACK MELHORADA

```typescript
// Linha 98-128 - Substituir por:

const { data, error } = await supabase.functions.invoke('master-data', {
  headers: { 'x-path-suffix': 'master-user-full' },
});

// Check if response contains error (500 returns error in body)
const responseError = (data as any)?.error;
const errorMsg = (error as any)?.message || responseError || '';

// Fallback for older deployed versions without master-user-full
if (errorMsg.includes('Unknown resource') || responseError) {
  console.log('[usePermissions] master-user-full not available, using fallback');
  return await fetchConsolidatedUserDataFallback();
}

if (error) {
  console.warn('[usePermissions] Error fetching consolidated user data:', error);
  return { data: null, roles: [], permissions: [], isMasterUser: false };
}

// Success case
return {
  data: (data?.data as MasterUser | null) ?? null,
  roles: ((data?.roles || []) as MasterRole[]) ?? [],
  permissions: ((data?.permissions || []) as MasterPermission[]) ?? [],
  isMasterUser: !!data?.isMasterUser,
};
```

---

## RESULTADO ESPERADO

1. Frontend tenta `master-user-full`
2. Edge Function retorna 500 com `{"error":"Unknown resource: master-user-full"}`
3. Frontend detecta o erro no corpo da resposta (`data.error`)
4. Fallback é ativado automaticamente
5. Sistema funciona com as 3 queries legadas
6. Quando você fizer deploy da nova Edge Function, usará automaticamente a query consolidada

---

## NOTA SOBRE DEPLOY

O código da Edge Function local está **CORRETO** e tem o `case 'master-user-full'`. O problema é que o Supabase externo não tem esse código.

Para fazer o deploy, você precisa:
1. Acessar https://supabase.com/dashboard/project/btoyclznuuwvxbsacemw/functions
2. Clicar na função `master-data`
3. Clicar em "Deploy" ou atualizar o código manualmente

Ou usar a CLI:
```bash
npx supabase functions deploy master-data --project-ref btoyclznuuwvxbsacemw
```

Se não conseguir fazer deploy, a correção do fallback resolverá o problema temporariamente.
