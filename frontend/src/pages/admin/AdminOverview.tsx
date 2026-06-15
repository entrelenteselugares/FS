import React from "react";
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Camera, FileText, CheckCircle, Users } from "lucide-react";


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
  const navigate = useNavigate();

  // Prepara dados para os gráficos
  const chartData = (recentOrders || []).map(o => ({
    name: o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "---",
    valor: Number(o.total || 0)
  })).reverse();


  return (
    <div className="space-y-12 relative overflow-hidden rounded-2xl">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/10 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-3 md:gap-6 relative z-10">
          <div>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-theme-text uppercase">Visão Geral</h2>
            <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold">Métricas e performance da plataforma</p>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions (Super App) */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {[
          { label: "Novo Evento", icon: <Camera size={24} />, route: "/admin/events" },
          { label: "Orçamentos", icon: <FileText size={24} />, route: "/admin/quotes" },
          { label: "Aprovações", icon: <CheckCircle size={24} />, route: "/admin/approvals" },
          { label: "Membros", icon: <Users size={24} />, route: "/admin/users" },
        ].map((action, i) => (
          <button key={i} onClick={() => navigate(action.route)}
            className="flex flex-col items-center justify-center p-3 md:p-6 bg-theme-bg border border-theme-border rounded-2xl gap-3 text-theme-muted hover:text-theme-brand hover:border-brand-tactical/50 transition-all active:scale-95"
          >
            {action.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
          </button>
        ))}
      </div>

      {/* KPI Section */}
      <div className="flex md:grid overflow-x-auto snap-x snap-mandatory md:grid-cols-4 gap-3 md:gap-px md:bg-theme-bg-muted md:border md:border-theme-border md:shadow-2xl md:rounded-2xl md:overflow-hidden pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {/* KPI Card Template */}
        {[
          { label: "Receita Bruta", value: `R$ ${Number(stats?.totalRevenue || 0).toLocaleString("pt-BR")}`, color: "text-theme-text" },
          { label: "MRR (Assinaturas)", value: `R$ ${Number(stats?.mrr || 0).toLocaleString("pt-BR")}`, color: "text-theme-brand" },
          { label: "Assinaturas Ativas", value: stats?.totalActiveSubscriptions || 0, color: "text-theme-brand" },
          { label: "Eventos Ativos", value: stats?.activeEvents || 0, color: "text-brand-tactical" }
        ].map((kpi, i) => (
          <div key={i} className="min-w-[75vw] md:min-w-0 snap-center bg-theme-bg p-3 md:p-6 space-y-2 rounded-2xl border border-theme-border md:border-none md:rounded-none flex-shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-theme-muted">{kpi.label}</p>
            <p className={`text-2xl md:text-3xl font-heading font-black italic ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Chart */}
      <div className="bg-theme-bg border border-theme-border p-3 md:p-6 rounded-2xl">
        <h3 className="fs-section-title">Evolução de Vendas</h3>
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
      <div className="bg-theme-bg border border-theme-border p-3 md:p-6 rounded-2xl">
        <h3 className="fs-section-title">Eventos Pendentes</h3>
        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 border border-theme-border rounded-xl">
              <span className="text-sm font-bold text-theme-text">{event.title}</span>
              <button 
                onClick={() => onEditEvent(event.id)}
                className="px-4 py-2 text-xs font-bold border border-theme-border text-theme-text hover:bg-theme-bg-muted transition-colors rounded-xl uppercase tracking-widest"
              >
                EDITAR
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-brand-tactical/10 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
};
