import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";

interface CartorioStats {
  totalEventos: number;
  totalVendas: number;
  repasseEstimado: number;
  eventosMes: number;
  razaoSocial?: string;
}

interface EventoAgenda {
  id: string;
  title: string;
  date: string;
  location: string;
  captacao?: { user: { name: string } } | null;
  _count: { orders: number };
}

interface PedidoCartorio {
  id: string;
  status: string;
  amount: number;
  splitCartorio: number | null;
  createdAt: string;
  buyerEmail: string | null;
  event: { title: string };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(d));
}

function formatDateTime(d: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

const S = {
  page: { fontFamily: "'DM Sans', sans-serif", background: "#0a0a0a", color: "#e8e4dc", minHeight: "100vh" } as React.CSSProperties,
  card: { background: "#111", border: "0.5px solid #1e1e1e", borderRadius: 10 } as React.CSSProperties,
  input: { background: "#0d0d0d", border: "0.5px solid #2a2a2a", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", outline: "none" } as React.CSSProperties,
};

type Tab = "agenda" | "pedidos" | "configuracoes";

export default function CartorioDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>("agenda");
  const [stats, setStats] = useState<CartorioStats | null>(null);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCartorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cartorioName, setCartorioName] = useState("");

  // Evitar setState loop no useEffect
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    const mpConnected = searchParams.get("mp_connected");
    if (mpConnected) {
      handledRef.current = true;
      setSuccess("Mercado Pago conectado com sucesso! ✅");
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventosRes] = await Promise.all([
        API.get("/cartorio/stats"),
        API.get("/cartorio/events"),
      ]);
      setStats(statsRes.data);
      setEventos(eventosRes.data.events ?? eventosRes.data);
      setCartorioName(statsRes.data.razaoSocial ?? "");
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Perfil de cartório não configurado. Entre em contato com o administrador.");
      } else {
        setError("Erro ao carregar dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const { data } = await API.get(`/cartorio/orders?${params}`);
      setPedidos(data.orders ?? data);
    } catch {
      setError("Erro ao carregar pedidos.");
    }
  };

  useEffect(() => {
    if (tab === "pedidos") loadPedidos();
  }, [tab]);

  const handleVincularMP = () => {
    const token = localStorage.getItem("fs_token");
    if (!token) { setError("Você precisa estar logado."); return; }
    window.location.href = `${import.meta.env.VITE_API_URL}/api/mercadopago/connect?token=${token}`;
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "agenda", label: "Agenda" },
    { key: "pedidos", label: "Repasses" },
    { key: "configuracoes", label: "Configurações" },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #c9a96e !important; outline: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "0.5px solid #1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, background: "#c9a96e", borderRadius: "50%", display: "inline-block" }} />
            Foto Segundo
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: tab === t.key ? "#1a1a1a" : "none",
                border: "none", padding: "6px 14px", fontSize: 13,
                cursor: "pointer", borderRadius: 6,
                color: tab === t.key ? "#fff" : "#555",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#555" }}>{cartorioName || user?.nome}</span>
          <span style={{ fontSize: 9, padding: "3px 8px", background: "#0a1a2a", border: "0.5px solid #1a3a5a", borderRadius: 20, color: "#60a5fa", letterSpacing: 1, textTransform: "uppercase" as const }}>Cartório</span>
          <button onClick={() => { logout(); navigate("/"); }} style={{ background: "none", border: "0.5px solid #2a2a2a", borderRadius: 4, padding: "5px 12px", color: "#666", fontSize: 12, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>

        {/* Alertas */}
        {error && (
          <div style={{ background: "#1a0a0a", border: "0.5px solid #3a1a1a", borderRadius: 8, padding: "12px 16px", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: "#0d1a0d", border: "0.5px solid #1e3a1e", borderRadius: 8, padding: "12px 16px", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: 13, color: "#4ade80", margin: 0 }}>{success}</p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            {tab === "agenda" ? "Agenda & Eventos" : tab === "pedidos" ? "Repasses" : "Configurações"}
          </h1>
          <p style={{ fontSize: 13, color: "#555" }}>
            {cartorioName && `${cartorioName} · `}Painel de gestão
          </p>
        </div>

        {/* KPIs */}
        {!loading && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Eventos este mês", value: String(stats.eventosMes ?? 0) },
              { label: "Total de eventos", value: String(stats.totalEventos ?? 0) },
              { label: "Vendas confirmadas", value: String(stats.totalVendas ?? 0) },
              { label: "Repasse estimado", value: formatCurrency(stats.repasseEstimado ?? 0) },
            ].map((m) => (
              <div key={m.label} style={{ ...S.card, padding: "1.25rem" }}>
                <p style={{ fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{m.label}</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ ...S.card, padding: "1.25rem" }}>
                <div style={{ height: 10, background: "#1a1a1a", borderRadius: 3, width: "60%", marginBottom: 12 }} />
                <div style={{ height: 22, background: "#1a1a1a", borderRadius: 3, width: "40%" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── AGENDA ── */}
        {tab === "agenda" && (
          <div style={S.card}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid #1e1e1e" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e4dc" }}>Próximos eventos</p>
            </div>
            {loading ? (
              <p style={{ padding: "2rem", textAlign: "center", color: "#444", fontSize: 13 }}>Carregando...</p>
            ) : eventos.length === 0 ? (
              <p style={{ padding: "2rem", textAlign: "center", color: "#444", fontSize: 13 }}>
                Nenhum evento agendado ainda.
              </p>
            ) : eventos.map((ev, i) => (
              <div key={ev.id} style={{ padding: "0.875rem 1.25rem", borderBottom: i < eventos.length - 1 ? "0.5px solid #161616" : "none", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#e8e4dc", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </p>
                  <p style={{ fontSize: 11, color: "#555" }}>
                    {formatDateTime(ev.date)} · {ev.location}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {ev.captacao ? (
                    <p style={{ fontSize: 12, color: "#4ade80" }}>✓ {ev.captacao.user.name}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: "#f59e0b" }}>Sem fotógrafo</p>
                  )}
                  <p style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{ev._count.orders} venda(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REPASSES ── */}
        {tab === "pedidos" && (
          <div>
            {/* Filtros de data */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>De</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Até</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={S.input} />
              </div>
              <button
                onClick={loadPedidos}
                style={{ marginTop: 20, background: "#c9a96e", color: "#0a0a0a", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Filtrar
              </button>
            </div>

            <div style={S.card}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid #1e1e1e" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e4dc" }}>Histórico de repasses</p>
              </div>
              {pedidos.length === 0 ? (
                <p style={{ padding: "2rem", textAlign: "center", color: "#444", fontSize: 13 }}>
                  Nenhum repasse encontrado.
                </p>
              ) : pedidos.map((p, i) => (
                <div key={p.id} style={{ padding: "0.875rem 1.25rem", borderBottom: i < pedidos.length - 1 ? "0.5px solid #161616" : "none", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "#e8e4dc", marginBottom: 2 }}>{p.event.title}</p>
                    <p style={{ fontSize: 11, color: "#555" }}>{p.buyerEmail ?? "—"} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>
                      Venda: {formatCurrency(Number(p.amount))}
                    </p>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#c9a96e", fontWeight: 700 }}>
                      Repasse: {p.splitCartorio ? formatCurrency(Number(p.splitCartorio)) : "—"}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9, padding: "3px 8px", borderRadius: 20, letterSpacing: 1,
                    textTransform: "uppercase" as const,
                    background: p.status === "APPROVED" || p.status === "APROVADO" ? "#0d1a0d" : "#1a0d00",
                    border: `0.5px solid ${p.status === "APPROVED" || p.status === "APROVADO" ? "#1e3a1e" : "#3a2000"}`,
                    color: p.status === "APPROVED" || p.status === "APROVADO" ? "#4ade80" : "#f59e0b",
                    flexShrink: 0,
                  }}>
                    {p.status === "APPROVED" || p.status === "APROVADO" ? "pago" : "pendente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONFIGURAÇÕES ── */}
        {tab === "configuracoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ ...S.card, padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e4dc", marginBottom: 4 }}>Vínculo Mercado Pago</p>
                  <p style={{ fontSize: 12, color: "#555" }}>
                    Vincule sua conta para receber repasses automáticos (10% por venda)
                  </p>
                </div>
                <button
                  onClick={handleVincularMP}
                  style={{ background: "#c9a96e", color: "#0a0a0a", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                >
                  Vincular conta
                </button>
              </div>
            </div>

            <div style={{ ...S.card, padding: "1.25rem" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e4dc", marginBottom: 4 }}>Nome do cartório</p>
              <p style={{ fontSize: 12, color: "#555", marginBottom: "0.875rem" }}>
                Nome exibido na vitrine pública dos eventos
              </p>
              <input
                value={cartorioName}
                onChange={(e) => setCartorioName(e.target.value)}
                style={{ ...S.input, width: "100%" }}
                placeholder="1º Cartório de Registro Civil"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
