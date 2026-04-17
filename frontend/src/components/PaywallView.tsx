import React from "react";
import type { EventData } from "../api";

interface PaywallViewProps {
  event: EventData;
  onCheckout: () => void;
  isProcessing: boolean;
}

// Icons as pure SVGs to avoid Lucide/React 19 conflicts
const LockIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export const PaywallView: React.FC<PaywallViewProps> = ({ event, onCheckout, isProcessing }) => {
  const coverPhotoUrl = event?.coverPhotoUrl;
  const eventDate = event?.dataEvento ? new Date(event.dataEvento) : new Date();
  const now = new Date();
  const preco = now < eventDate ? 190 : 200;

  return (
    <div className="relative min-h-screen animate-fade-in overflow-hidden bg-black">
      {/* Imagem de Capa Fullscreen */}
      {coverPhotoUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110 motion-safe:scale-100 opacity-60" 
          style={{ backgroundImage: `url(${coverPhotoUrl})` }}
        />
      )}
      
      {/* Overlay Gradiente de Luxo */}
      <div className="absolute inset-0 luxury-gradient" />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-white/5 backdrop-blur-md border-white/10 animate-slide-up">
          <LockIcon className="text-brand-indigo" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Galeria Exclusiva</span>
        </div>

        <h1 className="mb-4 text-5xl font-black italic tracking-tighter uppercase md:text-8xl animate-slide-up [text-shadow:_0_10px_30px_rgb(0_0_0_/_80%)]">
          {event?.nomeNoivos || "Evento Premium"}
        </h1>
        
        <p className="max-w-md mb-12 text-sm font-medium italic leading-relaxed text-zinc-400 animate-slide-up">
          Reviva cada detalhe desta celebração inesquecível. Suas memórias digitais estão protegidas e aguardando serem reveladas.
        </p>
      </div>

      {/* Diferenciais */}
      <div className="absolute left-0 right-0 z-10 hidden bottom-32 md:flex justify-center gap-8 px-6 animate-slide-up">
        {["Alta Resolução", "Acesso Vitalício", "Entrega Digital Instantânea"].map((item) => (
          <div key={item} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
            <SparklesIcon className="text-brand-indigo" />
            {item}
          </div>
        ))}
      </div>

      {/* Botão Sticky Mobile-First */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-lg mx-auto overflow-hidden shadow-2xl rounded-3xl glow-indigo border border-white/5 bg-midnight-card/80 backdrop-blur-2xl">
          <div className="flex items-center justify-between p-6 md:p-8">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">Acesso Premium</span>
              <div className="text-3xl font-black italic tracking-tighter text-white">R$ {preco.toFixed(2)}</div>
            </div>
            
            <button
              onClick={onCheckout}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-5 text-xs font-black tracking-widest uppercase transition-all bg-white rounded-2xl text-midnight hover:bg-brand-indigo hover:text-white active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? "Processando..." : "Desbloquear Galeria"}
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
