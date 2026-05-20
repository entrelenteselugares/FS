import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Printer, TrendingUp, ShieldCheck, 
  ArrowRight, Calculator, PieChart,
  HelpCircle, Rocket
} from "lucide-react";

export function FranquiaLanding() {
  const [investment, setInvestment] = useState(13500);
  const [photoPrice, setPhotoPrice] = useState(15);
  const [monthlyVolume, setMonthlyVolume] = useState(300);
  const [showCalc, setShowCalc] = useState(false);

  const safeOpen = (url: string) => {
    const w = window.open(url, "_blank");
    if (w) w.opener = null;
  };

  const roi = useMemo(() => {
    const revenue = monthlyVolume * photoPrice;
    const costPerPhoto = 2.5;
    const profit = revenue - (monthlyVolume * costPerPhoto);
    const months = profit <= 0 ? null : Math.ceil(investment / profit);
    return { profit, months };
  }, [investment, photoPrice, monthlyVolume]);

  return (<div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-zinc-900">
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Visual */}
      <div className="relative h-[400px] bg-zinc-950 border border-theme-border rounded-2xl overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/20 to-transparent z-10" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale group-hover:scale-105 transition-transform duration-[10000ms]" />
        </div>
        
        <div className="relative z-20 h-full flex flex-col justify-center px-12 md:px-20 space-y-6">
          <div className="inline-flex items-center gap-4 bg-brand-tactical text-black px-4 py-1 self-start rounded-md">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Business Opportunity</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-black text-white uppercase italic tracking-tighter leading-[0.8] max-w-2xl">
            Franquia <br/><span className="text-brand-tactical">Print Hub</span>
          </h1>
          <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-xs max-w-md leading-relaxed">
            Transforme sua operação phygital em uma fonte de renda passiva com a tecnologia de impressão Foto Segundo.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => safeOpen("https://wa.me/5519984470420?text=Ol%C3%A1! Tenho interesse em me tornar uma Franquia Print.")}
              className="px-8 py-4 bg-brand-tactical text-black font-display font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-3 shadow-xl shadow-brand-tactical/20 rounded-xl"
            >
              QUERO SER FRANQUIA <Rocket size={16} />
            </button>
            <button 
              onClick={() => setShowCalc(!showCalc)}
              className="px-8 py-4 border border-white/30 text-white font-display font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-3 rounded-xl"
            >
              SIMULAR CAPEX <Calculator size={16} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 right-10 z-20 flex gap-4 opacity-50">
          {[0, 1, 2, 3, 4].map((idx) => (
            <ArrowRight key={idx} size={12} className="text-brand-tactical" />
          ))}
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <Printer size={32} />,
            title: "Hardware Premium",
            desc: "Flash Hub + Impressora Sublimação de alta velocidade e durabilidade industrial."
          },
          {
            icon: <TrendingUp size={32} />,
            title: "Escalabilidade",
            desc: "Múltiplos pontos de venda geridos por um único painel centralizado."
          },
          {
            icon: <ShieldCheck size={32} />,
            title: "Zero Atrito",
            desc: "Tecnologia plug-and-play com monitoramento remoto e alertas de insumos."
          }
        ].map((benefit, idx) => (
          <div key={idx} className="bg-theme-bg border border-theme-border p-10 space-y-6 hover:border-brand-tactical/30 transition-all rounded-2xl shadow-xl hover:shadow-2xl">
            <div className="text-brand-tactical">{benefit.icon}</div>
            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight">{benefit.title}</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed tracking-wider">{benefit.desc}</p>
          </div>
        ))}
      </div>

      {/* ROI Calculator — togglable */}
      <AnimatePresence>
        {showCalc && (
          <motion.div 
            key="calc"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-950 border border-brand-tactical/30 p-12 md:p-20 relative overflow-hidden rounded-2xl shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-tactical/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                {/* Controls */}
                <div className="space-y-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-brand-tactical">
                      <Calculator size={18} />
                      <h2 className="text-2xl font-display font-black uppercase italic tracking-tight">Calculadora de ROI</h2>
                    </div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Ajuste os parâmetros para prever seu Payback</p>
                  </div>

                  <div className="space-y-8">
                    {[
                      {
                        label: "Investimento (CAPEX)",
                        value: `R$ ${investment.toLocaleString()}`,
                        min: 10000, max: 30000, step: 500,
                        current: investment,
                        onChange: (v: number) => setInvestment(v)
                      },
                      {
                        label: "Volume Mensal (Fotos)",
                        value: `${monthlyVolume} un.`,
                        min: 100, max: 2000, step: 50,
                        current: monthlyVolume,
                        onChange: (v: number) => setMonthlyVolume(v)
                      },
                      {
                        label: "Preço por Foto (Venda)",
                        value: `R$ ${photoPrice}`,
                        min: 10, max: 40, step: 1,
                        current: photoPrice,
                        onChange: (v: number) => setPhotoPrice(v)
                      }
                    ].map((slider) => (
                      <div key={slider.label} className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          <span>{slider.label}</span>
                          <span className="text-white">{slider.value}</span>
                        </div>
                        <input 
                          type="range"
                          min={slider.min} max={slider.max} step={slider.step}
                          value={slider.current}
                          onChange={e => slider.onChange(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-800 accent-brand-tactical appearance-none cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Result Card */}
                <div className="bg-brand-tactical p-12 text-black flex flex-col justify-between rounded-2xl shadow-xl">
                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <PieChart size={24} />
                      <div className="h-px bg-black/10 flex-1" />
                      <TrendingUp size={24} />
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Payback Estimado</p>
                      <div className="text-7xl font-display font-black italic tracking-tighter leading-none">
                        {roi.months === null ? (
                          <span className="text-3xl text-red-400">Inviável</span>
                        ) : (
                          <>{roi.months}<span className="text-2xl uppercase not-italic tracking-normal ml-2">Meses</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 border-t border-black/10 pt-8 mt-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase opacity-60">Lucro Líquido Mensal</p>
                        <p className="text-3xl font-display font-black italic tracking-tight">
                          R$ {roi.profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => safeOpen("https://wa.me/5519984470420?text=Ol%C3%A1! Gostaria de saber mais sobre como me tornar uma Franquia Print Hub.")}
                      className="w-full bg-black text-white py-4 font-display font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all flex items-center justify-center gap-3 rounded-xl"
                    >
                      SOLICITAR PROPOSTA COMERCIAL <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Final */}
      <div className="flex flex-col items-center text-center space-y-10 py-10 border-t border-theme-border rounded-b-2xl">
        <div className="space-y-4">
          <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter">
            Pronto para o Próximo Nível?
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-xl mx-auto leading-relaxed">
            Nossa equipe entrará em contato para realizar uma analysis de viabilidade na sua região.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => safeOpen("https://wa.me/5519984470420?text=Ol%C3%A1! Gostaria de receber o book da Franquia Print.")}
            className="px-12 py-5 bg-brand-tactical text-black font-display font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20 rounded-xl"
          >
            BAIXAR BOOK DE FRANQUIA
          </button>
          <button
            onClick={() => safeOpen("https://wa.me/5519984470420?text=Ol%C3%A1! Gostaria de falar com um consultor sobre a franquia.")}
            className="px-12 py-5 border border-theme-border text-zinc-400 font-display font-black text-[11px] uppercase tracking-widest hover:border-brand-tactical/40 hover:text-white transition-all flex items-center gap-3 rounded-xl"
          >
            <HelpCircle size={14} /> FALAR COM CONSULTOR
          </button>
        </div>
      </div>
    </div>
  </div> );
}
