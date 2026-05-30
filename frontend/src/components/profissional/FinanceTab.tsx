import { TrendingUp, DollarSign, Zap, Check, Download, Wallet, Clock, FileText, Table } from "lucide-react";
import type { ProfileData } from "./types";
import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { formatCurrency } from "../../lib/utils/formatters";
import { CashflowChart } from "./CashflowChart";

function formatDate(d: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return "Data inválida";
  }
}

interface FinanceTabProps {
  profile: ProfileData | null;
  monthlyGoal: number;
  isEditingGoal: boolean;
  tempGoal: string;
  onEditGoal: () => void;
  onTempGoalChange: (val: string) => void;
  onSaveGoal: () => void;
  onCancelGoal: () => void;
  onDownloadTaxReport: () => void;
}

export function FinanceTab({
  profile,
  monthlyGoal,
  isEditingGoal,
  tempGoal,
  onEditGoal,
  onTempGoalChange,
  onSaveGoal,
  onCancelGoal,
  onDownloadTaxReport,
}: FinanceTabProps) {
  const monthEarnings = profile?.stats?.monthEarnings || 0;
  const progressPct = Math.min(100, (monthEarnings / monthlyGoal) * 100);
  const remaining = Math.max(0, monthlyGoal - monthEarnings);
  const suggestedSales = Math.ceil(remaining / 150);

  const heatmapRows = [
    { t: "Manhã (08h-12h)", d: [1, 2, 1, 3, 5, 8, 4] },
    { t: "Tarde (12h-18h)", d: [2, 1, 3, 4, 7, 10, 6] },
    { t: "Noite (18h-22h)", d: [0, 1, 1, 2, 6, 9, 3] },
  ];

  const [summary, setSummary] = useState<{available: number, pending: number, totalCount: number} | null>(null);
  const [conversionData, setConversionData] = useState<{
    totalEvents: number;
    totalOrders: number;
    totalPaidOrders: number;
    totalRevenue: number;
    ticketMedio: number;
    conversionRate: string;
  } | null>(null);

  useEffect(() => {
    API.get("/me/payout-summary").then(({ data }) => setSummary(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!profile?.user?.id) return;
    API.get(`/analytics/professional/${profile.user.id}/conversion`)
      .then(({ data }) => setConversionData(data))
      .catch(() => {}); // Non-critical, silently skip
  }, [profile?.user?.id]);

  return (
    <div className="space-y-8">
      <div className="lux-card rounded-2xl p-8 md:p-16 relative overflow-hidden bg-theme-bg border border-theme-border/60">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 space-y-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic">Performance Financeira</h3>
              <p className="text-[11px] text-theme-muted uppercase tracking-[0.4em] italic font-black">Extrato Tático de Repasses e Comissões</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onEditGoal}
                className="px-4 py-2 bg-theme-bg-muted border border-theme-border text-[9px] font-black text-theme-muted uppercase tracking-widest hover:border-brand-tactical/50 transition-all rounded-xl italic"
              >
                Ajustar Meta
              </button>
              <div className="flex items-center gap-2 group relative">
                <button
                  onClick={() => onDownloadTaxReport()}
                  className="px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-[9px] font-black text-brand-tactical uppercase tracking-widest hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-tactical/20 transition-all rounded-xl italic flex items-center gap-2"
                >
                  <Download size={12} />
                  Relatório Tributário
                </button>
                <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-theme-bg border border-theme-border shadow-xl rounded-xl overflow-hidden z-50">
                   <button onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/tax-report?format=pdf`, '_blank')} className="px-4 py-3 text-[8px] font-black uppercase text-theme-text hover:bg-brand-tactical/10 flex items-center gap-2 border-b border-theme-border/30">
                      <FileText size={10} className="text-brand-tactical" /> PDF (MEI)
                   </button>
                   <button onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/tax-report?format=csv`, '_blank')} className="px-4 py-3 text-[8px] font-black uppercase text-theme-text hover:bg-brand-tactical/10 flex items-center gap-2">
                      <Table size={10} className="text-brand-tactical" /> CSV Excel
                   </button>
                </div>
              </div>
              <div className="bg-brand-tactical/10 px-6 py-3 border border-brand-tactical/20 flex items-center gap-3 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest">Ciclo de Repasse Ativo</span>
              </div>
            </div>
          </div>

          {/* REAL-TIME LIQUIDITY SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-theme-bg-muted border border-theme-border/60 rounded-2xl p-6 flex items-center justify-between group hover:border-brand-tactical/40 transition-all">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-brand-tactical/10 border border-brand-tactical/20 rounded-xl flex items-center justify-center text-brand-tactical">
                      <Wallet size={24} strokeWidth={1.5} />
                   </div>
                   <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic opacity-80">Saldo Disponível</span>
                      <p className="text-2xl font-heading font-black text-theme-text italic">{summary ? formatCurrency(summary.available) : "---"}</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[8px] font-black text-theme-muted uppercase tracking-[0.2em] block">Liquidação</span>
                   <span className="text-[10px] font-black text-brand-tactical uppercase italic">IMEDIATA</span>
                </div>
             </div>
             
             <div className="bg-theme-bg-muted border border-theme-border/60 rounded-2xl p-6 flex items-center justify-between group hover:border-amber-500/40 transition-all">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                      <Clock size={24} strokeWidth={1.5} />
                   </div>
                   <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic opacity-80">Garantia (Escrow)</span>
                      <p className="text-2xl font-heading font-black text-theme-text italic">{summary ? formatCurrency(summary.pending) : "---"}</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[8px] font-black text-theme-muted uppercase tracking-[0.2em] block">Liberação em</span>
                   <span className="text-[10px] font-black text-amber-500 uppercase italic">7 DIAS</span>
                </div>
             </div>
          </div>

          {/* CONVERSION ANALYTICS CARD (Phase 55) */}
          {conversionData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { label: "Eventos Ativos", value: String(conversionData.totalEvents), sub: "total de eventos" },
                { label: "Taxa de Conversão", value: `${conversionData.conversionRate}%`, sub: "visualizações → vendas" },
                { label: "Ticket Médio", value: formatCurrency(conversionData.ticketMedio), sub: "por pedido pago" },
                { label: "Vendas Confirmadas", value: String(conversionData.totalPaidOrders), sub: `de ${conversionData.totalOrders} pedidos` },
              ] as const).map((stat) => (
                <div key={stat.label} className="bg-theme-bg-muted border border-theme-border/60 rounded-2xl p-6 flex flex-col gap-2 hover:border-brand-tactical/40 transition-all">
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">{stat.label}</span>
                  <p className="text-2xl font-heading font-black text-brand-tactical italic leading-none">{stat.value}</p>
                  <span className="text-[8px] text-theme-muted uppercase font-bold tracking-wider">{stat.sub}</span>
                </div>
              ))}
            </div>
          )}

          {/* Projection & ROI Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Goal Progress */}
            <div className="lg:col-span-8 p-8 bg-brand-tactical/[0.03] border border-brand-tactical/30 rounded-2xl relative overflow-hidden group shadow-inner">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={80} /></div>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.3em] italic">Progresso da Meta Mensal</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-heading font-black text-theme-text italic">{Math.round(progressPct)}%</span>
                      <span className="text-[10px] font-bold text-theme-muted uppercase italic">concluído</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic mb-1">Target</p>
                    <p className="text-xl font-heading font-black text-theme-text italic leading-none">R$ {monthlyGoal.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <div className="h-3 bg-theme-bg-muted border border-theme-border/40 relative overflow-hidden rounded-full">
                  <div
                    className="absolute left-0 top-0 h-full bg-brand-tactical transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(133,185,172,0.4)] rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-theme-muted">Faturado: R$ {monthEarnings.toLocaleString("pt-BR")}</span>
                  <span className="text-brand-tactical italic">Faltam: R$ {remaining.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>

            {/* ROI Donut (static representation) */}
            <div className="lg:col-span-4 lux-card rounded-2xl p-8 flex flex-col bg-theme-bg-muted/40 border border-theme-border/60">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">ROI por Ativo</p>
                  <p className="text-[9px] text-theme-muted uppercase font-black tracking-widest">Distribuição de Receita</p>
                </div>
                <DollarSign size={16} className="text-theme-muted opacity-40" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                {[{ l: "FTS", v: "45%", o: 1 }, { l: "VDS", v: "30%", o: 0.6 }, { l: "ALB", v: "25%", o: 0.3 }].map((i) => (
                  <div key={i.l} className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-brand-tactical flex-shrink-0 rounded-md" style={{ opacity: i.o }} />
                    <span className="text-[9px] font-black text-theme-muted uppercase w-8">{i.l}</span>
                    <div className="flex-1 h-1.5 bg-theme-bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand-tactical rounded-full" style={{ width: i.v, opacity: i.o }} />
                    </div>
                    <span className="text-[10px] font-black text-theme-text italic">{i.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className="lg:col-span-12 p-8 bg-theme-bg-muted border border-theme-border/60 rounded-2xl flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-3 text-brand-tactical shrink-0">
                <Zap size={20} className="animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Insights de Aceleração</span>
              </div>
              <div className="h-px w-full md:w-px md:h-12 bg-theme-border/40" />
              <div className="flex-grow">
                {monthEarnings < monthlyGoal ? (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <p className="text-[12px] font-bold text-theme-text leading-relaxed uppercase italic text-center md:text-left">
                      Para bater sua meta, você precisa de aprox.{" "}
                      <span className="text-brand-tactical text-xl font-black">{suggestedSales}</span> novas vendas expressas.
                    </p>
                    <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest max-w-sm text-center md:text-left border-l border-brand-tactical/20 pl-6">
                      DICA: Ofereça um álbum impresso para seus últimos 3 clientes para acelerar o faturamento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-brand-tactical uppercase italic">META ATINGIDA! 🏆 OPERAÇÃO DE ALTA PERFORMANCE</p>
                    <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest">Você atingiu seu target tático. Continue escalando sua rede tática de conexões.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CASHFLOW PROJECTION (Phase 30) */}
          <div className="bg-theme-bg-muted/20 border border-theme-border/40 rounded-2xl p-8 md:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><TrendingUp size={120} /></div>
             <CashflowChart />
          </div>

          {/* Demand Heatmap */}
          <div className="bg-theme-bg border border-theme-border/60 rounded-2xl p-8 md:p-12 space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h3 className="text-xl font-heading font-black text-theme-text uppercase tracking-widest italic">Inteligência de Demanda Regional</h3>
                <p className="text-[11px] text-theme-muted uppercase tracking-[0.4em] italic font-black">Mapa de calor baseado no seu histórico e leads locais</p>
              </div>
              <div className="flex items-center gap-4 text-[8px] font-black uppercase text-theme-muted tracking-widest">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-tactical/10 rounded-sm" /> Baixa</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-tactical rounded-sm" /> Alta</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[600px] space-y-2">
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div />
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                    <div key={d} className="text-center text-[9px] font-black text-theme-muted uppercase tracking-widest italic">{d}</div>
                  ))}
                </div>
                {heatmapRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-8 gap-2 items-center">
                    <div className="text-right pr-4 text-[8px] font-black text-theme-muted uppercase tracking-tighter">{row.t}</div>
                    {row.d.map((val, dIdx) => (
                      <div
                        key={dIdx}
                        className="h-10 md:h-12 border border-theme-border/20 rounded-md transition-all hover:border-brand-tactical/50 cursor-crosshair relative group"
                        style={{ backgroundColor: `rgba(133, 185, 172, ${val / 10})`, boxShadow: val > 7 ? "inset 0 0 10px rgba(133,185,172,0.2)" : "none" }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-theme-bg/80 rounded-md">
                          <span className="text-[10px] font-black text-brand-tactical italic">{val * 12}% Fluxo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-theme-border/30 flex justify-between items-center">
              <p className="text-[9px] text-theme-muted uppercase font-black tracking-widest italic">Fonte: Inteligência Foto Segundo baseada nos últimos 90 dias</p>
              <div className="flex items-center gap-2 text-brand-tactical text-[9px] font-black uppercase italic tracking-widest">
                Sexta e Sábado (Tarde/Noite) <TrendingUp size={12} /> Peak
              </div>
            </div>
          </div>

          {/* Payout History */}
          <div className="space-y-4 pt-12">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-theme-border/40" />
              <h4 className="text-base font-heading font-black text-theme-text uppercase italic tracking-tighter">Histórico de Movimentações</h4>
            </div>
            {profile?.payoutHistory?.map((p) => (
              <div key={p.id} className="group flex flex-col md:flex-row justify-between md:items-center p-8 bg-theme-bg-muted/50 border border-theme-border/40 rounded-2xl hover:border-brand-tactical/40 transition-all gap-8">
                <div className="flex items-center gap-6">
                  <div className={`p-4 border rounded-xl ${p.status === "PAID" ? "bg-brand-tactical/10 border-brand-tactical/30 text-brand-tactical" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}>
                    {p.status === "PAID" ? <Check size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-black text-theme-text uppercase tracking-tight italic">
                      {p.payout?.weekStart ? formatDate(p.payout.weekStart) : "REPASSE OPERACIONAL"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-xl ${p.status === "PAID" ? "bg-brand-tactical text-theme-bg border-brand-tactical" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                        {p.status === "PAID" ? "LIQUIDADO" : "EM PROCESSAMENTO"}
                      </span>
                      <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest italic">{p.orderCount} VENDAS CONSOLIDADAS</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-6 border-t md:border-t-0 border-theme-border/40 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest mb-1 italic opacity-60">Montante Líquido</p>
                    <p className="text-3xl font-heading font-black text-brand-tactical italic leading-none">
                      <span className="text-sm mr-1 font-sans not-italic">R$</span>
                      {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {p.status === "PAID" && (
                    <button 
                      onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/receipt/${p.id}`, '_blank')}
                      className="p-3 bg-theme-bg-muted border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical/50 hover:scale-[1.02] rounded-xl transition-all shadow-lg cursor-pointer"
                      title="Baixar Recibo"
                    >
                      <Download size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!profile?.payoutHistory?.length && (
              <div className="py-24 text-center space-y-6 bg-theme-bg-muted/20 border border-dashed border-theme-border/40 rounded-2xl">
                <div className="flex justify-center text-theme-muted opacity-20"><DollarSign size={64} /></div>
                <p className="text-[11px] font-black text-theme-muted uppercase tracking-[0.4em] italic">Nenhum repasse liquidado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-theme-bg/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-theme-bg border border-brand-tactical rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h4 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-widest">Ajustar Meta Mensal</h4>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest">Defina seu objetivo de faturamento líquido</p>
            </div>
            <div className="relative">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => onTempGoalChange(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-brand-tactical font-heading font-black italic text-3xl rounded-xl outline-none focus:border-brand-tactical/50"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-theme-muted uppercase">BRL</div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancelGoal} className="flex-1 py-4 bg-theme-bg-muted border border-theme-border text-[10px] font-black text-theme-muted uppercase tracking-widest rounded-xl italic">
                Cancelar
              </button>
              <button onClick={onSaveGoal} className="flex-[2] py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-tactical/30 transition-all rounded-xl italic cursor-pointer">
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

