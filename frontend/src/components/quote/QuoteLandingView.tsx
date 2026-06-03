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
          .map((ev: any) => ev.coverPhotoUrl)
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
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans pb-24 overflow-x-hidden relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button 
          onClick={() => window.location.href = '/'}
          className="pointer-events-auto flex items-center gap-2 text-white/80 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
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
      <div className="w-full max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10 flex flex-col items-center text-center min-h-[60vh] justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full mb-8 shadow-2xl">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Eternize Seus Momentos</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-6 leading-[1.1] text-white drop-shadow-2xl">
          Sua História. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 italic pr-2">
            Nossa Lente.
          </span>
        </h1>
        
        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-16 font-medium drop-shadow-lg">
          A Foto Segundo oferece a cobertura audiovisual mais premium do mercado.
        </p>

        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
          <div className="flex -space-x-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center">
                <Star size={12} className="text-emerald-400" />
              </div>
            ))}
          </div>
          <div className="text-xs font-bold text-white text-left leading-tight">
            Mais de 1000 eventos realizados <br/>com sucesso em 2026.
          </div>
        </div>
      </div>

      {/* Pillars Section */}
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 mt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black uppercase tracking-widest mb-4 text-white">Como deseja contratar?</h2>
          <div className="h-px w-24 bg-brand-tactical mx-auto mb-4" />
          <p className="text-theme-text-muted text-sm">Escolha a jornada perfeita para o seu evento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PACOTE ESSENCIAL (The 1900 BRL requested by user) */}
          <div className="relative group p-8 rounded-2xl bg-theme-bg border border-brand-tactical shadow-[0_0_40px_rgba(var(--brand-rgb),0.15)] flex flex-col hover:-translate-y-2 transition-all duration-300">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-tactical text-brand-text px-4 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <Crown size={12} /> Mais Vendido
            </div>
            
            <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-theme-text">Pacotes Fechados</h3>
            <p className="text-theme-text-muted text-xs mb-8 min-h-[40px]">
              Soluções prontas com o melhor custo-benefício. Perfeito para quem quer praticidade.
            </p>

            <div className="flex items-baseline gap-2 mb-8 border-b border-theme-border pb-8">
              <span className="text-3xl font-black text-theme-text">Pacote Essencial</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                "6 Horas de Cobertura",
                "1 Fotógrafo Sênior",
                "1 Filmmaker",
                "~200 Fotos Tratadas",
                "Vídeo Aftermovie"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-theme-text">
                  <div className="mt-1 w-4 h-4 rounded-full bg-brand-tactical/20 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-brand-tactical" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => selectFlow("PACKAGE")}
              className="w-full py-4 bg-brand-tactical text-brand-text font-black uppercase tracking-widest text-[11px] hover:bg-brand-tactical/90 transition-colors flex items-center justify-center gap-3 group-hover:shadow-lg group-hover:shadow-brand-tactical/30"
            >
              Escolher Pacote <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* UNIDADES FIXAS */}
          <div className="relative group p-8 rounded-2xl bg-theme-bg-muted border border-theme-border flex flex-col hover:-translate-y-2 transition-all duration-300">
            <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-theme-text">Unidade Fixa</h3>
            <p className="text-theme-text-muted text-xs mb-8 min-h-[40px]">
              Já tem local definido? Escolha uma de nossas casas parceiras e veja os serviços exclusivos.
            </p>

            <div className="flex items-baseline gap-2 mb-8 border-b border-theme-border pb-8">
              <span className="text-3xl font-black text-theme-text">Casas Parceiras</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1 opacity-70">
              {[
                "Lista de parceiros Foto Segundo",
                "Serviços otimizados pro local",
                "Facilidade de contratação",
                "Conhecimento prévio da iluminação",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-theme-text">
                  <div className="mt-1 w-4 h-4 rounded-full bg-theme-border flex items-center justify-center shrink-0">
                    <Check size={10} className="text-theme-text" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => selectFlow("PARTNER")}
              className="w-full py-4 border border-theme-text text-theme-text font-black uppercase tracking-widest text-[11px] hover:bg-theme-text hover:text-theme-bg transition-colors flex items-center justify-center gap-3"
            >
              Ver Unidades <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* PACOTE CUSTOMIZADO */}
          <div className="relative group p-8 rounded-2xl bg-theme-bg-muted border border-theme-border flex flex-col hover:-translate-y-2 transition-all duration-300">
            <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-theme-text">Customizado</h3>
            <p className="text-theme-text-muted text-xs mb-8 min-h-[40px]">
              Monte do zero. Escolha cada serviço avulso de acordo com a necessidade do seu evento.
            </p>

            <div className="flex items-baseline gap-2 mb-8 border-b border-theme-border pb-8">
              <span className="text-3xl font-black text-theme-text">Sob Medida</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1 opacity-70">
              {[
                "Escolha a quantidade de horas",
                "Adicione fotógrafos extras",
                "Escolha serviços adicionais",
                "Aprovação e proposta por admin",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-theme-text">
                  <div className="mt-1 w-4 h-4 rounded-full bg-theme-border flex items-center justify-center shrink-0">
                    <Check size={10} className="text-theme-text" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => selectFlow("CUSTOM")}
              className="w-full py-4 border border-theme-text text-theme-text font-black uppercase tracking-widest text-[11px] hover:bg-theme-text hover:text-theme-bg transition-colors flex items-center justify-center gap-3"
            >
              Montar do Zero <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
