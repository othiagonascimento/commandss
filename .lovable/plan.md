

## Plano: Email de Boas-Vindas Elite — Nivel Will Bank

O email atual e funcional, mas e generico e corporativo. As inspiracoes mostram um padrao claro: **storytelling emocional, tipografia bold, tom humano de conversa, e blocos visuais que guiam o olhar**. Vamos reconstruir o template do zero.

### O que muda

**Arquivo**: `supabase/functions/master-users/index.ts` (funcao `sendWelcomeEmailDirect`)

### Novo Storytelling (fluxo do email)

O email deixa de ser um "aviso de conta criada" e passa a ser uma **celebracao de chegada**:

1. **Logo** — Centralizada, limpa, sobre fundo branco
2. **Headline emocional** — Tipografia grande e bold: **"Que bom ter voce aqui, {nome}!"** (estilo Will Bank)
3. **Paragrafo humano** — Tom de conversa, como se fosse uma pessoa falando: *"A gente preparou tudo pra voce. Seu espaco no Uopa CRM ja esta pronto — e a gente ta muito feliz com isso."*
4. **Bloco visual de destaque** — Fundo com cor da marca (gradiente suave roxo) com texto branco: *"Pra comecar, separamos seus dados de acesso"* (inspirado no bloco amarelo do Will Bank)
5. **Credenciais** — Caixa limpa, moderna, com icones visuais (emoji de cadeado e envelope) sobre fundo branco
6. **Dica de seguranca** — Tom amigavel, nao tecnico: *"Dica: troque sua senha no primeiro acesso. Seguranca nunca e demais."*
7. **Botao CTA** — Grande, arredondado, cor solida: **"Acessar minha conta"**
8. **Fechamento emocional** — *"Estamos juntos nessa jornada. Conte com a gente!"* + assinatura *"Com carinho, Equipe Uopa CRM"*
9. **Footer** — Minimalista, copyright, link de suporte

### Solucao da Logo

Usar **base64 inline** para garantir que a logo apareca em todos os provedores (Gmail, Outlook, etc.) sem depender de dominio externo. A imagem `public/images/uopa-logo-email.png` sera convertida para base64 e embutida diretamente no HTML.

### Diferenciais vs. template atual

| Aspecto | Atual | Novo |
|---------|-------|------|
| Tom | Corporativo, frio | Humano, caloroso, celebratorio |
| Headline | "Bem-vindo ao Uopa!" | "Que bom ter voce aqui, {nome}!" |
| Storytelling | Inexistente | 3 blocos narrativos com progressao emocional |
| Bloco destaque | Nenhum | Faixa colorida estilo Will Bank |
| Credenciais | Caixa roxa generica | Caixa limpa com icones e hierarquia clara |
| Fechamento | Copyright generico | Mensagem pessoal + assinatura da equipe |
| Logo | URL externa (nao carrega) | Base64 inline (sempre aparece) |
| Emojis | Excessivos no subject | Uso estrategico apenas no corpo |

### Subject do email

De: `Bem-vindo ao Uopa CRM, {nome}! ` 

Para: `{nome}, sua conta no Uopa CRM esta pronta!`

Mais direto, sem emoji no subject (melhora deliverability), informativo.

### Detalhes tecnicos

- A logo sera lida do filesystem da Edge Function ou hardcoded como string base64 no codigo
- Todo o HTML sera inline-styled (padrao para emails)
- Compatibilidade testada: Gmail, Outlook, Apple Mail, Yahoo
- Nenhuma dependencia externa para imagens
- Mantida toda a logica existente (envio, temp_password, resend_id)

