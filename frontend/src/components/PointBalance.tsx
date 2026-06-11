import { useState, useEffect } from "react";
import { API as api } from "../lib/api";
import { useTheme } from "../contexts/ThemeContextCore";
import { motion } from "framer-motion";
import { Award, Star, TrendingUp, Info } from "lucide-react";

interface PointsData {
  total: number;
  available: number;
  redeemed: number;
  packages: Array<{
    name: string;
    points: number;
    quantity: number;
    key: string;
    available: boolean;
    pointsNeeded: number;
  }>;
}

export default function PointBalance() {
  useTheme();
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/me/points")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-[280px] glass-card flex flex-col p-8 gap-6 animate-pulse">
        <div className="h-12 w-1/2 bg-theme-border/50" />
        <div className="space-y-4">
            <div className="h-6 w-full bg-theme-border/20" />
            <div className="h-6 w-full bg-theme-border/20" />
            <div className="h-6 w-full bg-theme-border/20" />
        </div>
    </div>
  );
  
  if (!data) return null;

  return (
    <div className="glass-card p-8 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 text-brand-olive/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Award size={120} strokeWidth={1} />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-[0.4em] flex items-center gap-2">
            <Star size={10} className="text-brand-olive" />
            Saldo de Recompensas
          </p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-bold uppercase text-theme-text font-sans">
                {data.available}
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-olive">Pontos</span>
          </div>
        </div>
        <div className="text-right space-y-1 mt-2">
          <div className="flex items-center justify-end gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-theme-muted">
              <span>Acumulado:</span>
              <span className="text-theme-text">{data.total}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-theme-muted">
              <span>Resgatado:</span>
              <span className="text-theme-text">{data.redeemed}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6 relative z-10 mb-8">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-theme-muted mb-4 border-b border-theme-border pb-2">
            <TrendingUp size={12} />
            Próximos Resgates
        </div>
        {data.packages.map(pkg => (
          <div key={pkg.key} className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className={pkg.available ? "text-theme-text" : "text-theme-muted"}>
                {pkg.name}
              </span>
              <span className={pkg.available ? "text-brand-olive" : "text-theme-muted opacity-60"}>
                {pkg.available ? "✓ Disponível para Resgate" : `Faltam ${pkg.pointsNeeded} PTs`}
              </span>
            </div>
            <div className="h-1 bg-theme-border/30 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (data.available / pkg.points) * 100)}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full ${pkg.available ? "bg-brand-olive" : "bg-theme-muted/40"}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-theme-bg-muted border border-theme-border p-4 flex gap-4">
        <Info size={18} className="text-brand-olive shrink-0" strokeWidth={1.5} />
        <p className="text-[10px] text-theme-muted font-bold uppercase leading-relaxed tracking-wider">
          Ganhe <span className="text-brand-olive font-bold">1 ponto</span> a cada curtida recebida em suas fotos públicas na vitrine do Coletivo. Use seus pontos para resgatar pacotes de mídia ou assinaturas.
        </p>
      </div>

      {/* Glossy top highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

