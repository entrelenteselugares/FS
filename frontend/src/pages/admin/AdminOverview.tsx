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
    <div className="space-y-12 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-brand-tactical/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-theme-border pb-10 gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
            Visão <span className="text-brand-tactical">Geral</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
              Consolidado da Operação Nacional
            </p>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-theme-border shadow-2xl">
        
        {/* KPI Card Template */}
        {[
          { label: "Receita Bruta", value: `R$ ${Number(stats?.totalRevenue || 0).toLocaleString("pt-BR")}`, color: "text-theme-text" },
          { label: "MRR (Assinaturas)", value: `R$ ${Number(stats?.mrr || 0).toLocaleString("pt-BR")}`, color: "text-emerald-500", growth: stats?.mrr ? stats.mrr > 0 ? 100 : 0 : undefined },
          { label: "Assinaturas Ativas", value: stats?.totalActiveSubscriptions || 0, color: "text-emerald-500" },
          { label: "Últimos 30 Dias", value: `R$ ${Number(stats?.revenue30d || 0).toLocaleString("pt-BR")}`, color: "text-brand-tactical", growth: stats?.growth },
          { label: "Pedidos Liquidados", value: stats?.totalOrders || 0, color: "text-theme-text" },
          { label: "Eventos Ativos", value: stats?.activeEvents || 0, color: "text-theme-text" },
          { label: "Vendas sem Entrega", value: stats?.missingLinksCount || 0, color: (stats?.missingLinksCount || 0) > 0 ? "text-brand-tactical" : "text-theme-text" },
          { label: "Novos Leads", value: stats?.pendingQuotesCount || 0, color: (stats?.pendingQuotesCount || 0) > 0 ? "text-brand-tactical" : "text-theme-text" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-theme-card p-8 group hover:bg-white/[0.02] transition-colors relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <label className="text-[9px] font-black uppercase tracking-widest text-theme-subtle block mb-4 italic">{kpi.label}</label>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl md:text-3xl font-display font-black italic tracking-tighter ${kpi.color}`}>
                {kpi.value}
              </div>
              {kpi.growth !== undefined && (
                <span className={`text-[10px] font-black ${kpi.growth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {kpi.growth >= 0 ? "↑" : "↓"} {Math.abs(kpi.growth)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Charts */}
        <div className="bg-theme-card border border-theme-border p-8 shadow-2xl relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical opacity-20 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted mb-8 italic">Timeline de Conversão</h3>
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                      <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: "rgba(255,255,255,0.2)", fontWeight: 800}} dy={10} />
                   <Tooltip contentStyle={{background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)", fontSize: 10, borderRadius: 0, color: "#fff"}} />
                   <Area type="monotone" dataKey="valor" stroke="var(--brand)" fillOpacity={1} fill="url(#gradValor)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

        {/* Alertas */}
        <div className="bg-theme-card border border-theme-border p-8 shadow-2xl relative">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted mb-8 italic">Pendências de Curadoria</h3>
          <div className="space-y-4">
            {pendingEvents.length > 0 ? pendingEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-5 border border-theme-border bg-white/[0.02] hover:border-brand-tactical/30 transition-all group">
                <div className="space-y-2">
                  <div className="text-sm font-display font-black text-theme-text uppercase italic tracking-widest">{event.title}</div>
                  <div className="flex gap-4">
                     {!event.coverPhotoUrl && <span className="text-[8px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 uppercase tracking-widest border border-red-500/20">Sem Capa</span>}
                     {!event.lightroomUrl && <span className="text-[8px] font-black bg-brand-tactical/10 text-brand-tactical px-2 py-0.5 uppercase tracking-widest border border-brand-tactical/20">Sem Fotos</span>}
                  </div>
                </div>
                <button 
                  onClick={() => onEditEvent(event.id)}
                  className="px-6 py-2 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-brand-tactical hover:border-brand-tactical transition-all"
                >Ajustar</button>
              </div>
            )) : (
              <div className="py-20 text-center">
                <div className="text-[10px] font-black text-theme-subtle uppercase tracking-[0.4em] italic">Ativos Normalizados</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
