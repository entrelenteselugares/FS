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
    padding: 4mm;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    box-sizing: border-box;
    display: grid;
    /* GRID INJECTED INLINE */
    gap: 4mm;
    background: #ffffff !important;
  }

  /* Individual printed photo card */
  .fs-print-card {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #ffffff !important;
    border: none;
    border-radius: 0;
    padding: 0;
    box-sizing: border-box;
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
    border-radius: 2mm;
  }

  .fs-print-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5mm 3mm;
    width: 100%;
    background: #ffffff;
    flex-shrink: 0;
  }

  .fs-print-footer-text {
    display: flex;
    flex-direction: row;
    gap: 2mm;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }

  .fs-print-name {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #18181b !important;
    margin: 0;
    line-height: 1;
  }

  .fs-print-code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 6pt;
    color: #71717a !important;
    margin: 0;
    letter-spacing: 0.12em;
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
}

const getGridTemplate = (photosPerPage: number, orientation: 'portrait' | 'landscape') => {
  switch (photosPerPage) {
    case 1: return { cols: 1, rows: 1 };
    case 2: return orientation === 'portrait' ? { cols: 1, rows: 2 } : { cols: 2, rows: 1 };
    case 4: return { cols: 2, rows: 2 };
    case 6: return orientation === 'portrait' ? { cols: 2, rows: 3 } : { cols: 3, rows: 2 };
    case 12: return orientation === 'portrait' ? { cols: 3, rows: 4 } : { cols: 4, rows: 3 };
    case 25: return { cols: 5, rows: 5 };
    default: return { cols: 2, rows: 2 };
  }
};

export function NativePrintLayout({ 
  prints, 
  orientation, 
  photosPerPage = 4,
  printFit = 'cover',
  showLogo = true,
  showTimestamp = true,
  clientLogoUrl
}: NativePrintLayoutProps) {
  if (!prints || prints.length === 0) return null;

  const printPages = chunkArray(prints, photosPerPage);
  const { cols, rows } = getGridTemplate(photosPerPage, orientation);

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
              gridTemplateRows: `repeat(${rows}, 1fr)`
            }}
          >
            {pageItems.map(p => {
              const printDate = new Date(p.createdAt || Date.now());
              const timeString = printDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const dateString = printDate.toLocaleDateString('pt-BR');

              return (
                <div key={p.id} className="fs-print-card flex flex-col p-[2mm] bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="fs-print-img-wrap rounded bg-gray-50 flex-1 relative overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.referenceCode}
                      className="fs-print-img"
                      crossOrigin="anonymous"
                    />
                  </div>
                  
                  <div className="fs-print-footer mt-[2mm] flex items-center justify-between">
                    <div className="flex flex-col gap-[1px]">
                      <p className="fs-print-name text-[8pt] font-black uppercase text-zinc-900 tracking-wider">
                        {p.customerName || "Convidado"}
                      </p>
                      <p className="fs-print-code text-[6pt] text-zinc-500 font-mono">
                        #{p.referenceCode}
                        {showTimestamp && ` • ${dateString} ${timeString}`}
                      </p>
                    </div>

                    {showLogo && (
                      <div className="flex items-center gap-[2mm]">
                        <img 
                          src={clientLogoUrl || defaultLogo} 
                          alt="Logo" 
                          className="h-[6mm] object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
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
