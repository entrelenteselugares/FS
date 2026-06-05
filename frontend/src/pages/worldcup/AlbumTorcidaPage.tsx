import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { API as api } from "../../lib/api";
import { T } from "../../lib/theme";
import { Trophy, Camera, Clock, ChevronRight, Star, Zap, Calendar } from "lucide-react";

// ─── Copa 2026 Data ───────────────────────────────────────────────────────────
const GROUPS: Array<{
  id: string;
  teams: Array<{ name: string; code: string }>;
}> = [
  { id:"A", teams: [{ name:"México", code:"mx" }, { name:"África do Sul", code:"za" }, { name:"Coreia do Sul", code:"kr" }, { name:"Tchéquia", code:"cz" }] },
  { id:"B", teams: [{ name:"Canadá", code:"ca" }, { name:"Bósnia-Herz.", code:"ba" }, { name:"Catar", code:"qa" }, { name:"Suíça", code:"ch" }] },
  { id:"C", teams: [{ name:"Brasil", code:"br" }, { name:"Marrocos", code:"ma" }, { name:"Haiti", code:"ht" }, { name:"Escócia", code:"gb-sct" }] },
  { id:"D", teams: [{ name:"EUA", code:"us" }, { name:"Paraguai", code:"py" }, { name:"Austrália", code:"au" }, { name:"Turquia", code:"tr" }] },
  { id:"E", teams: [{ name:"Alemanha", code:"de" }, { name:"Curaçao", code:"cw" }, { name:"Costa do Marfim", code:"ci" }, { name:"Equador", code:"ec" }] },
  { id:"F", teams: [{ name:"Holanda", code:"nl" }, { name:"Japão", code:"jp" }, { name:"Suécia", code:"se" }, { name:"Tunísia", code:"tn" }] },
  { id:"G", teams: [{ name:"Bélgica", code:"be" }, { name:"Egito", code:"eg" }, { name:"Irã", code:"ir" }, { name:"Nova Zelândia", code:"nz" }] },
  { id:"H", teams: [{ name:"Espanha", code:"es" }, { name:"Cabo Verde", code:"cv" }, { name:"Arábia Saudita", code:"sa" }, { name:"Uruguai", code:"uy" }] },
  { id:"I", teams: [{ name:"França", code:"fr" }, { name:"Senegal", code:"sn" }, { name:"Iraque", code:"iq" }, { name:"Noruega", code:"no" }] },
  { id:"J", teams: [{ name:"Argentina", code:"ar" }, { name:"Argélia", code:"dz" }, { name:"Áustria", code:"at" }, { name:"Jordânia", code:"jo" }] },
  { id:"K", teams: [{ name:"Portugal", code:"pt" }, { name:"RD Congo", code:"cd" }, { name:"Uzbequistão", code:"uz" }, { name:"Colômbia", code:"co" }] },
  { id:"L", teams: [{ name:"Inglaterra", code:"gb-eng" }, { name:"Croácia", code:"hr" }, { name:"Gana", code:"gh" }, { name:"Panamá", code:"pa" }] },
];

const FIXTURES: Array<{
  id: string; group: string; home: string; hCode: string;
  away: string; aCode: string; utc: string; round: number;
}> = [
  // R1
  { id:"g1",  group:"A", home:"México",        hCode:"mx",     away:"África do Sul",  aCode:"za",     utc:"2026-06-11T19:00:00Z", round:1 },
  { id:"g2",  group:"A", home:"Coreia do Sul",  hCode:"kr",     away:"Tchéquia",       aCode:"cz",     utc:"2026-06-12T02:00:00Z", round:1 },
  { id:"g3",  group:"B", home:"Canadá",         hCode:"ca",     away:"Bósnia",         aCode:"ba",     utc:"2026-06-12T19:00:00Z", round:1 },
  { id:"g4",  group:"D", home:"EUA",            hCode:"us",     away:"Paraguai",       aCode:"py",     utc:"2026-06-13T01:00:00Z", round:1 },
  { id:"g5",  group:"D", home:"Austrália",      hCode:"au",     away:"Turquia",        aCode:"tr",     utc:"2026-06-13T04:00:00Z", round:1 },
  { id:"g6",  group:"B", home:"Catar",          hCode:"qa",     away:"Suíça",          aCode:"ch",     utc:"2026-06-13T19:00:00Z", round:1 },
  { id:"g7",  group:"C", home:"Brasil",         hCode:"br",     away:"Marrocos",       aCode:"ma",     utc:"2026-06-13T22:00:00Z", round:1 },
  { id:"g8",  group:"C", home:"Haiti",          hCode:"ht",     away:"Escócia",        aCode:"gb-sct", utc:"2026-06-14T01:00:00Z", round:1 },
  { id:"g9",  group:"E", home:"Alemanha",       hCode:"de",     away:"Curaçao",        aCode:"cw",     utc:"2026-06-14T17:00:00Z", round:1 },
  { id:"g10", group:"F", home:"Holanda",        hCode:"nl",     away:"Japão",          aCode:"jp",     utc:"2026-06-14T20:00:00Z", round:1 },
  { id:"g11", group:"E", home:"Costa do Marfim",hCode:"ci",     away:"Equador",        aCode:"ec",     utc:"2026-06-14T23:00:00Z", round:1 },
  { id:"g12", group:"F", home:"Suécia",         hCode:"se",     away:"Tunísia",        aCode:"tn",     utc:"2026-06-15T02:00:00Z", round:1 },
  { id:"g13", group:"H", home:"Espanha",        hCode:"es",     away:"Cabo Verde",     aCode:"cv",     utc:"2026-06-15T16:00:00Z", round:1 },
  { id:"g14", group:"G", home:"Bélgica",        hCode:"be",     away:"Egito",          aCode:"eg",     utc:"2026-06-15T19:00:00Z", round:1 },
  { id:"g15", group:"H", home:"Arábia Saudita", hCode:"sa",     away:"Uruguai",        aCode:"uy",     utc:"2026-06-15T22:00:00Z", round:1 },
  { id:"g16", group:"G", home:"Irã",            hCode:"ir",     away:"Nova Zelândia",  aCode:"nz",     utc:"2026-06-16T01:00:00Z", round:1 },
  { id:"g17", group:"I", home:"França",         hCode:"fr",     away:"Senegal",        aCode:"sn",     utc:"2026-06-16T19:00:00Z", round:1 },
  { id:"g18", group:"I", home:"Iraque",         hCode:"iq",     away:"Noruega",        aCode:"no",     utc:"2026-06-16T22:00:00Z", round:1 },
  { id:"g19", group:"J", home:"Argentina",      hCode:"ar",     away:"Argélia",        aCode:"dz",     utc:"2026-06-17T01:00:00Z", round:1 },
  { id:"g20", group:"K", home:"Portugal",       hCode:"pt",     away:"RD Congo",       aCode:"cd",     utc:"2026-06-17T19:00:00Z", round:1 },
  { id:"g21", group:"L", home:"Inglaterra",     hCode:"gb-eng", away:"Croácia",        aCode:"hr",     utc:"2026-06-17T22:00:00Z", round:1 },
  { id:"g22", group:"J", home:"Áustria",        hCode:"at",     away:"Jordânia",       aCode:"jo",     utc:"2026-06-18T01:00:00Z", round:1 },
  { id:"g23", group:"K", home:"Colômbia",       hCode:"co",     away:"Uzbequistão",    aCode:"uz",     utc:"2026-06-18T19:00:00Z", round:1 },
  { id:"g24", group:"L", home:"Gana",           hCode:"gh",     away:"Panamá",         aCode:"pa",     utc:"2026-06-18T22:00:00Z", round:1 },
  // R2 — Brasil
  { id:"g25", group:"C", home:"Brasil",         hCode:"br",     away:"Haiti",          aCode:"ht",     utc:"2026-06-19T00:30:00Z", round:2 },
  // R3 — Brasil  
  { id:"g26", group:"C", home:"Escócia",        hCode:"gb-sct", away:"Brasil",         aCode:"br",     utc:"2026-06-24T22:00:00Z", round:3 },
];

function flag(code: string, size = 24) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={code}
      style={{ width: size, height: Math.round(size * 0.67), objectFit: "cover", borderRadius: 2 }}
    />
  );
}

function formatBSB(utcStr: string) {
  const d = new Date(utcStr);
  const day = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return { day, time };
}

// ─── Countdown ────────────────────────────────────────────────────────────────
const BRASIL_GAME = FIXTURES.find((f) => f.id === "g7")!; // Brasil x Marrocos

function useCountdown(targetUtc: string) {
  const calc = useCallback(() => {
    const diff = new Date(targetUtc).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  }, [targetUtc]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);
  return time;
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ f, highlight = false }: { f: typeof FIXTURES[0]; highlight?: boolean }) {
  const { day, time } = formatBSB(f.utc);
  const isPast = new Date(f.utc).getTime() < Date.now();
  const isBrasil = f.hCode === "br" || f.aCode === "br";

  return (
    <div
      style={{
        background: highlight
          ? "linear-gradient(135deg, rgba(6,79,58,0.8), rgba(5,46,32,0.9))"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${highlight ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.07)"}`,
        padding: "14px 16px",
        borderRadius: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {highlight && (
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 2, background: "linear-gradient(90deg, #10b981, #34d399, #10b981)" }}
        />
      )}

      {/* Group badge */}
      <div style={{ fontSize: 9, color: highlight ? "#34d399" : "#4b5563", fontWeight: 900, letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>
        Grupo {f.group} · Rodada {f.round}
        {isBrasil && !highlight && (
          <span style={{ marginLeft: 8, color: "#f59e0b", fontSize: 8 }}>🇧🇷 BRASIL</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Home */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          {flag(f.hCode, 20)}
          <span style={{ fontSize: 12, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {f.home.length > 10 ? f.home.substring(0, 8) + "." : f.home}
          </span>
        </div>

        {/* VS / Time */}
        <div style={{ textAlign: "center", minWidth: 56 }}>
          <div style={{ fontSize: 10, color: isPast ? "#4b5563" : "#9ca3af", fontWeight: 700 }}>
            {time}
          </div>
          <div style={{ fontSize: 8, color: "#374151", letterSpacing: "0.05em" }}>
            {day}
          </div>
        </div>

        {/* Away */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>
            {f.away.length > 10 ? f.away.substring(0, 8) + "." : f.away}
          </span>
          {flag(f.aCode, 20)}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "jogos" | "grupos" | "album";

export const AlbumTorcidaPage = () => {
  const [tab, setTab] = useState<Tab>("jogos");
  const [matches, setMatches] = useState<{ id: string; group: string; teamA: string; teamB: string; matchDate: string }[]>([]);
  const countdown = useCountdown(BRASIL_GAME.utc);

  useEffect(() => {
    api.get("/worldcup/matches")
      .then(({ data }) => setMatches(data.matches))
      .catch(() => {});
  }, []);

  const brazilFixtures = FIXTURES.filter((f) => f.hCode === "br" || f.aCode === "br");
  const upcomingAll = FIXTURES
    .filter((f) => new Date(f.utc).getTime() > Date.now())
    .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime())
    .slice(0, 12);

  const CountdownBox = ({ val, label }: { val: number; label: string }) => (
    <div style={{ textAlign: "center", minWidth: 56 }}>
      <div
        style={{
          fontSize: 28, fontWeight: 900, color: "white", fontFamily: T.fontD, fontStyle: "italic",
          lineHeight: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(16,185,129,0.3)",
          padding: "8px 12px", marginBottom: 4,
        }}
      >
        {String(val).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 8, color: "#6b7280", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050e08", paddingBottom: 96 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(180deg, #022c22 0%, #064e3b 40%, #050e08 100%)",
          padding: "40px 24px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* BG circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.05), transparent)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Trophy size={18} color="#fbbf24" />
            <span style={{ fontSize: 10, fontWeight: 900, color: "#fbbf24", letterSpacing: "0.2em", textTransform: "uppercase", fontStyle: "italic" }}>
              Copa do Mundo 2026 · EUA, Canadá e México
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 900, color: "white",
              fontFamily: T.fontD, fontStyle: "italic", textTransform: "uppercase",
              letterSpacing: "-0.01em", lineHeight: 0.95, marginBottom: 8,
            }}
          >
            Álbum<br />
            <span style={{ color: "#10b981" }}>da Torcida</span>
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32, maxWidth: 480, lineHeight: 1.6 }}>
            Registre cada jogo com 12 fotos, conquiste selos exclusivos e reviva a Copa do Mundo em imagens.
          </p>

          {/* Countdown — Brasil x Marrocos */}
          {countdown && (
            <div
              style={{
                background: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.3)",
                padding: "20px 24px", marginBottom: 32, display: "inline-block",
              }}
            >
              <div style={{ fontSize: 9, color: "#10b981", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={10} />
                🇧🇷 Brasil × Marrocos 🇲🇦 · 13/06 às 19h00 (Brasília)
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <CountdownBox val={countdown.d} label="dias" />
                <span style={{ color: "#10b981", fontSize: 20, fontWeight: 900, marginBottom: 18 }}>:</span>
                <CountdownBox val={countdown.h} label="horas" />
                <span style={{ color: "#10b981", fontSize: 20, fontWeight: 900, marginBottom: 18 }}>:</span>
                <CountdownBox val={countdown.m} label="min" />
                <span style={{ color: "#10b981", fontSize: 20, fontWeight: 900, marginBottom: 18 }}>:</span>
                <CountdownBox val={countdown.s} label="seg" />
              </div>
            </div>
          )}

          {/* Brasil's 3 games strip */}
          <div style={{ display: "flex", gap: 2, marginBottom: 0, overflow: "hidden" }}>
            {brazilFixtures.map((f) => {
              const isBrasilHome = f.hCode === "br";
              const opponent = isBrasilHome ? f.away : f.home;
              const oppCode = isBrasilHome ? f.aCode : f.hCode;
              const { day, time } = formatBSB(f.utc);
              return (
                <div
                  key={f.id}
                  style={{
                    flex: 1, background: "rgba(0,0,0,0.4)", borderTop: "2px solid #10b981",
                    padding: "12px 14px", borderRight: "1px solid rgba(16,185,129,0.1)",
                  }}
                >
                  <div style={{ fontSize: 8, color: "#10b981", fontWeight: 900, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
                    R{f.round} · Grp {f.group}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>🇧🇷</span>
                    <span style={{ fontSize: 9, color: "#6b7280" }}>vs</span>
                    {flag(oppCode, 14)}
                    <span style={{ fontSize: 10, fontWeight: 700, color: "white", fontStyle: "italic", textTransform: "uppercase" }}>
                      {opponent.length > 8 ? opponent.substring(0, 6) + "." : opponent}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>{day} · {time}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#050e08", borderBottom: "1px solid rgba(16,185,129,0.2)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex" }}>
          {[
            { id: "jogos" as Tab, icon: <Clock size={12} />, label: "Jogos" },
            { id: "grupos" as Tab, icon: <Star size={12} />, label: "Grupos" },
            { id: "album" as Tab, icon: <Camera size={12} />, label: "Meu Álbum" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "14px 20px", background: "transparent", border: "none",
                borderBottom: tab === t.id ? "2px solid #10b981" : "2px solid transparent",
                color: tab === t.id ? "#10b981" : "#4b5563",
                fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", fontStyle: "italic", transition: "all 0.2s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── TAB: JOGOS ───────────────────────────────────────────────────── */}
        {tab === "jogos" && (
          <div>
            {/* Brazil section */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>🇧🇷</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", fontStyle: "italic" }}>
                  Jogos do Brasil
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {brazilFixtures.map((f) => <MatchCard key={f.id} f={f} highlight />)}
              </div>
            </div>

            {/* All upcoming */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Calendar size={14} color="#6b7280" />
                <span style={{ fontSize: 11, fontWeight: 900, color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Próximos Jogos
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {upcomingAll.map((f) => <MatchCard key={f.id} f={f} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: GRUPOS ──────────────────────────────────────────────────── */}
        {tab === "grupos" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {GROUPS.map((g) => (
              <div
                key={g.id}
                style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  padding: "16px",
                }}
              >
                <div style={{ fontSize: 9, color: "#10b981", fontWeight: 900, letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>
                  Grupo {g.id}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {g.teams.map((t) => (
                    <div key={t.code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {flag(t.code, 18)}
                      <span style={{
                        fontSize: 11, color: t.code === "br" ? "#10b981" : "white",
                        fontWeight: t.code === "br" ? 900 : 400, fontStyle: t.code === "br" ? "italic" : "normal",
                      }}>
                        {t.name}
                      </span>
                      {t.code === "br" && <span style={{ marginLeft: "auto", fontSize: 8, color: "#fbbf24" }}>⭐</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: MEU ÁLBUM ───────────────────────────────────────────────── */}
        {tab === "album" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                A cada jogo que você assistir, abra a folha do álbum e registre com até <strong style={{ color: "#10b981" }}>12 fotos</strong>: o local, o cardápio, a galera, selfies e os melhores momentos.
              </p>
            </div>

            {matches.length === 0 ? (
              // CTA when no active matches — show Brasil schedule
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {brazilFixtures.map((f) => {
                  const { day, time } = formatBSB(f.utc);
                  const isBrasilHome = f.hCode === "br";
                  const opponent = isBrasilHome ? f.away : f.home;
                  const oppCode = isBrasilHome ? f.aCode : f.hCode;
                  return (
                    <div
                      key={f.id}
                      style={{
                        background: "linear-gradient(135deg, rgba(6,79,58,0.5), rgba(5,46,32,0.7))",
                        border: "1px solid rgba(16,185,129,0.3)", padding: "20px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 24 }}>🇧🇷</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: "white", fontStyle: "italic" }}>
                              Brasil × {opponent}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                              {day} · {time} (Brasília) · Grupo {f.group}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <Camera size={20} color="#10b981" />
                        <span style={{ fontSize: 8, color: "#10b981", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          12 fotos
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 24, padding: "20px", background: "rgba(16,185,129,0.05)", border: "1px dashed rgba(16,185,129,0.2)", textAlign: "center" }}>
                  <Trophy size={32} color="#10b98130" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7 }}>
                    As folhas de álbum serão ativadas pelo administrador antes de cada jogo.<br />
                    Assim que a Copa começar, você poderá preencher os 12 slots aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {matches.map((m) => (
                  <Link
                    key={m.id}
                    to={`/album-torcida/match/${m.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      padding: "18px 20px", textDecoration: "none", color: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                        {m.teamA} × {m.teamB}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                        {new Date(m.matchDate).toLocaleDateString("pt-BR")} · Grupo {m.group}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>Abrir</span>
                      <ChevronRight size={14} color="#10b981" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
