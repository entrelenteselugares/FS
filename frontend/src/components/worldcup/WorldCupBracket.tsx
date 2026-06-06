import { useEffect, useState } from "react";
import { API as api } from "../../lib/api";

interface BracketMatch {
  id: string;
  home: string;
  away: string;
  score: string;
  status: "FINISHED" | "LIVE" | "HALF_TIME" | "SCHEDULED";
  homeFlag?: string;
  awayFlag?: string;
}

interface BracketData {
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch[];
}

export function WorldCupBracket() {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/worldcup/bracket")
      .then(({ data }) => setBracket(data.bracket))
      .catch(err => console.error("Error fetching bracket:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#10b981" }}>Carregando chaveamento...</div>;
  }

  if (!bracket) {
    return <div style={{ textAlign: "center", padding: 40, color: "#ef4444" }}>Erro ao carregar chaveamento.</div>;
  }

  // Helper to render a match card
  const renderMatch = (m: BracketMatch) => {
    const isLive = m.status === "LIVE" || m.status === "HALF_TIME";
    const isFinished = m.status === "FINISHED";
    const statusColor = isLive ? "#10b981" : isFinished ? "#9ca3af" : "#6b7280";
    
    return (
      <div key={m.id} style={{
        background: "rgba(0,0,0,0.5)",
        border: `1px solid ${isLive ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 4,
        padding: "8px 12px",
        minWidth: 160,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative"
      }}>
        {isLive && (
          <div style={{ position: "absolute", top: -4, right: -4, background: "#10b981", color: "black", fontSize: 8, fontWeight: 900, padding: "2px 4px", borderRadius: 2 }}>
            AO VIVO
          </div>
        )}
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {m.homeFlag && <img src={m.homeFlag} alt={m.home} style={{ width: 14, height: 10, borderRadius: 2 }} />}
            <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>{m.home}</span>
          </div>
          <span style={{ fontSize: 12, color: statusColor, fontWeight: 900, fontFamily: "monospace" }}>
            {m.score.split("-")[0] || "-"}
          </span>
        </div>
        
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "2px 0" }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {m.awayFlag && <img src={m.awayFlag} alt={m.away} style={{ width: 14, height: 10, borderRadius: 2 }} />}
            <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>{m.away}</span>
          </div>
          <span style={{ fontSize: 12, color: statusColor, fontWeight: 900, fontFamily: "monospace" }}>
            {m.score.split("-")[1] || "-"}
          </span>
        </div>
      </div>
    );
  };

  const renderColumn = (title: string, matches: BracketMatch[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, minWidth: 180 }}>
      <div style={{ textAlign: "center", fontSize: 11, color: "#10b981", fontWeight: 900, textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.1em" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "space-around" }}>
        {matches.map(renderMatch)}
      </div>
    </div>
  );

  return (
    <div style={{ overflowX: "auto", paddingBottom: 24, padding: "0 16px" }}>
      <div style={{ display: "flex", gap: 32, minWidth: 800 }}>
        {renderColumn("Oitavas de Final", bracket.roundOf16)}
        {renderColumn("Quartas de Final", bracket.quarterFinals)}
        {renderColumn("Semifinais", bracket.semiFinals)}
        {renderColumn("Final", bracket.final)}
      </div>
    </div>
  );
}
