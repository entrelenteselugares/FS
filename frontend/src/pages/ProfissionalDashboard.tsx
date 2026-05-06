import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, MessageCircle,
  Settings, Briefcase, Users, LayoutDashboard, Play, Zap, Calendar, RefreshCw, LogOut, CheckCircle, Camera
} from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";
import {
  AgendaTab, FinanceTab, NetworkTab, ServicesTab, ProfileTab,
  EventEditPanel, ExpressSaleModal, ProfileModal, FlashEventModal, FotoPointModal, FotoPointEditModal,
  DashboardHeader, DashboardStats, SupportBanner,
  OpportunitiesModal, ExpressSaleBanner,
  type EventItem, type UnitInvite, type ServiceCatalog, type ProfileData, type Partner,
} from "../components/profissional";

// ─── Types ────────────────────────────────────────────────────────────────────

import { Printer } from "lucide-react";

type ActiveTab = "agenda" | "convites" | "financeiro" | "servicos" | "network" | "franquia" | "calendar" | "perfil";
type ViewTab = "lista" | "calendario";

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProfissionalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
  const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
  const [isFotoPointModalOpen, setIsFotoPointModalOpen] = useState(false);
  const [showNewServicesModal, setShowNewServicesModal] = useState(false);
  const [hasCheckedInvites, setHasCheckedInvites] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<{ 
    connected: boolean; 
    credential: { 
      calendarId?: string; 
      updatedAt?: string; 
    } 
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
    // We remove the sync setLoading(true) to avoid cascading renders warning
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

  const fetchNetwork = useCallback(() => {
    API.get("profissional/network")
      .then((r) => setNetwork(r.data))
      .catch((err) => console.error("Erro ao buscar rede:", err));
  }, []);

  const fetchCalendarStatus = useCallback(() => {
    API.get("calendar/status")
      .then(r => setCalendarStatus(r.data))
      .catch(err => console.error("Erro ao buscar status do calendário:", err));
  }, []);

  useEffect(() => {
    // setLoading(true); // Redundant as it's initialized to true
    Promise.all([
      API.get("profissional/events").then(r => setEvents(r.data)),
      API.get("profissional/me").then(r => setProfile(r.data)),
      API.get("profissional/unidades/convites").then(r => setUnitInvites(r.data)),
      API.get("public/configs/services").then(r => setCatalogServices(r.data.services || [])),
      API.get("profissional/network").then(r => setNetwork(r.data)),
      API.get("calendar/status").then(r => setCalendarStatus(r.data))
    ]).finally(() => setLoading(false));

    // Handle calendar return notifications
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      showNotification("Google Calendar conectado com sucesso!", "success");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("calendar") === "error") {
      showNotification("Erro ao conectar Google Calendar.", "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showNotification]); // Only on mount

  // ─── Derived State ─────────────────────────────────────────────────────────────

  const pendingEvents = events.filter(
    (ev) =>
      (ev.captacaoId === user?.id && ev.captacaoStatus === "PENDING") ||
      (ev.edicaoId === user?.id && ev.edicaoStatus === "PENDING")
  );


  const opportunities = events.filter(
    (ev) => ev.isPublicCall && !ev.captacaoId
  );

  useEffect(() => {
    if (!loading && !hasCheckedInvites) {
      if (pendingEvents.length > 0 || opportunities.length > 0 || unitInvites.length > 0) {
        // Use setTimeout to avoid synchronous cascading renders
        setTimeout(() => setShowNewServicesModal(true), 0);
      }
      setTimeout(() => setHasCheckedInvites(true), 0);
    }
  }, [loading, pendingEvents.length, opportunities.length, unitInvites.length, hasCheckedInvites]);

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleRespond = async (eventId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`profissional/events/${eventId}/respond`, { status });
      fetchEvents();
    } catch (err) {
      console.error("Erro ao responder convite:", err);
    }
  };

  const handleRespondUnit = async (inviteId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`profissional/unidades/convites/${inviteId}/respond`, { status });
      fetchUnitInvites();
      fetchProfile();
    } catch (err) {
      console.error("Erro ao responder unidade:", err);
    }
  };


  const handleAddService = async (cat: ServiceCatalog) => {
    try {
      const suggestedPrice = Math.max(
        cat.basePrice,
        ((profile?.hourlyRate || 150) * (cat.estimatedMinutes / 60)) * (profile?.equipmentMultiplier || 1.0)
      );

      await API.post("profissional/services", { 
        catalogId: cat.id,
        name: cat.name,
        description: `Serviço de ${cat.name} importado do catálogo.`,
        price: suggestedPrice
      });
      
      fetchProfile();
      showNotification(`Serviço "${cat.name}" importado com sucesso!`);
    } catch (err) {
      console.error("Erro ao adicionar serviço:", err);
      showNotification("Erro ao importar serviço do catálogo.", "error");
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      await API.delete(`profissional/services/${serviceId}`);
      fetchProfile();
    } catch (err) {
      console.error("Erro ao remover serviço:", err);
    }
  };

  const handleSearchNetwork = async (q: string) => {
    setNetworkSearch(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await API.get(`profissional/network/search?q=${q}`);
      setSearchResults(data);
    } catch (err) {
      console.error("Erro na busca:", err);
    }
  };

  const handleToggleFavorite = async (partnerId: string) => {
    try {
      await API.post(`profissional/network/favorite/${partnerId}`);
      fetchNetwork();
    } catch (err) {
      console.error("Erro favoritar:", err);
    }
  };

  const handleSaveGoal = async () => {
    const val = Number(tempGoal);
    if (isNaN(val)) return;
    setMonthlyGoal(val);
    localStorage.setItem("fs_monthly_goal", val.toString());
    setIsEditingGoal(false);
  };

  const handleDownloadTaxReport = () => {
    window.open(`${API.defaults.baseURL}/profissional/reports/tax`, "_blank");
  };

  const handleConnectCalendar = () => {
    // Redirect to backend OAuth initiator
    window.location.href = `${API.defaults.baseURL}/calendar/connect?token=${localStorage.getItem("fs_token")}`;
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("Deseja realmente desconectar seu Google Calendar? Isso removerá os bloqueios automáticos da sua vitrine.")) return;
    try {
      await API.delete("calendar/disconnect");
      showNotification("Calendário desconectado.");
      fetchCalendarStatus();
    } catch (err) {
      console.error("[Calendar] Erro ao desconectar:", err);
      showNotification("Erro ao desconectar.", "error");
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const { data } = await API.post("calendar/sync");
      showNotification(`Sincronização concluída: ${data.synced} slots atualizados.`);
      fetchCalendarStatus();
    } catch (err) {
      console.error("[Calendar] Erro na sincronização manual:", err);
      showNotification("Erro na sincronização.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Nav ──────────────────────────────────────────────────────────────────────

  const navItems: NavItem[] = useMemo(() => [
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
    { label: "Agenda Google", onClick: () => setActiveTab("calendar"), isActive: activeTab === "calendar", icon: <Calendar size={16} /> },
    ...(user?.franchiseProfile && user?.franchiseProfile.active ? [{ 
      label: "Franquia Print", 
      onClick: () => setActiveTab("franquia"), 
      isActive: activeTab === "franquia", 
      icon: <Printer size={16} /> 
    }] : []),
    { label: "Meu Perfil", onClick: () => setActiveTab("perfil"), isActive: activeTab === "perfil", icon: <Settings size={16} /> },
  ], [activeTab, pendingEvents.length, unitInvites.length, user?.franchiseProfile]);

  const residentUnits = profile?.cartorios?.map((cp) => cp.cartorio.razaoSocial) || [];

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
        <OpportunitiesModal 
          unitInvitesCount={unitInvites.length}
          pendingEventsCount={pendingEvents.length}
          opportunitiesCount={opportunities.length}
          onClose={() => setShowNewServicesModal(false)}
          onAction={(tab) => setActiveTab(tab)}
        />
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <DashboardHeader 
          activeTab={activeTab}
          viewTab={viewTab}
          onViewTabChange={setViewTab}
          residentUnits={residentUnits}
        />

        {/* ── Tab Content ──────────────────────────────────────────────────── */}
        <div className="space-y-12">
          {activeTab === "agenda" && (
            <div className="space-y-12 animate-in fade-in duration-500">
              {/* Banner de Venda Expressa & Flash Event */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ExpressSaleBanner onOpen={() => setIsExpressModalOpen(true)} />
                
                {/* Foto Point (Novo) */}
                <div 
                  onClick={() => setIsFotoPointModalOpen(true)}
                  className="bg-theme-bg-muted border border-cyan-400/30 p-6 h-full flex items-center justify-between cursor-pointer hover:border-cyan-400/60 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Camera size={14} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Nova Categoria</span>
                    </div>
                    <h3 className="text-xl font-heading font-black text-theme-text uppercase italic leading-tight">Foto Point</h3>
                    <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">Crie um ponto de venda local</p>
                  </div>
                  <div className="text-cyan-400/10 group-hover:text-cyan-400/30 transition-colors">
                    <Camera size={40} strokeWidth={3} />
                  </div>
                </div>

                {user?.franchiseProfile && user?.franchiseProfile.active && (
                  <div 
                    onClick={() => setIsFlashModalOpen(true)}
                    className="bg-theme-bg-muted border border-yellow-400/30 p-6 h-full flex items-center justify-between cursor-pointer hover:border-yellow-400/60 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                    <div className="space-y-1 relative z-10">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Oportunidade Agora</span>
                      </div>
                      <h3 className="text-xl font-heading font-black text-theme-text uppercase italic leading-tight">Foto Print Live</h3>
                      <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">Ative um QR Code instantaneamente</p>
                    </div>
                    <div className="text-yellow-400/10 group-hover:text-yellow-400/30 transition-colors">
                      <Zap size={40} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Cards */}
              <DashboardStats 
                completedEvents={profile?.stats?.completedEvents || 0}
                totalEarnings={profile?.stats?.totalEarnings || 0}
                monthEarnings={profile?.stats?.monthEarnings || 0}
                agilityPoints={profile?.stats?.agilityPoints || 0}
              />

              {/* Support Banner */}
              <SupportBanner />
            </div>
          )}

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
                residentUnits={profile?.cartorioProfissional || []}
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
                onOpenProfile={() => setActiveTab("perfil")}
              />
            )}
            {activeTab === "calendar" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-3xl font-black text-theme-text uppercase tracking-tighter">Agenda Google</h2>
                  <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-black italic">Sincronização com seu Calendário Pessoal</p>
                </div>

                <div className="max-w-3xl space-y-6">
                  {!calendarStatus?.connected ? (
                    <div className="bg-theme-bg border border-theme-border p-10 text-center space-y-6">
                      <div className="w-20 h-20 bg-theme-card border border-theme-border flex items-center justify-center text-theme-muted mx-auto">
                        <Calendar size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-theme-text uppercase italic">Conecte sua Agenda</h3>
                        <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest max-w-sm mx-auto leading-relaxed">
                          Sincronize seu Google Calendar para que o sistema bloqueie automaticamente sua vitrine quando você tiver compromissos pessoais.
                        </p>
                      </div>
                      <button 
                        onClick={handleConnectCalendar}
                        className="px-10 py-4 bg-white text-theme-text text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-tactical transition-all shadow-xl"
                      >
                        CONECTAR GOOGLE CALENDAR
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-theme-bg border border-brand-tactical/30 p-8 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-brand-tactical/10 border border-brand-tactical/20 flex items-center justify-center text-brand-tactical">
                            <CheckCircle size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-brand-tactical uppercase tracking-widest italic">Status: Conectado</p>
                            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-1">
                              ID da Agenda: {calendarStatus.credential?.calendarId}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={handleDisconnectCalendar}
                          className="p-3 text-theme-muted hover:text-red-500 transition-colors"
                          title="Desconectar"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-theme-bg border border-theme-border p-8 space-y-4">
                          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Última Sincronização</label>
                          <p className="text-sm font-black text-theme-text uppercase italic tracking-tight">
                            {calendarStatus.credential?.updatedAt 
                              ? new Date(calendarStatus.credential.updatedAt).toLocaleString('pt-BR') 
                              : "Nenhuma sincronização"}
                          </p>
                          <button 
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="flex items-center gap-2 text-[10px] font-black text-brand-tactical uppercase tracking-widest hover:underline disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                            {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
                          </button>
                        </div>
                        <div className="bg-theme-bg border border-theme-border p-8 space-y-4">
                          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Configurações</label>
                          <p className="text-[10px] text-theme-muted font-bold uppercase leading-relaxed">
                            O sistema lê apenas os horários ocupados para bloquear sua vitrine. Nenhum detalhe privado é exposto.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 border border-theme-border bg-theme-bg-muted/30">
                        <p className="text-[9px] text-theme-muted uppercase font-black tracking-widest text-center italic">
                          DICA: Todas as reservas confirmadas no sistema são enviadas automaticamente para o seu Google Calendar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "perfil" && profile && (
              <ProfileTab 
                profile={profile}
                onUpdated={setProfile}
                onNotify={showNotification}
              />
            )}
            {activeTab === "franquia" && user?.franchiseProfile && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-display font-black text-theme-text uppercase tracking-tighter italic leading-none">Franquia Print</h2>
                    <p className="text-[10px] text-emerald-500 uppercase tracking-[0.4em] mt-4 font-black italic">Gestão de Créditos e Operações Phygital</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-theme-bg border border-theme-border p-10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Saldo Disponível</label>
                    <div className={`text-7xl font-display font-black italic tracking-tighter ${user.franchiseProfile.printCredits < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {user.franchiseProfile.printCredits}
                    </div>
                    <p className="text-[10px] text-theme-muted font-black uppercase tracking-[0.2em] mt-2 italic">Fotos para Impressão</p>
                  </div>
                  
                  <div className="bg-theme-bg border border-theme-border p-10 relative group">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Status do Terminal</label>
                    <div className={`text-xl font-display font-black uppercase italic tracking-widest ${user.franchiseProfile.active ? 'text-emerald-500' : 'text-red-500'}`}>
                      {user.franchiseProfile.active ? 'Terminal Ativo' : 'Terminal Inativo'}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.franchiseProfile.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[9px] text-theme-muted font-black uppercase tracking-widest">Sincronizado com a Nuvem</span>
                    </div>
                  </div>

                  <div className="bg-theme-bg border border-theme-border p-10 flex flex-col justify-between">
                    <div>
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-2">Recarga de Créditos</label>
                      <p className="text-[10px] text-theme-muted font-bold leading-relaxed uppercase tracking-wider">
                        O limite de impressões é gerenciado pela administração central. Solicite uma nova carga para continuar operando.
                      </p>
                    </div>
                    <button className="w-full py-4 mt-6 border border-emerald-500/30 text-emerald-500 font-display font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all">
                      SOLICITAR RECARGA
                    </button>
                  </div>
                </div>
                {user.franchiseProfile.printCredits < 50 && (
                  <div className="border border-amber-500/30 bg-amber-500/5 p-6 flex items-start gap-4">
                    <div className="text-amber-500 text-2xl">⚠</div>
                    <div>
                      <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Saldo Baixo</p>
                      <p className="text-[10px] text-theme-muted font-bold mt-1">Seu saldo está abaixo de 50 fotos. Solicite recarga ao administrador para não interromper a operação.</p>
                    </div>
                  </div>
                )}

                {/* ── OPERAÇÕES DE IMPRESSÃO ── */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="h-0.5 w-6 bg-brand-tactical" />
                      <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Operações em Campo</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {events.filter(ev => ev.captacaoId === user.id).length > 0 ? (
                        events.filter(ev => ev.captacaoId === user.id).map(ev => (
                          <div key={ev.id} className="bg-theme-bg border border-theme-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-tactical/30 transition-all group">
                             <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-theme-card border border-theme-border flex items-center justify-center text-brand-tactical group-hover:scale-110 transition-transform">
                                   <Printer size={20} />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-theme-text uppercase italic tracking-tight">{ev.nomeNoivos}</p>
                                   <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">{new Date(ev.dataEvento).toLocaleDateString('pt-BR')} · {ev.location}</p>
                                </div>
                             </div>
                             <button 
                               onClick={() => navigate(`/profissional/monitor/${ev.id}`)}
                               className="px-8 py-3 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-3 shadow-lg shadow-brand-tactical/10"
                             >
                               <Play size={12} /> ABRIR MONITOR
                             </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 border border-dashed border-theme-border/40 text-center space-y-4">
                           <p className="text-[10px] text-theme-muted uppercase font-black italic tracking-widest">Nenhum evento designado para você neste momento.</p>
                           <p className="text-[8px] text-theme-muted/60 uppercase font-bold max-w-xs mx-auto leading-relaxed">Fique atento à sua agenda. Quando um admin vincular sua franquia a um evento, ele aparecerá aqui para impressão.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* ── ATIVIDADE RECENTE ── */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="h-px w-8 bg-emerald-500" />
                       <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.5em] italic">Registro de Atividades</p>
                    </div>
 
                    <div className="bg-theme-bg border border-theme-border overflow-hidden">
                       {user.franchiseProfile.transactions && user.franchiseProfile.transactions.length > 0 ? (
                         <div className="divide-y divide-theme-border">
                           {user.franchiseProfile.transactions.map(tx => (
                             <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                                <div className="space-y-1">
                                   <p className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">
                                     {tx.description || (tx.type === 'PRINT_CONSUMPTION' ? 'Impressão Phygital' : 'Recarga de Créditos')}
                                   </p>
                                   <div className="flex items-center gap-3">
                                     <p className="text-[8px] text-theme-subtle font-black uppercase tracking-widest">
                                       {new Date(tx.createdAt).toLocaleString('pt-BR')}
                                     </p>
                                     <div className="w-1 h-1 rounded-full bg-white/10" />
                                     <p className="text-[8px] text-theme-subtle font-black uppercase tracking-widest">
                                       Hash: {tx.id.slice(-8).toUpperCase()}
                                     </p>
                                   </div>
                                </div>
                                <div className={`text-lg font-display font-black italic tracking-tighter ${tx.amount > 0 ? 'text-emerald-500' : 'text-theme-muted'}`}>
                                   {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="p-20 text-center text-[10px] text-theme-muted uppercase font-black italic tracking-widest">
                           Nenhuma atividade registrada no ledger.
                         </div>
                       )}
                    </div>
                 </div>
              </div>
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
                onDelegate={(eventId) => {
                  const ev = events.find(e => e.id === eventId);
                  if (ev) setSelected(ev);
                }}
                opportunities={opportunities}
              />
            )}
          </div>
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
            {selected.type === 'FOTO_POINT' ? (
              <FotoPointEditModal
                event={selected}
                network={network}
                onClose={() => setSelected(null)}
                onSuccess={(updated) => {
                  setEvents(prev => prev.map(e => e.id === selected.id ? { ...e, ...updated } : e));
                  showNotification("Foto Point Atualizado!", "success");
                }}
                onError={(msg) => showNotification(msg, "error")}
              />
            ) : (
              <EventEditPanel 
                event={selected}
                onUpdated={(u) => {
                  setEvents(prev => prev.map(e => e.id === selected.id ? { ...e, ...u } : e));
                }}
                onClose={() => setSelected(null)}
                onNotify={showNotification}
              />
            )}
          </div>
        </div>
      )}

      {isExpressModalOpen && (
        <ExpressSaleModal 
          network={network}
          onClose={() => setIsExpressModalOpen(false)}
          onSuccess={(msg) => {
            fetchEvents();
            showNotification(msg);
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {isProfileOpen && (
        <ProfileModal 
          profile={profile!}
          onClose={() => setIsProfileOpen(false)}
          onUpdated={fetchProfile}
        />
      )}

      {/* Global Notifications */}
      {notification && (
        <div 
          className="fixed bottom-10 right-10 z-[2000] px-8 py-4 shadow-2xl animate-in slide-in-from-right duration-500"
          style={{ 
            background: notification.type === "success" ? T.brand : "#f87171",
            color: notification.type === "success" ? "#000" : "#fff",
            fontWeight: 900,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 2
          }}
        >
          {notification.message}
        </div>
      )}
      {/* Modal de Foto Point */}
      {isFotoPointModalOpen && (
        <FotoPointModal 
          network={network}
          onClose={() => setIsFotoPointModalOpen(false)}
          onSuccess={() => {
            showNotification("Foto Point Ativado com Sucesso!", "success");
            setIsFotoPointModalOpen(false);
            fetchEvents();
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {/* Modal de Foto Print Live (Express) */}
      {isFlashModalOpen && (
        <FlashEventModal 
          network={network}
          onClose={() => setIsFlashModalOpen(false)}
          onSuccess={(slug) => {
            showNotification("Foto Print Live Ativado!", "success");
            setIsFlashModalOpen(false);
            navigate(`/e/${slug}`);
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}
    </DashboardLayout>
  );
}
