import React from "react";
import type { EventData } from "../api";
import { motion } from "framer-motion";

interface PaywallViewProps {
  event: EventData;
  onCheckout: () => void;
  isProcessing: boolean;
}

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="0" ry="0"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export const PaywallView: React.FC<PaywallViewProps> = ({ event, onCheckout, isProcessing }) => {
  const coverPhotoUrl = event?.coverPhotoUrl;
  const eventDate = event?.dataEvento ? new Date(event.dataEvento) : new Date();
  eventDate.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const isAdvancePurchase = now < eventDate;
  const preco = isAdvancePurchase ? 190 : 200;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      {/* Editorial Background */}
      <div className="absolute inset-0 z-0">
        {coverPhotoUrl && (
          <motion.div 
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center grayscale" 
            style={{ backgroundImage: `url(${coverPhotoUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505]" />
      </div>
      
      {/* Header / Logo */}
      <nav className="absolute top-0 w-full z-50 px-10 py-10 flex justify-between items-center pointer-events-none">
        <img src="/assets/logo.png" alt="Foto Segundo" className="h-8 w-auto invert brightness-0 opacity-50" />
      </nav>

      {/* Conteúdo Central Editorial */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20 pb-40">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 mb-16"
        >
          <div className="w-[1px] h-12 bg-white/20" />
          <div className="flex items-center gap-3 text-brand-olive">
            <LockIcon />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Private Gallery Protocol</span>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-6xl md:text-9xl font-serif tracking-tight text-white leading-tight"
        >
          {event?.nomeNoivos || "Evento Premium"}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xl mb-20 text-zinc-500 text-sm md:text-base font-light uppercase tracking-[0.3em] leading-relaxed"
        >
          Acesso exclusivo às memórias digitais <br />
          Processadas e curadas pela equipe Foto Segundo.
        </motion.p>
      </div>

      {/* Floating Checkout Architecture */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto bg-[#0a0a0a] border border-white/10 p-1 flex flex-wrap md:flex-nowrap items-stretch"
        >
          {/* Price Section */}
          <div className="flex-1 p-10 flex flex-col justify-center border-r border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">Full Access License</span>
              {isAdvancePurchase && (
                <span className="text-[8px] font-bold uppercase tracking-widest text-brand-olive">Early Access Discount</span>
              )}
            </div>
            <div className="flex items-baseline gap-4">
               <span className="text-4xl font-serif text-white italic">R$ {preco.toFixed(2)}</span>
               {!isAdvancePurchase && <span className="text-xs text-zinc-700 line-through tracking-wider font-light">R$ 250.00</span>}
            </div>
          </div>

          {/* Action Section */}
          <button
            onClick={onCheckout}
            disabled={isProcessing}
            className="w-full md:w-80 bg-white text-black hover:bg-zinc-200 transition-all flex flex-col items-center justify-center p-10 gap-3 group"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
              {isProcessing ? "Processing" : "Unlock Archive"}
            </span>
            <div className="w-8 h-[1px] bg-black/20 group-hover:w-12 transition-all" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

