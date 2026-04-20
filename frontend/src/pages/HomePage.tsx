import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
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
          .mobile-hero-padding { padding: 3rem 0 2rem !important; }
          .mobile-grid-header { flex-direction: column !important; align-items: flex-start !important; text-align: left !important; gap: 0.75rem !important; margin-bottom: 2rem !important; }
          .mobile-hide { display: none !important; }
          .mobile-nav { padding: 0.75rem 1.25rem !important; }
          .mobile-footer { flex-direction: column !important; text-align: center !important; gap: 2rem !important; }

          /* Search bar: Premium pill-style with high blur */
          .mobile-search { 
            flex-direction: row !important; 
            background: rgba(255,255,255,0.06) !important; 
            backdrop-filter: blur(30px) !important;
            border: 1px solid rgba(255,255,255,0.08) !important; 
            padding: 4px !important; 
            gap: 0 !important; 
            border-radius: 100px !important; 
          }
          .mobile-search-input { 
            background: transparent !important; 
            border: none !important; 
            font-size: 16px !important; /* Prevents iOS auto-zoom */
            padding: 12px 20px !important; 
            letter-spacing: -0.01em !important;
          }
          .mobile-search-button { 
            width: 48px !important;
            height: 48px !important;
            padding: 0 !important; 
            border-radius: 100px !important; 
            flex-shrink: 0 !important; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
          }

          /* Section spacing */
          section { padding: 2.5rem 20px !important; }
          .hero-title-mobile { 
            font-size: 32px !important; 
            line-height: 1.05 !important; 
            letter-spacing: -0.03em !important;
            font-weight: 900 !important;
          }
          .hero-mobile-margin { margin: 12px 12px 0 !important; }

          /* Event grid on mobile: single column */
          .events-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }

          .desktop-hide { display: none !important; }
        }

        .mobile-toggle {
          display: none;
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
          background: var(--theme-bg-muted);
          border: 1px solid var(--theme-border);
          padding: 15px;
          border-radius: 100px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          color: var(--theme-text);
          backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
          .mobile-toggle { display: flex; }
          .desktop-only { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav 
        id="main-nav"
        className="mobile-nav"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          padding: "1.2rem 2.5rem", borderBottom: `1px solid ${THEME.border}`, 
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
            className="desktop-only"
            onClick={toggleTheme}
            style={{ 
              background: "none", border: "none", color: THEME.text2, cursor: "pointer", 
              padding: "4px", display: "flex", alignItems: "center", transition: "color 0.3s" 
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
              fontSize: 9, 
              background: "var(--brand-primary)", 
              color: "#fff", 
              border: "none", 
              padding: "10px 18px", 
              borderRadius: 0, 
              cursor: "pointer", 
              fontWeight: 900, 
              letterSpacing: "0.2em", 
              textTransform: "uppercase",
              boxShadow: "0 4px 15px rgba(133, 185, 172, 0.2)"
            }}
          >
            Agendar
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

      {/* Mobile Theme Toggle Floating Button */}
      <button 
        className="mobile-toggle"
        onClick={toggleTheme}
      >
        {theme === "light" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        )}
      </button>

      {/* HERO SECTION ESTILO YOUTUBE (SLIM & SLEEK) 📸✨ */}
      <section 
        className="hero-mobile-margin"
        style={{ 
          height: "clamp(300px, 40vh, 400px)", 
          position: "relative", 
          overflow: "hidden", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          background: "#000",
          margin: "0 20px",
          marginTop: "20px",
          borderRadius: "16px"
        }}
      >
        
        {/* Imagem de Fundo Panorâmica */}
        <div style={{ 
          position: "absolute", inset: 0, 
          display: "grid", 
          gridTemplateColumns: "repeat(12, 1fr)", 
          gridTemplateRows: "repeat(6, 1fr)", 
          gap: 0, zIndex: 0,
          opacity: 0.6
        }}>
          {Array.from({ length: 72 }).map((_, i) => {
            const photoIds = [
              '1507003211169-0a1dd7228f2d', '1522202176988-66273c2fd55f', '1519389950473-47ba0277781c',
              '1556761175-b413da4baf72', '1497366216548-37526070297c', '1542744173-8e7e53415bb0',
              '1522071823991-b5ae71c4708e', '1517248135467-4c7edcad34c4', '1531482615713-2afd69097998',
              '1551836022-d5d88e9218df', '1516321497487-e288fb19713f', '1491975458591-174922118d59',
              '1521737604893-d14cc237f11d', '1531297484001-80022131f5a1', '1495360010541-f48722b34f7d',
              '1542744094-110bb0764132', '1522071901873-41981fb0300c', '1470225620780-dba8ba36b745',
              '1511671782779-c97d3d27a1d4', '1454165205744-3b78555e5572', '1513151233558-d860c5398176',
              '1504384308090-c594cf107983', '1504384764586-bb4cdc17457b', '1521737706096-3ad5a0542387'
            ];
            const pId = photoIds[i % photoIds.length];
            return (
              <div key={i} style={{ width: "100%", height: "100%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.02)" }}>
                <img
                  src={`https://images.unsplash.com/photo-${pId}?auto=format&fit=crop&q=10&w=200`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=10&w=200`;
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) brightness(0.6)" }}
                />
              </div>
            );
          })}
        </div>

        {/* Overlay Suave */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))", zIndex: 1 }} />

        {/* Conteúdo Centralizado e Equilibrado */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 24px", maxWidth: 800 }}>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ 
              fontSize: "clamp(9px, 1.2vw, 10px)", 
              letterSpacing: "0.4em", 
              textTransform: "uppercase", 
              color: "rgba(255,255,255,0.6)", 
              marginBottom: "1rem", 
              fontWeight: 700 
            }}
          >
            Coletivo Editorial de Imagem e Cinema
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-title-mobile"
            style={{
              fontFamily: THEME.fontBase,
              fontWeight: 800,
              fontSize: "clamp(32px, 6vw, 48px)",
              lineHeight: 1.1,
              color: "#FFFFFF",
              marginBottom: "1.5rem",
              textTransform: "uppercase",
              letterSpacing: "-0.02em"
            }}
          >
            Eternizando Cada Segundo.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{ 
              fontSize: "clamp(12px, 1.8vw, 14px)", 
              color: "rgba(255,255,255,0.7)", 
              marginBottom: "2.5rem", 
              fontWeight: 300, 
              maxWidth: "500px", 
              margin: "0 auto 2.5rem", 
              lineHeight: 1.6 
            }}
          >
            Uma curadoria refinada de experiências visuais. Acesse sua galeria exclusiva com a sofisticação que seu momento merece.
          </motion.p>

          {/* Barra de busca Compacta */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mobile-search"
            style={{ 
              maxWidth: 600, 
              margin: "0 auto", 
              position: "relative", 
              display: "flex", 
              background: "rgba(255,255,255,0.08)", 
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: "4px",
              padding: "4px" 
            }}
          >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar álbum (ex: Noivos)..."
                className="mobile-search-input"
                style={{
                  width: "100%", background: "transparent", border: "none",
                  padding: "12px 20px", fontSize: 14,
                  color: "#FFFFFF", outline: "none",
                  fontFamily: THEME.fontBase
                }}
              />
              <button
                onClick={() => fetchEvents(query, 1)}
                className="mobile-search-button"
                style={{
                  background: "#FFFFFF", color: "#000000", border: "none", padding: "0 20px",
                  borderRadius: "2px", fontSize: 10, fontWeight: 800, cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.1em", display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
          </motion.div>
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
          <span style={{ fontSize: 11, color: THEME.text2, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", borderBottom: `1px solid ${THEME.border}`, paddingBottom: 6, fontWeight: 700, whiteSpace: "nowrap" }}>
            Ver agenda completa
          </span>
        </div>

        {loading ? (
          <div className="events-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "3rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "rgba(127,127,127,0.05)", aspectRatio: "4/3", animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "8rem 0", border: `1px dashed ${THEME.border}` }}>
            <p style={{ fontFamily: THEME.fontBase, fontSize: 32, color: THEME.text2, fontWeight: 300 }}>Nada encontrado para sua busca.</p>
          </div>
        ) : (
          <div className="events-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "4rem 3rem" }}>
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
            onError={(e) => {
              const fallbacks = [
                "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1522673607200-164883eecd0c?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800",
              ];
              const img = e.currentTarget;
              img.onerror = null; // prevent infinite loop
              img.src = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            }}
          />
        ) : (
          <div style={{ 
            width: "100%", height: "100%", 
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(133,185,172,0.3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "rgba(133,185,172,0.2)", fontWeight: 700 }}>Em breve</span>
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

