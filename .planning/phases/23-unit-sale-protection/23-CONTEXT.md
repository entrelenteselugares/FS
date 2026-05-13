# CONTEXT: Phase 23 - Unit Sale & Content Protection

## 1. Domain & Goal
**Domain**: Professional individual photo sales within the marketplace.
**Goal**: Optimize the upload experience for photographers and ensure robust content protection for individual media assets.

## 2. Implementation Decisions

### A. Bulk Upload Strategy (High Efficiency)
- **Interface**: Support for Drag & Drop of multiple files and folder selection.
- **Client-Side Processing**: 
  - Generate low-resolution thumbnails locally (in-browser) to speed up UI feedback.
  - Show a global progress bar for the entire batch.
- **Backend Sync**: 
  - Photos are uploaded in parallel to Supabase Storage.
  - Automatic association with the current Event via `eventId`.

### B. Watermarking Standard
- **Asset**: Use the standard "Foto Segundo" logo/watermark.
- **Application**: 
  - Automatically applied during upload to the **preview** version of the image.
  - The **original** high-resolution version remains untouched in private storage.

### C. Content Protection (Anti-Theft)
- **Save Image**: Disable context menu (`onContextMenu`) and use transparent overlays on the gallery.
- **PrintScreen Prevention**: 
  - Implement a keyboard listener for the `PrintScreen` key to clear clipboard or show a warning.
  - Use CSS `@media print` to hide the gallery content if a print request is initiated.
- **Access Control**: High-res URLs are only exposed to the client after a verified purchase of the specific `mediaId`.

### D. Dynamic Upselling (Marketing)
- **Cart Logic**: 
  - Implement "Pack" logic: "Buy X photos, get Y free".
  - Show a "Unlock Full Album" CTA if the number of selected photos exceeds a threshold.

## 3. Canonical Refs
- [MarketplaceController.ts](file:///c:/foto-segundo/backend/src/controllers/marketplace.controller.ts) - Base media logic.
- [EventMedia Schema](file:///c:/foto-segundo/backend/prisma/schema.prisma) - Media model definition.

## 4. Specifics & Constraints
- **Local Validation**: ALL features must be validated in the local environment (`npm run dev`) before any production deployment.
- **Performance**: Ensure bulk upload doesn't lock the browser main thread.
