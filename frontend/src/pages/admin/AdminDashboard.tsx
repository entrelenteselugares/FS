import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout, type NavItem } from "../../components/DashboardLayout";
import { API } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const AdminOverview = React.lazy(() => import("./AdminOverview").then(m => ({ default: m.AdminOverview })));
const AdminEvents = React.lazy(() => import("./AdminEvents").then(m => ({ default: m.AdminEvents })));
const AdminUsers = React.lazy(() => import("./AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminOrders = React.lazy(() => import("./AdminOrders").then(m => ({ default: m.AdminOrders })));
const AdminFinance = React.lazy(() => import("./AdminFinance").then(m => ({ default: m.AdminFinance })));
const AdminSuppliers = React.lazy(() => import("./AdminSuppliers"));
const AdminContests = React.lazy(() => import("./AdminContests").then(m => ({ default: m.AdminContests })));
const AdminQuotes = React.lazy(() => import("./AdminQuotes").then(m => ({ default: m.AdminQuotes })));
const AdminServices = React.lazy(() => import("./AdminServices").then(m => ({ default: m.AdminServices })));
const AdminConfigs = React.lazy(() => import("./AdminConfigs").then(m => ({ default: m.AdminConfigs })));
const AdminPrintCatalog = React.lazy(() => import("./AdminPrintCatalog").then(m => ({ default: m.AdminPrintCatalog })));
const AdminFranchises = React.lazy(() => import("./AdminFranchises"));
const AdminAmbassadors = React.lazy(() => import("./AdminAmbassadors").then(m => ({ default: m.AdminAmbassadors })));
const AdminInventory = React.lazy(() => import("./AdminInventory"));
const AdminLeads = React.lazy(() => import("./AdminLeadsPage").then(m => ({ default: m.AdminLeadsPage })));
const AdminGrowth = React.lazy(() => import("./AdminGrowth").then(m => ({ default: m.AdminGrowth })));
const AdminApprovalHub = React.lazy(() => import("./AdminApprovalHub").then(m => ({ default: m.AdminApprovalHub })));
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  FileText, 
  DollarSign, 
  Printer, 
  Briefcase,
  Settings,
  Layers,
  Trophy,
  Grid3X3,
  ShieldCheck,
  Package,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



const NAV_ITEMS = (activeTab: string, setActiveTab: (t: string) => void, stats: AdminStats | null, role: string): NavItem[] => {
  const allItems: NavItem[] = [
    { label: "Visão Geral",    onClick: () => setActiveTab("overview"),      isActive: activeTab === "overview",      icon: <LayoutDashboard size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Eventos",        onClick: () => setActiveTab("events"),        isActive: activeTab === "events",        icon: <Camera size={16} />,         badge: stats?.missingLinksCount },
    { label: "Membros",        onClick: () => setActiveTab("users"),         isActive: activeTab === "users",         icon: <Users size={16} />,          badge: stats?.pendingInvitesCount, hide: role === 'FRANCHISEE' },
    { label: "Orçamentos",     onClick: () => setActiveTab("quotes"),        isActive: activeTab === "quotes",        icon: <Briefcase size={16} />,      badge: stats?.pendingQuotesCount, hide: role === 'FRANCHISEE' },
    { label: "CRM & Leads",    onClick: () => setActiveTab("crm"),           isActive: activeTab === "crm",           icon: <Users size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Pedidos",        onClick: () => setActiveTab("orders"),        isActive: activeTab === "orders",        icon: <FileText size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Financeiro",     onClick: () => setActiveTab("finance"),       isActive: activeTab === "finance",       icon: <DollarSign size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Impressão",      onClick: () => setActiveTab("printers"),      isActive: activeTab === "printers",      icon: <Printer size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Franquias",      onClick: () => setActiveTab("franchises"),    isActive: activeTab === "franchises",     icon: <ShieldCheck size={16} /> },
    { label: "Estoque Central",onClick: () => setActiveTab("inventory"),     isActive: activeTab === "inventory",      icon: <Package size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Catálogo",        onClick: () => setActiveTab("print-catalog"), isActive: activeTab === "print-catalog", icon: <Layers size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Serviços",       onClick: () => setActiveTab("services"),      isActive: activeTab === "services",      icon: <Grid3X3 size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Growth",         onClick: () => setActiveTab("growth"),        isActive: activeTab === "growth",        icon: <TrendingUp size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Aprovações",     onClick: () => setActiveTab("approvals"),     isActive: activeTab === "approvals",     icon: <UserCheck size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Concursos",      onClick: () => setActiveTab("contests"),      isActive: activeTab === "contests",      icon: <Trophy size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Configurações",  onClick: () => setActiveTab("settings"),      isActive: activeTab === "settings",      icon: <Settings size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Embaixadores",   onClick: () => setActiveTab("ambassadors"),   isActive: activeTab === "ambassadors",   icon: <Users size={16} />, hide: role === 'FRANCHISEE' },
  ];

  return allItems.filter(item => !item.hide);
};

interface AdminStats {
  totalRevenue: number;
  revenue30d: number;
  growth: number;
  totalOrders: number;
  activeEvents: number;
  totalUsers: number;
  pendingQuotesCount: number;
  pendingInvitesCount: number;
  missingLinksCount: number;
}

interface AdminOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface AdminEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  _count: { orders: number };
}

// Mapa de alias de URL → tab key (para deep-link via ?tab=X ou path antigo)
const TAB_ALIASES: Record<string, string> = {
  payouts:      "finance",
  financeiro:   "finance",
  finance:      "finance",
  users:        "users",
  membros:      "users",
  events:       "events",
  eventos:      "events",
  configs:      "settings",
  configuracoes: "settings",
  settings:     "settings",
  leads:        "crm",
  crm:          "crm",
  orders:       "orders",
  pedidos:      "orders",
  quotes:       "quotes",
  orcamentos:   "quotes",
  franchises:   "franchises",
  franquias:    "franchises",
  ambassadors:  "ambassadors",
  embaixadores: "ambassadors",
  inventory:    "inventory",
  estoque:      "inventory",
  printers:     "printers",
  impressao:    "printers",
  services:     "services",
  servicos:     "services",
  contests:     "contests",
  concursos:    "contests",
  catalog:      "print-catalog",
  catalogo:     "print-catalog",
  growth:       "growth",
  approvals:    "approvals",
  aprovacoes:   "approvals",
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // A-01: Resolve o tab ativo da URL (path `/admin/financeiro` ou param `?tab=finance`), com fallback para "overview"
  const pathSegment = location.pathname.replace('/admin/', '').replace('/admin', '').split('/')[0];
  const rawTab = pathSegment || searchParams.get("tab") || "overview";
  const activeTab = TAB_ALIASES[rawTab] ?? rawTab;

  const setActiveTab = useCallback((tab: string) => {
    // Ao clicar na tab, atualizamos apenas a URL para o subpath limpo (deep-link moderno)
    navigate(`/admin/${tab}`);
  }, [navigate]);

  const handleEditEvent = (id: string) => {
    setEditingEventId(id);
    setActiveTab("events");
  };

  useEffect(() => {
    if (location.state?.editEventId) {
      setEditingEventId(location.state.editEventId);
      setActiveTab("events");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.editEventId, navigate, location.pathname, setActiveTab]);

  useEffect(() => {
    if (user?.role === 'FRANCHISEE' && activeTab === 'overview') {
      setActiveTab('franchises');
    }
  }, [user, activeTab, setActiveTab]);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/stats");
        
        // Fetch MRR
        try {
          const { data: mrrData } = await API.get("/admin/finance/subscriptions-mrr");
          data.stats.mrr = mrrData.mrr;
          data.stats.totalActiveSubscriptions = mrrData.totalActive;
        } catch (e) { console.error("Erro MRR:", e); }

        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setPendingEvents(data.pendingEvents);
      } catch (err) {
        console.error("Erro ao carregar stats globais:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, []);

  return (
    <DashboardLayout title="Operações Centrais" variant="tactical" navItems={NAV_ITEMS(activeTab, setActiveTab, stats, user?.role || '')}>
      <div style={{ padding: "clamp(8px, 2vw, 32px)", maxWidth: "100%", margin: "0 auto", minHeight: "100vh" }}>
        {/* Tab Content */}
        {loading && activeTab === "overview" ? (
           <div className="py-40 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
             <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
             <img src="/logo.png" alt="Logo" className="h-6 object-contain opacity-50 grayscale brightness-200" />
             <div className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse mt-2">Sincronizando Ativos Globais</div>
             <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500 to-transparent" />
           </div>
        ) : (
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <React.Suspense fallback={
                  <div className="py-20 flex flex-col items-center gap-6">
                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
                    <div className="text-[10px] font-display font-black uppercase tracking-[0.3em] text-emerald-500/40 animate-pulse">Acessando Módulo...</div>
                  </div>
                }>
                  {activeTab === "overview" && <AdminOverview stats={stats} recentOrders={recentOrders} pendingEvents={pendingEvents} onEditEvent={handleEditEvent} />}
                  {activeTab === "events"   && <AdminEvents initialEditEventId={editingEventId} onClose={() => setEditingEventId(null)} />}
                  {activeTab === "users"    && <AdminUsers />}
                  {activeTab === "quotes"   && <AdminQuotes />}
                  {activeTab === "orders"   && <AdminOrders />}
                  {activeTab === "finance"  && <AdminFinance />}
                  {activeTab === "printers" && <AdminSuppliers />}
                  {activeTab === "print-catalog" && <AdminPrintCatalog />}
                  {activeTab === "contests" && <AdminContests />}
                  {activeTab === "services" && <AdminServices />}
                  {activeTab === "settings" && <AdminConfigs />}
                  {activeTab === "crm"      && <AdminLeads />}
                  {activeTab === "franchises" && <AdminFranchises />}
                  {activeTab === "ambassadors" && <AdminAmbassadors />}
                  {activeTab === "growth"   && <AdminGrowth />}
                  {activeTab === "approvals" && <AdminApprovalHub />}
                  {activeTab === "inventory" && <AdminInventory />}
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
