import React, { useState, useEffect } from "react";
import { ArrowRight, Star, Crown, Sparkles, Check, ArrowLeft } from "lucide-react";
import { API } from "../../lib/api";

interface QuoteLandingViewProps {
  selectFlow: (type: "PACKAGE" | "PARTNER" | "CUSTOM") => void;
}

const FALLBACK_BG = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop";

export const QuoteLandingView: React.FC<QuoteLandingViewProps> = ({ selectFlow }) => {
  const [covers, setCovers] = useState<string[]>([FALLBACK_BG]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    API.get("/public/events", { params: { limit: 10, page: 1 } })
      .then(res => {
        const events = res.data?.events || [];
        const validCovers = events
          .map((ev: { coverPhotoUrl: string | null }) => ev.coverPhotoUrl)
          .filter((url: string | null) => url && typeof url === 'string');
          
        if (validCovers.length > 0) {
          setCovers(validCovers);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (covers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % covers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [covers]);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text pb-24 overflow-x-hidden relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button 
          onClick={() => window.location.href = '/'}
          className="pointer-events-auto flex items-center gap-2 text-theme-text/80 hover:text-theme-text transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
        >
          <ArrowLeft size={16} />
          Voltar para Home
        </button>
      </div>

      {/* Fullscreen Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out">
        <div className="absolute inset-0 bg-theme-bg/80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/60 to-transparent z-10" />
        {covers.map((cover, i) => (
          <div 
            key={i}
            className={`absolute inset-0 bg-cover bg-center mix-blend-luminosity transition-opacity duration-1000 ease-in-out ${
              i === currentIndex ? 'opacity-40 z-0' : 'opacity-0 -z-10'
            }`}
            style={{ backgroundImage: `url('${cover}')` }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-24 pb-12 relative z-10 flex flex-col items-center text-center min-h-[40vh] justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full mb-6 shadow-2xl">
          <Sparkles size={12} className="text-theme-brand" />
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-theme-text">Eternize Seus Momentos</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-[1.1] text-theme-text drop-shadow-2xl">
          Sua História. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 pr-2">
            Nossa Lente.
          </span>
        </h1>
        
        <p className="text-theme-text/80 text-sm md:text-base max-w-xl mx-auto mb-10 font-medium drop-shadow-lg">
          A Foto Segundo oferece a cobertura audiovisual mais premium do mercado.
        </p>

        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center">
                <Star size={10} className="text-theme-brand" />
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold text-theme-text text-left leading-tight">
            +1000 eventos realizados <br/>com sucesso em 2026.
          </div>
        </div>
      </div>

      {/* Pillars Section */}
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 mt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-4 text-theme-text">Como deseja contratar?</h2>
          <div className="h-px w-24 bg-brand-tactical mx-auto mb-4" />
          <p className="text-theme-text-muted text-sm">Escolha a jornada perfeita para o seu evento.</p>
        </div>

        <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto pb-6 md:pb-0 hide-scrollbar -mx-6 px-6 md:mx-auto md:px-0">
          
          {/* PACOTE ESSENCIAL */}
          <div className="relative group p-6 rounded-xl bg-theme-bg/90 backdrop-blur-md border border-brand-tactical/50 shadow-xl flex flex-col hover:-translate-y-1 transition-all duration-300 min-w-[280px] snap-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-tactical text-brand-text px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-brand-tactical/20 whitespace-nowrap">
              <Crown size={10} /> O Mais Vendido
            </div>
            
            <h3 className="text-lg font-bold uppercase tracking-widest text-center text-theme-text mt-2">Pacotes Fechados</h3>
            <p className="text-theme-text-muted text-[10px] text-center mb-6 px-2 min-h-[30px]">
              Soluções prontas com o melhor custo-benefício. Praticidade total.
            </p>

            <div className="space-y-2 mb-6 flex-1">
              {[
                "6 Horas de Cobertura",
                "1 Fotógrafo + 1 Vídeo",
                "Vídeo Aftermovie",
                "Fotos Tratadas (High-End)",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-theme-text/90 bg-theme-bg-muted/50 p-2.5 rounded-lg border border-white/5">
                  <Check size={12} className="text-brand-tactical shrink-0" />
                  <span className="font-medium truncate">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => selectFlow("PACKAGE")}
              className="w-full py-3.5 bg-brand-tactical text-brand-text font-bold uppercase tracking-widest text-[10px] rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-brand-tactical/30"
            >
              Escolher Pacote <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* UNIDADES FIXAS */}
          <div className="relative group p-6 rounded-xl bg-theme-bg/80 backdrop-blur-md border border-theme-border flex flex-col hover:-translate-y-1 transition-all duration-300 min-w-[280px] snap-center">
            <h3 className="text-lg font-bold uppercase tracking-widest text-center text-theme-text mt-2">Unidades Fixas</h3>
            <p className="text-theme-text-muted text-[10px] text-center mb-6 px-2 min-h-[30px]">
              Vai casar/festejar em uma das nossas casas parceiras?
            </p>

            <div className="space-y-2 mb-6 flex-1 opacity-80">
              {[
                "Pacotes Otimizados pro Local",
                "Fotógrafos Credenciados",
                "Condições Exclusivas",
                "Equipe Especializada",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-theme-text/90 bg-theme-bg-muted/50 p-2.5 rounded-lg border border-white/5">
                  <Check size={12} className="text-theme-text-muted shrink-0" />
                  <span className="font-medium truncate">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => selectFlow("PARTNER")}
              className="w-full py-3.5 bg-theme-bg-muted border border-theme-border text-theme-text font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-theme-border hover:text-theme-text transition-all flex items-center justify-center gap-2"
            >
              Ver Unidades <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* PACOTE CUSTOMIZADO */}
          <div className="relative group p-6 rounded-xl bg-theme-bg/80 backdrop-blur-md border border-theme-border flex flex-col hover:-translate-y-1 transition-all duration-300 min-w-[280px] snap-center">
            <h3 className="text-lg font-bold uppercase tracking-widest text-center text-theme-text mt-2">Customizado</h3>
            <p className="text-theme-text-muted text-[10px] text-center mb-6 px-2 min-h-[30px]">
              Monte exatamente do seu jeito, serviço por serviço.
            </p>

            <div className="space-y-2 mb-6 flex-1 opacity-80">
              {[
                "Horas Avulsas",
                "Fotógrafos Extras",
                "Drone e Impressão Local",
                "Coberturas Gigantes",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-theme-text/90 bg-theme-bg-muted/50 p-2.5 rounded-lg border border-white/5">
                  <Check size={12} className="text-theme-text-muted shrink-0" />
                  <span className="font-medium truncate">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => selectFlow("CUSTOM")}
              className="w-full py-3.5 bg-theme-bg-muted border border-theme-border text-theme-text font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-theme-border hover:text-theme-text transition-all flex items-center justify-center gap-2"
            >
              Montar do Zero <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-theme-text-muted uppercase tracking-widest">
            * O valor final e a disponibilidade dependem da aprovação da proposta.
          </p>
        </div>
      </div>
    </div>
  );
};
