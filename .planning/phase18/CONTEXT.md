# Phase 18: UI/UX Modal Standardization

## Objective

Update the UI and UX of three specific modals in the professional dashboard to match the premium standards established in the "Minha Seleção" (Shopping Bag) modal.

## Targets

1. **Express Sale Modal** (`ExpressSaleModal.tsx`) - "Unidade de Venda Direta".
2. **Foto Point Modal** (`FotoPointModal.tsx`) - "Configurar Ponto de Venda".
3. **Flash Event Modal** (`FlashEventModal.tsx`) - "Foto Print Live".

## Reference

The **Cart Modal** (`CartModal.tsx`) serves as the design benchmark.

## Key Design Principles to Apply

- **Centered Modal**: Modals should be centered on the screen with a wide layout (max-w-2xl or similar).
- **Glassmorphism Backdrop**: Use `backdrop-blur-xl` and `bg-theme-bg/80` or `bg-black/95` for a premium feel.
- **Rounded Corners**: Use large rounded corners (`rounded-[40px]`).
- **Premium Header**:
  - Icon in a 12x12 box with light brand background and border.
  - Large, bold, italicized title (`text-2xl font-black uppercase italic tracking-tighter`).
  - Small, high-tracking subtitle.
- **Unified Footer**: Consistent footer style with large primary action buttons and descriptive total/summary.
- **Interactive Elements**: Use standard hover effects and micro-animations defined in the design system.
