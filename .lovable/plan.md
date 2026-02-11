

# Correção definitiva: Reenvio de email de boas-vindas

## Diagnóstico (causa raiz encontrada)

O erro `"Email and password are required"` **nao existe em nenhum lugar do codigo local**. A mensagem local equivalente e `"Email, nome e senha sao obrigatorios"` (em portugues). Isso confirma que a **Edge Function `master-users` deployada no Supabase externo esta desatualizada** e nao possui a rota `resend-welcome`.

Quando o request POST chega com path suffix `tenantId/userId/resend-welcome`, a versao antiga nao reconhece essa rota, cai no handler generico de criacao de usuario, e retorna o erro porque o body `{}` nao tem email/password.

## Solucao

### 1. Redesenhar o master-users para ser mais robusto na separacao de rotas

Adicionar um `return` explicito com erro 404 para rotas POST nao reconhecidas ANTES do handler de criacao de usuario. Isso evita que requests para acoes especificas caiam no handler de criacao por engano.

```text
Fluxo atual (problematico quando desatualizado):
  POST + pathSuffix -> nao encontra rota resend-welcome -> cai no "if POST" generico -> erro

Fluxo corrigido:
  POST + targetUserId + action definido -> se action != rota conhecida -> retorna 404
  POST + sem targetUserId -> handler de criacao (que exige email/password)
```

### 2. Mudancas no arquivo `supabase/functions/master-users/index.ts`

- Mover o check de `action` para ANTES do handler generico de POST
- Adicionar uma guarda: se `action` esta definido mas nao e uma acao reconhecida, retornar 404 imediatamente
- Isso garante que mesmo se o deploy estiver parcialmente desatualizado, o erro sera claro

### 3. Garantir que o send-welcome-email receba os campos corretos

O send-welcome-email local espera `{ email, name, tenant_id }` mas o master-users envia `{ userEmail, userName, tempPassword, tenant_id }`. Ha um **mismatch de campos** entre as duas funcoes. Corrigir o master-users para enviar os campos que a funcao de email espera, OU ajustar ambos para usar os mesmos nomes de campo.

Opcao escolhida: alinhar o master-users para enviar `email` e `name` (como o send-welcome-email espera).

### 4. Resumo das alteracoes

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/master-users/index.ts` | Adicionar guarda para acoes POST desconhecidas; corrigir campos enviados ao send-welcome-email (`email`/`name` em vez de `userEmail`/`userName`) |

### Secao tecnica

No `master-users/index.ts`, logo antes do handler generico `if (method === 'POST')` (linha 334), adicionar:

```typescript
// Guard: if POST has a specific action but it wasn't handled above, return 404
if (method === 'POST' && targetUserId && action) {
  return new Response(
    JSON.stringify({ error: `Ação desconhecida: ${action}` }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

No handler de resend-welcome (linhas 217-222), corrigir o payload:

```typescript
body: JSON.stringify({
  email: userEmail,      // era "userEmail"
  name: userName,        // era "userName"
  tempPassword: newTempPassword,
  tenant_id: tenantId,
}),
```

**Importante:** Apos aprovar e implementar, voce precisa **fazer o redeploy da Edge Function `master-users` no Supabase externo** para que as mudancas tenham efeito. O codigo local esta correto, mas so funciona quando deployado.

