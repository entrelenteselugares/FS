import { Trophy, Calendar, Zap } from "lucide-react";
import { Link } from "react-router-dom";

// Next 3 upcoming Copa 2026 matches (static — no fetch, no intervals)
const NEXT_MATCHES = [
  { home: "Brasil", hCode: "br", away: "Marrocos", aCode: "ma", utc: "2026-06-13T22:00:00Z", group: "C" },
  { home: "Brasil", hCode: "br", away: "Haiti",    aCode: "ht", utc: "2026-06-19T00:30:00Z", group: "C" },
  { home: "Escócia", hCode: "gb-sct", away: "Brasil", aCode: "br", utc: "2026-06-24T22:00:00Z", group: "C" },
];

function flag(code: string) {
  return `https://flagcdn.com/w40/${code}.png`;
}

function formatBSB(utcStr: string) {
  const d = new Date(utcStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })
    + " · "
    + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

/**
 * Promotional banner for /album-torcida — purely presentational, always visible.
 * Unlike WorldCupLiveBanner (which is a live-data ticker), this is a stable
 * marketing element that shows Brazil's next Copa 2026 matches.
 */
export const AlbumTorcidaPromoBanner = () => {
  const nextBrasil = NEXT_MATCHES.find(
    // eslint-disable-next-line react-hooks/purity
    (m) => new Date(m.utc).getTime() > Date.now()
  ) ?? NEXT_MATCHES[0];

  return (
    <Link
      to="/album-torcida"
      id="album-torcida-promo-banner"
      className="block w-full hover:brightness-110 transition-all"
      style={{
        background: "linear-gradient(90deg, #022c22 0%, #065f46 35%, #064e3b 65%, #022c22 100%)",
        borderBottom: "1px solid rgba(16,185,129,0.4)",
        textDecoration: "none",
      }}
    >
      <div
        className="max-w-6xl mx-auto flex items-center justify-between gap-1 md:gap-3 px-2 py-1.5 md:px-4 md:py-2"
      >
        {/* LEFT — Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Trophy size={13} style={{ color: "#fbbf24" }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: "#fbbf24", letterSpacing: "0.15em", fontStyle: "italic", textTransform: "uppercase" }}>
            Copa 2026
          </span>
          <span style={{ fontSize: 7.5, fontWeight: 900, color: "#93c5fd", letterSpacing: "0.08em" }}>
            PRÓXIMOS
          </span>
        </div>

        {/* CENTER — Next Brazil match */}
        <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
          {/* Home */}
          <div className="flex items-center gap-1.5">
            <img src={flag(nextBrasil.hCode)} alt={nextBrasil.home} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 1 }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {nextBrasil.home.length > 8 ? nextBrasil.home.substring(0, 3).toUpperCase() : nextBrasil.home}
            </span>
          </div>

          {/* Middle */}
          <div className="text-center shrink-0" style={{ minWidth: 72 }}>
            <div className="flex items-center gap-1 justify-center">
              <Calendar size={9} style={{ color: "#6b7280" }} />
              <span style={{ fontSize: 8.5, color: "#9ca3af", fontWeight: 700 }}>{formatBSB(nextBrasil.utc)}</span>
            </div>
            <div style={{ fontSize: 7, color: "#4b5563", letterSpacing: "0.05em" }}>GRP {nextBrasil.group}</div>
          </div>

          {/* Away */}
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 11, fontWeight: 900, color: "white", fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {nextBrasil.away.length > 8 ? nextBrasil.away.substring(0, 3).toUpperCase() : nextBrasil.away}
            </span>
            <img src={flag(nextBrasil.aCode)} alt={nextBrasil.away} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 1 }} />
          </div>
        </div>

        {/* RIGHT — CTA (desktop only) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Zap size={10} style={{ color: "#10b981" }} />
          <span style={{ fontSize: 7.5, color: "#10b981", fontWeight: 900, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
            Ver Álbum →
          </span>
        </div>
      </div>
    </Link>
  );
};
