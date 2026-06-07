import { useEffect, useRef, useState } from "react";
import { API as api } from "../../lib/api";
import { Trophy, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// ─── Real Copa 2026 Schedule (embedded — no backend needed) ───────────────────
const COPA_2026: Array<{
  id: string; group: string; home: string; hf: string;
  away: string; af: string; utc: string;
}> = [
  { id:"c1",  group:"A", home:"México",        hf:"mx",     away:"África do Sul",  af:"za",     utc:"2026-06-11T19:00:00Z" },
  { id:"c2",  group:"A", home:"Coreia do Sul",  hf:"kr",     away:"Tchéquia",       af:"cz",     utc:"2026-06-12T02:00:00Z" },
  { id:"c3",  group:"B", home:"Canadá",         hf:"ca",     away:"Bósnia",         af:"ba",     utc:"2026-06-12T19:00:00Z" },
  { id:"c4",  group:"D", home:"EUA",            hf:"us",     away:"Paraguai",       af:"py",     utc:"2026-06-13T01:00:00Z" },
  { id:"c5",  group:"D", home:"Austrália",      hf:"au",     away:"Turquia",        af:"tr",     utc:"2026-06-13T04:00:00Z" },
  { id:"c6",  group:"B", home:"Catar",          hf:"qa",     away:"Suíça",          af:"ch",     utc:"2026-06-13T19:00:00Z" },
  { id:"c7",  group:"C", home:"Brasil",         hf:"br",     away:"Marrocos",       af:"ma",     utc:"2026-06-13T22:00:00Z" },
  { id:"c8",  group:"C", home:"Haiti",          hf:"ht",     away:"Escócia",        af:"gb-sct", utc:"2026-06-14T01:00:00Z" },
  { id:"c9",  group:"E", home:"Alemanha",       hf:"de",     away:"Curaçao",        af:"cw",     utc:"2026-06-14T17:00:00Z" },
  { id:"c10", group:"F", home:"Holanda",        hf:"nl",     away:"Japão",          af:"jp",     utc:"2026-06-14T20:00:00Z" },
  { id:"c11", group:"E", home:"Costa do Marfim",hf:"ci",     away:"Equador",        af:"ec",     utc:"2026-06-14T23:00:00Z" },
  { id:"c12", group:"F", home:"Suécia",         hf:"se",     away:"Tunísia",        af:"tn",     utc:"2026-06-15T02:00:00Z" },
  { id:"c13", group:"H", home:"Espanha",        hf:"es",     away:"Cabo Verde",     af:"cv",     utc:"2026-06-15T16:00:00Z" },
  { id:"c14", group:"G", home:"Bélgica",        hf:"be",     away:"Egito",          af:"eg",     utc:"2026-06-15T19:00:00Z" },
  { id:"c15", group:"H", home:"Arábia Saudita", hf:"sa",     away:"Uruguai",        af:"uy",     utc:"2026-06-15T22:00:00Z" },
  { id:"c16", group:"G", home:"Irã",            hf:"ir",     away:"Nova Zelândia",  af:"nz",     utc:"2026-06-16T01:00:00Z" },
  { id:"c17", group:"I", home:"França",         hf:"fr",     away:"Senegal",        af:"sn",     utc:"2026-06-16T19:00:00Z" },
  { id:"c18", group:"I", home:"Iraque",         hf:"iq",     away:"Noruega",        af:"no",     utc:"2026-06-16T22:00:00Z" },
  { id:"c19", group:"J", home:"Argentina",      hf:"ar",     away:"Argélia",        af:"dz",     utc:"2026-06-17T01:00:00Z" },
  { id:"c20", group:"K", home:"Portugal",       hf:"pt",     away:"RD Congo",       af:"cd",     utc:"2026-06-17T19:00:00Z" },
  { id:"c21", group:"L", home:"Inglaterra",     hf:"gb-eng", away:"Croácia",        af:"hr",     utc:"2026-06-17T22:00:00Z" },
  { id:"c22", group:"J", home:"Áustria",        hf:"at",     away:"Jordânia",       af:"jo",     utc:"2026-06-18T01:00:00Z" },
  { id:"c23", group:"K", home:"Colômbia",       hf:"co",     away:"Uzbequistão",    af:"uz",     utc:"2026-06-18T19:00:00Z" },
  { id:"c24", group:"L", home:"Gana",           hf:"gh",     away:"Panamá",         af:"pa",     utc:"2026-06-18T22:00:00Z" },
  { id:"c25", group:"C", home:"Brasil",         hf:"br",     away:"Haiti",          af:"ht",     utc:"2026-06-19T00:30:00Z" },
];

function flag(code: string) {
  return `https://flagcdn.com/w40/${code}.png`;
}

function formatBrasilia(utcStr: string) {
  const d = new Date(utcStr);
  return (
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) +
    " · " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
  );
}

interface DisplayMatch {
  id: string;
  home: string; homeFlagUrl: string; homeScore: number;
  away: string; awayFlagUrl: string; awayScore: number;
  label: string; // time string or elapsed
  status: "LIVE" | "HALF_TIME" | "FINISHED" | "SCHEDULED";
  group?: string;
}

function getDisplayMatches(): DisplayMatch[] {
  const now = Date.now();
  const MATCH_WINDOW_MS = 110 * 60 * 1000; // 110 min

  // Find matches currently in window
  const live = COPA_2026.filter((f) => {
    const start = new Date(f.utc).getTime();
    return now >= start && now <= start + MATCH_WINDOW_MS;
  });

  if (live.length > 0) {
    return live.map((f) => {
      const elapsed = Math.floor((now - new Date(f.utc).getTime()) / 60000);
      const isHalf = elapsed >= 45 && elapsed < 50;
      return {
        id: f.id, group: f.group,
        home: f.home, homeFlagUrl: flag(f.hf), homeScore: 0,
        away: f.away, awayFlagUrl: flag(f.af), awayScore: 0,
        label: isHalf ? "Intervalo" : `${Math.min(elapsed, 90)}'`,
        status: isHalf ? "HALF_TIME" : "LIVE",
      };
    });
  }

  // Next 3 upcoming
  const upcoming = COPA_2026
    .filter((f) => new Date(f.utc).getTime() > now)
    .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime())
    .slice(0, 3);

  const toShow = upcoming.length > 0 ? upcoming : COPA_2026.slice(0, 3);
  return toShow.map((f) => ({
    id: f.id, group: f.group,
    home: f.home, homeFlagUrl: flag(f.hf), homeScore: 0,
    away: f.away, awayFlagUrl: flag(f.af), awayScore: 0,
    label: formatBrasilia(f.utc),
    status: "SCHEDULED",
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BackendLiveMatch {
  id: string;
  homeTeam: { name: string; flagUrl: string; score: number };
  awayTeam: { name: string; flagUrl: string; score: number };
  minute: string;
  status: DisplayMatch["status"];
}

export const WorldCupLiveBanner = ({ alwaysShow = false }: { alwaysShow?: boolean }) => {
  const [now] = useState(() => Date.now());
  const [matches, setMatches] = useState<DisplayMatch[]>(() => getDisplayMatches());
  const [active, setActive] = useState(0);
  const prevScoresRef = useRef<Record<string, { home: number; away: number }>>({});

  // Try to enrich with live scores from backend (optional)
  const fetchLive = async () => {
    try {
      const { data } = await api.get("/worldcup/live");
      if (!data?.live?.length) {
        setMatches(getDisplayMatches());
        return;
      }
      const enriched = (data.live as BackendLiveMatch[]).map((m) => ({
        id: m.id,
        home: m.homeTeam.name, homeFlagUrl: m.homeTeam.flagUrl, homeScore: m.homeTeam.score,
        away: m.awayTeam.name, awayFlagUrl: m.awayTeam.flagUrl, awayScore: m.awayTeam.score,
        label: m.minute,
        status: m.status,
      }));

      // Detect goal events
      enriched.forEach((m) => {
        const prev = prevScoresRef.current[m.id];
        if (prev) {
          if (m.homeScore > prev.home) toast(`⚽ GOOOL! ${m.home} marca! (${m.homeScore}x${m.awayScore})`, { duration: 8000 });
          if (m.awayScore > prev.away) toast(`⚽ GOOOL! ${m.away} marca! (${m.homeScore}x${m.awayScore})`, { duration: 8000 });
        }
        prevScoresRef.current[m.id] = { home: m.homeScore, away: m.awayScore };
      });

      setMatches(enriched);
    } catch {
      // Silently keep showing local schedule data
    }
  };

  // Refresh local schedule every minute (for precise live detection)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLive();
    }, 60_000);
    fetchLive();
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate through matches every 5s
  useEffect(() => {
    if (matches.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % matches.length), 5000);
    return () => clearInterval(t);
  }, [matches.length]);

  const isCopaTime = alwaysShow || now >= new Date("2026-06-11T00:00:00-03:00").getTime();
  if (!isCopaTime) return null;

  // Safely clamp active index to prevent out of bounds when matches array length changes
  const safeActive = Math.min(active, Math.max(0, matches.length - 1));
  const match = matches[safeActive];
  if (!match) return null;

  const isLive = match.status === "LIVE" || match.status === "HALF_TIME";
  const statusColor = { LIVE: "#22c55e", HALF_TIME: "#f59e0b", FINISHED: "#6b7280", SCHEDULED: "#93c5fd" }[match.status];

  return (
    <Link
      to="/album-torcida"
      id="worldcup-live-banner"
      className="block w-full hover:brightness-110 transition-all"
      style={{
        background: "linear-gradient(90deg, #022c22 0%, #065f46 35%, #064e3b 65%, #022c22 100%)",
        borderBottom: "1px solid rgba(16,185,129,0.4)",
        textDecoration: "none",
      }}
    >
      <div
        className="max-w-6xl mx-auto flex items-center justify-between gap-3"
        style={{ padding: "7px 16px" }}
      >
        {/* LEFT — Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Trophy size={13} style={{ color: "#fbbf24" }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: "#fbbf24", letterSpacing: "0.15em", fontStyle: "italic", textTransform: "uppercase" }}>
            Copa 2026
          </span>
          {isLive && (
            <span
              className="animate-pulse flex items-center gap-1"
              style={{ background: "#22c55e", color: "#000", fontSize: 7.5, fontWeight: 900, padding: "2px 6px", borderRadius: 2, letterSpacing: "0.1em" }}
            >
              <Zap size={7} /> AO VIVO
            </span>
          )}
          {!isLive && match.status === "SCHEDULED" && (
            <span style={{ fontSize: 7.5, fontWeight: 900, color: "#93c5fd", letterSpacing: "0.08em" }}>
              PRÓXIMOS
            </span>
          )}
        </div>

        {/* CENTER — Matchup */}
        <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
          {/* Home */}
          <div className="flex items-center gap-1.5">
            <img src={match.homeFlagUrl} alt={match.home} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 1 }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {match.home.length > 8 ? match.home.substring(0, 3).toUpperCase() : match.home}
            </span>
            {match.status !== "SCHEDULED" && (
              <span style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24" }}>{match.homeScore}</span>
            )}
          </div>

          {/* Middle: status */}
          <div className="text-center shrink-0" style={{ minWidth: 72 }}>
            {match.status === "SCHEDULED" ? (
              <div className="flex items-center gap-1 justify-center">
                <Clock size={9} style={{ color: "#6b7280" }} />
                <span style={{ fontSize: 8.5, color: "#9ca3af", fontWeight: 700 }}>{match.label}</span>
              </div>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 900, color: statusColor, letterSpacing: "0.05em" }}>
                {match.label}
              </span>
            )}
            {match.group && (
              <div style={{ fontSize: 7, color: "#4b5563", letterSpacing: "0.05em" }}>GRP {match.group}</div>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center gap-1.5">
            {match.status !== "SCHEDULED" && (
              <span style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24" }}>{match.awayScore}</span>
            )}
            <span style={{ fontSize: 11, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {match.away.length > 8 ? match.away.substring(0, 3).toUpperCase() : match.away}
            </span>
            <img src={match.awayFlagUrl} alt={match.away} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 1 }} />
          </div>
        </div>

        {/* RIGHT — Pagination dots + CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ fontSize: 7.5, color: "#10b981", fontWeight: 900, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
            Ver Álbum →
          </span>
          <div className="flex gap-1">
            {matches.map((_, i) => (
              <button
                key={i}
                id={`banner-dot-${i}`}
                onClick={(e) => { e.preventDefault(); setActive(i); }}
                style={{
                  width: i === active ? 14 : 4, height: 4,
                  background: i === active ? "#10b981" : "#064e3b",
                  border: "1px solid #10b981",
                  borderRadius: 2, cursor: "pointer",
                  transition: "width 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
