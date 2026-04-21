import React, { useState, useEffect } from "react";
import { DashboardLayout, type NavItem } from "../../components/DashboardLayout";
import { API } from "../../lib/api";

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
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  FileText, 
  DollarSign, 
  Printer, 
  Briefcase
} from "lucide-react";




const NAV_ITEMS = (activeTab: string, setActiveTab: (t: string) => void): NavItem[] => [
  { label: "Visão Geral", to: "/admin", exact: true, icon: <LayoutDashboard size={16} />, isActive: activeTab === "overview", onClick: () => setActiveTab("overview") },
  { label: "Eventos", onClick: () => setActiveTab("events"), isActive: activeTab === "events", icon: <Camera size={16} /> },
  { label: "Membros", onClick: () => setActiveTab("users"), isActive: activeTab === "users", icon: <Users size={16} /> },
  { label: "Orçamentos", onClick: () => setActiveTab("quotes"), isActive: activeTab === "quotes", icon: <Briefcase size={16} /> },
  { label: "Pedidos", onClick: () => setActiveTab("orders"), isActive: activeTab === "orders", icon: <FileText size={16} /> },
  { label: "Financeiro", onClick: () => setActiveTab("finance"), isActive: activeTab === "finance", icon: <DollarSign size={16} /> },
  { label: "Impressão", onClick: () => setActiveTab("printers"), isActive: activeTab === "printers", icon: <Printer size={16} /> },
  { label: "Serviços", onClick: () => setActiveTab("services"), isActive: activeTab === "services", icon: <Briefcase size={16} /> },
];

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  activeEvents: number;
  totalUsers: number;
  pendingQuotesCount: number;
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
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
    <DashboardLayout title="Operações Centrais" variant="tactical" navItems={NAV_ITEMS(activeTab, setActiveTab)}>
      <div className="p-10 max-w-7xl mx-auto min-h-screen">
        {/* Header Editorial */}
        <div className="mb-8 md:mb-16 animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-4 text-proportional text-brand-primary mb-4">
            <div className="w-12 h-[1px] bg-brand-primary/40" />
            Comando Central
          </div>
          <h1 className="heading-luxury text-theme-text">
            ADMIN <span className="text-theme-text-muted">CONTROL</span>
          </h1>
          
          <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.4em] max-w-2xl leading-relaxed opacity-60">
            Gestão estratégica de receita e rede de profissionais foto segundo.
          </p>
        </div>


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
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Acessando Módulo...</div>
              </div>
            }>
              {activeTab === "overview" && <AdminOverview stats={stats} recentOrders={recentOrders} pendingEvents={pendingEvents} />}
              {activeTab === "events"   && <AdminEvents />}
              {activeTab === "users"    && <AdminUsers />}
              {activeTab === "quotes"   && <AdminQuotes />}
              {activeTab === "orders"   && <AdminOrders />}
              {activeTab === "finance"  && <AdminFinance />}
              {activeTab === "printers" && <AdminSuppliers />}
              {activeTab === "contests" && <AdminContests />}
              {activeTab === "services" && <AdminServices />}
              {activeTab === "settings" && <AdminConfigs />}
            </React.Suspense>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
