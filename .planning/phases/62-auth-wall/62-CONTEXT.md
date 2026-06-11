# Phase 62: Auth Wall Universal & Melhorias de UX no Mobile

## 🎯 Domain
Implementar um bloqueio de autenticação universal (Login Wall) rigoroso em todas as rotas não-públicas para Mobile e Desktop, garantindo que o acesso a eventos ou áreas restritas exija login prévio. Além disso, introduzir uma navegação dedicada com atalho rápido de Câmera na base da tela para otimizar a experiência de convidados durante os eventos.

## 🔒 Decisions

### 1. Universal Auth Wall
- **Bloqueio Rigoroso:** O Auth Guard deve ser aplicado universalmente, tanto em telas Mobile quanto em Desktop.
- **Whitelist Restrita:** Apenas as páginas de `/login`, `/registro` e de convites públicos poderão ser acessadas sem sessão ativa.
- **Comportamento Padrão:** Qualquer acesso a URLs privadas redirecionará instantaneamente para a tela de login.

### 2. Fluxo de Convites (Unauthenticated)
- **Redirecionamento com Retorno:** Ao clicar em um convite sem estar logado, o usuário será redirecionado para a rota padrão de `/login`.
- **Preservação de Contexto:** A URL de login receberá o parâmetro `?returnUrl=[link_do_convite]` para que o usuário seja levado diretamente ao álbum assim que efetuar o login ou criar o cadastro.

### 3. Atalho da Câmera para Convidados
- **Bottom Navigation Bar:** O botão da câmera sairá de onde estiver hoje e será o botão de destaque (maior e centralizado) dentro de uma "Bottom Bar" fixa (navegação inferior).
- **Acesso Rápido:** Isso garante que os convidados dentro de um evento tenham acesso instantâneo com um toque para fazer upload de fotos, melhorando significativamente a usabilidade durante as festas.

## 📚 Canonical Refs
- O Auth Guard principal já existe parcialmente; a implementação unificará rotas no React Router (`App.tsx`).
- O layout de Bottom Bar com botão central precisará ser implementado no layout da página do evento convidado (`EventPage` ou layout de Galeria Pública).
