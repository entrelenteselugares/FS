import { ShieldCheck, ArrowRight } from "lucide-react";

interface OpportunitiesModalProps {
  unitInvitesCount: number;
  pendingEventsCount: number;
  opportunitiesCount: number;
  onClose: () => void;
  onAction: (tab: "agenda" | "convites") => void;
}

export function OpportunitiesModal({ 
  unitInvitesCount, 
  pendingEventsCount, 
  opportunitiesCount,
  onClose, 
  onAction 
}: OpportunitiesModalProps) {
  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-2xl animate-in fade-in duration-500" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-lg p-10 md:p-16 shadow-[0_0_150px_rgba(133,185,172,0.15)] relative overflow-hidden text-center space-y-10" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-brand-tactical to-transparent" />
        <div className="flex justify-center">
          <div className="p-6 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full text-brand-tactical animate-bounce">
            <ShieldCheck size={48} />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-tight">Oportunidades Disponíveis</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic font-bold">A matriz detectou novos chamados compatíveis com seu perfil</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {unitInvitesCount > 0 && (
            <div className="bg-brand-tactical/10 p-6 border border-brand-tactical/20 hover:border-brand-tactical transition-all">
              <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.2em] mb-2 italic">Expansão de Rede</div>
              <div className="text-xl font-heading font-black text-theme-text italic leading-none">
                {unitInvitesCount} {unitInvitesCount === 1 ? "CONVITE DE UNIDADE" : "CONVITES DE UNIDADE"}
              </div>
            </div>
          )}
          {pendingEventsCount > 0 && (
            <div className="bg-theme-bg-muted p-6 border border-theme-border hover:border-brand-tactical/40 transition-all">
              <div className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 italic">Chamados de Campo</div>
              <div className="text-xl font-heading font-black text-theme-text italic leading-none">
                {pendingEventsCount} {pendingEventsCount === 1 ? "TRABALHO DISPONÍVEL" : "TRABALHOS DISPONÍVEIS"}
              </div>
            </div>
          )}
          {opportunitiesCount > 0 && (
            <div className="bg-yellow-400/5 p-6 border border-yellow-400/20 hover:border-yellow-400/40 transition-all">
              <div className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-2 italic">Chamada Aberta</div>
              <div className="text-xl font-heading font-black text-theme-text italic leading-none">
                {opportunitiesCount} {opportunitiesCount === 1 ? "OPORTUNIDADE DISPONÍVEL" : "OPORTUNIDADES DISPONÍVEIS"}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6 pt-4">
          <button
            onClick={() => { 
              onClose(); 
              onAction(unitInvitesCount > 0 ? "convites" : "agenda"); 
            }}
            className="w-full py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-2xl shadow-brand-tactical/20 transition-all italic flex items-center justify-center gap-3"
          >
            ACESSAR CENTRAL DE CONVITES <ArrowRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] hover:text-brand-tactical transition-colors italic"
          >
            IGNORAR POR ENQUANTO
          </button>
        </div>
      </div>
    </div>
  );
}
