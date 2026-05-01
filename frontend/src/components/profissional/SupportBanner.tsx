import { MessageCircle } from "lucide-react";

export function SupportBanner() {
  return (
    <div className="bg-theme-bg-muted border-l-4 border-brand-tactical p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="space-y-1">
        <h4 className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Suporte de Campo</h4>
        <p className="text-[10px] text-theme-muted uppercase tracking-widest font-medium">Linha direta com a matriz para dúvidas operacionais ou técnicas.</p>
      </div>
      <a
        href="https://wa.me/5519984470420"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full md:w-auto px-4 md:px-8 py-4 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-brand-tactical/10"
      >
        <MessageCircle size={16} /> Falar com Matriz
      </a>
    </div>
  );
}
