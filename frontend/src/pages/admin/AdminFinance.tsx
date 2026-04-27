import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { DollarSign } from "lucide-react";

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
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

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
    try {
      await API.patch(`/admin/orders/${orderId}/payout`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setConfirmModal(null);
      showNotification("Repasse liquidado com sucesso!");
    } catch {
      showNotification("Erro ao marcar como pago", 'error');
    }
  };

  const calculateAmount = (total: number, pct: number = 0) => {
    const amount = total * ((pct || 0) / 100);
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-theme-border pb-8">
        <div>
          <h2 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1, lineHeight: 1 }}>Central de Repasses</h2>
          <p style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 8, fontStyle: "italic" }}>Modelo Uber — Pagamentos após 7 dias</p>
        </div>
        <div style={{ display: "flex", background: `${T.bgField}88`, padding: 4, border: `1px solid ${T.border}`, alignSelf: "flex-start" }}>
          <button 
            onClick={() => setView("pending")}
            style={{ 
              padding: "8px 16px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
              letterSpacing: "0.1em", cursor: "pointer", border: "none",
              background: view === "pending" ? T.brand : "transparent",
              color: view === "pending" ? T.brandText : T.text3,
              transition: "all 0.2s",
              flex: 1
            }}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setView("history")}
            style={{ 
              padding: "8px 16px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
              letterSpacing: "0.1em", cursor: "pointer", border: "none",
              background: view === "history" ? T.brand : "transparent",
              color: view === "history" ? T.brandText : T.text3,
              transition: "all 0.2s",
              flex: 1
            }}
          >
            Histórico
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.5em] animate-pulse">Auditando Transações...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.5em] border border-dashed border-theme-border">
            {view === "pending" ? "Nenhum repasse pendente no momento." : "Nenhum histórico de repasse encontrado."}
          </div>
        ) : orders.map(order => (
          <div key={order.id} style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: "clamp(20px, 4vw, 32px)" }} className="group hover:border-brand-tactical transition-all">
            <div className="flex flex-col gap-8">
              <div className="w-full">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div style={{ background: T.brand, color: T.brandText, fontSize: 8, fontWeight: 900, padding: "4px 10px", textTransform: "uppercase", letterSpacing: 1 }}>{view === "pending" ? "Aguardando PIX" : "Liquidado"}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: 1 }}>{order.event.title}</div>
                  <div style={{ fontSize: 9, color: T.text3, textTransform: "uppercase" }}>• {fmtDate(order.updatedAt)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/5 pt-8">
                  {/* Matriz */}
                  <div className="space-y-2">
                    <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1, display: "block" }}>Matriz Foto Segundo</label>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: 0.5 }}>
                      {order.splitMatriz !== undefined && order.splitMatriz !== null 
                        ? order.splitMatriz.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : calculateAmount(order.amount, 40) // Fallback 40% (Matriz)
                      }
                    </div>
                  </div>
                  {/* Captação */}
                  {order.event.partners.captacao && (
                    <div className="space-y-2">
                      <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1, display: "block" }}>Captação: {order.event.partners.captacao.nome}</label>
                      <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: 0.5 }}>
                        {order.splitCaptacao !== undefined && order.splitCaptacao !== null
                          ? order.splitCaptacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : calculateAmount(order.amount, order.event.partners.captacao.profissional.captPct)
                        }
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 900, color: T.brand, background: `${T.brand}08`, padding: "4px 8px", border: `1px solid ${T.brand}22`, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>PIX: {order.event.partners.captacao.pixKey || "PENDENTE"}</div>
                    </div>
                  )}
                  {/* Edição */}
                  {order.event.partners.edicao && (
                    <div className="space-y-2">
                      <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1, display: "block" }}>Edição: {order.event.partners.edicao.nome}</label>
                      <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: 0.5 }}>
                        {order.splitEdicao !== undefined && order.splitEdicao !== null
                          ? order.splitEdicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : calculateAmount(order.amount, order.event.partners.edicao.profissional.editPct)
                        }
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 900, color: T.brand, background: `${T.brand}08`, padding: "4px 8px", border: `1px solid ${T.brand}22`, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>PIX: {order.event.partners.edicao.pixKey || "PENDENTE"}</div>
                    </div>
                  )}
                  {/* Unidade Fixa */}
                  {order.event.partners.cartorio && (
                    <div className="space-y-2">
                      <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1, display: "block" }}>Unidade Fixa: {order.event.partners.cartorio.nome}</label>
                      <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: 0.5 }}>
                        {order.splitCartorio !== undefined && order.splitCartorio !== null
                          ? order.splitCartorio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : calculateAmount(order.amount, order.event.partners.cartorio.cartorio.splitPct)
                        }
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 900, color: T.brand, background: `${T.brand}08`, padding: "4px 8px", border: `1px solid ${T.brand}22`, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>PIX: {order.event.partners.cartorio.pixKey || "PENDENTE"}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end border-t border-white/5 pt-6 lg:border-none lg:pt-0">
                {view === "pending" ? (
                  <button 
                    onClick={() => setConfirmModal(order.id)}
                    style={{ 
                      background: T.brand, color: T.brandText, padding: "12px 24px", 
                      fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
                      letterSpacing: "0.2em", cursor: "pointer", border: "none",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 8
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <DollarSign size={10} /> Confirmar Repasse PIX
                  </button>
                ) : (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Repasse realizado em</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: T.brand, textTransform: "uppercase", letterSpacing: 1 }}>
                      {order.payoutDate && fmtDateTime(order.payoutDate)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIRMATION MODAL (MIDNIGHT LUXURY) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-[20px] animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setConfirmModal(null)} />
           <div className="relative bg-zinc-950 border border-brand-tactical/30 w-full max-w-sm p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Validação de Saída</span>
                 <h3 className="text-xl font-heading text-white uppercase tracking-tighter">Protocolo de Repasse</h3>
              </div>
              
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                VOCÊ CONFIRMA QUE JÁ REALIZOU OS REPASSES VIA PIX PARA TODOS OS PARCEIROS DESTE PEDIDO?
              </p>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setConfirmModal(null)}
                   className="p-4 border border-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                   CANCELAR
                 </button>
                 <button 
                   onClick={() => handleMarkAsPaid(confirmModal)}
                   className="p-4 bg-brand-tactical text-black text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                 >
                   CONFIRMAR
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* NOTIFICATION (MIDNIGHT LUXURY) */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[300px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Liquidação OK' : 'Falha no Repasse'}
                 </span>
                 <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
