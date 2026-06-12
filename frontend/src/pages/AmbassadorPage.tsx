import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Star, Users } from "lucide-react";
import { API as api } from "../lib/api";

interface AmbassadorInfo {
  name: string;
  role?: string;
  ownerName?: string;
  targetUrl?: string;
}

export default function AmbassadorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<AmbassadorInfo | null>(null);

  useEffect(() => {
    if (!slug) return;

    const trackVisit = async () => {
      try {
        // 1. Rastreia o clique e obtém dados do embaixador
        const { data } = await api.get(`/public/ambassador/track/${slug}`);
        setInfo(data);
        
        // 2. Persiste o rastreamento (Cookie + LocalStorage)
        document.cookie = `fs_referral=${slug}; max-age=${30 * 24 * 60 * 60}; path=/;`;
        localStorage.setItem("fs_referral", slug);
        
        console.log(`[Growth Engine] Convite de ${data.ownerName || slug} rastreado.`);
      } catch (err) {
        console.warn("[Growth Engine] Falha ao carregar dados do convite:", err);
      } finally {
        setLoading(false);
      }
    };

    trackVisit();
  }, [slug]);

  const handleStart = () => {
    // Redireciona para o registro com o código de referência
    navigate(`/registro?ref=${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const name = info?.ownerName || slug?.split('-')[0] || "Um Embaixador";

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-tactical/30 selection:text-white overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-tactical/10 blur-[150px] rounded-full opacity-30 animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500 blur-[120px] rounded-full opacity-20" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-3 md:px-6 pt-20 pb-32 flex flex-col items-center text-center">
        {/* Top Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 mb-16"
        >
          <img src="/logo.png" alt="Foto Segundo" className="h-6 md:h-8 object-contain filter invert opacity-80" />
          <div className="h-px w-12 bg-brand-tactical/100" />
        </motion.div>

        {/* Invitation Hero */}
        <div className="space-y-8 mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-3 md:px-6 py-2.5 bg-brand-tactical/10 border border-brand-tactical/20 rounded-full text-brand-tactical"
          >
            <Users size={14} className="fill-brand-tactical" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Acesso Exclusivo via Convite</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl md:text-8xl font-heading font-bold uppercase leading-[0.85] text-white"
          >
            Você foi convidado <br />
            <span className="text-brand-tactical">por {name}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Entre para a rede premium que está redefinindo a fotografia de eventos com tecnologia Phygital, Live Print e curadoria editorial instantânea.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 w-full mb-20">
          {[
            { icon: <Zap />, title: "Live Sync", desc: "Suas fotos transmitidas em tempo real." },
            { icon: <Star />, title: "Premium", desc: "Qualidade de museu em cada impressão." },
            { icon: <ShieldCheck />, title: "Privacidade", desc: "Sua galeria, suas regras, total segurança." }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="p-4 md:p-8 bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl flex flex-col items-center text-center space-y-4 group hover:border-brand-tactical/40 transition-all"
            >
              <div className="text-brand-tactical p-3 bg-brand-tactical/10 rounded-2xl group-hover:bg-brand-tactical group-hover:text-black transition-all">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">{f.title}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-md space-y-6"
        >
          <button
            onClick={handleStart}
            className="w-full py-3 md:py-6 bg-brand-tactical text-black font-bold uppercase tracking-[0.4em] text-[12px] hover:bg-white transition-all shadow-[0_0_60px_rgba(133,185,172,0.2)] active:scale-95 flex items-center justify-center gap-4 "
          >
            Aceitar Convite e Começar
            <ArrowRight size={18} />
          </button>
          
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
            Já possui acesso? <button onClick={() => navigate('/login')} className="text-zinc-400 hover:text-brand-tactical">Fazer Login</button>
          </p>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="py-3 md:py-6 md:py-12 border-t border-zinc-900/50 text-center opacity-30">
        <div className="flex items-center justify-center gap-3">
          <ShieldCheck size={14} className="text-brand-tactical" />
          <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Protocolo de Rede Blindado</span>
        </div>
      </footer>
    </div>
  );
}
