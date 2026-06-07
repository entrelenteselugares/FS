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
    { t: "Manhã", d: [1, 2, 1, 3, 5, 8, 4] },
    { t: "Tarde", d: [2, 1, 3, 4, 7, 10, 6] },
    { t: "Noite", d: [0, 1, 1, 2, 6, 9, 3] },
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
    <div className="space-y-4 sm:space-y-6">
      {/* TOP ROW: Header + Liquidez Tickers */}
      <div className="bg-theme-bg border border-theme-border rounded-xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">Performance Financeira</h3>
          <p className="text-[9px] text-theme-muted uppercase tracking-[0.3em] italic font-black">Extrato Tático de Repasses e Comissões</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Tickers */}
          <div className="flex gap-3">
            <div className="bg-theme-bg-muted border border-theme-border rounded-lg p-2.5 flex items-center gap-3 flex-1 sm:flex-none sm:min-w-[160px]">
              <div className="p-1.5 bg-brand-tactical/10 text-brand-tactical rounded-md"><Wallet size={14} /></div>
              <div className="flex-1">
                <div className="text-[7px] font-black text-theme-muted uppercase tracking-widest">Saldo Disponível</div>
                <div className="text-sm font-heading font-black text-theme-text italic leading-none mt-0.5">{summary ? formatCurrency(summary.available) : "---"}</div>
              </div>
            </div>
            <div className="bg-theme-bg-muted border border-theme-border rounded-lg p-2.5 flex items-center gap-3 flex-1 sm:flex-none sm:min-w-[160px]">
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md"><Clock size={14} /></div>
              <div className="flex-1">
                <div className="text-[7px] font-black text-theme-muted uppercase tracking-widest">Garantia (7 dias)</div>
                <div className="text-sm font-heading font-black text-theme-text italic leading-none mt-0.5">{summary ? formatCurrency(summary.pending) : "---"}</div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onEditGoal}
              className="px-3 py-2 bg-theme-bg-muted border border-theme-border text-[8px] font-black text-theme-text uppercase tracking-widest hover:border-brand-tactical/50 rounded-lg italic transition-all flex-1 sm:flex-none text-center"
            >
              Target
            </button>
            <div className="relative group flex flex-1 sm:flex-none">
              <button
                onClick={() => onDownloadTaxReport()}
                className="w-full justify-center px-3 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-[8px] font-black text-brand-tactical uppercase tracking-widest hover:bg-brand-tactical/90 hover:text-theme-bg rounded-lg italic flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={10} /> Tributos
              </button>
              <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-theme-bg border border-theme-border shadow-xl rounded-lg overflow-hidden z-50 min-w-[140px]">
                 <button onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/tax-report?format=pdf`, '_blank')} className="px-3 py-2.5 text-[8px] font-black uppercase text-theme-text hover:bg-brand-tactical/10 flex items-center gap-2 border-b border-theme-border cursor-pointer">
                    <FileText size={10} className="text-brand-tactical" /> PDF (MEI)
                 </button>
                 <button onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/tax-report?format=csv`, '_blank')} className="px-3 py-2.5 text-[8px] font-black uppercase text-theme-text hover:bg-brand-tactical/10 flex items-center gap-2 cursor-pointer">
                    <Table size={10} className="text-brand-tactical" /> CSV Excel
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN (MAIN) */}
        <div className="xl:col-span-8 flex flex-col gap-4 sm:gap-6">
          
          {/* Cashflow Projection */}
          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-sm">
             <div className="flex justify-between items-center mb-4 relative z-10">
               <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em] italic">Projeção de Fluxo de Caixa</h4>
               <div className="flex items-center gap-1.5 text-[7px] font-black text-theme-muted uppercase tracking-widest bg-theme-bg-muted px-2 py-1 rounded-md border border-theme-border">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical animate-pulse" /> AO VIVO
               </div>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><TrendingUp size={100} /></div>
             <div className="h-[220px] relative z-10">
               <CashflowChart />
             </div>
          </div>

          {/* Compact Payout History */}
          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm flex-1">
             <div className="flex items-center justify-between border-b border-theme-border/50 pb-2">
               <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Histórico de Movimentações</h4>
               <span className="text-[8px] text-theme-muted font-bold uppercase">{profile?.payoutHistory?.length || 0} Registros</span>
             </div>
             
             <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                {profile?.payoutHistory?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-theme-bg-muted border border-theme-border rounded-lg hover:border-brand-tactical/40 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 border rounded-md ${p.status === "PAID" ? "bg-brand-tactical/10 border-brand-tactical/30 text-brand-tactical" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}>
                        {p.status === "PAID" ? <Check size={14} /> : <TrendingUp size={14} />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-theme-text uppercase tracking-tight italic leading-none">
                          {p.payout?.weekStart ? formatDate(p.payout.weekStart) : "REPASSE OPERACIONAL"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-md ${p.status === "PAID" ? "bg-brand-tactical text-theme-bg border-brand-tactical" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                            {p.status === "PAID" ? "LIQUIDADO" : "PROCESSANDO"}
                          </span>
                          <span className="text-[7px] font-bold text-theme-muted uppercase tracking-widest italic">{p.orderCount} VENDAS</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-heading font-black text-brand-tactical italic leading-none">
                          <span className="text-[8px] mr-0.5 font-sans not-italic">R$</span>
                          {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {p.status === "PAID" && (
                        <button 
                          onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/receipt/${p.id}`, '_blank')}
                          className="p-2 bg-theme-bg border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical/50 rounded-md transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Baixar Recibo"
                        >
                          <Download size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!profile?.payoutHistory?.length && (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-theme-muted opacity-40">
                    <DollarSign size={24} />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] italic">Nenhum repasse</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN (SIDEBAR) */}
        <div className="xl:col-span-4 flex flex-col gap-4 sm:gap-6">
          
          {/* Conversion Mini Grid */}
          {conversionData && (
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Eventos", value: String(conversionData.totalEvents), color: "text-theme-text" },
                { label: "Conversão", value: `${conversionData.conversionRate}%`, color: "text-brand-tactical" },
                { label: "Ticket Médio", value: formatCurrency(conversionData.ticketMedio), color: "text-theme-text" },
                { label: "Vendas", value: String(conversionData.totalPaidOrders), color: "text-theme-text" },
              ] as const).map((stat) => (
                <div key={stat.label} className="bg-theme-bg border border-theme-border rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                  <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">{stat.label}</span>
                  <p className={`text-lg font-heading font-black italic leading-none ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Goal & ROI Combined */}
          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 sm:p-5 flex flex-col gap-5 shadow-sm">
            {/* Goal */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic mb-0.5">Progresso da Meta</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-heading font-black text-theme-text italic leading-none">{Math.round(progressPct)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-theme-muted uppercase tracking-widest italic mb-0.5">Target Mensal</p>
                  <p className="text-sm font-heading font-black text-theme-text italic leading-none">R$ {monthlyGoal.toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="h-2 bg-theme-bg-muted border border-theme-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-tactical transition-all duration-1000 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="h-px bg-theme-border/50" />

            {/* ROI */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic">ROI por Ativo</p>
                <DollarSign size={12} className="text-theme-muted opacity-40" />
              </div>
              <div className="space-y-2">
                {[{ l: "FTS", v: "45%", o: 1 }, { l: "VDS", v: "30%", o: 0.6 }, { l: "ALB", v: "25%", o: 0.3 }].map((i) => (
                  <div key={i.l} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand-tactical rounded-sm" style={{ opacity: i.o }} />
                    <span className="text-[8px] font-black text-theme-muted uppercase w-6">{i.l}</span>
                    <div className="flex-1 h-1 bg-theme-bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand-tactical rounded-full" style={{ width: i.v, opacity: i.o }} />
                    </div>
                    <span className="text-[8px] font-black text-theme-text italic w-6 text-right">{i.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini Heatmap */}
          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
               <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">Demanda Regional</p>
               <TrendingUp size={12} className="text-theme-muted opacity-40" />
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-8 gap-1 mb-1">
                <div />
                {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                  <div key={i} className="text-center text-[7px] font-black text-theme-muted uppercase">{d}</div>
                ))}
              </div>
              {heatmapRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-8 gap-1 items-center">
                  <div className="text-right pr-2 text-[7px] font-black text-theme-muted uppercase">{row.t}</div>
                  {row.d.map((val, dIdx) => (
                    <div
                      key={dIdx}
                      className="h-4 sm:h-5 rounded-sm transition-all"
                      style={{ backgroundColor: `rgba(133, 185, 172, ${val / 10})` }}
                      title={`${val * 12}% Fluxo`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Alert */}
          <div className={`border rounded-xl p-3 sm:p-4 flex gap-3 ${monthEarnings < monthlyGoal ? 'bg-amber-500/5 border-amber-500/20' : 'bg-brand-tactical/5 border-brand-tactical/20'}`}>
            <Zap size={16} className={`shrink-0 ${monthEarnings < monthlyGoal ? 'text-amber-500 animate-pulse' : 'text-brand-tactical'}`} />
            <div className="space-y-1">
              <div className={`text-[9px] font-black uppercase tracking-widest ${monthEarnings < monthlyGoal ? 'text-amber-500' : 'text-brand-tactical'}`}>
                {monthEarnings < monthlyGoal ? 'Alerta Tático' : 'Meta Atingida'}
              </div>
              {monthEarnings < monthlyGoal ? (
                <p className="text-[10px] text-theme-text font-bold italic leading-snug">
                  Para bater a meta, feche aprox. <span className="text-amber-500 font-black">{suggestedSales}</span> vendas expressas. Ofereça álbuns impressos.
                </p>
              ) : (
                <p className="text-[10px] text-theme-text font-bold italic leading-snug">
                  Target alcançado! Continue expandindo sua rede.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-theme-bg/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-theme-bg border border-brand-tactical rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h4 className="text-lg font-heading font-black text-theme-text uppercase italic tracking-widest">Ajustar Meta</h4>
              <p className="text-[9px] text-theme-muted uppercase tracking-widest">Faturamento líquido mensal</p>
            </div>
            <div className="relative">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => onTempGoalChange(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-brand-tactical font-heading font-black italic text-2xl rounded-xl outline-none focus:border-brand-tactical/50"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-theme-muted uppercase">BRL</div>
            </div>
            <div className="flex gap-2">
              <button onClick={onCancelGoal} className="flex-1 py-3 bg-theme-bg-muted border border-theme-border text-[9px] font-black text-theme-muted uppercase tracking-widest rounded-xl italic cursor-pointer">
                Cancelar
              </button>
              <button onClick={onSaveGoal} className="flex-[2] py-3 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-tactical/90 rounded-xl italic cursor-pointer">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
