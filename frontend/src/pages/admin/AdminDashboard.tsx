import React, { useState, useEffect } from "react";
import { DashboardLayout, type NavItem } from "../../components/DashboardLayout";
import { API } from "../../lib/api";

import { AdminOverview } from "./AdminOverview";
import { AdminEvents } from "./AdminEvents";
import { AdminUsers } from "./AdminUsers";
import { AdminOrders } from "./AdminOrders";

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Operações Centrais", to: "/admin", exact: true, icon: <IconDashboard /> },
];

const TABS = [
  { id: "overview", label: "Visão Geral", icon: "📊" },
  { id: "events", label: "Eventos", icon: "📸" },
  { id: "users", label: "Membros", icon: "🫂" },
  { id: "orders", label: "Pedidos", icon: "📑" },
];

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  activeEvents: number;
  totalUsers: number;
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
    <DashboardLayout title="Operações Centrais" variant="tactical" navItems={NAV_ITEMS}>
      <div className="p-10 max-w-7xl mx-auto min-h-screen">
        {/* Header Editorial */}
        <div className="mb-20 animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-1.5 h-8 bg-brand-tactical" />
            <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">
              Operations & Intelligence
            </div>
          </div>
          <h1 className="text-5xl md:text-8xl font-heading tracking-tighter text-white mb-6 uppercase font-black">
            Central de <span className="text-brand-tactical">Ativos</span>
          </h1>
          <p className="text-zinc-600 text-sm font-light uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
            Gestão estratégica de receita e rede de profissionais Foto Segundo.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-8 mb-16 border-b border-white/5 pb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all relative ${
                activeTab === tab.id ? "text-white" : "text-zinc-700 hover:text-zinc-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-1.5 bg-brand-tactical" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading && activeTab === "overview" ? (
           <div className="py-40 flex flex-col items-center gap-8">
             <div className="w-[1px] h-20 bg-white/5 animate-pulse" />
             <div className="text-[9px] text-zinc-800 uppercase tracking-widest font-bold">Consolidando Ativos...</div>
           </div>
        ) : (
          <div className="pb-32">
            {activeTab === "overview" && <AdminOverview stats={stats} recentOrders={recentOrders} pendingEvents={pendingEvents} />}
            {activeTab === "events"   && <AdminEvents />}
            {activeTab === "users"    && <AdminUsers />}
            {activeTab === "orders"   && <AdminOrders />}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
