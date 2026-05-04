import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API } from "../../lib/api";
import { 
  ShieldCheck, 
  Zap, 
  Trash2, 
  ArrowDownCircle, ArrowUpCircle, BarChart3,
  DollarSign
} from "lucide-react";

// Types for New Operational Management
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: "OPERACIONAL" | "MARKETING" | "LOGISTICA" | "INSUMO" | "FIXO";
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
  const [view, setView] = useState<"payouts" | "expenses" | "dre">("payouts");
  const [payoutTab, setPayoutTab] = useState<"pending" | "history">("pending");
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

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

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

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
      setNotification({ message: "Repasse liquidado com sucesso! 💸", type: 'success' });
      setConfirmModal(null);
      fetchPayouts();
    } catch {
      setNotification({ message: "Erro ao liquidar repasse.", type: 'error' });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = { ...newExpense, id: Math.random().toString(36).substr(2, 9) };
    setExpenses([expense, ...expenses]);
    setNewExpense({ description: "", amount: 0, category: "OPERACIONAL", date: new Date().toISOString().split('T')[0] });
    setNotification({ message: "Custo operacional lançado! 📊", type: 'success' });
    setTimeout(() => setNotification(null), 5000);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };


  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* MASTER HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border pb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Gestão Financeira 360</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Engenharia de Custos, Repasses e DRE Operacional</p>
        </div>
        
        <div className="flex bg-theme-bg-muted p-1.5 border border-theme-border overflow-x-auto no-scrollbar rounded-sm">
          <button onClick={() => setView("payouts")} className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-sm ${view === "payouts" ? 'bg-brand-tactical text-zinc-950 shadow-lg' : 'text-theme-muted hover:text-white'}`}>Repasses</button>
          <button onClick={() => setView("expenses")} className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-sm ${view === "expenses" ? 'bg-brand-tactical text-zinc-950 shadow-lg' : 'text-theme-muted hover:text-white'}`}>Lançamentos</button>
          <button onClick={() => setView("dre")} className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-sm ${view === "dre" ? 'bg-brand-tactical text-zinc-950 shadow-lg' : 'text-theme-muted hover:text-white'}`}>DRE / Dashboard</button>
        </div>
      </div>

      {/* DASHBOARD DE LIQUIDEZ E MARGEM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group hover:border-brand-tactical/50 transition-all">
           <div className="flex justify-between items-start"><span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Receita Bruta (Matriz)</span><ArrowUpCircle className="text-brand-tactical" size={14} /></div>
           <div className="text-2xl md:text-3xl font-heading font-black text-theme-text italic">{formatCurrency(financialData.grossRevenue)}</div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group hover:border-red-500/50 transition-all">
           <div className="flex justify-between items-start"><span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Custo Operacional</span><ArrowDownCircle className="text-red-500" size={14} /></div>
           <div className="text-2xl md:text-3xl font-heading font-black text-theme-text italic">{formatCurrency(financialData.totalExpenses)}</div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group hover:border-brand-tactical transition-all">
           <div className="flex justify-between items-start"><span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest">Lucro Líquido Real</span><DollarSign className="text-brand-tactical" size={14} /></div>
           <div className="text-2xl md:text-3xl font-heading font-black text-brand-tactical italic">{formatCurrency(financialData.netProfit)}</div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-5 space-y-3 group transition-all">
           <div className="flex justify-between items-start"><span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Margem Operacional</span><BarChart3 className="text-amber-500" size={14} /></div>
           <div className="text-2xl md:text-3xl font-heading font-black text-theme-text italic">{financialData.margin.toFixed(1)}%</div>
        </div>
      </div>

      {/* VIEW: REPASSES */}
      {view === "payouts" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex gap-2 border-b border-theme-border/30 pb-4">
             <button onClick={() => setPayoutTab("pending")} className={`px-6 py-2 text-[8px] font-black uppercase tracking-widest border transition-all ${payoutTab === 'pending' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-muted'}`}>PENDENTES</button>
             <button onClick={() => setPayoutTab("history")} className={`px-6 py-2 text-[8px] font-black uppercase tracking-widest border transition-all ${payoutTab === 'history' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-muted'}`}>HISTÓRICO</button>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center border border-theme-border bg-theme-bg-muted/10 text-[10px] text-theme-muted animate-pulse uppercase tracking-widest font-black italic">Auditando Fluxo...</div>
            ) : orders.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-4">
                 <ShieldCheck size={32} className="mx-auto text-theme-muted opacity-30" />
                 <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Fluxo de repasses em conformidade.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <React.Fragment key={order.id}>
                    {/* DESKTOP VIEW */}
                    <div className="hidden md:flex bg-theme-bg-muted border border-theme-border p-4 md:p-5 justify-between gap-4 md:gap-6 hover:border-brand-tactical/30 transition-all group">
                       <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black px-2 py-1 bg-brand-tactical text-zinc-950 uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                             <h4 className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter leading-none">{order.event.title}</h4>
                          </div>
                          <div className="grid grid-cols-4 gap-6 pt-5 border-t border-theme-border/10">
                             <div className="space-y-1.5"><span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60">Matriz</span><p className="text-base font-black text-theme-text italic">{formatCurrency(Number(order.splitMatriz) || 0)}</p></div>
                             {order.event.partners.captacao && <div className="space-y-1.5"><span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Captação</span><p className="text-base font-black text-theme-text italic">{formatCurrency(Number(order.splitCaptacao) || 0)}</p></div>}
                             {order.event.partners.edicao && <div className="space-y-1.5"><span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Edição</span><p className="text-base font-black text-theme-text italic">{formatCurrency(Number(order.splitEdicao) || 0)}</p></div>}
                             {order.event.partners.cartorio && <div className="space-y-1.5"><span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60">Unidade</span><p className="text-base font-black text-theme-text italic">{formatCurrency(Number(order.splitCartorio) || 0)}</p></div>}
                          </div>
                       </div>
                       <div className="flex items-center justify-center">
                          {payoutTab === 'pending' ? (
                            <button onClick={() => setConfirmModal(order.id)} className="bg-brand-tactical text-zinc-950 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3 active:scale-95"><Zap size={14} /> LIQUIDAR REPASSE</button>
                          ) : (
                            <div className="text-right border-l border-theme-border pl-8"><span className="text-[10px] font-black text-theme-muted uppercase tracking-widest block mb-2">Pago em</span><span className="text-[12px] font-black text-brand-tactical uppercase tracking-tighter">{fmtDate(order.payoutPaidAt)}</span></div>
                          )}
                       </div>
                    </div>

                    {/* MOBILE VIEW (CARD) */}
                    <div className="md:hidden bg-theme-bg-muted border border-theme-border p-5 space-y-6 hover:border-brand-tactical/30 transition-all">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <span className="text-[9px] font-black px-2 py-0.5 bg-brand-tactical text-zinc-950 uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                             <h4 className="text-base font-heading font-black text-theme-text uppercase tracking-tight">{order.event.title}</h4>
                          </div>
                          {payoutTab === 'history' && (
                             <div className="text-right">
                                <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block">Pago em</span>
                                <span className="text-[10px] font-black text-brand-tactical uppercase tracking-tighter">{fmtDate(order.payoutPaidAt)}</span>
                             </div>
                          )}
                       </div>

                       <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-theme-border/10">
                          <div className="space-y-1"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest opacity-60">Matriz</span><p className="text-sm font-black text-theme-text italic">{formatCurrency(Number(order.splitMatriz) || 0)}</p></div>
                          {order.event.partners.captacao && <div className="space-y-1"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Captação</span><p className="text-sm font-black text-theme-text italic">{formatCurrency(Number(order.splitCaptacao) || 0)}</p></div>}
                          {order.event.partners.edicao && <div className="space-y-1"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Edição</span><p className="text-sm font-black text-theme-text italic">{formatCurrency(Number(order.splitEdicao) || 0)}</p></div>}
                          {order.event.partners.cartorio && <div className="space-y-1"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest opacity-60">Unidade</span><p className="text-sm font-black text-theme-text italic">{formatCurrency(Number(order.splitCartorio) || 0)}</p></div>}
                       </div>

                       {payoutTab === 'pending' && (
                          <button onClick={() => setConfirmModal(order.id)} className="w-full bg-brand-tactical text-zinc-950 py-4 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Zap size={12} /> LIQUIDAR REPASSE</button>
                       )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: LANÇAMENTOS (EXPENSES) */}
      {view === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 animate-in fade-in duration-500">
           {/* Form - Engenharia de Custos */}
           <div className="lg:col-span-4 space-y-4">
              <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-6 space-y-4">
                 <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em]">Lançamento Tático</span>
                    <h3 className="text-lg font-heading text-theme-text uppercase tracking-tighter">Registrar Custo</h3>
                 </div>

                 <form onSubmit={handleAddExpense} className="space-y-3">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Descrição</label>
                       <input required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value.toUpperCase()})} placeholder="EX: CARTÃO MICRO SD 32GB" className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text font-black outline-none focus:border-brand-tactical uppercase" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Valor (R$)</label>
                          <input required type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-brand-tactical font-black outline-none focus:border-brand-tactical" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Data</label>
                          <input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text font-black outline-none focus:border-brand-tactical" />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Categoria</label>
                       <div className="grid grid-cols-2 gap-1.5">
                          {(['OPERACIONAL', 'LOGISTICA', 'INSUMO', 'FIXO'] as const).map(c => (
                            <button key={c} type="button" onClick={() => setNewExpense({...newExpense, category: c})} className={`py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${newExpense.category === c ? 'border-brand-tactical bg-brand-tactical text-zinc-950 shadow-md' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}>{c}</button>
                          ))}
                       </div>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="pt-3 border-t border-theme-border/20 space-y-2">
                       <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest block opacity-50 italic">Presets de Engenharia</span>
                       <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => setNewExpense({ description: "CARTÃO MICRO SD (Venda Bruta)", amount: 25, category: "INSUMO", date: new Date().toISOString().split('T')[0] })} className="px-2 py-1 bg-theme-bg border border-theme-border text-[10px] font-black text-theme-muted hover:border-brand-tactical hover:text-theme-text transition-all uppercase">+ CARTÃO SD (R$ 25)</button>
                          <button type="button" onClick={() => setNewExpense({ description: "TRANSPORTE / UBER OPERAÇÃO", amount: 15, category: "LOGISTICA", date: new Date().toISOString().split('T')[0] })} className="px-2 py-1 bg-theme-bg border border-theme-border text-[10px] font-black text-theme-muted hover:border-brand-tactical hover:text-theme-text transition-all uppercase">+ UBER (R$ 15)</button>
                          <button type="button" onClick={() => setNewExpense({ description: "CARTÕES DE VISITA (Lote)", amount: 120, category: "MARKETING", date: new Date().toISOString().split('T')[0] })} className="px-2 py-1 bg-theme-bg border border-theme-border text-[10px] font-black text-theme-muted hover:border-brand-tactical hover:text-theme-text transition-all uppercase">+ MARKETING</button>
                       </div>
                    </div>

                    <button type="submit" className="w-full bg-brand-tactical text-zinc-950 py-3.5 text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 active:scale-95 transition-all">LANÇAR DESPESA</button>
                 </form>
              </div>
           </div>

           {/* Ledger de Custos */}
           <div className="lg:col-span-8 space-y-4">
              <div className="bg-theme-bg-muted border border-theme-border overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-theme-border/30 bg-black/10">
                          <th className="p-4 text-[10px] font-black text-theme-muted uppercase tracking-widest">Data</th>
                          <th className="p-4 text-[10px] font-black text-theme-muted uppercase tracking-widest">Descrição</th>
                          <th className="p-4 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Categoria</th>
                          <th className="p-4 text-[10px] font-black text-theme-muted uppercase tracking-widest text-right">Valor</th>
                          <th className="p-4 w-10"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/10">
                       {expenses.length === 0 ? (
                         <tr>
                           <td colSpan={5} className="py-16 text-center text-[11px] text-theme-muted uppercase tracking-[0.4em] italic font-black">Nenhuma despesa operacional lançada.</td>
                         </tr>
                       ) : expenses.map(exp => (
                         <tr key={exp.id} className="group hover:bg-white/5 transition-all">
                             <td className="p-4 text-[11px] text-theme-muted font-black">{fmtDate(exp.date)}</td>
                            <td className="p-4 text-[11px] text-theme-text font-black uppercase tracking-tight">{exp.description}</td>
                            <td className="p-4 text-center">
                               <span className="text-[10px] font-black px-2 py-1 border border-theme-border text-theme-muted uppercase group-hover:border-zinc-500">{exp.category}</span>
                            </td>
                            <td className="p-4 text-right text-[12px] font-black text-red-500 italic">{formatCurrency(exp.amount)}</td>
                            <td className="p-4 text-right">
                               <button onClick={() => deleteExpense(exp.id)} className="text-zinc-600 hover:text-red-500 p-0.5 transition-all"><Trash2 size={14} /></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* VIEW: DRE / DASHBOARD */}
      {view === "dre" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 animate-in fade-in duration-500">
           <div className="bg-theme-bg-muted border border-theme-border p-6 md:p-10 space-y-8 md:space-y-10">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em]">Análise de Performance</span>
                 <h3 className="text-xl font-heading text-theme-text uppercase tracking-tighter italic">DRE Simplificado</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="flex justify-between items-center border-b border-theme-border/20 pb-4">
                    <span className="text-[11px] font-black text-theme-muted uppercase tracking-widest">Receita Bruta (Matriz)</span>
                    <span className="text-xl font-heading font-black text-theme-text italic">{formatCurrency(financialData.grossRevenue)}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-theme-border/20 pb-4 text-red-500">
                    <span className="text-[11px] font-black uppercase tracking-widest">(-) Despesas Totais</span>
                    <span className="text-xl font-heading font-black italic">{formatCurrency(financialData.totalExpenses)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-5">
                    <span className="text-[12px] font-black text-brand-tactical uppercase tracking-[0.3em]">Lucro Líquido (EBITDA)</span>
                    <span className="text-3xl font-heading font-black text-brand-tactical italic">{formatCurrency(financialData.netProfit)}</span>
                 </div>
              </div>

              <div className="bg-zinc-950/20 p-4 border border-theme-border italic text-[11px] text-theme-muted leading-relaxed uppercase tracking-widest font-bold">
                "O faturamento é vaidade, o lucro é sanidade, e o caixa é rei." — Foque em manter a margem acima de 30% para sustentar a escala da Foto Segundo.
              </div>
           </div>

           <div className="bg-theme-bg-muted border border-theme-border p-6 md:p-10 flex flex-col items-center justify-center space-y-8 md:space-y-10">
              <div className="relative w-40 h-40 flex items-center justify-center">
                 <div className="absolute inset-0 border-[12px] border-theme-border rounded-full opacity-20" />
                 <div className="absolute inset-0 border-[12px] border-brand-tactical rounded-full" style={{ clipPath: `polygon(50% 50%, -50% -50%, ${financialData.margin > 50 ? '150% -50%' : '50% -50%'}, 150% 150%, -50% 150%, -50% -50%)`, transform: `rotate(${(financialData.margin / 100) * 360}deg)` }} />
                 <div className="flex flex-col items-center">
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-8 w-full border-t border-theme-border pt-10">
                 <div className="text-center space-y-2">
                    <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Ponto de Equilíbrio</span>
                    <p className="text-lg font-heading font-black text-theme-text italic">ALCANÇADO</p>
                 </div>
                 <div className="text-center space-y-2">
                    <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Saúde de Caixa</span>
                    <p className="text-lg font-heading font-black text-brand-tactical italic">ESTÁVEL</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODALS & NOTIFICATIONS */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setConfirmModal(null)} />
           <div className="relative bg-theme-bg border border-theme-border w-full max-w-sm p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Protocolo Financeiro</span>
                 <h3 className="text-xl font-heading text-theme-text uppercase tracking-tighter leading-none">Confirmar Repasse?</h3>
              </div>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider leading-relaxed">VOCÊ CONFIRMA QUE JÁ EXECUTOU OS REPASSES PIX PARA TODOS OS PARCEIROS DESTE EVENTO?</p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button onClick={() => setConfirmModal(null)} className="p-4 border border-theme-border text-theme-muted text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">CANCELAR</button>
                 <button onClick={() => handleMarkAsPaid()} className="p-4 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">CONFIRMAR</button>
              </div>
           </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 right-10 z-[300] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-8 border ${notification.type === 'success' ? 'border-brand-tactical bg-theme-bg shadow-[0_0_40px_rgba(133,185,172,0.15)]' : 'border-red-900 bg-theme-bg'} min-w-[350px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-2">
                 <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>Protocolo Financeiro</span>
                 <p className="text-[13px] font-bold text-theme-text uppercase tracking-widest mt-1 leading-tight">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
