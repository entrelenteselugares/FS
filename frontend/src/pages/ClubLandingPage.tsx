import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ShieldCheck, CheckCircle2, ArrowLeft, Star, Zap, Printer, Package, Camera } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { API } from "../lib/api";

export const ClubLandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vaultId = searchParams.get("vaultId");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      navigate(`/login?redirect=/clube${vaultId ? `?vaultId=${vaultId}` : ''}`);
      return;
    }
    
    setLoading(true);
    try {
      // Usar a rota específica do cofre se tivermos o vaultId
      const endpoint = vaultId ? `/vaults/${vaultId}/subscribe` : `/checkout/subscribe`;
      const res = await API.post(endpoint, { planLimit: 36 });
      
      if (res.data.orderId) {
        // Redireciona para o checkout transparente padrão do sistema
        navigate(`/checkout/${res.data.orderId}`);
      } else if (res.data.init_point) {
        // Fallback para checkout externo se não houver orderId
        window.location.href = res.data.init_point;
      } else {
        alert("Erro ao iniciar assinatura. Contate o suporte.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error("Subscription Error:", err);
      alert(error.response?.data?.error || "Erro ao processar o plano de assinatura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: T.bg, color: T.text }}>
      <Helmet>
        <title>Clube de Memórias | Foto Segundo</title>
      </Helmet>
      
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-24 w-full">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all mb-12"
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Lado Esquerdo - Copy e Hero */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/20 rounded-full text-brand-tactical">
              <Star size={14} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-widest">Assinatura Premium</span>
            </div>
                     <h1 className="text-5xl md:text-8xl font-heading font-black uppercase tracking-tighter italic leading-none text-white">
              Os Seus <span className="text-brand-tactical block">Meus Álbuns</span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
              Materialize os momentos mais importantes da sua vida sem esforço. Suas fotos favoritas impressas com qualidade de museu, direto na sua casa, todo mês.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Printer size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm">36 Impressões Mensais</h3>
                  <p className="text-zinc-500 text-sm mt-1">Fotos reveladas em papel fotográfico de alta durabilidade (Seda/Fosco), no formato 10x15cm.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Camera size={16} className="text-brand-tactical" />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm">Votação Automática</h3>
                  <p className="text-zinc-500 text-sm mt-1">O sistema seleciona automaticamente as fotos mais curtidas (Double Tap) nos seus álbuns.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Package size={16} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm">Frete Incluso e Envios Seguros</h3>
                  <p className="text-zinc-500 text-sm mt-1">Receba seu pacote de memórias no conforto da sua casa, embalado com todo o cuidado.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito - Pricing Card */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-brand-tactical/50 transition-colors">
              <div className="absolute top-0 right-0 -m-16 w-64 h-64 bg-brand-tactical/10 blur-[100px] rounded-full group-hover:bg-brand-tactical/20 transition-all" />
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Plano TBT Mensal</h2>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Acesso ilimitado ao sistema + Impressões</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-zinc-500 text-lg font-bold">R$</span>
                  <span className="text-6xl font-heading font-black text-white tracking-tighter italic leading-none">49,90</span>
                  <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">/ mês</span>
                </div>

                <div className="space-y-4">
                  {[
                    "36 Poses Impressas (10x15cm)",
                    "Meus Álbuns Ilimitados",
                    "Compartilhamento via QR Code e Link",
                    "Filtros Profissionais Automáticos",
                    "Entrega em todo território nacional"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-brand-tactical shrink-0" />
                      <span className="text-sm font-medium text-zinc-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10">
                  <button 
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-brand-tactical hover:bg-brand-tactical/90 text-black font-black uppercase tracking-[0.2em] text-[12px] py-5 rounded-xl transition-all shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    {loading ? "Processando..." : "Assinar Agora"}
                    {!loading && <Zap size={16} fill="currentColor" />}
                  </button>
                  <p className="text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-4">
                    Cancele quando quiser. Sem taxas escondidas.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-white/5 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 opacity-50">
            <img src="/logo.png" alt="Foto Segundo" style={{ height: 16, objectFit: "contain", filter: "var(--logo-filter)" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Advanced Phygital Engine</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} /> Ambiente Blindado
          </div>
        </div>
      </footer>
    </div>
  );
};
