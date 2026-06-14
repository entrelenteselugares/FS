import React, { useState } from "react";
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

// Quando houverem novas ferramentas, basta alterar a versão (ex: v2, v3) 
// para o tour ser exibido novamente para todos os usuários.
const TOUR_VERSION = "v1";

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
    try {
      const hasSeen = localStorage.getItem(`fs_tour_${TOUR_VERSION}_${role}`);
      return !hasSeen && (TOUR_DATA[role] || []).length > 0;
    } catch {
      return false; // Previne loops no iframe/incognito restrito
    }
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(`fs_tour_${TOUR_VERSION}_${role}`, "true");
    } catch (e) {
      console.warn("Could not save tour state", e);
    }
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
                <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.3em]">Passo {currentStep + 1} de {steps.length}</p>
                <h3 className="text-2xl font-heading font-bold text-theme-text uppercase">{step.title}</h3>
              </div>
              <button onClick={handleComplete} className="text-theme-muted hover:text-theme-text transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-theme-muted text-sm leading-relaxed">
              {step.description}
            </p>
            
            <div className="pt-4 flex items-center justify-between">
              <button onClick={handleComplete} className="text-[10px] font-bold text-theme-muted uppercase tracking-widest hover:text-theme-text transition-colors">
                Pular Tour
              </button>
              
              <button 
                onClick={handleNext} 
                className="fs-btn bg-brand-tactical text-theme-text flex items-center gap-3 px-6 py-3"
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
