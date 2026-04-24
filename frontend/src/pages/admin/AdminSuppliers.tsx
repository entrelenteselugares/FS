import { useState, useEffect, useCallback } from "react";
import { API as api } from "../../lib/api";
import { 
  Calculator, 
  Printer, 
  BarChart3, 
  Settings,
  Target,
  Clock
} from "lucide-react";
import { T } from "../../lib/theme";

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
    <div className="grid grid-cols-[240px_1fr] gap-4 p-4 pt-0 min-h-[calc(100vh-100px)]">
      
      {/* Sidebar List */}
      <div className="space-y-4 border-r border-theme-border pr-4">
        <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: T.text3, display: "flex", alignItems: "center", gap: 8 }}>
                <Printer size={12} style={{ color: T.brand }} />
                Hardware & Ativos
            </h3>
            <button style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.text3, padding: 4, cursor: "pointer" }}>
                <Settings size={12} />
            </button>
        </div>

        <div className="flex flex-col gap-3">
          {suppliers.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              style={{ 
                width: "100%", padding: "12px", border: `1px solid ${selectedId === s.id ? T.brand : T.border}`,
                background: selectedId === s.id ? `${T.brand}10` : "transparent",
                textAlign: "left", cursor: "pointer", position: "relative", transition: "all 0.2s"
              }}
            >
              <div className="flex flex-col">
                <span style={{ fontSize: 11, fontWeight: 900, color: selectedId === s.id ? T.text : T.text2, textTransform: "uppercase", letterSpacing: -0.2 }}>
                    {s.name}
                </span>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: T.text3, marginTop: 2 }}>
                    {s.type === "OWN_PRINTER" ? "Ativo Local" : "Fulfillment"}
                </span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: 9, fontWeight: 900, color: T.brand, textTransform: "uppercase" }}>
                        R$ {Number(s.costPer10x15).toFixed(2)}
                    </span>
                </div>
                <div style={{ fontSize: 8, color: T.text3, fontWeight: 700, textTransform: "uppercase" }}>
                    {s._count.redemptions} RESG.
                </div>
              </div>

              {selectedId === s.id && (
                  <div 
                    style={{ position: "absolute", right: -4, top: "20%", height: "60%", width: 2, background: T.brand, boxShadow: `0 0 10px ${T.brand}` }}
                  />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Workspace */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    value={`R$ ${Number(breakeven.printerCost).toFixed(2)}`} 
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
              <div style={{ border: `1px solid ${T.border}`, padding: "20px", background: `${T.bgCard}44` }}>
                <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4em", color: T.text3, marginBottom: 16 }}>
                  Custos por Patamar de Gamificação
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  {breakeven.packages.map(p => (
                    <div key={p.curtidas} style={{ padding: "16px", border: `1px solid ${T.border}`, background: T.bgCard }}>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-primary mb-4">
                          {p.curtidas} Curtidas
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                          <span style={{ fontSize: 24, fontWeight: 900, color: T.text }}>{p.photos}</span>
                          <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", color: T.text3 }}>Fotos</span>
                      </div>
                      <div className="pt-4 border-t border-theme-border flex justify-between items-center">
                        <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", color: T.text3 }}>Total</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: T.text }}>R$ {p.totalCost}</span>
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
                                R$ {Number(s.printerPrice).toFixed(2)}
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
        </div>
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
