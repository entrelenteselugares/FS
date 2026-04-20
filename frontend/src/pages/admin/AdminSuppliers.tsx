import { useState, useEffect } from "react";
import { API as api } from "../../lib/api";



interface Supplier {
  id: string;
  name: string;
  type: string;
  active: boolean;
  costPer10x15: number;
  printerCost: number | null;
  _count: { redemptions: number };
}

interface Breakeven {
  printerCost: number;
  costPerPhoto: string;
  photosToBreakeven: number;
  estimatedConcursos: number;
  packages: Array<{
    curtidas: number;
    photos: number;
    totalCost: string;
    costBreakdown: Record<string, string>;
  }>;
  scenarios: Array<{
    printerPrice: number;
    photosNeeded: number;
    monthsAt10PerMonth: number;
  }>;
}

const T = {
  bg: "#050505",
  card: "#0a0a0a",
  border: "#1a1a1a",
  accent: "#8a9a5b",
  text: "#eee",
  text2: "#888",
  fontD: "'Barlow Condensed', sans-serif",
};

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breakeven, setBreakeven] = useState<Breakeven | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get("/admin/suppliers");
      setSuppliers(data);
      if (data.length > 0) handleSelect(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setBreakeven(null);
    try {
      const { data } = await api.get(`/admin/suppliers/${id}/breakeven`);
      setBreakeven(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32, padding: "0 32px 32px 32px" }}>
      
      {/* Lista */}
      <div>
        <h3 style={{ fontFamily: T.fontD, fontSize: 18, color: "#fff", textTransform: "uppercase", marginBottom: 16 }}>
          Fornecedores / Ativos
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suppliers.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              style={{
                background: selectedId === s.id ? "#111" : "transparent",
                border: `1px solid ${selectedId === s.id ? T.accent : T.border}`,
                padding: 16, textAlign: "left", cursor: "pointer", transition: "all .2s",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{s.name}</p>
              <p style={{ fontSize: 11, color: T.text2, margin: "4px 0 0" }}>
                {s.type === "OWN_PRINTER" ? "Impressora Própria" : "Custo Externo"}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ fontSize: 10, color: T.accent }}>R$ {Number(s.costPer10x15).toFixed(2)} / foto</span>
                <span style={{ fontSize: 10, color: "#444" }}>{s._count.redemptions} resgates</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detalhes & Simulador */}
      <div>
        {!selectedId ? (
          <div style={{ padding: 64, textAlign: "center", border: `1px dashed ${T.border}`, borderRadius: 8 }}>
            <p style={{ color: T.text2 }}>Selecione um fornecedor para ver a análise financeira.</p>
          </div>
        ) : !breakeven ? (
          <p style={{ color: T.text2 }}>Carregando dados financeiros...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            
            {/* Header Analysis */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <StatsCard label="Custo Unitário (Full)" value={`R$ ${breakeven.costPerPhoto}`} sub="Papel + Tinta + Embalagem + Frete" />
              <StatsCard label="Custo Impressora" value={`R$ ${breakeven.printerCost.toFixed(2)}`} sub="Investimento inicial do ativo" />
              <StatsCard label="Break-even" value={`${breakeven.photosToBreakeven} fotos`} sub={`Equivale a aprox. ${breakeven.estimatedConcursos} concursos`} accent />
            </div>

            {/* Pacotes de Gamificação */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 24 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: 16, color: "#fff", textTransform: "uppercase", marginBottom: 20, letterSpacing: 1 }}>
                Custos por Pacote de Gamificação
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {breakeven.packages.map(p => (
                  <div key={p.curtidas} style={{ padding: 16, border: `1px solid ${T.border}`, background: "#080808" }}>
                    <p style={{ fontSize: 10, color: T.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                      {p.curtidas} Curtidas
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
                      {p.photos} Foto{p.photos > 1 ? "s" : ""}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                      <Line label="Impressão" value={`R$ ${p.costBreakdown.impressao}`} />
                      <Line label="Embalagem" value={`R$ ${p.costBreakdown.embalagem}`} />
                      <Line label="Etiqueta" value={`R$ ${p.costBreakdown.etiqueta}`} />
                      <Line label="Frete (Rateado)" value={`R$ ${p.costBreakdown.frete}`} />
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                      <Line label="CUSTO TOTAL" value={`R$ ${p.totalCost}`} bold />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulador de Cenários */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 24 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: 16, color: "#fff", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>
                Simulador de ROI de Hardware
              </h4>
              <p style={{ fontSize: 12, color: T.text2, marginBottom: 20 }}>
                Quantas fotos precisam ser "pagas" via gamificação para amortizar diferentes modelos de impressora.
              </p>
              <div style={{ overflow: "hidden", borderRadius: 4 }}>
                 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#111", textAlign: "left" }}>
                        <th style={{ padding: 12, border: `1px solid ${T.border}` }}>Preço Impressora</th>
                        <th style={{ padding: 12, border: `1px solid ${T.border}` }}>Fotos p/ Pagar</th>
                        <th style={{ padding: 12, border: `1px solid ${T.border}` }}>Tempo Est. (10/mês)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakeven.scenarios.map(s => (
                        <tr key={s.printerPrice}>
                          <td style={{ padding: 12, border: `1px solid ${T.border}`, color: "#fff" }}>R$ {s.printerPrice.toFixed(2)}</td>
                          <td style={{ padding: 12, border: `1px solid ${T.border}`, color: T.accent, fontWeight: 700 }}>{s.photosNeeded} fotos</td>
                          <td style={{ padding: 12, border: `1px solid ${T.border}`, color: T.text2 }}>{s.monthsAt10PerMonth} meses</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}

function StatsCard({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${accent ? T.accent : T.border}`, padding: 24 }}>
      <p style={{ fontSize: 10, color: T.text2, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: T.fontD, fontSize: 32, fontWeight: 900, color: accent ? T.accent : "#fff", margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{sub}</p>
    </div>
  );
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
      <span style={{ color: "#444" }}>{label}</span>
      <span style={{ color: bold ? "#fff" : T.text2, fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}
