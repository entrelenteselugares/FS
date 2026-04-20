import { useState, useEffect, useCallback } from "react";
import { API as api } from "../../lib/api";
import { useTheme } from "../../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  Printer, 
  Truck, 
  Receipt, 
  BarChart3, 
  Settings,
  Package,
  Target,
  Clock
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  type: string;
  active: boolean;
  costPer10x15: number;
  printerCost: number | null;
  _count: { redemptions: number };
}

interface Breakeven {
  printerCost: number;
  costPerPhoto: string;
  photosToBreakeven: number;
  estimatedConcursos: number;
  packages: Array<{
    curtidas: number;
    photos: number;
    totalCost: string;
    costBreakdown: Record<string, string>;
  }>;
  scenarios: Array<{
    printerPrice: number;
    photosNeeded: number;
    monthsAt10PerMonth: number;
  }>;
}

export default function AdminSuppliers() {
  useTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breakeven, setBreakeven] = useState<Breakeven | null>(null);
  const [, setLoading] = useState(true);

  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id);
    setBreakeven(null);
    try {
      const { data } = await api.get(`/admin/suppliers/${id}/breakeven`);
      setBreakeven(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/suppliers");
      setSuppliers(data);
      if (data.length > 0) handleSelect(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [handleSelect]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);


  return (
    <div className="grid grid-cols-[320px_1fr] gap-10 p-8 pt-0 min-h-[calc(100vh-200px)]">
      
      {/* Sidebar List */}
      <div className="space-y-6 border-r border-theme-border pr-10">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-theme-muted flex items-center gap-3">
                <Printer size={14} className="text-brand-primary" />
                Hardware & Ativos
            </h3>
            <button className="p-2 ghost border border-theme-border/50 text-theme-muted hover:text-theme-text transition-colors">
                <Settings size={14} />
            </button>
        </div>

        <div className="flex flex-col gap-3">
          {suppliers.map(s => (
            <motion.button
              key={s.id}
              whileHover={{ x: 4 }}
              onClick={() => handleSelect(s.id)}
              className={`w-full p-6 text-left border transition-all duration-300 relative group
                ${selectedId === s.id 
                  ? "bg-theme-bg-muted border-brand-primary shadow-lg" 
                  : "bg-transparent border-theme-border hover:border-theme-text/20"}`}
            >
              <div className="flex flex-col">
                <span className={`text-[13px] font-bold tracking-tight mb-1 transition-colors ${selectedId === s.id ? "text-theme-text" : "text-theme-text/70"}`}>
                    {s.name}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-theme-muted">
                    {s.type === "OWN_PRINTER" ? "Ativo Local" : "Fulfillment Externo"}
                </span>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                        R$ {Number(s.costPer10x15).toFixed(2)}
                    </span>
                    <span className="text-[8px] text-theme-muted uppercase tracking-tighter">/ unid</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-theme-muted">
                    <Receipt size={10} />
                    <span>{s._count.redemptions} resg.</span>
                </div>
              </div>

              {selectedId === s.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute -right-[41px] top-1/2 -translate-y-1/2 w-[2px] h-12 bg-brand-primary shadow-[0_0_12px_rgba(133,185,172,0.8)]"
                  />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Analysis Workspace */}
      <AnimatePresence mode="wait">
        <motion.div 
           key={selectedId || 'none'}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
           className="space-y-10"
        >
          {!selectedId ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-theme-border p-20 text-center space-y-4">
              <Calculator size={48} className="text-theme-border" strokeWidth={1} />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-theme-muted">
                Selecione um ativo para análise de ROI
              </p>
            </div>
          ) : !breakeven ? (
            <div className="p-20 text-center animate-pulse">
                <div className="h-4 w-48 bg-theme-border/50 mx-auto rounded mb-4" />
                <div className="h-4 w-32 bg-theme-border/30 mx-auto rounded" />
            </div>
          ) : (
            <>
              {/* Financial Stats */}
              <div className="grid grid-cols-3 gap-6">
                <StatsCard 
                    icon={<Calculator size={18} />} 
                    label="Operacional Unitário" 
                    value={`R$ ${breakeven.costPerPhoto}`} 
                    sub="Papel + Tinta + Embalagem + Frete" 
                />
                <StatsCard 
                    icon={<Printer size={18} />} 
                    label="Equipamento" 
                    value={`R$ ${breakeven.printerCost.toFixed(2)}`} 
                    sub="CAPEX — Investimento Inicial" 
                />
                <StatsCard 
                    icon={<Target size={18} />} 
                    label="Análise de Amortização" 
                    value={`${breakeven.photosToBreakeven}`} 
                    suffix="fotos"
                    sub={`Aprox. ${breakeven.estimatedConcursos} concursos`} 
                    variant="accent"
                />
              </div>

              {/* Gamification Costs */}
              <div className="glass-card p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/[0.02] pointer-events-none transform rotate-12 translate-x-1/4 -translate-y-1/4">
                    <BarChart3 size={240} />
                </div>
                
                <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-theme-muted mb-10 flex items-center gap-4">
                  <span className="w-8 h-px bg-brand-primary/40" />
                  Custos por Patamar de Gamificação
                </h4>
                
                <div className="grid grid-cols-3 gap-8 relative z-10">
                  {breakeven.packages.map(p => (
                    <div key={p.curtidas} className="p-8 border border-theme-border bg-theme-bg h-full flex flex-col justify-between hover:border-brand-primary/50 transition-colors cursor-default">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary mb-4">
                            <span className="w-4 h-px bg-brand-primary" />
                            {p.curtidas} Curtidas
                        </div>
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-4xl font-black font-sans text-theme-text leading-none">{p.photos}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Arquivos</span>
                        </div>
                        
                        <div className="space-y-3.5 mb-10">
                          <DataLine icon={<Printer size={12} />} label="Impressão" value={`R$ ${p.costBreakdown.impressao}`} />
                          <DataLine icon={<Package size={12} />} label="Embalagem" value={`R$ ${p.costBreakdown.embalagem}`} />
                          <DataLine icon={<Truck size={12} />} label="Logística" value={`R$ ${p.costBreakdown.frete}`} />
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-theme-border flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted">Custo Total</span>
                        <span className="text-lg font-black text-theme-text">R$ {p.totalCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI Simulator */}
              <div className="glass-card p-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-theme-muted flex items-center gap-4">
                          <span className="w-8 h-px bg-theme-border" />
                          Simulador Prospectivo de ROI
                        </h4>
                        <p className="text-[10px] text-theme-muted uppercase tracking-[0.2em] font-medium ml-12">Projeção baseada em taxa de conversão orgânica</p>
                    </div>
                    <BarChart3 className="text-theme-muted opacity-30" size={24} />
                </div>
                
                <div className="overflow-hidden border border-theme-border">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-theme-bg-muted/50 text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted">
                          <th className="p-6 border-r border-theme-border">Investimento Ativo</th>
                          <th className="p-6 border-r border-theme-border text-center">Volume Amortização</th>
                          <th className="p-6">Projeção Temporal (10/mês)</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] font-bold tracking-tight">
                        {breakeven.scenarios.map(s => (
                          <tr key={s.printerPrice} className="border-t border-theme-border hover:bg-theme-bg-muted/20 transition-colors">
                            <td className="p-6 border-r border-theme-border text-theme-text">
                                <span className="text-[10px] text-theme-muted font-medium uppercase tracking-widest mr-3">CAPEX:</span>
                                R$ {s.printerPrice.toFixed(2)}
                            </td>
                            <td className="p-6 border-r border-theme-border text-center">
                                <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-4 py-1 flex items-center gap-2 justify-center w-fit mx-auto">
                                    <Target size={12} />
                                    {s.photosNeeded} FOTOS
                                </span>
                            </td>
                            <td className="p-6 text-theme-muted flex items-center gap-3">
                                <Clock size={16} strokeWidth={1.5} className="text-brand-primary" />
                                <span>{s.monthsAt10PerMonth} Meses Estimados</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatsCard({ icon, label, value, sub, suffix, variant = "default" }: { icon: React.ReactNode, label: string; value: string; sub: string; suffix?: string; variant?: "default" | "accent" }) {
  return (
    <div className={`p-8 border relative overflow-hidden transition-all duration-700
        ${variant === "accent" 
            ? "bg-brand-primary/5 border-brand-primary shadow-2xl" 
            : "bg-theme-bg-muted border-theme-border hover:border-theme-text/20"}`}>
      <div className={`absolute top-0 right-0 p-4 transition-transform duration-700 group-hover:scale-125
        ${variant === "accent" ? "text-brand-primary/20" : "text-theme-muted/10"}`}>
          {icon}
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.45em] text-theme-muted mb-4 flex items-center gap-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3 mb-2">
          <p className={`text-4xl font-black font-sans tracking-tight leading-none
            ${variant === "accent" ? "text-brand-primary" : "text-theme-text"}`}>
            {value}
          </p>
          {suffix && <span className={`text-[10px] font-black uppercase tracking-[0.2em] font-sans ${variant === "accent" ? "text-brand-primary" : "text-theme-muted"}`}>{suffix}</span>}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-theme-muted/60">{sub}</p>
    </div>
  );
}

function DataLine({ icon, label, value }: { icon: React.ReactNode, label: string; value: string }) {
  return (
    <div className="flex justify-between items-center group/line">
      <div className="flex items-center gap-3">
          <span className="text-theme-muted transition-colors group-hover/line:text-brand-primary">{icon}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-theme-muted/50">{label}</span>
      </div>
      <span className="text-[11px] font-bold text-theme-text whitespace-nowrap">{value}</span>
    </div>
  );
}

