import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, AlertCircle } from "lucide-react";

import type { AuthUser } from "../contexts/AuthContextBase";
import { calculateProfileCompleteness } from "../utils/profile";

interface ProfissionalProfile {
  pixKey?: string | null;
  experienceYears?: number;
  firstJobUrl?: string | null;
  services?: string[];
  equipmentList?: string[];
}

interface ProfileStepperProps {
  user: AuthUser | null;
  profile: ProfissionalProfile | null;
}

export const ProfileStepper: React.FC<ProfileStepperProps> = ({ user, profile }) => {
  const { steps, percentage } = useMemo(() => {
    return calculateProfileCompleteness(user, profile);
  }, [user, profile]);

  const nextStep = steps.find(s => !s.done);

  return (
    <div className="lux-card p-6 border-l-4 border-l-brand-tactical bg-theme-bg overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Trophy size={80} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h3 className="text-xl font-heading font-bold text-theme-text uppercase">Status do Perfil</h3>
             <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${percentage === 100 ? 'bg-brand-tactical text-brand-text' : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'}`}>
               {percentage === 100 ? "PRONTO PARA MISSÕES" : "PERFIL INCOMPLETO"}
             </span>
          </div>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.3em] font-bold">Ganhe visibilidade completando seus dados técnicos</p>
        </div>

        <div className="flex items-center gap-6">
           <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-theme-border/20"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray="213.6"
                  initial={{ strokeDashoffset: 213.6 }}
                  animate={{ strokeDashoffset: 213.6 - (213.6 * percentage) / 100 }}
                  className="text-brand-tactical"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-xl font-heading font-bold text-theme-text">{percentage}%</span>
              </div>
           </div>

           <div className="hidden md:block h-12 w-px bg-theme-border/30" />

           {nextStep ? (
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Próximo Passo:</p>
                <div className="flex items-center gap-2 text-brand-tactical">
                   <AlertCircle size={14} />
                   <p className="text-[11px] font-bold uppercase">{nextStep.label}</p>
                </div>
             </div>
           ) : (
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Recompensa Ativa:</p>
                <div className="flex items-center gap-2 text-brand-tactical">
                   <Star size={14} fill="currentColor" />
                   <p className="text-[11px] font-bold uppercase">Prioridade na Vitrine</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Progress Bar Grid (Mobile View) */}
      <div className="mt-8 grid grid-cols-9 gap-1 h-1.5">
        {steps.map((s, i) => (
          <div 
            key={i} 
            title={s.label}
            className={`h-full transition-all duration-500 ${s.done ? 'bg-brand-tactical shadow-[0_0_10px_rgba(133,185,172,0.3)]' : 'bg-theme-border/20'}`} 
          />
        ))}
      </div>
    </div>
  );
};
