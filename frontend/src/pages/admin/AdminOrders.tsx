import React, { useState, useEffect, useMemo, useCallback } from "react";
import { API } from "../../lib/api";
import { 
  Search, ChevronDown, ChevronRight, 
  CheckCircle2, Clock, PieChart, 
  TrendingUp, CreditCard, DollarSign,
  ArrowUpRight, Filter, Zap, Trash2
} from "lucide-react";

interface Order {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  buyerEmail?: string;
  eventId: string;
  manualType?: string;
  event: { title: string; slug: string };
  user?: { nome: string; email: string };
  splitMatriz?: number;
  splitCaptacao?: number;
  splitEdicao?: number;
  splitCartorio?: number;
  splitFranchisee?: number;
  passiveFranchisee?: string;
  shippingFee?: number;
  fulfillmentStatus?: string;
  trackingCode?: string;
  deliveryType?: string;
}

interface OrderGroup {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  orders: Order[];
  status: "QUITADO" | "PARCIAL" | "PENDENTE";
  latestDate: string;
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/orders", {
        params: { q: search, limit: 200 } 
      });
      setOrders(data.orders || []);
    } catch {
      console.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, OrderGroup> = {};

    orders.forEach(o => {
      const eid = o.eventId || o.event.slug;
      if (!groups[eid]) {
        groups[eid] = {
          eventId: eid,
          eventTitle: o.event.title,
          eventSlug: o.event.slug,
          clientName: o.user?.nome || "CONVIDADO",
          clientEmail: o.buyerEmail || o.user?.email || "—",
          totalAmount: 0,
          orders: [],
          status: "PENDENTE",
          latestDate: o.createdAt
        };
      }
      groups[eid].totalAmount += Number(o.amount);
      groups[eid].orders.push(o);
      if (new Date(o.createdAt) > new Date(groups[eid].latestDate)) {
        groups[eid].latestDate = o.createdAt;
      }
    });

    Object.values(groups).forEach(g => {
      const allPaid = g.orders.every(o => o.status === "APROVADO");
      const somePaid = g.orders.some(o => o.status === "APROVADO");
      if (allPaid) g.status = "QUITADO";
      else if (somePaid) g.status = "PARCIAL";
      else g.status = "PENDENTE";
    });

    let result = Object.values(groups);
    if (statusFilter !== "ALL") {
      result = result.filter(g => g.status === statusFilter);
    }

    return result.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const totalVolume = orders.filter(o => o.status === "APROVADO").reduce((acc, o) => acc + Number(o.amount), 0);
    const pendingCount = groupedOrders.filter(g => g.status === "PENDENTE").length;
    const ticketMedio = groupedOrders.length > 0 ? totalVolume / groupedOrders.length : 0;
    return { totalVolume, pendingCount, ticketMedio };
  }, [orders, groupedOrders]);

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Confirmar EXCLUSÃO DEFINITIVA deste pedido do Ledger? Esta ação é irreversível.")) return;
    try {
      await API.delete(`/admin/orders/${id}`);
      fetchOrders();
    } catch {
      alert("Erro ao excluir pedido.");
    }
  };

  const handleUpdateLogistics = async (id: string, fulfillmentStatus: string, trackingCode?: string) => {
    try {
      await API.patch(`/admin/orders/${id}/logistics`, { fulfillmentStatus, trackingCode });
      fetchOrders();
    } catch {
      alert("Erro ao atualizar logística.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER TÁTICO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border pb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Auditoria de Projetos</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Monitoramento de Fluxo e Transações</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} />
            <input
              type="text"
              placeholder="BUSCAR EVENTO OU E-MAIL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-theme-bg-muted border border-theme-border p-3.5 pl-10 text-[10px] text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all font-black"
            />
          </div>
        </div>
      </div>

      {/* DASHBOARD DE PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-5 space-y-3 group hover:border-brand-tactical/50 transition-all">
           <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Volume Bruto (Liquidado)</span>
              <DollarSign className="text-brand-tactical opacity-30" size={16} />
           </div>
           <div className="text-3xl font-heading font-black text-theme-text tracking-tighter italic">{formatCurrency(stats.totalVolume)}</div>
           <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <TrendingUp size={100} />
           </div>
        </div>
        
        <div className="bg-theme-bg-muted border border-theme-border p-6 space-y-4 relative overflow-hidden group hover:border-brand-tactical/50 transition-all">
           <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Ticket Médio / Projeto</span>
              <Zap className="text-amber-500 opacity-30" size={16} />
           </div>
           <div className="text-3xl font-heading font-black text-theme-text tracking-tighter italic">{formatCurrency(stats.ticketMedio)}</div>
        </div>

        <div className="bg-theme-bg-muted border border-theme-border p-4 space-y-3 relative overflow-hidden group hover:border-brand-tactical/50 transition-all">
           <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Projetos Pendentes</span>
              <Clock className="text-zinc-500 opacity-30" size={16} />
           </div>
           <div className="text-2xl md:text-3xl font-heading font-black text-theme-text tracking-tighter italic">{stats.pendingCount}</div>
        </div>
      </div>

      {/* FILTROS DE STATUS */}
      <div className="flex items-center gap-3 border-b border-theme-border/30 pb-6 overflow-x-auto no-scrollbar">
         <Filter size={14} className="text-theme-muted mr-2" />
         {(['ALL', 'QUITADO', 'PARCIAL', 'PENDENTE'] as const).map(f => (
           <button
             key={f}
             onClick={() => setStatusFilter(f)}
             className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === f ? 'border-brand-tactical bg-brand-tactical text-zinc-950' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}
           >
             {f === 'ALL' ? 'TODOS' : f}
           </button>
         ))}
      </div>

      {/* LISTA DE PROJETOS AUDITADOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/10">
            <div className="text-[10px] text-theme-muted animate-pulse uppercase tracking-[0.5em] font-black italic">Auditando Ledger Financeiro...</div>
          </div>
        ) : groupedOrders.length > 0 ? (
          groupedOrders.map((group) => (
            <div key={group.eventId} className="animate-in fade-in duration-500">
               <div 
                 onClick={() => setExpandedId(expandedId === group.eventId ? null : group.eventId)}
                 className={`flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-4 md:p-5 border transition-all cursor-pointer relative overflow-hidden ${expandedId === group.eventId ? 'border-brand-tactical bg-brand-tactical/5 shadow-inner' : 'border-theme-border bg-theme-bg-muted hover:border-zinc-500'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`p-3 border ${expandedId === group.eventId ? 'border-brand-tactical text-brand-tactical' : 'border-theme-border text-theme-muted'}`}>
                        {expandedId === group.eventId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider opacity-60 truncate max-w-[300px]">{group.clientName} · {group.clientEmail}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-12 ml-auto md:ml-0">
                     <div className="text-right hidden sm:block">
                        <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-50 mb-1">Total Bruto</span>
                        <div className="text-md md:text-lg font-heading font-black text-theme-text italic">{formatCurrency(group.totalAmount)}</div>
                     </div>
                     
                     <div className="text-center min-w-[120px]">
                        {group.status === "QUITADO" && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border border-brand-tactical text-brand-tactical bg-brand-tactical/10 text-[9px] font-black uppercase tracking-widest">
                             <CheckCircle2 size={12} /> {group.status}
                          </div>
                        )}
                        {group.status === "PARCIAL" && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border border-amber-500 text-amber-500 bg-amber-500/10 text-[9px] font-black uppercase tracking-widest">
                             <PieChart size={12} /> {group.status}
                          </div>
                        )}
                        {group.status === "PENDENTE" && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border border-theme-border text-theme-muted bg-theme-bg/30 text-[9px] font-black uppercase tracking-widest">
                             <Clock size={12} /> {group.status}
                          </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* LEDGER DE PARCELAS */}
               {expandedId === group.eventId && (
                 <div className="bg-theme-bg-muted/30 border-x border-b border-theme-border/40 p-4 md:p-6 lg:p-8 animate-in slide-in-from-top-4 duration-500 overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                       <thead>
                          <tr className="border-b border-theme-border/20">
                             <th className="py-4 text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] opacity-70">ID Ledger</th>
                             <th className="py-4 text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] opacity-70">Método / Data</th>
                             <th className="py-4 text-center text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] opacity-70">Divisão (Splits)</th>
                             <th className="py-4 text-right text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] opacity-70">Montante</th>
                             <th className="py-4 text-center text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] opacity-70">Status MP</th>
                             <th className="py-4 text-center text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] opacity-70">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-theme-border/20">
                          {group.orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => (
                            <tr key={o.id} className="group hover:bg-white/5 transition-all">
                               <td className="py-5 font-mono text-[10px] text-theme-muted group-hover:text-theme-text transition-colors">#{o.id.toUpperCase()}</td>
                               <td className="py-5">
                                  <div className="flex items-center gap-3">
                                     <CreditCard size={14} className="text-brand-tactical opacity-50" />
                                     <div>
                                        <div className="text-[11px] font-black text-theme-text uppercase tracking-widest">{o.manualType || "PARCELA DIGITAL"}</div>
                                        <div className="text-[9px] text-theme-muted font-bold opacity-60 uppercase">{new Date(o.createdAt).toLocaleString("pt-BR")}</div>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-5 text-center">
                                   <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px] mx-auto">
                                      {o.splitMatriz && <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-theme-text font-black rounded-sm border border-theme-border">MT: {formatCurrency(Number(o.splitMatriz))}</span>}
                                      {o.splitCaptacao && <span className="px-2 py-0.5 bg-brand-tactical/10 text-[8px] text-brand-tactical font-black rounded-sm border border-brand-tactical/20">CP: {formatCurrency(Number(o.splitCaptacao))}</span>}
                                      {o.splitFranchisee && o.splitFranchisee > 0 && (
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-[8px] text-blue-400 font-black rounded-sm border border-blue-500/20" title={`Franqueado: ${o.passiveFranchisee}`}>
                                          FR: {formatCurrency(Number(o.splitFranchisee))}
                                        </span>
                                      )}
                                   </div>
                                </td>
                               <td className="py-5 text-right font-heading font-black text-theme-text italic text-lg">{formatCurrency(o.amount)}</td>
                                <td className="py-5 text-center">
                                   <div className="flex flex-col items-center gap-2">
                                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 border ${o.status === 'APROVADO' ? 'border-brand-tactical text-brand-tactical' : 'border-red-900 text-red-500'}`}>
                                         {o.status}
                                      </span>
                                      {o.deliveryType === 'SHIPPING' && (
                                        <div className="flex flex-col items-center gap-1">
                                          <select 
                                            value={o.fulfillmentStatus}
                                            onChange={(e) => handleUpdateLogistics(o.id, e.target.value)}
                                            className={`text-[7px] font-black uppercase px-2 py-0.5 border bg-transparent outline-none cursor-pointer ${o.fulfillmentStatus === 'SHIPPED' ? 'border-green-500 text-green-500' : 'border-zinc-600 text-zinc-500 hover:border-zinc-400'}`}
                                          >
                                            <option value="PENDING">PENDENTE</option>
                                            <option value="PROCESSING">PROCESSANDO</option>
                                            <option value="SHIPPED">ENVIADO</option>
                                            <option value="DELIVERED">ENTREGUE</option>
                                            <option value="CANCELLED">CANCELADO</option>
                                          </select>
                                          <input 
                                            type="text"
                                            placeholder="CÓD. RASTREIO"
                                            defaultValue={o.trackingCode}
                                            onBlur={(e) => handleUpdateLogistics(o.id, o.fulfillmentStatus || 'PENDING', e.target.value)}
                                            className="text-[7px] text-theme-text font-bold bg-theme-bg-muted border border-theme-border px-1 py-0.5 w-20 text-center uppercase"
                                          />
                                          {o.shippingFee && <span className="text-[7px] text-theme-muted font-bold">Frete: {formatCurrency(Number(o.shippingFee))}</span>}
                                        </div>
                                      )}
                                   </div>
                                </td>
                                <td className="py-5 text-center">
                                   <div className="flex items-center justify-center gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(o.id); }}
                                        className="p-2 border border-theme-border text-red-500/40 hover:text-red-500 transition-all"
                                        title="Excluir Pedido"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                   </div>
                                </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
          ))
        ) : (
          <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/10 space-y-6">
             <div className="relative inline-block">
                <div className="absolute inset-0 bg-theme-border/20 rounded-full animate-ping" />
                <ArrowUpRight size={48} className="text-theme-muted relative z-10" />
             </div>
             <p className="text-[12px] text-theme-muted uppercase tracking-[0.6em] font-black italic">Nenhum registro de auditoria encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
