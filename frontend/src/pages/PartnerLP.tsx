import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { MapPin, Phone, MessageSquare, Calendar, Star, ArrowLeft } from "lucide-react";

interface PartnerData {
  razaoSocial: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  coverUrl: string | null;
  slug: string;
}

interface RecentEvent {
  id: string;
  nomeNoivos: string;
  slug: string;
  dataEvento: string;
  coverPhotoUrl: string;
}


export const PartnerLP: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  useTheme(); // ensures CSS variables re-evaluate on theme toggle
  const navigate = useNavigate();
  const [data, setData] = useState<{ partner: PartnerData; recentEvents: RecentEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/public/partners/${slug}`)
      .then(res => setData(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading || !data) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black animate-pulse">
      Sincronizando Localização...
    </div>
  );

  const { partner, recentEvents } = data;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-500 overflow-x-hidden">
      <style>{`
        @media (max-width: 768px) {
          .mobile-hero-title { font-size: clamp(32px, 12vw, 48px) !important; line-height: 1 !important; }
          .mobile-py { padding-top: 4rem !important; padding-bottom: 4rem !important; }
          .mobile-px { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .mobile-gap { gap: 40px !important; }
          .mobile-full-width { width: 100% !important; }
          .mobile-center { text-align: center !important; flex-direction: column !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all bg-theme-bg-muted/80 backdrop-blur-xl px-6 py-3 border border-theme-border"
        >
          <ArrowLeft size={14} /> Vitrine
        </button>

        <div className="pointer-events-auto">
          <img 
            src="/logo-premium.png" 
            alt="Logo" 
            style={{ 
              height: 32, 
              objectFit: "contain",
              filter: useTheme().theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
            }} 
          />
        </div>
      </nav>

      {/* Hero / Cover */}
      <section className="relative h-[85vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src={partner.coverUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600"} 
            className="w-full h-full object-cover opacity-60 grayscale scale-110"
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/20 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
             <div className="text-[11px] font-extrabold uppercase tracking-[0.5em] text-brand-primary mb-6">Ponto Parceiro Autorizado</div>
             <h1 className="text-6xl md:text-9xl font-black leading-[0.9] mb-10 mobile-hero-title tracking-tighter uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>
               {partner.razaoSocial}
             </h1>
             <div className="flex flex-wrap justify-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-theme-muted">
               <div className="flex items-center gap-3"><MapPin size={14} className="text-brand-primary" /> {partner.address || "Campinas, SP"}</div>
               <div className="flex items-center gap-3"><Phone size={14} className="text-brand-primary" /> {partner.phone || "(19) 98765-4321"}</div>
             </div>
           </motion.div>
        </div>
      </section>

      {/* Info Sections */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 py-24 md:py-40 border-b border-theme-border mobile-py">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter mb-10 uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>Sobre a Unidade</h2>
          <p className="text-theme-muted leading-relaxed tracking-widest text-[12px] font-bold mb-12 uppercase">
            {partner.description || "Este cartório é um parceiro estratégico da plataforma Foto Segundo, oferecendo infraestrutura otimizada para registros civis de alto padrão. Localizado em área nobre, com iluminação preparada para fotografia profissional e cinema."}
          </p>
          
          <div className="space-y-8">
             {[
               "Acesso prioritário para profissionais credenciados",
               "Iluminação natural otimizada para retratos",
               "Área privativa para fotos e cinema familiar",
               "Sincronização imediata de álbuns digitais"
             ].map(feat => (
               <div key={feat} className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.25em] text-theme-muted group">
                 <div className="w-2 h-[1px] bg-brand-primary transition-all group-hover:w-8" />
                 {feat}
               </div>
             ))}
          </div>
        </div>

        <div className="bg-theme-bg-muted border border-theme-border p-10 md:p-20 flex flex-col justify-center items-center text-center backdrop-blur-sm">
            <Calendar className="text-brand-primary mb-10" size={56} strokeWidth={1} />
            <h3 className="text-4xl font-extrabold tracking-tighter mb-6 uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>Agende seu Protocolo</h3>
            <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-12">
              Solicite cobertura fotográfica ou cinematográfica exclusiva para este local com condições especiais de ponto parceiro.
            </p>
            <button 
                onClick={() => navigate(`/cotacao?partner=${partner.slug}`)}
                className="w-full py-6 bg-theme-text text-theme-bg text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all"
            >
                INICIAR ORÇAMENTO EXPRESS
            </button>
        </div>
      </section>

      {/* Recents Gallery */}
      <section className="py-24 md:py-40 px-6 max-w-7xl mx-auto mobile-py">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 md:mb-24 mobile-center">
            <div>
                <h2 className="text-5xl font-black tracking-tighter uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>Registros Recentes</h2>
                <p className="text-[11px] text-theme-muted font-extrabold uppercase tracking-[0.35em] mt-3">Curadoria Editorial neste Local</p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-theme-muted opacity-30">
                <Star size={18} fill="currentColor" />
                <Star size={18} fill="currentColor" />
                <Star size={18} fill="currentColor" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
            {recentEvents.length === 0 ? (
                <div className="col-span-full py-32 text-center text-theme-muted uppercase tracking-[0.4em] text-[10px] border border-dashed border-theme-border">
                  Os registros deste local estão sendo processados e indexados.
                </div>
            ) : recentEvents.map(event => (
                <motion.div 
                    key={event.id}
                    onClick={() => navigate(`/e/${event.slug || event.id}`)}
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer"
                >
                    <div className="aspect-[4/5] overflow-hidden bg-theme-bg-muted relative">
                        <img 
                            src={event.coverPhotoUrl} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-out group-hover:scale-105" 
                            alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg/80 via-transparent opacity-60" />
                        <div className="absolute bottom-0 left-0 p-8">
                             <h4 className="text-3xl font-extrabold tracking-tighter text-white mb-2 uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>{event.nomeNoivos}</h4>
                             <div className="text-[9px] text-brand-primary font-black uppercase tracking-[0.2em]">{new Date(event.dataEvento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Footer / Location */}
      <footer className="py-24 md:py-48 border-t border-theme-border bg-theme-bg-muted/30 mobile-py">
        <div className="max-w-xl mx-auto text-center px-6">
            <h3 className="text-3xl font-extrabold tracking-tighter mb-10 uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>Localização do Protocolo</h3>
            <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-16">
                {partner.address || "Endereço em processamento em nossa rede..."}
            </p>
            <div className="flex justify-center gap-16">
                <a href={`tel:${partner.phone}`} className="flex flex-col items-center gap-5 group">
                    <div className="w-16 h-16 flex items-center justify-center border border-theme-border group-hover:border-theme-text transition-all duration-300">
                        <Phone size={22} strokeWidth={1} className="text-theme-muted group-hover:text-theme-text" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-theme-muted group-hover:text-theme-text">Ligar</span>
                </a>
                <a href="#" className="flex flex-col items-center gap-5 group">
                    <div className="w-16 h-16 flex items-center justify-center border border-theme-border group-hover:border-theme-text transition-all duration-300">
                        <MessageSquare size={22} strokeWidth={1} className="text-theme-muted group-hover:text-theme-text" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-theme-muted group-hover:text-theme-text">Mensagem</span>
                </a>
            </div>
        </div>
      </footer>
    </div>
  );
};

