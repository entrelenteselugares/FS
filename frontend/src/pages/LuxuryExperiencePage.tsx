import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { Download, ExternalLink, Camera, Calendar, MapPin, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

import { T } from "../lib/theme";
import { useAuth } from "../hooks/useAuth";

interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  location: string | null;
  coverPhotoUrl: string | null;
  coverPosition?: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  type: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE';
  slug?: string;
  captacao: {
    nome: string;
    user: {
      nome: string;
    }
  } | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  description: string | null;
  sellingPrice: number;
  active: boolean;
}

export default function LuxuryExperiencePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const handleScroll = () => {}; // Mantido se precisar no futuro, mas removido o estado não usado
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (id) {
      const params = user?.id ? { userId: user.id } : {};
      API.get(`/public/events/${id}`, { params })
        .then(r => setEvent(r.data))
        .catch(err => console.error("Erro ao carregar experiência:", err))
        .finally(() => setLoading(false));
    }
  }, [id, user?.id]);

  useEffect(() => {
    API.get("/public/print-catalog")
      .then(r => setProducts(r.data.filter((p: Product) => p.active).slice(0, 3)))
      .catch(err => console.error("Erro ao carregar catálogo:", err));
  }, []);

  useEffect(() => {
    if (event?.type === 'PHOTO_MARKETPLACE') {
      navigate(`/e/${event.slug || event.id}`);
    }
  }, [event, navigate]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative overflow-hidden bg-theme-bg">
      <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
        <div className="text-[18px] font-display font-black uppercase tracking-[0.8em] italic text-theme-text">FOTO SEGUNDO</div>
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Preparando Experiência de Luxo</div>
        <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500 to-transparent" />
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: T.bg }}>
      <div className="space-y-6 max-w-sm">
        <p className="text-4xl font-heading font-black italic uppercase" style={{ color: T.text }}>404</p>
        <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest leading-relaxed">Não conseguimos localizar esta galeria. Verifique o link com o seu artista.</p>
      </div>
    </div>
  );

  const artistName = event.captacao?.user?.nome || "Artista Foto Segundo";

  return (
    <div className="min-h-screen font-sans selection:bg-brand-tactical selection:text-zinc-950" style={{ background: T.bg, color: T.text }}>
      <nav className="h-20 flex items-center justify-center px-8 border-b sticky top-0 z-50 backdrop-blur-xl" style={{ borderColor: T.border, background: `${T.bg}e6` }}>
        <img 
          src="/logo.png" 
          alt="Foto Segundo" 
          className="cursor-pointer hover:opacity-80 transition-all" 
          style={{ height: 20, objectFit: "contain", filter: "var(--logo-filter)" }} 
          onClick={() => navigate('/')} 
        />
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-[50vh] md:h-[70vh] flex items-center justify-center overflow-hidden border-b" style={{ borderColor: T.border }}>
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{ 
            backgroundImage: `url(${(event.coverPhotoUrl || '').trim().replace(/\s/g, '')})`,
            objectPosition: event.coverPosition || 'center',
            backgroundPosition: event.coverPosition || 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-[1]" />
        
        <div className="relative z-10 text-center space-y-8 px-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="space-y-4"
          >
            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] italic">Galeria Exclusiva</p>
            <h1 className="text-5xl md:text-8xl font-display font-black uppercase italic tracking-tighter leading-none text-theme-text">
              {event.nomeNoivos}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-6 text-[10px] font-bold uppercase tracking-widest mt-6 text-theme-muted">
              <span className="flex items-center gap-2"><Calendar size={12} className="text-emerald-500" /> {new Date(event.dataEvento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-2"><MapPin size={12} className="text-emerald-500" /> {event.location || "Localização Privada"}</span>
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
      <section className="max-w-7xl mx-auto px-6 py-6 md:py-12 space-y-8 md:space-y-12">
        
        {/* ARTIST INFO */}
        <div className="flex flex-col md:flex-row items-center gap-12 border-y py-10" style={{ borderColor: T.border }}>
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border border-emerald-500/30 overflow-hidden shadow-xl bg-theme-card">
               <div className="w-full h-full flex items-center justify-center text-emerald-500 text-2xl font-display italic font-black">
                  {artistName.charAt(0)}
               </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 bg-emerald-500 text-zinc-950 rounded-full shadow-lg"><Camera size={14} /></div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Captura e Visão</p>
            <h2 className="text-3xl font-heading font-black uppercase italic tracking-tight" style={{ color: T.text }}>{artistName}</h2>
            <p className="text-xs uppercase font-medium tracking-widest max-w-md leading-relaxed" style={{ color: T.text2 }}>Sua história capturada com precisão e alma sob a curadoria tática da Foto Segundo.</p>
          </div>
        </div>

        {/* ACCESS BOX & PHYGITAL CAPTURE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6 p-8 relative overflow-hidden group hover:border-brand-tactical/40 transition-all border" style={{ background: T.bgCard, borderColor: T.border }}>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color: T.text }}><Download size={120} /></div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-display font-black uppercase italic text-theme-text">Seu Legado Digital</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-theme-muted">Galeria completa em alta resolução</p>
            </div>
            <p className="text-xs uppercase font-medium leading-relaxed italic text-theme-muted">Acesse todas as memórias do seu dia especial. Cada clique foi processado para garantir a máxima fidelidade técnica e estética.</p>
            <a 
              href={(event.lightroomUrl || event.driveUrl || `/e/${event.slug || event.id}`).trim().replace(/\s/g, '')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 px-10 py-5 bg-emerald-500 text-white font-display font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:scale-[1.02] transition-all"
            >
              ACESSAR GALERIA <ExternalLink size={14} />
            </a>
          </div>

          <div className="space-y-6 p-8 border flex flex-col justify-between group hover:border-emerald-500/40 transition-all bg-emerald-500/5 border-emerald-500/20">
             <div className="space-y-4">
               <div className="flex items-center gap-3 text-emerald-500">
                  <Camera size={20} />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Captura Phygital</span>
               </div>
               <h3 className="text-2xl font-display font-black uppercase italic text-theme-text">Envie sua Foto</h3>
               <p className="text-xs uppercase font-bold tracking-widest leading-relaxed text-theme-muted">Faça parte do evento! Envie suas fotos agora para serem impressas na hora pelo nosso artista.</p>
             </div>
             
             <div className="pt-6">
                <a 
                  href={`${window.location.origin}/captura?eventId=${event.id}`}
                  className="inline-flex items-center gap-4 px-8 py-4 border border-emerald-500 text-emerald-500 font-display font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
                >
                  ABRIR CÂMERA <Camera size={14} />
                </a>
                <p className="text-[8px] uppercase font-bold tracking-widest mt-4 text-theme-subtle">Disponível apenas durante o evento</p>
             </div>
          </div>
        </div>

        {/* UPSELL SECTION (Inteligência de Venda) */}
        {products.length > 0 && (
          <div className="space-y-10 py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center gap-4">
                <div className="h-px w-12 bg-emerald-500/30" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">Eternize seu Momento</p>
                <div className="h-px w-12 bg-emerald-500/30" />
              </div>
              <h3 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter text-theme-text">Produtos de Luxo</h3>
              <p className="text-xs uppercase font-bold tracking-[0.2em] max-w-xl mx-auto text-theme-muted">Transforme suas memórias digitais em obras de arte físicas com acabamento de alta costura.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {products.map((p, idx) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                >
                  <div className="p-8 space-y-8 group hover:border-emerald-500/40 transition-all relative overflow-hidden border border-theme-border bg-theme-card">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    
                    <div className="aspect-[4/5] bg-black/40 relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-all duration-700">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="italic font-display font-black text-6xl select-none uppercase tracking-tighter opacity-10 text-theme-text">
                        {p.category.slice(0, 3)}
                      </div>
                    {/* Badge de Sugestão Inteligente */}
                    {idx === 0 && (
                      <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest shadow-xl">
                        Mais Desejado
                      </div>
                    )}
                  </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">{p.category}</p>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-theme-subtle">SKU: {p.sku}</span>
                      </div>
                      <h4 className="text-xl font-display font-black uppercase italic tracking-tight text-theme-text">{p.name}</h4>
                      <p className="text-[11px] uppercase font-medium leading-relaxed text-theme-muted">{p.description || "Acabamento premium com materiais importados e durabilidade secular."}</p>
                    </div>

                    <div className="pt-6 border-t border-theme-border flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-theme-subtle">Investimento</p>
                        <span className="text-2xl font-display font-black text-emerald-500 italic">R$ {Number(p.sellingPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <button className="px-8 py-4 bg-white/5 border border-theme-border text-theme-text font-display font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                        ENCOMENDAR
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center pt-8">
              <p className="text-[9px] text-theme-muted uppercase font-bold tracking-[0.4em] italic opacity-40">Frete tático incluso para todo o território nacional</p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center pt-12 space-y-6 pb-12">
           <div className="h-px w-24 mx-auto" style={{ background: T.border }} />
           <img 
             src="/logo.png" 
             alt="Foto Segundo" 
             className="h-6 mx-auto opacity-40 grayscale hover:opacity-100 transition-all cursor-pointer" 
             onClick={() => navigate('/')} 
           />
        </footer>

      </section>
    </div>
  );
}
