# Phase 63: Mobile Performance Optimization - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

O objetivo desta fase é refatorar e otimizar o aplicativo na versão mobile, especialmente no iOS, focando na eliminação de travamentos, gargalos de memória (DOM bloat) e lentidão ao carregar e rolar listagens de fotos.

</domain>

<decisions>
## Implementation Decisions

### Watermark DOM Bloat Resolution
- **D-01:** Substituir a estrutura atual de watermark repetido (que renderiza de 60 a 150 imagens por foto) por um único elemento contendo um padrão CSS repetido (`background-image` com `background-repeat: repeat` e `background-size`). Isso reduz drasticamente o número de nós no DOM e evita que o iOS Safari estoure o limite de memória e trave a tela.

### Image Rendering Optimization
- **D-02:** Adotar o componente `OptimizedImage` em todas as galerias de seleção e páginas de detalhes de álbuns (como `TouchSelectionGallery.tsx` e `VaultDetailPage.tsx`) para garantir lazy-loading nativo, decodificação assíncrona (`decoding="async"`) e esqueleto de carregamento (Skeleton), evitando o travamento da thread principal durante a rolagem de páginas com muitas mídias.

### the agent's Discretion
- Detalhes de implementação CSS (ex: opacidade, espaçamento do background de marca d'água) e otimizações adicionais de renderização em mobile que não alterem o design original.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase Components
- [TouchSelectionGallery.tsx](file:///c:/foto-segundo/frontend/src/components/TouchSelectionGallery.tsx) — Componente principal da galeria de fotos.
- [OptimizedImage.tsx](file:///c:/foto-segundo/frontend/src/components/OptimizedImage.tsx) — Componente reutilizável de imagem otimizada.
- [VaultDetailPage.tsx](file:///c:/foto-segundo/frontend/src/pages/VaultDetailPage.tsx) — Tela de detalhe do cofre com grande quantidade de fotos.
- [ClienteArea.tsx](file:///c:/foto-segundo/frontend/src/pages/ClienteArea.tsx) — Área do cliente onde álbuns são exibidos.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [OptimizedImage.tsx](file:///c:/foto-segundo/frontend/src/components/OptimizedImage.tsx) — Componente já implementado com suporte a `loading="lazy"`, `decoding="async"` e placeholder/esqueleto animado.

### Established Patterns
- Uso de componentes baseados em TailwindCSS e animações pontuais do Framer Motion.

### Integration Points
- `TouchSelectionGallery.tsx` (usado na `EventPage.tsx` e outras telas de captura).
- `VaultDetailPage.tsx` (usado na visualização do cofre/álbum pelo cliente).

</code_context>

<specifics>
## Specific Ideas
- Substituição do loop que cria 60 imagens `<img>` por um único `div` absoluto sobre a foto com a marca d'água repetida via CSS.

</specifics>

<deferred>
## Deferred Ideas
- Paginação robusta / Infinite Scroll avançado com IntersectionObserver (deve ser avaliado caso a otimização do DOM via CSS/OptimizedImage não seja suficiente para eventos extremamente massivos).
- Desativação global de animações em mobile.

</deferred>

---

*Phase: 63-Mobile-Performance-Optimization*
*Context gathered: 2026-06-11*
