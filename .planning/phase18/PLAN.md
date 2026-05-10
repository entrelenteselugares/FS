# Plan: Phase 18 - UI/UX Modal Standardization

Update the Professional Dashboard modals to match the premium "Minha Seleção" (Cart) standard using established design tokens and `.lux-window` classes.

## User Review Required

> [!IMPORTANT]
> The modals will be widened and centered on the screen, matching the shopping bag experience. The backdrop will use a deeper blur effect.

- [ ] **Step 1: Update Express Sale Modal**
  - Refactor `ExpressSaleModal.tsx` to use `.lux-window` classes.
  - Implement the premium header with icon box.
  - Standardize button styles to `lux-button-tactical`.
  - Ensure 40px padding (`2.5rem`) on desktop.
  - **Verification**: UI audit against spec.

- [ ] **Step 2: Update Foto Point Modal**
  - Refactor `FotoPointModal.tsx` to use `.lux-window` classes.
  - Align header with the new standard.
  - Standardize inputs to `.lux-input`.
  - **Verification**: UI audit against spec.

- [ ] **Step 3: Update Flash Event Modal**
  - Refactor `FlashEventModal.tsx` to use `.lux-window` classes.
  - Align header with the new standard.
  - Standardize spacing and buttons.
  - **Verification**: UI audit against spec.

- [ ] **Step 4: Global Verification**
  - Cross-check all three modals for visual consistency.
  - Test mobile responsiveness (should drop to 20px padding and 20px border-radius).
