import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API } from "../lib/api";
import { Download, ExternalLink, Heart, Camera, Calendar, MapPin, Share2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  location: string | null;
  coverPhotoUrl: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  captacao: {
    nome: string;
    user: {
      nome: string;
    }
  } | null;
}

export default function LuxuryExperiencePage() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (id) {
      API.get(`public/events/${id}`)
        .then(r => setEvent(r.data))
        .catch(err => console.error("Erro ao carregar experiência:", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 border-2 border-brand-tactical/20 border-t-brand-tactical rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] animate-pulse">Preparando sua Galeria de Luxo...</p>
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-sm">
        <p className="text-4xl font-heading font-black text-theme-text italic uppercase">404</p>
        <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest leading-relaxed">Não conseguimos localizar esta galeria. Verifique o link com o seu artista.</p>
      </div>
    </div>
  );

  const artistName = event.captacao?.user?.nome || "Artista Foto Segundo";

  return (
    <div className="min-h-screen bg-[#050505] text-theme-text font-sans selection:bg-brand-tactical selection:text-zinc-950">
      {/* NAVEGAÇÃO FLUTUANTE */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 p-6 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : ''}`}>
        <div className="text-xl font-heading font-black text-theme-text italic tracking-tighter">FOTO SEGUNDO</div>
        <button className="p-3 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical hover:bg-brand-tactical hover:text-zinc-950 transition-all">
          <Share2 size={18} />
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${event.coverPhotoUrl || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/40 to-[#050505]" />
        
        <div className="relative z-10 text-center space-y-8 px-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="space-y-4"
          >
            <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.6em] italic">Galeria Exclusiva</p>
            <h1 className="text-5xl md:text-8xl font-heading font-black text-theme-text uppercase italic tracking-tighter leading-none">
              {event.nomeNoivos}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-6 text-[10px] font-bold text-theme-muted uppercase tracking-widest mt-6">
              <span className="flex items-center gap-2"><Calendar size={12} className="text-brand-tactical" /> {new Date(event.dataEvento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-2"><MapPin size={12} className="text-brand-tactical" /> {event.location || "Localização Privada"}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="pt-12"
          >
            <ChevronDown size={32} className="text-brand-tactical animate-bounce mx-auto opacity-50" />
          </motion.div>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-32 space-y-32">
        
        {/* ARTIST INFO */}
        <div className="flex flex-col md:flex-row items-center gap-12 border-y border-theme-border/20 py-24">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-2 border-brand-tactical/30 overflow-hidden">
               <div className="w-full h-full bg-theme-bg-muted flex items-center justify-center text-brand-tactical text-2xl font-heading italic font-black">
                  {artistName.charAt(0)}
               </div>
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-brand-tactical text-zinc-950 rounded-full shadow-lg"><Camera size={16} /></div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Captura e Visão</p>
            <h2 className="text-3xl font-heading font-black text-theme-text uppercase italic tracking-tight">{artistName}</h2>
            <p className="text-xs text-theme-muted uppercase font-medium tracking-widest max-w-md leading-relaxed">Sua história capturada com precisão e alma sob a curadoria tática da Foto Segundo.</p>
          </div>
        </div>

        {/* ACCESS BOX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8 p-12 bg-theme-bg-muted border border-theme-border/60 relative overflow-hidden group hover:border-brand-tactical/40 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Download size={120} /></div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic">Seu Legado Digital</h3>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold">Galeria completa em alta resolução</p>
            </div>
            <p className="text-xs text-theme-muted/60 uppercase font-medium leading-relaxed italic">Acesse todas as memórias do seu dia especial. Cada clique foi processado para garantir a máxima fidelidade técnica e estética.</p>
            <a 
              href={event.lightroomUrl || event.driveUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 px-10 py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-tactical/10 hover:brightness-110 transition-all"
            >
              ACESSAR GALERIA <ExternalLink size={14} />
            </a>
          </div>

          <div className="space-y-8 p-12 bg-brand-tactical/5 border border-brand-tactical/20 flex flex-col justify-center">
             <div className="flex items-center gap-3 text-brand-tactical">
                <Heart size={20} fill="currentColor" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Experiência de Suporte</span>
             </div>
             <p className="text-xs text-theme-muted uppercase font-bold tracking-widest leading-relaxed">Precisa de ajuda com o download ou quer encomendar um álbum impresso de luxo? Nossa central está à disposição.</p>
             <button className="text-[10px] font-black text-brand-tactical uppercase tracking-widest border-b border-brand-tactical/30 pb-1 hover:border-brand-tactical transition-all w-fit">ENTRAR EM CONTATO</button>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-center pt-32 space-y-6">
           <div className="h-px w-24 bg-theme-border/60 mx-auto" />
           <p className="text-[9px] text-theme-muted uppercase font-black tracking-[0.5em] italic">Foto Segundo · Midnight Luxury Experience</p>
        </footer>

      </section>
    </div>
  );
}
