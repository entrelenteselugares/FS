import { useState, useEffect, useCallback, useRef } from "react";
import { parseDateSafe } from "../lib/utils/formatters";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { API } from "../lib/api";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
import { DICT } from "../lib/dictionary";
import { Navbar } from "../components/Navbar";
import { HeroCarousel } from "../components/HeroCarousel";
import { Search, Calendar, MapPin, SlidersHorizontal } from "lucide-react";

interface Event {
  id: string;
  slug: string | null;
  title: string;
  dataEvento: string;
  cartorio: string | null;
  location?: string;
  city?: string;
  coverPhotoUrl: string | null;
  priceBase?: number;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  type?: string;
  category?: string;
  coverPosition?: string | null;
  ownerName?: string;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  const date = parseDateSafe(d);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function isToday(d: string) {
  const ev = parseDateSafe(d);
  const now = new Date();
  return (
    ev.getDate() === now.getDate() &&
    ev.getMonth() === now.getMonth() &&
    ev.getFullYear() === now.getFullYear()
  );
}

function isRecent(d: string) {
  return Date.now() - new Date(d).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function getFallbackByCategory(category?: string, id: string = "") {
  if (category === "ANIVERSARIO") return "https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&q=80&w=800";
  if (category === "SHOW_FESTIVAL") return "https://images.unsplash.com/photo-1540039155732-d6749b9325f0?auto=format&fit=crop&q=80&w=800";
  if (category === "CORPORATIVO") return "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800";
  if (category === "FORMATURA") return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800";
  if (category === "ENSAIO") return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800";
  const defaults = ["/defaults/cover1.png", "/defaults/cover2.png", "/defaults/cover3.png"];
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaults.length;
  return defaults[index];
}

// ── EventCard — Unified Immersive Version ───────────────────────────────────
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const today = isToday(event.dataEvento);
  const novo  = !today && isRecent(event.dataEvento);
  const fallback = getFallbackByCategory(event.category, event.id);

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden aspect-[3/4] md:aspect-[4/3] rounded-lg md:rounded-2xl bg-[var(--bg-card)] cursor-pointer border-none transition-transform duration-300 md:hover:scale-105"
    >
      {/* Background Image */}
      <img
        src={event.coverPhotoUrl || fallback}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        style={{ objectPosition: event.coverPosition || 'center' }}
        onError={e => { e.currentTarget.src = fallback; }}
      />

      {/* Immersive Gradient Overlay - REQUIRED for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

      {/* Badge de Autoria - Top Left */}
      <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 z-10 flex items-center gap-1.5">
        <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-emerald-500/90 flex items-center justify-center text-[7px] md:text-[10px] font-black text-black shadow-lg">
          {event.ownerName?.charAt(0).toUpperCase() || event.cartorio?.charAt(0).toUpperCase() || "F"}
        </div>
        <span className="hidden md:inline text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[120px] drop-shadow-md">
          {event.ownerName || event.cartorio || "Foto Segundo"}
        </span>
      </div>

      {/* Status Badges - Top Right */}
      <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 z-10 flex flex-col gap-1 items-end">
        {today && (
          <span className="px-1.5 py-0.5 bg-emerald-500 text-black text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-sm shadow-xl">
            HOJE
          </span>
        )}
        {novo && (
          <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md text-white text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20 shadow-xl">
            NOVO
          </span>
        )}
      </div>

      {/* Content Overlay - Always Bottom for better subject visibility */}
      <div className="absolute bottom-0 left-0 w-full p-2 md:p-4 z-10 flex flex-col justify-end">
        <h3 className="text-[10px] md:text-lg font-heading font-black text-white uppercase italic tracking-tight leading-tight drop-shadow-lg line-clamp-2 mb-0.5 md:mb-1.5">
          {event.title}
        </h3>
        {/* Metadata */}
        <div className="flex flex-col gap-0.5 md:gap-1 text-white/70 text-[7px] md:text-[9px] font-black uppercase tracking-widest italic mt-0.5 md:mt-1.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-500 shrink-0" />
            <span className="truncate">{event.city || (event.location?.startsWith("CEP:") ? null : event.location) || "PONTO DESIGNADO"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-500 shrink-0" />
            <span>{formatDate(event.dataEvento)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STEPS ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: DICT.STEP_01_TITLE, desc: DICT.STEP_01_DESC },
  { n: "02", title: DICT.STEP_02_TITLE, desc: DICT.STEP_02_DESC },
  { n: "03", title: DICT.STEP_03_TITLE, desc: DICT.STEP_03_DESC },
];

// ── FOOTER NAV ────────────────────────────────────────────────────────────────
function FooterCol({ title, links }: { title: string; links: {label: string, href: string}[] }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontSize: 10, fontFamily: T.fontD, fontWeight: 900, letterSpacing: "0.4em", textTransform: "uppercase", color: T.text, fontStyle: 'italic' }}>{title}</span>
      {links.map(l => (
        <span 
          key={l.label} 
          onClick={() => l.href.startsWith('http') ? window.open(l.href, '_blank') : navigate(l.href)}
          style={{ fontSize: 11, fontFamily: T.fontD, fontWeight: 900, color: T.text3, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.2em", fontStyle: 'italic' }}
          onMouseOver={e => (e.currentTarget.style.color = T.text)} onMouseOut={e => (e.currentTarget.style.color = T.text3)}>
          {l.label}
        </span>
      ))}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery]       = useState(() => searchParams.get('q') || sessionStorage.getItem('hp_q') || "");
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(() => parseInt(searchParams.get('page') || sessionStorage.getItem('hp_page') || '1', 10));
  const [totalPages, setTotal]  = useState(1);
  const [selectedType, setSelectedType] = useState(() => searchParams.get('type') || sessionStorage.getItem('hp_type') || "");
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get('city') || sessionStorage.getItem('hp_city') || "");
  const [sortBy, setSortBy]             = useState(() => searchParams.get('sort') || sessionStorage.getItem('hp_sort') || "");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    API.get("/public/events/cities")
      .then(res => setAvailableCities(res.data.cities || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('hp_q', query);
    sessionStorage.setItem('hp_page', page.toString());
    sessionStorage.setItem('hp_type', selectedType);
    sessionStorage.setItem('hp_city', selectedCity);
    sessionStorage.setItem('hp_sort', sortBy);

    const nextParams = new URLSearchParams(searchParams);
    if (query) nextParams.set('q', query); else nextParams.delete('q');
    if (page > 1) nextParams.set('page', page.toString()); else nextParams.delete('page');
    if (selectedType) nextParams.set('type', selectedType); else nextParams.delete('type');
    if (selectedCity) nextParams.set('city', selectedCity); else nextParams.delete('city');
    if (sortBy) nextParams.set('sort', sortBy); else nextParams.delete('sort');
    
    // Only update if something changed to avoid endless loop
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [query, page, selectedType, selectedCity, sortBy, searchParams, setSearchParams]);

  const isFirstMount = useRef(true);

  const fetchEvents = useCallback(async (q: string, pg: number, type?: string, city?: string, sort?: string) => {
    setLoading(true);
    try {
      const { data } = await API.get("/public/events", { 
        params: { 
          q: q.trim() || undefined, 
          page: pg,
          type: type || undefined,
          city: city || undefined,
          sortBy: sort || undefined
        } 
      });
      setEvents(data.events ?? []);
      setTotal(data.pages ?? 1);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEvents(query, page, selectedType, selectedCity, sortBy);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, page, selectedType, selectedCity, sortBy, fetchEvents]);

  // Reset page when filters change (skip initial mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [query, selectedType, selectedCity, sortBy]);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", fontFamily: T.fontB }}>
      <Helmet>
        <title>Foto Segundo | {DICT.HERO_TITLE_PART1}{DICT.HERO_TITLE_PART2_ITALIC}</title>
        <meta name="description" content={DICT.HERO_DESCRIPTION} />
      </Helmet>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .hp-search-input:focus { outline: none; }
        .hp-search-input::placeholder { color: ${T.text3}; }
        .chip { transition: all 0.15s; cursor: pointer; }
        @media(max-width:768px){
          .hp-hero-title { font-size: clamp(34px,8vw,52px) !important; line-height: 1 !important; }
          .hp-steps { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; flex-direction: row !important; }
          .hp-step-item { border-right: none !important; border-bottom: none !important; padding: 12px 0 !important; }
          .hp-step-item h3 { font-size: 14px !important; margin-bottom: 4px !important; }
          .hp-step-item p { font-size: 10px !important; line-height: 1.4 !important; }
          .hp-step-item > div { font-size: 32px !important; margin-bottom: 6px !important; }
          .hp-footer-inner { flex-direction: column !important; gap: 2rem !important; }
          .hp-footer-cols { gap: 1.5rem !important; }
          .hp-search-container { flex-direction: column !important; }
          .hp-search-input { border-right: 1px solid var(--border-2) !important; border-bottom: none !important; border-top: none !important; }
          .hp-stats { gap: 10px !important; justify-content: space-between !important; flex-wrap: nowrap !important; }
          .hp-stats-item { min-width: auto; }
          .hp-stats-val { font-size: 18px !important; }
           .hp-mobile-search { display: flex !important; }
           .hp-event-section { padding: 0 0 100px !important; }
           /* Compressed Hero on Mobile */
           .hp-hero-section { 
             display: flex !important; 
             padding: 0 !important;
             text-align: center !important;
             align-items: center !important;
             min-height: auto !important;
             background: linear-gradient(to bottom, var(--bg-card), var(--bg)) !important;
           }
           .hp-hero-title { font-size: 28px !important; line-height: 0.85 !important; margin-bottom: 12px !important; text-align: center !important; letter-spacing: -0.04em !important; font-weight: 900 !important; }
           .hp-hero-desc { font-size: clamp(8.5px, 2.8vw, 11px) !important; line-height: 1.4 !important; margin-bottom: 20px !important; text-align: center !important; opacity: 0.7; max-width: 100% !important; white-space: nowrap !important; margin-left: auto !important; margin-right: auto !important; }
           .hp-stats { display: none !important; }
           .hp-hero-tagline { display: none !important; }
           .hp-hero-search-desktop { flex-direction: column !important; width: 100% !important; gap: 8px !important; }
           .hp-hero-search-desktop button { width: 100% !important; padding: 12px !important; }

           /* Vitrine Headers */
           .hp-vitrine-header-desktop { display: none !important; }
           .hp-mobile-vitrine-header { display: flex !important; padding: 8px 12px 12px !important; }
           
           /* Immersive Feed for Mobile */
           .hp-event-grid-container { padding: 4px !important; }
           .hp-event-grid { gap: 4px !important; grid-template-columns: repeat(3, 1fr) !important; }
         }
        @media(min-width:769px){
          .hp-mobile-search { display: none !important; }
          .hp-mobile-vitrine-header { display: none !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hp-hero-section relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[260px] md:min-h-[400px] lg:min-h-[450px]" style={{ 
        padding: "0", 
      }}>
        <HeroCarousel />
      </section>

      {/* ── EVENT GRID ───────────────────────────────────────────────────── */}
      <section id="vitrine" className="hp-event-section" style={{ padding: "0 0 80px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0" }}>
          
          {/* Mobile Vitrine Search & Filters Container */}
          <div className="hp-mobile-search flex-col gap-3 p-4 pb-2 w-full">
            <div className="flex items-center gap-2 w-full">
              <form onSubmit={e => { e.preventDefault(); fetchEvents(query, 1); }} className="relative flex-1 group w-full">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted transition-colors" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchEvents(query, 1)}
                  placeholder="Buscar evento..."
                  className="w-full bg-theme-bg-muted border border-theme-border pl-11 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-theme-text placeholder:text-theme-text placeholder:opacity-40 focus:border-brand-tactical/50 transition-all outline-none italic rounded-full shadow-sm"
                />
              </form>
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`shrink-0 p-3.5 rounded-full border transition-all shadow-sm ${showMobileFilters ? 'bg-brand-tactical border-brand-tactical text-black' : 'bg-theme-bg-muted border-theme-border text-theme-text hover:border-brand-tactical/50'}`}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
            
            {showMobileFilters && (
              <div className="flex flex-col gap-2 pt-1 animate-reveal">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select id="select-cidade-mobile" 
                      value={selectedCity}
                      onChange={e => { setSelectedCity(e.target.value); setPage(1); setShowMobileFilters(false); }}
                      className="w-full bg-theme-bg-muted border border-theme-border text-theme-text pl-3 pr-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="" className="bg-theme-bg">🗺️ Cidades</option>
                      {availableCities.map(c => <option key={c} value={c} className="bg-theme-bg">{c}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[6px]">▼</div>
                  </div>
                  <div className="relative">
                    <select id="select-categoria-mobile" 
                      value={selectedType}
                      onChange={e => { setSelectedType(e.target.value); setPage(1); setShowMobileFilters(false); }}
                      className="w-full bg-theme-bg-muted border border-theme-border text-theme-text pl-3 pr-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="" className="bg-theme-bg">🏷️ Categorias</option>
                      <option value="ALBUM_FULL" className="bg-theme-bg">Álbuns</option>
                      <option value="PHOTO_MARKETPLACE" className="bg-theme-bg">Live Print</option>
                      <option value="FOTO_POINT" className="bg-theme-bg">Foto Point</option>
                      <option value="FLASH_EVENT" className="bg-theme-bg">Flash</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[6px]">▼</div>
                  </div>
                  <div className="relative col-span-2">
                    <select id="select-ordenacao-mobile" 
                      value={sortBy}
                      onChange={e => { setSortBy(e.target.value); setPage(1); setShowMobileFilters(false); }}
                      className="w-full bg-theme-bg-muted border border-theme-border text-theme-text pl-3 pr-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="" className="bg-theme-bg">⏱️ Recentes</option>
                      <option value="OLD" className="bg-theme-bg">Antigos</option>
                      <option value="AZ" className="bg-theme-bg">A-Z</option>
                      <option value="ZA" className="bg-theme-bg">Z-A</option>
                      <option value="PRICE_ASC" className="bg-theme-bg">Menor R$</option>
                      <option value="PRICE_DESC" className="bg-theme-bg">Maior R$</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[6px]">▼</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Header with Search & Filters (Desktop — hidden on mobile) */}
          <div className="hp-vitrine-header-desktop flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2 border-b border-theme-border pb-4 pt-2 px-4 md:px-8">
            <div style={{ borderLeft: `2px solid ${T.brand}`, paddingLeft: 12 }}>
              <p style={{ fontSize: 9, fontFamily: T.fontD, fontWeight: 900, color: "var(--theme-text-muted)", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 2px", fontStyle: 'italic' }}>{DICT.LATEST_REGISTERS_TAG}</p>
              <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(24px,3.5vw,32px)", color: "var(--text)", textTransform: "uppercase", margin: 0, lineHeight: 1 }}>
                {DICT.LATEST_REGISTERS_TITLE}
                <span style={{ fontSize: 12, verticalAlign: 'middle', opacity: 0.3, marginLeft: 12 }}>({events.length})</span>
              </h2>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 max-w-4xl lg:justify-end">
              {/* Desktop Search Input */}
              <form onSubmit={e => { e.preventDefault(); fetchEvents(query, 1); }} className="relative flex-1 group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-brand-tactical transition-colors" />
                <input
                  id="desktop-search-input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchEvents(query, 1)}
                  placeholder="Nome do evento ou titular..."
                  className="w-full bg-theme-bg-muted border border-theme-border pl-12 pr-4 py-4 text-[11px] font-display font-black uppercase tracking-widest text-theme-text placeholder:text-theme-text placeholder:opacity-40 focus:bg-theme-bg-muted transition-all outline-none italic"
                />
              </form>

              {/* Filters Dropdowns */}
              <div className="flex items-center gap-2">
                <select id="select-cidade-desktop" 
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border px-4 py-4 text-[9px] font-black uppercase tracking-widest text-theme-text opacity-40 focus:opacity-100 outline-none cursor-pointer hover:bg-theme-bg-muted transition-colors italic appearance-none"
                >
                  <option value="" className="bg-theme-bg text-theme-text">Todas as Cidades</option>
                  {availableCities.map(c => (
                    <option key={c} value={c} className="bg-theme-bg text-theme-text">{c}</option>
                  ))}
                </select>

                <select id="select-categoria-desktop" 
                  value={selectedType}
                  onChange={e => { setSelectedType(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border px-4 py-4 text-[9px] font-black uppercase tracking-widest text-theme-text opacity-40 focus:opacity-100 outline-none cursor-pointer hover:bg-theme-bg-muted transition-colors italic appearance-none"
                >
                  <option value="" className="bg-theme-bg text-theme-text">Todas as Categorias</option>
                  <option value="ALBUM_FULL" className="bg-theme-bg text-theme-text">Álbum Completo</option>
                  <option value="PHOTO_MARKETPLACE" className="bg-theme-bg text-theme-text">Live Print</option>
                  <option value="FOTO_POINT" className="bg-theme-bg text-theme-text">Foto Point</option>
                  <option value="FLASH_EVENT" className="bg-theme-bg text-theme-text">Flash Event / Venda Direta</option>
                </select>

                <select id="select-ordenacao-desktop" 
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border px-4 py-4 text-[9px] font-black uppercase tracking-widest text-theme-text opacity-40 focus:opacity-100 outline-none cursor-pointer hover:bg-theme-bg-muted transition-colors italic appearance-none"
                >
                  <option value="">Data (Recentes)</option>
                  <option value="OLD" className="bg-theme-bg text-theme-text">Data (Antigos)</option>
                  <option value="AZ" className="bg-theme-bg text-theme-text">Nome (A-Z)</option>
                  <option value="ZA" className="bg-theme-bg text-theme-text">Nome (Z-A)</option>
                  <option value="PRICE_ASC" className="bg-theme-bg text-theme-text">Preço (Menor)</option>
                  <option value="PRICE_DESC" className="bg-theme-bg text-theme-text">Preço (Maior)</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-theme-bg-muted aspect-[4/3] animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-40 text-center opacity-20">
              <p className="font-heading font-black text-2xl md:text-4xl text-white uppercase italic">Nada encontrado.</p>
              <p className="text-[10px] text-white font-black uppercase tracking-widest mt-4">Redefina os filtros ou a busca.</p>
            </div>
          ) : (
              <div className="space-y-4 hp-event-grid-container px-0 md:px-8">




                {/* Eventos Grid (Full Width on Mobile) */}
                <div className="grid hp-event-grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {events.map(ev => (
                    <EventCard key={ev.id} event={ev} onClick={() => navigate(`/e/${ev.slug || ev.id}`)} />
                  ))}
                </div>
              </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 32, marginTop: 80, padding: "40px 0" }}>
              <button id="btn-pagina-anterior" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="hover:text-brand-tactical"
                style={{ background: "none", border: "none", color: page === 1 ? "var(--text-3)" : "var(--text-2)", cursor: page === 1 ? "default" : "pointer", fontSize: 10, fontFamily: T.fontB, letterSpacing: "0.2em", textTransform: "uppercase", transition: "color 0.2s" }}>
                ← Anterior
              </button>
              <span style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 18, color: "var(--text)" }}>
                {page} <span style={{ color: "var(--border)", margin: "0 8px" }}>/</span> {totalPages}
              </span>
              <button id="btn-proxima-pagina" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="hover:text-brand-tactical"
                style={{ background: "none", border: "none", color: page === totalPages ? "var(--border)" : "var(--text-2)", cursor: page === totalPages ? "default" : "pointer", fontSize: 10, fontFamily: T.fontB, letterSpacing: "0.2em", textTransform: "uppercase", transition: "color 0.2s" }}>
                Próximo →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 28px", borderTop: `1px solid ${T.border}`, background: "var(--bg-card)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, fontFamily: T.fontD, fontWeight: 900, color: T.brand, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 16, fontStyle: 'italic' }}>Processo</p>
          <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(32px,5vw,56px)", color: "var(--text)", textTransform: "uppercase", margin: "0 0 32px", lineHeight: 0.9 }}>
            {DICT.HOW_IT_WORKS_TITLE}
          </h2>
          <div className="hp-steps" style={{ display: "flex", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div 
                key={step.n} 
                className="hp-step-item"
                style={{ 
                  flex: 1, 
                  padding: "24px 0", 
                  borderRight: i < STEPS.length - 1 ? "1px solid var(--border)" : "none", 
                  paddingRight: i < STEPS.length - 1 ? 30 : 0, 
                  paddingLeft: i > 0 ? 30 : 0 
                }}
              >
                <div style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 56, color: T.brand, lineHeight: 1, marginBottom: 12, opacity: 0.3 }}>{step.n}</div>
                <h3 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 24, color: "var(--text)", textTransform: "uppercase", margin: "0 0 12px", letterSpacing: "0.5px" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "var(--theme-text-muted)", fontFamily: T.fontB, fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px 28px", background: T.bgCard }}>
        <div className="hp-footer-inner" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4rem" }}>
          <div>
            <Link to="/" style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <img src="/logo.png" alt="Foto Segundo" style={{ 
                height: 32, 
                objectFit: "contain", 
                filter: "var(--logo-filter)"
              }} />
            </Link>
            <p style={{ fontSize: 11, fontFamily: T.fontB, color: T.textMuted, lineHeight: 1.8, maxWidth: 280, margin: 0, whiteSpace: "pre-line" }}>
              {DICT.FOOTER_COPYRIGHT}
            </p>
          </div>
          <div className="hp-footer-cols" style={{ display: "flex", gap: "4rem", flexWrap: "wrap" }}>
            <FooterCol title="Plataforma" links={[
              {label: "Sobre", href: "/sobre"}, 
              {label: "Parcerias", href: "/parcerias"}, 
              {label: "Negócios", href: "/negocios"}
            ]} />
            <FooterCol title="Jurídico" links={[
              {label: "Termos de Uso", href: "/termos"}, 
              {label: "Privacidade", href: "/privacidade"}, 
              {label: "LGPD", href: "/lgpd"}
            ]} />
            <FooterCol title="Suporte" links={[
              {label: "Central de Ajuda", href: "/suporte"}, 
              {label: "Contato", href: "/contato"}, 
              {label: "Status", href: "/status"}
            ]} />
          </div>
        </div>
      </footer>
    </div>
  );
};
