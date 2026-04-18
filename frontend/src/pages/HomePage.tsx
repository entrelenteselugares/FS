import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
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
  } catch (e) {
    return "Data indisponível";
  }
}

function isRecent(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 3 * 24 * 60 * 60 * 1000; // 3 dias
  } catch (e) {
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
    : user?.role === "CARTORIO" ? "/cartorio"
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
  }, [page]);

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
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(20px, 5vw)", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, background: "#c9a96e", borderRadius: "50%", display: "inline-block" }} />
          Foto Segundo
        </div>
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              style={{ fontSize: 9, background: "rgba(201,169,110,0.1)", color: "#c9a96e", border: "1px solid rgba(201,169,110,0.3)", padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}
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
            style={{ fontSize: 9, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}
          >
            Acesso
          </button>
        )}
      </nav>

      {/* HERO */}
      <section style={{ padding: "6rem 1rem 4rem", textAlign: "center", position: "relative", background: "radial-gradient(circle at 50% 0%, rgba(201, 169, 110, 0.08) 0%, transparent 70%)" }}>
        <p style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#c9a96e", marginBottom: "1rem", fontWeight: 700, opacity: 0.8 }}>
          Photography & Cinema Collective
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 10vw, 84px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
          Suas memórias,<br />
          <em style={{ fontStyle: "italic", color: "#c9a96e", fontWeight: 400 }}>sincronizadas com a vida.</em>
        </h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: "2.5rem", fontWeight: 300, maxWidth: "500px", margin: "0 auto 3rem", lineHeight: 1.5 }}>
          Acesse a galeria exclusiva do seu casamento e reviva cada detalhe com qualidade premium em segundos.
        </p>

        {/* Barra de busca Responsiva */}
        <div className="search-container" style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Noivos, data ou cartório..."
            className="search-input"
            style={{
              width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 50, padding: "18px 30px", fontSize: 14,
              color: "#fff", outline: "none", transition: "all 0.4s",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          />
          <button
            onClick={() => fetchEvents(query, 1)}
            className="search-button"
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: "#c9a96e", color: "#050505", border: "none", padding: "10px 25px",
              borderRadius: 40, fontSize: 10, fontWeight: 700, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: "1px"
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
                borderColor: categoria === cat ? "#c9a96e" : "rgba(255,255,255,0.05)",
                borderRadius: 20, color: categoria === cat ? "#c9a96e" : "#555",
                background: categoria === cat ? "rgba(201, 169, 110, 0.1)" : "transparent",
                cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600, transition: "all .3s",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 480px) {
          .search-input { padding: 16px 20px !important; border-radius: 12px !important; }
          .search-button { 
            position: static !important; transform: none !important; 
            width: 100% !important; margin-top: 10px !important; 
            border-radius: 8px !important; padding: 14px !important;
          }
          .search-container { display: flex; flex-direction: column; }
        }
        .search-input:focus { border-color: #c9a96e !important; background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* GRID DE EVENTOS */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "3rem" }}>
          <div>
            <p style={{ fontSize: 10, color: "#c9a96e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Showcase</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#fff" }}>
              Eventos <span style={{ fontStyle: "italic", color: "#555" }}>Recentes</span>
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
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#555", marginBottom: 12 }}>Nenhum registro encontrado</p>
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
              style={{ padding: "0 0 5px 0", background: "transparent", border: "none", borderBottom: "1px solid", borderColor: page === 1 ? "transparent" : "#333", color: page === 1 ? "transparent" : "#888", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 10, textTransform: "uppercase", letterSpacing: 2 }}
            >
              Back
            </button>
            <span style={{ fontSize: 12, color: "#fff", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
              {page} <span style={{ color: "#333", margin: "0 10px" }}>/</span> {totalPages}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              style={{ padding: "0 0 5px 0", background: "transparent", border: "none", borderBottom: "1px solid", borderColor: page === totalPages ? "transparent" : "#c9a96e", color: page === totalPages ? "transparent" : "#c9a96e", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 10, textTransform: "uppercase", letterSpacing: 2 }}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "4rem 2rem", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "2rem", maxWidth: 1400, margin: "6rem auto 0" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#c9a96e" }}>FOTO SEGUNDO.</div>
        <div style={{ display: "flex", gap: "3rem" }}>
          {["Parcerias", "Cartórios", "Contato"].map((l) => (
            <span key={l} style={{ fontSize: 10, color: "#555", cursor: "pointer", textTransform: "uppercase", letterSpacing: 2 }}>{l}</span>
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
             <div style={{ width: 30, height: 30, border: "0.5px solid #222", transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <div style={{ width: 4, height: 4, background: "#c9a96e" }} />
             </div>
             <span style={{ fontSize: 8, color: "#222", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Private Archive</span>
          </div>
        </div>
        
        {isNew && (
          <span style={{
            position: "absolute", top: 15, left: 15,
            fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
            background: "#c9a96e", color: "#050505",
            padding: "4px 10px", fontWeight: 700,
          }}>
            Recently Added
          </span>
        )}

        <div style={{ position: "absolute", bottom: 15, right: 15, display: "flex", gap: 6 }}>
          {event.temFoto && <ServiceBadge label="Digital" />}
          {event.temVideo && <ServiceBadge label="Cinema" />}
        </div>
      </div>

      {/* Meta Info */}
      <div style={{ padding: "20px 0" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-0.01em" }}>
          {event.nomeNoivos}
        </h3>
        <div style={{ fontSize: 11, color: "#444", display: "flex", gap: 12, alignItems: "center", textTransform: "uppercase", letterSpacing: 1.5 }}>
          <span>{formatDate(event.dataEvento)}</span>
          <span style={{ width: 4, height: 1, background: "#333" }} />
          <span>{event.cartorio || "Public Event"}</span>
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
