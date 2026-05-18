import { List, Calendar as CalendarIcon, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  activeTab: string;
  viewTab: "lista" | "calendario";
  onViewTabChange: (tab: "lista" | "calendario") => void;
  residentUnits?: string[];
  isVerified?: boolean;
}

export function DashboardHeader({ activeTab, viewTab, onViewTabChange, residentUnits = [], isVerified = false }: DashboardHeaderProps) {
  const getTitle = () => {
    switch (activeTab) {
      case "agenda": return "Meu Cockpit";
      case "convites": return "Central de Convites";
      case "financeiro": return "Fluxo de Caixa";
      case "network": return "Rede Tática de Conexões";
      default: return "Gestão de Ativos";
    }
  };

  return (
    <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none whitespace-normal sm:whitespace-nowrap">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            {residentUnits.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-brand-tactical" />
                <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
                  Residente: {residentUnits.join(", ")}
                </p>
              </div>
            )}
            {isVerified && (
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full animate-pulse">
                <ShieldCheck size={12} className="text-brand-tactical" />
                <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">
                  PRO VERIFICADO
                </p>
              </div>
            )}
          </div>
        </div>
        
        {(activeTab === "agenda" || activeTab === "convites") && (
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button
              onClick={() => onViewTabChange("lista")}
              className={`px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${viewTab === "lista" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"} flex-1 md:flex-none whitespace-nowrap`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => onViewTabChange("calendario")}
              className={`px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${viewTab === "calendario" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"} flex-1 md:flex-none whitespace-nowrap`}
            >
              <CalendarIcon size={14} /> Calendário
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
