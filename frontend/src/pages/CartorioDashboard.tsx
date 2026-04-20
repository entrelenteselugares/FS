import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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
  page: { fontFamily: "'Inter', sans-serif", background: "#050505", color: "#ffffff", minHeight: "100vh" } as React.CSSProperties,
  card: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 0 } as React.CSSProperties,
  input: { background: "rgba(255,255,255,0.01)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "8px 12px", fontSize: 13, color: "#ffffff", outline: "none" } as React.CSSProperties,
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

  // Landing Page State
  const [lpSlug, setLpSlug] = useState("");
  const [lpAddress, setLpAddress] = useState("");
  const [lpPhone, setLpPhone] = useState("");
  const [lpDescription, setLpDescription] = useState("");
  const [lpCoverUrl, setLpCoverUrl] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [savingLp, setSavingLp] = useState(false);
  const [savingPix, setSavingPix] = useState(false);

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
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        setError("Perfil de unidade não configurado. Entre em contato com o administrador.");
      } else {
        setError("Erro ao carregar dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLpData = async () => {
    try {
      const { data } = await API.get("/cartorio/stats"); 
      // Re-aproveitando statsRes.data que já incluía cartório
      if (data.cartorio) {
        setLpSlug(data.cartorio.slug ?? "");
        setLpAddress(data.cartorio.address ?? "");
        setLpPhone(data.cartorio.phone ?? "");
        setLpDescription(data.cartorio.description ?? "");
        setLpCoverUrl(data.cartorio.coverUrl ?? "");
        setPixKey(data.pixKey ?? "");
      }
    } catch {}
  };

  useEffect(() => {
    if (tab === "configuracoes") loadLpData();
  }, [tab]);

  const saveLpProfile = async () => {
    setSavingLp(true);
    try {
      await API.patch("/partner/profile", {
        slug: lpSlug,
        address: lpAddress,
        phone: lpPhone,
        description: lpDescription,
        coverUrl: lpCoverUrl,
      });
      setSuccess("Página pública atualizada com sucesso! ✨");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar dados da página.");
    } finally {
      setSavingLp(false);
    }
  };

  const savePixKey = async () => {
    setSavingPix(true);
    try {
      await API.patch("/partner/profile", { pixKey });
      setSuccess("Chave PIX atualizada com sucesso! 💎");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar chave PIX.");
    } finally {
      setSavingPix(false);
    }
  };

  const loadPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const { data } = await API.get(`/cartorio/orders?${params}`);
      setPedidos(data.orders ?? data);
    } catch {
      setError("Erro ao carregar pedidos.");
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (tab === "pedidos") {
      loadPedidos();
    }
  }, [tab, loadPedidos]);


  const TABS: { key: Tab; label: string }[] = [
    { key: "agenda", label: "Agenda" },
    { key: "pedidos", label: "Repasses" },
    { key: "configuracoes", label: "Configurações" },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #5D6532 !important; outline: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "0.5px solid #1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "1px" }}>
            <span style={{ width: 8, height: 8, background: "#5D6532", display: "inline-block" }} />
            Foto Segundo
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: tab === t.key ? "#5D6532" : "rgba(255,255,255,0.02)",
                border: "none", padding: "8px 20px", fontSize: 11,
                cursor: "pointer", borderRadius: 0,
                color: tab === t.key ? "#fff" : "#888",
                textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{cartorioName || user?.nome}</span>
          <span style={{ fontSize: 9, padding: "4px 10px", background: "#5D6532", color: "#fff", letterSpacing: 2, textTransform: "uppercase" as const, fontWeight: 800 }}>Unidade</span>
          <button onClick={() => { logout(); navigate("/"); }} style={{ background: "none", border: "1.5px solid #2a2a2a", borderRadius: 0, padding: "6px 14px", color: "#888", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer" }}>
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
        <div style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>
            {tab === "agenda" ? "Agenda & Eventos" : tab === "pedidos" ? "Repasses" : "Configurações"}
          </h1>
          <p style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>
            {cartorioName && `${cartorioName} · `}PAINEL DE GESTÃO TÁTICA
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
              <div key={m.label} style={{ ...S.card, padding: "1.5rem" }}>
                <p style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>{m.label}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff" }}>{m.value}</p>
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
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "0.5px solid #1e1e1e" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 2 }}>Próximos eventos</p>
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
                    <p style={{ fontSize: 12, color: "#5D6532", fontWeight: 700 }}>✓ {ev.captacao.user.name}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>SEM FOTÓGRAFO</p>
                  )}
                  <p style={{ fontSize: 10, color: "#444", marginTop: 2, fontWeight: 600 }}>{ev._count.orders} venda(s)</p>
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
                style={{ marginTop: 20, background: "#5D6532", color: "#fff", border: "none", borderRadius: 0, padding: "12px 24px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2 }}
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
                    <p style={{ fontSize: 11, color: "#555", marginBottom: 2, fontWeight: 600 }}>
                      Venda: {formatCurrency(Number(p.amount))}
                    </p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, color: "#5D6532", fontWeight: 800 }}>
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
                <div style={{ flex: 1, marginRight: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e4dc", marginBottom: 4 }}>DADOS PARA REPASSE (PIX)</p>
                  <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>
                    Insira sua chave PIX para receber os repasses manuais das vendas (10% de comissão).
                  </p>
                  <input 
                    value={pixKey} 
                    onChange={e => setPixKey(e.target.value)} 
                    style={{ ...S.input, width: "100%", maxWidth: 400 }} 
                    placeholder="E-mail, CPF, CNPJ ou Chave Aleatória"
                  />
                </div>
                 <button
                  disabled={savingPix}
                  onClick={savePixKey}
                  style={{ background: "#5D6532", color: "#fff", border: "none", borderRadius: 0, padding: "12px 24px", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0, textTransform: "uppercase", letterSpacing: 2, opacity: savingPix ? 0.6 : 1 }}
                >
                  {savingPix ? "SALVANDO..." : "SALVAR CHAVE PIX"}
                </button>
              </div>
            </div>

            <div style={{ ...S.card, padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: 20 }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 10 }}>PÁGINA PÚBLICA (SEO)</h3>
                <p style={{ fontSize: 12, color: "#555" }}>Configure como sua unidade aparece nos motores de busca e para clientes que chegam via link direto.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#fff", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Slug URL (/p/xxxx)</label>
                  <input value={lpSlug} onChange={e => setLpSlug(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="ex: cartorio-central-campinas" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#fff", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Telefone de Contato</label>
                  <input value={lpPhone} onChange={e => setLpPhone(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="(19) 9..." />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "#fff", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Endereço Completo</label>
                <input value={lpAddress} onChange={e => setLpAddress(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="Rua, Número, Bairro, Cidade - UF" />
              </div>

              <div>
                 <label style={{ fontSize: 10, fontWeight: 800, color: "#fff", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Breve Descrição (Até 300 caracteres)</label>
                 <textarea value={lpDescription} onChange={e => setLpDescription(e.target.value)} rows={4} style={{ ...S.input, width: "100%", resize: "none" }} placeholder="Conte sobre a infraestrutura e horários da unidade..." />
              </div>

              <div>
                 <label style={{ fontSize: 10, fontWeight: 800, color: "#fff", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>URL da Foto de Capa</label>
                 <input value={lpCoverUrl} onChange={e => setLpCoverUrl(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="https://..." />
              </div>

              <div style={{ display: "flex", gap: "1rem", alignItems: "center", paddingTop: 20 }}>
                <button
                    disabled={savingLp}
                    onClick={saveLpProfile}
                    style={{ background: "#5D6532", color: "#fff", border: "none", borderRadius: 0, padding: "14px 28px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, opacity: savingLp ? 0.6 : 1 }}
                >
                    {savingLp ? "SALVANDO..." : "ATUALIZAR PÁGINA PÚBLICA"}
                </button>
                {lpSlug && (
                  <a href={`/p/${lpSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#5D6532", textDecoration: "none", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                    Visualizar Página ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
