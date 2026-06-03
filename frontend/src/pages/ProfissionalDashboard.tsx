import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
 DollarSign,
 Settings, Briefcase, Users, LayoutDashboard, Play, Calendar, RefreshCw, LogOut, CheckCircle, Camera, Printer
} from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";
import {
 AgendaTab, FinanceTab, NetworkTab, ServicesTab, ProfileTab, FranquiaLanding,
 EventEditPanel, ExpressSaleModal, ProfileModal, FlashEventModal, FotoPointModal, FotoPointEditModal,
 DashboardHeader, DashboardStats, SupportBanner, TeamTab,
 OpportunitiesModal, DashboardActionButton, FranchiseShopModal,
 type EventItem, type UnitInvite, type ServiceCatalog, type ProfileData, type Partner
} from "../components/profissional";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeTour } from "../components/WelcomeTour";
import { DiscoverySurvey } from "../components/DiscoverySurvey";
import PortfolioManage from "./profissional/PortfolioManage";

interface PayoutItem {
 id: string;
 amount: number;
 status: string;
 payout: {
 weekStart: string;
 weekEnd: string;
 };
}

interface SupplyOrder {
 id: string;
 createdAt: string;
 total: number;
 status: string;
 items: Array<{
 id: string;
 name: string;
 quantity: number;
 }>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActiveTab = "agenda" | "convites" | "financeiro" | "servicos" | "network" | "franquia" | "calendar" | "perfil" | "equipe" | "portfolio";
type ViewTab = "lista" | "calendario";

// ─── Main Component ────────────────────────────────────────────────────────────

interface ProfissionalDashboardProps {
 noLayout?: boolean;
 activeTab?: ActiveTab;
 setActiveTab?: (tab: ActiveTab) => void;
}

export default function ProfissionalDashboard({
 noLayout = false,
 activeTab: propActiveTab,
 setActiveTab: propSetActiveTab,
}: ProfissionalDashboardProps = {}) {
 const { user } = useAuth();
 const navigate = useNavigate();
 const location = useLocation();

 // Core data state
 const [events, setEvents] = useState<EventItem[]>([]);
 const [profile, setProfile] = useState<ProfileData | null>(null);
 const [unitInvites, setUnitInvites] = useState<UnitInvite[]>([]);
 const [catalogServices, setCatalogServices] = useState<ServiceCatalog[]>([]);
 const [network, setNetwork] = useState<Partner[]>([]);
 const [loading, setLoading] = useState(true);
 const [minHourlyRate, setMinHourlyRate] = useState(14); // padrão €14/h da Irlanda

 // UI state
 const [localActiveTab, setLocalActiveTab] = useState<ActiveTab>("agenda");
 const activeTab = propActiveTab || localActiveTab;
 const setActiveTab = propSetActiveTab || setLocalActiveTab;
 const [viewTab, setViewTab] = useState<ViewTab>("lista");
 const [currentMonth, setCurrentMonth] = useState(new Date());
 const [selected, setSelected] = useState<EventItem | null>(null);
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
 const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
 const [isFotoPointModalOpen, setIsFotoPointModalOpen] = useState(false);
 const [isShopModalOpen, setIsShopModalOpen] = useState(false);
 const [showNewServicesModal, setShowNewServicesModal] = useState(false);
 const [hasCheckedInvites, setHasCheckedInvites] = useState(false);

 const [payouts, setPayouts] = useState<PayoutItem[]>([]);
 const [calendarStatus, setCalendarStatus] = useState<{ 
 connected: boolean; 
 credential: { 
 calendarId?: string; 
 updatedAt?: string; 
 } 
 } | null>(null);
 const [isSyncing, setIsSyncing] = useState(false);
 const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);

 useEffect(() => {
 const params = new URLSearchParams(location.search);
 const tab = params.get("tab") as ActiveTab;
 if (tab) setActiveTab(tab);
 }, [location.search, setActiveTab]);

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
 if (type === "success") {
 toast.success(message);
 } else {
 toast.error(message);
 }
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

 // ─── Deep Link for Editing ───────────────────────────────────────────────────
 useEffect(() => {
 if (location.state?.editEventId && events.length > 0) {
 const ev = events.find(e => e.id === location.state.editEventId);
 if (ev && !selected) {
 setSelected(ev);
 setActiveTab("agenda");
 // Clear state to prevent reopening on reload
 navigate(location.pathname, { replace: true, state: {} });
 }
 }
 }, [location.state, events, selected, navigate, location.pathname, setActiveTab]);

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
 API.get("calendar/status").then(r => setCalendarStatus(r.data)),
 API.get("me/repasses").then(r => setPayouts(r.data)),
 API.get("franchise/orders").then(r => setSupplyOrders(r.data.orders || [])),
 API.get("public/configs/pricing").then(r => setMinHourlyRate(r.data.minHourlyRate || 14)).catch(() => {})
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
 ((profile?.hourlyRate || minHourlyRate) * (cat.estimatedMinutes / 60)) * (profile?.equipmentMultiplier || 1.0)
 );

 await API.post("profissional/services", { 
 catalogId: cat.id,
 name: cat.name,
 description: `Serviço de ${cat.name} importado do catálogo.`,
 price: suggestedPrice,
 estimatedMinutes: cat.estimatedMinutes
 });
 
 fetchProfile();
 showNotification(`Serviço "${cat.name}" importado com sucesso!`);
 } catch (err) {
 console.error("Erro ao adicionar serviço:", err);
 const error = err as { response?: { data?: { details?: string; error?: string } } };
 const detail = error.response?.data?.details || error.response?.data?.error || "Erro ao importar serviço do catálogo.";
 showNotification(detail, "error");
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

 const handleUpdateServicePrice = async (serviceId: string, newPrice: number) => {
 try {
 await API.patch(`profissional/services/${serviceId}`, { price: newPrice });
 fetchProfile();
 showNotification("Preço atualizado com sucesso!");
 } catch (err) {
 console.error("Erro ao atualizar preço:", err);
 const error = err as { response?: { data?: { details?: string; error?: string } } };
 const detail = error.response?.data?.details || error.response?.data?.error || "Erro ao atualizar preço do serviço.";
 showNotification(detail, "error");
 throw err;
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
 window.location.href = `${API.defaults.baseURL}/calendar/connect`;
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
 { 
 label: "Minha Agenda", 
 onClick: () => setActiveTab("agenda"), 
 isActive: activeTab === "agenda" || activeTab === "convites", 
 icon: <LayoutDashboard size={16} />,
 badge: pendingEvents.length + unitInvites.length + opportunities.length
 },
 { label: "Financeiro", onClick: () => setActiveTab("financeiro"), isActive: activeTab === "financeiro", icon: <DollarSign size={16} /> },
 { label: "Serviços", onClick: () => setActiveTab("servicos"), isActive: activeTab === "servicos", icon: <Briefcase size={16} /> },
 { label: "Minha Rede", onClick: () => setActiveTab("network"), isActive: activeTab === "network", icon: <Users size={16} /> },
 { label: "Agenda Google", onClick: () => setActiveTab("calendar"), isActive: activeTab === "calendar", icon: <Calendar size={16} /> },
 { 
 label: "Franquia Print", 
 onClick: () => setActiveTab("franquia"), 
 isActive: activeTab === "franquia", 
 icon: <Printer size={16} /> 
 },
 { label: "Meu Perfil", onClick: () => setActiveTab("perfil"), isActive: activeTab === "perfil", icon: <Settings size={16} /> },
 ], [activeTab, pendingEvents.length, unitInvites.length, opportunities.length, setActiveTab]);

 const residentUnits = profile?.cartorios?.map((cp) => cp.cartorio.razaoSocial) || [];

 const availableBalance = useMemo(() => {
 return payouts
 .filter(p => p.status !== "PAID")
 .reduce((acc, p) => acc + Number(p.amount), 0);
 }, [payouts]);

 // ─── Render ───────────────────────────────────────────────────────────────────

 const content = (
 <>
 <style>{`
 @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
 .lux-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
 .lux-card:hover { border-color: ${T.brand} !important; transform: translateY(-2px); }
 `}</style>

 <WelcomeTour role="PROFISSIONAL" onComplete={() => {}} />
 <DiscoverySurvey />

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
 <div className="max-w-[1400px] mx-auto px-2 md:px-6 py-4 md:py-8 space-y-4 md:space-y-6">

 {/* Page Header */}
 <DashboardHeader 
 activeTab={activeTab}
 viewTab={viewTab}
 onViewTabChange={setViewTab}
 residentUnits={residentUnits}
 />

 {/* ── Tab Content ──────────────────────────────────────────────────── */}
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, x: 10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -10 }}
 transition={{ duration: 0.3 }}
 className="space-y-12"
 >
 {activeTab === "agenda" && (
 <div className="space-y-12">
 {/* Banner de Venda Expressa & Flash Event */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Venda Rápida */}
 <DashboardActionButton 
 title="Venda Rápida"
 subtitle="Registre recebimento e libere acesso na hora"
 icon={DollarSign}
 color="emerald"
 tag="Operação Tática"
 onClick={() => setIsExpressModalOpen(true)}
 />
 
 {/* Foto Point */}
 <DashboardActionButton 
 title="Foto Point"
 subtitle="Crie um ponto de venda local instantâneo"
 icon={Camera}
 color="cyan"
 tag="Nova Categoria"
 onClick={() => setIsFotoPointModalOpen(true)}
 />

 {/* Live Print (Somente para franqueados ativos) */}
 {user?.franchiseProfile?.active ? (
 <DashboardActionButton 
 title="Live Print"
 subtitle="Ative o monitor de impressão em tempo real"
 icon={Printer}
 color="amber"
 tag="Franquia Ativa"
 onClick={() => setIsFlashModalOpen(true)}
 />
 ) : (
 <div className="bg-theme-bg-muted border border-theme-border p-6 flex items-center justify-center text-center opacity-40 grayscale group hover:grayscale-0 transition-all">
 <div className="space-y-2">
 <Printer size={24} className="mx-auto mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
 <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed max-w-[140px] mx-auto ">Recurso exclusivo para franqueados ativos</p>
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
 minHourlyRate={minHourlyRate}
 onUpdateServicePrice={handleUpdateServicePrice}
 />
 )}
 {activeTab === "equipe" && (
 <TeamTab />
 )}

 {activeTab === "calendar" && (
 <div className="space-y-8 animate-in fade-in duration-500">
 <div className="max-w-3xl space-y-6">
 {!calendarStatus?.connected ? (
 <div className="bg-theme-bg border border-theme-border rounded-2xl p-10 text-center space-y-6 shadow-2xl">
 <div className="w-20 h-20 bg-theme-card border border-theme-border rounded-xl flex items-center justify-center text-theme-muted mx-auto">
 <Calendar size={32} />
 </div>
 <div className="space-y-2">
 <h3 className="text-xl font-black text-theme-text uppercase ">Conecte sua Agenda</h3>
 <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest max-w-sm mx-auto leading-relaxed">
 Sincronize seu Google Calendar para que o sistema bloqueie automaticamente sua vitrine quando você tiver compromissos pessoais.
 </p>
 </div>
 <button 
 onClick={handleConnectCalendar}
 className="px-10 py-4 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-tactical/30 transition-all shadow-xl shadow-brand-tactical/10 cursor-pointer"
 >
 CONECTAR GOOGLE CALENDAR
 </button>
 </div>
 ) : (
 <div className="space-y-6">
 <div className="bg-theme-bg border border-brand-tactical/30 rounded-2xl p-8 flex items-center justify-between group shadow-xl">
 <div className="flex items-center gap-6">
 <div className="w-16 h-16 bg-brand-tactical/10 border border-brand-tactical/20 rounded-xl flex items-center justify-center text-brand-tactical">
 <CheckCircle size={24} />
 </div>
 <div>
 <p className="text-xs font-black text-brand-tactical uppercase tracking-widest ">Status: Conectado</p>
 <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-1">
 ID da Agenda: {calendarStatus.credential?.calendarId}
 </p>
 </div>
 </div>
 <button 
 onClick={handleDisconnectCalendar}
 className="p-3 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
 title="Desconectar"
 >
 <LogOut size={18} />
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-theme-bg border border-theme-border rounded-2xl p-8 space-y-4 shadow-lg">
 <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Última Sincronização</label>
 <p className="text-sm font-black text-theme-text uppercase tracking-tight">
 {calendarStatus.credential?.updatedAt 
 ? new Date(calendarStatus.credential.updatedAt).toLocaleString('pt-BR') 
 : "Nenhuma sincronização"}
 </p>
 <button 
 onClick={handleManualSync}
 disabled={isSyncing}
 className="flex items-center gap-2 text-[10px] font-black text-brand-tactical uppercase tracking-widest hover:opacity-70 transition-all disabled:opacity-50 cursor-pointer"
 >
 <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
 {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
 </button>
 </div>
 <div className="bg-theme-bg border border-theme-border rounded-2xl p-8 space-y-4 shadow-lg">
 <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Configurações</label>
 <p className="text-[10px] text-theme-muted font-bold uppercase leading-relaxed">
 O sistema lê apenas os horários ocupados para bloquear sua vitrine. Nenhum detalhe privado é exposto.
 </p>
 </div>
 </div>

 <div className="p-6 border border-theme-border bg-theme-bg-muted rounded-2xl">
 <p className="text-[9px] text-theme-muted uppercase font-black tracking-widest text-center ">
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

 {activeTab === "portfolio" && (
 <PortfolioManage isTab={true} />
 )}

 {activeTab === "franquia" && (
 user?.franchiseProfile ? (
 <div className="space-y-8 animate-in fade-in duration-500">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-theme-bg border-2 border-theme-border p-10 relative overflow-hidden group rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
 <div className="absolute top-0 left-0 w-full h-1 bg-brand-tactical/20 group-hover:bg-brand-tactical transition-colors" />
 <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Saldo Disponível</label>
 <div className={`text-7xl font-display font-black tracking-tighter ${user.franchiseProfile.printCredits < 50 ? 'text-amber-500' : 'text-brand-tactical'}`}>
 {user.franchiseProfile.printCredits}
 </div>
 <p className="text-[10px] text-theme-muted font-black uppercase tracking-[0.2em] mt-2 ">Fotos para Impressão</p>
 </div>
 
 <div className="bg-theme-bg border border-theme-border p-10 relative group rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
 <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Status do Terminal</label>
 <div className={`text-xl font-display font-black uppercase tracking-widest ${user.franchiseProfile.active ? 'text-brand-tactical' : 'text-red-500'}`}>
 {user.franchiseProfile.active ? 'Terminal Ativo' : 'Terminal Inativo'}
 </div>
 <div className="mt-4 flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${user.franchiseProfile.active ? 'bg-brand-tactical animate-pulse' : 'bg-red-500'}`} />
 <span className="text-[9px] text-theme-muted font-black uppercase tracking-widest">Sincronizado com a Nuvem</span>
 </div>
 </div>

 <div className="bg-theme-bg border border-theme-border p-10 flex flex-col justify-between rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
 <div>
 <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-2">Abastecimento & Loja</label>
 <p className="text-[10px] text-theme-muted font-bold leading-relaxed uppercase tracking-wider">
 Adquira créditos de impressão ou insumos (papel/ribbon) com entrega direta ou abatimento no repasse.
 </p>
 </div>
 <div className="space-y-4 mt-6">
 <button 
 onClick={() => setIsShopModalOpen(true)}
 className="w-full py-4 bg-brand-tactical text-black font-display font-black text-[10px] uppercase tracking-widest hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-tactical/20 transition-all shadow-lg shadow-brand-tactical/10 rounded-xl cursor-pointer"
 >
 LOJA DA FRANQUIA
 </button>
 <button 
 onClick={() => { const w = window.open("https://wa.me/5519981150440?text=Olá! Preciso de assistência técnica para minha unidade Foto Segundo.", "_blank"); if (w) w.opener = null; }}
 className="w-full py-3 border border-theme-border text-theme-muted font-black text-[9px] uppercase tracking-widest hover:border-brand-tactical/30 hover:bg-theme-bg-muted hover:text-brand-tactical hover:scale-[1.02] transition-all rounded-xl cursor-pointer"
 >
 ASSISTÊNCIA TÉCNICA
 </button>
 </div>
 </div>
 </div>

 {/* Histórico de Pedidos B2B */}
 <div className="bg-theme-bg border border-theme-border p-8 space-y-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
 <div className="flex items-center justify-between">
 <h3 className="text-xl font-display font-black text-theme-text uppercase tracking-tight">Histórico de Pedidos</h3>
 <div className="h-px flex-1 bg-theme-border/20 mx-6" />
 </div>
 
 {supplyOrders.length === 0 ? (
 <div className="py-12 text-center border border-theme-border bg-theme-bg-muted rounded-xl">
 <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest">Nenhum pedido realizado</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-theme-border text-[9px] font-black text-theme-text uppercase tracking-widest">
 <th className="py-4 px-2">Data</th>
 <th className="py-4 px-2">Itens</th>
 <th className="py-4 px-2">Total</th>
 <th className="py-4 px-2">Status</th>
 </tr>
 </thead>
 <tbody>
 {supplyOrders.map((order) => (
 <tr key={order.id} className="border-b border-theme-border hover:bg-theme-bg-muted transition-colors">
 <td className="py-4 px-2 text-[10px] text-theme-text font-mono">
 {new Date(order.createdAt).toLocaleDateString('pt-BR')}
 </td>
 <td className="py-4 px-2">
 <p className="text-[10px] text-theme-text font-black uppercase ">
 {order.items?.map((it) => `${it.quantity}x ${it.name}`).join(", ") || "N/A"}
 </p>
 </td>
 <td className="py-4 px-2 text-[10px] text-brand-tactical font-black">
 R$ {Number(order.total).toFixed(2)}
 </td>
 <td className="py-4 px-2">
 <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
 order.status === 'PAID' ? 'bg-brand-tactical/10 text-brand-tactical' : 
 order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'
 }`}>
 {order.status === 'PAID' ? 'Pago' : order.status === 'PENDING' ? 'Pendente' : order.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 {user.franchiseProfile.printCredits < 50 && (
 <div className="border border-amber-500/30 bg-amber-500/5 p-6 flex items-start gap-4 rounded-2xl shadow-lg">
 <div className="text-amber-500 text-2xl">⚠</div>
 <div>
 <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Saldo Baixo</p>
 <p className="text-[10px] text-theme-muted font-bold mt-1">Seu saldo está abaixo de 50 fotos. Solicite recarga ao administrador para não interromper a operação.</p>
 </div>
 </div>
 )}

 {/* Histórico de Consumo (Insumos) */}
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-xl font-display font-black text-theme-text uppercase tracking-tight">Histórico de Consumo</h3>
 <div className="h-px flex-1 bg-theme-border/20 mx-6" />
 </div>
 <div className="bg-theme-bg border border-theme-border overflow-hidden rounded-2xl shadow-xl">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-theme-bg-muted border-b border-theme-border">
 <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest">Data</th>
 <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest">Operação</th>
 <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest text-right">Qtd</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-theme-border">
 {user.franchiseProfile.transactions?.filter(tx => tx.amount < 0).map(tx => (
 <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
 <td className="p-4 text-[10px] text-theme-muted font-mono">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</td>
 <td className="p-4">
 <span className="text-[10px] font-black text-theme-text uppercase">{tx.description || "Consumo Phygital"}</span>
 </td>
 <td className="p-4 text-right">
 <span className="text-[10px] font-black text-red-500">{tx.amount}</span>
 </td>
 </tr>
 )) || (
 <tr><td colSpan={3} className="p-10 text-center text-[9px] text-theme-muted uppercase font-black tracking-widest">Nenhum consumo registrado.</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* ── OPERAÇÕES DE IMPRESSÃO ── */}
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="h-0.5 w-6 bg-brand-tactical" />
 <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Operações em Campo</p>
 </div>
 
 <div className="grid grid-cols-1 gap-4">
 {(() => { const myEvents = events.filter(ev => ev.captacaoId === user.id); return myEvents.length > 0 ? (
 myEvents.map(ev => (
 <div key={ev.id} className="bg-theme-bg border border-theme-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-tactical/30 transition-all group rounded-2xl shadow-xl hover:shadow-2xl">
 <div className="flex items-center gap-5">
 <div className="w-12 h-12 bg-theme-card border border-theme-border flex items-center justify-center text-brand-tactical group-hover:scale-110 transition-transform rounded-xl">
 <Printer size={20} />
 </div>
 <div>
 <p className="text-sm font-black text-theme-text uppercase tracking-tight">{ev.title}</p>
 <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">{new Date(ev.dataEvento).toLocaleDateString('pt-BR')} · {ev.city || (ev.location?.startsWith("CEP:") ? null : ev.location) || "—"}</p>
 </div>
 </div>
 <button 
 onClick={() => navigate(`/profissional/monitor/${ev.id}`)}
 className="px-8 py-3 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-3 shadow-lg shadow-brand-tactical/10 rounded-xl"
 >
 <Play size={12} /> ABRIR MONITOR
 </button>
 </div>
 ))
 ) : (
 <div className="p-10 border border-theme-border text-center space-y-4 rounded-2xl">
 <p className="text-[10px] text-theme-muted uppercase font-black tracking-widest">Nenhum evento designado para você neste momento.</p>
 <p className="text-[8px] text-theme-muted/60 uppercase font-bold max-w-xs mx-auto leading-relaxed">Fique atento à sua agenda. Quando um admin vincular sua franquia a um evento, ele aparecerá aqui para impressão.</p>
 </div>
 ); })()}
 </div>
 </div>

 {/* ── ATIVIDADE RECENTE ── */}
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="h-px w-8 bg-brand-tactical" />
 <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.5em] ">Registro de Atividades</p>
 </div>
 
 <div className="bg-theme-bg border border-theme-border overflow-hidden rounded-2xl shadow-xl">
 {user.franchiseProfile.transactions && user.franchiseProfile.transactions.length > 0 ? (
 <div className="divide-y divide-theme-border">
 {user.franchiseProfile.transactions.map(tx => (
 <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
 <div className="space-y-1">
 <p className="text-[11px] font-black text-theme-text uppercase tracking-widest ">
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
 <div className={`text-lg font-display font-black tracking-tighter ${tx.amount > 0 ? 'text-brand-tactical' : 'text-theme-muted'}`}>
 {tx.amount > 0 ? '+' : ''}{tx.amount}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-20 text-center text-[10px] text-theme-muted uppercase font-black tracking-widest">
 Nenhuma atividade registrada no ledger.
 </div>
 )}
 </div>
 </div>
 </div>
 ) : (
 <FranquiaLanding />
 )
 )}
 {(activeTab === "agenda" || activeTab === "convites") && (
 <AgendaTab
 events={events}
 unitInvites={unitInvites}
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
 </motion.div>
 </AnimatePresence>
 </div>

 {/* ── Overlays & Modals ──────────────────────────────────────────────── */}

 {selected && (
 <div
 onClick={() => setSelected(null)}
 className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
 style={{ background: T.overlay, backdropFilter: "blur(20px)" }}
 >
 <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-theme-bg border border-theme-border shadow-2xl animate-in zoom-in duration-300">
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
 {null}
 {/* Modal de Foto Point */}
 {isFotoPointModalOpen && (
 <FotoPointModal 
 network={network}
 onClose={() => setIsFotoPointModalOpen(false)}
 onSuccess={(slug) => {
 showNotification("Foto Point Ativado com Sucesso!", "success");
 setIsFotoPointModalOpen(false);
 fetchEvents();
 navigate(`/e/${slug}`);
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

 {/* Loja da Franquia */}
 {isShopModalOpen && (
 <FranchiseShopModal 
 onClose={() => setIsShopModalOpen(false)}
 onSuccess={(msg) => {
 showNotification(msg, "success");
 // Atualizar balanço e créditos se necessário
 }}
 availableBalance={availableBalance}
 userAddress={profile?.cartorios?.[0]?.cartorio?.endereco || ""}
 />
 )}
 </>
 );

 if (noLayout) {
 return content;
 }

 return (
 <DashboardLayout title="Painel do Profissional" navItems={navItems}>
 {content}
 </DashboardLayout>
 );
}

