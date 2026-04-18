import React from "react";
import { motion } from "framer-motion";

interface DeliveryViewProps {
  event: {
    nomeNoivos: string;
    lightroomUrl?: string | null;
    driveUrl?: string | null;
  };
}

const PhotoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="0" ry="0"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

const VideoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="0" ry="0"/></svg>
);

export const DeliveryView: React.FC<DeliveryViewProps> = ({ event }) => {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Editorial Watermark */}
      <img src="/assets/logo.png" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60vh] opacity-[0.02] pointer-events-none invert brightness-0" />
      
      <div className="absolute top-0 w-full p-10 flex justify-center">
         <img src="/assets/logo.png" alt="Foto Segundo" className="h-6 w-auto invert brightness-0 opacity-40" />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full text-center relative z-10"
      >
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="w-[1px] h-10 bg-brand-olive" />
          <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-olive">Digital Archive Unlocked</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-serif tracking-tight mb-8">
          Arquivos <br /><span className="italic text-zinc-600">Disponíveis.</span>
        </h1>
        
        <p className="text-zinc-600 text-sm md:text-base leading-relaxed mb-24 max-w-lg mx-auto uppercase tracking-[0.2em] font-light">
          A curadoria foi finalizada com sucesso. <br />
          Explore cada fragmento histórico desta celebração.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
          {/* Botão Lightroom */}
          <motion.a 
            href={event.lightroomUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-black p-16 flex flex-col items-center text-center hover:bg-white/[0.02] transition-all duration-700"
          >
            <div className="mb-10 text-zinc-700 group-hover:text-white transition-all">
              <PhotoIcon />
            </div>
            <h3 className="text-xl font-serif text-white mb-4 tracking-tight">Professional Gallery</h3>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em] mb-10">Adobe Cloud Experience</p>
            <div className="w-6 h-[1px] bg-zinc-800 group-hover:bg-brand-olive group-hover:w-16 transition-all" />
          </motion.a>

          {/* Botão Google Drive */}
          <motion.a 
            href={event.driveUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-black p-16 flex flex-col items-center text-center hover:bg-white/[0.02] transition-all duration-700"
          >
            <div className="mb-10 text-zinc-700 group-hover:text-white transition-all">
              <VideoIcon />
            </div>
            <h3 className="text-xl font-serif text-white mb-4 tracking-tight">Master Repository</h3>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em] mb-10">Google Cloud Master Assets</p>
            <div className="w-6 h-[1px] bg-zinc-800 group-hover:bg-brand-olive group-hover:w-16 transition-all" />
          </motion.a>
        </div>

        <div className="mt-24 flex flex-col items-center gap-6">
           <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-800 italic">Obrigado pela preferência</p>
           <button 
             onClick={() => window.print()}
             className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 hover:text-white border-b border-zinc-900 pb-1 transition-all"
           >
             Gerar Certificado Digital
           </button>
        </div>
      </motion.div>
    </div>
  );
};
