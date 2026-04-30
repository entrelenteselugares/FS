import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import {
  List, Calendar as CalendarIcon, DollarSign, MessageCircle,
  Settings, ShieldCheck, LayoutDashboard, Briefcase, ArrowRight, Users,
} from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";
import {
  AgendaTab, FinanceTab, NetworkTab, ServicesTab,
  EventEditPanel, ExpressSaleModal, ProfileModal,
  type EventItem, type UnitInvite, type ServiceCatalog, type ProfileData, type Partner,
} from "../components/profissional";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "agenda" | "convites" | "financeiro" | "servicos" | "network";
type ViewTab = "lista" | "calendario";

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProfissionalDashboard() {
  const { user } = useAuth();

  // Core data state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [unitInvites, setUnitInvites] = useState<UnitInvite[]>([]);
  const [catalogServices, setCatalogServices] = useState<ServiceCatalog[]>([]);
  const [network, setNetwork] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>("agenda");
  const [viewTab, setViewTab] = useState<ViewTab>("lista");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [showNewServicesModal, setShowNewServicesModal] = useState(false);
  const [hasCheckedInvites, setHasCheckedInvites] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Network search state
  const [networkSearch, setNetworkSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Partner[]>([]);

  // Finance state
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("fs_monthly_goal");
    return saved ? Number(saved) : 5000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(monthlyGoal.toString());

  // ─── Notification Helper ─────────────────────────────────────────────────────

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // ─── Data Fetchers ────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(() => {
    setLoading(true);
    API.get("profissional/events")
      .then((r) => setEvents(r.data))
      .catch((err) => console.error("Erro ao buscar eventos:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchProfile = useCallback(() => {
    API.get("profissional/me")
      .then((r) => setProfile(r.data))
      .catch((err) => console.error("Erro ao buscar perfil:", err));
  }, []);

  const fetchUnitInvites = useCallback(() => {
    API.get("profissional/unidades/convites")
      .then((r) => setUnitInvites(r.data))
      .catch((err) => console.error("Erro ao buscar convites:", err));
  }, []);

  const fetchServiceCatalog = useCallback(async () => {
    try {
      const { data } = await API.get("public/configs/services");
      setCatalogServices(data.services || []);
    } catch (err) {
      console.error("Erro ao buscar catálogo:", err);
    }
  }, []);

  const fetchNetwork = useCallback(() => {
    API.get("profissional/network")
      .then((r) => setNetwork(r.data))
      .catch((err) => console.error("Erro ao buscar rede:", err));
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchProfile();
    fetchUnitInvites();
    fetchServiceCatalog();
    fetchNetwork();
  }, [fetchEvents, fetchProfile, fetchUnitInvites, fetchServiceCatalog, fetchNetwork]);

  // ─── Derived State ─────────────────────────────────────────────────────────────

  const pendingEvents = events.filter(
    (ev) =>
      (ev.captacaoId === user?.id && ev.captacaoStatus === "PENDING") ||
      (ev.edicaoId === user?.id && ev.edicaoStatus === "PENDING")
  );

  useEffect(() => {
    if (!loading && !hasCheckedInvites) {
      if (pendingEvents.length > 0 || unitInvites.length > 0) {
        setShowNewServicesModal(true);
      }
      setHasCheckedInvites(true);
    }
  }, [loading, pendingEvents.length, unitInvites.length, hasCheckedInvites]);

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleRespond = async (eventId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`profissional/events/${eventId}/respond`, { status });
      fetchEvents();
    } catch (err) {
      console.error("Erro ao responder convite:", err);
      alert("Erro ao processar resposta.");
    }
  };

  const handleDelegate = (eventId: string) => {
    showNotification("Delegando para sua Rede de Empatia...", "success");
    setTimeout(() => handleRespond(eventId, "REJECTED"), 1500);
  };

  const handleRespondUnit = async (inviteId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`profissional/unidades/convites/${inviteId}/respond`, { status });
      fetchUnitInvites();
      fetchProfile();
    } catch (err) {
      console.error("Erro ao responder convite de unidade:", err);
      alert("Erro ao processar resposta da unidade.");
    }
  };

  const handleUpdated = (updated: Partial<EventItem>) => {
    setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
    setEvents((prev) => prev.map((e) => (selected && e.id === selected.id ? { ...e, ...updated } : e)));
  };

  const handleSaveGoal = () => {
    const val = Number(tempGoal);
    if (!isNaN(val) && val > 0) {
      setMonthlyGoal(val);
      localStorage.setItem("fs_monthly_goal", val.toString());
      setIsEditingGoal(false);
      showNotification("Meta financeira atualizada!", "success");
    }
  };

  const handleSearchNetwork = async (q: string) => {
    setNetworkSearch(q);
    if (!q || q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await API.get(`profissional/network/search?query=${q}`);
      setSearchResults(data);
    } catch (err) {
      console.error("Erro na busca:", err);
    }
  };

  const handleToggleFavorite = async (partnerId: string) => {
    try {
      await API.post("profissional/network/toggle", { partnerId });
      fetchNetwork();
      showNotification("Rede de empatia atualizada!", "success");
    } catch {
      showNotification("Erro ao atualizar rede", "error");
    }
  };

  const handleAddService = async (catalogService: ServiceCatalog) => {
    const basePrice = Number(catalogService.basePrice) || 0;
    const hourlyRate = Number(profile?.hourlyRate) || 150;
    const multiplier = Number(profile?.equipmentMultiplier) || 1.0;
    const suggestedPrice = Math.max(basePrice, (hourlyRate * (catalogService.estimatedMinutes / 60)) * multiplier);
    try {
      await API.post("profissional/services", {
        catalogId: catalogService.id,
        name: catalogService.name,
        description: catalogService.description,
        price: suggestedPrice,
      });
      fetchProfile();
      showNotification("Serviço adicionado à sua vitrine!", "success");
    } catch {
      showNotification("Erro ao adicionar serviço", "error");
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm("Remover este serviço da sua vitrine?")) return;
    try {
      await API.delete(`/profissional/services/${serviceId}`);
      fetchProfile();
      showNotification("Serviço removido.", "success");
    } catch {
      showNotification("Erro ao remover serviço", "error");
    }
  };

  const handleDownloadTaxReport = async () => {
    try {
      showNotification("Gerando relatório tributário...", "success");
      const response = await API.get("profissional/finance/tax-report?format=csv", {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-tributario-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erro ao baixar relatório:", err);
      showNotification("Erro ao gerar relatório", "error");
    }
  };

  // ─── Nav ──────────────────────────────────────────────────────────────────────

  const navItems: NavItem[] = [
    { label: "Visão Geral", onClick: () => setActiveTab("agenda"), isActive: activeTab === "agenda", icon: <LayoutDashboard size={16} /> },
    {
      label: "Convites Pendentes",
      onClick: () => setActiveTab("convites"),
      isActive: activeTab === "convites",
      icon: <MessageCircle size={16} />,
      badge: pendingEvents.length + unitInvites.length,
    },
    { label: "Financeiro", onClick: () => setActiveTab("financeiro"), isActive: activeTab === "financeiro", icon: <DollarSign size={16} /> },
    { label: "Serviços", onClick: () => setActiveTab("servicos"), isActive: activeTab === "servicos", icon: <Briefcase size={16} /> },
    { label: "Minha Rede", onClick: () => setActiveTab("network"), isActive: activeTab === "network", icon: <Users size={16} /> },
    { label: "Meu Perfil", onClick: () => setIsProfileOpen(true), isActive: false, icon: <Settings size={16} /> },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Painel do Profissional" navItems={navItems}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lux-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .lux-card:hover { border-color: ${T.brand} !important; transform: translateY(-2px); }
      `}</style>

      {/* ── Opportunities Modal ─────────────────────────────────────────────── */}
      {showNewServicesModal && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/90 animate-in fade-in duration-500">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 p-10 md:p-16 shadow-[0_0_150px_rgba(133,185,172,0.15)] relative overflow-hidden text-center space-y-10">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-brand-tactical to-transparent" />
            <div className="flex justify-center">
              <div className="p-6 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full text-brand-tactical animate-bounce">
                <ShieldCheck size={48} />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-tight">Oportunidades Disponíveis</h2>
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic font-bold">A matriz detectou novos chamados compatíveis com seu perfil</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {unitInvites.length > 0 && (
                <div className="bg-brand-tactical/5 p-6 border border-brand-tactical/20 hover:border-brand-tactical transition-all">
                  <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.2em] mb-2 italic">Expansão de Rede</div>
                  <div className="text-xl font-heading font-black text-theme-text italic leading-none">
                    {unitInvites.length} {unitInvites.length === 1 ? "CONVITE DE UNIDADE" : "CONVITES DE UNIDADE"}
                  </div>
                </div>
              )}
              {pendingEvents.length > 0 && (
                <div className="bg-white/2 p-6 border border-white/5 hover:border-brand-tactical/40 transition-all">
                  <div className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 italic">Chamados de Campo</div>
                  <div className="text-xl font-heading font-black text-theme-text italic leading-none">
                    {pendingEvents.length} {pendingEvents.length === 1 ? "TRABALHO DISPONÍVEL" : "TRABALHOS DISPONÍVEIS"}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6 pt-4">
              <button
                onClick={() => { setShowNewServicesModal(false); setActiveTab(unitInvites.length > 0 ? "convites" : "agenda"); }}
                className="w-full py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-2xl shadow-brand-tactical/20 transition-all italic flex items-center justify-center gap-3"
              >
                ACESSAR CENTRAL DE CONVITES <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setShowNewServicesModal(false)}
                className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] hover:text-brand-tactical transition-colors italic"
              >
                IGNORAR POR ENQUANTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-theme-border/60 pb-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
              {activeTab === "agenda" ? "Meu Cockpit" : activeTab === "convites" ? "Central de Convites" : activeTab === "financeiro" ? "Fluxo de Caixa" : activeTab === "network" ? "Rede de Empatia" : "Gestão de Ativos"}
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              {profile?.cartorioProfissional?.length ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-brand-tactical" />
                  <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">
                    Residente: {profile.cartorioProfissional.map((cp) => cp.cartorio.razaoSocial).join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          {(activeTab === "agenda" || activeTab === "convites") && (
            <div className="flex gap-4">
              <button
                onClick={() => setViewTab("lista")}
                className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${viewTab === "lista" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"}`}
              >
                <List size={14} /> Lista
              </button>
              <button
                onClick={() => setViewTab("calendario")}
                className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${viewTab === "calendario" ? "bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20" : "text-theme-muted border-theme-border/60 hover:text-theme-text"}`}
              >
                <CalendarIcon size={14} /> Calendário
              </button>
            </div>
          )}
        </div>

        {/* Express Sale Button */}
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-tactical/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <button
            onClick={() => setIsExpressModalOpen(true)}
            className="relative w-full bg-theme-bg-muted border border-brand-tactical/40 p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-brand-tactical transition-all overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-6">
              <div className="p-5 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical"><DollarSign size={28} /></div>
              <div className="text-left space-y-1">
                <div className="text-xl font-heading font-black text-theme-text uppercase tracking-tighter italic">Venda Rápida Foto Segundo</div>
                <div className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] italic">Registre o recebimento e libere o acesso na hora</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] group-hover:gap-6 transition-all">
              INICIAR OPERAÇÃO <ArrowRight size={14} />
            </div>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Performance de Entrega", value: `${profile?.stats?.completedEvents || 0}`, unit: "Eventos", icon: null },
            { label: "Acumulado Global", value: `R$ ${profile?.stats?.totalEarnings?.toLocaleString() || "0"}`, unit: "Provisionado p/ Repasse", icon: null },
            { label: "Resultado do Mês", value: `R$ ${profile?.stats?.monthEarnings?.toLocaleString() || "0"}`, unit: "Meta de Produção Ativa", icon: null },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-theme-bg border border-theme-border/60 p-8 space-y-4 group hover:border-brand-tactical/50 transition-all shadow-sm">
              <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">{kpi.label}</span>
              <div className="text-4xl font-heading font-black text-brand-tactical italic leading-none">{kpi.value}</div>
              <div className="text-[8px] font-black text-theme-muted uppercase tracking-widest mt-2">{kpi.unit}</div>
            </div>
          ))}
        </div>

        {/* Support Banner */}
        <div className="bg-theme-bg-muted border-l-4 border-brand-tactical p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Suporte de Campo</h4>
            <p className="text-[10px] text-theme-muted uppercase tracking-widest font-medium">Linha direta com a matriz para dúvidas operacionais ou técnicas.</p>
          </div>
          <a
            href="https://wa.me/5519984470420"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-8 py-4 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-brand-tactical/10"
          >
            <MessageCircle size={16} /> Falar com Matriz
          </a>
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {activeTab === "financeiro" && (
            <FinanceTab
              profile={profile}
              monthlyGoal={monthlyGoal}
              isEditingGoal={isEditingGoal}
              tempGoal={tempGoal}
              onEditGoal={() => { setTempGoal(monthlyGoal.toString()); setIsEditingGoal(true); }}
              onTempGoalChange={setTempGoal}
              onSaveGoal={handleSaveGoal}
              onCancelGoal={() => setIsEditingGoal(false)}
              onDownloadTaxReport={handleDownloadTaxReport}
            />
          )}
          {activeTab === "network" && (
            <NetworkTab
              network={network}
              networkSearch={networkSearch}
              searchResults={searchResults}
              onSearch={handleSearchNetwork}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeTab === "servicos" && (
            <ServicesTab
              profile={profile}
              catalogServices={catalogServices}
              onAddService={handleAddService}
              onRemoveService={handleRemoveService}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          )}
          {(activeTab === "agenda" || activeTab === "convites") && (
            <AgendaTab
              events={events}
              unitInvites={unitInvites}
              activeTab={activeTab}
              viewTab={viewTab}
              currentMonth={currentMonth}
              loading={loading}
              userId={user?.id}
              onSetCurrentMonth={setCurrentMonth}
              onSelectEvent={(ev) => setSelected(ev)}
              onRespond={handleRespond}
              onRespondUnit={handleRespondUnit}
              onDelegate={handleDelegate}
            />
          )}
        </div>
      </div>

      {/* ── Overlays & Modals ──────────────────────────────────────────────── */}

      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
          style={{ background: T.overlay, backdropFilter: "blur(20px)" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-theme-bg border border-theme-border/60 shadow-2xl animate-in zoom-in duration-300">
            <EventEditPanel
              event={selected}
              onUpdated={handleUpdated}
              onClose={() => setSelected(null)}
              onNotify={showNotification}
            />
          </div>
        </div>
      )}

      {isProfileOpen && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setIsProfileOpen(false)}
          onUpdated={(p) => { setProfile(p); setIsProfileOpen(false); }}
        />
      )}

      {isExpressModalOpen && (
        <ExpressSaleModal
          network={network}
          onClose={() => setIsExpressModalOpen(false)}
          onSuccess={(msg) => showNotification(msg, "success")}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {notification && (
        <div className={`fixed bottom-8 right-8 z-[10000] p-5 border shadow-2xl animate-in slide-in-from-right-4 bg-theme-bg ${notification.type === "success" ? "border-brand-tactical/60" : "border-red-500/60"}`}>
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${notification.type === "success" ? "bg-brand-tactical animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] font-black text-theme-text uppercase tracking-widest">{notification.message}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
