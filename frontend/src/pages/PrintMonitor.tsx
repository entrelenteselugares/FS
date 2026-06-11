import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { 
  Printer, ArrowLeft, RefreshCw, CheckCircle2, Check,
  Clock, ExternalLink, Play, QrCode, X,
  Expand
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { T } from "../lib/theme";
import { FlashEventMonitor } from "../components/profissional/FlashEventMonitor";
import { NativePrintLayout } from "../components/NativePrintLayout";
import { useAutoPrintEngine } from "../hooks/useAutoPrintEngine";

export interface PrintItem {
  id: string;
  referenceCode: string;
  imageUrl: string;
  customerName: string;
  status: 'PENDING_PRINT' | 'PRINTED' | 'DISPATCHED_MAIL';
  createdAt: string;
}

// Utilitário para comprimir a imagem antes do envio (evita erro 413 Payload Too Large no Vercel - Limite 4.5MB)
const compressImage = async (file: File): Promise<Blob | File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1920;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(blob);
        },
        'image/jpeg',
        0.8
      );
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
  });
};

// PhygitalPrint type is imported from PrintSettingsPanel

interface EventInfo {
  id: string;
  title: string;
  tenantLogoUrl?: string;
  verticalConfigs?: Record<string, unknown>;
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
  const [printTargets, setPrintTargets] = useState<PrintItem[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
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

  const handlePrintGroup = useCallback((group: PrintItem[], layoutOrientation: 'portrait' | 'landscape') => {
    setOrientation(layoutOrientation);
    setPrintTargets(group);
  }, []);

  useAutoPrintEngine({
    enabled: autoPrint,
    prints,
    eventId: eventId!,
    onPrintGroup: handlePrintGroup,
    refetchPrints: fetchPrints
  });

  useEffect(() => {
    API.get(`/profissional/events/${eventId}`).then(r => {
      setEvent(r.data);
      const designer = (r.data?.verticalConfigs?.printDesigner as { showLogo?: boolean; showTimestamp?: boolean; clientLogoUrl?: string }) || {};
      setShowLogo(designer.showLogo ?? true);
      setShowTimestamp(designer.showTimestamp ?? true);
      setClientLogoUrl(designer.clientLogoUrl ?? '');
    });
    fetchPrints();
    
    // Serverless-Native: Utiliza WebSockets via Supabase Realtime invés de polling
    const channel = supabase
      .channel(`phygital-prints-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'PhygitalPrint',
          filter: `eventId=eq.${eventId}`
        },
        (payload) => {
          console.log("[Supabase Realtime] Print atualizado:", payload);
          fetchPrints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchPrints]);

  const handlePrint = (print: PrintItem) => {
    setPrintTargets([print]);
  };

  const handlePrintSelected = () => {
    const selectedPrints = prints.filter(p => selected.includes(p.id));
    if (selectedPrints.length > 0) {
      setPrintTargets(selectedPrints);
    }
  };

  const handlePrinted = useCallback(async (targets: PrintItem[]) => {
    try {
      await Promise.all(
        targets.map(p => API.patch(`/phygital/prints/${p.id}/status`, { status: 'PRINTED' }))
      );
      fetchPrints();
      setSelected([]);
    } catch (err) {
      console.error('Erro ao marcar impressão:', err);
    }
    setPrintTargets(null);
  }, [fetchPrints]);

  const pendingCount = prints.filter(p => p.status === 'PENDING_PRINT').length;

  useEffect(() => {
    if (printTargets && printTargets.length > 0) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [printTargets]);

  useEffect(() => {
    const afterPrint = () => {
      if (printTargets && printTargets.length > 0) {
        handlePrinted(printTargets);
      }
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, [printTargets, handlePrinted]);

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-3 md:gap-6">
        <div className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.5em]">Sincronizando Radar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <div className="print:hidden">
        {/* Header Fixo */}
        <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-theme-border px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-theme-bg-muted rounded-full transition-all text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest">{event?.title || 'Radar Phygital'}</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Central de Comando de Impressão</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
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
                  const compressedBlob = await compressImage(file);
                  const formData = new FormData();
                  formData.append("photo", compressedBlob, file.name);
                  formData.append("eventId", eventId!);
                  formData.append("customerName", "Profissional (Manual)");
                  await API.post("/public/phygital/upload", formData);
                }
                fetchPrints();
              } catch (err: unknown) {
                console.error("Erro no upload manual:", err);
                const details = (err as { response?: { data?: { details?: string } } })?.response?.data?.details;
                alert(`Erro ao enviar fotos: ${details || 'Verifique seu saldo, conexão ou configuração do servidor.'}`);
              } finally {
                setLoading(false);
              }
            }}
          />
          <button 
            onClick={() => document.getElementById('manual-upload')?.click()}
            className="hidden md:flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-brand-tactical text-white border border-brand-tactical hover:brightness-110 transition-all"
          >
            <ExternalLink size={12} /> Enviar Fotos
          </button>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-theme-card border border-theme-border rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${autoPrint ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{autoPrint ? 'Auto-Print Ativo' : 'Manual'}</span>
          </div>
          <button 
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white text-zinc-950 hover:bg-zinc-200 transition-all"
          >
            <QrCode size={12} /> Mostrar QR Code
          </button>

          <button 
            onClick={() => setAutoPrint(!autoPrint)}
            className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              autoPrint 
                ? 'bg-brand-tactical text-zinc-950 shadow-[0_0_15px_rgba(133,185,172,0.4)] ring-2 ring-brand-tactical/50' 
                : 'bg-theme-bg-muted hover:bg-white/10 text-white/90'
            }`}
          >
            <Play size={12} /> Auto-Print {autoPrint ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* Barra de Configurações de Impressão */}
      <div className="print:hidden border-b border-theme-border bg-zinc-950/50 py-2 px-4 md:px-6 flex flex-wrap items-center gap-3 overflow-x-auto text-[9px] font-bold uppercase tracking-widest">
        <span className="text-zinc-500 mr-2 flex-shrink-0">Configurações de Impressão:</span>
        
        <div className="flex-shrink-0 flex items-center gap-2 bg-theme-bg border border-theme-border p-1 rounded-full">
            <select 
              value={photosPerPage}
              onChange={(e) => setPhotosPerPage(Number(e.target.value))}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-theme-text px-2 py-1 outline-none cursor-pointer"
            >
              <option value={1} className="bg-theme-bg">1 / folha (A4)</option>
              <option value={2} className="bg-theme-bg">2 / folha (A5)</option>
              <option value={4} className="bg-theme-bg">4 / folha (10x15)</option>
              <option value={6} className="bg-theme-bg">6 / folha (9x13)</option>
              <option value={12} className="bg-theme-bg">12 / folha (Polaroid)</option>
              <option value={25} className="bg-theme-bg">25 / folha (Mini)</option>
            </select>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 bg-theme-bg border border-theme-border p-1 rounded-full">
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'portrait' ? 'bg-brand-tactical text-zinc-950 shadow' : 'text-theme-muted hover:text-theme-text'}`}
            >
              Retrato
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orientation === 'landscape' ? 'bg-brand-tactical text-zinc-950 shadow' : 'text-theme-muted hover:text-theme-text'}`}
            >
              Paisagem
            </button>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 bg-theme-bg border border-theme-border p-1 rounded-full">
          <button
            onClick={() => setPrintFit('cover')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${printFit === 'cover' ? 'bg-brand-tactical text-zinc-950 shadow' : 'text-theme-muted hover:text-theme-text'}`}
          >
            Preencher
          </button>
          <button
            onClick={() => setPrintFit('contain')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${printFit === 'contain' ? 'bg-brand-tactical text-zinc-950 shadow' : 'text-theme-muted hover:text-theme-text'}`}
          >
            Encaixar
          </button>
        </div>



        <label className="flex-shrink-0 flex items-center gap-2 cursor-pointer border border-theme-border bg-theme-bg px-3 py-1.5 rounded-full hover:bg-zinc-800/50 transition-colors">
          <input type="checkbox" checked={showCropMarks} onChange={e => setShowCropMarks(e.target.checked)} className="accent-brand-tactical" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text">Marcas de Corte</span>
        </label>



        <button onClick={() => navigate(`/profissional/monitor/${eventId}/full`)} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest bg-brand-tactical text-zinc-950 hover:brightness-110 transition-all shadow-sm ml-auto">
          <Expand size={12} /> Full Screen
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-3 md:p-6 space-y-6">
        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div className="bg-theme-bg-muted border border-theme-border/50 p-3 md:p-4 rounded-xl flex flex-col justify-center">
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mb-1">Fila de Espera</p>
            <p className="text-2xl md:text-3xl font-bold text-brand-tactical leading-none">{pendingCount}</p>
            <p className="text-[8px] text-theme-muted uppercase font-bold mt-1">fotos pendentes</p>
          </div>
          <div className="bg-theme-bg-muted border border-theme-border/50 p-3 md:p-4 rounded-xl flex flex-col justify-center">
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mb-1">Sincronização</p>
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-theme-text leading-none">
              <Clock size={12} /> {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <p className="text-[8px] text-theme-muted uppercase font-bold mt-1">última verificação</p>
          </div>
          <div className="bg-theme-bg-muted border border-theme-border/50 p-3 md:p-4 rounded-xl flex flex-col justify-center">
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mb-1">Créditos Unidade</p>
            <p className="text-2xl md:text-3xl font-bold text-theme-text leading-none">{user?.franchiseProfile?.printCredits || 0}</p>
            <p className="text-[8px] text-theme-muted uppercase font-bold mt-1">fotos restantes</p>
          </div>
          <div className="bg-theme-bg-muted border border-theme-border/50 p-3 md:p-4 rounded-xl flex flex-col justify-center">
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mb-1">Configuração</p>
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-theme-text leading-none uppercase">
              <Printer size={12} /> {orientation}
            </div>
            <p className="text-[8px] text-theme-muted uppercase font-bold mt-1">layout base</p>
          </div>
        </div>

        {/* Monitoramento do Funil Flash Event */}
        {eventId && (
          <div className="mb-10 bg-theme-bg p-3 md:p-6 border border-theme-border">
            <FlashEventMonitor eventId={eventId} />
          </div>
        )}

        {/* Fila de Impressão */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold uppercase ">Fila de Operação</h2>
              {selected.length > 0 && (
                <button
                  onClick={handlePrintSelected}
                  className="px-4 py-2 bg-brand-tactical text-zinc-950 text-[10px] font-bold uppercase tracking-widest rounded-full hover:brightness-110 flex items-center gap-2"
                >
                  <Printer size={12} />
                  Imprimir Selecionadas ({selected.length})
                </button>
              )}
            </div>
            <button onClick={fetchPrints} className="p-2 text-zinc-500 hover:text-brand-tactical transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {prints.length === 0 ? (
            <div className="py-20 border  border-theme-border rounded-2xl flex flex-col items-center justify-center gap-4">
              <Printer size={48} className="text-zinc-800" />
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Aguardando Capturas Phygital...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {prints.map((print) => {
                const isSelected = selected.includes(print.id);
                return (
                <div 
                  key={print.id} 
                  className={`group relative bg-theme-card border transition-all duration-500 overflow-hidden cursor-pointer ${
                    isSelected 
                      ? 'border-brand-tactical border-2 shadow-[0_0_0_4px_rgba(133,185,172,0.18)]' 
                      : print.status === 'PENDING_PRINT' 
                        ? 'border-brand-tactical/30' 
                        : 'border-theme-border opacity-60'
                  }`}
                  onClick={(e) => {
                    // Impede selecionar se clicou no botão de imprimir individual
                    if ((e.target as HTMLElement).closest('button')) return;
                    toggleSelect(print.id);
                  }}
                >
                  {/* Selection badge (top-left) */}
                  <div className="absolute top-3 left-3 z-20">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-brand-tactical flex items-center justify-center shadow-md shadow-brand-tactical/40 ring-2 ring-white/30">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-2 h-2 rounded-full bg-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="aspect-[3/2] overflow-hidden relative">
                    <img src={print.imageUrl} alt={print.referenceCode} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand-tactical/10 pointer-events-none" />
                    )}
                    <div style={{ position: "absolute", top: 12, right: 12, padding: "6px 14px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", color: T.brand, fontSize: 16, fontWeight: 900, fontFamily: T.fontD, fontStyle: "italic", letterSpacing: 1, zIndex: 10 }}>
                      {print.referenceCode}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase ">{print.customerName || 'Convidado'}</p>
                        <p className="text-[8px] text-zinc-500 uppercase font-bold mt-0.5">{new Date(print.createdAt).toLocaleTimeString()}</p>
                      </div>
                      {print.status === 'PRINTED' ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                           <span className="text-[8px] font-bold text-brand-tactical uppercase">Pendente</span>
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
              )})}
            </div>
          )}
        </div>
      </div>

      {/* QR CODE MODAL */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-reveal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="bg-theme-card border border-theme-border p-4 md:p-8 md:p-12 max-w-md w-full relative flex flex-col items-center text-center gap-4 md:gap-8 shadow-2xl" style={{ margin: "auto" }}>
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-all bg-theme-bg-muted rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                <h3 className="text-2xl font-bold uppercase " style={{ fontFamily: T.fontD, color: T.text }}>Captura ao Vivo</h3>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Aponte a câmera para enviar fotos</p>
            </div>
            
            <div className="p-3 md:p-6 bg-white rounded-3xl shadow-2xl shadow-brand-tactical/10">
              <QRCodeSVG value={captureUrl} size={280} level="H" />
            </div>

            <div className="space-y-6 w-full">
              <button 
                onClick={() => { navigator.clipboard.writeText(captureUrl); alert("Link de captura copiado!"); }}
                className="w-full py-4 border border-brand-tactical/30 text-brand-tactical text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-brand-tactical/10 transition-all flex items-center justify-center gap-3"
              >
                <QrCode size={14} /> COPIAR LINK DE CAPTURA
              </button>

              <div className="space-y-3">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] ">Sua Foto Impressa na Hora</p>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">As fotos enviadas aparecem instantaneamente na nossa estação de comando.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fechamento do print:hidden */}
      </div>

      {/* Print Native Layout */}
      {printTargets && printTargets.length > 0 && (
        <NativePrintLayout 
          prints={printTargets} 
          orientation={orientation} 
          photosPerPage={photosPerPage}
          printFit={printFit}
          showLogo={showLogo}
          showTimestamp={showTimestamp}
          clientLogoUrl={clientLogoUrl}
          showCropMarks={showCropMarks}
        />
      )}
    </div>
  );
}
