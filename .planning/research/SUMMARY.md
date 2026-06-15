# Research Summary: Native Mobile Experience & App Store Prep

## Stack Additions

- **Capacitor Core & CLI (`@capacitor/core`, `@capacitor/cli`)**: Para envelopamento futuro.
- **Autenticação:** `@capacitor-community/apple-sign-in` e plugin nativo do Google Sign-In (`@capacitor-community/google-sign-in` ou integração web SSR via GCP). No ambiente Web/PWA, continuaremos com Firebase Auth ou Supabase Auth para gerenciar os tokens via OAuth.
- **Google Pay / Apple Pay:** Integração via MercadoPago SDK Mobile (caso migremos do web-checkout) ou utilização da Payment Request API padrão na Web (que nativamente engatilha GPay/Apple Pay se configurado no merchant).
- **Push Notifications:** `@capacitor/push-notifications` integrado com Firebase Cloud Messaging (FCM).

## Feature Table Stakes (Obrigatórios)

- **Auth Rápido:** O usuário clica em "Continuar com Apple/Google" e está logado. Nenhuma senha solicitada.
- **Bottom Navigation:** Substituição do menu hambúrguer para um menu fixo na parte inferior (Explorar, Vaults, Notificações, Perfil) quando a tela for `< 768px`.
- **Persistência de Carrinho:** Armazenamento local (IndexedDB/localStorage) sincronizado com o banco (`Order` PENDENTE) garantindo que o carrinho sobreviva a _app kills_.
- **Transições Suaves:** Remoção do recarregamento de página entre as abas principais (uso intensivo de React Router view transitions).

## Differentiators

- Uso nativo da Câmera pelo Capacitor para enviar fotos ao Álbum da Torcida.
- Push Notifications direcionadas (ex: "Sua foto foi aprovada!").

## Watch Out For (Pitfalls & Armadilhas)

- **Apple Rejection (Guidelines):** A Apple rejeita apps que exigem login antes de mostrar o conteúdo, _a menos_ que o conteúdo seja estritamente privado. Como concordamos em manter o Auth Wall, a revisão da Apple pode travar o app alegando que "eventos públicos não deveriam exigir conta". Será preciso justificar que as fotos são protegidas por direitos autorais e exigem consentimento/pagamento.
- **Push na Web vs iOS:** Notificações Push via Web (PWA) no iOS exigem que o usuário adicione o app à Home Screen. Com Capacitor, o Push nativo resolve isso.
- **Transições "Janky":** Animações complexas na web podem engasgar no WebView do Capacitor. É vital manter o CSS limpo e otimizado (Phase 67 já ajudou nisso).
