import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";

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
          <h2 style={{ fontSize: 32, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1, lineHeight: 1 }}>Central de Repasses</h2>
          <p style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 8, fontStyle: "italic" }}>Modelo Uber — Pagamentos após 7 dias</p>
        </div>
        <div style={{ display: "flex", background: `${T.bgField}88`, padding: 4, border: `1px solid ${T.border}` }}>
          <button 
            onClick={() => setView("pending")}
            style={{ 
              padding: "8px 16px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
              letterSpacing: "0.1em", cursor: "pointer", border: "none",
              background: view === "pending" ? T.brand : "transparent",
              color: view === "pending" ? T.brandText : T.text3,
              transition: "all 0.2s"
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
              transition: "all 0.2s"
            }}
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
            } catch {
              alert("Erro ao exportar CSV");
            }
          }}
          style={{ 
            padding: "10px 20px", background: T.bgField, border: `1px solid ${T.border}`, 
            color: T.text2, fontSize: 8, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: 2, cursor: "pointer", transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.text2}
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
          <div key={order.id} style={{ border: `1px solid ${T.border}`, padding: "20px", background: T.bgCard }} className="hover:border-brand-tactical/20 transition-all group">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: T.brand, border: `1px solid ${T.brand}44`, padding: "2px 6px" }}>PEDIDO APROVADO</span>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: T.text3 }}>{fmtDate(order.updatedAt)}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.5, marginBottom: 4 }}>{order.event.title}</h3>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>Venda Total: <span style={{ color: T.text }}>{Number(order.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <div style={{ fontSize: 8, fontWeight: 900, color: T.brand, background: `${T.brand}08`, padding: "4px 8px", border: `1px solid ${T.brand}22`, textTransform: "uppercase" }}>PIX: {order.event.partners.captacao.pixKey || "PENDENTE"}</div>
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
                      <div style={{ fontSize: 8, fontWeight: 900, color: T.brand, background: `${T.brand}08`, padding: "4px 8px", border: `1px solid ${T.brand}22`, textTransform: "uppercase" }}>PIX: {order.event.partners.edicao.pixKey || "PENDENTE"}</div>
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
                      <div style={{ fontSize: 8, fontWeight: 900, color: T.brand, background: `${T.brand}08`, padding: "4px 8px", border: `1px solid ${T.brand}22`, textTransform: "uppercase" }}>PIX: {order.event.partners.cartorio.pixKey || "PENDENTE"}</div>
                    </div>
                  )}
                </div>
              </div>

            <div className="flex flex-col justify-end">
              {view === "pending" ? (
                <button 
                  onClick={() => handleMarkAsPaid(order.id)}
                  style={{ 
                    background: T.brand, color: T.brandText, padding: "12px 24px", 
                    fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
                    letterSpacing: "0.2em", cursor: "pointer", border: "none",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Confirmar Repasse PIX
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
    </div>
  );
};
