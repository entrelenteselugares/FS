import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Camera, ShieldCheck, Star, Filter, X } from "lucide-react";
import { API } from "../lib/api";
import { Navbar } from "../components/Navbar";

interface ProfCard {
  id: string;
  userId: string;
  nome: string;
  profileImageUrl: string | null;
  address: string | null;
  isVerified: boolean;
  services: string[];
  experienceYears: number;
  totalMissions: number;
  agilityPoints: number;
}

const SERVICE_OPTIONS = ["FOTO", "VÍDEO", "EDIÇÃO", "IMPRESSÃO"];

export default function ProfissionaisPage() {
  const [profs, setProfs] = useState<ProfCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProfs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (city) params.set("city", city);
      if (service) params.set("service", service);
      const { data } = await API.get(`/marketplace/profissionais?${params.toString()}`);
      setProfs(data.profissionais || []);
    } catch {
      setProfs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, city, service]);

  useEffect(() => { fetchProfs(); }, [fetchProfs]);

  const cityFromAddress = (addr: string | null) => {
    if (!addr) return null;
    const parts = addr.split("|");
    return parts[4] ? `${parts[4]}${parts[5] ? `, ${parts[5]}` : ""}` : null;
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-theme-border/20 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(133,185,172,0.08),transparent_70%)]" />
        <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical text-[10px] font-black uppercase tracking-widest italic">
              <Star size={10} fill="currentColor" />
              Fotógrafos Verificados · Assinantes Pro
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-black text-white uppercase italic tracking-tighter leading-none">
              Diretório de<br />
              <span className="text-brand-tactical">Profissionais</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto font-medium leading-relaxed">
              Encontre fotógrafos verificados pela Foto Segundo para coberturas, retratos, eventos corporativos e mais.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-theme-border/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-brand-tactical/50 outline-none transition-all"
              placeholder="Buscar por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full md:w-48 bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-brand-tactical/50 outline-none"
              placeholder="Cidade..."
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select
              className="w-full md:w-44 bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 text-sm text-white focus:border-brand-tactical/50 outline-none appearance-none cursor-pointer"
              value={service}
              onChange={e => setService(e.target.value)}
            >
              <option value="">Todas as áreas</option>
              {SERVICE_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : profs.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <div className="text-zinc-700 flex justify-center"><Camera size={64} /></div>
            <p className="text-zinc-500 text-sm uppercase tracking-widest font-black">
              Nenhum profissional encontrado
            </p>
            <p className="text-zinc-600 text-xs">
              {search || city || service
                ? "Tente outros filtros para encontrar profissionais disponíveis."
                : "Seja o primeiro profissional assinante a aparecer aqui."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                {profs.length} profissional{profs.length !== 1 ? "is" : ""} disponível{profs.length !== 1 ? "is" : ""}
              </p>
              <div className="h-px flex-1 bg-zinc-800/50 mx-6" />
              <p className="text-[10px] text-brand-tactical uppercase tracking-widest font-black italic">Ordenados por Pontuação</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profs.map((prof, i) => {
                const location = cityFromAddress(prof.address);
                return (
                  <motion.div
                    key={prof.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/pro/${prof.id}`} className="group block">
                      <div className="bg-zinc-900 border border-zinc-800 group-hover:border-brand-tactical/40 transition-all duration-300 overflow-hidden">
                        {/* Avatar Banner */}
                        <div className="relative h-40 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
                          {prof.profileImageUrl ? (
                            <img
                              src={prof.profileImageUrl}
                              alt={prof.nome}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="text-zinc-700"><Camera size={48} /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                          {prof.isVerified && (
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-brand-tactical/20 border border-brand-tactical/30 backdrop-blur-sm px-2.5 py-1">
                              <ShieldCheck size={10} className="text-brand-tactical" />
                              <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest">PRO</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h3 className="text-base font-heading font-black text-white uppercase italic tracking-tight group-hover:text-brand-tactical transition-colors">
                              {prof.nome}
                            </h3>
                            {location && (
                              <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-bold uppercase">
                                <MapPin size={10} /> {location}
                              </p>
                            )}
                          </div>

                          {/* Services */}
                          <div className="flex flex-wrap gap-1.5">
                            {prof.services.slice(0, 4).map(s => (
                              <span key={s} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                {s}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
                            <div className="text-center">
                              <p className="text-base font-heading font-black text-white italic">{prof.experienceYears || 0}</p>
                              <p className="text-[7px] text-zinc-600 uppercase tracking-widest font-black">Anos</p>
                            </div>
                            <div className="text-center border-x border-zinc-800">
                              <p className="text-base font-heading font-black text-white italic">{prof.totalMissions}</p>
                              <p className="text-[7px] text-zinc-600 uppercase tracking-widest font-black">Missões</p>
                            </div>
                            <div className="text-center">
                              <p className="text-base font-heading font-black text-brand-tactical italic">{prof.agilityPoints}</p>
                              <p className="text-[7px] text-zinc-600 uppercase tracking-widest font-black">Pontos</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
