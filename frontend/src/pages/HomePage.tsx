import { useState, useEffect, useCallback, useRef } from "react";
import { parseDateSafe } from "../lib/utils/formatters";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../lib/api";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
import { DICT } from "../lib/dictionary";
import { Navbar } from "../components/Navbar";
import { MapPin, Calendar, Search } from "lucide-react";

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
      className="group relative overflow-hidden aspect-[4/5] md:aspect-[4/3] md:rounded-2xl bg-[var(--bg-card)] cursor-pointer border-none transition-transform duration-300 md:hover:scale-105"
    >
      {/* Background Image */}
      <img
        src={event.coverPhotoUrl || fallback}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110"
        style={{ objectPosition: event.coverPosition || 'center' }}
        onError={e => { e.currentTarget.src = fallback; }}
      />

      {/* Immersive Gradient Overlay - REQUIRED for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-[1] opacity-90 group-hover:opacity-100 transition-opacity" />

      {/* Badge de Autoria (Pílula Glassmorphism) - Top Left */}
      <div className="absolute top-4 left-4 z-10 backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-3 py-1 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-500/80 flex items-center justify-center text-[10px] font-black text-black">
          {event.ownerName?.charAt(0).toUpperCase() || event.cartorio?.charAt(0).toUpperCase() || "FS"}
        </div>
        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">
          {event.ownerName || event.cartorio || "Foto Segundo"}
        </span>
      </div>

      {/* Status Badges - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 items-end">
        {today && (
          <span className="px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest rounded-sm shadow-xl">
            HOJE
          </span>
        )}
        {novo && (
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/20 shadow-xl">
            NOVO
          </span>
        )}
      </div>

      {/* Content Overlay - Centered on Mobile, Bottom on Desktop */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 text-center md:hidden">
        <h3 className="text-base sm:text-lg font-heading font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-2xl line-clamp-3">
          {event.title}
        </h3>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-5 z-10 space-y-1 hidden md:block">
        <h3 className="text-xl font-heading font-black text-white uppercase italic tracking-tight leading-tight drop-shadow-lg truncate">
          {event.title}
        </h3>
        <div className="hidden md:flex flex-col gap-1 text-white/70 text-[9px] font-black uppercase tracking-widest italic">
          <div className="flex items-center gap-1.5">
            <MapPin size={10} className="text-emerald-500" />
            <span className="truncate">{event.city || (event.location?.startsWith("CEP:") ? null : event.location) || "PONTO DESIGNADO"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={10} className="text-emerald-500" />
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
  const [query, setQuery]       = useState(() => sessionStorage.getItem('hp_q') || "");
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(() => parseInt(sessionStorage.getItem('hp_page') || '1', 10));
  const [totalPages, setTotal]  = useState(1);
  const [selectedType, setSelectedType] = useState(() => sessionStorage.getItem('hp_type') || "");
  const [selectedCity, setSelectedCity] = useState(() => sessionStorage.getItem('hp_city') || "");
  const [sortBy, setSortBy]             = useState(() => sessionStorage.getItem('hp_sort') || "");
  const [availableCities, setAvailableCities] = useState<string[]>([]);

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
  }, [query, page, selectedType, selectedCity, sortBy]);

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
          .hp-steps { flex-direction: column !important; }
          .hp-footer-inner { flex-direction: column !important; gap: 2rem !important; }
          .hp-footer-cols { gap: 1.5rem !important; }
          .hp-search-container { flex-direction: column !important; }
          .hp-search-input { border-right: 1px solid var(--border-2) !important; border-bottom: none !important; border-top: none !important; }
          .hp-step-item { border-right: none !important; padding: 16px 0 !important; border-bottom: 1px solid ${T.border} !important; }
          .hp-step-item:last-child { border-bottom: none !important; }
          .hp-stats { gap: 10px !important; justify-content: space-between !important; flex-wrap: nowrap !important; }
          .hp-stats-item { min-width: auto; }
          .hp-stats-val { font-size: 22px !important; }
           .hp-mobile-search { display: flex !important; }
           .hp-event-section { padding: 0 0 100px !important; }
           /* Compressed Hero on Mobile */
           .hp-hero-section { 
             display: flex !important; 
             padding: 32px 16px 16px !important;
             text-align: center !important;
             align-items: center !important;
             min-height: auto !important;
             background: linear-gradient(to bottom, var(--bg-card), var(--bg)) !important;
           }
           .hp-hero-title { font-size: 38px !important; line-height: 0.85 !important; margin-bottom: 12px !important; text-align: center !important; letter-spacing: -0.04em !important; font-weight: 900 !important; }
           .hp-hero-desc { font-size: 11px !important; line-height: 1.4 !important; margin-bottom: 20px !important; text-align: center !important; opacity: 0.7; max-width: 95% !important; margin-left: auto !important; margin-right: auto !important; }
           .hp-stats { display: none !important; }
           .hp-hero-tagline { display: none !important; }
           .hp-hero-search-desktop { flex-direction: column !important; width: 100% !important; gap: 8px !important; }
           .hp-hero-search-desktop button { width: 100% !important; padding: 12px !important; }

           /* Vitrine Headers */
           .hp-vitrine-header-desktop { display: none !important; }
           .hp-mobile-vitrine-header { display: flex !important; padding: 8px 12px 12px !important; }
           
           /* Immersive Feed for Mobile */
           .hp-event-grid-container { padding: 4px !important; }
           .hp-event-grid { gap: 8px !important; grid-template-columns: repeat(2, 1fr) !important; }
         }
        @media(min-width:769px){
          .hp-mobile-search { display: none !important; }
          .hp-mobile-vitrine-header { display: none !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hp-hero-section" style={{ 
        padding: "clamp(24px, 5vw, 40px) 24px 32px", 
        background: "linear-gradient(to bottom, var(--bg-card), var(--bg))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        minHeight: "auto"
      }}>
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-tactical/5 blur-[120px] rounded-full opacity-30 -translate-y-1/2 pointer-events-none" />

        <div style={{ maxWidth: 1200, position: "relative", zIndex: 10 }}>
          <p className="hp-hero-tagline animate-reveal" style={{ fontSize: 10, fontFamily: T.fontB, fontWeight: 400, letterSpacing: "0.5em", textTransform: "uppercase", color: T.brand, marginBottom: 16, opacity: 0.8 }}>
            {DICT.HERO_TAGLINE}
          </p>

          <h1 className="hp-hero-title animate-reveal" style={{
            fontFamily: T.fontD, fontWeight: 900,
            fontSize: "clamp(32px, 7vw, 80px)",
            lineHeight: 0.85, color: "var(--text)",
            textTransform: "uppercase", letterSpacing: "-0.04em",
            margin: "0 0 24px",
          }}>
            <span style={{ display: "block", whiteSpace: "nowrap" }}>{DICT.HERO_TITLE_PART1}</span>
            <em style={{ fontStyle: "italic", color: T.brand, display: "block", whiteSpace: "nowrap" }}>{DICT.HERO_TITLE_PART2_ITALIC}</em>
          </h1>

          <p className="hp-hero-desc animate-reveal" style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 300, maxWidth: 650, lineHeight: 1.5, margin: "0 auto 32px", fontFamily: T.fontB }}>
            {DICT.HERO_DESCRIPTION}
          </p>

          <div className="hp-hero-search-desktop animate-reveal" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {/* Mobile-only Search Bar inside Hero */}
            <form onSubmit={e => { e.preventDefault(); fetchEvents(query, 1); }} className="md:hidden w-full relative mb-0 group mt-2">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-brand-tactical group-focus-within:scale-110 transition-all duration-300" />
              <input
                id="mobile-search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchEvents(query, 1)}
                placeholder="Pesquise por evento, noivos..."
                className="w-full bg-theme-bg-muted/80 border border-theme-border/40 focus:border-brand-tactical focus:ring-2 focus:ring-brand-tactical/20 text-theme-text pl-10 pr-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider outline-none shadow-md transition-all duration-300 focus:scale-[1.02] placeholder:text-theme-text-muted"
              />
            </form>

            <button id="btn-explorar-vitrine"
              onClick={() => navigate("/vitrine")}
              className="lux-button-tactical px-10 py-4 text-[10px] font-display font-black uppercase tracking-[0.4em] italic shadow-2xl shadow-brand-tactical/20 hidden md:block"
            >
              Explorar Vitrine
            </button>
            <button id="btn-agendar-cobertura"
              onClick={() => navigate("/cotacao")}
              className="px-8 py-4 text-[10px] font-display font-black uppercase tracking-[0.2em] italic bg-white/5 border border-white/10 text-theme-text hover:bg-theme-text/10 hover:scale-[1.02] transition-all hidden md:block cursor-pointer rounded-full"
            >
              Agendar Cobertura
            </button>
          </div>
          
          {/* Stats */}
          <div className="hp-stats animate-reveal" style={{ display: "flex", gap: "clamp(16px, 4vw, 48px)", justifyContent: "center", marginTop: 24, opacity: 0.8 }}>
            {[["500+", DICT.STATS_EVENTS], ["24h", DICT.STATS_DELIVERY], ["4.9★", DICT.STATS_RATING]].map(([val, label]) => (
              <div key={label} className="hp-stats-item text-center">
                <div className="hp-stats-val" style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 24, color: "var(--text)", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 8, fontFamily: T.fontD, fontWeight: 900, color: "var(--text-muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4, fontStyle: 'italic' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT GRID ───────────────────────────────────────────────────── */}
      <section id="vitrine" className="hp-event-section" style={{ padding: "0 0 80px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0" }}>
          
          {/* Mobile compact vitrine Filters (Sleek dropdown layout — kept exclusively) */}
          <div className="hp-mobile-vitrine-header flex flex-col gap-2 p-3 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
              <div className="relative shrink-0">
                <select id="select-cidade-mobile" 
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border/40 text-theme-text pl-3 pr-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer hover:border-brand-tactical/50 transition-colors"
                >
                  <option value="" className="bg-theme-bg text-theme-text">🗺️ Cidades</option>
                  {availableCities.map(c => (
                    <option key={c} value={c} className="bg-theme-bg text-theme-text">{c}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[6px] text-theme-text-muted">▼</div>
              </div>

              <div className="relative shrink-0">
                <select id="select-categoria-mobile" 
                  value={selectedType}
                  onChange={e => { setSelectedType(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border/40 text-theme-text pl-3 pr-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer hover:border-brand-tactical/50 transition-colors"
                >
                  <option value="" className="bg-theme-bg text-theme-text">🏷️ Categorias</option>
                  <option value="ALBUM_FULL" className="bg-theme-bg text-theme-text">Álbuns</option>
                  <option value="PHOTO_MARKETPLACE" className="bg-theme-bg text-theme-text">Live Print</option>
                  <option value="FOTO_POINT" className="bg-theme-bg text-theme-text">Foto Point</option>
                  <option value="FLASH_EVENT" className="bg-theme-bg text-theme-text">Flash</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[6px] text-theme-text-muted">▼</div>
              </div>

              <div className="relative shrink-0">
                <select id="select-ordenacao-mobile" 
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border/40 text-theme-text pl-3 pr-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer hover:border-brand-tactical/50 transition-colors"
                >
                  <option value="" className="bg-theme-bg text-theme-text">⏱️ Recentes</option>
                  <option value="OLD" className="bg-theme-bg text-theme-text">Antigos</option>
                  <option value="AZ" className="bg-theme-bg text-theme-text">A-Z</option>
                  <option value="ZA" className="bg-theme-bg text-theme-text">Z-A</option>
                  <option value="PRICE_ASC" className="bg-theme-bg text-theme-text">Menor R$</option>
                  <option value="PRICE_DESC" className="bg-theme-bg text-theme-text">Maior R$</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[6px] text-theme-text-muted">▼</div>
              </div>
            </div>
          </div>

          {/* Header with Search & Filters (Desktop — hidden on mobile) */}
          <div className="hp-vitrine-header-desktop flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2 border-b border-theme-border/20 pb-4 pt-2 px-8">
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
                  className="w-full bg-theme-bg-muted border border-theme-border/40 pl-12 pr-4 py-4 text-[11px] font-display font-black uppercase tracking-widest text-theme-text focus:bg-theme-bg-muted/80 transition-all outline-none italic"
                />
              </form>

              {/* Filters Dropdowns */}
              <div className="flex items-center gap-2">
                <select id="select-cidade-desktop" 
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border/40 px-4 py-4 text-[9px] font-black uppercase tracking-widest text-theme-text/40 focus:text-theme-text outline-none cursor-pointer hover:bg-theme-bg-muted/80 transition-colors italic appearance-none"
                >
                  <option value="" className="bg-theme-bg text-theme-text">Todas as Cidades</option>
                  {availableCities.map(c => (
                    <option key={c} value={c} className="bg-theme-bg text-theme-text">{c}</option>
                  ))}
                </select>

                <select id="select-categoria-desktop" 
                  value={selectedType}
                  onChange={e => { setSelectedType(e.target.value); setPage(1); }}
                  className="bg-theme-bg-muted border border-theme-border/40 px-4 py-4 text-[9px] font-black uppercase tracking-widest text-theme-text/40 focus:text-theme-text outline-none cursor-pointer hover:bg-theme-bg-muted/80 transition-colors italic appearance-none"
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
                  className="bg-theme-bg-muted border border-theme-border/40 px-4 py-4 text-[9px] font-black uppercase tracking-widest text-theme-text/40 focus:text-theme-text outline-none cursor-pointer hover:bg-theme-bg-muted/80 transition-colors italic appearance-none"
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
                <div key={i} className="bg-white/5 aspect-[4/3] animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-40 text-center opacity-20">
              <p className="font-heading font-black text-4xl text-white uppercase italic">Nada encontrado.</p>
              <p className="text-[10px] text-white font-black uppercase tracking-widest mt-4">Redefina os filtros ou a busca.</p>
            </div>
          ) : (
              <div className="space-y-4 hp-event-grid-container px-0 md:px-8">


                {/* Mobile Specific Search - Removed because it was duplicated */}

                {/* Eventos Grid (Full Width on Mobile) */}
                <div className="grid hp-event-grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
