import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "../lib/api";
import { Download, ExternalLink, Camera, Calendar, MapPin, ChevronDown, ArrowRight, PlayCircle } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

import { useAuth } from "../hooks/useAuth";

interface Media {
  id: string;
  url: string;
  type: string;
  isGuest: boolean;
  createdAt: string;
  metadata?: {
    rawUrl?: string;
    printUrl?: string;
  };
}

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
    profileImageUrl?: string | null;
    description?: string | null;
  } | null;
  edicao: {
    id: string;
    nome: string;
    profileImageUrl?: string | null;
    description?: string | null;
  } | null;
  medias: Media[];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || 'OFFICIAL') as 'OFFICIAL' | 'GUEST' | 'VIDEO';
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 md:gap-6 relative overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-emerald-900/10 blur-[120px] rounded-full -m-64 opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-4 md:gap-8">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
        <div className="text-[14px] font-display font-bold uppercase tracking-[0.8em] text-zinc-300">FOTO SEGUNDO</div>
        <div className="text-[9px] font-medium uppercase tracking-[0.4em] text-emerald-500/80 animate-pulse">Iniciando Experiência</div>
        <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500/50 to-transparent" />
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center p-3 md:p-6 text-center bg-[#050505]">
      <div className="space-y-6 max-w-sm">
        <p className="text-2xl md:text-4xl font-display font-bold uppercase text-zinc-100">404</p>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">A galeria solicitada encontra-se indisponível ou privada.</p>
      </div>
    </div>
  );

  const coverImg = (event.coverPhotoUrl || '').trim().replace(/\s/g, '');

  const professionals = [];
  if (event.captacao) {
    professionals.push({ ...event.captacao, role: "Fotografia & Captação" });
  }
  if (event.edicao && event.edicao.id !== event.captacao?.id) {
    professionals.push({ ...event.edicao, role: "Edição & Color Grading" });
  } else if (event.edicao && event.edicao.id === event.captacao?.id && professionals.length > 0) {
    professionals[0].role = "Fotografia & Edição";
  }

  // Fallback if no professionals
  if (professionals.length === 0) {
    professionals.push({
      id: "fs",
      nome: "Foto Segundo",
      role: "Curadoria Visual",
      profileImageUrl: null,
      description: "Cada frame desta galeria foi meticulosamente curado e processado. Acreditamos que a fotografia é mais do que um registro; é a imortalização de um legado."
    });
  }

  const filteredMedias = (event.medias || []).filter(m => {
    if (activeTab === 'OFFICIAL') return !m.isGuest && m.type !== 'VIDEO';
    if (activeTab === 'GUEST') return m.isGuest && m.type !== 'VIDEO';
    if (activeTab === 'VIDEO') return m.type === 'VIDEO';
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'ASC' ? timeA - timeB : timeB - timeA;
  });

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
        
        <div className="relative z-10 text-center px-3 md:px-6 w-full max-w-5xl mx-auto flex flex-col items-center mt-20">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
            className="space-y-8 w-full"
          >
            <p className="text-[10px] md:text-[12px] font-medium text-emerald-400 uppercase tracking-[0.5em] md:tracking-[1em]">Galeria Privada</p>
            <h1 className="text-3xl md:text-5xl md:text-8xl lg:text-[120px] font-display font-medium uppercase leading-[0.85] text-white drop-shadow-2xl">
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
        <div className="max-w-6xl mx-auto px-3 md:px-6 space-y-32">

          {/* EDITORIAL ARTIST BLOCK */}
          <div className="flex flex-col gap-16 pt-24">
            {professionals.map((prof, idx) => (
              <motion.div 
                key={prof.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: idx * 0.2 }}
                className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 md:gap-16"
              >
                <div className="relative shrink-0 group">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-zinc-800/50 overflow-hidden bg-zinc-900/50 flex items-center justify-center text-2xl md:text-4xl md:text-5xl font-display font-normal text-emerald-500/50 transition-all duration-700 group-hover:border-emerald-500/30 group-hover:text-emerald-400">
                    {prof.profileImageUrl ? (
                      <img src={prof.profileImageUrl} alt={prof.nome} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                    ) : (
                      prof.nome?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 md:bottom-2 md:right-2 p-3 bg-[#030303] border border-zinc-800 rounded-full text-zinc-400 group-hover:text-emerald-500 group-hover:border-emerald-500/50 transition-all duration-500">
                    <Camera size={18} strokeWidth={1.5} />
                  </div>
                </div>
                
                <div className="space-y-6 text-center md:text-left flex-1 md:pt-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-emerald-500/80 uppercase tracking-[0.4em]">{prof.role}</p>
                    <h2 className="text-3xl md:text-4xl font-display font-medium uppercase text-zinc-100">
                      {prof.nome}
                    </h2>
                  </div>
                  
                  <div className="w-12 h-px bg-zinc-800 mx-auto md:mx-0 mt-6" />
                  <p className="text-[11px] md:text-xs font-normal tracking-[0.1em] text-zinc-400 max-w-2xl leading-loose mx-auto md:mx-0 whitespace-pre-wrap">
                    {prof.description || "Profissional dedicado a transformar momentos em legados visuais através de uma curadoria meticulosa e olhar apurado."}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* GALLERY SECTION */}
          <div className="pt-16" id="gallery">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 mb-12">
              <div className="flex items-center gap-4 border-b border-zinc-800 pb-px">
                <button
                  onClick={() => setSearchParams({ tab: 'OFFICIAL' }, { replace: true })}
                  className={`pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${activeTab === 'OFFICIAL' ? 'text-emerald-400 border-b border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Curadoria Oficial
                </button>
                <button
                  onClick={() => setSearchParams({ tab: 'GUEST' }, { replace: true })}
                  className={`pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${activeTab === 'GUEST' ? 'text-emerald-400 border-b border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Live Connect
                </button>
                <button
                  onClick={() => setSearchParams({ tab: 'VIDEO' }, { replace: true })}
                  className={`pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${activeTab === 'VIDEO' ? 'text-emerald-400 border-b border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Cinematografia
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                  className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  <ChevronDown size={14} className={`transition-transform ${sortOrder === 'ASC' ? 'rotate-180' : ''}`} />
                  {sortOrder === 'DESC' ? 'Mais Recentes' : 'Mais Antigas'}
                </button>

                <a 
                  href={`${window.location.origin}/captura?eventId=${event.id}`}
                  className="flex items-center gap-2 px-4 py-2 border border-emerald-900 rounded-full text-[9px] uppercase tracking-[0.2em] font-medium text-emerald-400 hover:bg-emerald-900/30 transition-colors"
                >
                  <Camera size={12} />
                  Enviar Foto
                </a>
              </div>
            </div>

            {/* EXTERNAL LINKS SECTION (DRIVE / LIGHTROOM) */}
            {activeTab === 'OFFICIAL' && (event.lightroomUrl || event.driveUrl) && (
              <div className="mb-12 p-3 md:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-sm font-medium uppercase tracking-widest text-emerald-400">Acervo Completo em Alta Resolução</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-lg">
                    Acesse o repositório externo configurado pelo fotógrafo para visualizar ou baixar todas as fotos em qualidade original.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {event.lightroomUrl && (
                    <a 
                      href={event.lightroomUrl.trim().replace(/\s/g, '')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 md:px-6 py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-100"
                    >
                      <ExternalLink size={14} />
                      Lightroom
                    </a>
                  )}
                  {event.driveUrl && (
                    <a 
                      href={event.driveUrl.trim().replace(/\s/g, '')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 md:px-6 py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-100"
                    >
                      <Download size={14} />
                      Google Drive
                    </a>
                  )}
                </div>
              </div>
            )}

            {filteredMedias.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-zinc-800 rounded-3xl">
                <Camera size={32} className="text-zinc-700" />
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.2em]">Nenhuma mídia encontrada nesta categoria</p>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-3 md:gap-6 space-y-6">
                {filteredMedias.map((midia, idx) => (
                  <motion.div
                    key={midia.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: (idx % 10) * 0.1 }}
                    className="relative group overflow-hidden bg-zinc-900 break-inside-avoid"
                  >
                    <img 
                      src={midia.url} 
                      alt="Midia do Evento" 
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4 backdrop-blur-sm">
                      <a 
                        href={midia.metadata?.rawUrl || midia.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-emerald-400 hover:border-emerald-400 hover:bg-emerald-900/20 transition-all"
                      >
                        <Download size={18} />
                      </a>
                      <a 
                        href={midia.metadata?.rawUrl || midia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-emerald-400 hover:border-emerald-400 hover:bg-emerald-900/20 transition-all"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>

                    {midia.type === 'VIDEO' && (
                      <div className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white">
                        <PlayCircle size={16} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* UPSELL SECTION */}
          {products.length > 0 && (
            <div className="space-y-20 pt-16">
              <div className="text-center space-y-6">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.5em]">Boutique</p>
                <h3 className="text-2xl md:text-4xl md:text-5xl font-display font-medium uppercase text-zinc-100">Obras Físicas</h3>
                <p className="text-[11px] uppercase font-normal tracking-[0.2em] text-zinc-400 max-w-xl mx-auto leading-relaxed">
                  Materialize suas memórias com nossa seleção de fine art e álbuns premium.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
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
                        <span className="font-display font-normal text-8xl text-zinc-800/30 uppercase mix-blend-overlay group-hover:scale-105 transition-transform duration-1000">
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
                        <h4 className="text-lg font-display font-medium uppercase text-zinc-200 group-hover:text-white transition-colors">{p.name}</h4>
                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-500">{p.category}</span>
                      </div>
                      <p className="text-[11px] font-normal tracking-[0.05em] leading-relaxed text-zinc-400 line-clamp-3">
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
          <footer className="text-center pt-24 pb-12 flex flex-col items-center gap-4 md:gap-8">
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
