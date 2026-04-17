import React from "react";
import { Download, Share2, ImageIcon, PlayCircle } from "lucide-react";
import type { EventData } from "../api";

interface GalleryViewProps {
  event: EventData;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ event }) => {
  return (
    <div className="min-h-screen pt-24 pb-40 bg-midnight animate-fade-in">
      <header className="px-6 mb-16 text-center max-w-7xl mx-auto">
        <h2 className="mb-2 text-[10px] font-black uppercase tracking-[0.6em] text-brand-indigo">Galeria Desbloqueada</h2>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase md:text-6xl text-white">
          {event.nomeNoivos}
        </h1>
        <div className="flex items-center justify-center gap-4 mt-6">
           <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase border rounded-xl border-white/5 bg-white/5">
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
            className="relative overflow-hidden group rounded-[2.5rem] bg-midnight-card border border-white/5 transition-all duration-700 hover:scale-[1.02] shadow-2xl break-inside-avoid"
          >
            <img 
              src={midia.url} 
              alt={`Foto ${index + 1}`} 
              className="w-full h-auto transition-all duration-700 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Overlay com Ações */}
            <div className="absolute inset-0 transition-all duration-500 opacity-0 bg-black/40 group-hover:opacity-100 backdrop-blur-sm flex items-center justify-center gap-4">
              <button className="flex items-center justify-center w-12 h-12 transition-all bg-white rounded-2xl text-midnight hover:bg-brand-indigo hover:text-white active:scale-90">
                <Download size={20} />
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
         <div className="flex items-center gap-2 p-2 bg-midnight-card border border-white/10 rounded-[2rem] shadow-2xl backdrop-blur-2xl">
            <button className="px-8 py-4 text-[10px] font-black uppercase tracking-widest bg-brand-indigo text-white rounded-full hover:bg-white hover:text-midnight transition-all">
               Baixar Tudo (.zip)
            </button>
         </div>
      </div>
    </div>
  );
};
