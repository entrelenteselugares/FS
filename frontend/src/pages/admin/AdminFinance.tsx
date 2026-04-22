import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d).toUpperCase();
};

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

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
  splitMatriz?: number;
  splitCaptacao?: number;
  splitEdicao?: number;
  splitCartorio?: number;
}

export const AdminFinance: React.FC = () => {
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"pending" | "history">("pending");

  const fetchPayouts = useCallback(async () => {
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
  }, [view]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleMarkAsPaid = async (orderId: string) => {
    if (!window.confirm("Confirmar que você já realizou os repasses via PIX para este pedido?")) return;
    try {
      await API.patch(`/admin/orders/${orderId}/payout`);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch {
      alert("Erro ao marcar como pago");
    }
  };

  const calculateAmount = (total: number, pct: number = 0) => {
    const amount = total * ((pct || 0) / 100);
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-theme-border pb-8">
        <div>
          <h2 className="text-2xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase leading-none mb-4">Central de Repasses</h2>
          <p className="text-proportional italic">Modelo Uber — Pagamentos após 7 dias</p>
        </div>
        <div className="flex bg-theme-bg-muted/50 p-1 rounded-none border border-theme-border">
          <button 
            onClick={() => setView("pending")}
            className={`px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "pending" ? "bg-brand-tactical text-black" : "text-theme-muted hover:text-theme-text"}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setView("history")}
            className={`px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "history" ? "bg-theme-bg/10 text-theme-text" : "text-theme-muted hover:text-theme-text"}`}
          >
            Histórico
          </button>
        </div>
        <button 
          onClick={async () => {
            try {
              const res = await API.get("/admin/payouts/export", { responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `repasses-${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
            } catch (err) {
              alert("Erro ao exportar CSV");
            }
          }}
          className="px-6 py-3 bg-theme-bg-muted border border-theme-border text-[9px] font-bold uppercase tracking-widest hover:brightness-110 transition-all text-theme-text flex items-center gap-2"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse bg-theme-bg-muted border border-theme-border">Sincronizando Fluxo Financeiro...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-theme-muted/30 uppercase tracking-widest border border-dashed border-theme-border">
            {view === "pending" ? "Nenhum repasse pronto para liberação." : "Nenhum histórico de repasse encontrado."}
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="lux-card flex flex-col md:flex-row justify-between gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 border border-brand-tactical text-brand-tactical">PEDIDO APROVADO</span>
                <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest leading-none">
                  {fmtDate(order.updatedAt)}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-heading text-theme-text uppercase tracking-tighter mb-4 font-black">{order.event.title}</h3>
              <p className="text-proportional !opacity-100 !text-theme-text">Venda Total: {Number(order.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Captação */}
                {order.event.partners.captacao && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Captação: {order.event.partners.captacao.nome}</label>
                    <div className="text-lg text-theme-text font-black">
                      {order.splitCaptacao !== undefined && order.splitCaptacao !== null
                        ? order.splitCaptacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : calculateAmount(order.amount, order.event.partners.captacao.profissional.captPct)
                      }
                    </div>
                    <div className="text-[9px] text-brand-tactical font-black bg-brand-tactical/5 p-2 border border-brand-tactical/10">PIX: {order.event.partners.captacao.pixKey || "PENDENTE"}</div>
                  </div>
                )}
                {/* Edição */}
                {order.event.partners.edicao && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Edição: {order.event.partners.edicao.nome}</label>
                    <div className="text-lg text-theme-text font-black">
                      {order.splitEdicao !== undefined && order.splitEdicao !== null
                        ? order.splitEdicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : calculateAmount(order.amount, order.event.partners.edicao.profissional.editPct)
                      }
                    </div>
                    <div className="text-[9px] text-brand-tactical font-black bg-brand-tactical/5 p-2 border border-brand-tactical/10">PIX: {order.event.partners.edicao.pixKey || "PENDENTE"}</div>
                  </div>
                )}
                {/* Unidade Fixa */}
                {order.event.partners.cartorio && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Unidade Fixa: {order.event.partners.cartorio.nome}</label>
                    <div className="text-lg text-theme-text font-black">
                      {order.splitCartorio !== undefined && order.splitCartorio !== null
                        ? order.splitCartorio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : calculateAmount(order.amount, order.event.partners.cartorio.cartorio.splitPct)
                      }
                    </div>
                    <div className="text-proportional !opacity-100 !text-brand-primary bg-brand-primary/5 p-3 border border-brand-primary/10 break-all">PIX: {order.event.partners.cartorio.pixKey || "PENDENTE"}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              {view === "pending" ? (
                <button 
                  onClick={() => handleMarkAsPaid(order.id)}
                  className="bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.3em] px-8 py-5 hover:brightness-110 transition-all rounded-none"
                >
                  Confirmar Repasse PIX
                </button>
              ) : (
                <div className="text-right">
                  <div className="text-[9px] font-black text-theme-muted uppercase tracking-widest mb-1">Repasse realizado em</div>
                  <div className="text-[11px] text-brand-tactical font-black uppercase tracking-widest">
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
