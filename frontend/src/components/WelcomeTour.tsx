import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector para dar highlight (opcional para simplicidade aqui)
}

interface WelcomeTourProps {
  role: string;
  onComplete: () => void;
}

const TOUR_DATA: Record<string, TourStep[]> = {
  PROFISSIONAL: [
    { title: "Bem-vindo ao Painel Profissional", description: "Aqui você gerencia suas coberturas, portfólio e ganhos." },
    { title: "Meus Eventos", description: "Acompanhe em tempo real as vendas e o engajamento dos seus álbuns." },
    { title: "Financeiro", description: "Solicite saques e veja o extrato detalhado de cada venda realizada." }
  ],
  CARTORIO: [
    { title: "Dashboard Unidade Fixa", description: "Sua unidade agora é digital. Gerencie o fluxo de clientes e impressões." },
    { title: "Live Print", description: "Monitore as fotos que estão sendo impressas em tempo real na sua unidade." },
    { title: "Relatórios", description: "Acompanhe o desempenho mensal e as metas de conversão." }
  ]
};

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ role, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = TOUR_DATA[role] || [];
  
  const [isVisible, setIsVisible] = useState(() => {
    const hasSeen = localStorage.getItem(`fs_tour_${role}`);
    return !hasSeen && (TOUR_DATA[role] || []).length > 0;
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`fs_tour_${role}`, "true");
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-zinc-950 border border-brand-tactical/30 overflow-hidden shadow-2xl"
        >
          <div className="h-1 bg-zinc-900 w-full">
            <motion.div 
              className="h-full bg-brand-tactical" 
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.3em]">Passo {currentStep + 1} de {steps.length}</p>
                <h3 className="text-2xl font-heading font-black text-white uppercase italic tracking-tighter">{step.title}</h3>
              </div>
              <button onClick={handleComplete} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-zinc-400 text-sm leading-relaxed italic">
              {step.description}
            </p>
            
            <div className="pt-4 flex items-center justify-between">
              <button onClick={handleComplete} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                Pular Tour
              </button>
              
              <button 
                onClick={handleNext} 
                className="fs-btn bg-brand-tactical text-black flex items-center gap-3 px-6 py-3"
              >
                {currentStep === steps.length - 1 ? "Começar Agora" : "Próximo"} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
