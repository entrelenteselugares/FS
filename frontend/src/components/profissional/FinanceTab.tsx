import { TrendingUp, DollarSign, Zap, Check, Download, Wallet, Clock, FileText, Table, BarChart2 } from "lucide-react";
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
      .catch(() => {});
  }, [profile?.user?.id]);

  return (
    <div className="space-y-4">
      {/* HEADER / QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-theme-text uppercase tracking-widest leading-none">Inteligência Financeira</h3>
          <p className="text-[9px] text-theme-muted uppercase tracking-[0.3em] font-bold mt-1">Visão consolidada de repasses e conversões</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <button
            onClick={onEditGoal}
            className="flex-1 md:flex-none px-4 py-2 border border-theme-border hover:border-brand-tactical/50 text-theme-text text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm"
          >
            Ajustar Meta
          </button>
          <div className="relative group flex-1 md:flex-none">
            <button
              onClick={onDownloadTaxReport}
              className="w-full flex justify-center items-center gap-1.5 px-3 md:px-4 py-2 bg-brand-tactical/10 text-brand-tactical border border-brand-tactical/30 hover:bg-brand-tactical hover:text-black rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm whitespace-nowrap"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Relatório de </span>Tributos
            </button>
            <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-theme-bg border border-theme-border shadow-2xl rounded-lg overflow-hidden z-50 min-w-[160px]">
              <button onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/tax-report?format=pdf`, '_blank')} className="px-4 py-3 text-[9px] font-bold uppercase text-theme-text hover:bg-brand-tactical/10 flex items-center gap-2 border-b border-theme-border transition-colors">
                <FileText size={12} className="text-brand-tactical" /> PDF (MEI)
              </button>
              <button onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/tax-report?format=csv`, '_blank')} className="px-4 py-3 text-[9px] font-bold uppercase text-theme-text hover:bg-brand-tactical/10 flex items-center gap-2 transition-colors">
                <Table size={12} className="text-brand-tactical" /> CSV Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-4 flex flex-col shadow-sm relative overflow-hidden group hover:border-brand-tactical/30 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet size={40} /></div>
          <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest z-10">Saldo Disponível</span>
          <p className="text-xl md:text-2xl font-heading font-bold text-brand-tactical mt-1 z-10">
            {summary ? formatCurrency(summary.available) : "---"}
          </p>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-4 flex flex-col shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Clock size={40} /></div>
          <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest z-10">A Receber (Garantia)</span>
          <p className="text-xl md:text-2xl font-heading font-bold text-amber-500 mt-1 z-10">
            {summary ? formatCurrency(summary.pending) : "---"}
          </p>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-4 flex flex-col shadow-sm relative overflow-hidden group hover:border-theme-muted transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10"><BarChart2 size={40} /></div>
          <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest z-10">Taxa de Conversão</span>
          <p className="text-xl md:text-2xl font-heading font-bold text-theme-text mt-1 z-10">
            {conversionData ? `${conversionData.conversionRate}%` : "---"}
          </p>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-4 flex flex-col shadow-sm relative overflow-hidden group hover:border-theme-muted transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp size={40} /></div>
          <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest z-10">Ticket Médio</span>
          <p className="text-xl md:text-2xl font-heading font-bold text-theme-text mt-1 z-10">
            {conversionData ? formatCurrency(conversionData.ticketMedio) : "---"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN CHART + GOAL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 md:p-5 shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.2em] ">Fluxo de Caixa Operacional</h4>
              <span className="text-[7px] font-bold bg-brand-tactical/10 text-brand-tactical px-2 py-1 rounded border border-brand-tactical/20 uppercase tracking-widest">Tempo Real</span>
            </div>
            <div className="h-[200px] w-full">
              <CashflowChart />
            </div>
          </div>

          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-5 items-center shadow-sm">
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest ">Progresso da Meta Mensal</p>
                  <p className="text-sm font-heading font-bold text-theme-text ">{Math.round(progressPct)}%</p>
                </div>
                <div className="h-2 bg-theme-bg-muted border border-theme-border rounded-full overflow-hidden">
                  <div className="h-full bg-brand-tactical transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-[8px] font-bold text-theme-muted uppercase">
                  <span>Alcançado: R$ {monthEarnings.toLocaleString("pt-BR")}</span>
                  <span>Target: R$ {monthlyGoal.toLocaleString("pt-BR")}</span>
                </div>
             </div>
             <div className={`w-full md:w-auto shrink-0 border rounded-xl p-3 flex gap-3 items-center ${monthEarnings < monthlyGoal ? 'bg-amber-500/5 border-amber-500/20' : 'bg-brand-tactical/5 border-brand-tactical/20'}`}>
                <Zap size={20} className={`${monthEarnings < monthlyGoal ? 'text-amber-500 animate-pulse' : 'text-brand-tactical'}`} />
                <div>
                  <div className={`text-[9px] font-black uppercase tracking-widest ${monthEarnings < monthlyGoal ? 'text-amber-500' : 'text-brand-tactical'}`}>
                    {monthEarnings < monthlyGoal ? 'Atenção Tática' : 'Meta Batida'}
                  </div>
                  <p className="text-[9px] text-theme-text font-medium leading-tight mt-0.5 max-w-[160px]">
                    {monthEarnings < monthlyGoal ? `Faltam ~${suggestedSales} vendas expressas para bater a meta.` : 'Target alcançado! Excelente trabalho.'}
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* SIDEBAR: HISTORY */}
        <div className="bg-theme-bg border border-theme-border rounded-xl p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-theme-border pb-3 mb-3">
            <h4 className="text-[10px] font-bold text-theme-text uppercase tracking-widest ">Movimentações</h4>
            <span className="text-[8px] bg-theme-bg-muted border border-theme-border px-2 py-0.5 rounded text-theme-muted font-bold uppercase">{profile?.payoutHistory?.length || 0} Registros</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: 'calc(100% - 40px)' }}>
            {profile?.payoutHistory?.map((p) => (
              <div key={p.id} className="flex flex-col p-3 bg-theme-bg-muted border border-theme-border rounded-lg hover:border-brand-tactical/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${p.status === "PAID" ? "bg-brand-tactical/20 text-brand-tactical" : "bg-amber-500/20 text-amber-500"}`}>
                      {p.status === "PAID" ? <Check size={10} /> : <Clock size={10} />}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-theme-text uppercase leading-none">
                        {p.payout?.weekStart ? formatDate(p.payout.weekStart) : "REPASSE"}
                      </p>
                      <span className={`text-[7px] font-black uppercase tracking-widest ${p.status === "PAID" ? "text-brand-tactical" : "text-amber-500"}`}>
                        {p.status === "PAID" ? "LIQUIDADO" : "PENDENTE"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-heading font-bold text-theme-text ">
                    R$ {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {p.status === "PAID" && (
                  <button 
                    onClick={() => window.open(`${API.defaults.baseURL}/profissional/finance/receipt/${p.id}`, '_blank')}
                    className="w-full py-1.5 border border-theme-border/50 bg-theme-bg text-[8px] font-bold uppercase tracking-widest text-theme-muted hover:text-brand-tactical hover:border-brand-tactical/30 rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Download size={10} /> Recibo PDF
                  </button>
                )}
              </div>
            ))}
            {!profile?.payoutHistory?.length && (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-theme-muted opacity-40">
                <DollarSign size={20} />
                <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Sem Histórico</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-theme-card border border-theme-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <h4 className="text-lg font-heading font-bold text-theme-text uppercase mb-1">Ajustar Target</h4>
            <p className="text-[9px] text-theme-muted uppercase tracking-widest mb-6">Faturamento líquido mensal esperado</p>
            
            <div className="relative mb-6">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => onTempGoalChange(e.target.value)}
                className="w-full bg-theme-bg border border-theme-border p-4 text-brand-tactical font-heading font-bold text-2xl rounded-xl outline-none focus:border-brand-tactical/50"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-theme-muted uppercase">BRL</div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={onCancelGoal} className="flex-1 py-3 border border-theme-border text-[9px] font-bold text-theme-muted uppercase tracking-widest rounded-xl hover:bg-theme-bg-muted transition-all">
                Cancelar
              </button>
              <button onClick={onSaveGoal} className="flex-[2] py-3 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 rounded-xl shadow-lg transition-all">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
