# 6-Pillar Visual Audit: Album Torcida (Missões)

**Phase**: 061-album-missions / 058-album-torcida
**Context**: Audit against abstract 6-pillar standards (No UI-SPEC found)
**Overall Score**: 20/24

---

## 1. Copywriting (3/4)
- **Strengths**: A introdução "Responda aos Quizzes para liberar as missões..." é clara e explica bem a dinâmica do jogo. Os títulos das missões ("A foto clássica", "A Torcida") são criativos e engajadores.
- **Weaknesses**: O rótulo "QUIZ PARA DESBLOQUEAR:" está em caixa alta, o que soa um pouco agressivo (shouting). Poderia ser suavizado para "Quiz para desbloquear:".
- **Action Items**:
  - [ ] Alterar "QUIZ PARA DESBLOQUEAR:" para "Quiz para desbloquear" (Title Case ou Sentence Case).

## 2. Visuals (3/4)
- **Strengths**: O design dos cards com bordas sutis e fundo escuro cria uma estética moderna que combina com o tema da plataforma. A hierarquia visual dentro do card (Título > Pergunta > Opções > Botão) é fácil de seguir.
- **Weaknesses**: O contorno amarelo na opção selecionada ("2002") é eficiente, mas as opções de múltipla escolha parecem campos de input de texto (`<input type="text">`), o que pode causar uma leve confusão cognitiva no primeiro segundo de uso.
- **Action Items**:
  - [ ] Adicionar um pequeno indicador visual nas opções (como um radio button customizado ou um leve hover effect de background) para reforçar que são opções clicáveis e não campos de texto.

## 3. Color (4/4)
- **Strengths**: Excelente aplicação do Dark Mode. O contraste entre o background principal da página e o background dos cards é sutil, mas suficiente para criar profundidade. O amarelo/dourado de destaque guia perfeitamente o olhar para as ações principais (Botão Responder e Opção Selecionada). O estado "disabled" do botão no Slot 2 também comunica perfeitamente inatividade.
- **Weaknesses**: Nenhuma fraqueza crítica. As cores estão perfeitamente alinhadas com a identidade visual proposta.

## 4. Typography (4/4)
- **Strengths**: Uso sólido de tipografia. Os rótulos ("SLOT 1") utilizam *tracking* (espaçamento de letras) espaçado e uppercase, o que funciona muito bem como *eyebrow text*. O uso de itálico/bold nos títulos das missões traz dinamismo esportivo.
- **Weaknesses**: A fonte base é limpa e legível.

## 5. Spacing (4/4)
- **Strengths**: O grid dos slots possui um gap bem proporcionado (provavelmente `gap-6` no Tailwind). O padding interno dos cards respira bem (aparenta ser `p-6`). O espaçamento entre os itens do quiz (as opções) é consistente e grande o suficiente para não causar cliques acidentais em dispositivos móveis.
- **Weaknesses**: O espaçamento está no ponto ideal.

## 6. Experience Design (UX) (2/4)
- **Strengths**: O fluxo lógico é claro e o estado vazio do botão ("disabled" até que uma opção seja clicada) previne erros do usuário de forma eficaz. O ícone de cadeado no canto superior é um ótimo reforço visual de "estado bloqueado".
- **Weaknesses**: A falha crítica de experiência está no tratamento de erros da API. A imagem revela que as requisições para `/api/worldcup/...` estão estourando Erro 500 no console (AxiosError), mas a UI não reflete nenhum estado de erro, toast, ou feedback visual de que algo deu errado. O usuário clica e aparentemente nada acontece na tela.
- **Action Items**:
  - [ ] Implementar tratamento de erro nas chamadas Axios e exibir um componente de Toast ou Feedback Alert vermelho na UI ("Ocorreu um erro ao carregar as informações. Tente novamente").
  - [ ] Garantir que exista um "Loading State" (Spinner) no botão "RESPONDER" enquanto a requisição está em andamento.

---

## 🛠️ Top Fixes Priorizados:
1. **Feedback de Erro na UI**: Interceptar o AxiosError 500 e exibir um aviso na tela (Toast) em vez de falhar silenciosamente.
2. **Micro-interação das Opções**: Melhorar o visual das opções de resposta para que pareçam mais com "botões de múltipla escolha" do que com caixas de texto vazias (adicionar hover sutil e transições rápidas).
3. **Refinamento de Texto**: Trocar "QUIZ PARA DESBLOQUEAR:" por "Quiz para desbloquear:".
