import React, { useState, useEffect } from "react";
import { DashboardLayout, type NavItem } from "../../components/DashboardLayout";
import { API } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

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
  ShieldCheck
} from "lucide-react";



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
    { label: "Cat. Impressão", onClick: () => setActiveTab("print-catalog"), isActive: activeTab === "print-catalog", icon: <Layers size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Serviços",       onClick: () => setActiveTab("services"),      isActive: activeTab === "services",      icon: <Grid3X3 size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Concursos",      onClick: () => setActiveTab("contests"),      isActive: activeTab === "contests",      icon: <Trophy size={16} />, hide: role === 'FRANCHISEE' },
    { label: "Configurações",  onClick: () => setActiveTab("settings"),      isActive: activeTab === "settings",      icon: <Settings size={16} />, hide: role === 'FRANCHISEE' },
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
           <div className="py-40 flex flex-col items-center gap-8">
             <div className="w-[1px] h-20 bg-white/5 animate-pulse" />
             <div className="text-[9px] text-zinc-800 uppercase tracking-widest font-bold">Consolidando Ativos...</div>
           </div>
        ) : (
          <div className="pb-32">
            <React.Suspense fallback={
              <div className="py-20 flex flex-col items-center gap-6">
                <div className="w-1 h-1 rounded-full bg-brand-tactical animate-ping" />
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-text/20">Acessando Módulo...</div>
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
            </React.Suspense>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
