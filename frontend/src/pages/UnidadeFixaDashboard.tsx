import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { API } from "../lib/api";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, X, Download, Calendar, DollarSign, Settings, Users2, Camera, Star } from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";

interface UnidadeStats {
  totalEventos: number;
  totalVendas: number;
  repasseEstimado: number;
  eventosMes: number;
  razaoSocial?: string;
}

interface GlobalService {
  id: string;
  name: string;
  description: string;
  basePrice: number;
}

interface ProfissionalTeam {
  id: string;
  userId: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  services: string[];
  cameras: string[];
  vinculo: "FIXO" | "ROTATIVO" | null;
}

interface EventoAgenda {
  id: string;
  slug: string;
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

type Tab = "agenda" | "pedidos" | "equipe" | "configuracoes";

export default function UnidadeFixaDashboard() {
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>("agenda");
  const [stats, setStats] = useState<UnidadeStats | null>(null);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [pedidos, setPedidos] = useState<PedidoUnidade[]>([]);
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
  const [lpFixedDuration, setLpFixedDuration] = useState(2);
  const [lpFixedTime, setLpFixedTime] = useState(false);
  const [lpHideDuration, setLpHideDuration] = useState(false);
  const [savingLp, setSavingLp] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [qrModalEvent, setQrModalEvent] = useState<EventoAgenda | null>(null);
  const [copied, setCopied] = useState(false);

  // Custom Prices State
  const [globalServices, setGlobalServices] = useState<GlobalService[]>([]);
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [savingPrices, setSavingPrices] = useState(false);

  // Team State
  const [teamData, setTeamData] = useState<ProfissionalTeam[]>([]);
  const [teamChanges, setTeamChanges] = useState<Record<string, "FIXO" | "ROTATIVO" | null>>({});
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [unidadeName, setUnidadeName] = useState("");

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


  const loadLpData = useCallback(async () => {
    try {
      const [{ data: statsData }, { data: servicesData }] = await Promise.all([
        API.get("/unidade-fixa/stats"),
        API.get("/public/configs/services")
      ]);

      if (statsData.cartorio) {
        setLpSlug(statsData.cartorio.slug ?? "");
        setLpAddress(statsData.cartorio.address ?? "");
        setLpPhone(statsData.cartorio.phone ?? "");
        setLpDescription(statsData.cartorio.description ?? "");
        setLpCoverUrl(statsData.cartorio.coverUrl ?? "");
        setLpFixedDuration(statsData.cartorio.fixedDuration || 2);
        setLpFixedTime(statsData.cartorio.fixedTime || false);
        setLpHideDuration(statsData.cartorio.hideDuration || false);
        setLocalPrices(statsData.cartorio.servicePrices || {});
        setPixKey(statsData.pixKey ?? "");
      }
      setGlobalServices(servicesData.services || []);
    } catch { /* silently ignore - LP data is optional */ }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eventosRes] = await Promise.all([
        API.get("/unidade-fixa/stats"),
        API.get("/unidade-fixa/events"),
      ]);
      setStats(statsRes.data);
      setEventos(eventosRes.data.events ?? eventosRes.data);
      setUnidadeName(statsRes.data.razaoSocial ?? "");
      await loadLpData();
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
  }, [loadLpData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tab === "configuracoes") loadLpData();
  }, [tab, loadLpData]);

  const saveLpProfile = async () => {
    setSavingLp(true);
    try {
      await API.patch("/unidade-fixa/profile", {
        slug: lpSlug,
        address: lpAddress,
        phone: lpPhone,
        description: lpDescription,
        coverUrl: lpCoverUrl,
        fixedDuration: lpFixedDuration,
        fixedTime: lpFixedTime,
        hideDuration: lpHideDuration
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

  const saveServicePrices = async () => {
    setSavingPrices(true);
    try {
      await API.patch("/unidade-fixa/profile", { servicePrices: localPrices });
      setSuccess("Tabela de preços atualizada com sucesso! 🏷️");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar tabela de preços.");
    } finally {
      setSavingPrices(false);
    }
  };

  const loadTeam = async () => {
    try {
      const { data } = await API.get("/unidade-fixa/team");
      setTeamData(data.profissionais || []);
      setTeamLoaded(true);
    } catch {
      setError("Erro ao carregar equipe.");
    }
  };

  const saveTeam = async () => {
    setSavingTeam(true);
    try {
      const assignments = Object.entries(teamChanges).map(([profissionalId, tipo]) => ({ profissionalId, tipo }));
      await API.put("/unidade-fixa/team", { assignments });
      setSuccess("Configuração de equipe salva com sucesso! 👥");
      setTeamChanges({});
      await loadTeam();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar configuração de equipe.");
    } finally {
      setSavingTeam(false);
    }
  };

  const getVinculo = (p: ProfissionalTeam): "FIXO" | "ROTATIVO" | null => {
    if (p.id in teamChanges) return teamChanges[p.id];
    return p.vinculo;
  };

  const loadPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const { data } = await API.get(`/unidade-fixa/orders?${params}`);
      setPedidos(data.orders ?? data);
    } catch {
      setError("Erro ao carregar pedidos. Tente novamente.");
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (tab === "pedidos") {
      loadPedidos();
    }
  }, [tab, loadPedidos]);


  const NAV_ITEMS = (tab: Tab, setTab: (t: Tab) => void): NavItem[] => [
    { label: "Agenda", onClick: () => setTab("agenda"), isActive: tab === "agenda", icon: <Calendar size={16} /> },
    { label: "Repasses", onClick: () => setTab("pedidos"), isActive: tab === "pedidos", icon: <DollarSign size={16} /> },
    { label: "Equipe", onClick: () => { setTab("equipe"); if (!teamLoaded) loadTeam(); }, isActive: tab === "equipe", icon: <Users2 size={16} /> },
    { label: "Página Pública", onClick: () => setTab("configuracoes"), isActive: tab === "configuracoes", icon: <Settings size={16} /> },
  ];

  return (
    <DashboardLayout 
      title="Painel de Unidade" 
      navItems={NAV_ITEMS(tab, setTab)}
    >
      <style>{`
        * { box-sizing: border-box; }
        input:focus { border-color: ${T.brand} !important; outline: none; }
        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .mobile-grid-2 { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
          .mobile-stack { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
          .mobile-hide { display: none !important; }
          .mobile-padding { padding: 1.5rem !important; }
        }
      `}</style>

      <div className="mobile-padding" style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(24px, 6vw, 64px)" }}>

        {/* Alertas */}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 0, padding: "12px 16px", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: 13, color: "#ef4444", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(133, 185, 172, 0.1)", border: "1px solid rgba(133, 185, 172, 0.2)", borderRadius: 0, padding: "12px 16px", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: 13, color: "var(--brand-primary)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{success}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-12">
          <h1 className="heading-luxury text-theme-text mb-4">
            {tab === "agenda" ? "Agenda & Eventos" : tab === "pedidos" ? "Repasses" : "Configurações"}
          </h1>
          <p className="text-proportional">
          {unidadeName && `${unidadeName} · `}
          {tab === "agenda" && "PAINEL DE GESTÃO TÁTICA"}
          {tab === "pedidos" && "HISTÓRICO DE REPASSES"}
          {tab === "equipe" && "GESTÃO DE EQUIPE"}
          {tab === "configuracoes" && "CONFIGURAÇÕES"}
          </p>
        </div>

        {/* KPIs */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Eventos este mês", value: String(stats.eventosMes ?? 0) },
              { label: "Total de eventos", value: String(stats.totalEventos ?? 0) },
              { label: "Vendas confirmadas", value: String(stats.totalVendas ?? 0) },
              { label: "Repasse estimado", value: formatCurrency(stats.repasseEstimado ?? 0) },
            ].map((m) => (
              <div key={m.label} className="lux-card border-l-4 border-l-brand-primary">
                <p className="text-proportional mb-4">{m.label}</p>
                <p className="text-3xl font-black text-theme-text">{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="mobile-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ ...S.card, padding: "1.25rem" }}>
                <div style={{ height: 10, background: "var(--theme-bg-muted)", borderRadius: 3, width: "60%", marginBottom: 12 }} />
                <div style={{ height: 22, background: "var(--theme-bg-muted)", borderRadius: 3, width: "40%" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── AGENDA ── */}
        {tab === "agenda" && (
          <div style={S.card}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "0.5px solid var(--theme-border)" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: 2 }}>Próximos eventos</p>
            </div>
            {loading ? (
              <p style={{ padding: "2rem", textAlign: "center", color: "var(--theme-text-muted)", fontSize: 13 }}>Carregando...</p>
            ) : eventos.length === 0 ? (
              <p style={{ padding: "2rem", textAlign: "center", color: "var(--theme-text-muted)", fontSize: 13 }}>
                Nenhum evento agendado ainda.
              </p>
            ) : eventos.map((ev, i) => (
              <div key={ev.id} style={{ padding: "0.875rem 1.25rem", borderBottom: i < eventos.length - 1 ? "0.5px solid var(--theme-border)" : "none", display: "flex", alignItems: "center", gap: "1rem" }}>
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
                    <p style={{ fontSize: 12, color: "var(--brand-primary)", fontWeight: 700 }}>✓ {ev.captacao?.user?.name ?? ev.captacao?.user?.nome ?? ev.captacao?.nome ?? "Profissional da Rede"}</p>
                  ) : (
                    <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>SEM PROFISSIONAL DESIGNADO</p>
                  )}
                  <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: 2, fontWeight: 600 }}>{ev._count?.orders ?? 0} venda(s)</p>
                </div>
                <div style={{ paddingLeft: "1rem", borderLeft: "0.5px solid var(--theme-border)" }}>
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
          <div className="mobile-stack" style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--theme-text-muted)", display: "block", marginBottom: 4 }}>Início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...S.input, width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "var(--theme-text-muted)", display: "block", marginBottom: 4 }}>Fim</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...S.input, width: "100%" }} />
            </div>
            <button
              onClick={loadPedidos}
              style={{ background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "12px 24px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, height: 44 }}
            >
              Filtrar
            </button>
          </div>

            <div style={S.card}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--theme-border)" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--theme-text)" }}>Histórico de repasses</p>
              </div>
              {pedidos.length === 0 ? (
                <p style={{ padding: "2rem", textAlign: "center", color: "var(--theme-text-muted)", fontSize: 13 }}>
                  Nenhum repasse encontrado.
                </p>
              ) : pedidos.map((p, i) => (
                <div key={p.id} style={{ padding: "0.875rem 1.25rem", borderBottom: i < pedidos.length - 1 ? "0.5px solid var(--theme-border)" : "none", display: "flex", alignItems: "center", gap: "1rem" }}>
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
                    background: p.status === "APPROVED" || p.status === "APROVADO" ? "rgba(133, 185, 172, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    border: `0.5px solid ${p.status === "APPROVED" || p.status === "APROVADO" ? "rgba(133, 185, 172, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                    color: p.status === "APPROVED" || p.status === "APROVADO" ? "var(--brand-primary)" : "#f59e0b",
                    flexShrink: 0,
                  }}>
                    {p.status === "APPROVED" || p.status === "APROVADO" ? "pago" : "pendente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EQUIPE ── */}
        {tab === "equipe" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header Card */}
            <div style={{ ...S.card, padding: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users2 size={18} />
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase" }}>
                  Configuração de Equipe
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "var(--theme-text-muted)", maxWidth: 600, lineHeight: 1.6 }}>
                Defina quais profissionais são <strong style={{ color: "var(--theme-text)" }}>fixos</strong> na sua unidade (sempre convocados) ou <strong style={{ color: "var(--theme-text)" }}>rotativos</strong> (entram no pool geral da rede). Profissionais sem vínculo não aparecem como preferência para os seus eventos.
              </p>
            </div>

            {/* Legenda */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                { cor: "var(--theme-border)", label: "Sem vínculo — não entra no pool desta unidade" },
                { cor: "#3b82f6", label: "Rotativo — pode ser convocado pela rede" },
                { cor: "var(--brand-primary)", label: "Fixo — sempre convocado para seus eventos" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "var(--theme-text-muted)", fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Lista de profissionais */}
            {teamData.length === 0 ? (
              <div style={{ ...S.card, padding: "4rem 2rem", textAlign: "center" }}>
                <Camera size={32} style={{ color: "var(--theme-text-muted)", margin: "0 auto 1rem" }} />
                <p style={{ fontSize: 13, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2 }}>
                  Nenhum profissional cadastrado na plataforma ainda.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {teamData.map(p => {
                  const vinculo = getVinculo(p);
                  return (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "1.25rem 1.75rem",
                      background: "var(--theme-bg-muted)",
                      border: `1px solid ${vinculo === "FIXO" ? "var(--brand-primary)" : vinculo === "ROTATIVO" ? "#3b82f620" : "var(--theme-border)"}`,
                      transition: "border-color 0.3s"
                    }} className="mobile-stack">
                      {/* Info do profissional */}
                      <div style={{ flex: 1, minWidth: 0, marginRight: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          {vinculo === "FIXO" && <Star size={13} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />}
                          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--theme-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome}</p>
                        </div>
                        <p style={{ fontSize: 11, color: "var(--theme-text-muted)", marginBottom: 8 }}>{p.email}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {p.services.map(s => (
                            <span key={s} style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, padding: "3px 8px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Seletor de vínculo */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {([null, "ROTATIVO", "FIXO"] as const).map(tipo => (
                          <button
                            key={String(tipo)}
                            onClick={() => setTeamChanges(prev => ({ ...prev, [p.id]: tipo }))}
                            style={{
                              padding: "8px 14px",
                              fontSize: 9,
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: 1.5,
                              cursor: "pointer",
                              border: "1px solid",
                              borderRadius: 0,
                              transition: "all 0.2s",
                              borderColor: vinculo === tipo
                                ? tipo === "FIXO" ? "var(--brand-primary)" : tipo === "ROTATIVO" ? "#3b82f6" : "var(--theme-border)"
                                : "var(--theme-border)",
                              background: vinculo === tipo
                                ? tipo === "FIXO" ? "var(--brand-primary)" : tipo === "ROTATIVO" ? "#3b82f620" : "var(--theme-bg)"
                                : "transparent",
                              color: vinculo === tipo
                                ? tipo === "FIXO" ? "var(--theme-text-on-brand)" : tipo === "ROTATIVO" ? "#3b82f6" : "var(--theme-text-muted)"
                                : "var(--theme-text-muted)",
                            }}
                          >
                            {tipo === null ? "Sem vínculo" : tipo === "ROTATIVO" ? "Rotativo" : "⭐ Fixo"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botão Salvar */}
            {Object.keys(teamChanges).length > 0 && (
              <div style={{ padding: "1.5rem", background: "var(--theme-bg-muted)", border: "1px solid var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <p style={{ fontSize: 12, color: "var(--theme-text)", fontWeight: 700 }}>
                  {Object.keys(teamChanges).length} alteração(ões) pendente(s)
                </p>
                <button
                  disabled={savingTeam}
                  onClick={saveTeam}
                  style={{ background: "var(--brand-primary)", color: "black", border: "none", borderRadius: 0, padding: "12px 32px", fontSize: 11, fontWeight: 900, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, opacity: savingTeam ? 0.6 : 1 }}
                >
                  {savingTeam ? "SALVANDO..." : "SALVAR CONFIGURAÇÃO"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIGURAÇÕES ── */}
        {tab === "configuracoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ ...S.card, padding: "2rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
                <div style={{ flex: 1, minWidth: "min(300px, 100%)" }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--theme-text)", marginBottom: 4 }}>DADOS PARA REPASSE (PIX)</p>
                  <p style={{ fontSize: 12, color: "var(--theme-text-muted)", marginBottom: 12 }}>
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
                  style={{ background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "12px 24px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, opacity: savingPix ? 0.6 : 1, width: "auto" }}
                >
                  {savingPix ? "SALVANDO..." : "SALVAR CHAVE PIX"}
                </button>
              </div>
            </div>

            {/* ── GESTÃO DE PREÇOS ── */}
            <div style={{ ...S.card, padding: "2rem" }}>
              <div style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: 20, marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                   <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DollarSign size={16} />
                   </div>
                   <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: -0.5 }}>Tabela de Preços Locais</h3>
                </div>
                <p style={{ fontSize: 12, color: "var(--theme-text-muted)", maxWidth: 600, lineHeight: 1.6 }}>
                  Sua unidade tem autonomia para praticar preços diferenciados. 
                  Abaixo, você pode configurar o valor final de venda para cada item do catálogo. 
                  Deixe em branco para utilizar o valor base sugerido pela administração.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {globalServices.length === 0 ? (
                  <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed var(--theme-border)" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Catálogo não configurado</p>
                    <p style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>O administrador ainda não cadastrou os serviços da rede. Assim que o catálogo for publicado, os itens aparecerão aqui para customização.</p>
                  </div>
                ) : globalServices.map(svc => (
                  <div key={svc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 2rem", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", transition: "border-color 0.3s" }} className="mobile-stack group hover:border-brand-primary/30">
                    <div style={{ flex: 1, marginRight: "2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: 1 }}>{svc.name}</p>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--theme-text-muted)", lineHeight: 1.5 }}>{svc.description}</p>
                      <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--theme-bg-muted)", padding: "4px 10px", border: "1px solid var(--theme-border)" }}>
                         <span style={{ fontSize: 8, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Sugerido:</span>
                         <span style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)" }}>{formatCurrency(svc.basePrice)}</span>
                      </div>
                    </div>
                    <div style={{ width: 220 }} className="mobile-stack">
                       <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 900, color: "var(--brand-primary)" }}>R$</span>
                          <input 
                            type="number"
                            value={localPrices[svc.id] || ""} 
                            onChange={e => setLocalPrices({ ...localPrices, [svc.id]: Number(e.target.value) })}
                            style={{ ...S.input, width: "100%", paddingLeft: 48, fontWeight: 900, fontSize: 18, border: "1px solid var(--theme-border)" }} 
                            placeholder={String(svc.basePrice)}
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {globalServices.length > 0 && (
              <div style={{ marginTop: "2.5rem", borderTop: "1px solid var(--theme-border)", paddingTop: "2.5rem" }}>
                <button
                   disabled={savingPrices}
                   onClick={saveServicePrices}
                   style={{ background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "14px 40px", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, opacity: savingPrices ? 0.6 : 1 }}
                >
                   {savingPrices ? "SALVANDO..." : "ATUALIZAR TABELA DE PREÇOS"}
                </button>
              </div>
              )}
            </div>

            <div style={{ ...S.card, padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ borderBottom: "1px solid var(--theme-border)", paddingBottom: 20 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--theme-text)", marginBottom: 10 }}>PÁGINA PÚBLICA (SEO)</h3>
                <p style={{ fontSize: 12, color: "var(--theme-text-muted)" }}>Configure como sua unidade fixa aparece nos motores de busca e para clientes que chegam via link direto.</p>
              </div>

              <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Slug URL (/p/xxxx)</label>
                  <input value={lpSlug} onChange={e => setLpSlug(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="ex: unidade-centro-campinas" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Telefone de Contato</label>
                  <input value={lpPhone} onChange={e => setLpPhone(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="(19) 9..." />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Endereço Completo</label>
                <input value={lpAddress} onChange={e => setLpAddress(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="Rua, Número, Bairro, Cidade - UF" />
              </div>

              <div>
                 <label style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Breve Descrição (Até 300 caracteres)</label>
                 <textarea value={lpDescription} onChange={e => setLpDescription(e.target.value)} rows={4} style={{ ...S.input, width: "100%", resize: "none" }} placeholder="Conte sobre a infraestrutura e horários da unidade..." />
              </div>

              <div>
                 <label style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>URL da Foto de Capa</label>
                 <input value={lpCoverUrl} onChange={e => setLpCoverUrl(e.target.value)} style={{ ...S.input, width: "100%" }} placeholder="https://..." />
              </div>

              <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Pontualidade de Horário (Duração Padrão)</label>
                  <p style={{ fontSize: 11, color: "var(--theme-text-muted)", marginBottom: 12 }}>Defina quantas horas de cobertura são padrão para eventos nesta unidade fixa.</p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: 20 }}>
                    <input 
                      type="number"
                      value={lpFixedDuration} 
                      onChange={e => setLpFixedDuration(Number(e.target.value))} 
                      style={{ ...S.input, width: 80, textAlign: "center", fontWeight: 900, fontSize: 18 }} 
                    />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>HORAS DE COBERTURA</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setLpFixedTime(!lpFixedTime)}>
                      <div style={{ width: 22, height: 22, border: `2px solid ${lpFixedTime ? "var(--brand-primary)" : "var(--theme-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: lpFixedTime ? "var(--brand-primary)" : "transparent", transition: "all 0.2s" }}>
                        {lpFixedTime && <div style={{ width: 10, height: 10, background: "var(--theme-bg)" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Tempo Fixo (Travar Horário)</div>
                        <div style={{ fontSize: 9, color: "var(--theme-text-muted)", marginTop: 2 }}>O cliente verá a duração, mas não poderá alterá-la.</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setLpHideDuration(!lpHideDuration)}>
                      <div style={{ width: 22, height: 22, border: `2px solid ${lpHideDuration ? "var(--brand-primary)" : "var(--theme-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: lpHideDuration ? "var(--brand-primary)" : "transparent", transition: "all 0.2s" }}>
                        {lpHideDuration && <div style={{ width: 10, height: 10, background: "var(--theme-bg)" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Ocultar Seletor de Duração</div>
                        <div style={{ fontSize: 9, color: "var(--theme-text-muted)", marginTop: 2 }}>Recomendado para Cartórios. Remove a opção de escolha de tempo.</div>
                      </div>
                    </div>
                  </div>
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
              style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", color: "var(--theme-text-muted)", cursor: "pointer" }}
            >
              <X size={24} />
            </button>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(133,185,172,0.1)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <QrCode size={24} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--theme-text)", marginBottom: 4 }}>QR Code do Evento</h3>
              <p style={{ fontSize: 12, color: "var(--theme-text-muted)" }}>Imprima ou compartilhe para que os titulares e convidados acessem o álbum direto da unidade fixa.</p>
            </div>

            <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 12, display: "inline-block", marginBottom: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <QRCodeSVG 
                id="qr-code-svg"
                value={`${window.location.origin}/e/${qrModalEvent.slug}`}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/e/${qrModalEvent.slug}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", color: "var(--theme-text)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
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
              
              <p style={{ fontSize: 10, color: "var(--theme-text-muted)", fontStyle: "italic" }}>Dica: Imprima este QR Code e anexe à pasta de documentos do cliente.</p>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </DashboardLayout>
  );
}
