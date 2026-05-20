import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";

import { ArrowLeft, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function FullMonitor() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [prints, setPrints] = useState<any[]>([]);
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handlePrint = () => {
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

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
        <p className="ml-4 text-theme-muted">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-theme-bg-muted rounded-full transition-all text-theme-text-muted hover:text-theme-text">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-4 text-lg font-black uppercase tracking-widest text-theme-text">Monitor Externo</h1>
        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => setShowQR(true)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-theme-text hover:bg-theme-bg-muted transition-all rounded-full px-4 py-2">
            <QrCode size={14} /> QR
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-brand-tactical text-white hover:bg-brand-tactical/80 transition-all rounded-full px-4 py-2">
            Imprimir Selecionados
          </button>
        </div>
      </header>

      <main className="pt-24 pb-8 px-6 md:px-12 max-w-[100vw] mx-auto print:hidden">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {prints.slice(0, 8).map(print => (
            <div key={print.id} className={`group bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-brand-tactical/50 transition-all duration-300 flex flex-col aspect-square ${selected.includes(print.id) ? 'border-2 border-brand-tactical' : ''}`}>
                <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
                  <input type="checkbox" checked={selected.includes(print.id)} onChange={() => toggleSelect(print.id)} className="h-4 w-4 text-brand-tactical bg-theme-bg border-theme-border rounded" />
                  <button className="mt-1 p-0.5 bg-white/80 rounded-full">
                    <QrCode size={12} />
                  </button>
                </div>
                <div className="overflow-hidden flex-grow bg-zinc-900 relative">
                <img 
                  src={print.imageUrl} 
                  alt={print.referenceCode} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              </div>
              <div className="p-4 flex flex-col justify-between flex-shrink-0 bg-theme-card border-t border-theme-border/50">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm font-black text-theme-text truncate">{print.customerName || 'Convidado'}</p>
                  <span className="text-xs font-semibold text-theme-text-muted shrink-0 bg-theme-bg-muted/30 px-2 py-0.5 rounded">
                    {new Date(print.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>
        {/* Printable Section - only visible when printing */}
        <div className="hidden print:block">
          <section className="grid grid-cols-2 gap-4">
            {prints.filter(p => selected.includes(p.id)).map(p => (
              <div key={p.id} className="p-2 border border-theme-border">
                <img src={p.imageUrl} alt={p.referenceCode} className="w-full h-auto object-cover" />
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* QR Code Flutuante Permanente no Canto Inferior Direito */}
      <div className="fixed bottom-6 right-6 z-40 bg-zinc-950/90 backdrop-blur-xl border border-theme-border/60 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-2xl animate-reveal md:flex hidden print:hidden">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-theme-text">Enviar Fotos</span>
        </div>
        <div className="p-2 bg-white rounded-xl">
          <QRCodeSVG value={captureUrl} size={100} level="H" />
        </div>
        <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest">Aponte a câmera</span>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-theme-card border border-theme-border p-8 rounded-lg relative max-w-md w-full">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 bg-theme-bg-muted rounded-full">
              <X size={20} />
            </button>
            <h2 className="text-center text-xl font-black mb-4">Captura ao Vivo</h2>
            <QRCodeSVG value={captureUrl} size={240} level="H" />
            <button onClick={() => { navigator.clipboard.writeText(captureUrl); alert('Link copiado'); }} className="w-full mt-4 py-2 bg-brand-tactical text-white font-bold rounded">
              Copiar Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
