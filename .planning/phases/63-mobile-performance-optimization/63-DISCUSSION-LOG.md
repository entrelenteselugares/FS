# Phase 63: Mobile Performance Optimization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 63-Mobile Performance Optimization
**Areas discussed:** Watermark DOM Bloat, Image Optimization

---

## Watermark DOM Bloat Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Opção A: Padrão CSS Background | Usar `background-image` com `repeat` para ter apenas 1 elemento por foto. | ✓ |
| Opção B: Padrão SVG | Usar `<pattern>` do SVG com 1 elemento por foto. | |
| Opção C: Canvas dinâmico | Renderizar a imagem e marca d'água juntas em Canvas. | |

**User's choice:** Opção A (Padrão CSS Background)
**Notes:** Esta opção reduz o número de nós do DOM de 60 por card de foto para 1 único nó, mitigando completamente o estouro de memória no Safari do iOS.

---

## Image Rendering Optimization

| Option | Description | Selected |
|--------|-------------|----------|
| Aplicar `OptimizedImage` | Ativar lazy-loading nativo e decoding assíncrono em todas as listagens de fotos. | ✓ |
| Implementar Paginação / Infinite Scroll | Adicionar paginação em toda a galeria. | |
| Simplificar Animações do Framer Motion | Desabilitar efeitos de transição complexos em dispositivos móveis. | |

**User's choice:** Aplicar `OptimizedImage`
**Notes:** A adoção do componente já existente `OptimizedImage` garantirá rolagem suave e carregamento sob demanda eficiente das miniaturas das fotos.

---

## Deferred Ideas
- Implementação de paginação/infinite scroll avançado (IntersectionObserver) caso as melhorias do DOM e lazy-loading não bastem para volumes gigantescos de fotos.
- Desativação global de animações em mobile.
