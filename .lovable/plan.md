

## Plano: Tornar autenticação do `master-users` resiliente

### Diagnóstico

A partir dos logs, o erro "Invalid token" ocorre na linha 360-361 do `master-users/index.ts`:

```typescript
const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
if (userError || !userData.user) throw new Error('Invalid token');
```

O `getUser(token)` faz uma chamada ao Auth server para validar o token. Quando falha (token expirado, sessão revogada, ou problema transitório de rede), a função retorna um 500 genérico sem contexto. Os logs mostram que às vezes funciona (11:19) e às vezes falha (11:15/08:16), indicando problema intermitente -- provavelmente tokens expirados ou sessões com JWT de formato antigo.

### Mudanças

#### 1. Melhorar validação de auth no `master-users/index.ts`
- Trocar `getUser(token)` por `getClaims(token)` (mais leve, não faz round-trip ao banco)
- Adicionar fallback: se `getClaims` falhar, tentar `getUser` como segunda opção
- Retornar status **401** (não 500) com mensagem descritiva do erro real
- Incluir o erro original do Supabase no log para facilitar debug

#### 2. Melhorar error handling no front-end
- Em `src/services/masterApi.ts`, detectar status 401 e mostrar toast de "Sessão expirada, faça login novamente"
- Evitar que erros de auth sejam mostrados como "Invalid token" genérico

### Arquivos alterados
- `supabase/functions/master-users/index.ts` -- auth resiliente + status 401
- `src/services/masterApi.ts` -- tratamento de 401

### Detalhe técnico
A mudança para `getClaims()` é mais eficiente pois valida o JWT localmente usando a chave de assinatura do projeto, sem consultar o banco `auth.users`. Como fallback, `getUser()` é tentado caso `getClaims` falhe por incompatibilidade de algoritmo.

