# Phase 58 — Context: Câmera Integrada (Instagram/TikTok Style)

## Domain

Replace the bottom-sheet `<input file>` capture flow with a **fullscreen in-app camera** using the WebRTC `getUserMedia` + `MediaRecorder` APIs. The user sees the camera live feed, toggles FOTO/VÍDEO at the bottom, and captures without leaving the page.

---

## Decisions

### Camera Launch

- **Click on the camera button → camera opens IMMEDIATELY, fullscreen.** No intermediate menu or bottom sheet.
- All controls are floating overlays inside the camera view.

### Bottom Floating Controls (single unified toolbar)

```
[ 🖼 Galeria ]   [ ● SHUTTER ]   [ FOTO | VÍDEO ]   [ 🔄 Flip ]
```

- Gallery shortcut on the left → opens file picker (multi-select, up to 12)
- Shutter in center → photo snap (tap) or video recording (hold in video mode)
- FOTO/VÍDEO toggle to the right of shutter
- Flip camera (front/rear) on far right
- All as a frosted-glass floating pill at the bottom of the fullscreen camera view

### Fallback (getUserMedia blocked / unsupported)

- Show an **explanatory message** + button to open the native camera/gallery (current behavior preserved as fallback).

### Camera Facing

- **Rear camera (`environment`) by default.**
- **Flip button** in the top corner to toggle front (selfie) / rear.

### Video Recording Mode

- **Hold to record, release to stop** — same UX as Instagram Reels.
- 15-second hard cap with a circular progress ring around the shutter button.
- Auto-stops at 15 seconds even if user keeps holding.

### After Capture

- Show **preview screen** (full photo or looping video preview).
- Two buttons: **Confirmar** (adds to upload queue, returns to camera for more) and **Refazer** (discards, returns to live viewfinder).
- After confirming, camera stays open — user can take more photos/videos.

### Visual Style

- **Completely dark / black** — TikTok aesthetic.
- White shutter button, green accent for active state.
- FOTO / VÍDEO toggle pill at bottom center (underline-style active indicator).
- Timer ring around shutter in video mode.

---

## Canonical Refs

- `frontend/src/pages/PhygitalCapture.tsx` — current capture page (to be refactored)
- MDN: `MediaRecorder` API, `getUserMedia` API, `canvas.captureStream()`

---

## Code Context

- `compressImage()` utility already exists in PhygitalCapture.tsx (canvas-based, keep it)
- `handleFileChange` / `startUploadFlow` logic stays intact — only the _capture source_ changes
- `checkVideoDuration()` still needed (MediaRecorder output also needs duration check)
- Existing `cameraInputRef`, `videoInputRef`, `galleryInputRef` and bottom-sheet can be replaced entirely by the new in-app camera component
- `galleryInputRef` (Choose from Gallery) stays as the alternative button on the main screen

---

## Out of Scope (Deferred)

- Flash / torch toggle
- Zoom gesture (pinch-to-zoom on mobile)
- Video filters or effects
- Grid overlay (rule of thirds)
