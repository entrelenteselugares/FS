import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API as api } from "../../lib/api";
import { Trophy, Calendar, GitMerge, Star } from "lucide-react";
import { TournamentBracket } from "../../components/worldcup/TournamentBracket";

interface Match {
  id: string;
  group: string;
  teamA: string;
  teamB: string;
  matchDate: string;
}

interface BracketData {
  roundOf16: { id: string; home: string; away: string; score: string; status: "FINISHED" | "LIVE" | "SCHEDULED" }[];
  quarterFinals: { id: string; home: string; away: string; score: string; status: "FINISHED" | "LIVE" | "SCHEDULED" }[];
  semiFinals: { id: string; home: string; away: string; score: string; status: "FINISHED" | "LIVE" | "SCHEDULED" }[];
  final: { id: string; home: string; away: string; score: string; status: "FINISHED" | "LIVE" | "SCHEDULED" }[];
}

export const AlbumTorcidaPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"album" | "bracket">("album");

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, bracketRes] = await Promise.all([
          api.get("/worldcup/matches").catch(() => ({ data: { matches: [] } })),
          api.get("/worldcup/bracket").catch(() => ({ data: { bracket: null } })),
        ]);
        setMatches(matchesRes.data.matches);
        setBracket(bracketRes.data.bracket);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#050f09" }}>
      {/* Hero Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)",
          padding: "48px 24px 32px",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent)" }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
        />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-yellow-400" size={40} />
            <Star className="text-yellow-400 animate-pulse" size={16} />
          </div>
          <h1
            className="font-black uppercase italic text-white mb-2"
            style={{ fontSize: "clamp(28px, 6vw, 48px)", letterSpacing: "0.06em" }}
          >
            Copa do Mundo 2026
          </h1>
          <p className="text-emerald-300 font-bold text-sm uppercase tracking-widest mb-2">
            Álbum da Torcida
          </p>
          <p className="text-gray-400 text-sm max-w-md">
            Complete missões a cada jogo, conquiste selos exclusivos e reviva cada partida com suas fotos.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="max-w-4xl mx-auto flex border-b mt-0"
        style={{ borderColor: "#10b98140" }}
      >
        {[
          { id: "album", label: "Álbum", icon: <Calendar size={14} /> },
          { id: "bracket", label: "Chaveamento", icon: <GitMerge size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "album" | "bracket")}
            className="flex items-center gap-2 px-6 py-4 font-black uppercase italic transition-all"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              color: activeTab === tab.id ? "#10b981" : "#6b7280",
              borderBottom: activeTab === tab.id ? "2px solid #10b981" : "2px solid transparent",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #10b981" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Álbum Tab */}
        {activeTab === "album" && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-emerald-500" size={18} />
              <h2 className="text-xl font-bold text-gray-200">Jogos Disponíveis</h2>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div
                className="text-center p-12 rounded-xl border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "#10b98130" }}
              >
                <Trophy className="mx-auto mb-4 text-emerald-700" size={40} />
                <p className="text-gray-400 font-bold">Nenhum jogo ativo no momento.</p>
                <p className="text-gray-600 text-sm mt-2">
                  Verifique o chaveamento para ver as próximas partidas.
                </p>
                <button
                  onClick={() => setActiveTab("bracket")}
                  className="mt-6 px-6 py-2 rounded-lg font-black uppercase italic text-sm"
                  style={{ background: "#065f46", color: "#10b981" }}
                >
                  Ver Chaveamento →
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/album-torcida/match/${match.id}`}
                    className="group rounded-xl p-6 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid #10b98130",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#10b981")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#10b98130")
                    }
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
                      Grupo {match.group}
                    </div>
                    <div className="flex items-center justify-between text-2xl font-black italic">
                      <span className="text-white">{match.teamA}</span>
                      <span className="text-gray-600 text-sm font-normal not-italic px-4">VS</span>
                      <span className="text-white">{match.teamB}</span>
                    </div>
                    <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
                      <span>{new Date(match.matchDate).toLocaleDateString("pt-BR")}</span>
                      <span className="text-emerald-700 group-hover:text-emerald-400 transition-colors font-bold">
                        Abrir Folha →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bracket Tab */}
        {activeTab === "bracket" && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <GitMerge className="text-emerald-500" size={18} />
              <h2 className="text-xl font-bold text-gray-200">Chaveamento Oficial</h2>
              <span
                className="text-xs font-black uppercase italic px-2 py-0.5 rounded"
                style={{ background: "#064e3b", color: "#10b981" }}
              >
                2026
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !bracket ? (
              <div
                className="text-center p-12 rounded-xl border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "#10b98130" }}
              >
                <p className="text-gray-400">Chaveamento ainda não disponível.</p>
              </div>
            ) : (
              <TournamentBracket bracket={bracket} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
