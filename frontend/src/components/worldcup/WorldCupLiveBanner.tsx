import { useEffect, useRef, useState } from "react";
import { API as api } from "../../lib/api";
import { Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface LiveMatch {
  id: string;
  homeTeam: { name: string; flagUrl: string; score: number };
  awayTeam: { name: string; flagUrl: string; score: number };
  minute: string;
  status: "LIVE" | "HALF_TIME" | "FINISHED" | "SCHEDULED";
}

const STATUS_LABEL: Record<LiveMatch["status"], string> = {
  LIVE: "AO VIVO",
  HALF_TIME: "INTERVALO",
  FINISHED: "ENCERRADO",
  SCHEDULED: "EM BREVE",
};

const STATUS_COLOR: Record<LiveMatch["status"], string> = {
  LIVE: "#22c55e",
  HALF_TIME: "#f59e0b",
  FINISHED: "#6b7280",
  SCHEDULED: "#60a5fa",
};

export const WorldCupLiveBanner = () => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [active, setActive] = useState(0);
  const prevScoresRef = useRef<Record<string, { home: number; away: number }>>({});

  const fetchLive = async () => {
    try {
      const { data } = await api.get("/worldcup/live");
      const incoming: LiveMatch[] = data.live;

      // Detect goal events to fire toast notifications
      incoming.forEach((m) => {
        const prev = prevScoresRef.current[m.id];
        if (prev) {
          if (m.homeTeam.score > prev.home) {
            toast(`⚽ GOOOL! ${m.homeTeam.name} marca! (${m.homeTeam.score}x${m.awayTeam.score})`, {
              duration: 8000,
              icon: "🟢",
            });
          }
          if (m.awayTeam.score > prev.away) {
            toast(`⚽ GOOOL! ${m.awayTeam.name} marca! (${m.homeTeam.score}x${m.awayTeam.score})`, {
              duration: 8000,
              icon: "🟢",
            });
          }
        }
        prevScoresRef.current[m.id] = { home: m.homeTeam.score, away: m.awayTeam.score };
      });

      setMatches(incoming);
    } catch {
      // Silently ignore in case API is unavailable
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 60_000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate through matches
  useEffect(() => {
    if (matches.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % matches.length), 5000);
    return () => clearInterval(t);
  }, [matches.length]);

  // Don't show if no matches
  if (matches.length === 0) return null;

  const match = matches[active];
  const hasLive = matches.some((m) => m.status === "LIVE" || m.status === "HALF_TIME");

  return (
    <Link
      to="/album-torcida"
      className="block w-full"
      style={{
        background: "linear-gradient(90deg, #064e3b 0%, #065f46 40%, #064e3b 100%)",
        borderBottom: "1px solid #10b981",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
        {/* Left: Brand + Copa tag */}
        <div className="flex items-center gap-2 shrink-0">
          <Trophy size={14} className="text-yellow-400" />
          <span
            className="text-yellow-400 font-black uppercase italic"
            style={{ fontSize: 10, letterSpacing: "0.12em" }}
          >
            Copa 2026
          </span>
          {hasLive && (
            <span
              className="flex items-center gap-1 animate-pulse"
              style={{
                background: "#22c55e",
                color: "#000",
                fontSize: 8,
                fontWeight: 900,
                padding: "2px 6px",
                borderRadius: 2,
                letterSpacing: "0.1em",
              }}
            >
              <Zap size={8} /> AO VIVO
            </span>
          )}
        </div>

        {/* Center: Match scoreboard */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          {/* Home Team */}
          <div className="flex items-center gap-1.5">
            <img
              src={match.homeTeam.flagUrl}
              alt={match.homeTeam.name}
              className="w-4 h-4 rounded-sm object-cover"
            />
            <span className="text-white font-black uppercase italic" style={{ fontSize: 11 }}>
              {match.homeTeam.name.substring(0, 3).toUpperCase()}
            </span>
            {match.status !== "SCHEDULED" && (
              <span className="text-yellow-400 font-black text-sm">{match.homeTeam.score}</span>
            )}
          </div>

          {/* Score divider */}
          <div className="text-center" style={{ minWidth: 60 }}>
            {match.status === "SCHEDULED" ? (
              <span style={{ color: "#9ca3af", fontSize: 9 }}>{match.minute}</span>
            ) : (
              <span
                style={{
                  color: STATUS_COLOR[match.status],
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                }}
              >
                {match.status === "LIVE" ? match.minute : STATUS_LABEL[match.status]}
              </span>
            )}
            <div style={{ color: "#6b7280", fontSize: 8 }}>—vs—</div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-1.5">
            {match.status !== "SCHEDULED" && (
              <span className="text-yellow-400 font-black text-sm">{match.awayTeam.score}</span>
            )}
            <span className="text-white font-black uppercase italic" style={{ fontSize: 11 }}>
              {match.awayTeam.name.substring(0, 3).toUpperCase()}
            </span>
            <img
              src={match.awayTeam.flagUrl}
              alt={match.awayTeam.name}
              className="w-4 h-4 rounded-sm object-cover"
            />
          </div>
        </div>

        {/* Right: Pagination dots */}
        <div className="flex gap-1 shrink-0">
          {matches.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setActive(i); }}
              className="rounded-full transition-all"
              style={{
                width: i === active ? 12 : 4,
                height: 4,
                background: i === active ? "#10b981" : "#064e3b",
                border: "1px solid #10b981",
              }}
            />
          ))}
        </div>
      </div>
    </Link>
  );
};
