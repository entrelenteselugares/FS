interface BracketMatch {
  id: string;
  home: string;
  away: string;
  score: string;
  status: "FINISHED" | "LIVE" | "SCHEDULED";
}

interface BracketData {
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch[];
}

const MatchCard = ({ match, size = "sm" }: { match: BracketMatch; size?: "sm" | "lg" }) => {
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";

  return (
    <div
      className="rounded border transition-all"
      style={{
        background: isLive
          ? "linear-gradient(135deg, #064e3b, #065f46)"
          : "rgba(255,255,255,0.05)",
        borderColor: isLive ? "#85b9ac" : "rgba(255,255,255,0.1)",
        padding: size === "lg" ? "10px 14px" : "6px 10px",
        minWidth: size === "lg" ? 160 : 120,
      }}
    >
      {isLive && (
        <div
          className="text-center mb-1 animate-pulse"
          style={{ fontSize: 8, color: "#22c55e", fontWeight: 900, letterSpacing: "0.1em" }}
        >
          ⚡ AO VIVO
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        <span
          style={{
            fontSize: size === "lg" ? 12 : 10,
            fontWeight: 900,
            color: "white",
            fontStyle: "italic",
            textTransform: "uppercase",
          }}
        >
          {match.home}
        </span>
        {isFinished || isLive ? (
          <span
            style={{
              fontSize: size === "lg" ? 11 : 9,
              fontWeight: 900,
              color: "#f59e0b",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            {match.score}
          </span>
        ) : (
          <span style={{ fontSize: 8, color: "#6b7280" }}>vs</span>
        )}
        <span
          style={{
            fontSize: size === "lg" ? 12 : 10,
            fontWeight: 900,
            color: "white",
            fontStyle: "italic",
            textTransform: "uppercase",
          }}
        >
          {match.away}
        </span>
      </div>
    </div>
  );
};

const RoundColumn = ({
  title,
  matches,
  size = "sm",
}: {
  title: string;
  matches: BracketMatch[];
  size?: "sm" | "lg";
}) => (
  <div className="flex flex-col gap-3 items-center">
    <div
      className="text-center mb-2 uppercase font-bold tracking-widest"
      style={{ fontSize: 9, color: "#85b9ac" }}
    >
      {title}
    </div>
    <div
      className="flex flex-col gap-2"
      style={{ justifyContent: "space-around", flex: 1 }}
    >
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} size={size} />
      ))}
    </div>
  </div>
);

export const TournamentBracket = ({ bracket }: { bracket: BracketData }) => {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div
        className="flex items-center gap-6"
        style={{ minWidth: 900, padding: "0 8px" }}
      >
        {/* Connector lines via flex layout */}
        <RoundColumn title="Oitavas" matches={bracket.roundOf16.slice(0, 4)} />

        {/* Arrow connector */}
        <div className="text-emerald-700 text-lg font-bold self-center shrink-0">→</div>

        <RoundColumn title="Quartas" matches={bracket.quarterFinals.slice(0, 2)} />

        <div className="text-emerald-700 text-lg font-bold self-center shrink-0">→</div>

        <RoundColumn title="Semi" matches={bracket.semiFinals.slice(0, 1)} />

        <div className="text-yellow-400 text-2xl font-bold self-center shrink-0">🏆</div>

        <RoundColumn title="Final" matches={bracket.final} size="lg" />

        <div className="text-yellow-400 text-2xl font-bold self-center shrink-0">🏆</div>

        <RoundColumn title="Semi" matches={bracket.semiFinals.slice(1, 2)} />

        <div className="text-emerald-700 text-lg font-bold self-center shrink-0">←</div>

        <RoundColumn title="Quartas" matches={bracket.quarterFinals.slice(2, 4)} />

        <div className="text-emerald-700 text-lg font-bold self-center shrink-0">←</div>

        <RoundColumn title="Oitavas" matches={bracket.roundOf16.slice(4, 8)} />
      </div>
    </div>
  );
};
