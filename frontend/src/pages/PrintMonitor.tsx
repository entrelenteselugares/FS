import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { 
  Printer, ArrowLeft, RefreshCw, CheckCircle2, 
  Clock, ExternalLink, Play, Pause, QrCode, X,
  Expand
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { T } from "../lib/theme";
import { FlashEventMonitor } from "../components/profissional/FlashEventMonitor";
import { PrintSettingsPanel } from "../components/PrintSettingsPanel";
import type { PhygitalPrint as PrintItem } from "../components/PrintSettingsPanel";

// PhygitalPrint type is imported from PrintSettingsPanel

interface EventInfo {
  id: string;
  title: string;
  tenantLogoUrl?: string;
}

export default function PrintMonitor() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [prints, setPrints] = useState<PrintItem[]>([]);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const [showQR, setShowQR] = useState(false);
  const [printTarget, setPrintTarget] = useState<PrintItem | null>(null);

  const captureUrl = `${window.location.origin}/captura?eventId=${eventId}`;

  const fetchPrints = useCallback(async () => {
    try {
      const { data } = await API.get(`/phygital/events/${eventId}/prints`);
      setPrints(data);
      setLastSync(new Date());
    } catch (err) {
      console.error("Erro ao buscar fila de impressão:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    API.get(`/profissional/events/${eventId}`).then(r => setEvent(r.data));
    fetchPrints();
    
    const interval = setInterval(fetchPrints, 10000); // Polling cada 10s
    return () => clearInterval(interval);
  }, [eventId, fetchPrints]);

  const handlePrint = (print: PrintItem) => {
    // Open the full-featured print settings panel instead of raw window.open
    setPrintTarget(print);
  };

  const handlePrinted = (print: PrintItem) => {
    // Mark as printed in backend and close panel
    API.patch(`/phygital/prints/${print.id}/status`, { status: 'PRINTED' })
      .then(() => fetchPrints())
      .catch(err => console.error('Erro ao marcar impressão:', err));
    setPrintTarget(null);
  };

  const pendingCount = prints.filter(p => p.status === 'PENDING_PRINT').length;

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.5em]">Sincronizando Radar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-theme-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-all text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">{event?.title || 'Radar Phygital'}</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Central de Comando de Impressão</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="file" 
            id="manual-upload" 
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={async (e) => {
              if (!e.target.files?.length) return;
              setLoading(true);
              try {
                for (const file of Array.from(e.target.files)) {
                  const formData = new FormData();
                  formData.append("photo", file);
                  formData.append("eventId", eventId!);
                  formData.append("customerName", "Profissional (Manual)");
                  await API.post("/public/phygital/upload", formData);
                }
                fetchPrints();
              } catch (err) {
                console.error("Erro no upload manual:", err);
                alert("Erro ao enviar fotos. Verifique seu saldo ou conexão.");
              } finally {
                setLoading(false);
              }
            }}
          />
          <button 
            onClick={() => document.getElementById('manual-upload')?.click()}
            className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-tactical text-white border border-brand-tactical hover:brightness-110 transition-all"
          >
            <ExternalLink size={12} /> Enviar Fotos
          </button>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-theme-card border border-theme-border rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${autoPrint ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">{autoPrint ? 'Auto-Print Ativo' : 'Manual'}</span>
          </div>
          <button 
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white text-zinc-950 hover:bg-zinc-200 transition-all"
          >
            <QrCode size={12} /> Mostrar QR Code
          </button>
          <button
            onClick={() => navigate(`/profissional/monitor/${eventId}/full`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-tactical text-white hover:brightness-110 transition-all"
          >
            <Expand size={12} /> Full Screen
          </button>
          <button 
            onClick={() => setAutoPrint(!autoPrint)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${autoPrint ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand-tactical text-zinc-950 shadow-lg shadow-brand-tactical/20'}`}
          >
            {autoPrint ? <Pause size={12} /> : <Play size={12} />}
            {autoPrint ? 'Pausar Auto' : 'Iniciar Auto'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-theme-card/60 border border-theme-border p-6 space-y-2">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Fila de Espera</p>
            <p className="text-4xl font-black italic tracking-tighter text-brand-tactical">{pendingCount}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold">fotos pendentes</p>
          </div>
          <div className="bg-theme-card/60 border border-theme-border p-6 space-y-2">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sincronização</p>
            <div className="flex items-center gap-2 text-sm font-black italic text-zinc-300">
              <Clock size={14} /> {lastSync.toLocaleTimeString()}
            </div>
            <p className="text-[8px] text-zinc-500 uppercase font-bold">última atualização</p>
          </div>
          <div className="bg-theme-card/60 border border-theme-border p-6 space-y-2">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Créditos Unidade</p>
            <p className="text-xl font-black italic text-zinc-300">{user?.franchiseProfile?.printCredits || 0}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold">fotos restantes</p>
          </div>
          <div className="bg-theme-card/60 border border-theme-border p-6 space-y-2">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Configuração</p>
             <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase">
               <Printer size={12} /> Epson L8050
             </div>
             <p className="text-[8px] text-zinc-500 uppercase font-bold">impressora padrão</p>
          </div>
        </div>

        {/* Monitoramento do Funil Flash Event */}
        {eventId && (
          <div className="mb-10 bg-theme-bg-muted/10 p-6 border border-theme-border/30">
            <FlashEventMonitor eventId={eventId} />
          </div>
        )}

        {/* Fila de Impressão */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tighter italic">Fila de Operação</h2>
            <button onClick={fetchPrints} className="p-2 text-zinc-500 hover:text-brand-tactical transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {prints.length === 0 ? (
            <div className="py-20 border border-dashed border-theme-border rounded-2xl flex flex-col items-center justify-center gap-4">
              <Printer size={48} className="text-zinc-800" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Aguardando Capturas Phygital...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prints.map((print) => (
                <div key={print.id} className={`group relative bg-theme-card border transition-all duration-500 overflow-hidden ${print.status === 'PENDING_PRINT' ? 'border-brand-tactical/30' : 'border-theme-border opacity-60'}`}>
                  {/* Thumbnail */}
                  <div className="aspect-[3/2] overflow-hidden relative">
                    <img src={print.imageUrl} alt={print.referenceCode} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div style={{ position: "absolute", top: 12, right: 12, padding: "6px 14px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", color: T.brand, fontSize: 16, fontWeight: 900, fontFamily: T.fontD, fontStyle: "italic", letterSpacing: 1, zIndex: 10 }}>
                      {print.referenceCode}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tight">{print.customerName || 'Convidado'}</p>
                        <p className="text-[8px] text-zinc-500 uppercase font-bold mt-0.5">{new Date(print.createdAt).toLocaleTimeString()}</p>
                      </div>
                      {print.status === 'PRINTED' ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                           <span className="text-[8px] font-black text-brand-tactical uppercase">Pendente</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handlePrint(print)}
                      className={`w-full py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${print.status === 'PRINTED' ? 'bg-theme-border text-zinc-400' : 'bg-brand-tactical text-zinc-950 hover:brightness-110 shadow-lg shadow-brand-tactical/20'}`}
                    >
                      <Printer size={14} />
                      {print.status === 'PRINTED' ? 'REIMPRIMIR' : 'IMPRIMIR AGORA'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR CODE MODAL */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-reveal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="bg-theme-card border border-theme-border p-8 md:p-12 max-w-md w-full relative flex flex-col items-center text-center gap-8 shadow-2xl" style={{ margin: "auto" }}>
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: T.fontD, color: T.text }}>Captura ao Vivo</h3>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Aponte a câmera para enviar fotos</p>
            </div>
            
            <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-brand-tactical/10">
              <QRCodeSVG value={captureUrl} size={280} level="H" />
            </div>

            <div className="space-y-6 w-full">
              <button 
                onClick={() => { navigator.clipboard.writeText(captureUrl); alert("Link de captura copiado!"); }}
                className="w-full py-4 border border-brand-tactical/30 text-brand-tactical text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-tactical/10 transition-all flex items-center justify-center gap-3"
              >
                <QrCode size={14} /> COPIAR LINK DE CAPTURA
              </button>

              <div className="space-y-3">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Sua Foto Impressa na Hora</p>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">As fotos enviadas aparecem instantaneamente na nossa estação de comando.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Settings Panel */}
      {printTarget && (
        <PrintSettingsPanel
          print={printTarget}
          eventId={eventId!}
          tenantLogoUrl={event?.tenantLogoUrl}
          onClose={() => setPrintTarget(null)}
          onPrinted={() => handlePrinted(printTarget)}
        />
      )}
    </div>
  );
}
