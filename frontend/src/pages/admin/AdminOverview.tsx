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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Section — 3 Cards side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1 }}>
        
        {/* Card 1: Receita */}
        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "12px 16px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 9, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 4 
          }}>
            Receita Bruta
          </label>
          <div style={{ 
            fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase" 
          }}>
            R$ {Number(stats?.totalRevenue || 0).toFixed(2)}
          </div>
        </div>

        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "12px 16px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 9, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 4 
          }}>
            Pedidos Liquidados
          </label>
          <div style={{ 
            fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase" 
          }}>
            {stats?.totalOrders || 0}
          </div>
        </div>

        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "12px 16px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 9, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 4 
          }}>
            Eventos Ativos
          </label>
          <div style={{ 
            fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase" 
          }}>
            {stats?.activeEvents || 0}
          </div>
        </div>

        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "12px 16px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 9, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 4 
          }}>
            Convites Pendentes
          </label>
          <div style={{ 
            fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: (stats?.pendingInvitesCount || 0) > 0 ? "#f87171" : T.text, textTransform: "uppercase" 
          }}>
            {stats?.pendingInvitesCount || 0}
          </div>
        </div>

        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "12px 16px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 9, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 4 
          }}>
            Vendas sem Entrega
          </label>
          <div style={{ 
            fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: (stats?.missingLinksCount || 0) > 0 ? T.brand : T.text, textTransform: "uppercase" 
          }}>
            {stats?.missingLinksCount || 0}
          </div>
        </div>

        <div style={{ 
          background: T.bgField, border: `1px solid ${T.border}`, padding: "12px 16px", borderRadius: 0 
        }}>
          <label style={{ 
            fontSize: 9, fontFamily: T.fontB, fontWeight: 700, 
            textTransform: "uppercase", letterSpacing: 1, color: T.text3, display: "block", marginBottom: 4 
          }}>
            Novos Leads (Orçamentos)
          </label>
          <div style={{ 
            fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: (stats?.pendingQuotesCount || 0) > 0 ? T.brand : T.text, textTransform: "uppercase" 
          }}>
            {stats?.pendingQuotesCount || 0}
          </div>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Charts */}
        <div style={{ 
          border: `1px solid ${T.border}`, 
          padding: "16px", 
          background: `${T.bgCard}88`,
          minHeight: 280
        }}>
          <h3 style={{ 
            fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: "0.4em", color: T.text3, marginBottom: 16,
            borderBottom: `1px solid ${T.border}`, paddingBottom: 8
          }}>
            Timeline de Conversão
          </h3>
          <div className="h-[200px] w-full" style={{ minWidth: 0, minHeight: 200 }}>
             <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.brand} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={T.brand} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: T.text3}} dy={10} />
                  <Tooltip contentStyle={{background: T.bg, border: `1px solid ${T.border}`, fontSize: 10, borderRadius: 0, color: T.text}} />
                  <Area type="monotone" dataKey="valor" stroke={T.brand} fillOpacity={1} fill="url(#gradValor)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas */}
        <div style={{ 
          border: `1px solid ${T.border}`, 
          padding: "16px", 
          background: `${T.bgCard}88`
        }}>
          <h3 style={{ 
            fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: "0.4em", color: T.text3, marginBottom: 16,
            borderBottom: `1px solid ${T.border}`, paddingBottom: 8
          }}>
            Pendências de Curadoria
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingEvents.length > 0 ? pendingEvents.map(event => (
              <div key={event.id} style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                padding: "10px 12px", border: `1px solid ${T.border}`, 
                background: T.bgCard, transition: "all 0.2s" 
              }}>
                <div>
                  <div style={{ 
                    fontSize: 12, color: T.text, fontWeight: 900, 
                    textTransform: "uppercase", letterSpacing: -0.5 
                  }}>{event.title}</div>

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                     {!event.coverPhotoUrl && <span style={{ fontSize: 8, color: "#f87171", textTransform: "uppercase", fontWeight: 900, letterSpacing: 1 }}>Sem Capa</span>}
                     {!event.lightroomUrl && <span style={{ fontSize: 8, color: T.brand, textTransform: "uppercase", fontWeight: 900, letterSpacing: 1 }}>Sem Fotos</span>}
                  </div>
                </div>
                <button style={{ 
                  background: "transparent", border: "none", color: T.text3, 
                  fontSize: 8, fontWeight: 900, textTransform: "uppercase", 
                  letterSpacing: 1.5, cursor: "pointer" 
                }}>Ajustar</button>
              </div>
            )) : (
              <div style={{ padding: "40px 0", textAlign: "center", fontSize: 9, color: T.text3, textTransform: "uppercase", fontWeight: 900, letterSpacing: 2 }}>Todos os ativos estão normalizados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
