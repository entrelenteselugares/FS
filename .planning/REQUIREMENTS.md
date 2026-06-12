# Requirements

## Milestone v15.0: Native Mobile Experience & App Store Prep

### Autenticação Nativa & Guest Mode
- [ ] **AUTH-01**: Usuários não logados podem visualizar galerias de eventos (Guest Mode) recebendo prompts de autenticação apenas no momento de adicionar fotos ao carrinho ou acessar o cofre.
- [ ] **AUTH-02**: Usuários podem realizar login com um clique utilizando Google Sign-In, nativamente integrado ao Supabase.
- [ ] **AUTH-03**: Usuários podem realizar login com um clique utilizando Apple Sign-In (obrigatório para aprovação na App Store).

### Checkout Frictionless
- [ ] **CHECK-01**: O carrinho de compras persiste o estado agressivamente no local storage, evitando perda de itens caso o usuário saia do app para copiar a chave PIX no banco.
- [ ] **CHECK-02**: O sistema exibe recomendações inteligentes de álbuns visitados recentemente quando o carrinho estiver vazio.
- [ ] **CHECK-03**: A integração de pagamentos suporta Google Pay e Apple Pay para reduzir o tempo de checkout no celular.

### Navegação App-Like
- [ ] **NAV-01**: A navegação mobile utiliza uma Bottom Navigation Bar fixa com abas principais (Explorar, Vaults, Notificações, Perfil), substituindo o menu hambúrguer escondido.
- [ ] **NAV-02**: A interface utiliza animações e transições de página (sliding) que mimetizam a navegação nativa, em vez do recarregamento brusco do navegador web.

### Engajamento via Push
- [ ] **PUSH-01**: O sistema solicita permissão nativa para envio de notificações push.
- [ ] **PUSH-02**: O sistema pode receber e exibir notificações push do Álbum da Torcida e alertas de compras, utilizando o serviço de Push do Capacitor / Firebase Cloud Messaging.

## Traceability

| Requirement | Phase | Goal |
|---|---|---|
| AUTH-01 | Phase 68 | Visualização de galerias sem login forçado (Guest Mode) |
| AUTH-02 | Phase 69 | Login via Google Sign-In |
| AUTH-03 | Phase 69 | Login via Apple Sign-In |
| CHECK-01 | Phase 70 | Carrinho persistente |
| CHECK-02 | Phase 70 | Empty states com recomendações |
| CHECK-03 | Phase 70 | Integração com Google Pay e Apple Pay |
| NAV-01 | Phase 71 | Bottom Navigation Bar para mobile |
| NAV-02 | Phase 71 | Transições fluidas (sliding) estilo app nativo |
| PUSH-01 | Phase 72 | Permissão de Push Notifications nativas |
| PUSH-02 | Phase 72 | Recepção de alertas Firebase/Capacitor Push |
