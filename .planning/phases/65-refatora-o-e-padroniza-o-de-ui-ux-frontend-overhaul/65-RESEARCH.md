# Phase 65: Refatoração e Padronização de UI/UX (Frontend Overhaul) - Research

## 📊 Pesquisa sobre a Tipografia e Fontes

### Barlow Condensed no Frontend
- A fonte `'Barlow Condensed'` é referenciada em [theme.ts](file:///c:/foto-segundo/frontend/src/lib/theme.ts) como `var(--font-d)` e na página [HallOfFame.tsx](file:///c:/foto-segundo/frontend/src/pages/HallOfFame.tsx) importada via Google Fonts.
- Para habilitar Barlow Condensed globalmente para todos os títulos e cabeçalhos no frontend, ela deve ser importada no topo de `index.css` e atribuída às variáveis CSS `--font-display` e `--font-d`.

### Componentes Globais e Classes Utilitárias
- O arquivo [index.css](file:///c:/foto-segundo/frontend/src/index.css) já possui classes consolidadas como `.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, `.fs-input` e `.fs-card`.
- Muitas páginas utilizam classes inline do TailwindCSS ou estilos em linha (como `BtnPrimary` de `theme.ts`) que precisam ser limpos e referenciados por essas classes globais para garantir que alterações visuais centralizadas se propaguem de forma uniforme.

---

## 🛠️ Plano de Refatoração Proposto

1. **Importação da Fonte**: Adicionar o `@import` do Google Fonts no topo de `index.css` carregando 'Barlow Condensed' e 'Inter'.
2. **Definição de Variáveis**: Mapear as variáveis nos temas dark/light de `index.css`:
   ```css
   --font-display: 'Barlow Condensed', sans-serif;
   --font-body: 'Inter', sans-serif;
   --font-d: 'Barlow Condensed', sans-serif;
   --font-b: 'Inter', sans-serif;
   ```
3. **Substituição Progressiva**: Refatorar os botões e inputs das páginas e modais críticos (como `TouchSelectionGallery.tsx`, `VaultDetailPage.tsx` e modais associados) para utilizar a classe `.fs-btn` e `.fs-input` no lugar de botões manuais ou com estilos inline complexos.
