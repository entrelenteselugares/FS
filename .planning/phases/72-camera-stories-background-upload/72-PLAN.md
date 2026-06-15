# Phase 72: Camera Stories & Background Upload

## Goal

Implement a non-blocking "Camera Stories" capture flow with background upload persistence using IndexedDB, ensuring users can take multiple photos sequentially without waiting, and their upload queue survives page reloads.

## Threat Model

<threat_model>

- Trust Boundaries: Client browser (IndexedDB) to Vercel/Supabase backend.
- STRIDE:
  - Spoofing: Addressed by existing Auth layer (JWT/Magic Link) passed with uploads.
  - Tampering: Files in IndexedDB could be tampered locally. Backend validates file type and size.
  - Repudiation: Not applicable for public uploads.
  - Information Disclosure: IndexedDB is isolated per origin.
  - Denial of Service: User could queue thousands of photos, exhausting local storage. Mitigation: limit parallel uploads to prevent network starvation.
  - Elevation of Privilege: Backend handles role validation.
    </threat_model>

## Proposed Changes

### 1. IndexedDB Persistence Utility

#### [NEW] `frontend/src/lib/uploadQueueDB.ts`

- Implement a lightweight native `IndexedDB` wrapper specifically for storing `UploadItem` objects.
- Functions: `initDB()`, `saveItem(item)`, `removeItem(id)`, `getAllItems()`, `clearQueue()`.
- Store `File` objects natively (supported by all modern browsers).

### 2. Global Background Upload Context

#### [NEW] `frontend/src/contexts/UploadQueueContext.tsx`

- Move the upload logic and queue state (`uploadItems`, `isUploadingGlobal`) out of `PhygitalCapture.tsx` and into a global context.
- Initialize by reading from `uploadQueueDB.ts`.
- Expose `addToQueue(files: File[])`, `retryUpload(id)`, and the `uploadItems` state.
- Process the queue sequentially in the background.

#### [MODIFY] `frontend/src/App.tsx`

- Wrap the application routes with `<UploadQueueProvider>` so uploads continue globally while the user navigates.

### 3. Non-Blocking Camera UX

#### [MODIFY] `frontend/src/pages/PhygitalCapture.tsx`

- Consume `UploadQueueContext` instead of local state.
- Remove the `isUploadingGlobal` blocking fullscreen overlay for photos.
- Allow immediate consecutive captures. The user captures a photo, it goes to the grid below, and the camera button remains immediately available.

## Verification Plan

### Automated Tests

- `tsc --noEmit` to ensure TypeScript compliance for the new Context and DB utilities.

### Manual Verification

1. Access Phygital Capture on mobile.
2. Tap the camera button, take a photo, and immediately tap it again to take another. Verify no blocking overlay appears.
3. Observe the bottom grid showing multiple photos uploading sequentially.
4. While uploading, close the browser tab. Reopen the app, navigate to Phygital Capture, and verify the remaining photos are still in the queue and resume uploading.
