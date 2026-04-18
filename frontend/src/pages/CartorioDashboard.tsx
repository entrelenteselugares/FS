import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API } from "../lib/api";
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
  { label: "Agenda & Ativos", to: "/cartorio", exact: true, icon: <IconAgenda /> },
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
  const [success, setSuccess] = useState(() => {
    const mpConnected = searchParams.get("mp_connected");
    return mpConnected ? "Mercado Pago conectado com sucesso! ✅" : "";
  });

  const fetchStats = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (cartorioName) params.cartorioName = cartorioName;
    API.get("/cartorio/stats", { params })
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <DashboardLayout title="Repasses Unidade" navItems={CARTORIO_NAV} variant={"olive" as any}>
      <div className="p-10 max-w-6xl mx-auto min-h-screen">
        {/* Page Header Editorial */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-[1px] h-6 bg-brand-olive" />
            <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-500">
              Gestão de Unidade
            </div>
          </div>
          <h1 id="cartorio-dashboard-title" className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-6 italic">
            Agenda & Receita
          </h1>
          <p className="text-zinc-600 text-sm font-light uppercase tracking-[0.2em]">
            Transparência analítica sobre eventos e fluxos de repasse.
          </p>
        </div>

        {/* ── Mercado Pago Connection Banner Editorial ── */}
        <div
          id="cartorio-mp-connection"
          className={`border p-8 mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 bg-white/[0.01] ${
            user?.mpUserId ? "border-brand-olive/20" : "border-red-900/20"
          }`}
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Vínculo de Ativos</span>
              <span className={`text-[8px] px-3 py-1 font-bold uppercase tracking-[0.2em] border ${
                user?.mpUserId
                  ? "border-brand-olive text-brand-olive bg-brand-olive/5"
                  : "border-red-900 text-red-700 bg-red-900/5"
              }`}>
                {user?.mpUserId ? "PROTOCOLO ATIVO" : "PENDÊNCIA FISCAL"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-light leading-relaxed uppercase tracking-widest">
              {user?.mpUserId
                ? "Sua conta Mercado Pago está devidamente vinculada para o recebimento de royalties de 10% sobre vendas."
                : "É necessária a vinculação de uma conta Mercado Pago para a automação de repasses financeiros."}
            </p>
          </div>
          {!user?.mpUserId && (
            <button
              id="btn-cartorio-mp-connect"
              onClick={() => {
                const base = import.meta.env.VITE_API_URL || "";
                window.location.href = `${base}/api/mercadopago/connect`;
              }}
              className="bg-white text-black hover:bg-zinc-200 font-bold text-[10px] uppercase tracking-[0.3em] px-8 py-4 transition-all"
            >
              Vincular Conta
            </button>
          )}
        </div>

        {/* ── Success banner ── */}
        {success && (
          <div className="mb-12 p-6 border border-brand-olive/20 bg-brand-olive/5 text-brand-olive text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-brand-olive animate-pulse" />
            {success}
            <button onClick={() => setSuccess("")} className="ml-auto opacity-40 hover:opacity-100">FECHAR</button>
          </div>
        )}

        {/* ── Filters Editorial ── */}
        <div className="border border-white/5 p-8 mb-16 bg-white/[0.01]">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 mb-8 border-b border-white/5 pb-4">Parâmetros</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-3">Início</label>
              <input
                id="cartorio-filter-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-2 text-[10px] text-white focus:outline-none focus:border-brand-olive transition-all invert brightness-200 opacity-60"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-3">Término</label>
              <input
                id="cartorio-filter-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-2 text-[10px] text-white focus:outline-none focus:border-brand-olive transition-all invert brightness-200 opacity-60"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700 mb-3">Nome da Unidade</label>
              <input
                id="cartorio-filter-name"
                value={cartorioName}
                onChange={(e) => setCartorioName(e.target.value)}
                placeholder="PROCURAR UNIDADE..."
                className="w-full bg-transparent border-b border-white/10 py-2 text-[10px] text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                id="btn-cartorio-filter"
                onClick={fetchStats}
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.3em] text-[10px] py-4 transition-all"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="w-[1px] h-20 bg-white/10 animate-pulse" />
            <div className="text-[9px] text-zinc-700 uppercase tracking-[0.5em] font-bold">Acessando Arquivos...</div>
          </div>
        ) : (
          <>
            {/* ── KPI Cards Editorial ── */}
            <div id="cartorio-kpi-cards" className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 mb-16">
              <div className="p-8 bg-white/[0.01]">
                <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-4">
                  Royalties de Repasse
                </div>
                <div className="text-4xl font-serif italic text-brand-olive mb-2">
                  R$ {(stats?.estimativaRepasse ?? 0).toFixed(2)}
                </div>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Quota Master (10%)</div>
              </div>

              <div className="p-8 bg-white/[0.01]">
                <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-4">
                  Eventos Consolidados
                </div>
                <div className="text-4xl font-serif italic text-white mb-2">
                  {stats?.eventos?.length ?? 0}
                </div>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Arquivo no Período</div>
              </div>

              <div className="p-8 bg-white/[0.01]">
                <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-4">
                  Protocolos Hoje
                </div>
                <div className={`text-4xl font-serif italic mb-2 ${(stats?.eventosHoje?.length ?? 0) > 0 ? "text-brand-olive" : "text-zinc-800"}`}>
                  {stats?.eventosHoje?.length ?? 0}
                </div>
                <div className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Casamentos Programados</div>
              </div>
            </div>

            {/* ── Agenda Table Editorial ── */}
            <div id="cartorio-agenda" className="border border-white/5 bg-black overflow-hidden mb-24">
              <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-400">
                  Agenda de Ativos
                </h2>
                {(stats?.eventosHoje?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-3 px-4 py-2 border border-brand-olive/20 text-brand-olive text-[8px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-brand-olive rounded-full animate-pulse" />
                    {stats?.eventosHoje?.length} PROTOCOLO(S) HOJE
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {stats?.eventos?.map((ev) => {
                  const isToday = new Date(ev.dataEvento).toDateString() === new Date().toDateString();
                  const pedidos = ev.pedidos ?? [];
                  const approved = pedidos.filter((o) => o.status === "APROVADO").length;
                  const receita = pedidos
                    .filter((o) => o.status === "APROVADO")
                    .reduce((s, o) => s + Number(o.valor), 0);

                  return (
                    <div
                      key={ev.id}
                      className={`px-10 py-6 flex items-center gap-8 transition-all group ${
                        isToday ? "bg-brand-olive/[0.03]" : "hover:bg-white/[0.01]"
                      }`}
                    >
                      {/* Identification */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-serif italic text-white group-hover:text-brand-olive transition-all underline underline-offset-4 decoration-white/5">
                          {ev.nomeNoivos}
                        </div>
                        <div className="text-[9px] text-zinc-600 mt-2 uppercase tracking-widest flex items-center gap-4 flex-wrap font-bold">
                          <span>
                            {new Date(ev.dataEvento).toLocaleDateString("pt-BR", {
                              weekday: "long", day: "numeric", month: "long", year: "numeric",
                            })}
                          </span>
                          {isToday && (
                            <span className="text-brand-olive">· HOJE</span>
                          )}
                        </div>
                      </div>

                      {/* Repasse Amount */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-serif italic text-white mb-1">
                          R$ {(receita * 0.1).toFixed(2)}
                        </div>
                        <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest group-hover:text-zinc-500 transition-colors">
                          {approved} Transação(ões)
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!stats?.eventos || stats.eventos.length === 0) && (
                  <div className="text-center py-24 text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-800">
                    Arquivo de eventos vazio
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
