import React from "react";

interface DeliveryViewProps {
  event: any;
}

const ExternalLinkIcon = () => (
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);

const PhotoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

const VideoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);

export const DeliveryView: React.FC<DeliveryViewProps> = ({ event }) => {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 py-12 animate-fade-in relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-indigo/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border rounded-full bg-brand-emerald/10 border-brand-emerald/20 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-emerald">Pagamento Aprovado</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-4 animate-slide-up">
          Suas Memórias Estão Prontas
        </h1>
        
        <p className="text-zinc-400 text-sm leading-relaxed mb-12 animate-slide-up max-w-sm mx-auto">
          Obrigado por confiar no Foto Segundo. Acesse agora seus arquivos em alta resolução através dos nossos parceiros de entrega.
        </p>

        <div className="grid gap-4 animate-slide-up">
          {/* Botão Lightroom */}
          <a 
            href={event.lightroomUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-6 bg-brand-indigo/10 hover:bg-brand-indigo/20 border border-brand-indigo/20 hover:border-brand-indigo/40 rounded-3xl transition-all duration-300"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-brand-indigo flex items-center justify-center text-white shadow-xl glow-indigo">
                <PhotoIcon />
              </div>
              <div>
                <div className="text-white font-black uppercase tracking-widest text-xs">Álbum de Fotos</div>
                <div className="text-zinc-500 text-[10px]">Adobe Lightroom Gallery</div>
              </div>
            </div>
            <ExternalLinkIcon />
          </a>

          {/* Botão Google Drive */}
          <a 
            href={event.driveUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-6 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-3xl transition-all duration-300"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald flex items-center justify-center text-white shadow-xl">
                <VideoIcon />
              </div>
              <div>
                <div className="text-white font-black uppercase tracking-widest text-xs">Vídeos & Matérias</div>
                <div className="text-zinc-500 text-[10px]">Google Drive Folder</div>
              </div>
            </div>
            <ExternalLinkIcon />
          </a>
        </div>

        <button 
          onClick={() => window.print()}
          className="mt-12 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
        >
          Baixar Comprovante de Liberação
        </button>
      </div>
    </div>
  );
};
