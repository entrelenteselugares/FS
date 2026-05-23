import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";

import { ArrowLeft, QrCode, X, Check, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ── Helper: split array into chunks of N ──────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Print override styles (injected inline to bypass global anti-theft rule) ─
const PRINT_STYLES = `
@media print {
  @page {
    size: A4 portrait;
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
    width: 210mm;
    height: 297mm;
    padding: 14mm;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 10mm;
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
    border: 1px solid #e4e4e7;
    border-radius: 6px;
    padding: 3mm;
    box-sizing: border-box;
  }

  .fs-print-img-wrap {
    flex: 1;
    overflow: hidden;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
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
    padding-top: 2.5mm;
    width: 100%;
    border-top: 1px dashed #d4d4d8;
    margin-top: 2.5mm;
    flex-shrink: 0;
  }

  .fs-print-footer-text {
    display: flex;
    flex-direction: column;
    gap: 1mm;
  }

  .fs-print-name {
    font-family: 'Inter', sans-serif;
    font-size: 9.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #18181b !important;
    margin: 0;
    line-height: 1.2;
  }

  .fs-print-code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 6.5pt;
    color: #71717a !important;
    margin: 0;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .fs-print-qr {
    padding: 2mm;
    background: #ffffff;
    border: 0.5mm solid #e4e4e7;
    border-radius: 4px;
    flex-shrink: 0;
  }
}
`;

export default function FullMonitor() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [prints, setPrints] = useState<any[]>([]);
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [columns, setColumns] = useState<number>(4);
  const [maxPhotos, setMaxPhotos] = useState<number>(8);

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    if (selected.length === 0) {
      alert("Selecione pelo menos uma foto para imprimir.");
      return;
    }
    window.print();
  };

  const captureUrl = `${window.location.origin}/captura?eventId=${eventId}`;

  const fetchPrints = useCallback(async () => {
    try {
      const { data } = await API.get(`/phygital/events/${eventId}/prints`);
      setPrints(data);
    } catch (err) {
      console.error("Erro ao buscar fila de impressão:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    API.get(`/profissional/events/${eventId}`).then(r => setEvent(r.data));
    fetchPrints();
    const interval = setInterval(fetchPrints, 10000);
    return () => clearInterval(interval);
  }, [eventId, fetchPrints]);

  // Photos to print (filtered by selection)
  const selectedPrints = prints.filter(p => selected.includes(p.id));
  // Paginate: 4 photos per A4 page
  const printPages = chunkArray(selectedPrints, 4);

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
        <p className="text-theme-muted text-sm font-bold uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <div data-theme="dark" className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.08),transparent_70%)] pointer-events-none" />
      {/* ── Inject print-specific styles ───────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN VIEW — hidden from browser print dialog
      ══════════════════════════════════════════════════════════════════ */}
      <div className="print:hidden flex flex-col min-h-screen">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-theme-bg-muted rounded-full transition-all text-theme-text-muted hover:text-theme-text"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black uppercase tracking-widest text-theme-text">
            Monitor Externo
          </h1>

          {/* Selection pill */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full">
              <Check size={12} className="text-brand-tactical" />
              <span className="text-xs font-black text-brand-tactical uppercase tracking-widest hidden md:inline">
                {selected.length} selecionada{selected.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs font-black text-brand-tactical uppercase tracking-widest md:hidden">
                {selected.length}
              </span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* Grid Controls */}
            <div className="hidden lg:flex items-center gap-2 mr-2 bg-theme-bg-muted/50 px-3 py-1.5 rounded-full border border-theme-border/50">
              <label className="text-[10px] text-theme-text-muted uppercase font-bold tracking-widest">Colunas:</label>
              <select 
                value={columns} 
                onChange={e => setColumns(Number(e.target.value))}
                className="bg-transparent text-theme-text text-xs font-bold outline-none cursor-pointer"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
              <div className="w-[1px] h-3 bg-theme-border mx-1" />
              <label className="text-[10px] text-theme-text-muted uppercase font-bold tracking-widest">Máx:</label>
              <select 
                value={maxPhotos} 
                onChange={e => setMaxPhotos(Number(e.target.value))}
                className="bg-transparent text-theme-text text-xs font-bold outline-none cursor-pointer"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
                <option value={24}>24</option>
              </select>
            </div>

            {/* Clear selection */}
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="text-xs font-bold text-theme-muted hover:text-theme-text uppercase tracking-widest transition-colors"
              >
                Limpar
              </button>
            )}

            {/* Open QR modal */}
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-theme-bg border border-theme-border text-theme-text hover:border-brand-tactical/50 hover:text-brand-tactical transition-all rounded-full px-4 py-2"
            >
              <QrCode size={14} /> QR
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              disabled={selected.length === 0}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-brand-tactical text-white hover:bg-brand-tactical/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-full px-4 py-2 shadow-lg shadow-brand-tactical/20"
            >
              <Printer size={14} />
              Imprimir ({selected.length})
            </button>
          </div>
        </header>

        {/* ── Grid of 8 Photo Cards ────────────────────────────────── */}
        <main className="pt-24 pb-8 px-6 md:px-12 max-w-[100vw] mx-auto flex-1">
          {prints.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-theme-muted">
              <div className="w-16 h-16 rounded-2xl bg-theme-card border border-theme-border flex items-center justify-center">
                <Printer size={28} className="opacity-30" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                Nenhuma foto na fila
              </p>
            </div>
          ) : (
            <section 
              className="grid gap-5"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {prints.slice(0, maxPhotos).map(print => {
                const isSelected = selected.includes(print.id);
                const photoUrl = `${window.location.origin}/flash/${print.referenceCode}`;

                return (
                  <div
                    key={print.id}
                    onClick={() => toggleSelect(print.id)}
                    className={[
                      "relative group cursor-pointer select-none",
                      "bg-theme-card border rounded-2xl overflow-hidden",
                      "flex flex-col aspect-square",
                      "transition-all duration-300 ease-out",
                      "hover:scale-[1.02] active:scale-[0.97]",
                      isSelected
                        ? "border-brand-tactical border-2 shadow-[0_0_0_4px_rgba(133,185,172,0.18),0_8px_30px_rgba(133,185,172,0.12)]"
                        : "border-theme-border shadow-lg hover:shadow-2xl hover:border-brand-tactical/40",
                    ].join(" ")}
                  >
                    {/* ── Selection badge (top-right) ─── */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-brand-tactical flex items-center justify-center shadow-md shadow-brand-tactical/40 ring-2 ring-white/30">
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-2 h-2 rounded-full bg-white/60" />
                        </div>
                      )}
                    </div>

                    {/* ── Photo ─────────────────────────── */}
                    <div className="relative overflow-hidden flex-grow bg-zinc-900 flex items-center justify-center">
                      <img
                        src={print.imageUrl}
                        alt={print.referenceCode}
                        className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        draggable={false}
                      />

                      {/* Selected overlay tint */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-brand-tactical/8 pointer-events-none" />
                      )}

                      {/* ── Individual QR Code overlay (bottom-right) ─ */}
                      <div
                        className="absolute bottom-2.5 right-2.5 z-10 p-1.5 bg-white/95 rounded-xl shadow-lg border border-white/80 backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                        title={`Escanear foto ${print.referenceCode}`}
                      >
                        <QRCodeSVG
                          value={photoUrl}
                          size={40}
                          level="M"
                          bgColor="transparent"
                          fgColor="#18181b"
                        />
                      </div>
                    </div>

                    {/* ── Card Footer ────────────────────── */}
                    <div className="px-3.5 py-3 flex justify-between items-center flex-shrink-0 bg-theme-card border-t border-theme-border/40">
                      <p className="text-sm font-black text-theme-text truncate leading-tight">
                        {print.customerName || "Convidado"}
                      </p>
                      <span className="text-[10px] font-semibold text-theme-muted shrink-0 bg-theme-bg/60 px-2 py-0.5 rounded font-mono">
                        {new Date(print.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </main>

        {/* ── Permanent floating QR (bottom-right) ──────────────────── */}
        <div className="fixed bottom-8 right-8 z-40 bg-white/10 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 w-56 border border-white/20 print:hidden animate-in fade-in slide-in-from-bottom-8 duration-700 hover-lift">
          <div className="bg-white p-3 rounded-2xl w-full flex justify-center">
            <QRCodeSVG value={captureUrl} size={160} level="H" />
          </div>
          <div className="text-center w-full bg-brand-tactical p-3 rounded-xl shadow-inner">
            <p className="text-[9px] font-black text-black/60 uppercase tracking-widest leading-none mb-1">Escanear para</p>
            <p className="text-sm font-black text-black uppercase tracking-widest">Enviar Fotos</p>
          </div>
        </div>

        {/* ── QR Code Modal ────────────────────────────────────────── */}
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-theme-card border border-theme-border p-8 rounded-2xl relative max-w-md w-full shadow-2xl">
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 p-2 bg-theme-bg-muted rounded-full hover:bg-theme-border transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="text-center text-xl font-black uppercase tracking-widest mb-2">Captura ao Vivo</h2>
              <p className="text-center text-xs text-theme-muted mb-6 uppercase tracking-widest">
                Aponte a câmera para enviar fotos
              </p>
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG value={captureUrl} size={240} level="H" />
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(captureUrl); }}
                className="w-full mt-4 py-2.5 bg-brand-tactical text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-tactical/80 transition-colors"
              >
                Copiar Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PRINTABLE AREA — only visible in browser print dialog
          Completely outside the print:hidden containers above.
      ══════════════════════════════════════════════════════════════════ */}
      <div id="fs-printable-area" className="hidden print:block">
        {selectedPrints.length === 0 ? (
          // Fallback if somehow print is triggered with no selection
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
                  {/* Photo */}
                  <div className="fs-print-img-wrap">
                    <img
                      src={p.imageUrl}
                      alt={p.referenceCode}
                      className="fs-print-img"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* Footer: name + code + scan QR */}
                  <div className="fs-print-footer">
                    <div className="fs-print-footer-text">
                      <p className="fs-print-name">
                        {p.customerName || "Convidado"}
                      </p>
                      <p className="fs-print-code">
                        #{p.referenceCode}
                      </p>
                    </div>
                    <div className="fs-print-qr">
                      <QRCodeSVG
                        value={`${window.location.origin}/flash/${p.referenceCode}`}
                        size={38}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#18181b"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
