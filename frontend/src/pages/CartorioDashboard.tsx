import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, X, Download } from "lucide-react";

interface UnidadeStats {
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
  captacao?: { nome?: string; user?: { name?: string; nome?: string } } | null;
  _count?: { orders: number };
}

interface PedidoUnidade {
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

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

const S = {
  page: { fontFamily: "'Outfit', sans-serif", background: "var(--theme-bg)", color: "var(--theme-text)", minHeight: "100vh" } as React.CSSProperties,
  card: { background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", borderRadius: 0 } as React.CSSProperties,
  input: { background: "transparent", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "12px 16px", fontSize: 13, color: "var(--theme-text)", outline: "none" } as React.CSSProperties,
};

type Tab = "agenda" | "pedidos" | "configuracoes";

export default function CartorioDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>("agenda");
  const [stats, setStats] = useState<UnidadeStats | null>(null);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [pedidos, setPedidos] = useState<PedidoUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pedidosError, setPedidosError] = useState("");
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
  const [qrModalEvent, setQrModalEvent] = useState<EventoAgenda | null>(null);
  const [copied, setCopied] = useState(false);

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
        API.get("/unidade-fixa/stats"),
        API.get("/unidade-fixa/events"),
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
      const { data } = await API.get("/unidade-fixa/stats"); 
      if (data.cartorio) {
        setLpSlug(data.cartorio.slug ?? "");
        setLpAddress(data.cartorio.address ?? "");
        setLpPhone(data.cartorio.phone ?? "");
        setLpDescription(data.cartorio.description ?? "");
        setLpCoverUrl(data.cartorio.coverUrl ?? "");
        setPixKey(data.pixKey ?? "");
      }
    } catch { /* silently ignore - LP data is optional */ }
  };

  useEffect(() => {
    if (tab === "configuracoes") loadLpData();
  }, [tab]);

  const saveLpProfile = async () => {
    setSavingLp(true);
    try {
      await API.patch("/unidade-fixa/profile", {
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
      await API.patch("/unidade-fixa/profile", { pixKey });
      setSuccess("Chave PIX atualizada com sucesso! 💎");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar chave PIX.");
    } finally {
      setSavingPix(false);
    }
  };

  const loadPedidos = useCallback(async () => {
    setPedidosError("");
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const { data } = await API.get(`/unidade-fixa/orders?${params}`);
      setPedidos(data.orders ?? data);
    } catch {
      setPedidosError("Erro ao carregar pedidos. Tente novamente.");
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
        * { box-sizing: border-box; }
        input:focus { border-color: var(--brand-primary) !important; outline: none; }
        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .mobile-grid-2 { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
          .mobile-stack { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
          .mobile-nav { padding: 0.8rem 1rem !important; flex-direction: column !important; gap: 1rem !important; align-items: center !important; text-align: center !important; }
          .mobile-hide { display: none !important; }
          .mobile-padding { padding: 1.5rem !important; }
          .mobile-scroll-x { overflow-x: auto !important; padding-bottom: 5px !important; width: 100% !important; justify-content: flex-start !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="mobile-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid var(--theme-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <img 
              src="/logo-premium.png" 
              alt="Logo" 
              style={{ 
                height: 40, 
                objectFit: "contain",
                filter: "brightness(0) invert(1)"
              }} 
            />
          </div>
          <div className="mobile-scroll-x" style={{ display: "flex", gap: 8 }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: tab === t.key ? "var(--brand-primary)" : "var(--theme-bg-muted)",
                border: "none", padding: "8px 14px", fontSize: 10,
                cursor: "pointer", borderRadius: 0,
                color: tab === t.key ? "var(--theme-text-on-brand)" : "var(--theme-text-muted)",
                textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px",
                whiteSpace: "nowrap"
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="mobile-hide" style={{ fontSize: 10, color: "var(--theme-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{cartorioName || user?.nome}</span>
          <button onClick={() => { logout(); navigate("/"); }} style={{ background: "none", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "6px 12px", color: "var(--theme-text-muted)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </nav>

      <div className="mobile-padding" style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>

        {/* Alertas */}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 0, padding: "12px 16px", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: 13, color: "#ef4444", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(133, 185, 172, 0.1)", border: "1px solid rgba(133, 185, 172, 0.2)", borderRadius: 0, padding: "12px 16px", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: 13, color: "#85B9AC", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{success}</p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 className="mobile-title" style={{ fontSize: 42, fontWeight: 800, color: "var(--theme-text)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "-1px" }}>
            {tab === "agenda" ? "Agenda & Eventos" : tab === "pedidos" ? "Repasses" : "Configurações"}
          </h1>
          <p style={{ fontSize: 11, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>
            {cartorioName && `${cartorioName} · `}PAINEL DE GESTÃO TÁTICA
          </p>
        </div>

        {/* KPIs */}
        {!loading && stats && (
          <div className="mobile-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Eventos este mês", value: String(stats.eventosMes ?? 0) },
              { label: "Total de eventos", value: String(stats.totalEventos ?? 0) },
              { label: "Vendas confirmadas", value: String(stats.totalVendas ?? 0) },
              { label: "Repasse estimado", value: formatCurrency(stats.repasseEstimado ?? 0) },
            ].map((m) => (
              <div key={m.label} style={{ ...S.card, padding: "1.5rem" }}>
                <p style={{ fontSize: 10, color: "var(--theme-text-muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>{m.label}</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: "var(--theme-text)" }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="mobile-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
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
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--theme-text)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>
                    {formatDateTime(ev.date)} · {ev.location}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {ev.captacao ? (
                    <p style={{ fontSize: 12, color: "var(--brand-primary)", fontWeight: 700 }}>✓ {ev.captacao?.user?.name ?? ev.captacao?.user?.nome ?? ev.captacao?.nome ?? "Fotógrafo"}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>SEM FOTÓGRAFO</p>
                  )}
                  <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: 2, fontWeight: 600 }}>{ev._count?.orders ?? 0} venda(s)</p>
                </div>
                <div style={{ paddingLeft: "1rem", borderLeft: "0.5px solid #161616" }}>
                  <button 
                    onClick={() => { setQrModalEvent(ev); setCopied(false); }}
                    style={{ background: "rgba(133,185,172,0.1)", border: "1px solid rgba(133,185,172,0.2)", borderRadius: 6, padding: "8px", color: "var(--brand-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="QR Code do Evento"
                  >
                    <QrCode size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REPASSES ── */}
        {tab === "pedidos" && (
          <div>
            {pedidosError && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 0, padding: "12px 16px", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: 13, color: "#ef4444", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{pedidosError}</p>
              </div>
            )}
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
                style={{ marginTop: 20, background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "12px 24px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2 }}
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
                    <p style={{ fontSize: 13, color: "var(--theme-text)", marginBottom: 2 }}>{p.event.title}</p>
                    <p style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>{p.buyerEmail ?? "—"} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: "var(--theme-text-muted)", marginBottom: 2, fontWeight: 600 }}>
                      Venda: {formatCurrency(Number(p.amount))}
                    </p>
                    <p style={{ fontSize: 20, color: "var(--brand-primary)", fontWeight: 800 }}>
                      Repasse: {p.splitCartorio ? formatCurrency(Number(p.splitCartorio)) : "—"}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 9, padding: "3px 8px", borderRadius: 20, letterSpacing: 1,
                    textTransform: "uppercase" as const,
                    background: p.status === "APPROVED" || p.status === "APROVADO" ? "rgba(133, 185, 172, 0.1)" : "#1a0d00",
                    border: `0.5px solid ${p.status === "APPROVED" || p.status === "APROVADO" ? "rgba(133, 185, 172, 0.3)" : "#3a2000"}`,
                    color: p.status === "APPROVED" || p.status === "APROVADO" ? "#85B9AC" : "#f59e0b",
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
                  style={{ background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "12px 24px", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0, textTransform: "uppercase", letterSpacing: 2, opacity: savingPix ? 0.6 : 1 }}
                >
                  {savingPix ? "SALVANDO..." : "SALVAR CHAVE PIX"}
                </button>
              </div>
            </div>

            <div style={{ ...S.card, padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: 20 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 10 }}>PÁGINA PÚBLICA (SEO)</h3>
                <p style={{ fontSize: 12, color: "#555" }}>Configure como sua unidade fixa aparece nos motores de busca e para clientes que chegam via link direto.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#fff", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Slug URL (/p/xxxx)</label>
                  <input value={lpSlug} onChange={e => setLpSlug(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="ex: unidade-centro-campinas" />
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
                    style={{ background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "14px 28px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, opacity: savingLp ? 0.6 : 1 }}
                >
                    {savingLp ? "SALVANDO..." : "ATUALIZAR PÁGINA PÚBLICA"}
                </button>
                {lpSlug && (
                  <a href={`/p/${lpSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                    Visualizar Página ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {qrModalEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: 400, padding: "2rem", position: "relative", textAlign: "center", animation: "fadeIn 0.3s ease-out" }}>
            <button 
              onClick={() => setQrModalEvent(null)}
              style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", color: "#444", cursor: "pointer" }}
            >
              <X size={24} />
            </button>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(133,185,172,0.1)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <QrCode size={24} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>QR Code do Evento</h3>
              <p style={{ fontSize: 12, color: "#888" }}>Imprima ou compartilhe para que os noivos e convidados acessem o álbum direto da unidade fixa.</p>
            </div>

            <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 12, display: "inline-block", marginBottom: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <QRCodeSVG 
                id="qr-code-svg"
                value={`${window.location.origin}/e/${qrModalEvent.id}`}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/e/${qrModalEvent.id}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Link Copiado!" : "Copiar Link"}
                </button>
                
                <button 
                  onClick={() => {
                    const svg = document.getElementById("qr-code-svg");
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `QRCode-${qrModalEvent.title.replace(/\s+/g, '-').toLowerCase()}.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                  }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "var(--brand-primary)", border: "none", color: "var(--theme-text-on-brand)", fontSize: 12, fontWeight: 900, cursor: "pointer", transition: "all 0.2s", textTransform: "uppercase" }}
                >
                  <Download size={16} /> DOWNLOAD
                </button>
              </div>
              
              <p style={{ fontSize: 10, color: "#444", fontStyle: "italic" }}>Dica: Imprima este QR Code e anexe à pasta de documentos dos noivos.</p>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
