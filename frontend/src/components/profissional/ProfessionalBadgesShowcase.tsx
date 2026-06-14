import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export interface BadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
  status: "UNLOCKED" | "LOCKED";
  progress: BadgeProgress;
}

interface ProfessionalBadgesShowcaseProps {
  badges?: Badge[];
}

const badgeImages: Record<string, string> = {
  Aperture: "/assets/badges/foco_bronze_medal.png",
  Camera: "/assets/badges/lente_prata_medal.png",
  Timer: "/assets/badges/obturador_ouro_medal.png",
  Clapperboard: "/assets/badges/claquete_ouro_medal.png",
  Video: "/assets/badges/gimbal_diamante_medal.png",
  Projector: "/assets/badges/camera_cinema_medal.png"
};

const tierStyles = {
  BRONZE: {
    glowColor: "rgba(245, 158, 11, 0.3)",
    textGradient: "from-amber-400 to-amber-700",
    borderGlow: "group-hover:border-amber-600/50 group-hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]",
  },
  SILVER: {
    glowColor: "rgba(148, 163, 184, 0.4)",
    textGradient: "from-slate-300 to-slate-500",
    borderGlow: "group-hover:border-cyan-400/50 group-hover:shadow-[inset_0_0_30px_rgba(34,211,238,0.15)]",
  },
  GOLD: {
    glowColor: "rgba(234, 179, 8, 0.4)",
    textGradient: "from-yellow-300 to-yellow-600",
    borderGlow: "group-hover:border-yellow-500/50 group-hover:shadow-[inset_0_0_30px_rgba(234,179,8,0.2)]",
  },
  DIAMOND: {
    glowColor: "rgba(34, 211, 238, 0.5)",
    textGradient: "from-cyan-300 to-purple-500",
    borderGlow: "group-hover:border-cyan-500/50 group-hover:shadow-[inset_0_0_40px_rgba(34,211,238,0.3)]",
  }
};

export const ProfessionalBadgesShowcase: React.FC<ProfessionalBadgesShowcaseProps> = ({ badges = [] }) => {
  if (!badges || badges.length === 0) return null;

  const unlockedCount = badges.filter(b => b.status === "UNLOCKED").length;

  return (
    <div className="space-y-6 relative overflow-hidden bg-theme-bg-muted/30 p-6 sm:p-8 rounded-2xl border border-theme-border shadow-lg">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-2xl font-heading font-bold text-theme-text uppercase">
              Galeria de Conquistas
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-theme-bg border border-theme-border text-theme-muted tracking-widest rounded">
              FASE 2
            </span>
          </div>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.25em] font-bold">
            Seu portfólio de alta fidelidade e sinais de confiança na vitrine
          </p>
        </div>

        {/* Progress Display */}
        <div className="flex items-center gap-4 bg-theme-bg-muted border border-theme-border px-5 py-3 rounded-xl shadow-inner">
          <div className="space-y-0.5 text-right">
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">
              Medalhas Ativas
            </p>
            <p className="text-base font-heading font-bold text-theme-text">
              {unlockedCount} de {badges.length} Desbloqueadas
            </p>
          </div>
          <div className="w-10 h-10 relative flex items-center justify-center bg-theme-bg border border-theme-border rounded-full overflow-hidden shadow-inner">
            <div 
              className="absolute inset-0 bg-brand-tactical/20 transition-all duration-700" 
              style={{ height: `${(unlockedCount / badges.length) * 100}%`, bottom: 0, top: 'auto' }}
            />
            <span className="relative z-10 text-xs font-heading font-bold text-brand-tactical drop-shadow-md">
              {Math.round((unlockedCount / badges.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Badges Display Case Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-theme-bg p-3 sm:p-6 rounded-xl border border-theme-border shadow-inner">
        {badges.map((badge, idx) => {
          const isUnlocked = badge.status === "UNLOCKED";
          const styles = tierStyles[badge.tier] || tierStyles.BRONZE;
          const imageUrl = badgeImages[badge.icon];

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`group relative flex flex-col items-center justify-between rounded-xl bg-theme-bg-muted border border-theme-border p-2 sm:p-6 transition-all duration-500 ${styles.borderGlow} h-full min-h-[140px] sm:min-h-[220px] overflow-hidden shadow-sm`}
            >
              {/* Background ambient light */}
              {isUnlocked && (
                <div 
                  className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 mix-blend-screen pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${styles.glowColor} 0%, transparent 70%)`
                  }}
                />
              )}

              {/* Status Ribbon overlay */}
              {!isUnlocked && (
                <div className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 opacity-40">
                  <Lock size={12} className="text-theme-muted w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              )}

              {/* Header Title & Progress */}
              <div className="text-center z-10 space-y-0.5 mt-1 sm:mt-2">
                <h4 className={`text-[10px] sm:text-sm font-heading font-black tracking-widest uppercase leading-tight ${isUnlocked ? 'text-theme-text' : 'text-theme-muted'}`}>
                  {badge.name}
                </h4>
                {badge.progress && (
                  <p className={`text-[9px] sm:text-[10px] font-bold tracking-widest ${isUnlocked ? 'text-theme-text-muted' : 'text-theme-muted/50'}`}>
                    {badge.tier === "SILVER" && badge.id === "tech_master" 
                        ? `R$ ${(badge.progress.current/1000).toFixed(0)}K / ${(badge.progress.target/1000).toFixed(0)}K`
                        : `${badge.progress.current} / ${badge.progress.target}`}
                  </p>
                )}
              </div>

              {/* Central 3D Image */}
              <div className={`relative flex-1 flex items-center justify-center w-full my-1 sm:my-2 transition-all duration-700 ${isUnlocked ? 'scale-110 drop-shadow-[0_0_25px_rgba(255,255,255,0.05)]' : 'opacity-40 grayscale contrast-125 brightness-75 scale-95'}`}>
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={badge.name} 
                    className="w-16 h-16 sm:w-32 sm:h-32 object-contain drop-shadow-2xl mix-blend-screen"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-theme-border flex items-center justify-center">
                    <span className="text-theme-muted text-[10px] sm:text-xs uppercase font-bold text-center">Sem<br/>Imagem</span>
                  </div>
                )}
              </div>
              
              {/* Footer Description */}
              <div className="z-10 text-center w-full mt-auto pb-1">
                <p className={`text-[6px] sm:text-[10px] uppercase tracking-widest font-black leading-tight ${isUnlocked ? 'text-theme-text-muted' : 'text-theme-muted/50'}`}>
                  {badge.description.split(':')[0]}
                </p>
              </div>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
