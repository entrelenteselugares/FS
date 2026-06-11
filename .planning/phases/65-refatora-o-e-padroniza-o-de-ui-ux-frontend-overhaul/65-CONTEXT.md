# Phase 65: Refatoração e Padronização de UI/UX (Frontend Overhaul) - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

O objetivo desta fase é padronizar tipografia, espaçamentos, cores e componentes globais para garantir excelência estética e eliminar dívida visual técnica de ponta a ponta no frontend.

</domain>

<decisions>
## Implementation Decisions

### Typography and Fonts
- **D-01:** Configurar a tipografia do sistema utilizando 'Barlow Condensed' para títulos e cabeçalhos (`--font-display`), e 'Inter' para o corpo do texto (`--font-body`), restaurando o pilar Midnight Luxury UI/UX.

### Component Standardization
- **D-02:** Substituir progressivamente os botões e inputs comuns nas telas críticas por classes globais unificadas `.fs-btn` e `.fs-input` definidas em `index.css`.

### the agent's Discretion
- Detalhes adicionais sobre estilos e alinhamento visual em conformidade com as diretrizes e tokens já presentes em `index.css`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase styles
- [index.css](file:///c:/foto-segundo/frontend/src/index.css) — Arquivo CSS global que define os tokens de design.
- [PROJECT.md](file:///c:/foto-segundo/.planning/PROJECT.md) — Documento principal do projeto detalhando o Midnight Luxury UI/UX.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Classes utilitárias `.fs-btn`, `.fs-input` e `.fs-card` já declaradas em `index.css`.

### Integration Points
- `index.css` (para aplicar a fonte display Barlow Condensed importada se necessário).
- Telas principais do frontend (`frontend/src/pages/` e `frontend/src/components/`).

</code_context>

<specifics>
## Specific Ideas
- Importar 'Barlow Condensed' no topo de `index.css` via `@import` ou carregar via font-face se não estiver localmente instalada.

</specifics>

<deferred>
- Padronização de containers responsivos rígidos em todas as páginas secundárias.

</deferred>

---

*Phase: 65-Refatoracao-Padronizacao-UIUX*
*Context gathered: 2026-06-11*
