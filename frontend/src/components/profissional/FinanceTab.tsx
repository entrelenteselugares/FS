import { TrendingUp, DollarSign, Zap, Check, Download } from "lucide-react";
import type { ProfileData } from "./types";

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="lux-card p-8 md:p-16 relative overflow-hidden bg-theme-bg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 space-y-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic">Performance Financeira</h3>
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic">Extrato Tático de Repasses e Comissões</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onEditGoal}
                className="px-4 py-2 bg-theme-bg-muted border border-theme-border text-[9px] font-black text-theme-muted uppercase tracking-widest hover:border-brand-tactical/50 transition-all italic"
              >
                Ajustar Meta
              </button>
              <button
                onClick={onDownloadTaxReport}
                className="px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-[9px] font-black text-brand-tactical uppercase tracking-widest hover:bg-brand-tactical hover:text-zinc-950 transition-all italic flex items-center gap-2"
              >
                <Download size={12} />
                Relatório Tributário
              </button>
              <div className="bg-brand-tactical/10 px-6 py-3 border border-brand-tactical/20 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest">Ciclo de Repasse Ativo</span>
              </div>
            </div>
          </div>

          {/* Projection & ROI Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Goal Progress */}
            <div className="lg:col-span-8 p-8 bg-brand-tactical/[0.03] border border-brand-tactical/30 relative overflow-hidden group shadow-inner">
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
                <div className="h-3 bg-theme-bg-muted border border-theme-border/40 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-brand-tactical transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(133,185,172,0.4)]"
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
            <div className="lg:col-span-4 lux-card p-8 flex flex-col bg-theme-bg-muted/40">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">ROI por Ativo</p>
                  <p className="text-[8px] text-theme-muted uppercase font-bold tracking-tighter">Distribuição de Receita</p>
                </div>
                <DollarSign size={16} className="text-theme-muted opacity-40" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                {[{ l: "FTS", v: "45%", o: 1 }, { l: "VDS", v: "30%", o: 0.6 }, { l: "ALB", v: "25%", o: 0.3 }].map((i) => (
                  <div key={i.l} className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-brand-tactical flex-shrink-0" style={{ opacity: i.o }} />
                    <span className="text-[9px] font-black text-theme-muted uppercase w-8">{i.l}</span>
                    <div className="flex-1 h-1.5 bg-theme-bg-muted">
                      <div className="h-full bg-brand-tactical" style={{ width: i.v, opacity: i.o }} />
                    </div>
                    <span className="text-[10px] font-black text-theme-text italic">{i.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className="lg:col-span-12 p-8 bg-theme-bg-muted border border-theme-border/60 flex flex-col md:flex-row items-center gap-8">
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
                    <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest">Você atingiu seu target tático. Continue escalando sua rede de empatia.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Demand Heatmap */}
          <div className="bg-theme-bg border border-theme-border/60 p-8 md:p-12 space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h3 className="text-xl font-heading font-black text-theme-text uppercase tracking-widest italic">Inteligência de Demanda Regional</h3>
                <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] italic font-bold">Mapa de calor baseado no seu histórico e leads locais</p>
              </div>
              <div className="flex items-center gap-4 text-[8px] font-black uppercase text-theme-muted tracking-widest">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-tactical/10" /> Baixa</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-tactical" /> Alta</span>
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
                        className="h-10 md:h-12 border border-theme-border/20 transition-all hover:border-brand-tactical/50 cursor-crosshair relative group"
                        style={{ backgroundColor: `rgba(133, 185, 172, ${val / 10})`, boxShadow: val > 7 ? "inset 0 0 10px rgba(133,185,172,0.2)" : "none" }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-theme-bg/80">
                          <span className="text-[10px] font-black text-brand-tactical italic">{val * 12}% Fluxo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-theme-border/30 flex justify-between items-center">
              <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest italic">Fonte: Inteligência Foto Segundo baseada nos últimos 90 dias</p>
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
              <div key={p.id} className="group flex flex-col md:flex-row justify-between md:items-center p-8 bg-theme-bg-muted/50 border border-theme-border/40 hover:border-brand-tactical/40 transition-all gap-8">
                <div className="flex items-center gap-6">
                  <div className={`p-4 border ${p.status === "PAID" ? "bg-brand-tactical/10 border-brand-tactical/30 text-brand-tactical" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}>
                    {p.status === "PAID" ? <Check size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-black text-theme-text uppercase tracking-tight italic">
                      {p.payout?.weekStart ? formatDate(p.payout.weekStart) : "REPASSE OPERACIONAL"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${p.status === "PAID" ? "bg-brand-tactical text-theme-bg border-brand-tactical" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                        {p.status === "PAID" ? "LIQUIDADO" : "EM PROCESSAMENTO"}
                      </span>
                      <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest italic">{p.orderCount} VENDAS CONSOLIDADAS</span>
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right border-t md:border-t-0 border-theme-border/40 pt-4 md:pt-0">
                  <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest mb-1 italic opacity-60">Montante Líquido</p>
                  <p className="text-3xl font-heading font-black text-brand-tactical italic leading-none">
                    <span className="text-sm mr-1 font-sans not-italic">R$</span>
                    {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            {!profile?.payoutHistory?.length && (
              <div className="py-24 text-center space-y-6 bg-theme-bg-muted/20 border border-dashed border-theme-border/40">
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
          <div className="w-full max-w-sm bg-theme-bg border border-brand-tactical p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h4 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-widest">Ajustar Meta Mensal</h4>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest">Defina seu objetivo de faturamento líquido</p>
            </div>
            <div className="relative">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => onTempGoalChange(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-brand-tactical font-heading font-black italic text-3xl outline-none focus:border-brand-tactical/50"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-theme-muted uppercase">BRL</div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancelGoal} className="flex-1 py-4 bg-theme-bg-muted border border-theme-border text-[10px] font-black text-theme-muted uppercase tracking-widest italic">
                Cancelar
              </button>
              <button onClick={onSaveGoal} className="flex-[2] py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] italic">
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

