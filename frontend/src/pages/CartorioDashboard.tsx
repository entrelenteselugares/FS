import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { API } from "../contexts/AuthContext";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import type { NavItem } from "../components/DashboardLayout";

// ── Icons ──────────────────────────────────────────────────────────────
const IconAgenda = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CARTORIO_NAV: NavItem[] = [
  { label: "Agenda & Repasse", to: "/cartorio", exact: true, icon: <IconAgenda /> },
];

// ── Types ──────────────────────────────────────────────────────────────
interface CartorioEvent {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  cartorio?: string;
  pedidos?: Array<{ status: string; valor: string | number }>;
}

interface CartorioStats {
  eventos: CartorioEvent[];
  eventosHoje: CartorioEvent[];
  estimativaRepasse: number;
}

// ── Component ──────────────────────────────────────────────────────────
export const CartorioDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [stats, setStats] = useState<CartorioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cartorioName, setCartorioName] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const mpConnected = searchParams.get("mp_connected");
    if (mpConnected) {
      // Usar um timeout pequeno para evitar renderização em cascata imediata se necessário,
      // mas o principal é remover a dependência direta do valor mutável se possível.
      setSuccess("Mercado Pago conectado com sucesso! ✅");
    }
  }, [searchParams]);

  const fetchStats = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (cartorioName) params.cartorioName = cartorioName;
    API.get("/cartorio/stats", { params })
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate, endDate, cartorioName]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <DashboardLayout title="Painel do Cartório" navItems={CARTORIO_NAV} variant="emerald">
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-emerald mb-2">
            Visão Financeira
          </div>
          <h1 id="cartorio-dashboard-title" className="text-3xl font-black italic uppercase tracking-tighter">
            Agenda & Repasse
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">
            Transparência sobre eventos e estimativa de recebimento da sua unidade
          </p>
        </div>

        {/* ── Mercado Pago Connection Banner ── */}
        <div
          id="cartorio-mp-connection"
          className={`glass rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 border-l-4 ${
            user?.mpUserId ? "border-brand-emerald" : "border-red-500/60"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black italic uppercase tracking-tight">Vincular Conta de Repasse</span>
              <span className={`flex items-center gap-1.5 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border ${
                user?.mpUserId
                  ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 animate-fade-in"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}>
                {user?.mpUserId && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {user?.mpUserId ? "Conta Verificada" : "Pendente"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              {user?.mpUserId
                ? "Sua conta Mercado Pago está pronta para receber os 10% de repasse."
                : "Conecte sua conta para automatizar o recebimento das suas comissões."}
            </p>
          </div>
          {!user?.mpUserId && (
            <button
              id="btn-cartorio-mp-connect"
              onClick={() => {
                const base = import.meta.env.VITE_API_URL || "";
                window.location.href = `${base}/api/mercadopago/connect`;
              }}
              className="flex-shrink-0 bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              Conectar Agora
            </button>
          )}
        </div>

        {/* ── Success banner ── */}
        {success && (
          <div className="mb-6 p-4 bg-brand-emerald/10 border border-brand-emerald/20 rounded-2xl text-brand-emerald text-sm font-medium animate-fade-in flex items-center gap-2">
            <span>✅</span> {success}
            <button onClick={() => setSuccess("")} className="ml-auto text-brand-emerald/60 hover:text-brand-emerald">✕</button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="glass rounded-2xl p-5 mb-8">
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-4">Filtros</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">De</label>
              <input
                id="cartorio-filter-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">Até</label>
              <input
                id="cartorio-filter-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">Unidade</label>
              <input
                id="cartorio-filter-name"
                value={cartorioName}
                onChange={(e) => setCartorioName(e.target.value)}
                placeholder="Nome do Cartório"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-brand-emerald/60 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                id="btn-cartorio-filter"
                onClick={fetchStats}
                className="w-full bg-brand-emerald hover:bg-brand-emerald/80 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl transition-all"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-zinc-600 uppercase tracking-widest">Carregando agenda...</div>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div id="cartorio-kpi-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Repasse highlight card */}
              <div className="glass rounded-2xl p-6 border-l-4 border-brand-emerald relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3">
                    Estimativa de Repasse
                  </div>
                  <div className="text-3xl font-black italic text-brand-emerald mb-1">
                    R$ {(stats?.estimativaRepasse ?? 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-600">10% sobre vendas aprovadas</div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3">
                  Total de Casamentos
                </div>
                <div className="text-3xl font-black italic text-white mb-1">
                  {stats?.eventos.length ?? 0}
                </div>
                <div className="text-[10px] text-zinc-600">no período selecionado</div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3">
                  Eventos Hoje
                </div>
                <div className={`text-3xl font-black italic mb-1 ${(stats?.eventosHoje.length ?? 0) > 0 ? "text-yellow-400" : "text-zinc-700"}`}>
                  {stats?.eventosHoje.length ?? 0}
                </div>
                <div className="text-[10px] text-zinc-600">cerimônias programadas</div>
              </div>
            </div>

            {/* ── Agenda Table ── */}
            <div id="cartorio-agenda" className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">
                  Agenda de Casamentos
                </h2>
                {(stats?.eventosHoje.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-yellow-400 text-[9px] font-black uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    {stats!.eventosHoje.length} hoje
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {stats?.eventos.map((ev) => {
                  const isToday = new Date(ev.dataEvento).toDateString() === new Date().toDateString();
                  const pedidos = ev.pedidos ?? [];
                  const approved = pedidos.filter((o) => o.status === "APROVADO").length;
                  const receita = pedidos
                    .filter((o) => o.status === "APROVADO")
                    .reduce((s, o) => s + Number(o.valor), 0);

                  return (
                    <div
                      key={ev.id}
                      className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                        isToday ? "bg-yellow-400/[0.04]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Status dot */}
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${
                          isToday ? "bg-yellow-400 animate-pulse" : "bg-zinc-700"
                        }`}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-black italic text-white truncate">{ev.nomeNoivos}</div>
                        <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>
                            {new Date(ev.dataEvento).toLocaleDateString("pt-BR", {
                              weekday: "long", day: "numeric", month: "long", year: "numeric",
                            })}
                          </span>
                          {ev.cartorio && (
                            <span className="text-zinc-700">· {ev.cartorio}</span>
                          )}
                          {isToday && (
                            <span className="text-yellow-400 font-bold text-[10px] uppercase tracking-widest">
                              Hoje
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Financial summary */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-brand-emerald">
                          R$ {(receita * 0.1).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          {approved} venda{approved !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!stats?.eventos.length && (
                  <div className="text-center py-16 text-zinc-700 text-sm">
                    Nenhum evento encontrado para este período
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
