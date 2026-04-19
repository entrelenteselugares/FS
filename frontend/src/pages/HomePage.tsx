import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
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
      // Pequeno delay para suavidade da animação do skeleton
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Debounce na busca
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
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", background: "#050505", color: "#e8e4dc", minHeight: "100vh" }}>
      <Helmet>
        <title>Foto Segundo | Suas memórias, sincronizadas com a vida.</title>
        <meta name="description" content="Acesse a galeria exclusiva do seu casamento e reviva cada detalhe com qualidade premium em segundos." />
      </Helmet>
      
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav 
        id="main-nav"
        style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          padding: "1rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", 
          background: "rgba(5,5,5,0.8)", backdropFilter: "blur(10px)", 
          position: "sticky", top: 0, zIndex: 100 
        }}
      >
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "min(24px, 6vw)", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
          <img src="/logo-circular.png" alt="" style={{ width: 32, height: 32, objectFit: "contain" }} onError={(e) => (e.currentTarget.style.display = "none")} />
          Foto Segundo
        </div>
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              style={{ fontSize: 9, background: "rgba(93,101,50,0.1)", color: "#5D6532", border: "1px solid rgba(93,101,50,0.3)", padding: "10px 18px", borderRadius: 0, cursor: "pointer", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}
            >
              {user.nome.split(" ")[0]}
              <span style={{ fontSize: 8 }}>▾</span>
            </button>
            {userMenuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, minWidth: 160, zIndex: 200, overflow: "hidden" }}>
                {dashboardPath && (
                  <button onClick={() => { setUserMenuOpen(false); navigate(dashboardPath); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "transparent", border: "none", color: "#e8e4dc", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    Meu Painel
                  </button>
                )}
                <button onClick={() => { logout(); setUserMenuOpen(false); navigate("/"); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "transparent", border: "none", color: "#666", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer" }}>
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            style={{ fontSize: 9, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 18px", borderRadius: 0, cursor: "pointer", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}
          >
            Acesso
          </button>
        )}
      </nav>

      {/* HERO */}
      <section style={{ padding: "8rem 1rem 6rem", textAlign: "center", position: "relative", background: "radial-gradient(circle at 50% 0%, rgba(93, 101, 50, 0.1) 0%, transparent 70%)" }}>
        <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#5D6532", marginBottom: "1.5rem", fontWeight: 800 }}>
          Photography & Cinema Collective
        </p>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(40px, 12vw, 110px)", fontWeight: 800, color: "#fff", lineHeight: 0.9, letterSpacing: "-0.02em", marginBottom: "2rem", textTransform: "uppercase" }}>
          Suas memórias,<br />
          <em style={{ fontStyle: "italic", color: "#5D6532", fontWeight: 400 }}>sincronizadas com a vida.</em>
        </h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: "2.5rem", fontWeight: 300, maxWidth: "500px", margin: "0 auto 3rem", lineHeight: 1.5 }}>
          Acesse a galeria exclusiva do seu casamento e reviva cada detalhe com qualidade premium em segundos.
        </p>

        {/* Barra de busca Responsiva */}
        <div className="search-container" style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por noivos, data ou unidade estratégica..."
              className="search-input"
              style={{
                width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 2, padding: "20px 30px", fontSize: 14,
                color: "#fff", outline: "none", transition: "all 0.4s",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
              }}
            />
            <button
              onClick={() => fetchEvents(query, 1)}
              className="search-button"
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "#5D6532", color: "#fff", border: "none", padding: "12px 30px",
                borderRadius: 2, fontSize: 10, fontWeight: 800, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "2px"
              }}
            >
              Buscar
            </button>
        </div>

        {/* Chips de categoria */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}>
          {CATEGORIAS.map((cat) => (
            <span
              key={cat}
              onClick={() => setCategoria(cat)}
              style={{
                fontSize: 9, padding: "5px 14px",
                border: "1px solid",
                borderColor: categoria === cat ? "#5D6532" : "rgba(255,255,255,0.05)",
                borderRadius: 2, color: categoria === cat ? "#fff" : "#555",
                background: categoria === cat ? "#5D6532" : "transparent",
                cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, transition: "all .3s",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      <style>{`
        }
        .search-input:focus { border-color: #5D6532 !important; background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* GRID DE EVENTOS */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "3rem" }}>
          <div>
            <p style={{ fontSize: 11, color: "#5D6532", letterSpacing: 4, textTransform: "uppercase", marginBottom: 10, fontWeight: 800 }}>Showcase</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>
              Eventos <span style={{ fontStyle: "italic", color: "#333" }}>Recentes</span>
            </h2>
          </div>
          <span style={{ fontSize: 11, color: "#888", letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", borderBottom: "1px solid #333", paddingBottom: 4 }}>
            Ver agenda completa
          </span>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.01)", borderRadius: 0, overflow: "hidden" }}>
                <div style={{ width: "100%", aspectRatio: "16/10", background: "#111", animation: "pulse 2s infinite" }} />
                <div style={{ padding: "24px 0" }}>
                  <div style={{ height: 18, background: "#111", borderRadius: 2, marginBottom: 12, width: "70%" }} />
                  <div style={{ height: 12, background: "#111", borderRadius: 2, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 0", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, color: "#555", marginBottom: 12, textTransform: "uppercase", fontWeight: 800 }}>Nenhum registro encontrado</p>
            <p style={{ fontSize: 14, color: "#333" }}>Tente buscar por termos diferentes ou verifique a categoria.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "3rem" }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/e/${event.id}`)} />
            ))}
          </div>
        )}

        {/* Paginação Premium */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30, marginTop: "5rem" }}>
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              disabled={page === 1}
              style={{ padding: "0 0 5px 0", background: "transparent", border: "none", borderBottom: "1px solid", borderColor: page === 1 ? "transparent" : "#333", color: page === 1 ? "transparent" : "#888", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 10, textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}
            >
              Back
            </button>
            <span style={{ fontSize: 13, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2 }}>
              {page} <span style={{ color: "#333", margin: "0 10px" }}>/</span> {totalPages}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              style={{ padding: "0 0 5px 0", background: "transparent", border: "none", borderBottom: "1px solid", borderColor: page === totalPages ? "transparent" : "#5D6532", color: page === totalPages ? "transparent" : "#5D6532", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 10, textTransform: "uppercase", letterSpacing: 2 }}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "6rem 2rem", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "2rem", maxWidth: 1400, margin: "6rem auto 0" }}>
        <img src="/logo-horizontal.png" alt="Foto Segundo" style={{ height: 24, objectFit: "contain" }} onError={(e) => (e.currentTarget.style.display = "none")} />
        <div style={{ display: "flex", gap: "3rem" }}>
          {["Parcerias", "Unidades Locais", "Contato"].map((l) => (
            <span key={l} style={{ fontSize: 10, color: "#555", cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: 10, color: "#222", textTransform: "uppercase", letterSpacing: 2 }}>© 2026 Archive.</span>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow-x: hidden; }
      `}</style>
    </div>
  );
}

// ── Componente do Card Editorial ──────────────────────────

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const isNew = isRecent(event.dataEvento);

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", overflow: "hidden", transition: "all 0.4s" }}
      className="group"
    >
      {/* Imagem Editorial */}
      <div style={{ width: "100%", aspectRatio: "16/11", background: "#0d0d0d", position: "relative", overflow: "hidden" }}>
        {event.coverPhotoUrl ? (
          <img 
            src={event.coverPhotoUrl} 
            alt={event.nomeNoivos} 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = (e.currentTarget as HTMLImageElement).parentElement;
              if (parent) {
                const placeholder = parent.querySelector(".image-placeholder");
                if (placeholder) (placeholder as HTMLElement).style.display = "flex";
              }
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8, transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} 
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : null}

        <div className="image-placeholder" style={{ 
          width: "100%", height: "100%", 
          display: event.coverPhotoUrl ? "none" : "flex", 
          alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #050505 0%, #0d0d0d 100%)"
        }}>
          <div style={{ textAlign: "center" }}>
             <div style={{ width: 30, height: 30, border: "0.5px solid #222", borderLeftColor: "#5D6532", borderTopColor: "#5D6532", transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <div style={{ width: 4, height: 4, background: "#5D6532" }} />
             </div>
             <span style={{ fontSize: 8, color: "#222", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Private Archive</span>
          </div>
        </div>
        
        {isNew && (
          <span style={{
            position: "absolute", top: 15, left: 15,
            fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
            background: "#5D6532", color: "#fff",
            padding: "8px 16px", fontWeight: 800,
          }}>
            RECENTEMENTE ADICIONADO
          </span>
        )}

        <div style={{ position: "absolute", bottom: 15, right: 15, display: "flex", gap: 6 }}>
          {event.temFoto && <ServiceBadge label="Digital" />}
          {event.temVideo && <ServiceBadge label="Cinema" />}
        </div>
      </div>

      {/* Meta Info */}
      <div style={{ padding: "20px 0" }}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "1px", textTransform: "uppercase" }}>
          {event.nomeNoivos}
        </h3>
        <div style={{ fontSize: 11, color: "#444", display: "flex", gap: 12, alignItems: "center", textTransform: "uppercase", letterSpacing: 1.5 }}>
          <span>{formatDate(event.dataEvento)}</span>
          <span style={{ width: 4, height: 1, background: "#333" }} />
          <span>{event.cartorio || "Unidade Local"}</span>
        </div>
      </div>
    </div>
  );
}

function ServiceBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 8, padding: "3px 8px", background: "rgba(5,5,5,0.7)",
      border: "1px solid rgba(255,255,255,0.05)", borderRadius: 0, color: "#aaa",
      letterSpacing: "1px", textTransform: "uppercase", backdropFilter: "blur(5px)"
    }}>
      {label}
    </span>
  );
}
