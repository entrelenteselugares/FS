import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { T, BtnPrimary, BtnSecondary } from "../lib/theme";
import { ThemeToggle } from "../components/ThemeToggle";

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

const CATEGORIES = ["Todos", "Foto", "Vídeo", "Reels", "Álbum"];

function formatDate(d: string) {
  try { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)); }
  catch { return "—"; }
}

function isToday(d: string) {
  const ev = new Date(d); const now = new Date();
  return ev.getDate() === now.getDate() && ev.getMonth() === now.getMonth() && ev.getFullYear() === now.getFullYear();
}

function isRecent(d: string) {
  return Date.now() - new Date(d).getTime() < 7 * 24 * 60 * 60 * 1000;
}

// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const today = isToday(event.dataEvento);
  const novo  = !today && isRecent(event.dataEvento);
  const price = Number(event.priceBase ?? 190);

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", background: T.bgCard, display: "flex", flexDirection: "column" }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: "#161616", overflow: "hidden" }}>
        {event.coverPhotoUrl ? (
          <img
            src={event.coverPhotoUrl}
            alt={event.nomeNoivos}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
            onMouseOver={e => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseOut={e  => (e.currentTarget.style.transform = "scale(1)")}
            onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=60"; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="1"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        )}

        {/* Badge Hoje / Novo */}
        {today && (
          <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, fontFamily: T.fontB, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", background: T.brand, color: "#0a0a0a", padding: "4px 10px", borderRadius: 0 }}>
            Hoje
          </span>
        )}
        {novo && (
          <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, fontFamily: T.fontB, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", background: T.brand, color: "#0a0a0a", padding: "4px 10px", borderRadius: 0 }}>
            Novo
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 18px" }}>
        <h3 style={{ fontFamily: T.fontD, fontWeight: 800, fontSize: 19, textTransform: "uppercase", color: T.text, margin: "0 0 6px", lineHeight: 1.1 }}>
          {event.nomeNoivos}
        </h3>
        <div style={{ fontSize: 11, color: T.text3, fontFamily: T.fontB, fontWeight: 400, display: "flex", gap: 10, marginBottom: 10 }}>
          <span>{formatDate(event.dataEvento)}</span>
          {event.cartorio && <><span>·</span><span>{event.cartorio}</span></>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: T.fontD, fontWeight: 700, fontSize: 17, color: T.brand }}>
            R$ {price.toFixed(0)}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {event.temFoto  && <span style={{ fontSize: 9, fontFamily: T.fontB, color: T.text3, letterSpacing: 1, textTransform: "uppercase", border: `1px solid ${T.border}`, padding: "2px 7px" }}>Foto</span>}
            {event.temVideo && <span style={{ fontSize: 9, fontFamily: T.fontB, color: T.text3, letterSpacing: 1, textTransform: "uppercase", border: `1px solid ${T.border}`, padding: "2px 7px" }}>Vídeo</span>}
            {event.temReels && <span style={{ fontSize: 9, fontFamily: T.fontB, color: T.text3, letterSpacing: 1, textTransform: "uppercase", border: `1px solid ${T.border}`, padding: "2px 7px" }}>Reels</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STEPS ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Encontre seu evento", desc: "Busque pelo nome dos noivos ou data. Sua galeria estará aguardando." },
  { n: "02", title: "Realize o pagamento", desc: "Checkout seguro via Pix ou cartão. Aprovação imediata." },
  { n: "03", title: "Acesse os arquivos", desc: "Links do Lightroom e Google Drive liberados na hora. Faça o download quando quiser." },
];

// ── FOOTER NAV ────────────────────────────────────────────────────────────────
function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontSize: 10, fontFamily: T.fontB, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text }}>{title}</span>
      {links.map(l => (
        <span key={l} style={{ fontSize: 11, fontFamily: T.fontB, color: T.text3, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}
          onMouseOver={e => (e.currentTarget.style.color = T.text)} onMouseOut={e => (e.currentTarget.style.color = T.text3)}>
          {l}
        </span>
      ))}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery]       = useState("");
  const [cat, setCat]           = useState("Todos");
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [userMenu, setUserMenu] = useState(false);
  const debounce = useRef<any>(null);
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  const dashPath = user?.role === "ADMIN" ? "/admin"
    : user?.role === "PROFISSIONAL" ? "/profissional"
    : (user?.role === "CARTORIO" || user?.role === "UNIDADE") ? "/unidade-fixa"
    : "/minha-conta";

  const fetch = async (q: string, pg: number) => {
    setLoading(true);
    try {
      const { data } = await API.get("/public/events", { params: { q: q.trim() || undefined, page: pg } });
      setEvents(data.events ?? []);
      setTotal(data.pages ?? 1);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1); fetch(query, 1); }, 400);
    return () => clearTimeout(debounce.current);
  }, [query]);

  useEffect(() => { fetch(query, page); }, [page]);

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.fontB }}>
      <Helmet>
        <title>Foto Segundo | Suas memórias, entregues agora.</title>
        <meta name="description" content="Acesse a galeria exclusiva do seu grande dia. Fotos e vídeos em segundos." />
      </Helmet>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .hp-search-input:focus { outline: none; }
        .hp-search-input::placeholder { color: ${T.text3}; }
        .chip { transition: all 0.15s; cursor: pointer; }
        .card-hover { transition: opacity 0.2s; }
        .card-hover:hover { opacity: 0.88; }
        @media(max-width:768px){
          .hp-hero-title { font-size: clamp(38px,10vw,60px) !important; }
          .hp-grid { grid-template-columns: repeat(auto-fill, minmax(260px,1fr)) !important; }
          .hp-steps { flex-direction: column !important; }
          .hp-footer-inner { flex-direction: column !important; gap: 2.5rem !important; }
          .hp-footer-cols { gap: 2rem !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav id="main-nav" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: `1px solid ${T.border}`,
        background: "var(--theme-bg-nav)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 26, objectFit: "contain" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          {user ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setUserMenu(v => !v)} style={{ ...BtnSecondary, fontSize: 11, padding: "9px 16px" }}>
                {user.nome.split(" ")[0]} <span style={{ fontSize: 8, marginLeft: 4 }}>▾</span>
              </button>
              {userMenu && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: T.bgCard, border: `1px solid ${T.border}`, minWidth: 160, zIndex: 200 }}>
                  <button onClick={() => { setUserMenu(false); navigate(dashPath); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 11, fontFamily: T.fontB, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>Meu Painel</button>
                  <button onClick={() => { logout(); setUserMenu(false); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "transparent", border: "none", color: T.text2, fontSize: 11, fontFamily: T.fontB, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>Sair</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} style={{ ...BtnSecondary, fontSize: 11, padding: "9px 18px" }}>
              Acesso
            </button>
          )}
          <button onClick={() => navigate("/cotacao")} style={{ ...BtnPrimary, fontSize: 12, padding: "11px 20px" }}>
            Agendar
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 28px 64px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <p style={{ fontSize: 10, fontFamily: T.fontB, fontWeight: 400, letterSpacing: "0.35em", textTransform: "uppercase", color: T.brand, marginBottom: 20 }}>
            Coletivo Editorial de Imagem e Cinema
          </p>

          <h1 className="hp-hero-title" style={{
            fontFamily: T.fontD, fontWeight: 900,
            fontSize: "clamp(48px, 7vw, 80px)",
            lineHeight: 0.95, color: T.text,
            textTransform: "uppercase", letterSpacing: "0.5px",
            margin: "0 0 24px",
          }}>
            Suas memórias,{" "}
            <em style={{ fontStyle: "italic", color: T.brand }}>entregues agora.</em>
          </h1>

          <p style={{ fontSize: 14, color: T.text2, fontWeight: 300, maxWidth: 440, lineHeight: 1.6, margin: "0 0 36px", fontFamily: T.fontB }}>
            Acesse a galeria exclusiva do seu grande dia. Fotos e vídeos com qualidade premium, disponíveis em segundos após o evento.
          </p>

          {/* Search bar — input + botão UNIDOS, sem gap, sem border-radius */}
          <div style={{ display: "flex", maxWidth: 560, marginBottom: 20 }}>
            <input
              className="hp-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetch(query, 1)}
              placeholder="Buscar pelo nome dos noivos..."
              style={{
                flex: 1, background: "var(--bg-field)",
                border: `1px solid var(--border-2)`, borderRight: "none",
                padding: "13px 16px", fontSize: 13,
                color: T.text, fontFamily: T.fontB, fontWeight: 300,
                borderRadius: 0, outline: "none",
              }}
            />
            <button
              onClick={() => fetch(query, 1)}
              style={{
                background: T.brand, color: T.brandText, border: "none",
                padding: "13px 22px", fontFamily: T.fontD, fontWeight: 900,
                fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
                cursor: "pointer", borderRadius: 0, flexShrink: 0,
              }}
            >
              Buscar
            </button>
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => {
              const active = cat === c;
              return (
                <button key={c} className="chip" onClick={() => setCat(c)} style={{
                  fontSize: 10, fontFamily: T.fontB, fontWeight: 400,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  padding: "6px 14px", borderRadius: 0, cursor: "pointer",
                  border: `1px solid ${active ? T.brand : T.border}`,
                  color: active ? T.brand : T.text3,
                  background: active ? T.brandDark : "transparent",
                }}>
                  {c}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 40, marginTop: 40, paddingTop: 32, borderTop: `1px solid ${T.border}` }}>
            {[["500+", "Eventos Registrados"], ["24h", "Entrega Garantida"], ["4.9★", "Avaliação Média"]].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 28, color: T.text, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, fontFamily: T.fontB, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── EVENT GRID ───────────────────────────────────────────────────── */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ borderLeft: `2px solid ${T.brand}`, paddingLeft: 16 }}>
              <p style={{ fontSize: 10, fontFamily: T.fontB, color: T.text3, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 4px" }}>Arquivo Recente</p>
              <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(28px,4vw,42px)", color: T.text, textTransform: "uppercase", margin: 0, lineHeight: 1 }}>Últimos Registros</h2>
            </div>
            {totalPages > 1 && (
              <span style={{ fontSize: 11, fontFamily: T.fontB, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Pág. {page} / {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            // Skeleton grid — gap 1px, background #1c1c1c cria o "divisor"
            <div className="hp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: T.border }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: T.bgCard, aspectRatio: "4/3", animation: "pulse 1.8s infinite" }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 0", border: `1px dashed ${T.border}` }}>
              <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 32, color: T.text2, textTransform: "uppercase" }}>Nenhum resultado encontrado.</p>
              <p style={{ fontSize: 12, color: T.text3, fontFamily: T.fontB, marginTop: 8 }}>Tente buscar pelo nome completo dos noivos.</p>
            </div>
          ) : (
            <div className="hp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: T.border }}>
              {events.map(ev => (
                <div key={ev.id} className="card-hover">
                  <EventCard event={ev} onClick={() => navigate(`/e/${ev.id}`)} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 32, marginTop: 48 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: "none", border: "none", color: page === 1 ? T.border : T.text2, cursor: page === 1 ? "default" : "pointer", fontSize: 11, fontFamily: T.fontB, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                ← Anterior
              </button>
              <span style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 20, color: T.text }}>
                {page} <span style={{ color: T.border, margin: "0 8px" }}>—</span> {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: "none", border: "none", color: page === totalPages ? T.border : T.text, cursor: page === totalPages ? "default" : "pointer", fontSize: 11, fontFamily: T.fontB, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Próximo →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 28px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.bgCard }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, fontFamily: T.fontB, color: T.brand, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 12 }}>Processo</p>
          <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(32px,5vw,52px)", color: T.text, textTransform: "uppercase", margin: "0 0 48px", lineHeight: 1 }}>
            Como Funciona
          </h2>
          <div className="hp-steps" style={{ display: "flex", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ flex: 1, padding: "32px 32px 32px 0", borderRight: i < STEPS.length - 1 ? `1px solid ${T.border}` : "none", paddingRight: i < STEPS.length - 1 ? 40 : 0, paddingLeft: i > 0 ? 40 : 0 }}>
                <div style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 48, color: T.brand, lineHeight: 1, marginBottom: 16, opacity: 0.6 }}>{step.n}</div>
                <h3 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 22, color: T.text, textTransform: "uppercase", margin: "0 0 10px", letterSpacing: "0.5px" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: T.text2, fontFamily: T.fontB, fontWeight: 300, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section 
        onClick={() => navigate("/cotacao")} 
        style={{ 
          padding: "48px 28px", textAlign: "center", cursor: "pointer", 
          borderBottom: `1px solid ${T.border}`,
          background: isCtaHovered ? T.bgCard : "transparent",
          transition: "background 0.3s ease"
        }}
        onMouseEnter={() => setIsCtaHovered(true)} 
        onMouseLeave={() => setIsCtaHovered(false)}
      >
        <span style={{ fontSize: 13, fontFamily: T.fontB, color: T.text2, fontWeight: 300 }}>
          Deseja uma cobertura exclusiva?{" "}
          <span style={{ color: T.brand, fontWeight: 500, borderBottom: `1px solid ${T.brand}` }}>Solicite um orçamento →</span>
        </span>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "56px 28px 32px" }}>
        <div className="hp-footer-inner" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 20, objectFit: "contain" }} />
            </div>
            <p style={{ fontSize: 11, fontFamily: T.fontB, color: T.text3, lineHeight: 1.8, maxWidth: 260, margin: 0 }}>
              Protocolo Editorial de Imagem e Cinema.<br />© 2026 Todos os Direitos Reservados.
            </p>
          </div>
          <div className="hp-footer-cols" style={{ display: "flex", gap: "3.5rem", flexWrap: "wrap" }}>
            <FooterCol title="Plataforma" links={["Sobre", "Parcerias", "Hall da Fama"]} />
            <FooterCol title="Jurídico" links={["Termos de Uso", "Privacidade", "LGPD"]} />
            <FooterCol title="Suporte" links={["Central de Ajuda", "Contato", "Status"]} />
          </div>
        </div>
      </footer>
    </div>
  );
};
