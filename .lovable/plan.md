

## Plano: Email de Boas-Vindas com Experiencia de Elite

### Problemas Identificados

1. **Senha diferente no reenvio**: Ao reenviar o email, uma nova senha aleatoria e gerada mas nao e exibida no painel. O usuario do painel master nao tem como saber qual senha foi enviada.
2. **Textos incorretos**: "Bem-vindo a Uopa" em vez de "Bem-vindo ao Uopa!" e "Uopa" em vez de "Uopa CRM"
3. **Sem logo/imagem**: O email nao tem a identidade visual da marca

### Mudancas Planejadas

#### 1. Edge Function `master-users/index.ts` - Template do Email

- Corrigir todos os textos: "Uopa" para "Uopa CRM", "Bem-vindo a Uopa" para "Bem-vindo ao Uopa!"
- Corrigir o `from`: "Uopa" para "Uopa CRM"
- Corrigir o `subject`: "Bem-vindo a Uopa" para "Bem-vindo ao Uopa CRM!"
- Adicionar logo no header do email usando URL publica da imagem hospedada (sera necessario hospedar a logo em URL publica acessivel, como o Storage do Supabase ou CDN)
- Melhorar o design geral: tipografia, espacamentos, footer mais profissional
- Adicionar um rodape com links de suporte e redes sociais

#### 2. Edge Function `master-users/index.ts` - Retorno da Senha no Reenvio

- Alterar o endpoint `resend-welcome` para retornar a nova senha temporaria na resposta (`temp_password`)
- Isso permite que o painel master exiba a senha ao operador

#### 3. Frontend `UserManagement.tsx` - Exibir Senha do Reenvio

- Atualizar o tipo de retorno do `resendWelcomeEmail` para incluir `temp_password`
- Apos o reenvio bem-sucedido, exibir um dialog/toast com a nova senha temporaria para que o operador do painel possa comunicar ao usuario se necessario

#### 4. API Service `masterApi.ts`

- Atualizar o tipo de retorno para incluir `temp_password`

### Detalhe Tecnico

**Logo no email**: Emails HTML nao podem usar imagens locais do projeto. A logo precisa estar em uma URL publica. Opcoes:
- Usar o Supabase Storage do projeto para hospedar a imagem
- Usar uma URL publica ja existente

**Novo template do email** tera:
- Logo Uopa CRM centralizada no topo
- Gradiente de marca mantido
- Texto "Bem-vindo ao Uopa!" com acentuacao correta
- Nome "Uopa CRM" em todos os lugares
- Botao de acesso estilizado
- Footer profissional com copyright

