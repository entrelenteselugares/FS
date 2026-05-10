import React, { useState, useEffect } from "react";
import { DashboardLayout, type NavItem } from "../../components/DashboardLayout";
import { API } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

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
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



const NAV_ITEMS = (activeTab: string, setActiveTab: (t: string) => void, stats: AdminStats | null, role: string): NavItem[] => {
  const allItems: NavItem[] = [
    { label: "Visão Geral",    onClick: () => setActiveTab("overview"),      isActive: activeTab === "overview",      icon: <LayoutDashboard size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Eventos",        onClick: () => setActiveTab("events"),        isActive: activeTab === "events",        icon: <Camera size={16} />,         badge: stats?.missingLinksCount },
    { label: "Membros",        onClick: () => setActiveTab("users"),         isActive: activeTab === "users",         icon: <Users size={16} />,          badge: stats?.pendingInvitesCount, hide: role === 'FRANCHISEE' },
    { label: "Orçamentos",     onClick: () => setActiveTab("quotes"),        isActive: activeTab === "quotes",        icon: <Briefcase size={16} />,      badge: stats?.pendingQuotesCount, hide: role === 'FRANCHISEE' },
    { label: "Pedidos",        onClick: () => setActiveTab("orders"),        isActive: activeTab === "orders",        icon: <FileText size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Financeiro",     onClick: () => setActiveTab("finance"),       isActive: activeTab === "finance",       icon: <DollarSign size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Impressão",      onClick: () => setActiveTab("printers"),      isActive: activeTab === "printers",      icon: <Printer size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Franquias",      onClick: () => setActiveTab("franchises"),    isActive: activeTab === "franchises",     icon: <ShieldCheck size={16} /> },
    { label: "Estoque Central",onClick: () => setActiveTab("inventory"),     isActive: activeTab === "inventory",      icon: <Package size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Catálogo",        onClick: () => setActiveTab("print-catalog"), isActive: activeTab === "print-catalog", icon: <Layers size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Serviços",       onClick: () => setActiveTab("services"),      isActive: activeTab === "services",      icon: <Grid3X3 size={16} />, hide: role === 'FRANCHISEE' },
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

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const handleEditEvent = (id: string) => {
    setEditingEventId(id);
    setActiveTab("events");
  };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.editEventId) {
      setEditingEventId(location.state.editEventId);
      setActiveTab("events");
      // Clear state to prevent reopening on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.editEventId, navigate, location.pathname]);

  useEffect(() => {
    if (user?.role === 'FRANCHISEE' && activeTab === 'overview') {
      setActiveTab('franchises');
    }
  }, [user, activeTab]);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/stats");
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
             <div className="text-[11px] font-display font-black uppercase tracking-[0.4em] text-theme-text italic">FOTO SEGUNDO</div>
             <div className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Sincronizando Ativos Globais</div>
             <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500 to-transparent" />
           </div>
        ) : (
          <div className="pb-32">
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
                  {activeTab === "franchises" && <AdminFranchises />}
                  {activeTab === "ambassadors" && <AdminAmbassadors />}
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
