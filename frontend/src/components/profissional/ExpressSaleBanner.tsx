import { DollarSign, ArrowRight } from "lucide-react";

interface ExpressSaleBannerProps {
  onOpen: () => void;
}

export function ExpressSaleBanner({ onOpen }: ExpressSaleBannerProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-brand-tactical/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
      <button
        onClick={onOpen}
        className="relative w-full bg-theme-bg-muted border border-brand-tactical/40 p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 group hover:border-brand-tactical transition-all overflow-hidden shadow-2xl"
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="p-3 md:p-4 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical"><DollarSign size={24} /></div>
          <div className="text-left space-y-1">
            <div className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter italic">Venda Rápida Foto Segundo</div>
            <div className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] italic">Registre o recebimento e libere o acesso na hora</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] group-hover:gap-6 transition-all">
          INICIAR OPERAÇÃO <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}
