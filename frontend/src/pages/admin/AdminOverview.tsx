import React from "react";
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewStats {
  totalRevenue: number;
  activeEvents: number;
  totalOrders: number;
  totalUsers: number;
  pendingQuotesCount: number;
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
}

export const AdminOverview: React.FC<OverviewProps> = ({ stats, recentOrders, pendingEvents }) => {
  // Prepara dados para os gráficos
  const chartData = recentOrders.map(o => ({
    name: new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    valor: Number(o.total)
  })).reverse();


  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-theme-border border border-theme-border shadow-2xl">
        <div className="bg-theme-bg p-10 border-l-4 border-brand-primary">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted mb-6">Receita Bruta</div>
          <div className="text-4xl font-sans text-theme-text font-black mb-2 tracking-tighter">R$ {stats?.totalRevenue.toFixed(2)}</div>
          <p className="text-[9px] text-theme-muted uppercase tracking-widest font-black">Protocolos Aprovados</p>
        </div>
        <div className="bg-theme-bg p-10 border-l border-theme-border/10">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted mb-6">Ativos Reais</div>
          <div className="text-4xl font-sans text-theme-text font-black mb-2 tracking-tighter">{stats?.activeEvents}</div>
          <p className="text-[9px] text-theme-muted uppercase tracking-widest font-black">Eventos em Prateleira</p>
        </div>
        <div className="bg-theme-bg p-10 border-l border-theme-border/10">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted mb-6">Conversão</div>
          <div className="text-4xl font-sans text-theme-text font-black mb-2 tracking-tighter">{stats?.totalOrders}</div>
          <p className="text-[9px] text-theme-muted uppercase tracking-widest font-black">Vendas Liquidadas</p>
        </div>
        <div className={`bg-theme-bg p-10 border-l-4 ${Number(stats?.pendingQuotesCount) > 0 ? "border-amber-500 animate-pulse" : "border-theme-border/10"}`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted mb-6">Leads Pendentes</div>
          <div className={`text-4xl font-sans font-black mb-2 tracking-tighter ${(Number(stats?.pendingQuotesCount) > 0) ? "text-amber-500" : "text-theme-text"}`}>
            {stats?.pendingQuotesCount || 0}
          </div>
          <p className="text-[9px] text-theme-muted uppercase tracking-widest font-black">Aguardando Precificação</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Charts */}
        <div className="border border-theme-border p-10 bg-theme-bg-muted/30 min-h-[450px]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-theme-muted mb-12 border-b border-theme-border pb-6">Timeline de Conversão</h3>
          <div className="h-[300px] w-full" style={{ minWidth: 0, minHeight: 300 }}>
             <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--theme-muted)'}} dy={10} />
                  <Tooltip contentStyle={{background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', fontSize: 10, borderRadius: 0, color: 'var(--theme-text)'}} />
                  <Area type="monotone" dataKey="valor" stroke="var(--brand-primary)" fillOpacity={1} fill="url(#gradValor)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas */}
        <div className="border border-theme-border p-10 bg-theme-bg-muted/30">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-theme-muted mb-12 border-b border-theme-border pb-6">Pendências de Curadoria</h3>
          <div className="space-y-6">
            {pendingEvents.length > 0 ? pendingEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-theme-border bg-theme-bg-muted group hover:border-brand-primary/30 transition-all font-sans">
                <div>
                  <div className="text-[14px] text-theme-text font-black mb-1 uppercase tracking-tighter">{event.title}</div>

                  <div className="flex gap-4">
                     {!event.coverPhotoUrl && <span className="text-[8px] text-red-500 uppercase font-black tracking-widest">Sem Capa</span>}
                     {!event.lightroomUrl && <span className="text-[8px] text-brand-primary uppercase font-black tracking-widest">Sem Fotos</span>}
                  </div>
                </div>
                <button className="text-[9px] font-black text-theme-muted group-hover:text-theme-text uppercase tracking-widest transition-all">Ajustar</button>
              </div>
            )) : (
              <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest font-black">Todos os ativos estão normalizados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
