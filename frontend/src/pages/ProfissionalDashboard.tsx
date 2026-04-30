import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import {
  DollarSign, MessageCircle,
  Settings, Briefcase, Users, LayoutDashboard,
} from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";
import {
  AgendaTab, FinanceTab, NetworkTab, ServicesTab,
  EventEditPanel, ExpressSaleModal, ProfileModal,
  DashboardHeader, DashboardStats, SupportBanner,
  OpportunitiesModal, ExpressSaleBanner,
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

  useEffect(() => {
    // setLoading(true); // Redundant as it's initialized to true
    Promise.all([
      API.get("profissional/events").then(r => setEvents(r.data)),
      API.get("profissional/me").then(r => setProfile(r.data)),
      API.get("profissional/unidades/convites").then(r => setUnitInvites(r.data)),
      API.get("public/configs/services").then(r => setCatalogServices(r.data.services || [])),
      API.get("profissional/network").then(r => setNetwork(r.data))
    ]).finally(() => setLoading(false));
  }, []); // Only on mount

  // ─── Derived State ─────────────────────────────────────────────────────────────

  const pendingEvents = events.filter(
    (ev) =>
      (ev.captacaoId === user?.id && ev.captacaoStatus === "PENDING") ||
      (ev.edicaoId === user?.id && ev.edicaoStatus === "PENDING")
  );

  useEffect(() => {
    if (!loading && !hasCheckedInvites) {
      if (pendingEvents.length > 0 || unitInvites.length > 0) {
        // Use setTimeout to avoid synchronous cascading renders
        setTimeout(() => setShowNewServicesModal(true), 0);
      }
      setTimeout(() => setHasCheckedInvites(true), 0);
    }
  }, [loading, pendingEvents.length, unitInvites.length, hasCheckedInvites]);

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
      await API.patch(`profissional/unidades/convites/${inviteId}`, { status });
      fetchUnitInvites();
      fetchProfile();
    } catch (err) {
      console.error("Erro ao responder unidade:", err);
    }
  };

  const handleUpdated = () => {
    fetchEvents();
    setSelected(null);
  };

  const handleAddService = async (cat: ServiceCatalog) => {
    try {
      await API.post("profissional/services", { catalogId: cat.id });
      fetchProfile();
    } catch (err) {
      console.error("Erro ao adicionar serviço:", err);
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

  const residentUnits = profile?.cartorioProfissional?.map((cp) => cp.cartorio.razaoSocial) || [];

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
          onClose={() => setShowNewServicesModal(false)}
          onAction={(tab) => setActiveTab(tab)}
        />
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

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
              {/* Express Sale Button */}
              <ExpressSaleBanner onOpen={() => setIsExpressModalOpen(true)} />

              {/* KPI Cards */}
              <DashboardStats 
                completedEvents={profile?.stats?.completedEvents || 0}
                totalEarnings={profile?.stats?.totalEarnings || 0}
                monthEarnings={profile?.stats?.monthEarnings || 0}
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
                onDelegate={(eventId) => {
                  const ev = events.find(e => e.id === eventId);
                  if (ev) setSelected(ev);
                }}
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
            <EventEditPanel
              event={selected}
              onUpdated={handleUpdated}
              onClose={() => setSelected(null)}
              onNotify={showNotification}
            />
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
    </DashboardLayout>
  );
}
