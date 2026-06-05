import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { supabase } from "../lib/supabase";

import { ArrowLeft, QrCode, X, Check, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { NativePrintLayout } from "../components/NativePrintLayout";

// ── Helper: split array into chunks of N ──────────────────────────────────
// NativePrintLayout contains the print styles and structure

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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [photosPerPage, setPhotosPerPage] = useState<number>(4);
  const [printFit, setPrintFit] = useState<'cover' | 'contain'>('cover');
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showTimestamp, setShowTimestamp] = useState<boolean>(true);
  const [clientLogoUrl, setClientLogoUrl] = useState<string>('');
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);

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
    const channel = supabase
      .channel(`full-monitor-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'PhygitalPrint',
          filter: `eventId=eq.${eventId}`
        },
        (payload) => {
          console.log("[Supabase Realtime] FullMonitor update:", payload);
          fetchPrints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchPrints]);

  const selectedPrints = prints.filter(p => selected.includes(p.id));

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
        <p className="text-theme-muted text-sm font-bold uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <div data-theme="dark" className="h-screen w-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.08),transparent_70%)] pointer-events-none" />


      {/* ══════════════════════════════════════════════════════════════════
          SCREEN VIEW — hidden from browser print dialog
      ══════════════════════════════════════════════════════════════════ */}
      <div className="print:hidden flex flex-col h-full overflow-hidden">
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
            <div className="hidden lg:flex items-center gap-2 mr-2 bg-theme-bg-muted px-3 py-1.5 rounded-full border border-theme-border/50">
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

            {/* Print Settings (Orientation & Layout) */}
            <div className="hidden md:flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-theme-bg-muted border border-theme-border p-1 rounded-full">
                <select 
                  value={photosPerPage}
                  onChange={(e) => setPhotosPerPage(Number(e.target.value))}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-theme-text px-2 py-1 outline-none cursor-pointer"
                >
                  <option value={1} className="bg-theme-bg">1 / folha</option>
                  <option value={2} className="bg-theme-bg">2 / folha</option>
                  <option value={4} className="bg-theme-bg">4 / folha</option>
                  <option value={6} className="bg-theme-bg">6 / folha</option>
                  <option value={12} className="bg-theme-bg">12 / folha</option>
                  <option value={25} className="bg-theme-bg">25 / folha</option>
                </select>
              </div>
              
              <div className="flex items-center gap-1 bg-theme-bg-muted border border-theme-border p-1 rounded-full">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'portrait' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                >
                  Retrato
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'landscape' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                >
                  Paisagem
                </button>
              </div>

              <div className="flex items-center gap-1 bg-theme-bg-muted border border-theme-border p-1 rounded-full">
                <button
                  onClick={() => setPrintFit('cover')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${printFit === 'cover' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                >
                  Preencher
                </button>
                <button
                  onClick={() => setPrintFit('contain')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${printFit === 'contain' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                >
                  Encaixar
                </button>
              </div>

              <label className="flex items-center gap-1 cursor-pointer bg-theme-bg-muted border border-theme-border px-3 py-1.5 rounded-full hover:bg-zinc-800/50 transition-colors">
                <input type="checkbox" checked={showLogo} onChange={e => setShowLogo(e.target.checked)} className="accent-brand-tactical" />
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-text ml-1">Logo</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer bg-theme-bg-muted border border-theme-border px-3 py-1.5 rounded-full hover:bg-zinc-800/50 transition-colors">
                <input type="checkbox" checked={showTimestamp} onChange={e => setShowTimestamp(e.target.checked)} className="accent-brand-tactical" />
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-text ml-1">Data/Hora</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer border border-brand-tactical bg-brand-tactical/10 px-3 py-1.5 rounded-full hover:bg-brand-tactical/20 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-tactical">{clientLogoUrl ? 'Logo ✓' : '+ Cliente'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const url = URL.createObjectURL(e.target.files[0]);
                      setClientLogoUrl(url);
                    }
                  }}
                />
              </label>
            </div>

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

        {/* ── Layout Dividido: Grade + Banner Lateral ───────────────── */}
        <div className="flex pt-16 flex-1 h-full w-full max-w-[100vw] overflow-hidden">
          
          {/* Main Content Area (Esquerda) */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {prints.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-theme-muted">
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

                  return (
                    <div
                      key={print.id}
                      onClick={() => toggleSelect(print.id)}
                      className={[
                        "relative group cursor-pointer select-none",
                        "bg-theme-card border rounded-2xl overflow-hidden",
                        "flex flex-col aspect-[2/3]",
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
                      </div>

                      {/* ── Card Footer ────────────────────── */}
                      <div className="px-3.5 py-3 flex justify-between items-center flex-shrink-0 bg-theme-card border-t border-theme-border">
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

          {/* ── Banner Lateral Direito com QR Code ──────────────────── */}
          <aside className="w-72 xl:w-80 border-l border-theme-border bg-theme-card/30 backdrop-blur-md flex flex-col items-center justify-center p-8 relative overflow-hidden hidden md:flex shrink-0">
            {/* Background elements para deixar chamativo */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-tactical/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1),transparent_70%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[200px] flex flex-col items-center text-center gap-8">
              <div className="space-y-2">
                <div className="w-12 h-1 bg-brand-tactical mx-auto rounded-full mb-4 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text leading-none">
                  FOTOGRAFE
                </h3>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text leading-none text-brand-tactical">
                  E IMPRIMA
                </h3>
              </div>

              <div className="bg-white p-3 rounded-[24px] shadow-2xl ring-4 ring-white/10 transform transition-transform hover:scale-105 duration-500">
                <QRCodeSVG value={captureUrl} size={170} level="H" />
              </div>
              
              <div className="space-y-3 bg-theme-bg/60 p-4 rounded-2xl border border-theme-border w-full">
                <div className="flex justify-center mb-1"><QrCode size={20} className="text-brand-tactical" /></div>
                <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] leading-relaxed">
                  Aponte a câmera do seu celular para o QR Code acima
                </p>
              </div>
            </div>
          </aside>
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

      <NativePrintLayout 
        prints={selectedPrints} 
        orientation={orientation} 
        photosPerPage={photosPerPage}
        printFit={printFit}
        showLogo={showLogo}
        showTimestamp={showTimestamp}
        clientLogoUrl={clientLogoUrl}
        showCropMarks={showCropMarks}
      />
    </div>
  );
}
