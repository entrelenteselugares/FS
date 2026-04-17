import React, { useState, useEffect } from "react";
import { API } from "../contexts/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import type { NavItem } from "../components/DashboardLayout";

// ── Icons ──────────────────────────────────────────────────────────────
const IconFinanceiro = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconEventos = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconCartorio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ADMIN_NAV: NavItem[] = [
  { label: "Financeiro",  to: "/admin",       exact: true, icon: <IconFinanceiro /> },
  { label: "Eventos",     to: "/profissional",             icon: <IconEventos /> },
  { label: "Cartório",    to: "/cartorio",                 icon: <IconCartorio /> },
];

// ── Types ──────────────────────────────────────────────────────────────
interface Order {
  id: string;
  valor: string | number;
  status: string;
  createdAt: string;
  event?: { nomeNoivos?: string; cartorio?: string };
}

interface Stats {
  totalReceita: number;
  split: { matriz: number; cartorio: number; fotografo: number; editor: number };
  totalPedidos: number;
  aprovados: number;
  pendentes: number;
  orders: Order[];
}

interface FilterParams {
  startDate?: string;
  endDate?: string;
  cartorio?: string;
  status?: string;
}

const SPLIT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

// ── KPI Card ───────────────────────────────────────────────────────────
const KPICard: React.FC<{
  label: string; value: string; sub: string; color: string; accent?: string;
}> = ({ label, value, sub, color, accent }) => (
  <div className={`glass rounded-2xl p-5 ${accent ? `border-l-4 ${accent}` : ""}`}>
    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">{label}</div>
    <div className={`text-2xl font-black italic ${color} mb-1`}>{value}</div>
    <div className="text-[10px] text-zinc-600">{sub}</div>
  </div>
);

// ── Tooltip style shared ───────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: "#0a0a0a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  fontSize: 11,
};

// ── Component ──────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({
    startDate: "", endDate: "", cartorio: "", status: "",
  });

  const fetchStats = (f: FilterParams = filters) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (f.startDate) params.startDate = f.startDate;
    if (f.endDate) params.endDate = f.endDate;
    if (f.cartorio) params.cartorio = f.cartorio;
    if (f.status) params.status = f.status;
    API.get("/admin/stats", { params })
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const splitData = stats
    ? [
        { name: "Foto Segundo", valor: stats.split.matriz },
        { name: "Fotógrafo",    valor: stats.split.fotografo },
        { name: "Editor",       valor: stats.split.editor },
        { name: "Cartório",     valor: stats.split.cartorio },
      ]
    : [];

  const revenueByMonth = stats?.orders
    .filter((o) => o.status === "APROVADO")
    .reduce((acc: Record<string, number>, o) => {
      const month = new Date(o.createdAt).toLocaleString("pt-BR", { month: "short" });
      acc[month] = (acc[month] || 0) + Number(o.valor);
      return acc;
    }, {}) ?? {};
  const areaData = Object.entries(revenueByMonth).map(([mes, valor]) => ({ mes, valor }));

  const setFilter = (key: keyof FilterParams, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <DashboardLayout title="Dashboard Admin" navItems={ADMIN_NAV} variant="indigo">
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-indigo mb-2">
            Painel Financeiro
          </div>
          <h1 id="admin-dashboard-title" className="text-3xl font-black italic uppercase tracking-tighter">
            Visão Global de Receita
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">
            Monitoramento de vendas, comissões e distribuição financeira
          </p>
        </div>

        {/* ── Filter Bar ── */}
        <div className="glass rounded-2xl p-5 mb-8">
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-4">
            Filtros de Análise
          </div>
          <div id="admin-filters" className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                De
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilter("startDate", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                Até
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilter("endDate", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                Cartório / Região
              </label>
              <input
                id="filter-cartorio"
                value={filters.cartorio}
                onChange={(e) => setFilter("cartorio", e.target.value)}
                placeholder="Ex: Cartório Central"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-brand-indigo/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                Status
              </label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
              >
                <option value="">Todos</option>
                <option value="APROVADO">Aprovado</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                id="btn-apply-filters"
                onClick={() => fetchStats(filters)}
                className="flex-1 bg-brand-indigo hover:bg-brand-indigo/80 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl transition-all"
              >
                Aplicar
              </button>
              <button
                id="btn-clear-filters"
                onClick={() => {
                  const empty = { startDate: "", endDate: "", cartorio: "", status: "" };
                  setFilters(empty);
                  fetchStats(empty);
                }}
                title="Limpar filtros"
                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all border border-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-zinc-600 uppercase tracking-widest">Carregando dados...</div>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div id="kpi-cards" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPICard
                label="Receita Total" color="text-brand-emerald" accent="border-brand-emerald"
                value={`R$ ${(stats?.totalReceita ?? 0).toFixed(2)}`}
                sub="vendas aprovadas"
              />
              <KPICard
                label="Foto Segundo (40%)" color="text-brand-indigo" accent="border-brand-indigo"
                value={`R$ ${(stats?.split.matriz ?? 0).toFixed(2)}`}
                sub="participação da matriz"
              />
              <KPICard
                label="Pedidos Aprovados" color="text-white"
                value={String(stats?.aprovados ?? 0)}
                sub="transações concluídas"
              />
              <KPICard
                label="Pedidos Pendentes" color="text-yellow-400"
                value={String(stats?.pendentes ?? 0)}
                sub="aguardando confirmação"
              />
            </div>

            {/* ── Charts ── */}
            <div id="charts-section" className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Area chart – Receita por mês */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-5">
                  Receita por Mês
                </h3>
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="mes" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${v}`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]}
                      />
                      <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={2} fill="url(#gradValor)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-700 text-sm">
                    Sem dados para o período selecionado
                  </div>
                )}
              </div>

              {/* Bar chart – Split */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-5">
                  Divisão de Receita (Split)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={splitData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${v}`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Valor"]}
                    />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      {splitData.map((_, i) => (
                        <Cell key={i} fill={SPLIT_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Split Breakdown ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {splitData.map((item, i) => (
                <div key={item.name} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SPLIT_COLORS[i] }} />
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">{item.name}</div>
                  </div>
                  <div className="text-lg font-black italic text-white">R$ {item.valor.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* ── Orders Table ── */}
            <div id="orders-table" className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">
                  Extrato de Pedidos
                </h3>
                <span className="text-[10px] text-zinc-600">
                  {stats?.orders.length ?? 0} resultado(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500">
                      <th className="text-left px-6 py-3 font-black uppercase tracking-widest">Noivos</th>
                      <th className="text-left px-4 py-3 font-black uppercase tracking-widest hidden md:table-cell">Cartório</th>
                      <th className="text-left px-4 py-3 font-black uppercase tracking-widest">Data</th>
                      <th className="text-right px-4 py-3 font-black uppercase tracking-widest">Valor</th>
                      <th className="text-center px-4 py-3 font-black uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.orders.map((o) => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3.5 font-medium text-white">
                          {o.event?.nomeNoivos || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500 hidden md:table-cell">
                          {o.event?.cartorio || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500">
                          {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3.5 text-right text-white font-bold">
                          R$ {Number(o.valor).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            o.status === "APROVADO" ? "bg-brand-emerald/10 text-brand-emerald" :
                            o.status === "PENDENTE" ? "bg-yellow-400/10 text-yellow-400" :
                            "bg-red-400/10 text-red-400"
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!stats?.orders.length && (
                      <tr>
                        <td colSpan={5} className="text-center py-14 text-zinc-700">
                          Nenhum pedido encontrado para este período
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
