# Log de Atualizações - Produção (27/04/2026)

Este documento resume as correções críticas e melhorias de UX implementadas hoje para estabilizar a plataforma antes da expansão para o Marketplace.

## ✅ O Que Foi Corrigido e Melhorado

### 1. Fluxo de Checkout e Autenticação
- **Autenticação Obrigatória**: Agora o cliente PRECISA logar ou criar uma conta antes de ver as opções de pagamento. Isso garante que o acesso às fotos seja vinculado corretamente ao e-mail.
- **Conversão de Convidado**: Se um usuário já existia como "convidado" (comprador antigo), ele agora consegue se cadastrar com o mesmo e-mail sem erro de "e-mail já existe".
- **Fix Erro 500 (Senha)**: Corrigido o erro fatal que acontecia na recuperação de senha devido a um conflito de IDs no banco de dados.

### 2. Navegação e Vitrine (UX)
- **Fim do Redirecionamento Agressivo**: Usuários logados agora podem navegar livremente pela vitrine e abrir álbuns públicos sem serem chutados para o painel de controle.
- **Calendário (DatePicker)**: Adicionadas setas de navegação de mês e ano. Melhoria visual no cabeçalho para garantir que seja funcional em todos os navegadores.

### 3. Visual e Mobile
- **Fix Mobile Countdown**: O contador de "Evento em Breve" e os links de download agora aparecem normalmente no celular (estavam ocultos por uma classe de bloqueio).
- **Scroll Mobile**: Corrigido o erro que impedia de rolar a página para baixo no celular dentro do álbum.
- **Placeholder Premium**: Álbuns sem foto de capa agora exibem um fundo elegante com a logo da Foto Segundo e marca d'água dinâmica do nome do evento.

---

## 🧪 Roteiro de Testes (O Que Validar Agora)

1. **Teste de Compra**:
   - Acesse um álbum público deslogado.
   - Clique em "Desbloquear".
   - Tente se cadastrar ou logar no checkout.
   - Valide se as opções de pagamento (Mercado Pago) aparecem após o login.

2. **Teste de Calendário**:
   - Vá em `/cotacao`.
   - Clique para selecionar data.
   - Tente mudar o mês usando as novas setinhas.

3. **Teste de Mobile**:
   - Abra um link de evento no celular.
   - Tente rolar a página para baixo.
   - Verifique se o contador (se o evento for futuro) ou os links (se já pago) aparecem abaixo da capa.

4. **Teste de Recuperação de Senha**:
   - Na tela de login, clique em "Esqueci minha senha".
   - Insira seu e-mail e verifique se o alerta de "E-mail enviado" aparece sem dar erro 500.

---

**Próxima Fase**: Após a sua validação desses pontos, iniciaremos a implementação do **Marketplace de Fotógrafos**.
