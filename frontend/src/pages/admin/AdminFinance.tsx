import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)).toUpperCase();

const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

interface PayoutOrder {
  id: string;
  amount: number;
  updatedAt: string;
  payoutDone: boolean;
  payoutDate?: string;
  event: {
    title: string;
    partners: {
      captacao?: { id: string; nome: string; pixKey: string; profissional: { captPct: number } };
      edicao?: { id: string; nome: string; pixKey: string; profissional: { editPct: number } };
      cartorio?: { id: string; nome: string; pixKey: string; cartorio: { splitPct: number } };
    };
  };
}

export const AdminFinance: React.FC = () => {
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"pending" | "history">("pending");

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const url = view === "pending" 
        ? "/admin/orders?readyForPayout=true" 
        : "/admin/orders?payoutDone=true&status=APROVADO";
      const { data } = await API.get(url);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Erro ao carregar repasses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [view]);

  const handleMarkAsPaid = async (orderId: string) => {
    if (!window.confirm("Confirmar que você já realizou os repasses via PIX para este pedido?")) return;
    try {
      await API.patch(`/admin/orders/${orderId}/payout`);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Erro ao marcar como pago");
    }
  };

  const calculateAmount = (total: number, pct: number) => (total * (pct / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-white tracking-tighter uppercase">Central de Repasses</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mt-2 font-bold italic">Modelo Uber — Pagamentos após 7 dias</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-none border border-white/5">
          <button 
            onClick={() => setView("pending")}
            className={`px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "pending" ? "bg-brand-tactical text-white" : "text-zinc-600 hover:text-white"}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setView("history")}
            className={`px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "history" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-white"}`}
          >
            Histórico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest animate-pulse bg-black border border-white/5">Sincronizando Fluxo Financeiro...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-zinc-800 uppercase tracking-widest border border-dashed border-white/5">
            {view === "pending" ? "Nenhum repasse pronto para liberação." : "Nenhum histórico de repasse encontrado."}
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-[#080808] border border-white/5 p-8 flex flex-col md:flex-row justify-between gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 border border-brand-tactical text-brand-tactical">PEDIDO APROVADO</span>
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  {fmtDate(order.updatedAt)}
                </span>
              </div>
              <h3 className="text-2xl font-heading text-white uppercase tracking-tighter mb-2">{order.event.title}</h3>
              <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Venda Total: {Number(order.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Captação */}
                {order.event.partners.captacao && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Captação: {order.event.partners.captacao.nome}</label>
                    <div className="text-lg text-white font-bold">{calculateAmount(order.amount, order.event.partners.captacao.profissional.captPct)}</div>
                    <div className="text-[9px] text-brand-tactical font-bold bg-brand-tactical/5 p-2 border border-brand-tactical/10">PIX: {order.event.partners.captacao.pixKey || "PENDENTE"}</div>
                  </div>
                )}
                {/* Edição */}
                {order.event.partners.edicao && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Edição: {order.event.partners.edicao.nome}</label>
                    <div className="text-lg text-white font-bold">{calculateAmount(order.amount, order.event.partners.edicao.profissional.editPct)}</div>
                    <div className="text-[9px] text-brand-tactical font-bold bg-brand-tactical/5 p-2 border border-brand-tactical/10">PIX: {order.event.partners.edicao.pixKey || "PENDENTE"}</div>
                  </div>
                )}
                {/* Unidade Local */}
                {order.event.partners.cartorio && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Unidade: {order.event.partners.cartorio.nome}</label>
                    <div className="text-lg text-white font-bold">{calculateAmount(order.amount, order.event.partners.cartorio.cartorio.splitPct)}</div>
                    <div className="text-[9px] text-brand-tactical font-bold bg-brand-tactical/5 p-2 border border-brand-tactical/10">PIX: {order.event.partners.cartorio.pixKey || "PENDENTE"}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              {view === "pending" ? (
                <button 
                  onClick={() => handleMarkAsPaid(order.id)}
                  className="bg-brand-tactical text-white text-[10px] font-bold uppercase tracking-[0.3em] px-8 py-5 hover:brightness-110 transition-all"
                >
                  Confirmar Repasse PIX
                </button>
              ) : (
                <div className="text-right">
                  <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Repasse realizado em</div>
                  <div className="text-[11px] text-brand-tactical font-bold uppercase tracking-widest">
                    {order.payoutDate && fmtDateTime(order.payoutDate)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
