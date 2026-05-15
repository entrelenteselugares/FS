import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { API as api } from "../lib/api";

export default function AmbassadorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;

    const trackAndRedirect = async () => {
      try {
        // 1. Notificar o backend sobre o clique (Growth Tracking)
        await api.get(`/public/ambassador/track/${slug}`);
        
        // 2. Persistir o rastreamento em Cookie (30 dias) - Fase 35
        document.cookie = `fs_referral=${slug}; max-age=${30 * 24 * 60 * 60}; path=/;`;
        
        // 3. Persistir em LocalStorage como redundância
        localStorage.setItem("fs_referral", slug);
        
        console.log(`[Growth Engine] Embaixador rastreado com sucesso: ${slug}`);
      } catch (err) {
        console.warn("[Growth Engine] Falha no rastreamento automático:", err);
      } finally {
        // Redireciona para a home após um breve delay para garantir a persistência
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);
      }
    };

    trackAndRedirect();
  }, [slug, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Cinematográfico */}
      <div className="absolute inset-0 bg-brand-tactical/5 blur-[120px] rounded-full -m-64 opacity-20 animate-pulse-slow" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 space-y-8"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-brand-tactical to-transparent" />
          
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border border-brand-tactical/20 rounded-full border-dashed"
            />
            <div className="w-20 h-20 bg-brand-tactical/10 rounded-full flex items-center justify-center border border-brand-tactical/30">
              <Sparkles className="text-brand-tactical" size={32} strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-[14px] font-black uppercase tracking-[0.8em] italic text-zinc-500">Foto Segundo</h1>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Sincronizando Convite</h2>
          </div>

          <div className="flex items-center gap-3">
             <Loader2 size={16} className="text-brand-tactical animate-spin" />
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-tactical">Autenticando Relação de Rede</p>
          </div>

          <div className="w-px h-20 bg-gradient-to-t from-transparent via-brand-tactical to-transparent" />
        </div>

        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest max-w-xs mx-auto leading-relaxed">
          Você está sendo redirecionado para a nossa rede premium através de um link de embaixador oficial.
        </p>
      </motion.div>

      {/* Footer Branding */}
      <div className="fixed bottom-12 left-0 right-0 flex justify-center opacity-10">
        <img src="/logo.png" alt="Foto Segundo" style={{ height: 20, objectFit: "contain", filter: "invert(1)" }} />
      </div>
    </div>
  );
}
