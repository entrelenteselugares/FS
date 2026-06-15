import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { API } from "../../lib/api";
import { 
  ShieldCheck, 
  Zap, 
  Trash2, 
  ArrowDownCircle, ArrowUpCircle, BarChart3,
  DollarSign,
  ArrowRight,
  X
} from "lucide-react";
import { toast } from "sonner";

// Types for New Operational Management
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: "OPERACIONAL" | "MARKETING" | "LOGISTICA" | "INSUMO" | "FIXO" | "INSUMOS FRANQUIA" | "ASSINATURAS";
  date: string;
}

import { formatCurrency, formatDateShort as fmtDate } from "../../lib/utils/formatters";

interface PayoutOrder {
  id: string;
  amount: number;
  updatedAt: string;
  payoutStatus: "PENDING" | "AVAILABLE" | "PAID" | "CANCELLED";
  payoutPaidAt?: string;
  event: {
    title: string;
    partners: {
      captacao?: { id: string; nome: string; pixKey: string; profissional: { captPct: number } };
      edicao?: { id: string; nome: string; pixKey: string; profissional: { editPct: number } };
      cartorio?: { id: string; nome: string; pixKey: string; cartorio: { splitPct: number } };
    };
  };
  splitMatriz?: number;
  splitCaptacao?: number;
  splitEdicao?: number;
  splitCartorio?: number;
}

export const AdminFinance: React.FC = () => {
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get("tab") as "payouts" | "balances" | "expenses" | "dre") || "payouts";
  const setView = (v: "payouts" | "balances" | "expenses" | "dre") => setSearchParams(prev => { prev.set("tab", v); return prev; }, { replace: true });
  
  const payoutTab = (searchParams.get("sub") as "pending" | "history") || "pending";
  const setPayoutTab = (s: "pending" | "history") => setSearchParams(prev => { prev.set("sub", s); return prev; }, { replace: true });
  const [confirmModal, setConfirmModal] = useState<string | null>(null);

  const [balances, setBalances] = useState<any[]>([]);
  const [settleLoading, setSettleLoading] = useState<string | null>(null);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
    description: "",
    amount: 0,
    category: "OPERACIONAL",
    date: new Date().toISOString().split('T')[0]
  });

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const url = payoutTab === "pending"
        ? "/admin/orders?readyForPayout=true"
        : "/admin/orders?payoutStatus=PAID&status=APROVADO";
      const { data } = await API.get(url);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Erro ao carregar repasses:", err);
    } finally {
      setLoading(false);
    }
  }, [payoutTab]);

  const fetchBalances = useCallback(async () => {
    try {
      const { data } = await API.get("/admin/finance/balances");
      setBalances(data);
    } catch (err) {
      console.error("Erro ao carregar saldos:", err);
    }
  }, []);

  useEffect(() => {
    if (view === "payouts") fetchPayouts();
    if (view === "balances") fetchBalances();
  }, [view, fetchPayouts, fetchBalances]);

  // Financial Stats Calculation
  const financialData = useMemo(() => {
    // Rely strictly on backend snapshots for split data
    const grossRevenue = orders
      .filter(o => o.payoutStatus === 'PAID' || payoutTab === 'pending')
      .reduce((acc, o) => acc + (Number(o.splitMatriz) || 0), 0);
      
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossRevenue - totalExpenses;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    
    return { grossRevenue, totalExpenses, netProfit, margin };
  }, [orders, expenses, payoutTab]);

  const handleMarkAsPaid = async () => {
    if (!confirmModal) return;
    try {
      await API.patch(`/admin/orders/${confirmModal}/payout`);
      toast.success("Repasse liquidado com sucesso! 💸");
      setConfirmModal(null);
      fetchPayouts();
    } catch {
      toast.error("Erro ao liquidar repasse.");
    }

  };

  const handleSettle = async (userId: string) => {
    setSettleLoading(userId);
    try {
      await API.post("/admin/finance/settle", { userId });
      toast.success("Repasse consolidado gerado com sucesso! 💎");
      fetchBalances();
    } catch {
      toast.error("Erro ao liquidar saldo.");
    } finally {
      setSettleLoading(null);

    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = { ...newExpense, id: Math.random().toString(36).substr(2, 9) };
    setExpenses([expense, ...expenses]);
    setNewExpense({ description: "", amount: 0, category: "OPERACIONAL", date: new Date().toISOString().split('T')[0] });
    toast.success("Custo operacional lançado! 📊");

  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };


  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/10 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-3 md:gap-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-theme-text">FINANCEIRO</h1>
            <p className="text-theme-muted mt-2 text-sm">Controle financeiro, repasses e DRE</p>
          </div>
          
          <div className="flex overflow-x-auto w-full xl:w-auto bg-theme-bg-muted p-1 border border-theme-border rounded-xl snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => setView("payouts")} className={`snap-start flex-none px-3 md:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap rounded-lg ${view === "payouts" ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'}`}>Pedidos</button>
            <button onClick={() => setView("balances")} className={`snap-start flex-none px-3 md:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap rounded-lg ${view === "balances" ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'}`}>Saldos Pros</button>
            <button onClick={() => setView("expenses")} className={`snap-start flex-none px-3 md:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap rounded-lg ${view === "expenses" ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'}`}>Lançamentos</button>
            <button onClick={() => setView("dre")} className={`snap-start flex-none px-3 md:px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap rounded-lg ${view === "dre" ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border/50' : 'text-theme-muted hover:text-theme-text'}`}>DRE / Dashboard</button>
          </div>
        </div>
      </div>

      {/* DASHBOARD DE LIQUIDEZ E MARGEM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group hover:border-brand-tactical/50 transition-all rounded-2xl">
           <div className="flex justify-between items-start"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Receita Bruta (Matriz)</span><ArrowUpCircle className="text-brand-tactical" size={14} strokeWidth={1.5} /></div>
           <div className="text-2xl md:text-3xl font-heading font-bold text-theme-text">{formatCurrency(financialData.grossRevenue)}</div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group hover:border-brand-danger/50 transition-all rounded-2xl">
           <div className="flex justify-between items-start"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Custo Operacional</span><ArrowDownCircle className="text-brand-danger" size={14} strokeWidth={1.5} /></div>
           <div className="text-2xl md:text-3xl font-heading font-bold text-theme-text">{formatCurrency(financialData.totalExpenses)}</div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group hover:border-brand-tactical transition-all rounded-2xl">
           <div className="flex justify-between items-start"><span className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest">Lucro Líquido Real</span><DollarSign className="text-brand-tactical" size={14} strokeWidth={1.5} /></div>
           <div className="text-2xl md:text-3xl font-heading font-bold text-brand-tactical">{formatCurrency(financialData.netProfit)}</div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group transition-all rounded-2xl">
           <div className="flex justify-between items-start"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Margem Operacional</span><BarChart3 className="text-brand-warning" size={14} strokeWidth={1.5} /></div>
           <div className="text-2xl md:text-3xl font-heading font-bold text-theme-text">{financialData.margin.toFixed(1)}%</div>
        </div>
      </div>

      {/* VIEW: REPASSES */}
      {view === "payouts" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex gap-2 border-b border-theme-border pb-4">
             <button onClick={() => setPayoutTab("pending")} className={`px-3 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${payoutTab === 'pending' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/10' : 'border-theme-border text-theme-muted'}`}>PENDENTES</button>
             <button onClick={() => setPayoutTab("history")} className={`px-3 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${payoutTab === 'history' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/10' : 'border-theme-border text-theme-muted'}`}>HISTÓRICO</button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center border border-theme-border bg-theme-bg text-[10px] text-theme-muted animate-pulse uppercase tracking-widest font-bold rounded-2xl">Auditando Fluxo...</div>
            ) : orders.length === 0 ? (
              <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/5 space-y-4 rounded-2xl">
                 <ShieldCheck size={32} strokeWidth={1.5} className="mx-auto text-theme-muted opacity-30" />
                 <p className="text-[9px] sm:text-[11px] font-bold text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] truncate max-w-[80vw]">Fluxo de Caixa e Liquidações</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <React.Fragment key={order.id}>
                    {/* DESKTOP VIEW */}
                    <div className="hidden md:flex bg-theme-bg-muted border border-theme-border p-4 md:p-5 justify-between gap-4 md:gap-6 hover:border-brand-tactical/30 transition-all group rounded-2xl">
                       <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold px-2 py-1 bg-brand-tactical text-zinc-950 uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                             <h4 className="text-lg font-bold text-theme-text uppercase">{order.event.title}</h4>
                          </div>
                          <div className="grid grid-cols-4 gap-3 md:gap-6 pt-5 border-t border-theme-border/10">
                             <div className="space-y-1.5"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Matriz</span><p className="text-base font-bold text-theme-text">{formatCurrency(Number(order.splitMatriz) || 0)}</p></div>
                             {order.event.partners.captacao && <div className="space-y-1.5"><span className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest opacity-60">Captação</span><p className="text-base font-bold text-brand-tactical">{formatCurrency(Number(order.splitCaptacao) || 0)}</p></div>}
                             {order.event.partners.edicao && <div className="space-y-1.5"><span className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest opacity-60">Edição</span><p className="text-base font-bold text-brand-tactical">{formatCurrency(Number(order.splitEdicao) || 0)}</p></div>}
                             {order.event.partners.cartorio && <div className="space-y-1.5"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Unidade</span><p className="text-base font-bold text-theme-text">{formatCurrency(Number(order.splitCartorio) || 0)}</p></div>}
                          </div>
                       </div>
                       <div className="flex items-center justify-center">
                          {payoutTab === 'pending' ? (
                            <button onClick={() => setConfirmModal(order.id)} className="border border-brand-tactical bg-brand-tactical/10 text-brand-tactical px-3 md:px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-tactical hover:text-zinc-950 transition-all flex items-center gap-2"><Zap size={14} strokeWidth={1.5} /> LIQUIDAR REPASSE</button>
                          ) : (
                            <div className="text-right border-l border-theme-border pl-8"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block mb-2">Pago em</span><span className="text-[12px] font-bold text-brand-tactical uppercase">{fmtDate(order.payoutPaidAt)}</span></div>
                          )}
                       </div>
                    </div>

                    {/* MOBILE VIEW (CARD) */}
                    <div className="md:hidden bg-theme-bg-muted border border-theme-border p-5 space-y-6 hover:border-brand-tactical/30 transition-all rounded-2xl">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-tactical text-zinc-950 uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                             <h4 className="text-base font-bold text-theme-text uppercase">{order.event.title}</h4>
                          </div>
                          {payoutTab === 'history' && (
                             <div className="text-right">
                                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block">Pago em</span>
                                <span className="text-[10px] font-bold text-brand-tactical uppercase">{fmtDate(order.payoutPaidAt)}</span>
                             </div>
                          )}
                       </div>

                       <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-theme-border/10">
                          <div className="space-y-1"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Matriz</span><p className="text-sm font-bold text-theme-text">{formatCurrency(Number(order.splitMatriz) || 0)}</p></div>
                          {order.event.partners.captacao && <div className="space-y-1"><span className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest opacity-60">Captação</span><p className="text-sm font-bold text-theme-text">{formatCurrency(Number(order.splitCaptacao) || 0)}</p></div>}
                          {order.event.partners.edicao && <div className="space-y-1"><span className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest opacity-60">Edição</span><p className="text-sm font-bold text-theme-text">{formatCurrency(Number(order.splitEdicao) || 0)}</p></div>}
                          {order.event.partners.cartorio && <div className="space-y-1"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Unidade</span><p className="text-sm font-bold text-theme-text">{formatCurrency(Number(order.splitCartorio) || 0)}</p></div>}
                       </div>

                       {payoutTab === 'pending' && (
                          <button onClick={() => setConfirmModal(order.id)} className="w-full border border-brand-tactical bg-brand-tactical/10 text-brand-tactical py-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"><Zap size={12} strokeWidth={1.5} /> LIQUIDAR REPASSE</button>
                       )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SALDOS PROS */}
      {view === "balances" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-theme-bg-muted border border-theme-border overflow-x-auto w-full rounded-2xl">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-theme-border bg-black/10">
                      <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest">Profissional</th>
                      <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest text-center">Pedidos</th>
                      <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest text-right">Pendente</th>
                      <th className="p-4 text-[10px] font-bold text-brand-tactical uppercase tracking-widest text-right">Disponível</th>
                      <th className="p-4 w-40"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/10">
                   {balances.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="py-24 text-center text-[11px] text-theme-muted uppercase tracking-[0.4em] font-bold">Nenhum saldo pendente na rede.</td>
                     </tr>
                   ) : balances.map(b => (
                     <tr key={b.userId} className="group hover:bg-theme-bg-muted transition-all">
                        <td className="p-4">
                           <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-theme-text uppercase">{b.nome}</span>
                              <span className="text-[9px] font-bold text-theme-muted uppercase">{b.email}</span>
                           </div>
                        </td>
                        <td className="p-4 text-center text-[11px] font-bold text-theme-muted">{b.orderCount} vds</td>
                        <td className="p-4 text-right text-[12px] font-bold text-theme-muted">{formatCurrency(b.pendingBalance)}</td>
                        <td className="p-4 text-right text-[14px] font-bold text-brand-tactical">{formatCurrency(b.availableBalance)}</td>
                        <td className="p-4 text-right">
                           {b.availableBalance > 0 ? (
                              <button 
                                onClick={() => handleSettle(b.userId)}
                                disabled={settleLoading === b.userId}
                                className={`px-4 py-2 text-[10px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest border border-brand-tactical text-brand-tactical hover:bg-brand-tactical hover:text-zinc-950 transition-all italic ${settleLoading === b.userId ? 'opacity-50 animate-pulse' : ''}`}
                              >
                                {settleLoading === b.userId ? "LIQUIDANDO..." : "GERAR REPASSE"}
                              </button>
                           ) : (
                              <span className="text-[9px] font-bold text-theme-muted uppercase opacity-40">AGUARDANDO ESCROW</span>
                           )}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

           {/* MOBILE CARDS */}
           <div className="md:hidden space-y-4">
              {balances.length === 0 ? (
                <div className="py-24 text-center text-[11px] text-theme-muted uppercase tracking-[0.4em] font-bold">Nenhum saldo pendente na rede.</div>
              ) : balances.map(b => (
                <div key={b.userId} className="bg-theme-bg border border-theme-border p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-theme-text uppercase">{b.nome}</div>
                      <div className="text-[10px] font-bold text-theme-muted uppercase">{b.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Pedidos</div>
                      <div className="text-xs font-bold text-theme-text">{b.orderCount} vds</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-theme-bg-muted p-3 rounded-lg border border-theme-border/50">
                    <div>
                      <div className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Pendente</div>
                      <div className="text-sm font-bold text-theme-muted">{formatCurrency(b.pendingBalance)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest">Disponível</div>
                      <div className="text-sm font-bold text-brand-tactical">{formatCurrency(b.availableBalance)}</div>
                    </div>
                  </div>
                  {b.availableBalance > 0 ? (
                    <button 
                      onClick={() => handleSettle(b.userId)}
                      disabled={settleLoading === b.userId}
                      className={`w-full py-3 text-[10px] font-black uppercase tracking-widest border border-brand-tactical text-brand-tactical rounded-lg hover:bg-brand-tactical hover:text-zinc-950 transition-all flex items-center justify-center gap-2 italic ${settleLoading === b.userId ? 'opacity-50 animate-pulse' : ''}`}
                    >
                      {settleLoading === b.userId ? "LIQUIDANDO..." : "GERAR REPASSE"}
                    </button>
                  ) : (
                    <div className="w-full py-3 text-center text-[10px] font-bold text-theme-muted uppercase opacity-40 border border-dashed border-theme-border rounded-lg">AGUARDANDO ESCROW</div>
                  )}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* VIEW: LANÇAMENTOS (EXPENSES) */}
      {view === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 md:gap-10 animate-in fade-in duration-500">
           {/* Form - Engenharia de Custos */}
           <div className="lg:col-span-4 space-y-4">
              <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-6 space-y-4 rounded-2xl">
                 <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.5em]">Lançamento Tático</span>
                    <h3 className="text-lg font-heading text-theme-text uppercase">Registrar Custo</h3>
                 </div>

                 <form onSubmit={handleAddExpense} className="space-y-3">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Descrição</label>
                       <input required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value.toUpperCase()})} placeholder="EX: CARTÃO MICRO SD 32GB" className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text font-bold outline-none focus:border-brand-tactical uppercase rounded-2xl" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Valor (R$)</label>
                          <input required type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-brand-tactical font-bold outline-none focus:border-brand-tactical rounded-2xl" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Data</label>
                          <input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text font-bold outline-none focus:border-brand-tactical rounded-2xl" />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Categoria</label>
                       <div className="grid grid-cols-2 gap-1.5">
                          {(['OPERACIONAL', 'LOGISTICA', 'INSUMO', 'FIXO', 'INSUMOS FRANQUIA', 'ASSINATURAS'] as const).map(c => (
                            <button key={c} type="button" onClick={() => setNewExpense({...newExpense, category: c})} className={`py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${newExpense.category === c ? 'border-brand-tactical bg-brand-tactical text-zinc-950 shadow-md' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}>{c}</button>
                          ))}
                       </div>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="pt-3 border-t border-theme-border space-y-2">
                       <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block opacity-50">Presets de Engenharia</span>
                       <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => setNewExpense({ description: "CARTÃO MICRO SD (Venda Bruta)", amount: 25, category: "INSUMO", date: new Date().toISOString().split('T')[0] })} className="px-2 py-1 bg-theme-bg border border-theme-border text-[10px] font-bold text-theme-muted hover:border-brand-tactical hover:text-theme-text transition-all uppercase rounded-2xl">+ CARTÃO SD (R$ 25)</button>
                          <button type="button" onClick={() => setNewExpense({ description: "TRANSPORTE / UBER OPERAÇÃO", amount: 15, category: "LOGISTICA", date: new Date().toISOString().split('T')[0] })} className="px-2 py-1 bg-theme-bg border border-theme-border text-[10px] font-bold text-theme-muted hover:border-brand-tactical hover:text-theme-text transition-all uppercase rounded-2xl">+ UBER (R$ 15)</button>
                          <button type="button" onClick={() => setNewExpense({ description: "CARTÕES DE VISITA (Lote)", amount: 120, category: "MARKETING", date: new Date().toISOString().split('T')[0] })} className="px-2 py-1 bg-theme-bg border border-theme-border text-[10px] font-bold text-theme-muted hover:border-brand-tactical hover:text-theme-text transition-all uppercase rounded-2xl">+ MARKETING</button>
                       </div>
                    </div>

                    <button type="submit" className="w-full bg-brand-tactical text-zinc-950 py-3.5 text-[11px] font-bold uppercase tracking-[0.4em] shadow-xl hover:brightness-110 active:scale-95 transition-all">LANÇAR DESPESA</button>
                 </form>
              </div>
           </div>

           {/* Ledger de Custos */}
           <div className="lg:col-span-8 space-y-4">
              {/* DESKTOP TABLE */}
              <div className="hidden md:block bg-theme-bg-muted border border-theme-border overflow-x-auto w-full rounded-2xl">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-theme-border bg-black/10">
                          <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest">Data</th>
                          <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest">Descrição</th>
                          <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest text-center">Categoria</th>
                          <th className="p-4 text-[10px] font-bold text-theme-muted uppercase tracking-widest text-right">Valor</th>
                          <th className="p-4 w-10"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/10">
                       {expenses.length === 0 ? (
                         <tr>
                           <td colSpan={5} className="py-16 text-center text-[11px] text-theme-muted uppercase tracking-[0.4em] font-bold">Nenhuma despesa operacional lançada.</td>
                         </tr>
                       ) : expenses.map(exp => (
                         <tr key={exp.id} className="group hover:bg-theme-bg-muted transition-all">
                             <td className="p-4 text-[11px] text-theme-muted font-bold">{fmtDate(exp.date)}</td>
                            <td className="p-4 text-[11px] text-theme-text font-bold uppercase">{exp.description}</td>
                            <td className="p-4 text-center">
                               <span className="text-[10px] font-bold px-2 py-1 border border-theme-border text-theme-muted uppercase group-hover:border-zinc-500">{exp.category}</span>
                            </td>
                            <td className="p-4 text-right text-[12px] font-bold text-brand-danger">{formatCurrency(exp.amount)}</td>
                            <td className="p-4 text-right">
                               <button onClick={() => deleteExpense(exp.id)} className="text-theme-muted hover:text-brand-danger p-0.5 transition-all"><Trash2 size={14} /></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

               {/* MOBILE CARDS */}
               <div className="md:hidden space-y-4">
                  {expenses.length === 0 ? (
                    <div className="py-16 text-center text-[11px] text-theme-muted uppercase tracking-[0.4em] font-bold">Nenhuma despesa operacional lançada.</div>
                  ) : expenses.map(exp => (
                    <div key={exp.id} className="bg-theme-bg border border-theme-border p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">{fmtDate(exp.date)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 border border-theme-border rounded-md text-theme-muted uppercase">{exp.category}</span>
                        </div>
                        <div className="text-sm font-bold text-theme-text uppercase truncate">{exp.description}</div>
                        <div className="text-sm font-bold text-brand-danger mt-1">{formatCurrency(exp.amount)}</div>
                      </div>
                      <button onClick={() => deleteExpense(exp.id)} className="p-3 text-theme-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))}
               </div>
            </div>
        </div>
      )}

      {/* VIEW: DRE / DASHBOARD */}
      {view === "dre" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 md:gap-10 animate-in fade-in duration-500">
           <div className="bg-theme-bg-muted border border-theme-border p-3 md:p-6 md:p-10 space-y-8 md:space-y-10 rounded-2xl">
              <div className="space-y-1">
                 <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.5em]">Análise de Performance</span>
                 <h3 className="text-xl font-heading text-theme-text uppercase">DRE Simplificado</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="flex justify-between items-center border-b border-theme-border pb-4">
                    <span className="text-[11px] font-bold text-theme-muted uppercase tracking-widest">Receita Bruta (Matriz)</span>
                    <span className="text-xl font-heading font-bold text-theme-text">{formatCurrency(financialData.grossRevenue)}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-theme-border pb-4 text-brand-danger">
                    <span className="text-[11px] font-bold uppercase tracking-widest">(-) Despesas Totais</span>
                    <span className="text-xl font-heading font-bold">{formatCurrency(financialData.totalExpenses)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-5">
                    <span className="text-[12px] font-bold text-brand-tactical uppercase tracking-[0.3em]">Lucro Líquido (EBITDA)</span>
                    <span className="text-3xl font-heading font-bold text-brand-tactical">{formatCurrency(financialData.netProfit)}</span>
                 </div>
              </div>

              <div className="bg-zinc-950/20 p-4 border border-theme-border text-[11px] text-theme-muted leading-relaxed uppercase tracking-widest font-bold">
                &quot;O faturamento é vaidade, o lucro é sanidade, e o caixa é rei.&quot; — Foque em manter a margem acima de 30% para sustentar a escala da Foto Segundo.
              </div>
           </div>

           <div className="bg-theme-bg-muted border border-theme-border p-3 md:p-6 md:p-10 flex flex-col items-center justify-center space-y-8 md:space-y-10 rounded-2xl">
              <div className="relative w-40 h-40 flex items-center justify-center">
                 <div className="absolute inset-0 border-[12px] border-theme-border rounded-full opacity-20" />
                 <div className="absolute inset-0 border-[12px] border-brand-tactical rounded-full" style={{ clipPath: `polygon(50% 50%, -50% -50%, ${financialData.margin > 50 ? '150% -50%' : '50% -50%'}, 150% 150%, -50% 150%, -50% -50%)`, transform: `rotate(${(financialData.margin / 100) * 360}deg)` }} />
                 <div className="flex flex-col items-center">
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-8 w-full border-t border-theme-border pt-10">
                 <div className="text-center space-y-2">
                    <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Ponto de Equilíbrio</span>
                    <p className="text-lg font-heading font-bold text-theme-text">ALCANÇADO</p>
                 </div>
                 <div className="text-center space-y-2">
                    <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Saúde de Caixa</span>
                    <p className="text-lg font-heading font-bold text-brand-tactical">ESTÁVEL</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODALS & NOTIFICATIONS */}
      {confirmModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setConfirmModal(null)} />
           <div className="relative w-full max-w-md bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-4 md:p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                    <ShieldCheck className="text-brand-tactical" size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold uppercase text-theme-text">Protocolo Financeiro</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Confirmação de Liquidez</p>
                  </div>
                </div>
                <button onClick={() => setConfirmModal(null)} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted"><X size={24} /></button>
              </div>

              <div className="p-4 md:p-8 md:p-10 space-y-6 text-center">
                 <h3 className="text-2xl font-bold text-theme-text uppercase leading-tight">Confirmar Repasse?</h3>
                 <p className="text-[11px] text-theme-muted font-bold uppercase tracking-widest leading-relaxed border-y border-theme-border/10 py-3 md:py-6">
                    VOCÊ CONFIRMA QUE JÁ EXECUTOU OS REPASSES PIX PARA TODOS OS PARCEIROS DESTE EVENTO? ESTA AÇÃO É IRREVERSÍVEL NO LEDGER.
                 </p>
              </div>

              {/* Footer */}
              <div className="p-4 md:p-8 md:p-10 bg-theme-bg-muted border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-5 border border-theme-border text-[11px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all rounded-[20px]">Cancelar</button>
                <button 
                  onClick={() => handleMarkAsPaid()} 
                  className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-bold uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] flex items-center justify-center gap-4"
                >
                  Confirmar Repasse
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </div>
           </div>
        </div>
      )}

      {null}
    </div>
  );
};
