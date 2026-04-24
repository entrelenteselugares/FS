import { useState, useEffect, useRef, useCallback } from "react";

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

  const handleRespond = async (eventId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`/profissional/events/${eventId}/respond`, { status });
      fetchEvents(); // Recarrega
    } catch (err) {
      console.error("Erro ao responder convite:", err);
      alert("Erro ao processar resposta.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
      fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvents, fetchProfile]);

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

  const NAV_ITEMS = (activeTab: string, setActiveTab: (t: "agenda" | "convites" | "financeiro") => void, pendingCount: number): NavItem[] => [
    { label: "Visão Geral", onClick: () => setActiveTab("agenda"), isActive: activeTab === "agenda", icon: <LayoutDashboard size={16} /> },
    { label: "Convites Pendentes", onClick: () => setActiveTab("convites"), isActive: activeTab === "convites", icon: <MessageCircle size={16} />, badge: pendingCount },
    { label: "Financeiro", onClick: () => setActiveTab("financeiro"), isActive: activeTab === "financeiro", icon: <DollarSign size={16} /> },
    { label: "Meu Perfil", onClick: () => setIsProfileOpen(true), isActive: false, icon: <Settings size={16} /> },
  ];

  return (
    <DashboardLayout 
      title="Painel do Profissional" 
      navItems={NAV_ITEMS(activeTab, setActiveTab, pendingEvents.length)}
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
        }
      `}</style>

      <div className="mobile-padding" style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2.5rem" }}>
        
        {/* Header contextual */}
        <div style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 32, color: T.text, textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
            {activeTab === "agenda" ? "Minha Agenda" : 
             activeTab === "convites" ? "Convites Pendentes" : 
             "Fluxo Financeiro"}
          </h1>
          <div style={{ width: 40, height: 2, background: T.brand, marginTop: 12 }} />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(133,185,172,0.05)", border: "1px solid var(--brand-primary)", padding: "1.5rem 2rem", marginBottom: "3rem" }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 900, color: "var(--brand-primary)", margin: 0, textTransform: "uppercase" }}>Apoio à Rede Profissional</h4>
            <p style={{ fontSize: 10, color: "var(--theme-text-muted)", margin: "4px 0 0 0" }}>Problemas técnicos ou dúvidas sobre pagamentos?</p>
          </div>
          <a 
            href="https://wa.me/5519984470420" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: "none", background: "var(--brand-primary)", color: "#000", padding: "12px 20px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, transition: "all .3s" }}
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
              style={{ padding: "8px 16px", border: "none", background: viewTab === "lista" ? "rgba(133,185,172,0.1)" : "transparent", color: viewTab === "lista" ? T.brand : "#555", fontSize: 10, fontWeight: 900, borderRadius: 6, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}
            >
              <List size={14} /> LISTA
            </button>
            <button 
              onClick={() => setViewTab("calendario")}
              style={{ padding: "8px 16px", border: "none", background: viewTab === "calendario" ? "rgba(133,185,172,0.1)" : "transparent", color: viewTab === "calendario" ? T.brand : "#555", fontSize: 10, fontWeight: 900, borderRadius: 6, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}
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
          <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: selected ? "1fr 440px" : "1fr", gap: "2.5rem", animation: "fadeIn 0.4s ease-out" }}>
            {/* LISTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#444", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>INDEXANDO...</div>
              ) : displayEvents.length === 0 ? (
                <div style={{ padding: "6rem 0", textAlign: "center", background: "rgba(255,255,255,0.01)", border: "1px dashed #222" }}>
                  <p style={{ color: "#444", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
                    {activeTab === "agenda" 
                      ? "Você ainda não possui eventos confirmados. Aguarde ser atribuído a um evento pelo administrador." 
                      : "Você não possui novos convites de trabalho pendentes no momento."}
                  </p>
                </div>
              ) : displayEvents.map((ev) => (
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
                    background: selected?.id === ev.id ? "rgba(133,185,172,0.03)" : "var(--theme-bg-muted)"
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
            </div>

            {/* DETALHE */}
            {selected && (
              <div className="mobile-detail-panel" style={{ position: "sticky", top: 100, height: "fit-content", animation: "fadeIn 0.3s ease-out" }}>
                <EventEditPanel 
                  key={selected.id}
                  event={selected} 
                  onClose={() => setSelected(null)} 
                  onUpdated={handleUpdated} 
                />
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
    </DashboardLayout>
  );
}

// ── Perfil do Profissional ───────────────────────────────────────────

function ProfileModal({ profile, onClose, onUpdated }: { profile: ProfileData; onClose: () => void; onUpdated: (p: ProfileData) => void }) {
  const [formData, setFormData] = useState<ProfileData>({ ...profile });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch("/profissional/me", formData);
      onUpdated(data);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    const current = formData.services || [];
    const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
    setFormData({ ...formData, services: next });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s ease-out" }}>
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
            <label style={S.label}>Equipamento Principal</label>
            <div style={{ position: "relative", marginTop: 10 }}>
               <HardDrive size={14} style={{ position: "absolute", left: 14, top: 14, color: "var(--theme-text-muted)" }} />
               <input 
                style={{ ...S.input, paddingLeft: 40 }}
                value={formData.equipment || ""}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                placeholder="EX: SONY A7RIII, DJI MINI 3 PRO..."
              />
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
  const [linkStatus, setLinkStatus] = useState<SaveStatus>("idle");
  const [coverStatus, setCoverStatus] = useState<SaveStatus>("idle");
  const [coverPreview, setCoverPreview] = useState<string | null>(event.coverPhotoUrl);
  const fileRef = useRef<HTMLInputElement>(null);


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

      {/* Link público */}
      <div style={{ borderTop: "1px solid var(--theme-border)", marginTop: "1.5rem", paddingTop: "1rem" }}>
        <a
          href={`/e/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "var(--theme-text-muted)", textDecoration: "none", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}
        >
          <span>Ver página pública</span>
          <span style={{ color: "var(--brand-primary)" }}>↗</span>
        </a>
      </div>
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
