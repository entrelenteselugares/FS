import React, { useState, useEffect, useRef, useCallback } from "react";

import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { List, Calendar as CalendarIcon, TrendingUp, DollarSign, Award, ChevronLeft, ChevronRight, Settings, MessageCircle, Check, X, ShieldCheck, HardDrive, LayoutDashboard } from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";

interface EventItem {
  id: string;
  slug: string;
  nomeNoivos: string;
  dataEvento: string;
  createdAt: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
  eventHours: number | null;
  captacaoId: string | null;
  captacaoStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  edicaoId: string | null;
  edicaoStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  _count: { pedidos: number };
}

interface UnitInvite {
  id: string;
  cartorioId: string;
  tipo: string;
  status: string;
  cartorio: {
    razaoSocial: string;
    cidade: string;
  }
}

interface EventMedia {
  id: string;
  url: string;
  shortId: string;
}

interface ProfileData {
  services: string[];
  equipment: string | null;
  otherHabilities: string | null;
  stats?: {
    totalEarnings: number;
    monthEarnings: number;
    completedEvents: number;
  };
  payoutHistory?: Array<{
    id: string;
    amount: number;
    status: string;
    orderCount: number;
    payout?: {
      weekStart: string;
    }
  }>;
  cartorioProfissional?: Array<{
    tipo: string;
    cartorio: { razaoSocial: string };
  }>;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatDate(d: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(d));
  } catch {
    return "Data inválida";
  }
}

// Componente de Cronômetro de Entrega
function DeadlineTimer({ event, type }: { event: EventItem; type: "FOTO" | "VIDEO" }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isDelivered = type === "FOTO" ? !!event.lightroomUrl : !!event.driveUrl;
  const targetMinutes = type === "FOTO" ? 30 : 48 * 60; // 30min ou 48h
  
  useEffect(() => {
    if (isDelivered) return;

    const timer = setInterval(() => {
      const start = new Date(event.dataEvento).getTime();
      const target = start + (targetMinutes * 60 * 1000);
      const now = new Date().getTime();
      setTimeLeft(target - now);
    }, 1000);

    return () => clearInterval(timer);
  }, [event.dataEvento, targetMinutes, isDelivered]);

  if (isDelivered) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--brand-primary)", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
        <span style={{ fontSize: 14 }}>✓</span> {type === "FOTO" ? "Fotos OK" : "Vídeo OK"}
      </div>
    );
  }

  const isOverdue = timeLeft < 0;
  const absTime = Math.abs(timeLeft);
  const h = Math.floor(absTime / (1000 * 60 * 60));
  const m = Math.floor((absTime % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((absTime % (1000 * 60)) / 1000);

  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

  return (
    <div style={{ color: isOverdue ? "#ef4444" : "#eab308", fontSize: 10, fontWeight: 600 }}>
      {type === "FOTO" ? "📸 Foto: " : "🎬 Vídeo: "}
      {isOverdue ? `Atrasado ${timeStr}` : `Faltam ${timeStr}`}
    </div>
  );
}

const S = {
  page: { fontFamily: "'Outfit', sans-serif", background: "var(--theme-bg)", color: "var(--theme-text)", minHeight: "100vh" } as React.CSSProperties,
  input: { width: "100%", background: "transparent", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "12px 14px", fontSize: 13, color: "var(--theme-text)", outline: "none", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" } as React.CSSProperties,
  label: { fontSize: 11, color: "var(--theme-text-muted)", display: "block", marginBottom: 6, letterSpacing: "1px", textTransform: "uppercase" as const, fontWeight: 900, fontFamily: "'Outfit', sans-serif" } as React.CSSProperties,
  card: { background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", borderRadius: 0, overflow: "hidden" as const, transition: "transform 0.2s" } as React.CSSProperties,
};

export default function ProfissionalDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"lista" | "calendario">("lista");
  const [activeTab, setActiveTab] = useState<"agenda" | "convites" | "financeiro">("agenda");
  const [unitInvites, setUnitInvites] = useState<UnitInvite[]>([]);
  const [showNewServicesModal, setShowNewServicesModal] = useState(false);
  const [hasCheckedInvites, setHasCheckedInvites] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Venda Expressa State
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [expressStep, setExpressStep] = useState<1 | 2 | 3>(1);
  const [expressFormData, setExpressFormData] = useState({
    customerName: "",
    customerEmail: "",
    whatsapp: "",
    amount: 30,
    location: "",
    productType: "FOTOS" as "FOTOS" | "REELS" | "SD_CARD" | "ALBUM_IMPRESSO",
    paymentMethod: "MONEY" as "PIX" | "CARD" | "MONEY",
    internalNotes: ""
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchEvents = useCallback(() => {
    setLoading(true);
    API.get("/profissional/events")
      .then((r) => setEvents(r.data))
      .catch((err) => console.error("Erro ao buscar eventos:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchProfile = useCallback(() => {
    API.get("/profissional/me")
      .then((r) => setProfile(r.data))
      .catch((err) => console.error("Erro ao buscar perfil:", err));
  }, []);

  const fetchUnitInvites = useCallback(() => {
    API.get("/profissional/unidades/convites")
      .then((r) => setUnitInvites(r.data))
      .catch((err) => console.error("Erro ao buscar convites de unidades:", err));
  }, []);

  const handleRespond = async (eventId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`/profissional/events/${eventId}/respond`, { status });
      fetchEvents(); // Recarrega
    } catch (err) {
      console.error("Erro ao responder convite:", err);
      alert("Erro ao processar resposta.");
    }
  };

  const handleRespondUnit = async (inviteId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`/profissional/unidades/convites/${inviteId}/respond`, { status });
      fetchUnitInvites();
      fetchProfile();
    } catch (err) {
      console.error("Erro ao responder convite de unidade:", err);
      alert("Erro ao processar resposta da unidade.");
    }
  };

  const handleExpressSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...expressFormData,
        // SD_CARD e ALBUM_IMPRESSO são entrega física — usa método MONEY
        method: (expressFormData.productType === 'SD_CARD' || expressFormData.productType === 'ALBUM_IMPRESSO')
          ? 'MONEY'
          : expressFormData.paymentMethod,
        internalNotes: `[${expressFormData.productType}] ${expressFormData.internalNotes}`.trim()
      };
      const { data } = await API.post("marketplace/express-sale", payload);
      
      if (data.isDigital) {
        showNotification("Venda registrada! Redirecionando para pagamento...");
        setTimeout(() => {
          window.location.href = `/checkout/${data.orderId}`;
        }, 1500);
        return;
      }

      showNotification("Venda e Operação registradas com sucesso!");
      setIsExpressModalOpen(false);
      fetchEvents();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showNotification(error.response?.data?.error || "Erro na venda expressa.", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
      fetchProfile();
      fetchUnitInvites();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvents, fetchProfile, fetchUnitInvites]);

  // Ganhos reais do perfil
  const totalRevenue = profile?.stats?.totalEarnings || 0;
  const revenueThisMonth = profile?.stats?.monthEarnings || 0;
  const completedEventsCount = profile?.stats?.completedEvents || 0;

  const handleUpdated = useCallback((updated: Partial<EventItem>) => {
    setSelected((prev) => prev ? { ...prev, ...updated } : prev);
    setEvents((prev) =>
      prev.map((e) => (selected && e.id === selected.id ? { ...e, ...updated } : e))
    );
  }, [selected]);

  // Filtros de eventos
  const pendingEvents = events.filter(ev => {
    const isCaptacao = ev.captacaoId === user?.id && ev.captacaoStatus === "PENDING";
    const isEdicao = ev.edicaoId === user?.id && ev.edicaoStatus === "PENDING";
    return isCaptacao || isEdicao;
  });

  const acceptedEvents = events.filter(ev => {
    const isCaptacao = ev.captacaoId === user?.id && ev.captacaoStatus === "ACCEPTED";
    const isEdicao = ev.edicaoId === user?.id && ev.edicaoStatus === "ACCEPTED";
    return isCaptacao || isEdicao;
  });

  const displayEvents = activeTab === "agenda" ? acceptedEvents : pendingEvents;

  // Auto-show modal if there are new things
  useEffect(() => {
    if (!loading && !hasCheckedInvites) {
      const timer = setTimeout(() => {
        if (pendingEvents.length > 0 || unitInvites.length > 0) {
          setShowNewServicesModal(true);
        }
        setHasCheckedInvites(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, pendingEvents.length, unitInvites.length, hasCheckedInvites]);

  const NAV_ITEMS = (activeTab: string, setActiveTab: (t: "agenda" | "convites" | "financeiro") => void, pendingCount: number): NavItem[] => [
    { label: "Visão Geral", onClick: () => setActiveTab("agenda"), isActive: activeTab === "agenda", icon: <LayoutDashboard size={16} /> },
    { label: "Convites Pendentes", onClick: () => setActiveTab("convites"), isActive: activeTab === "convites", icon: <MessageCircle size={16} />, badge: pendingCount },
    { label: "Financeiro", onClick: () => setActiveTab("financeiro"), isActive: activeTab === "financeiro", icon: <DollarSign size={16} /> },
    { label: "Meu Perfil", onClick: () => setIsProfileOpen(true), isActive: false, icon: <Settings size={16} /> },
  ];

  return (
    <DashboardLayout 
      title="Painel do Profissional" 
      navItems={NAV_ITEMS(activeTab, setActiveTab, pendingEvents.length + unitInvites.length)}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lux-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .lux-card:hover { border-color: ${T.brand} !important; transform: translateY(-2px); }
        @media (max-width: 768px) {
          .mobile-hide { display: none !important; }
          .mobile-stack { flex-direction: column !important; align-items: stretch !important; gap: 1rem !important; }
          .mobile-padding { padding: 2rem 1.5rem !important; }
          .mobile-grid-1 { grid-template-columns: 1fr !important; }
          .mobile-detail-overlay {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2000 !important;
            background: var(--theme-bg) !important;
            padding: 2rem !important;
            overflow-y: auto !important;
            top: 0 !important;
          }
        }
      `}</style>

      {/* POP-UP DE NOVOS SERVIÇOS (REQUISITO 3) */}
      {showNewServicesModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 5000, 
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
          padding: "1.5rem"
        }}>
          <div style={{
            ...S.card, width: "100%", maxWidth: 450, padding: "2.5rem",
            textAlign: "center", border: `2px solid ${T.brand}`,
            animation: "fadeIn 0.4s ease-out", position: "relative"
          }}>
            <div style={{ 
              width: 60, height: 60, borderRadius: "50%", background: `${T.brand}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem", color: T.brand
            }}>
              <Award size={32} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: 1 }}>
              Novas Oportunidades!
            </h2>
            <p style={{ fontSize: 13, color: "var(--theme-text-muted)", marginBottom: "2rem" }}>
              Existem convites pendentes que aguardam sua resposta.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {unitInvites.length > 0 && (
                <div style={{ background: "rgba(133,185,172,0.1)", padding: "1rem", border: `1px solid ${T.brand}40` }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: T.brand, textTransform: "uppercase", marginBottom: 4 }}>Parcerias de Unidade</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{unitInvites.length} {unitInvites.length === 1 ? "novo convite" : "novos convites"}</div>
                </div>
              )}
              {pendingEvents.length > 0 && (
                <div style={{ background: "rgba(133,185,172,0.1)", padding: "1rem", border: `1px solid ${T.brand}40` }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: T.brand, textTransform: "uppercase", marginBottom: 4 }}>Chamados de Trabalho</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{pendingEvents.length} {pendingEvents.length === 1 ? "trabalho disponível" : "trabalhos disponíveis"}</div>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setShowNewServicesModal(false);
                setActiveTab(unitInvites.length > 0 ? "convites" : "agenda");
              }}
              style={{
                marginTop: "2.5rem", width: "100%", background: T.brand, color: "#000",
                border: "none", padding: "1rem", fontWeight: 900, fontSize: 12,
                textTransform: "uppercase", letterSpacing: 2, cursor: "pointer"
              }}
            >
              Ver Detalhes e Responder
            </button>

            <button 
              onClick={() => setShowNewServicesModal(false)}
              style={{ 
                marginTop: "1rem", background: "none", border: "none", 
                color: "var(--theme-text-muted)", fontSize: 11, cursor: "pointer"
              }}
            >
              Ignorar por enquanto
            </button>
          </div>
        </div>
      )}

      <div className="mobile-padding" style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(24px, 6vw, 64px)" }}>
        
        {/* Header contextual */}
        <div style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(24px, 5vw, 36px)", color: T.text, textTransform: "uppercase", letterSpacing: 2, margin: 0, lineHeight: 1.1, paddingTop: 8 }}>
            {activeTab === "agenda" ? "Minha Agenda" : 
             activeTab === "convites" ? "Convites Pendentes" : 
             "Fluxo Financeiro"}
          </h1>
          {profile?.cartorioProfissional && profile.cartorioProfissional.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <ShieldCheck size={14} color="var(--brand-primary)" />
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--brand-primary)", margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>
                Profissional Residente: {profile.cartorioProfissional.map(cp => cp.cartorio.razaoSocial).join(", ")}
              </p>
            </div>
          )}
          <div style={{ width: 40, height: 2, background: T.brand, marginTop: 12 }} />
        </div>

        {/* BOTÃO VENDA RÁPIDA DESTAQUE */}
        <div style={{ marginBottom: "3rem" }}>
          <button 
            onClick={() => {
              setExpressFormData({ 
                customerName: "", 
                customerEmail: "", 
                whatsapp: "",
                amount: 30, 
                location: "",
                productType: "FOTOS",
                paymentMethod: "MONEY",
                internalNotes: ""
              });
              setExpressStep(1);
              setIsExpressModalOpen(true);
            }}
            style={{ 
              width: "100%", 
              background: "linear-gradient(90deg, var(--brand-primary) 0%, #a8d5cb 100%)", 
              color: "#000", 
              border: "none", 
              padding: "24px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 16,
              boxShadow: "0 10px 30px rgba(var(--brand-primary-rgb), 0.2)",
              cursor: "pointer"
            }}
          >
            <DollarSign size={24} />
            <div style={{ textAlign: "left" }}>
               <div style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>Venda Rápida</div>
               <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase" }}>Registre a venda e crie a operação na hora</div>
            </div>
          </button>
        </div>


        
        {/* STATS CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div style={{ ...S.card, padding: "1.5rem", position: "relative" }}>
            <TrendingUp size={20} style={{ position: "absolute", top: 20, right: 20, color: "var(--brand-primary)", opacity: 0.3 }} />
            <p style={{ fontSize: 10, fontWeight: 900, color: "var(--theme-text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>Entregas Concluídas</p>
            <h3 style={{ fontSize: 28, fontWeight: 900, color: "var(--theme-text)" }}>{completedEventsCount} <span style={{ fontSize: 13, color: "var(--theme-text-muted)", fontWeight: 400 }}>Eventos</span></h3>
          </div>
          
          <div style={{ ...S.card, padding: "1.5rem", position: "relative" }}>
            <DollarSign size={20} style={{ position: "absolute", top: 20, right: 20, color: "var(--brand-primary)", opacity: 0.3 }} />
            <p style={{ fontSize: 10, fontWeight: 900, color: "var(--theme-text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>Receita Estimada</p>
            <h3 style={{ fontSize: 28, fontWeight: 900, color: "var(--brand-primary)" }}>R$ {totalRevenue.toLocaleString()}</h3>
          </div>

          <div style={{ ...S.card, padding: "1.5rem", position: "relative" }}>
            <Award size={20} style={{ position: "absolute", top: 20, right: 20, color: "var(--brand-primary)", opacity: 0.3 }} />
            <p style={{ fontSize: 10, fontWeight: 900, color: "var(--theme-text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>Ganhos do Mês</p>
            <h3 style={{ fontSize: 28, fontWeight: 900, color: "var(--theme-text)" }}>R$ {revenueThisMonth.toLocaleString()}</h3>
          </div>
        </div>

        {/* SUB HEADER SUPPORT */}
        <div className="mobile-stack" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(133,185,172,0.05)", border: "1px solid var(--brand-primary)", padding: "1.5rem 2rem", marginBottom: "3rem" }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--brand-primary)", margin: 0, textTransform: "uppercase" }}>Apoio à Rede Profissional</h4>
            <p style={{ fontSize: 10, color: "var(--theme-text-muted)", margin: "4px 0 0 0" }}>Problemas técnicos ou dúvidas sobre pagamentos?</p>
          </div>
          <a 
            href="https://wa.me/5519984470420" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: "none", background: "var(--brand-primary)", color: "#000", padding: "12px 24px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, transition: "all .3s" }}
          >
            <MessageCircle size={14} /> Falar com Matriz
          </a>
        </div>

        <div className="mobile-stack" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "2rem" }}>
            <p style={{ fontSize: 11, color: T.text3, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>
              Visualização:
            </p>
          </div>
          
          <div style={{ display: "flex", background: "rgba(255,255,255,0.02)", padding: 4, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
            <button 
              onClick={() => setViewTab("lista")}
              style={{ padding: "8px 16px", border: "none", background: viewTab === "lista" ? "rgba(133,185,172,0.1)" : "transparent", color: viewTab === "lista" ? T.brand : T.text3, fontSize: 10, fontWeight: 900, borderRadius: 6, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}
            >
              <List size={14} /> LISTA
            </button>
            <button 
              onClick={() => setViewTab("calendario")}
              style={{ padding: "8px 16px", border: "none", background: viewTab === "calendario" ? "rgba(133,185,172,0.1)" : "transparent", color: viewTab === "calendario" ? T.brand : T.text3, fontSize: 10, fontWeight: 900, borderRadius: 6, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}
            >
               <CalendarIcon size={14} /> CALENDÁRIO
            </button>
          </div>
        </div>

        {activeTab === "financeiro" ? (
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div style={{ ...S.card, padding: "2rem" }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: 1 }}>Histórico de Vendas e Comissões</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {profile?.payoutHistory?.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderBottom: "1px solid var(--theme-border)", background: "rgba(255,255,255,0.01)" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>Repasse {p.payout?.weekStart ? formatDate(p.payout.weekStart) : 'Mensal'}</p>
                      <p style={{ fontSize: 11, color: "var(--theme-text-muted)", margin: "4px 0 0 0" }}>{p.status === 'PAID' ? 'PAGO' : 'PROCESSANDO'} · {p.orderCount} vendas</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>Valor Recebido</p>
                      <p style={{ fontSize: 18, fontWeight: 900, color: "var(--brand-primary)", margin: 0 }}>R$ {Number(p.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(!profile || !profile.payoutHistory?.length) && (
                  <div style={{ padding: "4rem", textAlign: "center", color: "var(--theme-text-muted)" }}>
                    Nenhum repasse liquidado encontrado. Continue produzindo!
                  </div>
                )}
              </div>
              <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: "2rem", fontStyle: "italic" }}>
                * Os valores acima referem-se a repasses liquidados via PIX. Ganhos de eventos em andamento aparecerão após a conciliação semanal.
              </p>
            </div>
          </div>
        ) : viewTab === "lista" ? (
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            {/* LISTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: T.text3, fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>INDEXANDO...</div>
              ) : (displayEvents.length === 0 && unitInvites.length === 0) ? (
                <div style={{ padding: "6rem 0", textAlign: "center", background: "rgba(255,255,255,0.01)", border: `1px dashed ${T.border}` }}>
                  <p style={{ color: T.text2, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
                    {activeTab === "agenda" 
                      ? "Você ainda não possui eventos confirmados. Aguarde ser atribuído a um evento pelo administrador." 
                      : "Você não possui novos convites de trabalho ou parcerias pendentes no momento."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Convites de Unidade Fixa */}
                  {activeTab === "convites" && unitInvites.map(ui => (
                    <div 
                      key={ui.id} 
                      className="lux-card"
                      style={{ 
                        ...S.card, 
                        padding: "2rem", 
                        background: "linear-gradient(135deg, rgba(133,185,172,0.05) 0%, rgba(133,185,172,0) 100%)",
                        border: "1px solid var(--brand-primary)",
                        marginBottom: 14,
                        animation: "fadeIn 0.3s ease-out"
                      }}
                    >
                      <div className="mobile-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <ShieldCheck size={16} color="var(--brand-primary)" />
                            <span style={{ fontSize: 9, fontWeight: 900, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: 2 }}>Convite de Parceria Fixa</span>
                          </div>
                          <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--theme-text)", margin: 0, textTransform: "uppercase" }}>{ui.cartorio.razaoSocial}</h3>
                          <p style={{ fontSize: 11, color: "var(--theme-text-muted)", marginTop: 4 }}>Unidade em {ui.cartorio.cidade} · Tipo: {ui.tipo}</p>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button 
                              onClick={() => handleRespondUnit(ui.id, "REJECTED")}
                              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                            >
                              <X size={14} /> Recusar
                            </button>
                            <button 
                              onClick={() => handleRespondUnit(ui.id, "ACCEPTED")}
                              style={{ background: "var(--brand-primary)", color: "#000", border: "none", padding: "12px 24px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                            >
                              <Check size={14} /> ACEITAR PARCERIA
                            </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {displayEvents.map((ev) => (
                    <div 
                      key={ev.id} 
                      onClick={() => activeTab === "agenda" && setSelected(selected?.id === ev.id ? null : ev)}
                      className="lux-card"
                      style={{ 
                        ...S.card, 
                        padding: "1.25rem", 
                        display: "flex", 
                        gap: "1.5rem", 
                        cursor: activeTab === "agenda" ? "pointer" : "default",
                        borderColor: selected?.id === ev.id ? "var(--brand-primary)" : "var(--theme-border)",
                        background: selected?.id === ev.id ? "rgba(133,185,172,0.03)" : "var(--theme-bg-muted)",
                        marginBottom: 14
                      }}
                    >
                  <div style={{ width: 84, height: 84, background: "#111", borderRadius: 0, flexShrink: 0, overflow: "hidden", border: "1px solid var(--theme-border)" }}>
                    {ev.coverPhotoUrl ? <img src={ev.coverPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--theme-text)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase", letterSpacing: -0.5 }}>{ev.nomeNoivos}</h3>
                      </div>
                      
                      {activeTab === "convites" && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRespond(ev.id, "REJECTED"); }}
                            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "8px 12px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <X size={12} /> Recusar
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRespond(ev.id, "ACCEPTED"); }}
                            style={{ background: "var(--brand-primary)", color: "#000", border: "none", padding: "8px 12px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Check size={12} /> Aceitar
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mobile-stack" style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                       {(ev.captacaoId === user?.id) && <div style={{ fontSize: 9, background: "rgba(133,185,172,0.1)", color: "var(--brand-primary)", padding: "4px 8px", fontWeight: 700, textTransform: "uppercase", border: "1px solid var(--brand-primary)" }}>Profissional da Rede</div>}
                       {(ev.edicaoId === user?.id) && <div style={{ fontSize: 9, background: "rgba(133,185,172,0.1)", color: "var(--brand-primary)", padding: "4px 8px", fontWeight: 700, textTransform: "uppercase", border: "1px solid var(--brand-primary)" }}>Profissional da Rede</div>}
                      
                      <div className="mobile-hide" style={{ flex: 1 }} />
                      
                      {activeTab === "agenda" && (
                        <>
                          {ev.temFoto && <DeadlineTimer event={ev} type="FOTO" />}
                          {ev.temVideo && <DeadlineTimer event={ev} type="VIDEO" />}
                          <div style={{ textAlign: "right" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                               {ev._count.pedidos > 5 && <span style={{ fontSize: 12 }}>🔥</span>}
                               <p style={{ fontSize: 18, fontWeight: 900, color: ev._count.pedidos > 0 ? "var(--brand-primary)" : "var(--theme-text-muted)", letterSpacing: -1, margin: 0 }}>{ev._count?.pedidos}</p>
                             </div>
                             <p style={{ fontSize: 8, color: "var(--theme-text-muted)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Vendas</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                ))}
                </>
              )}
            </div>

            {/* MODAL DE DETALHES DO EVENTO */}
            {selected && (
              <div 
                onClick={() => setSelected(null)}
                style={{ 
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                  background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", 
                  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "20px"
                }}
              >
                <div 
                  onClick={e => e.stopPropagation()}
                  style={{ 
                    width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto",
                    background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", borderRadius: 0,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    animation: "zoomIn 0.3s ease-out"
                  }}
                >
                  <EventEditPanel 
                    key={selected.id}
                    event={selected} 
                    onClose={() => setSelected(null)} 
                    onUpdated={handleUpdated} 
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
             <CalendarView events={displayEvents} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onSelect={(ev) => { if(activeTab === "agenda"){ setSelected(ev); setViewTab("lista"); } }} />
          </div>
        )}
      </div>

      {/* MODAL DE PERFIL */}
      {isProfileOpen && profile && (
        <ProfileModal 
          profile={profile} 
          onClose={() => setIsProfileOpen(false)} 
          onUpdated={(p) => { setProfile(p); setIsProfileOpen(false); }}
        />
      )}
      {/* MODAL VENDA EXPRESSA — WIZARD 3 ETAPAS */}
      {isExpressModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 6000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: 440, background: "var(--theme-bg)", border: "1px solid var(--theme-border)", position: "relative" }}>

            {/* HEADER */}
            <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid var(--theme-border)" }}>
              <button onClick={() => { setIsExpressModalOpen(false); setExpressStep(1); }} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--theme-text-muted)", cursor: "pointer" }}><X size={20} /></button>
              <div style={{ fontSize: 9, fontWeight: 900, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 4 }}>Venda Rápida · Etapa {expressStep} de 3</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                {expressStep === 1 ? "Quem é o cliente?" : expressStep === 2 ? "O que foi vendido?" : "Como foi pago?"}
              </h2>
              {/* BARRA DE PROGRESSO */}
              <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                {[1,2,3].map(s => (
                  <div key={s} style={{ flex: 1, height: 3, background: s <= expressStep ? "var(--brand-primary)" : "var(--theme-border)", transition: "background 0.3s" }} />
                ))}
              </div>
            </div>

            {/* BODY */}
            <div style={{ padding: "1.5rem" }}>

              {/* ETAPA 1: CLIENTE */}
              {expressStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 6 }}>E-mail do Cliente *</label>
                    <input
                      type="email"
                      autoFocus
                      value={expressFormData.customerEmail}
                      onChange={e => setExpressFormData(p => ({ ...p, customerEmail: e.target.value }))}
                      style={{ width: "100%", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontSize: 14, color: "var(--theme-text)", outline: "none", boxSizing: "border-box" }}
                      placeholder="cliente@email.com"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 6 }}>Nome</label>
                      <input
                        type="text"
                        value={expressFormData.customerName}
                        onChange={e => setExpressFormData(p => ({ ...p, customerName: e.target.value }))}
                        style={{ width: "100%", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontSize: 14, color: "var(--theme-text)", outline: "none", boxSizing: "border-box" }}
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 6 }}>WhatsApp</label>
                      <input
                        type="tel"
                        value={expressFormData.whatsapp}
                        onChange={e => setExpressFormData(p => ({ ...p, whatsapp: e.target.value }))}
                        style={{ width: "100%", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontSize: 14, color: "var(--theme-text)", outline: "none", boxSizing: "border-box" }}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { if (!expressFormData.customerEmail) { showNotification("E-mail do cliente é obrigatório.", "error"); return; } setExpressStep(2); }}
                    style={{ width: "100%", background: "var(--brand-primary)", color: "#000", border: "none", padding: "16px", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, cursor: "pointer", marginTop: 4 }}
                  >Próximo →</button>
                </div>
              )}

              {/* ETAPA 2: PRODUTO */}
              {expressStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 8 }}>Tipo de Produto *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {([
                        { key: "FOTOS", label: "📷 Fotos Digitais", desc: "Entrega via link" },
                        { key: "REELS", label: "🎬 Reels / Vídeo", desc: "Entrega via link" },
                        { key: "SD_CARD", label: "💾 Cartão SD", desc: "Entrega física única" },
                        { key: "ALBUM_IMPRESSO", label: "📚 Álbum Impresso", desc: "Entrega física" },
                      ] as { key: typeof expressFormData.productType; label: string; desc: string }[]).map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setExpressFormData(p => ({ ...p, productType: opt.key }))}
                          style={{ padding: "12px 8px", border: `2px solid ${expressFormData.productType === opt.key ? "var(--brand-primary)" : "var(--theme-border)"}`, background: expressFormData.productType === opt.key ? "rgba(133,185,172,0.1)" : "var(--theme-bg-muted)", color: "var(--theme-text)", cursor: "pointer", textAlign: "center" }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 900 }}>{opt.label}</div>
                          <div style={{ fontSize: 9, color: "var(--theme-text-muted)", marginTop: 2 }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                    {expressFormData.productType === "SD_CARD" && (
                      <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.3)", fontSize: 10, color: "#f59e0b" }}>
                        ⚠️ Entrega física — o cliente fica com todo o material. Nenhum link de acesso digital será gerado.
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 6 }}>Valor (R$) *</label>
                      <input
                        type="number"
                        min="1"
                        value={expressFormData.amount}
                        onChange={e => setExpressFormData(p => ({ ...p, amount: Number(e.target.value) }))}
                        style={{ width: "100%", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontSize: 18, fontWeight: 900, color: "var(--brand-primary)", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 6 }}>Local</label>
                      <input
                        type="text"
                        value={expressFormData.location}
                        onChange={e => setExpressFormData(p => ({ ...p, location: e.target.value }))}
                        style={{ width: "100%", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontSize: 14, color: "var(--theme-text)", outline: "none", boxSizing: "border-box" }}
                        placeholder="Taquaral / Evento"
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setExpressStep(1)} style={{ flex: 1, background: "var(--theme-bg-muted)", color: "var(--theme-text-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontWeight: 900, fontSize: 11, textTransform: "uppercase", cursor: "pointer" }}>← Voltar</button>
                    <button onClick={() => { if (!expressFormData.amount || expressFormData.amount <= 0) { showNotification("Informe um valor válido.", "error"); return; } setExpressStep(3); }} style={{ flex: 2, background: "var(--brand-primary)", color: "#000", border: "none", padding: "14px", fontWeight: 900, fontSize: 11, textTransform: "uppercase", cursor: "pointer" }}>Próximo →</button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: PAGAMENTO */}
              {expressStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* RESUMO */}
                  <div style={{ padding: "12px", background: "rgba(133,185,172,0.06)", border: "1px solid var(--brand-primary)30", fontSize: 12 }}>
                    <div style={{ fontWeight: 900, color: "var(--theme-text)" }}>{expressFormData.customerEmail}</div>
                    <div style={{ color: "var(--theme-text-muted)", fontSize: 10, marginTop: 2 }}>
                      {expressFormData.productType === "FOTOS" ? "Fotos Digitais" : expressFormData.productType === "REELS" ? "Reels / Vídeo" : expressFormData.productType === "SD_CARD" ? "Cartão SD (Físico)" : "Álbum Impresso"}
                      {" · "}
                      <strong style={{ color: "var(--brand-primary)" }}>R$ {expressFormData.amount}</strong>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 8 }}>Método de Pagamento *</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["MONEY", "PIX", "CARD"] as const).map(m => (
                        <button key={m} type="button" onClick={() => setExpressFormData(p => ({ ...p, paymentMethod: m }))}
                          style={{ flex: 1, padding: "14px 8px", border: `2px solid ${expressFormData.paymentMethod === m ? "var(--brand-primary)" : "var(--theme-border)"}`, background: expressFormData.paymentMethod === m ? "var(--brand-primary)" : "var(--theme-bg-muted)", color: expressFormData.paymentMethod === m ? "#000" : "var(--theme-text-muted)", fontWeight: 900, fontSize: 10, textTransform: "uppercase", cursor: "pointer" }}
                        >{m === "MONEY" ? "💵 Dinheiro" : m === "PIX" ? "⚡ PIX" : "💳 Cartão"}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, display: "block", marginBottom: 6 }}>Notas Internas (oculto ao cliente)</label>
                    <input
                      type="text"
                      value={expressFormData.internalNotes}
                      onChange={e => setExpressFormData(p => ({ ...p, internalNotes: e.target.value }))}
                      style={{ width: "100%", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", padding: "12px", fontSize: 13, color: "var(--theme-text)", outline: "none", boxSizing: "border-box" }}
                      placeholder="Ex: VIP, indicação do Cartório X..."
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setExpressStep(2)} style={{ flex: 1, background: "var(--theme-bg-muted)", color: "var(--theme-text-muted)", border: "1px solid var(--theme-border)", padding: "14px", fontWeight: 900, fontSize: 11, textTransform: "uppercase", cursor: "pointer" }}>← Voltar</button>
                    <button
                      onClick={handleExpressSaleSubmit as unknown as React.MouseEventHandler}
                      disabled={loading}
                      style={{ flex: 2, background: "var(--brand-primary)", color: "#000", border: "none", padding: "14px", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, cursor: loading ? "not-allowed" : "pointer" }}
                    >{loading ? "PROCESSANDO..." : "✓ CONFIRMAR VENDA"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICAÇÃO FLOATING */}
      {notification && (
        <div style={{ 
          position: "fixed", bottom: 32, right: 32, zIndex: 10000, 
          background: "var(--theme-bg-muted)", border: `1px solid ${notification.type === 'success' ? T.brand : '#ef4444'}`,
          padding: "16px 24px", animation: "fadeIn 0.5s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: notification.type === 'success' ? T.brand : '#ef4444' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: 1 }}>{notification.message}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ── Perfil do Profissional ───────────────────────────────────────────

const EQUIPMENT_CATEGORIES = {
  "Câmeras": ["Sony A7III/A7IV", "Sony A7R Series", "Canon R5/R6", "Nikon Z6/Z7", "Lumix GH5/GH6", "DJI Mavic/Mini"],
  "Lentes": ["24-70mm f/2.8", "70-200mm f/2.8", "35mm Prime", "50mm Prime", "85mm Prime", "16-35mm Wide"],
  "Acessórios": ["Flash Externo", "Gimbal (Ronin/Zhiyun)", "Tripé/Monopé", "Iluminação LED", "Drone"]
};

function ProfileModal({ profile, onClose, onUpdated }: { profile: ProfileData; onClose: () => void; onUpdated: (p: ProfileData) => void }) {
  const [formData, setFormData] = useState<ProfileData>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [otherEquip, setOtherEquip] = useState(() => {
    if (profile.equipment) {
      const allStandard = Object.values(EQUIPMENT_CATEGORIES).flat();
      const items = profile.equipment.split(", ").filter(i => i.trim());
      const others = items.filter(i => !allStandard.includes(i));
      return others.join(", ");
    }
    return "";
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Merge standard equipment + others
      const { data } = await API.patch("/profissional/me", formData);
      onUpdated(data);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (item: string) => {
    const current = formData.equipment ? formData.equipment.split(", ").filter(i => i.trim()) : [];
    const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    setFormData({ ...formData, equipment: next.join(", ") });
  };

  const toggleSkill = (skill: string) => {
    const current = formData.services || [];
    const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
    setFormData({ ...formData, services: next });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", zIndex: 1000, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s ease-out" }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 500, background: "var(--theme-bg)", height: "100%", borderLeft: "1px solid var(--theme-border)", padding: "4rem 3rem", overflowY: "auto", position: "relative" }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 30, right: 30, background: "none", border: "none", color: "var(--theme-text-muted)", fontSize: 24, cursor: "pointer" }}>×</button>
        
        <div style={{ marginBottom: "3rem" }}>
          <ShieldCheck size={40} style={{ color: "var(--brand-primary)", marginBottom: 15 }} />
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: -1 }}>Meu Perfil Técnico</h2>
          <p style={{ fontSize: 11, color: "var(--theme-text-muted)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>Foto Segundo · Rede Coletiva</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <section>
            <label style={S.label}>Habilidades Ativas</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 15 }}>
              {["FOTO", "VÍDEO", "EDIÇÃO"].map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{ 
                    padding: "10px 20px", 
                    fontSize: 10, 
                    fontWeight: 900, 
                    background: formData.services?.includes(skill) ? "var(--brand-primary)" : "rgba(255,255,255,0.02)",
                    color: formData.services?.includes(skill) ? "#000" : "#555",
                    border: "1px solid",
                    borderColor: formData.services?.includes(skill) ? "var(--brand-primary)" : "#1a1a1a",
                    cursor: "pointer",
                    transition: "all .2s"
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label style={S.label}>Meu Equipamento</label>
            <div style={{ marginTop: 15, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {Object.entries(EQUIPMENT_CATEGORIES).map(([cat, items]) => (
                <div key={cat}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{cat}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {items.map(item => {
                      const isSelected = formData.equipment?.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleEquipment(item)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            fontSize: 10,
                            background: isSelected ? "rgba(133,185,172,0.1)" : "transparent",
                            border: `1px solid ${isSelected ? "var(--brand-primary)" : "#1a1a1a"}`,
                            color: isSelected ? "var(--brand-primary)" : "var(--theme-text-muted)",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all .2s"
                          }}
                        >
                          <div style={{ width: 12, height: 12, border: "1px solid", borderColor: isSelected ? "var(--brand-primary)" : "#444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isSelected && <Check size={8} />}
                          </div>
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <p style={{ fontSize: 9, fontWeight: 900, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Outros Equipamentos</p>
                <div style={{ position: "relative" }}>
                  <HardDrive size={14} style={{ position: "absolute", left: 14, top: 14, color: "var(--theme-text-muted)" }} />
                  <input 
                    style={{ ...S.input, paddingLeft: 48 }}
                    value={otherEquip}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOtherEquip(val);
                      // Update main equipment string by merging standard ones and this new 'others'
                      const allStandard = Object.values(EQUIPMENT_CATEGORIES).flat();
                      const currentSelected = formData.equipment ? formData.equipment.split(", ").filter(i => allStandard.includes(i)) : [];
                      setFormData({ ...formData, equipment: [...currentSelected, val].filter(i => i.trim()).join(", ") });
                    }}
                    placeholder="DIGITE OUTROS ITENS SEPARADOS POR VÍRGULA..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <label style={S.label}>Habilidades Complementares</label>
            <textarea 
              style={{ ...S.input, minHeight: 100, resize: "none", marginTop: 10 }}
              value={formData.otherHabilities || ""}
              onChange={(e) => setFormData({ ...formData, otherHabilities: e.target.value })}
              placeholder="EX: COLOR GRADING, DRONE PILOT, AFTER EFFECTS..."
            />
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", padding: "20px", background: "var(--brand-primary)", color: "#000", border: "none", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, cursor: saving ? "not-allowed" : "pointer", marginTop: "1rem" }}
          >
            {saving ? "SALVANDO..." : "ATUALIZAR PERFIL"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Painel de edição — extraído para componente separado ──────────────

function EventEditPanel({ event, onUpdated, onClose }: {
  event: EventItem;
  onUpdated: (u: Partial<EventItem>) => void;
  onClose: () => void;
}) {
  const [lrUrl, setLrUrl] = useState(event.lightroomUrl ?? "");
  const [drUrl, setDrUrl] = useState(event.driveUrl ?? "");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [marketplaceMedias, setMarketplaceMedias] = useState<EventMedia[]>([]);

  const isMarketplace = (event as EventItem & { type?: string }).type === "PHOTO_MARKETPLACE";

  useEffect(() => {
    if (isMarketplace) {
      API.get(`/marketplace/events/${event.id}/media`)
        .then(res => setMarketplaceMedias(res.data))
        .catch(err => console.error("Erro ao buscar mídias marketplace:", err));
    }
  }, [event.id, isMarketplace]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    let successCount = 0;

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        
        await API.post(`/marketplace/events/${event.id}/media`, {
          imageBase64: base64,
          mimeType: file.type
        });
        successCount++;
      }

      // Recarrega lista
      const res = await API.get(`/marketplace/events/${event.id}/media`);
      setMarketplaceMedias(res.data);
      alert(`${successCount} fotos enviadas com sucesso!`);
    } catch (err) {
      console.error("Erro no upload marketplace:", err);
      alert("Erro ao enviar algumas fotos. Verifique sua conexão.");
    } finally {
      setUploadingMedia(false);
    }
  };
  const [linkStatus, setLinkStatus] = useState<SaveStatus>("idle");
  const [coverStatus, setCoverStatus] = useState<SaveStatus>("idle");
  const [coverPreview, setCoverPreview] = useState<string | null>(event.coverPhotoUrl);
  const [saleStatus, setSaleStatus] = useState<SaveStatus>("idle");
  const [manualSale, setManualSale] = useState({ amount: "", email: "", type: "SD_CARD" });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleManualSale = async () => {
    if (!manualSale.amount) return;
    setSaleStatus("saving");
    try {
      await API.post(`/profissional/events/${event.id}/manual-sale`, {
        amount: Number(manualSale.amount),
        customerEmail: manualSale.email || null,
        manualType: manualSale.type
      });
      setSaleStatus("saved");
      setManualSale({ amount: "", email: "", type: "SD_CARD" });
      setTimeout(() => setSaleStatus("idle"), 3000);
      onUpdated({ _count: { pedidos: (event._count?.pedidos || 0) + 1 } });
    } catch (err) {
      console.error("handleManualSale:", err);
      setSaleStatus("error");
      setTimeout(() => setSaleStatus("idle"), 3000);
    }
  };


  const saveLinks = async () => {
    setLinkStatus("saving");
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/links`, {
        lightroomUrl: lrUrl || null,
        driveUrl: drUrl || null,
      });
      onUpdated({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl });
      setLinkStatus("saved");
      setTimeout(() => setLinkStatus("idle"), 2000);
    } catch {
      setLinkStatus("error");
      setTimeout(() => setLinkStatus("idle"), 3000);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato via FileReader
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setCoverPreview(base64);

      // Inicia upload via base64 (Stateless / Vercel Ready)
      setCoverStatus("saving");
      try {
        const { data } = await API.patch(`/profissional/events/${event.id}/cover`, {
          imageBase64: base64,
          mimeType: file.type
        });
        onUpdated({ coverPhotoUrl: data.coverPhotoUrl });
        setCoverStatus("saved");
        setTimeout(() => setCoverStatus("idle"), 2500);
      } catch {
        setCoverStatus("error");
        setTimeout(() => setCoverStatus("idle"), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ ...S.card, position: "sticky", top: "6rem", height: "fit-content", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6, fontWeight: 900 }}>Gestão de Evento</p>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, color: "var(--theme-text)", margin: 0, fontWeight: 900, textTransform: "uppercase", letterSpacing: -0.5 }}>{event.nomeNoivos}</h2>
          <p style={{ fontSize: 11, color: "var(--theme-text-muted)", marginTop: 4, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>{formatDate(event.dataEvento)}</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--theme-text-muted)", fontSize: 28, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Upload de Capa */}
      <section style={{ marginBottom: "2.5rem" }}>
        <label style={S.label}>Foto de Capa</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ width: "100%", aspectRatio: "16/9", background: "var(--theme-bg)", borderRadius: 0, border: "1px dashed var(--theme-border)", cursor: "pointer", overflow: "hidden", position: "relative" }}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span style={{ fontSize: 12, color: "var(--theme-text-muted)" }}>Enviar Capa</span>
              <span style={{ fontSize: 10, color: "var(--theme-text-muted)", opacity: 0.5 }}>JPG, PNG, WebP · Máx. 10MB</span>
            </div>
          )}
          {coverStatus === "saving" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spin" style={{ width: 24, height: 24, border: "2px solid var(--brand-primary)", borderTopColor: "transparent", borderRadius: "50%" }} />
            </div>
          )}
          {coverStatus === "saved" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "var(--brand-primary)", fontSize: 13 }}>✓ Capa atualizada</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleCoverChange} />
      </section>

      {/* Links de Entrega */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={S.label}>📷 Adobe Portfolio (Galeria)</label>
          <input
            style={S.input}
            type="url"
            placeholder="https://fotosegundo.myportfolio.com/nome-casal"
            value={lrUrl}
            onChange={(e) => setLrUrl(e.target.value)}
          />
          <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: 4 }}>Link da galeria do evento no Adobe Portfolio</p>
        </div>
        <div>
          <label style={S.label}>🎬 Google Drive (Vídeo / Brutos)</label>
          <input
            style={S.input}
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={drUrl}
            onChange={(e) => setDrUrl(e.target.value)}
          />
          <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: 4 }}>Link da pasta compartilhada no Google Drive</p>
        </div>

        <button
          onClick={saveLinks}
          disabled={linkStatus === "saving"}
          style={{
            width: "100%", padding: "18px", borderRadius: 0, border: "none", fontSize: 12, fontWeight: 800,
            cursor: linkStatus === "saving" ? "not-allowed" : "pointer", transition: "all .3s",
            background: linkStatus === "saved" ? "var(--brand-primary)" : linkStatus === "error" ? "#7f1d1d" : "var(--brand-primary)",
            color: "var(--theme-text-on-brand)",
            opacity: linkStatus === "saving" ? 0.7 : 1,
            textTransform: "uppercase", letterSpacing: 2
          }}
        >
          {linkStatus === "saving" ? "SINCRONIZANDO..." : linkStatus === "saved" ? "✓ SINCRONIZADO" : linkStatus === "error" ? "ERRO — REPETIR" : "SALVAR ALTERAÇÕES"}
        </button>
      </section>

      {/* Venda Manual (SD Card / Álbum) */}
      <section style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--theme-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(133,185,172,0.1)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={14} />
          </div>
          <label style={{ ...S.label, marginBottom: 0 }}>Registrar Venda Física (Cartão SD / Álbum)</label>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(133,185,172,0.03)", padding: "1.5rem", border: "1px solid rgba(133,185,172,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ ...S.label, fontSize: 8 }}>Valor Recebido (R$)</label>
              <input 
                style={S.input} 
                type="number" 
                placeholder="0,00"
                value={manualSale.amount}
                onChange={e => setManualSale({...manualSale, amount: e.target.value})}
              />
            </div>
            <div>
              <label style={{ ...S.label, fontSize: 8 }}>Tipo de Venda</label>
              <select 
                style={S.input}
                value={manualSale.type}
                onChange={e => setManualSale({...manualSale, type: e.target.value})}
              >
                <option value="SD_CARD">CARTÃO SD</option>
                <option value="ALBUM">ÁLBUM IMPRESSO</option>
                <option value="CLIQUE_AVULSO">FOTO AVULSA / CLIQUE</option>
                <option value="OTHER">OUTROS</option>
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ ...S.label, fontSize: 8 }}>E-mail do Cliente (Opcional)</label>
            <input 
              style={S.input} 
              type="email" 
              placeholder="cliente@email.com"
              value={manualSale.email}
              onChange={e => setManualSale({...manualSale, email: e.target.value})}
            />
          </div>

          <button
            onClick={handleManualSale}
            disabled={!manualSale.amount || Number(manualSale.amount) <= 0 || saleStatus === "saving"}
            style={{
              width: "100%", padding: "14px", borderRadius: 0, border: "none", fontSize: 10, fontWeight: 900,
              cursor: "pointer", transition: "all .3s",
              background: saleStatus === "saved" ? "var(--brand-primary)" : "var(--brand-primary)",
              color: "#000",
              opacity: (saleStatus === "saving" || !manualSale.amount) ? 0.6 : 1,
              textTransform: "uppercase", letterSpacing: 1.5
            }}
          >
            {saleStatus === "saving" ? "REGISTRANDO..." : saleStatus === "saved" ? "✓ VENDA REGISTRADA" : "REGISTRAR VENDA MANUAL"}
          </button>
          
          <p style={{ fontSize: 9, color: "var(--theme-text-muted)", textAlign: "center", lineHeight: 1.4 }}>
            * Esta venda será contabilizada no repasse semanal. Certifique-se de que o valor foi recebido fisicamente.
          </p>
        </div>
      </section>

      {isMarketplace && (
        <section style={{ marginTop: "2.5rem", borderTop: `1px solid ${T.border}`, paddingTop: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(133,185,172,0.1)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HardDrive size={14} />
            </div>
            <label style={{ ...S.label, marginBottom: 0 }}>Gerenciar Galeria Marketplace</label>
          </div>
          <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginBottom: 20 }}>Suba as fotos individuais para que o cliente possa selecioná-las e comprar pelo site.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10, marginBottom: 20 }}>
            {marketplaceMedias.map(m => (
              <div key={m.id} style={{ aspectRatio: "1/1", border: `1px solid ${T.border}`, position: "relative", background: "#000" }}>
                 <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                 <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.8)", color: "white", fontSize: 8, textAlign: "center", padding: "2px 0", fontWeight: 700 }}>#{m.shortId}</div>
              </div>
            ))}
            
            <label style={{ 
              aspectRatio: "1/1", border: `1px dashed ${T.brand}`, 
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: uploadingMedia ? "not-allowed" : "pointer", color: T.brand, fontSize: 10, fontWeight: 900,
              background: "rgba(133,185,172,0.05)"
            }}>
              {uploadingMedia ? "..." : "+ FOTOS"}
              <input type="file" multiple accept="image/*" hidden onChange={handleMediaUpload} disabled={uploadingMedia} />
            </label>
          </div>
          
          <div style={{ background: "rgba(133,185,172,0.05)", padding: "12px 16px", border: `1px solid ${T.brand}40`, fontSize: 10, color: T.brand, fontWeight: 700, textAlign: "center", letterSpacing: 1 }}>
             LINK DO CLIENTE: {window.location.origin}/e/{event.slug}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Componentes Internos ─────────────────────────────────────────

function CalendarView({ events, currentMonth, setCurrentMonth, onSelect }: { events: EventItem[], currentMonth: Date, setCurrentMonth: (d: Date) => void, onSelect: (ev: EventItem) => void }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const getEventsOnDay = (d: number) => {
    return events.filter(ev => {
      const date = new Date(ev.dataEvento);
      return date.getDate() === d && date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div style={{ ...S.card, padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: 2 }}>{monthNames[month]} <span style={{ fontWeight: 300, color: "var(--theme-text-muted)" }}>{year}</span></h3>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={prevMonth} style={{ padding: 8, background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", color: "var(--theme-text)", cursor: "pointer" }}><ChevronLeft size={16} /></button>
          <button onClick={nextMonth} style={{ padding: 8, background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", color: "var(--theme-text)", cursor: "pointer" }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(d => (
          <div key={d} style={{ textAlign: "center", padding: "12px", borderBottom: "1px solid #1a1a1a", fontSize: 10, fontWeight: 900, color: "#444", textTransform: "uppercase" }}>{d}</div>
        ))}
        {days.map((d, i) => {
          const dayEvents = d ? getEventsOnDay(d) : [];
          return (
            <div key={i} style={{ minHeight: 100, padding: 8, border: "0.5px solid #1a1a1a", position: "relative", background: (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) ? "rgba(133,185,172,0.05)" : "transparent" }}>
              {d && (
                <>
                  <span style={{ fontSize: 11, fontWeight: 900, color: (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) ? "var(--brand-primary)" : "#333", position: "absolute", top: 8, left: 10 }}>{d}</span>
                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        onClick={() => onSelect(ev)}
                        style={{ padding: "4px 8px", background: "var(--brand-primary)", color: "#000", fontSize: 9, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textTransform: "uppercase", borderRadius: 2 }}
                      >
                        {ev.nomeNoivos}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
