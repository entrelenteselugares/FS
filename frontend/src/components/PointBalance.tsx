import { useState, useEffect } from "react";
import { API as api } from "../lib/api";

interface PointsData {
  total: number;
  available: number;
  redeemed: number;
  packages: Array<{
    name: string;
    points: number;
    quantity: number;
    key: string;
    available: boolean;
    pointsNeeded: number;
  }>;
}

const T = {
  bg: "#0a0a0a",
  border: "#1a1a1a",
  accent: "#8a9a5b",
  text: "#eee",
  fontD: "'Barlow Condensed', sans-serif",
};

export default function PointBalance() {
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/me/points")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ height: 120, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, animation: "pulse 2s infinite" }} />;
  if (!data) return null;

  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
            Saldo de Recompensas
          </p>
          <p style={{ fontFamily: T.fontD, fontSize: 32, fontWeight: 900, color: T.accent, margin: 0 }}>
            {data.available} <span style={{ fontSize: 13, color: "#444" }}>PTs</span>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "#444", margin: 0 }}>Total Acumulado: {data.total}</p>
          <p style={{ fontSize: 10, color: "#444", margin: 0 }}>Já resgatados: {data.redeemed}</p>
        </div>
      </div>

      {/* Progress Bars / Next reward */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.packages.map(pkg => (
          <div key={pkg.key}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: pkg.available ? "#fff" : "#666" }}>{pkg.name}</span>
              <span style={{ color: pkg.available ? T.accent : "#444" }}>
                {pkg.available ? "Disponível" : `Faltam ${pkg.pointsNeeded} pontos`}
              </span>
            </div>
            <div style={{ height: 4, background: "#161616", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                background: pkg.available ? T.accent : "#333", 
                width: `${Math.min(100, (data.available / pkg.points) * 100)}%`,
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
              }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: "#333", marginTop: 20, textAlign: "center", lineHeight: 1.4 }}>
        Ganhe pontos recebendo curtidas em suas fotos públicas. <br/>
        Cada curtida vale 1 ponto.
      </p>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
