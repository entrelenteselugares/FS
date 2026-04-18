import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewProps {
  stats: any;
  recentOrders: any[];
  pendingEvents: any[];
}

export const AdminOverview: React.FC<OverviewProps> = ({ stats, recentOrders, pendingEvents }) => {
  // Prepara dados para os gráficos
  const chartData = recentOrders.map(o => ({
    name: new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    valor: Number(o.valor)
  })).reverse();

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 shadow-2xl">
        <div className="bg-black p-10 border-l-4 border-brand-olive">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-6">Receita Bruta</div>
          <div className="text-4xl font-serif text-white italic mb-2 tracking-tighter">R$ {stats?.totalRevenue.toFixed(2)}</div>
          <p className="text-[9px] text-zinc-800 uppercase tracking-widest font-bold">Protocolos Aprovados</p>
        </div>
        <div className="bg-black p-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-6">Ativos Reais</div>
          <div className="text-4xl font-serif text-white italic mb-2 tracking-tighter">{stats?.totalEvents}</div>
          <p className="text-[9px] text-zinc-800 uppercase tracking-widest font-bold">Eventos em Prateleira</p>
        </div>
        <div className="bg-black p-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-6">Liquidez Ledger</div>
          <div className="text-4xl font-serif text-white italic mb-2 tracking-tighter">{stats?.totalOrders}</div>
          <p className="text-[9px] text-zinc-800 uppercase tracking-widest font-bold">Vendas Convertidas</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Charts */}
        <div className="border border-white/5 p-10 bg-white/[0.01]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-500 mb-12 border-b border-white/5 pb-6">Timeline de Conversão</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#556b2f" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#556b2f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: "#3f3f46", fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: "#3f3f46", fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: "#000", border: "1px solid #18181b", borderRadius: 0}} />
                  <Area type="monotone" dataKey="valor" stroke="#556b2f" fillOpacity={1} fill="url(#gradValor)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas */}
        <div className="border border-white/5 p-10 bg-white/[0.01]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-500 mb-12 border-b border-white/5 pb-6">Pendências de Curadoria</h3>
          <div className="space-y-6">
            {pendingEvents.length > 0 ? pendingEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-white/5 bg-black/40 group hover:border-brand-olive/30 transition-all">
                <div>
                  <div className="text-[11px] text-white font-serif italic mb-1">{event.nomeNoivos}</div>
                  <div className="flex gap-4">
                     {!event.coverPhotoUrl && <span className="text-[8px] text-red-900 uppercase font-bold tracking-widest">Sem Capa</span>}
                     {!event.lightroomUrl && <span className="text-[8px] text-brand-olive uppercase font-bold tracking-widest">Sem Fotos</span>}
                  </div>
                </div>
                <button className="text-[9px] font-bold text-zinc-600 group-hover:text-white uppercase tracking-widest">Ajustar</button>
              </div>
            )) : (
              <div className="py-20 text-center text-[10px] text-zinc-800 italic uppercase tracking-widest">Todos os ativos estão normalizados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
