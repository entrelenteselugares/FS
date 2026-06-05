import React from "react";

export const getPrintStyles = (orientation: 'portrait' | 'landscape') => `
@media print {
  @page {
    size: A4 ${orientation};
    margin: 0 !important;
  }

  /* Override global anti-theft shield — reveal ONLY the printable area */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    height: auto !important;
    overflow: visible !important;
  }
  body * {
    visibility: hidden !important;
  }
  body #fs-printable-area,
  body #fs-printable-area * {
    visibility: visible !important;
  }
  /* Suppress the global watermark message */
  body::after {
    display: none !important;
    content: "" !important;
    visibility: hidden !important;
  }

  /* Page container — one A4 sheet per page */
  .fs-print-page {
    position: relative;
    width: ${orientation === 'portrait' ? '210mm' : '297mm'};
    height: ${orientation === 'portrait' ? '297mm' : '210mm'};
    padding: 6mm;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    box-sizing: border-box;
    display: grid;
    gap: 4mm;
    background: #ffffff !important;
  }

  /* Individual printed photo card — overflow visible so crop marks bleed outside */
  .fs-print-card {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: visible;
    display: flex;
    flex-direction: column;
    background: #ffffff !important;
    border: none;
    border-radius: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* ── Crop / Cut Marks ────────────────────────────────────────────
     Four corner marks — each made of two perpendicular 3mm lines.
     Color: #c8c8c8 (light gray) at 0.25pt — visible but non-intrusive.
     Offset: 1mm outside the card boundary.
  ─────────────────────────────────────────────────────────────────── */

  /* Shared pseudo-element base */
  .fs-crop-tl,
  .fs-crop-tr,
  .fs-crop-bl,
  .fs-crop-br {
    position: absolute;
    width: 3mm;
    height: 3mm;
    pointer-events: none;
  }

  /* Top-left */
  .fs-crop-tl {
    top: -1.5mm;
    left: -1.5mm;
    border-top: 0.25pt solid #c0c0c0;
    border-left: 0.25pt solid #c0c0c0;
  }

  /* Top-right */
  .fs-crop-tr {
    top: -1.5mm;
    right: -1.5mm;
    border-top: 0.25pt solid #c0c0c0;
    border-right: 0.25pt solid #c0c0c0;
  }

  /* Bottom-left */
  .fs-crop-bl {
    bottom: -1.5mm;
    left: -1.5mm;
    border-bottom: 0.25pt solid #c0c0c0;
    border-left: 0.25pt solid #c0c0c0;
  }

  /* Bottom-right */
  .fs-crop-br {
    bottom: -1.5mm;
    right: -1.5mm;
    border-bottom: 0.25pt solid #c0c0c0;
    border-right: 0.25pt solid #c0c0c0;
  }

  .fs-print-img-wrap {
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    min-height: 0;
  }

  .fs-print-img {
    width: 100%;
    height: 100%;
    object-fit: var(--print-fit, cover);
    display: block;
  }

  .fs-print-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5mm 2mm;
    width: 100%;
    background: #ffffff;
    flex-shrink: 0;
  }

  .fs-print-name {
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #18181b !important;
    margin: 0;
    line-height: 1;
  }

  .fs-print-code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 5.5pt;
    color: #71717a !important;
    margin: 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
}
`;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface NativePrintLayoutProps {
  prints: any[];
  orientation: 'portrait' | 'landscape';
  photosPerPage?: number;
  printFit?: 'cover' | 'contain';
  showLogo?: boolean;
  showTimestamp?: boolean;
  clientLogoUrl?: string;
  showCropMarks?: boolean;
}

const getGridTemplate = (photosPerPage: number, orientation: 'portrait' | 'landscape') => {
  switch (photosPerPage) {
    case 1:  return { cols: 1, rows: 1 };
    case 2:  return orientation === 'portrait' ? { cols: 1, rows: 2 } : { cols: 2, rows: 1 };
    case 4:  return { cols: 2, rows: 2 };
    case 6:  return orientation === 'portrait' ? { cols: 2, rows: 3 } : { cols: 3, rows: 2 };
    case 12: return orientation === 'portrait' ? { cols: 3, rows: 4 } : { cols: 4, rows: 3 };
    case 25: return { cols: 5, rows: 5 };
    default: return { cols: 2, rows: 2 };
  }
};

/** Tiny corner crop-mark — rendered as 4 divs around each card */
function CropMarks() {
  return (
    <>
      <div className="fs-crop-tl" aria-hidden="true" />
      <div className="fs-crop-tr" aria-hidden="true" />
      <div className="fs-crop-bl" aria-hidden="true" />
      <div className="fs-crop-br" aria-hidden="true" />
    </>
  );
}

export function NativePrintLayout({ 
  prints, 
  orientation, 
  photosPerPage = 4,
  printFit = 'cover',
  showLogo = true,
  showTimestamp = true,
  clientLogoUrl,
  showCropMarks = true,
}: NativePrintLayoutProps) {
  if (!prints || prints.length === 0) return null;

  const printPages = chunkArray(prints, photosPerPage);
  const { cols, rows } = getGridTemplate(photosPerPage, orientation);

  // Gap shrinks for high-density layouts so crop marks don't overlap
  const gap = photosPerPage >= 12 ? '2mm' : '4mm';

  const defaultLogo = "https://ui-avatars.com/api/?name=F+S&background=18181b&color=fff&rounded=true&bold=true";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getPrintStyles(orientation) }} />
      <div 
        id="fs-printable-area" 
        className="hidden print:block"
        style={{ '--print-fit': printFit } as React.CSSProperties}
      >
        {printPages.map((pageItems, pageIdx) => (
          <div 
            key={pageIdx} 
            className="fs-print-page"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap,
            }}
          >
            {pageItems.map(p => {
              const printDate = new Date(p.createdAt || Date.now());
              const timeString = printDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const dateString = printDate.toLocaleDateString('pt-BR');

              return (
                <div key={p.id} className="fs-print-card">
                  {/* Crop / cut marks — one L-shaped corner per corner */}
                  {showCropMarks && <CropMarks />}

                  <div className="fs-print-img-wrap">
                    <img
                      src={p.imageUrl}
                      alt={p.referenceCode}
                      className="fs-print-img"
                      crossOrigin="anonymous"
                    />
                  </div>

                  <div className="fs-print-footer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
                      <p className="fs-print-name">
                        {p.customerName || "Convidado"}
                      </p>
                      <p className="fs-print-code">
                        #{p.referenceCode}
                        {showTimestamp && ` • ${dateString} ${timeString}`}
                      </p>
                    </div>

                    {showLogo && (
                      <img 
                        src={clientLogoUrl || defaultLogo} 
                        alt="Logo" 
                        style={{ height: '6mm', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
