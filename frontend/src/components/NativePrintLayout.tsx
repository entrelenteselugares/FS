

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
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
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
    object-fit: contain;
    display: block;
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
}

export function NativePrintLayout({ prints, orientation }: NativePrintLayoutProps) {
  const printPages = chunkArray(prints, 4);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getPrintStyles(orientation) }} />
      <div id="fs-printable-area" className="hidden print:block">
        {prints.length === 0 ? (
          <div className="fs-print-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14pt', color: '#71717a' }}>
              Nenhuma foto selecionada.
            </p>
          </div>
        ) : (
          printPages.map((pageItems, pageIdx) => (
            <div key={pageIdx} className="fs-print-page">
              {pageItems.map(p => (
                <div key={p.id} className="fs-print-card">
                  <div className="fs-print-img-wrap">
                    <img
                      src={p.imageUrl}
                      alt={p.referenceCode}
                      className="fs-print-img"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="fs-print-footer">
                    <div className="fs-print-footer-text">
                      <p className="fs-print-name">
                        {p.customerName || "Convidado"}
                      </p>
                      <p className="fs-print-code">
                        #{p.referenceCode}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
