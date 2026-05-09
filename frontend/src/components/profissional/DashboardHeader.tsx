import { List, Calendar as CalendarIcon, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  activeTab: string;
  viewTab: "lista" | "calendario";
  onViewTabChange: (tab: "lista" | "calendario") => void;
  residentUnits?: string[];
}

export function DashboardHeader({ activeTab, viewTab, onViewTabChange, residentUnits = [] }: DashboardHeaderProps) {
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
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-theme-border/60 pb-10">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
          {getTitle()}
        </h1>
        <div className="flex items-center gap-4">
          <div className="h-1 w-12 bg-brand-tactical" />
          {residentUnits.length > 0 && (
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand-tactical" />
              <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">
                Residente: {residentUnits.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {(activeTab === "agenda" || activeTab === "convites") && (
        <div className="flex gap-4">
          <button
            onClick={() => onViewTabChange("lista")}
            className={`px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${viewTab === "lista" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"}`}
          >
            <List size={14} /> Lista
          </button>
          <button
            onClick={() => onViewTabChange("calendario")}
            className={`px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${viewTab === "calendario" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"}`}
          >
            <CalendarIcon size={14} /> Calendário
          </button>
        </div>
      )}
    </div>
  );
}
