# Phase 70: Navegacao App Like - Phygital Capture

## Domain

Capture and upload media from users at events with maximum reliability and minimal steps.

## Decisions Captured

### Camera Strategy

- **Upload Direto (Sem Fila)**: Eliminated the queue and IndexedDB storage.
- The user fills their identification details ONCE (saved in localStorage).
- Every photo taken via the standard HTML5 `<input capture>` is uploaded immediately in the background upon returning to the browser.
- Displays a "Recent Uploads" list showing the status of immediately uploaded photos.
- Removes complex native camera loops, HTML5 video feeds, and Base64 parsing. Uses pure, native web standards for maximum stability.

## Deferred Ideas

- Offline background sync/retry for failed uploads (kept simple for now: manual retry).
