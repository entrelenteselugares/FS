import { List, Calendar as CalendarIcon, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  activeTab: string;
  viewTab: "lista" | "calendario";
  onViewTabChange: (tab: "lista" | "calendario") => void;
  residentUnits?: string[];
}

export function DashboardHeader({ activeTab, viewTab, onViewTabChange, residentUnits = [] }: DashboardHeaderProps) {
  const hasContent = residentUnits.length > 0 || activeTab === "agenda" || activeTab === "convites";
  if (!hasContent) return null;

  return (
    <div className="relative mb-6">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
        <div className="flex items-center gap-4">
            {residentUnits.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-brand-tactical" />
                <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
                  Residente: {residentUnits.join(", ")}
                </p>
              </div>
            )}

        </div>
        
        {(activeTab === "agenda" || activeTab === "convites") && (
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button
              onClick={() => onViewTabChange("lista")}
              className={`px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border ${viewTab === "lista" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"} flex-1 md:flex-none whitespace-nowrap`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => onViewTabChange("calendario")}
              className={`px-4 md:px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border ${viewTab === "calendario" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"} flex-1 md:flex-none whitespace-nowrap`}
            >
              <CalendarIcon size={14} /> Calendário
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
