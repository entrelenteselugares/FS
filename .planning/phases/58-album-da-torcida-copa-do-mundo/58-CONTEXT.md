# Phase 58 Context: Álbum da Torcida (Promoção Copa do Mundo)

## Domain
**Feature:** Experiência gamificada para Copa do Mundo ("Álbum da Torcida").
**Goal:** Aumentar retenção, engajamento social e geração de conteúdo autêntico transformando a coleção de fotos dos jogos em um ativo de status social, com limite de 12 fotos por jogo.

---

## Decisions Captured

### 1. Estrutura e UX Flow
- **Gatilho Inicial (Trigger):** Notificação push 30 min antes do jogo ("A folha da Seleção [País] já está aberta! Prepare a câmera.")
- **Dashboard Principal:** Interface estilo "caderno de recordações", organizada pelos grupos da Copa (A, B, C...).
- **Grid de Captura:** Exatamente 12 slots por folha/jogo. Espaços vazios mostram silhuetas para gerar FOMO.
- **Missões por Slot:** Sugestões de registro (ex: "Selfie com a camisa", "O prato do dia", "A reação após o gol").

### 2. Metadados e Interações Especiais
- **Localização:** Geotagging automático com fallback para busca manual.
- **Cardápio:** Input de texto rápido ou seleção de ícones (🍕, 🍺, 🥨).
- **Escalação da Galera:** Sistema *drag-and-drop* para arrastar fotos ou nomes de amigos para posições táticas (Goleiro, Artilheiro, Reserva), atribuindo tags de personalidade ("O Corneteiro", "O Otimista").

### 3. Sistema de Gamificação (Regras)
- **Torcedor Fiel:** Selo por completar 3 jogos do mesmo time.
- **Chef da Arena:** Selo por registrar cardápios em 5 jogos diferentes.
- **Capitão da Galera:** Selo por incluir 5 amigos diferentes na escalação.
- **Stickers/Figurinhas:** Completar 12 fotos de um jogo gera uma figurinha "Dourada" que representa a partida, exibida no perfil público.
- **Rodada da Zebra:** Selo surpresa desbloqueado se o jogo terminar em empate inesperado ou zebra (para quem registrou fotos).
- **Rankings:** Tabelas de classificação regionais (ex: Campinas) ou grupos de amigos (privado) baseadas no número de "Folhas Completadas".

### 4. Viralização e Social Sharing
- **Conteúdo Compartilhável:** Ao fechar a folha, uma IA gera automaticamente um reel/story com as 12 fotos em layout dinâmico ("Resumo da Partida") otimizado para Instagram/WhatsApp.

---

## Canonical References
- `ROADMAP.md` (Phase 58)

## Locked Requirements (from SPEC)
*(Aguardando SPEC.md ou UI-SPEC.md para detalhamento técnico)*
