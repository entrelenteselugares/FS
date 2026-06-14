import { BookImage, Star, ArrowRight } from "lucide-react";


interface Props {
  isSubscriber?: boolean;
}

export function AlbumSanfonaBanner({ isSubscriber }: Props) {
  if (isSubscriber) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-tactical/20 to-theme-bg border border-brand-tactical/30 p-6 rounded-2xl mb-6 shadow-[0_0_30px_rgba(133,185,172,0.15)] flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-brand-tactical rounded-xl shadow-lg">
            <BookImage className="text-theme-text" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-black uppercase tracking-widest text-brand-tactical flex items-center gap-2">
              Clube Álbum Sanfona <Star size={14} className="fill-brand-tactical" />
            </h3>
            <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] mt-1">
              Sua cota mensal está liberada. Envie suas 10 fotos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-theme-bg-muted to-theme-bg border border-brand-tactical/20 p-6 rounded-2xl mb-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-brand-tactical/50 transition-all duration-500">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-brand-tactical/10 transition-colors duration-500" />
      
      <div className="relative z-10 flex items-center gap-4 w-full md:w-auto">
        <div className="p-4 bg-theme-bg border border-white/5 rounded-2xl shadow-xl group-hover:scale-105 transition-transform duration-500">
          <BookImage className="text-brand-tactical" size={28} />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-heading font-black uppercase tracking-widest text-theme-text">
            Clube do Álbum Sanfona
          </h3>
          <p className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] mt-1 max-w-md leading-relaxed">
            Receba um álbum sanfona exclusivo em casa todo mês com as suas 10 melhores fotos daquele ciclo.
          </p>
        </div>
      </div>

      <button className="relative z-10 w-full md:w-auto flex items-center justify-center gap-3 bg-brand-tactical text-theme-text px-8 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] hover:brightness-110 hover:shadow-[0_0_20px_rgba(133,185,172,0.3)] transition-all duration-300">
        Assinar Agora <ArrowRight size={14} />
      </button>
    </div>
  );
}
