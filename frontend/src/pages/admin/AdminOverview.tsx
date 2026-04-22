import React from "react";
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { T } from "../../lib/theme";

interface OverviewStats {
  totalRevenue: number;
  activeEvents: number;
  totalOrders: number;
  totalUsers: number;
  pendingQuotesCount: number;
  pendingInvitesCount: number;
  missingLinksCount: number;
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
      {/* KPI Section — 3 Cards side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1 }}>
        
        {/* Card 1: Receita */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "24px 32px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 8 
          }}>
            Receita Bruta
          </label>
          <div style={{ 
            fontSize: 28, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase" 
          }}>
            R$ {Number(stats?.totalRevenue).toFixed(2)}
          </div>
        </div>

        {/* Card 2: Pedidos */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "24px 32px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 8 
          }}>
            Pedidos Liquidados
          </label>
          <div style={{ 
            fontSize: 28, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase" 
          }}>
            {stats?.totalOrders}
          </div>
        </div>

        {/* Card 3: Eventos */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "24px 32px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 8 
          }}>
            Eventos Ativos
          </label>
          <div style={{ 
            fontSize: 28, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase" 
          }}>
            {stats?.activeEvents}
          </div>
        </div>

        {/* Card 4: Convites Pendentes */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "24px 32px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 8 
          }}>
            Convites Pendentes
          </label>
          <div style={{ 
            fontSize: 28, fontFamily: T.fontD, fontWeight: 900, color: (stats?.pendingInvitesCount || 0) > 0 ? "#f87171" : T.text, textTransform: "uppercase" 
          }}>
            {stats?.pendingInvitesCount}
          </div>
        </div>

        {/* Card 5: Sem Links (Pedidos Ativos) */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "24px 32px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 8 
          }}>
            Vendas sem Entrega
          </label>
          <div style={{ 
            fontSize: 28, fontFamily: T.fontD, fontWeight: 900, color: (stats?.missingLinksCount || 0) > 0 ? T.brand : T.text, textTransform: "uppercase" 
          }}>
            {stats?.missingLinksCount}
          </div>
        </div>

        {/* Card 6: Novos Leads (Quotes) */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "24px 32px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 8 
          }}>
            Novos Leads (Orçamentos)
          </label>
          <div style={{ 
            fontSize: 28, fontFamily: T.fontD, fontWeight: 900, color: (stats?.pendingQuotesCount || 0) > 0 ? T.brand : T.text, textTransform: "uppercase" 
          }}>
            {stats?.pendingQuotesCount}
          </div>
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
