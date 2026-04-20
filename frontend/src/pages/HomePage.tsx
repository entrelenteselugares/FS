import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Helmet } from "react-helmet-async";

interface Event {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  priceBase?: number;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
}

const CATEGORIAS = ["Todos", "Casamento Civil", "Pré-Wedding", "Eventos Sociais", "Corporativo"];

// Paleta unificada — Design System "Editorial Portfólio" 📸✨
const THEME = {
  bg:       "var(--theme-bg)",
  bgCard:   "var(--theme-bg-muted)",
  bgHover:  "var(--theme-bg-muted)",
  border:   "var(--theme-border)",
  border2:  "var(--theme-border)",
  text:     "var(--theme-text)",
  text2:    "var(--theme-muted)",
  text3:    "var(--theme-muted)",
  accent:   "var(--brand-primary)",   // verde da logo dinâmico
  accentBg: "var(--theme-bg-muted)",
  fontBase: "'Outfit', sans-serif",
} as const;

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "Data indisponível";
  }
}

function isRecent(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 3 * 24 * 60 * 60 * 1000; // 3 dias
  } catch {
    return false;
  }
}

export const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dashboardPath = user?.role === "ADMIN" ? "/admin"
    : user?.role === "PROFISSIONAL" ? "/profissional"
    : (user?.role === "CARTORIO" || user?.role === "UNIDADE") ? "/cartorio"
    : null;

  const fetchEvents = async (q: string, pg: number) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/public/events`, {
        params: { q: q.trim() || undefined, page: pg }
      });
      setEvents(data.events ?? []);
      setTotalPages(data.pages ?? 1);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchEvents(query, 1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    fetchEvents(query, page);
  }, [page, query]);

  return (
    <div style={{ fontFamily: THEME.fontBase, background: THEME.bg, color: THEME.text, minHeight: "100vh", transition: "all 0.3s ease" }}>
      <Helmet>
        <title>Foto Segundo | Suas memórias, sincronizadas com a vida.</title>
        <meta name="description" content="Acesse a galeria exclusiva do seu grande dia e reviva cada detalhe com qualidade premium em segundos." />
      </Helmet>
      
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow-x: hidden; background: ${THEME.bg}; color: ${THEME.text}; font-family: 'Outfit', sans-serif; }
        .search-input:focus { border-color: ${THEME.accent} !important; background: rgba(var(--accent-rgb), 0.05) !important; }
        
        @media (max-width: 768px) {
          .mobile-stack { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 20px !important; }
          .mobile-hero-padding { padding: 4rem 1rem 3rem !important; }
          .mobile-grid-header { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 1rem !important; }
          .mobile-hide { display: none !important; }
          .mobile-nav { padding: 0.8rem 1rem !important; }
          .mobile-footer { flex-direction: column !important; text-align: center !important; gap: 2rem !important; }
          .mobile-search { flex-direction: column !important; background: transparent !important; border: none !important; padding: 0 !important; gap: 10px !important; }
          .mobile-search-input { border: 1px solid ${THEME.border2} !important; background: ${THEME.bgCard} !important; }
          .mobile-search-button { width: 100% !important; padding: 15px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav 
        id="main-nav"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          padding: "1rem 2rem", borderBottom: `1px solid ${THEME.border}`, 
          background: "var(--theme-bg-nav)", backdropFilter: "blur(20px)", 
          position: "sticky", top: 0, zIndex: 100 
        }}
      >
        <div 
          onClick={() => navigate("/")}
          style={{ 
            cursor: "pointer",
            display: "flex", 
            alignItems: "center", 
            gap: 12 
          }}
        >
          <img 
            src="/logo-premium.png" 
            alt="Foto Segundo" 
            style={{ 
              height: "clamp(30px, 8vw, 48px)", 
              width: "auto", 
              objectFit: "contain",
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
            }} 
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: "none", border: "none", color: THEME.text2, cursor: "pointer", 
              padding: "8px", display: "flex", alignItems: "center", transition: "color 0.3s" 
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = THEME.text)}
            onMouseOut={(e) => (e.currentTarget.style.color = THEME.text2)}
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>

          <button
            onClick={() => navigate("/cotacao")}
            style={{ 
              fontSize: 10, 
              background: "var(--brand-primary)", 
              color: "#fff", 
              border: "none", 
              padding: "12px 24px", 
              borderRadius: 0, 
              cursor: "pointer", 
              fontWeight: 800, 
              letterSpacing: "0.15em", 
              textTransform: "uppercase",
              boxShadow: "0 4px 15px rgba(133, 185, 172, 0.2)"
            }}
          >
            Orçamento
          </button>

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                style={{ fontSize: 10, background: "transparent", color: THEME.text, border: `1px solid ${THEME.border}`, padding: "10px 20px", borderRadius: 0, cursor: "pointer", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}
              >
                {user.nome.split(" ")[0]}
                <span style={{ fontSize: 8 }}>▾</span>
              </button>
              {userMenuOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 2, minWidth: 180, zIndex: 200, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                  {dashboardPath && (
                    <button onClick={() => { setUserMenuOpen(false); navigate(dashboardPath); }} style={{ width: "100%", textAlign: "left", padding: "14px 20px", background: "transparent", border: "none", color: THEME.text, fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", borderBottom: `1px solid ${THEME.border}` }}>
                      Meu Painel
                    </button>
                  )}
                  <button onClick={() => { logout(); setUserMenuOpen(false); navigate("/"); }} style={{ width: "100%", textAlign: "left", padding: "14px 20px", background: "transparent", border: "none", color: THEME.text2, fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" }}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{ fontSize: 10, background: "transparent", color: THEME.text, border: `1px solid ${THEME.border}`, padding: "10px 20px", borderRadius: 0, cursor: "pointer", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Acesso
            </button>
          )}
        </div>
      </nav>

      <section className="mobile-hero-padding" style={{ padding: "10rem 1rem 8rem", textAlign: "center", position: "relative" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: "2rem", fontWeight: 700 }}>
          Coletivo Editorial de Imagem & Cinema
        </p>
        <h1 style={{
          fontFamily: THEME.fontBase,
          fontWeight: 800,
          fontSize: "clamp(54px, 10vw, 120px)",
          lineHeight: 1.1,
          color: THEME.text,
          marginBottom: "2.5rem",
          textTransform: "uppercase",
          letterSpacing: "-0.03em"
        }}>
          Eternizando Cada<br />
          Segundo.
        </h1>
        <p style={{ fontSize: 16, color: THEME.text2, marginBottom: "3.5rem", fontWeight: 300, maxWidth: "600px", margin: "0 auto 4rem", lineHeight: 1.6 }}>
          Uma curadoria refinada de experiências visuais. Acesse sua galeria exclusiva com a sofisticação que seu momento merece.
        </p>

        {/* Barra de busca Editorial */}
        <div className="mobile-search" style={{ maxWidth: 700, margin: "0 auto", position: "relative", display: "flex", background: THEME.bg, border: `1px solid ${THEME.border}`, padding: "4px" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou data..."
              className="search-input mobile-search-input"
              style={{
                width: "100%", background: "transparent", border: "none",
                padding: "20px 25px", fontSize: 15,
                color: THEME.text, outline: "none", transition: "all 0.4s",
                fontFamily: THEME.fontBase
              }}
            />
            <button
              onClick={() => fetchEvents(query, 1)}
              className="search-button mobile-search-button"
              style={{
                background: THEME.text, color: THEME.bg, border: "none", padding: "0 35px",
                borderRadius: 0, fontSize: 11, fontWeight: 700, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "0.2em"
              }}
            >
              Explorar
            </button>
        </div>

        {/* Categorias */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: "3.5rem", flexWrap: "wrap" }}>
          {CATEGORIAS.map((cat) => (
            <span
              key={cat}
              onClick={() => setCategoria(cat)}
              style={{
                fontSize: 10, padding: "8px 20px",
                border: "1px solid",
                borderColor: categoria === cat ? THEME.text : THEME.border,
                borderRadius: 0, color: categoria === cat ? THEME.bg : THEME.text2,
                background: categoria === cat ? THEME.text : "transparent",
                cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, transition: "all .3s ease",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* GRID DE EVENTOS */}
      <section style={{ padding: "6rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
        <div className="mobile-grid-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "4rem" }}>
          <div style={{ borderLeft: `2px solid ${THEME.accent}`, paddingLeft: "1.5rem" }}>
            <p style={{ fontSize: 12, color: THEME.text2, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Arquivo Recente</p>
            <h2 style={{ fontFamily: THEME.fontBase, fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: THEME.text, lineHeight: 1, textTransform: "uppercase" }}>
              Últimos Registros
            </h2>
          </div>
          <span style={{ fontSize: 11, color: THEME.text2, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", borderBottom: `1px solid ${THEME.border}`, paddingBottom: 6, fontWeight: 700 }}>
            Ver agenda completa
          </span>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "3rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "rgba(127,127,127,0.05)", aspectRatio: "4/3", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "8rem 0", border: `1px dashed ${THEME.border}` }}>
            <p style={{ fontFamily: THEME.fontBase, fontSize: 32, color: THEME.text2, fontWeight: 300 }}>Nada encontrado para sua busca.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "4rem 3rem" }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/e/${event.id}`)} />
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, marginTop: "6rem" }}>
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              disabled={page === 1}
              style={{ background: "none", border: "none", color: page === 1 ? "transparent" : THEME.text2, cursor: "pointer", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, borderBottom: `1px solid ${THEME.border}` }}
            >
              Anterior
            </button>
            <span style={{ fontSize: 14, color: THEME.text, fontFamily: THEME.fontBase, letterSpacing: "0.2em", fontWeight: 600 }}>
              {page} <span style={{ opacity: 0.2, margin: "0 10px" }}>—</span> {totalPages}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              style={{ background: "none", border: "none", color: page === totalPages ? "transparent" : THEME.text, cursor: "pointer", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, borderBottom: `1px solid ${THEME.text}` }}
            >
              Próximo
            </button>
          </div>
        )}
      </section>

      {/* CTA BANNER */}
      <section
        onClick={() => navigate("/cotacao")}
        style={{
          cursor: "pointer",
          padding: "5rem 2rem",
          textAlign: "center",
          background: THEME.bgCard,
          borderTop: `1px solid ${THEME.border}`,
          borderBottom: `1px solid ${THEME.border}`,
          transition: "all 0.4s",
        }}
        className="cta-section"
      >
        <span style={{ fontSize: 12, color: THEME.text2, textTransform: "uppercase", letterSpacing: "0.3em", fontWeight: 600 }}>
          Deseja uma cobertura exclusiva?{" "}
          <span style={{ color: THEME.text, borderBottom: "1px solid" }}>Solicite orçamento &rarr;</span>
        </span>
      </section>

      {/* FOOTER */}
      <footer className="mobile-footer" style={{ padding: "8rem 2rem 4rem", borderTop: `1px solid ${THEME.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4rem", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <img src="/logo.png" alt="Foto Segundo" style={{ height: 32, objectFit: "contain", filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
          <p style={{ fontSize: 11, color: THEME.text3, textTransform: "uppercase", letterSpacing: "0.15em", maxWidth: 280, lineHeight: 1.8 }}>
            Protocolo Editorial de Imagem e Cinema.<br />© 2026 Todos os Direitos Reservados.
          </p>
        </div>
        <div style={{ display: "flex", gap: "4rem", flexWrap: "wrap" }}>
          <FooterNav title="Plataforma" links={["Sobre", "Parcerias", "Segurança"]} />
          <FooterNav title="Jurídico" links={["Termos", "Privacidade", "Cookies"]} />
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .cta-section:hover { background: var(--theme-bg-muted); opacity: 0.8; }
      `}</style>
    </div>
  );
}

function FooterNav({ title, links }: { title: string, links: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <span style={{ fontSize: 11, color: THEME.text, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>{title}</span>
      {links.map((l) => (
        <span key={l} style={{ fontSize: 11, color: THEME.text3, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", transition: "color 0.3s" }} onMouseOver={(e) => (e.currentTarget.style.color = THEME.text)} onMouseOut={(e) => (e.currentTarget.style.color = THEME.text3)}>{l}</span>
      ))}
    </div>
  );
}

// ── Componente do Card Editorial ──────────────────────────

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const isNew = isRecent(event.dataEvento);
  useTheme(); // re-renders on theme change — colors handled by CSS variables

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", transition: "all 0.4s ease" }}
      className="group"
    >
      {/* Imagem Editorial */}
      <div style={{ width: "100%", aspectRatio: "4/5", background: "var(--theme-bg-muted)", position: "relative", overflow: "hidden" }}>
        {event.coverPhotoUrl ? (
          <img 
            src={event.coverPhotoUrl} 
            alt={event.nomeNoivos} 
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }} 
            className="group-hover:scale-105"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.2 }}>
            <span style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase" }}>Visual Indisponível</span>
          </div>
        )}
        
        {isNew && (
          <span style={{
            position: "absolute", top: 20, left: 20,
            fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
            background: THEME.text, color: THEME.bg,
            padding: "8px 16px", fontWeight: 700,
          }}>
            Novo
          </span>
        )}

        <div style={{ position: "absolute", bottom: 20, right: 20, display: "flex", gap: 8 }}>
          {event.temFoto && <ServiceBadge label="Imagens" />}
          {event.temVideo && <ServiceBadge label="Filme" />}
        </div>

        {/* Overlay Hover */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", opacity: 0, transition: "opacity 0.4s" }} className="group-hover:opacity-100" />
      </div>

      <div style={{ padding: "24px 0" }}>
        <h3 style={{
          fontFamily: THEME.fontBase,
          fontWeight: 700,
          fontSize: 24,
          color: THEME.text,
          marginBottom: 10,
          letterSpacing: "-0.01em",
          textTransform: "uppercase"
        }}>
          {event.nomeNoivos}
        </h3>
        <div style={{ fontSize: 12, color: THEME.text2, display: "flex", gap: 16, alignItems: "center", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span>{formatDate(event.dataEvento)}</span>
          <span style={{ width: 6, height: 1, background: THEME.border }} />
          <span>{event.cartorio || "Exclusivo"}</span>
        </div>
      </div>
    </div>
  );
}

function ServiceBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 9, padding: "5px 12px", background: "rgba(var(--bg-rgb), 0.7)",
      border: "1px solid rgba(var(--text-rgb), 0.1)", color: "white",
      letterSpacing: "0.1em", textTransform: "uppercase", backdropFilter: "blur(10px)"
    }}>
      {label}
    </span>
  );
}

