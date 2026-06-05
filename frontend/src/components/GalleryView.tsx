import React, { useState } from "react";
import { Download, Share2, ImageIcon, PlayCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { EventData } from "../api";

interface GalleryViewProps {
  event: EventData;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ event }) => {
  const [searchParams] = useSearchParams();
  const [downloadingSingle, setDownloadingSingle] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const buildDownloadUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '/api';
    const url = new URL(`${baseUrl}${path}`, window.location.origin);
    const orderId = searchParams.get("orderId");
    const guestToken = searchParams.get("guestToken");
    if (orderId) url.searchParams.append("orderId", orderId);
    if (guestToken) url.searchParams.append("guestToken", guestToken);
    return url.toString();
  };

  const handleDownloadSingle = async (midia: { id: string; type?: string; tipo?: string }) => {
    if (downloadingSingle) return;
    setDownloadingSingle(midia.id);
    try {
      const proxyUrl = buildDownloadUrl(`/public/events/${event.id}/media/${midia.id}/download`);
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Erro ao baixar");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${midia.id}.${(midia.tipo || midia.type) === 'VIDEO' ? 'mp4' : 'jpg'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      alert("Erro ao realizar o download.");
      console.error(e);
    } finally {
      setDownloadingSingle(null);
    }
  };

  const handleDownloadAll = async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    try {
      const proxyUrl = buildDownloadUrl(`/public/events/${event.id}/download-all`);
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Erro ao gerar arquivo zip");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-fotos.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      alert("Erro ao realizar o download em lote.");
      console.error(e);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-40" style={{ background: "var(--theme-bg)" }}>
      <header className="px-6 mb-16 text-center max-w-7xl mx-auto">
        <h2 className="mb-2 text-[10px] font-black uppercase tracking-[0.6em] text-brand-indigo">Galeria Desbloqueada</h2>
        <h1 className="text-4xl font-black tracking-tighter uppercase md:text-6xl" style={{ color: "var(--theme-text)" }}>
          {event.title}
        </h1>
        <div className="flex items-center justify-center gap-4 mt-6">
           <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase border rounded-xl" style={{ borderColor: "var(--theme-border)", background: "var(--theme-bg-muted)", color: "var(--theme-text)" }}>
              <ImageIcon size={14} className="text-zinc-500" />
              {event.midias.length} Mídias Registradas
           </div>
        </div>
      </header>

      {/* Grid Estilo Masonry (Columns layout nativo) */}
      <div className="px-6 mx-auto max-w-7xl columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {event.midias.map((midia, index) => (
          <div 
            key={midia.id} 
            className="relative overflow-hidden group rounded-[2.5rem] shadow-2xl break-inside-avoid"
            style={{ background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)" }}
          >
            <img 
              src={midia.url} 
              alt={`Foto ${index + 1}`} 
              className="w-full h-auto transition-all duration-700 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Overlay com Ações */}
            <div className="absolute inset-0 transition-all duration-500 opacity-0 bg-black/40 group-hover:opacity-100 backdrop-blur-sm flex items-center justify-center gap-4">
              <button 
                onClick={() => handleDownloadSingle(midia)}
                disabled={downloadingSingle === midia.id}
                className="flex items-center justify-center w-12 h-12 transition-all bg-white rounded-2xl text-midnight hover:bg-brand-indigo hover:text-white active:scale-90 disabled:opacity-50"
              >
                {downloadingSingle === midia.id ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              </button>

              <button className="flex items-center justify-center w-12 h-12 transition-all border rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white hover:text-midnight active:scale-90">
                <Share2 size={20} />
              </button>
            </div>

            {/* Ícone de Tipo (Vídeo/Reels) */}
            {midia.tipo !== "FOTO" && (
              <div className="absolute top-6 right-6 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white">
                <PlayCircle size={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Toolbar Minimalista */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
         <div className="flex items-center gap-2 p-2 rounded-[2rem] shadow-2xl backdrop-blur-2xl" style={{ background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)" }}>
            <button 
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="px-8 py-4 text-[10px] font-black flex items-center gap-2 uppercase tracking-widest bg-brand-indigo text-white rounded-full hover:bg-white hover:text-midnight transition-all disabled:opacity-50"
            >
               {downloadingAll ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
               Baixar Tudo (.zip)
            </button>
         </div>
      </div>
    </div>
  );
};
