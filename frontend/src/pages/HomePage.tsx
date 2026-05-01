import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { API } from "../lib/api";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
import { DICT } from "../lib/dictionary";
import { Navbar } from "../components/Navbar";

interface Event {
  id: string;
  slug: string | null;
  nomeNoivos: string;
  dataEvento: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  priceBase?: number;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
}


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

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", background: T.bgCard, display: "flex", flexDirection: "column" }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: "#161616", overflow: "hidden" }}>
        {(() => {
          const defaults = ["/defaults/cover1.png", "/defaults/cover2.png", "/defaults/cover3.png"];
          // Determina uma capa fixa baseada no ID do evento para não mudar no reload
          const index = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaults.length;
          const fallback = defaults[index];

          if (event.coverPhotoUrl) {
            return (
              <img
                src={event.coverPhotoUrl}
                alt={event.nomeNoivos}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
                onMouseOver={e => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseOut={e  => (e.currentTarget.style.transform = "scale(1)")}
                onError={e => { e.currentTarget.src = fallback; }}
              />
            );
          }
          return (
            <img
              src={fallback}
              alt="Capa Padrão"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
            />
          );
        })()}

        {/* Badge Hoje / Novo */}
        {today && (
          <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, fontFamily: T.fontB, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", background: T.brand, color: T.brandText, padding: "4px 10px", borderRadius: 0 }}>
            Hoje
          </span>
        )}
        {novo && (
          <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9, fontFamily: T.fontB, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", background: T.brand, color: T.brandText, padding: "4px 10px", borderRadius: 0 }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
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
  { n: "01", title: DICT.STEP_01_TITLE, desc: DICT.STEP_01_DESC },
  { n: "02", title: DICT.STEP_02_TITLE, desc: DICT.STEP_02_DESC },
  { n: "03", title: DICT.STEP_03_TITLE, desc: DICT.STEP_03_DESC },
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
  const [query, setQuery]       = useState("");
  const [events, setEvents]     = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  const fetch = useCallback(async (q: string, pg: number) => {
    setLoading(true);
    try {
      const { data } = await API.get("/public/events", { params: { q: q.trim() || undefined, page: pg } });
      setEvents(data.events ?? []);
      setTotal(data.pages ?? 1);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1); fetch(query, 1); }, 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, fetch]);

  useEffect(() => { fetch(query, page); }, [page, query, fetch]);

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.fontB }}>
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
        .card-hover { transition: opacity 0.2s; }
        .card-hover:hover { opacity: 0.88; }
        @media(max-width:768px){
          .hp-hero-title { font-size: clamp(38px,10vw,60px) !important; line-height: 1 !important; }
          .hp-grid { grid-template-columns: repeat(auto-fill, minmax(260px,1fr)) !important; }
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
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(24px, 6vw, 60px) clamp(16px, 4vw, 28px) 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ opacity: 1 }}>
          <p style={{ fontSize: 10, fontFamily: T.fontB, fontWeight: 400, letterSpacing: "0.35em", textTransform: "uppercase", color: T.brand, marginBottom: 20 }}>
            {DICT.HERO_TAGLINE}
          </p>

          <h1 className="hp-hero-title" style={{
            fontFamily: T.fontD, fontWeight: 900,
            fontSize: "clamp(48px, 7vw, 80px)",
            lineHeight: 0.95, color: T.text,
            textTransform: "uppercase", letterSpacing: "0.5px",
            margin: "0 0 24px",
          }}>
            {DICT.HERO_TITLE_PART1}
            <em style={{ fontStyle: "italic", color: T.brand }}>{DICT.HERO_TITLE_PART2_ITALIC}</em>
          </h1>

          <p style={{ fontSize: 14, color: T.text2, fontWeight: 300, maxWidth: 440, lineHeight: 1.6, margin: "0 0 36px", fontFamily: T.fontB }}>
            {DICT.HERO_DESCRIPTION}
          </p>

          {/* Search bar — input + botão UNIDOS, sem gap, sem border-radius */}
          <div className="hp-search-container" style={{ display: "flex", maxWidth: 560, marginBottom: 20 }}>
            <input
              className="hp-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetch(query, 1)}
              placeholder={DICT.SEARCH_PLACEHOLDER}
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
              {DICT.SEARCH_BUTTON}
            </button>
          </div>
          {/* Stats */}
          <div className="hp-stats" style={{ display: "flex", gap: 32, flexWrap: "wrap", marginTop: 32, paddingTop: 32, borderTop: `1px solid ${T.border}` }}>
            {[["500+", DICT.STATS_EVENTS], ["24h", DICT.STATS_DELIVERY], ["4.9★", DICT.STATS_RATING]].map(([val, label]) => (
              <div key={label} className="hp-stats-item">
                <div className="hp-stats-val" style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 28, color: T.text, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, fontFamily: T.fontB, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT GRID ───────────────────────────────────────────────────── */}
      <section style={{ padding: "0 0 48px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ borderLeft: `2px solid ${T.brand}`, paddingLeft: 16 }}>
              <p style={{ fontSize: 10, fontFamily: T.fontB, color: T.text3, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 4px" }}>{DICT.LATEST_REGISTERS_TAG}</p>
              <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(28px,4vw,42px)", color: T.text, textTransform: "uppercase", margin: 0, lineHeight: 1 }}>{DICT.LATEST_REGISTERS_TITLE}</h2>
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
              <p style={{ fontSize: 12, color: T.text3, fontFamily: T.fontB, marginTop: 8 }}>Tente buscar pelo nome completo do evento ou titular.</p>
            </div>
          ) : (
            <div className="hp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: T.border }}>
              {events.map(ev => (
                <div key={ev.id} className="card-hover">
                  <EventCard event={ev} onClick={() => navigate(`/e/${ev.slug || ev.id}`)} />
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
      <section style={{ padding: "48px 28px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.bgCard }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, fontFamily: T.fontB, color: T.brand, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 12 }}>Processo</p>
          <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(32px,5vw,52px)", color: T.text, textTransform: "uppercase", margin: "0 0 48px", lineHeight: 1 }}>
            {DICT.HOW_IT_WORKS_TITLE}
          </h2>
          <div className="hp-steps" style={{ display: "flex", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div 
                key={step.n} 
                className="hp-step-item"
                style={{ 
                  flex: 1, 
                  padding: "32px 0", 
                  borderRight: i < STEPS.length - 1 ? `1px solid ${T.border}` : "none", 
                  paddingRight: i < STEPS.length - 1 ? 40 : 0, 
                  paddingLeft: i > 0 ? 40 : 0 
                }}
              >
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
          {DICT.CTA_EXCLUSIVE}{" "}
          <span style={{ color: T.brand, fontWeight: 500, borderBottom: `1px solid ${T.brand}` }}>{DICT.CTA_REQUEST_QUOTE}</span>
        </span>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "32px 28px" }}>
        <div className="hp-footer-inner" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 20, objectFit: "contain" }} />
            </div>
            <p style={{ fontSize: 11, fontFamily: T.fontB, color: T.text3, lineHeight: 1.8, maxWidth: 260, margin: 0, whiteSpace: "pre-line" }}>
              {DICT.FOOTER_COPYRIGHT}
            </p>
          </div>
          <div className="hp-footer-cols" style={{ display: "flex", gap: "3.5rem", flexWrap: "wrap" }}>
            <FooterCol title="Plataforma" links={["Sobre", "Parcerias"]} />
            <FooterCol title="Jurídico" links={["Termos de Uso", "Privacidade", "LGPD"]} />
            <FooterCol title="Suporte" links={["Central de Ajuda", "Contato", "Status"]} />
          </div>
        </div>
      </footer>
    </div>
  );
};
