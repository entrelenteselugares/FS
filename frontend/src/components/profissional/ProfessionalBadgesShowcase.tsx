import React from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Camera, 
  Clock, 
  Award, 
  Gem, 
  Crown, 
  Lock,
  ChevronRight
} from "lucide-react";

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

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  ShieldCheck,
  Camera,
  Clock,
  Award,
  Gem,
  Crown
};

const tierStyles = {
  BRONZE: {
    border: "border-amber-700/30 group-hover:border-amber-600/60",
    text: "text-amber-500",
    bg: "bg-amber-950/10",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.05)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]",
    badgeLabel: "Bronze",
    gradient: "from-amber-600/20 via-amber-900/10 to-transparent",
    pillBg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  },
  SILVER: {
    border: "border-slate-500/30 group-hover:border-slate-400/60",
    text: "text-slate-300",
    bg: "bg-slate-900/10",
    glow: "shadow-[0_0_15px_rgba(203,213,225,0.05)] group-hover:shadow-[0_0_25px_rgba(203,213,225,0.15)]",
    badgeLabel: "Prata",
    gradient: "from-slate-400/20 via-slate-700/10 to-transparent",
    pillBg: "bg-slate-300/10 text-slate-300 border border-slate-300/20",
  },
  GOLD: {
    border: "border-yellow-600/30 group-hover:border-yellow-500/60",
    text: "text-yellow-500",
    bg: "bg-yellow-950/10",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.08)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.25)]",
    badgeLabel: "Ouro",
    gradient: "from-yellow-500/20 via-yellow-800/10 to-transparent",
    pillBg: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  },
  DIAMOND: {
    border: "border-cyan-500/30 group-hover:border-purple-500/60",
    text: "text-cyan-400 group-hover:text-purple-400 transition-colors duration-500",
    bg: "bg-cyan-950/10",
    glow: "shadow-[0_0_25px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]",
    badgeLabel: "Elite",
    gradient: "from-cyan-500/20 via-purple-900/10 to-transparent",
    pillBg: "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20",
  }
};

export const ProfessionalBadgesShowcase: React.FC<ProfessionalBadgesShowcaseProps> = ({ badges = [] }) => {
  if (!badges || badges.length === 0) return null;

  const unlockedCount = badges.filter(b => b.status === "UNLOCKED").length;

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Header section with Premium design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tight">
              Galeria de Conquistas
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-brand-tactical/15 text-brand-tactical border border-brand-tactical/35 tracking-widest rounded">
              FASE 2
            </span>
          </div>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.25em] italic font-black">
            Seu portfólio de alta fidelidade e sinais de confiança na vitrine
          </p>
        </div>

        {/* Progress Ring and count */}
        <div className="flex items-center gap-3 bg-theme-bg border border-theme-border px-4 py-2 rounded-lg">
          <div className="space-y-0.5 text-right">
            <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest">
              Medalhas Ativas
            </p>
            <p className="text-sm font-heading font-black text-theme-text italic">
              {unlockedCount} de {badges.length} Desbloqueadas
            </p>
          </div>
          <div className="w-9 h-9 relative flex items-center justify-center bg-slate-950 border border-theme-border rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 bg-brand-tactical/20 transition-all duration-700" 
              style={{ height: `${(unlockedCount / badges.length) * 100}%`, bottom: 0, top: 'auto' }}
            />
            <span className="relative z-10 text-xs font-heading font-black text-brand-tactical">
              {Math.round((unlockedCount / badges.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {badges.map((badge, idx) => {
          const isUnlocked = badge.status === "UNLOCKED";
          const styles = tierStyles[badge.tier] || tierStyles.BRONZE;
          const BadgeIcon = iconMap[badge.icon] || Award;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              className={`group relative rounded-xl border bg-gradient-to-br ${styles.gradient} bg-slate-950/60 backdrop-blur-md p-5 transition-all duration-300 ${styles.border} ${styles.glow} overflow-hidden`}
            >
              {/* Status Ribbon overlay */}
              {!isUnlocked && (
                <div className="absolute top-0 right-0 p-1.5 opacity-60">
                  <Lock size={12} className="text-theme-muted" />
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon Container with glowing effect */}
                <div 
                  className={`relative p-3 rounded-lg border transition-all duration-500 shrink-0 ${
                    isUnlocked 
                      ? `${styles.bg} ${styles.border} ${styles.text} shadow-[0_0_15px_rgba(255,255,255,0.05)]` 
                      : "bg-slate-900/40 border-slate-800/40 text-slate-600 grayscale"
                  }`}
                >
                  <BadgeIcon className="relative z-10" size={24} />
                  
                  {/* Subtle inner animated ring for unlocked diamond/gold tiers */}
                  {isUnlocked && (badge.tier === "DIAMOND" || badge.tier === "GOLD") && (
                    <span className="absolute inset-0 rounded-lg border border-current opacity-20 animate-ping" />
                  )}
                </div>

                {/* Badge Meta details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className={`text-sm font-heading font-black tracking-tight uppercase italic truncate ${isUnlocked ? 'text-theme-text' : 'text-theme-muted'}`}>
                      {badge.name}
                    </h4>
                    <span className={`px-1.5 py-0.25 text-[7px] font-black uppercase tracking-widest rounded ${styles.pillBg}`}>
                      {styles.badgeLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-theme-muted leading-relaxed line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Indicator for Locked Badge */}
              {!isUnlocked && badge.progress && (
                <div className="mt-4 pt-3 border-t border-slate-900/60 space-y-1.5">
                  <div className="flex justify-between text-[8px] font-black text-theme-muted uppercase tracking-wider">
                    <span>Progresso de Desbloqueio</span>
                    <span>
                      {badge.tier === "SILVER" && badge.id === "tech_master" 
                        ? `R$ ${badge.progress.current.toLocaleString("pt-BR")} / R$ ${badge.progress.target.toLocaleString("pt-BR")}`
                        : badge.id === "mestre_do_tempo" && badge.progress.current === 5 && badge.progress.percentage < 100
                        ? "SLA Lento (>24h)"
                        : `${badge.progress.current} / ${badge.progress.target}`}
                    </span>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-900/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        badge.tier === "DIAMOND" 
                          ? "bg-gradient-to-r from-cyan-400 to-purple-500" 
                          : badge.tier === "GOLD"
                          ? "bg-yellow-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${badge.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Verified Visual Highlight for unlocked premium badges */}
              {isUnlocked && (
                <div className="mt-4 pt-2 border-t border-slate-900/40 flex items-center justify-between text-[8px] font-black tracking-wider uppercase">
                  <span className="text-brand-tactical flex items-center gap-1">
                    <ShieldCheck size={10} /> Ativo no Showcase
                  </span>
                  <span className="text-theme-muted group-hover:text-brand-tactical transition-colors duration-300 flex items-center gap-0.5">
                    Detalhes <ChevronRight size={8} />
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
