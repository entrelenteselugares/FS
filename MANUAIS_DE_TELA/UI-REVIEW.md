# GSD ► UI AUDIT REVIEW (Reta Final)

**Data:** 2026-06-04  
**Alvo:** Todas as telas capturadas em `MANUAIS_DE_TELA/screenshots`  
**Objetivo:** Avaliação visual de 6 Pilares para identificar desalinhamentos, falhas de contraste e problemas de UX antes do lançamento.

---

## 🏆 Resumo Geral

A plataforma possui uma identidade visual forte (Dark Mode Premium), mas sofre com problemas de **consistência de espaçamento (Spacing)** e **contraste de formulários (Color/Visuals)**. O uso agressivo de tipografia em itálico/negrito precisa ser balanceado para melhorar a legibilidade.

---

## 1. Copywriting (Redação)

**Nota:** 3/4

**Observações:**

- A linguagem no fluxo de cotação e nos painéis é direta e objetiva.
- **Ponto de Melhoria:** A página 404 de eventos usa o termo "Protocolo Não Encontrado", que soa muito técnico para um cliente final. Seria melhor: "Ops! Evento não encontrado ou indisponível".
- **Ponto de Melhoria:** No dashboard do Admin, há algumas traduções ou jargões misturados (Growth, Leads) que estão adequados para uso interno, mas no painel do Profissional (ex: "Live Sync Canon") pode gerar confusão se não houver um tooltip explicando.

## 2. Visuals (Visuais e Componentes)

**Nota:** 2/4

**Observações:**

- Os cards de "Meus Álbuns" e "Dashboard Profissional" estão muito bonitos, com efeito glassmorphism sutil.
- **Ponto Crítico:** Os campos de formulário (Inputs) no fluxo de `/cotacao` (CEP, Endereço, Nome) estão se fundindo com o fundo. A borda é quase imperceptível. Isso causa enorme atrito de UX.
- Os modais (ex: Date Picker) e alertas (banner amarelo no Minha Conta) quebram um pouco a estética premium por falta de um "border-radius" consistente ou sombra mais suave.

## 3. Color (Cores e Contraste)

**Nota:** 3/4

**Observações:**

- O fundo escuro (tons de `#121212` a `#1E1E1E`) com o verde accent `#4ECB71` funciona muito bem para CTAs principais.
- **Ponto de Melhoria:** Textos secundários em cinza muito escuro sobre o fundo preto falham no teste de acessibilidade (WCAG). É preciso clarear o texto secundário (ex: labels de formulário) para um cinza mais claro (ex: `#A0A0A0`).
- Os botões secundários ou desabilitados às vezes não têm contraste suficiente para indicar seu estado.

## 4. Typography (Tipografia)

**Nota:** 2/4

**Observações:**

- A fonte de display (muito grossa, inclinada/itálico) é ótima para grandes títulos ("ETERNIZE SEU EVENTO"), mas está sendo usada em botões menores e badges, dificultando a leitura.
- **Ponto Crítico:** Falta de hierarquia clara nos textos da vitrine de profissionais e descrições de pacotes. É preciso usar uma fonte "sans-serif" normal (Regular/Medium) para parágrafos e botões, reservando a fonte de display apenas para `h1` e `h2`.

## 5. Spacing (Espaçamento e Alinhamento)

**Nota:** 1/4 (Pior pilar)

**Observações:**

- **Ponto Crítico:** Há desalinhamentos visíveis nas telas capturadas. Os cards da página `/vitrine` e `/meus-albuns` não têm um `gap` (espaço) uniforme.
- No painel lateral (`Sidebar`), o padding interno dos itens de menu parece "apertado" contra a borda esquerda.
- No fluxo de cotação, os blocos "01. ENDEREÇO" e "02. DATA" estão muito colados uns nos outros. Falta "respiro" (margin-bottom) entre as seções. O design está claustrofóbico.

## 6. Experience Design (UX/Fluxo)

**Nota:** 3/4

**Observações:**

- O fluxo de checkout é lógico e o painel "Minha Conta" centraliza bem todas as necessidades (Cliente e Profissional no mesmo lugar).
- **Ponto de Melhoria:** O "Date Picker" no fluxo de cotação não fica claro se salvou a data ao clicar, exigindo que o usuário clique fora para fechar. Deveria fechar automaticamente após a seleção.
- O botão "PRÓXIMO" nos fluxos de formulário às vezes fica "escondido" no final da página sem um destaque adequado, enquanto em outras telas ele toma a largura toda (full width). Padronizar os CTAs de avanço de fluxo.

---

## 🚀 Plano de Ação (Top 5 Correções Imediatas)

1. **Aumentar Contraste dos Inputs:** Adicionar uma borda visível (ex: `border: 1px solid #333`) ou um fundo ligeiramente mais claro (`#2A2A2A`) em todos os campos de texto, especialmente na rota `/cotacao`.
2. **Revisar Espaçamentos (Paddings/Margins):** Adicionar margens maiores (`mt-8`, `gap-6`) entre as seções de formulários e grids de cards.
3. **Simplificar Tipografia Base:** Remover o "italic/black" de botões, badges e textos corridos. Usar fonte normal para melhorar a leitura.
4. **Padronizar Botões Primários:** Garantir que o botão verde de CTA primário (`#4ECB71`) tenha o mesmo tamanho, altura e estilo em todo o sistema (home, vitrine, checkout).
5. **Ajuste de UX no Datepicker:** Fazer o modal do calendário fechar automaticamente ao selecionar um dia para dar o "feedback visual" imediato ao usuário.
