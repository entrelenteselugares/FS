import React from "react";
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";


interface OverviewStats {
  totalRevenue: number;
  revenue30d: number;
  growth: number;
  activeEvents: number;
  totalOrders: number;
  totalUsers: number;
  pendingQuotesCount: number;

  pendingInvitesCount: number;
  missingLinksCount: number;
  mrr?: number;
  totalActiveSubscriptions?: number;
}

interface RecentOrder {
  id: string;
  createdAt: string;
  total: number | string;
}

interface PendingEvent {
  id: string;
  title: string;
  coverPhotoUrl?: string;
  lightroomUrl?: string;
}

interface OverviewProps {
  stats: OverviewStats | null;
  recentOrders: RecentOrder[];
  pendingEvents: PendingEvent[];
  onEditEvent: (id: string) => void;
}

export const AdminOverview: React.FC<OverviewProps> = ({ stats, recentOrders = [], pendingEvents = [], onEditEvent }) => {
  // Prepara dados para os gráficos
  const chartData = (recentOrders || []).map(o => ({
    name: o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "---",
    valor: Number(o.total || 0)
  })).reverse();


  return (
    <div className="space-y-12 relative overflow-hidden rounded-2xl">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div>
                        <p className="text-theme-muted mt-2 text-sm">Métricas e performance da plataforma</p>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-theme-border shadow-2xl rounded-2xl overflow-hidden">
        
        {/* KPI Card Template */}
        {[
          { label: "Receita Bruta", value: `R$ ${Number(stats?.totalRevenue || 0).toLocaleString("pt-BR")}`, color: "text-theme-text" },
          { label: "MRR (Assinaturas)", value: `R$ ${Number(stats?.mrr || 0).toLocaleString("pt-BR")}`, color: "text-emerald-500" },
          { label: "Assinaturas Ativas", value: stats?.totalActiveSubscriptions || 0, color: "text-emerald-500" },
          { label: "Eventos Ativos", value: stats?.activeEvents || 0, color: "text-brand-tactical" }
        ].map((kpi, i) => (
          <div key={i} className="bg-theme-bg p-6 space-y-2 rounded-2xl">
            <p className="text-[10px] uppercase tracking-widest text-theme-muted">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Chart */}
      <div className="bg-theme-bg border border-theme-border p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-theme-text uppercase mb-6 tracking-widest">Evolução de Vendas</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="valor" stroke="#FF4D00" fill="#FF4D00" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Events Section */}
      <div className="bg-theme-bg border border-theme-border p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-theme-text uppercase mb-6 tracking-widest">Eventos Pendentes</h3>
        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 border border-theme-border rounded-xl">
              <span className="text-sm font-medium">{event.title}</span>
              <button 
                onClick={() => onEditEvent(event.id)}
                className="px-4 py-2 text-xs font-bold bg-brand-tactical text-white rounded-xl hover:bg-brand-tactical/90 transition-colors"
              >
                EDITAR
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-brand-tactical/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
};
