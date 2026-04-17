import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Calendar, Camera, Building2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../contexts/AuthContext";

interface EventCard {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  cartorio: string;
  coverPhotoUrl: string | null;
}

const CATEGORIES = ["Todos", "Casamento Civil", "Pré-Wedding", "Aniversários", "Bodas"];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    console.log("[DEBUG] HomePage Mounted");
    fetchEvents();
    return () => console.log("[DEBUG] HomePage Unmounted");
  }, [search]);

  const fetchEvents = async () => {
    if (loading && events.length > 0) return; // Evita chamadas duplas se já estiver carregando
    try {
      setLoading(true);
      const { data } = await API.get(`/public/events?q=${search}`);
      setEvents(data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navbar Luxuosa */}
      <nav className="fixed top-0 w-full z-50 glass px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="text-xl font-black italic tracking-tighter uppercase">
          Foto Segundo <span className="text-brand-indigo">.</span>
        </div>
        <Link 
          to="/login"
          className="text-xs font-bold uppercase tracking-widest hover:text-brand-indigo transition-colors"
        >
          Acesso Administrativo
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: 'url("/assets/hero-bg.png")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
        </div>

        <div className="relative z-10 w-full max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-6 leading-none">
              Encontre o seu <br />
              <span className="text-brand-indigo">Grande Momento</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
              A elegância eterna do seu casamento civil, capturada com exclusividade e pronta para download.
            </p>

            {/* BARRA DE BUSCA PREMIUM */}
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-indigo to-violet-600 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative glass rounded-full p-2 flex items-center">
                <Search className="ml-4 text-zinc-500" size={20} />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome dos noivos, data ou cartório..."
                  className="bg-transparent border-none focus:ring-0 w-full px-4 py-3 text-white placeholder-zinc-500 text-sm"
                />
                <button 
                  onClick={fetchEvents}
                  className="bg-brand-indigo text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* CHIPS DE CATEGORIA */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === cat 
                      ? "bg-white text-black" 
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Galeria de Eventos */}
      <section className="px-6 py-20 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Eventos Recentes</h2>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mt-2">{events.length} resultados encontrados</p>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {Array.isArray(events) && events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/eventos/${event.id}`)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10">
                    <img 
                      src={event.coverPhotoUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800"}
                      alt={event.nomeNoivos}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-brand-indigo uppercase tracking-widest mb-2">
                        <MapPin size={10} />
                        {event.cartorio}
                      </div>
                      <h3 className="text-lg font-black italic uppercase leading-tight mb-1">
                        {event.nomeNoivos}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase font-bold">
                        <Calendar size={10} />
                        {new Date(event.dataEvento).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {events.length === 0 && !loading && (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/5">
              <Camera className="mx-auto text-zinc-700 mb-4" size={48} />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Nenhum evento encontrado para sua busca.</p>
            </div>
          )}
        </div>
      </section>

      {/* Como Funciona & Call to Action */}
      <section className="px-6 py-20 bg-brand-indigo/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center md:text-left">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
              <Search className="text-brand-indigo" />
            </div>
            <h4 className="text-xl font-black uppercase mb-4">Ache seu Evento</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">Localize seu casamento civil pelo nome dos noivos ou pela data da celebração em nosso sistema exclusivo.</p>
          </div>
          <div className="text-center md:text-left">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
              <ArrowRight className="text-brand-indigo" />
            </div>
            <h4 className="text-xl font-black uppercase mb-4">Acesse a Galeria</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">Visualize os momentos capturados e selecione as fotos que deseja eternizar para sua família.</p>
          </div>
          <div className="text-center md:text-left">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
              <Camera className="text-brand-indigo" />
            </div>
            <h4 className="text-xl font-black uppercase mb-4">Baixe na Hora</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">Após a confirmação, o acesso é liberado instantaneamente via Lightroom e Google Drive.</p>
          </div>
        </div>
      </section>

      {/* Rodapé Luxuoso */}
      <footer className="px-6 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <div className="text-xl font-black italic uppercase tracking-tighter mb-2">Foto Segundo</div>
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest tracking-[0.4em]">Midnight Luxury Edition</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-indigo flex items-center gap-2">
              <Camera size={14} /> Seja um Fotógrafo
            </Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-indigo flex items-center gap-2">
              <Building2 size={14} /> Para Cartórios
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
