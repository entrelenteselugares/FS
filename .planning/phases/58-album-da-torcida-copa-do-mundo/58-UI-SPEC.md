# Phase 58: Álbum da Torcida (Promoção Copa do Mundo) — UI Design Contract

## 1. Visual Language & Theming

- **Palette Theme:** "Stadium Night" — Dark elegant base (`bg-theme-bg`) with neon/vibrant accents representing the World Cup energy (e.g., gold for badges, grass-green for borders).
- **Typography:** Heavy italic display fonts (`font-black uppercase tracking-widest italic`) for headings, giving a sporty/dynamic feel.
- **Imagery:** High contrast, moody studio lighting for assets. Empty states use elegant dark silhouettes.

## 2. Layout & Structure

- **Global Container:** A dedicated route `/album-torcida` with a responsive modal or full-page immersive view.
- **Dashboard View:**
  - Header: Progress bar showing `X/12` photos for the current active match.
  - Groups: Accordion or horizontal scroll for World Cup Groups (A, B, C...).
- **Match View (The "Canvas"):**
  - A grid of exactly 12 square slots.
  - Empty slots show a dotted border with a ghosted icon representing the "Mission" (e.g., pizza slice for food, camera for selfie).
  - Filled slots show the uploaded photo with `object-fit: cover`.

## 3. Interaction Design (Micro-interactions)

- **Photo Upload:** Tapping an empty slot opens the native camera or photo picker. A subtle loading spinner overlays the slot during upload.
- **Drag-and-Drop (Escalação):** A mini football pitch interface where users can drag photo thumbnails or typed names into formations (Goleiro, Zagueiro, Atacante).
- **Badge Unlocks:** When a user completes a badge (e.g., 3 games), a full-screen Lottie animation or Framer Motion pop-up triggers with a golden glow effect.
- **Folha Completa (12/12):** Screen shake + confetti effect, followed by the appearance of the "Golden Sticker" (Figurinha Dourada).

## 4. Components Needed

1. **MatchCard:** Summarizes a match (Teams, Date, Progress X/12).
2. **MissionSlot:** The square grid item (Empty/Loading/Filled states).
3. **TacticalPitch:** The drag-and-drop football field component.
4. **BadgeShowcase:** A horizontal list of locked/unlocked badges (Torcedor Fiel, Chef da Arena, Capitão).
5. **SharePreview:** A modal showing the generated 12-photo collage ready for Instagram Stories.

## 5. Copywriting & Tone

- **Tone:** Enthusiastic, engaging, and competitive ("Prepare a câmera!", "Você escalou o Corneteiro!", "Folha fechada!").
- **Empty States:** "A folha do Brasil já está aberta. Qual o prato de hoje?"
- **Error States:** "Ops, impedimento! Tente enviar a foto novamente."

## 6. Accessibility & Responsiveness

- All interactive elements must be large enough for quick mobile tapping (min 44x44px), as users will be using this during live matches.
- High contrast text against the dark theme.
- Responsive grid: 3x4 on mobile, 4x3 on tablet/desktop.
