import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { API as api } from "../../lib/api";
import { T } from "../../lib/theme";
import { Trophy, Camera, Clock, ChevronRight, ChevronLeft, Star, Zap, Calendar, Share2, Users, Upload, Heart, Award, Target, Network } from "lucide-react";
import { AlbumMissionsTab } from "../../components/worldcup/AlbumMissionsTab";

import { WorldCupBracket } from "../../components/worldcup/WorldCupBracket";

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
function MatchCard({ f, highlight = false, now }: { f: typeof FIXTURES[0]; highlight?: boolean; now: number }) {
  const { day, time } = formatBSB(f.utc);
  const isPast = new Date(f.utc).getTime() < now;
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
// ─── Countdown Box Component ──────────────────────────────────────────────────
const CountdownBox = ({ val, label }: { val: number; label: string }) => (
  <div style={{ textAlign: "center", flex: "1 1 0", minWidth: 40, maxWidth: 56 }}>
    <div
      style={{
        fontSize: "clamp(20px, 6vw, 28px)", fontWeight: 900, color: "white", fontFamily: T.fontD, fontStyle: "italic",
        lineHeight: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(16,185,129,0.3)",
        padding: "6px 4px", marginBottom: 4,
      }}
    >
      {String(val).padStart(2, "0")}
    </div>
    <div style={{ fontSize: 8, color: "#6b7280", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {label}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "jogos" | "grupos" | "album" | "missoes" | "ranking" | "chaveamento" | "nostalgia" | "bolao";

const ALL_PAST_COPAS = [
  { year: 2022, name: "Catar 2022" },
  { year: 2018, name: "Rússia 2018" },
  { year: 2014, name: "Brasil 2014" },
  { year: 2010, name: "África 2010" },
  { year: 2006, name: "Alemanha 2006" },
  { year: 2002, name: "Japão/Coreia 2002" },
  { year: 1998, name: "França 1998" },
  { year: 1994, name: "EUA 1994" },
  { year: 1990, name: "Itália 1990" },
  { year: 1986, name: "México 1986" },
  { year: 1982, name: "Espanha 1982" },
  { year: 1978, name: "Argentina 1978" },
  { year: 1974, name: "Alemanha O. 1974" },
  { year: 1970, name: "México 1970" },
  { year: 1966, name: "Inglaterra 1966" },
  { year: 1962, name: "Chile 1962" },
  { year: 1958, name: "Suécia 1958" },
  { year: 1954, name: "Suíça 1954" },
  { year: 1950, name: "Brasil 1950" },
  { year: 1938, name: "França 1938" },
  { year: 1934, name: "Itália 1934" },
  { year: 1930, name: "Uruguai 1930" }
];

export const AlbumTorcidaPage = () => {
  const [tab, setTab] = useState<Tab>("jogos");
  const [matches, setMatches] = useState<{ id: string; group: string; teamA: string; teamB: string; matchDate: string }[]>([]);
  const countdown = useCountdown(BRASIL_GAME.utc);
  const [now] = useState(() => Date.now());

  // Bets state
  const [bets, setBets] = useState<Record<string, { homeScore: number; awayScore: number; settled: boolean; pointsAwarded: number; creditsAwarded: number }>>({});
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);
  const [betSummary, setBetSummary] = useState<{
    availableCredits: number;
    totalBets: number;
    exactCount: number;
    correctCount: number;
    totalPoints: number;
    totalCredits: number;
    settledBets: number;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [betsRes, betSummaryRes] = await Promise.all([
          api.get("/worldcup/bets").catch(() => ({ data: { bets: [] } })),
          api.get("/worldcup/bets/summary").catch(() => null),
        ]);

        if (betsRes.data?.bets) {
          const betsMap: Record<string, { homeScore: number; awayScore: number; settled: boolean; pointsAwarded: number; creditsAwarded: number }> = {};
          betsRes.data.bets.forEach((b: { fixtureId: string; homeScore: number; awayScore: number; settled: boolean; pointsAwarded: number; creditsAwarded: number }) => {
            betsMap[b.fixtureId] = { homeScore: b.homeScore, awayScore: b.awayScore, settled: b.settled, pointsAwarded: b.pointsAwarded, creditsAwarded: b.creditsAwarded };
          });
          setBets(betsMap);
        }
        
        if (betSummaryRes?.data) {
          setBetSummary(betSummaryRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (tab === 'bolao') {
      api.get("/worldcup/bets/summary").then(({ data }) => setBetSummary(data)).catch(() => {});
    }
  }, [tab]);

  const handlePlaceBet = async (fixtureId: string, homeScore: number, awayScore: number) => {
    if (homeScore < 0 || awayScore < 0) return;
    setIsSubmittingBet(true);
    try {
      await api.post("/worldcup/bets", { fixtureId, homeScore, awayScore });
      setBets(prev => ({ ...prev, [fixtureId]: { homeScore, awayScore, settled: false, pointsAwarded: 0, creditsAwarded: 0 } }));
    } catch {
      alert("Erro ao salvar palpite. Tente novamente.");
    } finally {
      setIsSubmittingBet(false);
    }
  };

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<{ userId: string; nome: string; profileImageUrl: string; score: number; filledSlotsCount: number; badgesCount: number; totalLikesReceived: number; totalCommentsReceived: number }[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    if (tab === "ranking") {
      setLoadingRanking(true);
      api.get("/worldcup/leaderboard")
        .then(({ data }) => {
          setLeaderboard(data.leaderboard || []);
        })
        .catch(() => {})
        .finally(() => setLoadingRanking(false));
    }
  }, [tab]);

  // Nostalgia state
  const [nostalgiaYear, setNostalgiaYear] = useState<number>(2022);
  const [nostalgiaPhotos, setNostalgiaPhotos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("worldcup_nostalgia");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [communityLikes, setCommunityLikes] = useState<Record<string, number>>({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [muralPosts, setMuralPosts] = useState<{ id: string; imageUrl: string; caption: string; description?: string; tag?: string; userId: string; userName: string; userAvatar: string; likes: number; year: number }[]>([]);

  const fetchMuralPosts = useCallback(() => {
    api.get(`/worldcup/nostalgia?year=${nostalgiaYear}`)
      .then(({ data }) => {
        setMuralPosts(data.posts || []);
        const likesMap: Record<string, number> = {};
        (data.posts || []).forEach((p: { id: string; likes: number }) => {
          likesMap[p.id] = p.likes;
        });
        setCommunityLikes(likesMap);
      })
      .catch(() => {
        setMuralPosts([]);
      });
  }, [nostalgiaYear]);

  useEffect(() => {
    fetchMuralPosts();
  }, [fetchMuralPosts]);

  const handlePhotoUpload = (slotId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const key = `${nostalgiaYear}_${slotId}`;
      const updated = { ...nostalgiaPhotos, [key]: base64 };
      setNostalgiaPhotos(updated);
      localStorage.setItem("worldcup_nostalgia", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const handleLike = (postId: string) => {
    api.post(`/worldcup/nostalgia/${postId}/like`)
      .then(() => {
        setCommunityLikes(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1
        }));
      })
      .catch(() => {
        setCommunityLikes(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1
        }));
      });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/album-torcida/nostalgia?user=Renata&copa=${nostalgiaYear}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    api.get("/worldcup/matches")
      .then(({ data }) => setMatches(data.matches))
      .catch(() => {});
  }, []);

  const brazilFixtures = FIXTURES.filter((f) => f.hCode === "br" || f.aCode === "br");
  const upcomingAll = FIXTURES
    .filter((f) => new Date(f.utc).getTime() > now)
    .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime())
    .slice(0, 12);

  return (
    <div style={{ background: "#050e08", minHeight: "100vh", color: "white", fontFamily: "sans-serif", paddingBottom: 120 }}>
      {/* ── HERO / HEADER ──────────────────────────────────────────────────── */}
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
          {/* Back button */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
              fontSize: 11,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 24,
              fontStyle: "italic",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          >
            <ChevronLeft size={14} /> Voltar para a Home
          </Link>

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
              className="w-full sm:w-auto"
              style={{
                background: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.3)",
                padding: "16px 16px", marginBottom: 32, display: "inline-block",
              }}
            >
              <div style={{ fontSize: 9, color: "#10b981", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Zap size={10} className="shrink-0" />
                <span className="truncate">🇧🇷 Brasil × Marrocos 🇲🇦 · 13/06 (Brasília)</span>
              </div>
              <div style={{ display: "flex", gap: "clamp(4px, 2vw, 8px)", alignItems: "center", justifyContent: "space-between" }}>
                <CountdownBox val={countdown.d} label="dias" />
                <span style={{ color: "#10b981", fontSize: "clamp(16px, 5vw, 20px)", fontWeight: 900, marginBottom: 18 }}>:</span>
                <CountdownBox val={countdown.h} label="horas" />
                <span style={{ color: "#10b981", fontSize: "clamp(16px, 5vw, 20px)", fontWeight: 900, marginBottom: 18 }}>:</span>
                <CountdownBox val={countdown.m} label="min" />
                <span style={{ color: "#10b981", fontSize: "clamp(16px, 5vw, 20px)", fontWeight: 900, marginBottom: 18 }}>:</span>
                <CountdownBox val={countdown.s} label="seg" />
              </div>
            </div>
          )}

          {/* Brasil's 3 games strip */}
          <div style={{ display: "flex", gap: 6, marginBottom: 0, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 8 }}>
            {brazilFixtures.map((f) => {
              const isBrasilHome = f.hCode === "br";
              const opponent = isBrasilHome ? f.away : f.home;
              const oppCode = isBrasilHome ? f.aCode : f.hCode;
              const { day, time } = formatBSB(f.utc);
              return (
                <div
                  key={f.id}
                  style={{
                    flex: "1 0 200px", minWidth: "200px", background: "rgba(0,0,0,0.4)", borderTop: "2px solid #10b981",
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
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}>
          {[
            { id: "jogos" as Tab, icon: <Clock size={12} />, label: "Jogos" },
            { id: "bolao" as Tab, icon: <Trophy size={12} />, label: "Bolão" },
            { id: "grupos" as Tab, icon: <Star size={12} />, label: "Grupos" },
            { id: "album" as Tab, icon: <Camera size={12} />, label: "Meu Álbum" },
            { id: "missoes" as Tab, icon: <Target size={12} />, label: "Missões" },
            { id: "chaveamento" as Tab, icon: <Network size={12} />, label: "Chaveamento" },
            { id: "ranking" as Tab, icon: <Award size={12} />, label: "Classificação" },
            { id: "nostalgia" as Tab, icon: <Trophy size={12} />, label: "Nostalgia" },
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
                flexShrink: 0,
                whiteSpace: "nowrap"
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
                {brazilFixtures.map((f) => <MatchCard key={f.id} f={f} highlight now={now} />)}
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
                {upcomingAll.map((f) => <MatchCard key={f.id} f={f} now={now} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: BOLÃO ───────────────────────────────────────────────────── */}
        {tab === "bolao" && (() => {
          // Group fixtures by round
          const byRound = FIXTURES.reduce<Record<number, typeof FIXTURES>>((acc, f) => {
            if (!acc[f.round]) acc[f.round] = [];
            acc[f.round].push(f);
            return acc;
          }, {});

          return (
            <div>
              {/* Credits summary banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))",
                border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: "16px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24
              }}>
                <div>
                  <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    Seus Créditos do Bolão
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "white", fontStyle: "italic", lineHeight: 1.2 }}>
                    {betSummary?.availableCredits ?? "—"} <span style={{ fontSize: 12, color: "#fbbf24" }}>créditos</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                    {betSummary?.totalBets ?? 0} palpites · {betSummary?.exactCount ?? 0} placares exatos · {betSummary?.correctCount ?? 0} resultados certos
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>PONTUAÇÃO</div>
                  <div style={{ fontSize: 10, color: "#10b981" }}>🎯 Placar exato: <strong>10pts + 20💎</strong></div>
                  <div style={{ fontSize: 10, color: "#60a5fa", marginTop: 2 }}>✓ Resultado certo: <strong>3pts + 6💎</strong></div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Participou: 1pt + 2💎</div>
                </div>
              </div>

              {/* Fixtures by round */}
              {Object.entries(byRound).map(([round, fixtures]) => (
                <div key={round} style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
                    Rodada {round}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {fixtures.map((f) => {
                      const { day, time } = formatBSB(f.utc);
                      const isPast = new Date(f.utc).getTime() < Date.now();
                      const myBet = bets[f.id];
                      const isBrasil = f.hCode === "br" || f.aCode === "br";

                      return (
                        <div key={f.id} style={{
                          border: `1px solid ${isBrasil ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 4, overflow: "hidden",
                          opacity: isPast && !myBet ? 0.5 : 1
                        }}>
                          {/* Match header */}
                          <div style={{
                            background: isBrasil ? "linear-gradient(135deg,rgba(6,79,58,0.5),rgba(5,46,32,0.7))" : "rgba(255,255,255,0.02)",
                            padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {flag(f.hCode, 20)}
                              <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{f.home}</span>
                              <span style={{ fontSize: 10, color: "#4b5563" }}>×</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{f.away}</span>
                              {flag(f.aCode, 20)}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 9, color: "#6b7280" }}>{day} · {time}</div>
                              <div style={{ fontSize: 8, color: "#374151", letterSpacing: "0.05em" }}>Gr. {f.group}</div>
                            </div>
                          </div>
                          {/* Bet row */}
                          <div style={{
                            background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)",
                            padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between"
                          }}>
                            {isPast && !myBet ? (
                              <span style={{ fontSize: 10, color: "#374151", fontStyle: "italic" }}>Jogo já iniciado — palpite encerrado</span>
                            ) : myBet?.settled ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>Seu palpite: <strong style={{ color: "white" }}>{myBet.homeScore} × {myBet.awayScore}</strong></span>
                                {myBet.pointsAwarded > 0
                                  ? <span style={{ fontSize: 10, color: "#10b981", fontWeight: 900 }}>+{myBet.pointsAwarded}pts · +{myBet.creditsAwarded}💎</span>
                                  : <span style={{ fontSize: 10, color: "#ef4444" }}>Errou 😅</span>
                                }
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700 }}>PALPITE:</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 10, color: "white" }}>{f.home.length > 8 ? f.home.substring(0, 7) + "." : f.home}</span>
                                  <input
                                    type="number" min="0" max="20"
                                    value={bets[f.id]?.homeScore ?? ""}
                                    onChange={(e) => { const v = parseInt(e.target.value); setBets(prev => ({ ...prev, [f.id]: { homeScore: isNaN(v) ? 0 : v, awayScore: prev[f.id]?.awayScore || 0, settled: false, pointsAwarded: 0, creditsAwarded: 0 } })); }}
                                    style={{ width: 36, height: 28, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "white", textAlign: "center", fontSize: 13, fontWeight: "bold" }}
                                  />
                                  <span style={{ color: "#4b5563" }}>×</span>
                                  <input
                                    type="number" min="0" max="20"
                                    value={bets[f.id]?.awayScore ?? ""}
                                    onChange={(e) => { const v = parseInt(e.target.value); setBets(prev => ({ ...prev, [f.id]: { homeScore: prev[f.id]?.homeScore || 0, awayScore: isNaN(v) ? 0 : v, settled: false, pointsAwarded: 0, creditsAwarded: 0 } })); }}
                                    style={{ width: 36, height: 28, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "white", textAlign: "center", fontSize: 13, fontWeight: "bold" }}
                                  />
                                  <span style={{ fontSize: 10, color: "white" }}>{f.away.length > 8 ? f.away.substring(0, 7) + "." : f.away}</span>
                                </div>
                                <button
                                  onClick={() => handlePlaceBet(f.id, bets[f.id]?.homeScore ?? 0, bets[f.id]?.awayScore ?? 0)}
                                  disabled={isSubmittingBet || bets[f.id] === undefined}
                                  style={{
                                    padding: "5px 12px", background: myBet ? "#065f46" : "#10b981", color: myBet ? "#34d399" : "black",
                                    fontSize: 10, fontWeight: 900, borderRadius: 4, border: myBet ? "1px solid #34d399" : "none",
                                    textTransform: "uppercase", cursor: "pointer", opacity: isSubmittingBet ? 0.5 : 1
                                  }}
                                >
                                  {myBet !== undefined ? "✓ Atualizar" : "Apostar"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

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
                    <div key={f.id} style={{ border: "1px solid rgba(16,185,129,0.3)" }}>
                      {/* Header do jogo */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(6,79,58,0.5), rgba(5,46,32,0.7))",
                          padding: "20px 24px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {flag("br", 24)}
                            <span style={{ color: "#4b5563", fontSize: 12 }}>×</span>
                            {flag(oppCode, 24)}
                            <div style={{ marginLeft: 8 }}>
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

                      {/* Palpite / Bolão */}
                      <div style={{
                        background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(16,185,129,0.1)",
                        padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
                      }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>SEU PALPITE:</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isBrasilHome ? "#10b981" : "white" }}>Brasil</span>
                            <input
                              type="number"
                              min="0" max="20"
                              value={bets[f.id]?.homeScore ?? ""}
                              onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setBets(prev => ({ ...prev, [f.id]: { homeScore: isNaN(v) ? 0 : v, awayScore: prev[f.id]?.awayScore || 0, settled: prev[f.id]?.settled ?? false, pointsAwarded: prev[f.id]?.pointsAwarded ?? 0, creditsAwarded: prev[f.id]?.creditsAwarded ?? 0 } }));
                              }}
                              style={{ width: 40, height: 32, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "white", textAlign: "center", fontWeight: "bold" }}
                            />
                          </div>
                          <span style={{ color: "#6b7280", fontSize: 12 }}>×</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="number"
                              min="0" max="20"
                              value={bets[f.id]?.awayScore ?? ""}
                              onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setBets(prev => ({ ...prev, [f.id]: { homeScore: prev[f.id]?.homeScore || 0, awayScore: isNaN(v) ? 0 : v, settled: prev[f.id]?.settled ?? false, pointsAwarded: prev[f.id]?.pointsAwarded ?? 0, creditsAwarded: prev[f.id]?.creditsAwarded ?? 0 } }));
                              }}
                              style={{ width: 40, height: 32, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "white", textAlign: "center", fontWeight: "bold" }}
                            />
                            <span style={{ fontSize: 12, fontWeight: 700, color: !isBrasilHome ? "#10b981" : "white" }}>{opponent}</span>
                          </div>
                          <button
                            onClick={() => handlePlaceBet(f.id, bets[f.id]?.homeScore ?? 0, bets[f.id]?.awayScore ?? 0)}
                            disabled={isSubmittingBet}
                            style={{
                              marginLeft: 16, padding: "6px 12px", background: "#10b981", color: "black", fontSize: 11, fontWeight: 900,
                              borderRadius: 4, textTransform: "uppercase", cursor: "pointer", opacity: isSubmittingBet ? 0.5 : 1,
                              border: "none"
                            }}
                          >
                            {bets[f.id] !== undefined ? "✓ Salvo" : "Apostar"}
                          </button>
                        </div>
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

        {/* ── TAB: MISSÕES ─────────────────────────────────────────────────── */}
        {tab === "missoes" && (
          <AlbumMissionsTab />
        )}

        {/* ── TAB: CHAVEAMENTO ─────────────────────────────────────────────── */}
        {tab === "chaveamento" && (
          <WorldCupBracket />
        )}

        {/* ── TAB: RANKING ─────────────────────────────────────────────────── */}
        {tab === "ranking" && (
          <div>
            {/* Promo printed album campaign card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(5,46,32,0.6) 100%)",
                border: "1px solid rgba(245,158,11,0.3)",
                padding: "24px",
                borderRadius: 8,
                marginBottom: 32,
                display: "flex",
                alignItems: "center",
                gap: 16
              }}
            >
              <div style={{ background: "rgba(245,158,11,0.15)", borderRadius: "50%", padding: 12 }}>
                <Trophy size={32} color="#fbbf24" className="animate-bounce" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", margin: 0 }}>
                  Grande Final: Ganhe seu Álbum Impresso!
                </h3>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, lineHeight: 1.6 }}>
                  Preencha as figurinhas dos jogos, consiga curtidas/comentários e suba no ranking. No dia da final da Copa do Mundo, 
                  os <strong style={{ color: "#fbbf24" }}>3 primeiros colocados</strong> receberão o álbum oficial impresso de luxo com suas próprias fotos e memórias!
                </p>
              </div>
            </div>

            {loadingRanking ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div style={{ width: 32, height: 32, border: "4px solid #10b981", borderTopColor: "transparent", borderRadius: "50%" }} className="animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(16,185,129,0.15)" }}>
                <Trophy size={32} color="#10b981" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, fontWeight: 900, textTransform: "uppercase" }}>
                  A classificação começará assim que as fotos forem enviadas.
                </p>
              </div>
            ) : (
              <div>
                {/* PODIUM SECTION */}
                <div 
                  style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "flex-end", 
                    gap: 12, 
                    marginBottom: 40,
                    paddingTop: 20
                  }}
                >
                  {/* 2nd Place */}
                  {leaderboard[1] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 150 }}>
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        <img 
                          src={leaderboard[1].profileImageUrl} 
                          alt={leaderboard[1].nome} 
                          style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #94a3b8", objectFit: "cover" }} 
                        />
                        <div style={{ position: "absolute", bottom: -4, right: -4, background: "#94a3b8", color: "black", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
                          2
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "white", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                        {leaderboard[1].nome}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>
                        {leaderboard[1].score} PTS
                      </div>
                      <div style={{ height: 60, width: "100%", background: "linear-gradient(180deg, #475569, #1e293b)", borderTop: "2px solid #94a3b8", marginTop: 8 }} />
                    </div>
                  )}

                  {/* 1st Place */}
                  {leaderboard[0] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 170 }}>
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%) rotation(15deg)", fontSize: 16 }}>👑</div>
                        <img 
                          src={leaderboard[0].profileImageUrl} 
                          alt={leaderboard[0].nome} 
                          style={{ width: 80, height: 80, borderRadius: "50%", border: "4px solid #fbbf24", objectFit: "cover", boxShadow: "0 0 15px rgba(251,191,36,0.4)" }} 
                        />
                        <div style={{ position: "absolute", bottom: -4, right: -4, background: "#fbbf24", color: "black", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>
                          1
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "white", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                        {leaderboard[0].nome}
                      </div>
                      <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 900 }}>
                        {leaderboard[0].score} PTS
                      </div>
                      <div style={{ height: 90, width: "100%", background: "linear-gradient(180deg, #d97706, #1e293b)", borderTop: "2px solid #fbbf24", marginTop: 8 }} />
                    </div>
                  )}

                  {/* 3rd Place */}
                  {leaderboard[2] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 150 }}>
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        <img 
                          src={leaderboard[2].profileImageUrl} 
                          alt={leaderboard[2].nome} 
                          style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid #b45309", objectFit: "cover" }} 
                        />
                        <div style={{ position: "absolute", bottom: -4, right: -4, background: "#b45309", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
                          3
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "white", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                        {leaderboard[2].nome}
                      </div>
                      <div style={{ fontSize: 10, color: "#b45309", fontWeight: 700 }}>
                        {leaderboard[2].score} PTS
                      </div>
                      <div style={{ height: 45, width: "100%", background: "linear-gradient(180deg, #78350f, #1e293b)", borderTop: "2px solid #b45309", marginTop: 8 }} />
                    </div>
                  )}
                </div>

                {/* COMPETITORS LIST */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 4 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px 80px 80px", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 900, color: "#6b7280", textTransform: "uppercase" }}>
                    <span>Pos</span>
                    <span>Torcedor</span>
                    <span style={{ textAlign: "center" }}>Figurinhas</span>
                    <span style={{ textAlign: "center" }}>Selos</span>
                    <span style={{ textAlign: "right" }}>Pontos</span>
                  </div>

                  {leaderboard.map((item, idx) => (
                    <div 
                      key={item.userId} 
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "50px 1fr 80px 80px 80px", 
                        gap: 12, 
                        padding: "14px 16px", 
                        borderBottom: idx === leaderboard.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)",
                        alignItems: "center"
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 900, color: idx < 3 ? "#fbbf24" : "#4b5563" }}>
                        #{idx + 1}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img 
                          src={item.profileImageUrl} 
                          alt={item.nome} 
                          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} 
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                          {item.nome}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, textAlign: "center" }}>
                        {item.filledSlotsCount} / 12
                      </span>
                      <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, textAlign: "center" }}>
                        {item.badgesCount}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "white", textAlign: "right" }}>
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: NOSTALGIA ────────────────────────────────────────────────── */}
        {tab === "nostalgia" && (
          <div>
            {/* Promo / Invite Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(6,79,58,0.4), rgba(5,46,32,0.6))",
                border: "1px solid rgba(16,185,129,0.3)",
                padding: "24px", borderRadius: 4, marginBottom: 32,
                display: "flex", flexDirection: "column", gap: 16
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
                  <Trophy size={18} color="#fbbf24" /> Álbum de Memórias Nostálgicas
                </h3>
                <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6, lineHeight: 1.6 }}>
                  Reviva a emoção das Copas passadas! Escolha o ano do mundial, monte sua folha com fotos dos seus momentos favoritos (churrasco, rua pintada, família reunida) e convide seus amigos para completar ou reagir.
                </p>
              </div>
              <div>
                <button
                  id="btn-convidar-amigos"
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    background: "#10b981", color: "black", border: "none", padding: "12px 20px",
                    fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontStyle: "italic"
                  }}
                >
                  <Share2 size={13} /> Convidar Amigos para o Álbum
                </button>
              </div>
            </div>

            {/* Year selector pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
              {ALL_PAST_COPAS.map((c) => (
                <button
                  key={c.year}
                  onClick={() => setNostalgiaYear(c.year)}
                  style={{
                    background: nostalgiaYear === c.year ? "#10b981" : "rgba(255,255,255,0.03)",
                    color: nostalgiaYear === c.year ? "black" : "#9ca3af",
                    border: nostalgiaYear === c.year ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                    padding: "8px 16px", borderRadius: 20, fontSize: 11, fontWeight: 900,
                    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap"
                  }}
                >
                  Copa {c.name}
                </button>
              ))}
            </div>

            {/* Nostalgia slots board */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 40 }}>
              {[
                { id: "churrasco", label: "Churrasco da Galera", desc: "Reunião de família/amigos" },
                { id: "look", label: "Meu Look / Camisa", desc: "Manto sagrado no dia do jogo" },
                { id: "rua", label: "Rua Pintada", desc: "Decoração da vizinhança" },
                { id: "gol", label: "Grito de Gol", desc: "A festa na hora do gol" },
              ].map((slot) => {
                const photoKey = `${nostalgiaYear}_${slot.id}`;
                const photo = nostalgiaPhotos[photoKey];
                const inputId = `file-input-${slot.id}`;

                return (
                  <div
                    key={slot.id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "2px dashed rgba(16,185,129,0.2)",
                      padding: "16px", textAlign: "center", borderRadius: 4,
                      position: "relative", minHeight: 200, display: "flex", flexDirection: "column",
                      justifyContent: "center", alignItems: "center"
                    }}
                  >
                    <input
                      id={inputId}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(slot.id, file);
                      }}
                      accept="image/*"
                      style={{ display: "none" }}
                    />

                    {photo ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                        <img
                          src={photo}
                          alt={slot.label}
                          style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 2 }}
                        />
                        <button
                          onClick={() => document.getElementById(inputId)?.click()}
                          style={{
                            background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
                            padding: "4px 8px", fontSize: 9, fontWeight: 900, cursor: "pointer"
                          }}
                        >
                          Alterar Foto
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} color="#10b981" style={{ opacity: 0.5, marginBottom: 12 }} />
                        <h4 style={{ fontSize: 12, fontWeight: 900, color: "white", margin: "0 0 4px" }}>{slot.label}</h4>
                        <p style={{ fontSize: 9, color: "#6b7280", margin: "0 0 16px", maxWidth: 130 }}>{slot.desc}</p>
                        <button
                          onClick={() => document.getElementById(inputId)?.click()}
                          style={{
                            background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
                            padding: "6px 12px", fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                            cursor: "pointer"
                          }}
                        >
                          Colar Foto
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Community Feed / Mural */}
            <div style={{ marginTop: 48, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={16} color="#10b981" /> Mural Nostálgico da Galera
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {muralPosts.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(16,185,129,0.15)" }}>
                    <Users size={32} color="#10b981" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Nenhum momento compartilhado no mural ainda para esta Copa.
                    </p>
                    <p style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                      Preencha suas fotos de nostalgia acima e publique-as aqui!
                    </p>
                  </div>
                ) : (
                  muralPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        padding: "16px", borderRadius: 4, display: "flex", flexDirection: "column", gap: 12
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: 12, color: "white" }}>{post.userName}</strong>
                          <span style={{ fontSize: 9, color: "#6b7280", marginLeft: 6 }}>Copa {post.year}</span>
                        </div>
                        <span style={{ fontSize: 8, background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "2px 6px", fontWeight: 900, textTransform: "uppercase" }}>
                          {post.tag}
                        </span>
                      </div>
                      <img
                        src={post.imageUrl}
                        alt={post.description || ""}
                        style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 2 }}
                      />
                      {post.description && (
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>{post.description}</p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                        <button
                          onClick={() => handleLike(post.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer", display: "flex",
                            alignItems: "center", gap: 6, color: "#ef4444", padding: 0
                          }}
                        >
                          <Heart size={14} fill={(communityLikes[post.id] || 0) > 0 ? "#ef4444" : "none"} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{communityLikes[post.id] || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
              <div
                style={{
                  position: "fixed", inset: 0, zIndex: 100, display: "flex",
                  alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)",
                  padding: 16
                }}
              >
                <div
                  style={{
                    background: "#050e08", border: "1px solid rgba(16,185,129,0.3)",
                    padding: "32px", maxWidth: 450, width: "100%", position: "relative"
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", marginBottom: 12 }}>
                    📢 Compartilhar Meu Álbum Nostalgia
                  </h3>
                  <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 20 }}>
                    Envie o link para amigos verem suas figurinhas nostálgicas e colarem as fotos deles também!
                  </p>
                  <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    <input
                      readOnly
                      value={`${window.location.origin}/album-torcida/nostalgia?user=Renata&copa=${nostalgiaYear}`}
                      style={{
                        flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.2)",
                        padding: "10px 12px", fontSize: 10, color: "#10b981", outline: "none"
                      }}
                    />
                    <button
                      onClick={copyInviteLink}
                      style={{
                        background: "#10b981", color: "black", border: "none", padding: "10px 16px",
                        fontSize: 10, fontWeight: 900, cursor: "pointer"
                      }}
                    >
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=Confira meu álbum nostálgico das Copas passadas e adicione suas fotos também! ${encodeURIComponent(`${window.location.origin}/album-torcida/nostalgia?user=Renata&copa=${nostalgiaYear}`)}`, "_blank")}
                      style={{
                        background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
                        padding: "10px 16px", fontSize: 10, fontWeight: 900, cursor: "pointer", textTransform: "uppercase"
                      }}
                    >
                      Enviar WhatsApp
                    </button>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      style={{
                        background: "transparent", color: "#6b7280", border: "none",
                        padding: "10px 16px", fontSize: 10, fontWeight: 900, cursor: "pointer"
                      }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
