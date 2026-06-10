import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { Download, ExternalLink, Camera, Calendar, MapPin, ChevronDown, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

import { T } from "../lib/theme";
import { useAuth } from "../hooks/useAuth";

interface EventData {
  id: string;
  title: string;
  dataEvento: string;
  location: string | null;
  coverPhotoUrl: string | null;
  coverPosition?: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  type: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE';
  slug?: string;
  captacao: {
    id: string;
    nome: string;
  } | null;
  edicao: {
    id: string;
    nome: string;
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
  
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-emerald-900/10 blur-[120px] rounded-full -m-64 opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
        <div className="text-[14px] font-display font-black uppercase tracking-[0.8em] text-zinc-300">FOTO SEGUNDO</div>
        <div className="text-[9px] font-medium uppercase tracking-[0.4em] text-emerald-500/80 animate-pulse">Iniciando Experiência</div>
        <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500/50 to-transparent" />
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#050505]">
      <div className="space-y-6 max-w-sm">
        <p className="text-4xl font-display font-black uppercase text-zinc-100">404</p>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">A galeria solicitada encontra-se indisponível ou privada.</p>
      </div>
    </div>
  );

  const captacaoName = event.captacao?.nome;
  const edicaoName = event.edicao?.nome;
  const initialChar = (captacaoName || edicaoName || "F").charAt(0).toUpperCase();
  const coverImg = (event.coverPhotoUrl || '').trim().replace(/\s/g, '');

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500 selection:text-white bg-[#030303] text-zinc-100 overflow-x-hidden">
      
      {/* GLASMORPHISM NAV */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="fixed top-0 w-full h-24 flex items-center justify-center z-50 transition-all duration-500"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          backdropFilter: scrollY.get() > 50 ? 'blur(20px)' : 'none'
        }}
      >
        <img 
          src="/logo.png" 
          alt="Foto Segundo" 
          className="cursor-pointer transition-all duration-500 hover:scale-105" 
          style={{ height: 18, objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.9)" }} 
          onClick={() => navigate('/')} 
        />
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-[10s] ease-out scale-105"
            style={{ 
              backgroundImage: `url(${coverImg})`,
              backgroundPosition: event.coverPosition || 'center'
            }}
          />
          {/* Gradients for blending */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/40 via-[#030303]/20 to-[#030303] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent h-full" />
        </motion.div>
        
        <div className="relative z-10 text-center px-6 w-full max-w-5xl mx-auto flex flex-col items-center mt-20">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
            className="space-y-8 w-full"
          >
            <p className="text-[10px] md:text-[12px] font-medium text-emerald-400 uppercase tracking-[0.5em] md:tracking-[1em]">Galeria Privada</p>
            <h1 className="text-5xl md:text-8xl lg:text-[120px] font-display font-medium uppercase tracking-tighter leading-[0.85] text-white drop-shadow-2xl">
              {event.title}
            </h1>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-12 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400 mt-12">
              <span className="flex items-center gap-3">
                <Calendar size={14} className="text-emerald-500/70" /> 
                {new Date(event.dataEvento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <span className="hidden md:block w-1 h-1 rounded-full bg-zinc-800" />
              <span className="flex items-center gap-3">
                <MapPin size={14} className="text-emerald-500/70" /> 
                {event.location || "Localização Exclusiva"}
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-zinc-600"
        >
          <span className="text-[8px] uppercase tracking-[0.3em] font-medium">Descubra</span>
          <ChevronDown size={20} className="animate-bounce" />
        </motion.div>
      </section>

      {/* MAIN CONTENT */}
      <section className="relative z-20 bg-[#030303] pb-32">
        <div className="max-w-6xl mx-auto px-6 space-y-32">

          {/* EDITORIAL ARTIST BLOCK */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-24 pt-24"
          >
            <div className="relative shrink-0 group">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-zinc-800/50 overflow-hidden bg-zinc-900/50 flex items-center justify-center text-4xl md:text-6xl font-display font-light text-emerald-500/50 transition-all duration-700 group-hover:border-emerald-500/30 group-hover:text-emerald-400">
                {initialChar}
              </div>
              <div className="absolute -bottom-2 -right-2 md:bottom-2 md:right-2 p-3 bg-[#030303] border border-zinc-800 rounded-full text-zinc-400 group-hover:text-emerald-500 group-hover:border-emerald-500/50 transition-all duration-500">
                <Camera size={18} strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="space-y-8 text-center md:text-left flex-1 md:pt-4">
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.4em]">Curadoria Visual</p>
                <h2 className="text-3xl md:text-5xl font-display font-medium uppercase tracking-tight text-zinc-100">
                  {captacaoName || edicaoName || 'Foto Segundo'}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {captacaoName && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-medium tracking-[0.3em] text-emerald-500/80">Fotografia & Captação</span>
                    <p className="text-sm md:text-base uppercase font-medium tracking-widest text-zinc-300">{captacaoName}</p>
                  </div>
                )}
                {edicaoName && edicaoName !== captacaoName && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-medium tracking-[0.3em] text-emerald-500/80">Edição & Color Grading</span>
                    <p className="text-sm md:text-base uppercase font-medium tracking-widest text-zinc-300">{edicaoName}</p>
                  </div>
                )}
              </div>
              
              <div className="w-12 h-px bg-zinc-800 mx-auto md:mx-0 mt-8" />
              <p className="text-[11px] md:text-xs font-light tracking-[0.1em] text-zinc-400 max-w-lg leading-loose mx-auto md:mx-0">
                Cada frame desta galeria foi meticulosamente curado e processado. Acreditamos que a fotografia é mais do que um registro; é a imortalização de um legado.
              </p>
            </div>
          </motion.div>

          {/* ACTION GATEWAYS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <motion.a 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              href={(event.lightroomUrl || event.driveUrl || `/e/${event.slug || event.id}`).trim().replace(/\s/g, '')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative h-[400px] bg-zinc-900/30 border border-zinc-800/50 hover:border-emerald-500/40 p-10 flex flex-col justify-between overflow-hidden transition-all duration-700 hover:bg-zinc-900/80"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-700">
                <Download size={160} strokeWidth={0.5} />
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="w-10 h-px bg-emerald-500/50 group-hover:w-20 transition-all duration-700" />
                <h3 className="text-3xl font-display font-medium uppercase text-zinc-100">Acervo<br/>Digital</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-500">Galeria em Alta Resolução</p>
              </div>
              
              <div className="relative z-10 flex items-center gap-6 mt-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white group-hover:text-emerald-400 transition-colors">Acessar Galeria</span>
                <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-500/10 transition-all duration-500">
                  <ArrowRight size={14} className="text-zinc-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.a>

            <motion.a 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              href={`${window.location.origin}/captura?eventId=${event.id}`}
              className="group relative h-[400px] bg-emerald-950/20 border border-emerald-900/30 hover:border-emerald-500/50 p-10 flex flex-col justify-between overflow-hidden transition-all duration-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-emerald-400">Live Connect</span>
                </div>
                <h3 className="text-3xl font-display font-medium uppercase text-zinc-100">Captura<br/>Phygital</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-emerald-500/60">Compartilhe sua visão</p>
              </div>
              
              <div className="relative z-10 mt-8 space-y-6">
                <p className="text-[11px] font-light tracking-[0.1em] text-zinc-400 max-w-[200px] leading-relaxed">
                  Envie suas fotos agora para serem processadas e impressas em tempo real.
                </p>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Abrir Câmera</span>
                  <div className="w-10 h-10 rounded-full border border-emerald-900 flex items-center justify-center group-hover:border-emerald-400 group-hover:bg-emerald-400/10 transition-all duration-500">
                    <Camera size={14} className="text-emerald-600 group-hover:text-emerald-400 transition-all" />
                  </div>
                </div>
              </div>
            </motion.a>
          </div>

          {/* UPSELL SECTION */}
          {products.length > 0 && (
            <div className="space-y-20 pt-16">
              <div className="text-center space-y-6">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.5em]">Boutique</p>
                <h3 className="text-4xl md:text-5xl font-display font-medium uppercase tracking-tight text-zinc-100">Obras Físicas</h3>
                <p className="text-[11px] uppercase font-light tracking-[0.2em] text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  Materialize suas memórias com nossa seleção de fine art e álbuns premium.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {products.map((p, idx) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: idx * 0.15 }}
                    className="group flex flex-col"
                  >
                    <div className="aspect-[3/4] bg-zinc-900 border border-zinc-800/50 relative overflow-hidden mb-8 group-hover:border-zinc-700 transition-all duration-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display font-light text-8xl text-zinc-800/30 uppercase tracking-tighter mix-blend-overlay group-hover:scale-105 transition-transform duration-1000">
                          {p.category.slice(0, 3)}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
                      
                      {idx === 0 && (
                        <div className="absolute top-6 left-6">
                          <span className="text-[8px] font-medium uppercase tracking-[0.3em] text-emerald-400 border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 backdrop-blur-sm">
                            Signature
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 px-2">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-lg font-display font-medium uppercase tracking-tight text-zinc-200 group-hover:text-white transition-colors">{p.name}</h4>
                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-500">{p.category}</span>
                      </div>
                      <p className="text-[11px] font-light tracking-[0.05em] leading-relaxed text-zinc-400 line-clamp-3">
                        {p.description || "Acabamento premium artesanal."}
                      </p>
                      
                      <div className="pt-6 flex justify-between items-center">
                        <span className="text-xl font-display font-medium text-emerald-500">
                          <span className="text-xs text-zinc-600 mr-1">R$</span>
                          {Number(p.sellingPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <button className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-emerald-400 transition-colors flex items-center gap-2">
                          Encomendar <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="text-center pt-24 pb-12 flex flex-col items-center gap-8">
             <div className="w-px h-12 bg-gradient-to-b from-zinc-800 to-transparent" />
             <img 
               src="/logo.png" 
               alt="Foto Segundo" 
               className="h-5 opacity-30 hover:opacity-100 transition-all cursor-pointer mix-blend-screen" 
               onClick={() => navigate('/')} 
             />
             <p className="text-[8px] font-medium uppercase tracking-[0.4em] text-zinc-600">
               © {new Date().getFullYear()} Foto Segundo
             </p>
          </footer>

        </div>
      </section>
    </div>
  );
}
