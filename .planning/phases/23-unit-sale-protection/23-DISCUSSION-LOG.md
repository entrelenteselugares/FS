# DISCUSSION LOG: Phase 23 - Unit Sale & Content Protection

## Area: Bulk Upload Strategy
- **Options presented**: Sequential vs Parallel, Local resizing, Progress bar.
- **User Selection**: "exactly as described" (Drag & drop, progress bar, local resizing for previews).
- **Notes**: Focus on efficiency for the photographer.

## Area: Watermarking
- **Options presented**: Fixed vs Dynamic.
- **User Selection**: Standard system watermark ("marca dagua padrao").
- **Notes**: Use the standard "Foto Segundo" logo.

## Area: Content Protection
- **Options presented**: Save Image, PrintScreen, Link expiration.
- **User Selection**: Disable save image and block PrintScreen.
- **Notes**: PrintScreen blocking is best-effort (keyboard events + CSS @media print).

## Area: Dynamic Upselling
- **Options presented**: Pack logic, "Unlock Full Album" CTA.
- **User Selection**: Enabled ("sim, podmos ter essa dinamica de venda").
- **Notes**: Implement "Buy X, Get Y" logic.

## Deferred Ideas
- N/A

## Committed Decisions
- Local validation is mandatory before any deployment.
- High-res version stays private until payment.
