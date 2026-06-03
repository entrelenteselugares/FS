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
  coverImageUrl: string | null;
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
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null);
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
      if (nearby) {
        params.set("lat", nearby.lat.toString());
        params.set("lng", nearby.lng.toString());
      }
      const { data } = await API.get(`/marketplace/profissionais?${params.toString()}`);
      setProfs(data.profissionais || []);
    } catch {
      setProfs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, city, service, nearby]);

  useEffect(() => { fetchProfs(); }, [fetchProfs]);

  const toggleNearby = () => {
    if (nearby) {
      setNearby(null);
    } else {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setNearby({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, (err) => {
          console.error("GPS Error", err);
          alert("Não foi possível obter sua localização.");
        });
      }
    }
  };

  const cityFromAddress = (addr: string | null) => {
    if (!addr) return null;
    const parts = addr.split("|");
    return parts[4] ? `${parts[4]}${parts[5] ? `, ${parts[5]}` : ""}` : null;
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      <Navbar />

      {/* Header com Dark Glassmorphism */}
      <div className="relative overflow-hidden border-b border-theme-border bg-black min-h-[350px] flex flex-col justify-center">
        <div 
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=2000')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.3) saturate(1.2)"
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[var(--bg)] z-0 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-tactical/10 border border-brand-tactical text-brand-tactical text-[10px] font-black uppercase tracking-widest italic shadow-[0_0_15px_rgba(133,185,172,0.2)]">
              <Star size={10} fill="currentColor" />
              Fotógrafos Verificados
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl">
              Diretório de<br />
              <span className="text-brand-tactical" style={{ textShadow: "0 0 30px var(--brand)" }}>Profissionais</span>
            </h1>
            
            <p className="text-white/80 text-sm max-w-lg mx-auto font-medium leading-relaxed drop-shadow-md">
              Encontre fotógrafos verificados pela Foto Segundo para coberturas, retratos, eventos corporativos e mais.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-theme-border py-2 md:py-3.5 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-black/80 border-2 border-theme-border focus-within:border-brand-tactical focus-within:shadow-[0_0_20px_rgba(133,185,172,0.2)] p-1 md:p-1.5 rounded-xl md:rounded-full grid grid-cols-2 md:flex md:flex-row items-center gap-0 md:gap-3 transition-all duration-300">
            {/* Search Input */}
            <div className="col-span-2 md:flex-1 relative flex items-center group border-b md:border-b-0 border-theme-border pb-1 md:pb-0 mb-1 md:mb-0">
              <Search size={14} className="absolute left-3 text-theme-text-muted group-focus-within:text-brand-tactical transition-colors" />
              <input
                className="w-full bg-transparent pl-9 pr-8 py-1.5 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-theme-text placeholder-theme-text-muted outline-none"
                placeholder="Buscar profissional por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 text-theme-text/50 hover:text-theme-text transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Vertical Divider (Desktop only) */}
            <div className="hidden md:block h-6 w-px bg-theme-border/60" />

            {/* City Input & Perto de Mim */}
            <div className="col-span-1 md:w-40 relative flex items-center group border-r border-theme-border md:border-r-0">
              <MapPin size={13} className="absolute left-2 md:left-3 text-theme-text-muted group-focus-within:text-brand-tactical transition-colors" />
              <input
                className="w-full bg-transparent pl-7 md:pl-8 pr-8 py-1.5 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-theme-text placeholder-theme-text-muted outline-none"
                placeholder="Cidade..."
                value={city}
                onChange={e => setCity(e.target.value)}
              />
              <button
                onClick={toggleNearby}
                title="Perto de Mim"
                className={`absolute right-1 p-1 rounded-full transition-all ${
                  nearby
                    ? "bg-brand-tactical text-black shadow-[0_0_10px_rgba(133,185,172,0.5)]"
                    : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-muted"
                }`}
              >
                <MapPin size={10} className={nearby ? "animate-pulse" : ""} />
              </button>
            </div>

            {/* Vertical Divider (Desktop only) */}
            <div className="hidden md:block h-6 w-px bg-theme-border/60" />

            {/* Specialty Select */}
            <div className="col-span-1 md:w-40 relative flex items-center group">
              <Filter size={12} className="absolute left-3 md:left-3 text-theme-text-muted group-focus-within:text-brand-tactical pointer-events-none transition-colors" />
              <select
                className="w-full bg-transparent pl-8 md:pl-8 pr-6 md:pr-8 py-1.5 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-theme-text outline-none appearance-none cursor-pointer"
                value={service}
                onChange={e => setService(e.target.value)}
              >
                <option value="" className="bg-theme-bg text-theme-text">Todas as Áreas</option>
                {SERVICE_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-theme-bg text-theme-text">{s}</option>
                ))}
              </select>
              <div className="absolute right-2 md:right-3 pointer-events-none text-theme-text-muted text-[8px]">▼</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-theme-bg-muted border border-theme-border shadow-sm animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : profs.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <div className="text-theme-text/40 flex justify-center"><Camera size={64} /></div>
            <p className="text-theme-text/60 text-sm uppercase tracking-widest font-black">
              Nenhum profissional encontrado
            </p>
            <p className="text-theme-text/50 text-xs">
              {search || city || service
                ? "Tente outros filtros para encontrar profissionais disponíveis."
                : "Seja o primeiro profissional assinante a aparecer aqui."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] text-theme-text/60 uppercase tracking-widest font-black">
                {profs.length} profissional{profs.length !== 1 ? "is" : ""} disponível{profs.length !== 1 ? "is" : ""}
              </p>
              <div className="h-px flex-1 bg-theme-border/40 mx-6" />
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
                      <div className="bg-theme-bg-muted border-2 border-theme-border group-hover:border-brand-tactical/50 transition-all duration-300 overflow-hidden shadow-sm group-hover:shadow-[0_0_20px_rgba(133,185,172,0.15)] rounded-2xl">
                        {/* Avatar Banner */}
                        <div className="relative h-40 bg-theme-surface flex items-end overflow-hidden group-hover:border-brand-tactical/40 transition-all border-b-2 border-theme-border">
                          {/* Banner Image */}
                          <div className="absolute inset-0">
                            {prof.coverImageUrl ? (
                              <img
                                src={prof.coverImageUrl}
                                alt="Cover"
                                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-theme-bg-muted flex items-center justify-center opacity-30">
                                <Camera size={48} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-theme-surface via-theme-surface/40 to-transparent" />
                          </div>

                          {/* Profile Image & Badges */}
                          <div className="relative z-10 w-full px-5 pb-4 flex justify-between items-end">
                            <div className="w-16 h-16 rounded-full border-2 border-theme-surface bg-theme-bg overflow-hidden flex items-center justify-center text-xl font-black text-theme-text shadow-lg">
                              {prof.profileImageUrl ? (
                                <img
                                  src={prof.profileImageUrl}
                                  alt={prof.nome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                prof.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                              )}
                            </div>
                            
                            {prof.isVerified && (
                              <div className="flex items-center gap-1.5 bg-brand-tactical/20 border border-brand-tactical/30 backdrop-blur-sm px-2.5 py-1 mb-2 rounded shadow-lg">
                                <ShieldCheck size={10} className="text-brand-tactical" />
                                <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest">PRO</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h3 className="text-base font-heading font-black text-theme-text uppercase italic tracking-tight group-hover:text-brand-tactical transition-colors">
                              {prof.nome}
                            </h3>
                            {location && (
                              <p className="text-[10px] text-theme-text/60 flex items-center gap-1 mt-1 font-bold uppercase">
                                <MapPin size={10} /> {location}
                              </p>
                            )}
                          </div>

                          {/* Services */}
                          <div className="flex flex-wrap gap-1.5">
                            {prof.services.slice(0, 4).map(s => (
                              <span key={s} className="px-2 py-0.5 bg-theme-surface-hover border border-theme-border text-[8px] font-black text-theme-text/70 uppercase tracking-widest">
                                {s}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-theme-border">
                            <div className="text-center">
                              <p className="text-base font-heading font-black text-theme-text italic">{prof.experienceYears || 0}</p>
                              <p className="text-[7px] text-theme-text/50 uppercase tracking-widest font-black">Anos</p>
                            </div>
                            <div className="text-center border-x border-theme-border">
                              <p className="text-base font-heading font-black text-theme-text italic">{prof.totalMissions}</p>
                              <p className="text-[7px] text-theme-text/50 uppercase tracking-widest font-black">Missões</p>
                            </div>
                            <div className="text-center">
                              <p className="text-base font-heading font-black text-brand-tactical italic">{prof.agilityPoints}</p>
                              <p className="text-[7px] text-theme-text/50 uppercase tracking-widest font-black">Pontos</p>
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
