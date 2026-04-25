import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";

interface Order {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  buyerEmail?: string;
  event: { title: string; slug: string };
  user?: { nome: string; email: string };
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/orders", {
          params: { page, q: search }
        });
        setOrders(data.orders);
        setTotalPages(data.pages);
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, search]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style>{`
        .orders-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${T.border}; padding-bottom: 24px; }
        .orders-table-wrapper { border: 1px solid ${T.border}; background: ${T.bgField}; overflow: hidden; }
        .orders-table { width: 100%; border-collapse: collapse; }
        .order-card-mobile { display: none; }

        @media (max-width: 768px) {
          .orders-header { flex-direction: column; align-items: stretch; gap: 20px; }
          .search-container { width: 100% !important; }
          .orders-table-wrapper { display: none; }
          .order-card-mobile { 
            display: flex; flex-direction: column; gap: 12px; padding: 16px; 
            background: ${T.bgField}; border: 1px solid ${T.border}; margin-bottom: 12px;
          }
          .order-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
          .order-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid ${T.border}44; padding-top: 12px; margin-top: 4px; }
        }
      `}</style>

      <div className="orders-header">
        <div>
          <h2 style={{ fontSize: 24, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1 }}>Auditoria de Pedidos</h2>
          <p style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>Trilha de transições e liquidez do ledger</p>
        </div>
        
        <div className="search-container" style={{ position: "relative", width: 320 }}>
          <input
            type="text"
            placeholder="PROCURAR POR E-MAIL OU EVENTO..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ 
              width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`,
              padding: "12px 0", fontSize: 9, color: T.text, textTransform: "uppercase", letterSpacing: 2, outline: "none"
            }}
          />
        </div>
      </div>

      <div className="orders-table-wrapper">
        <div style={{ overflowX: "auto" }}>
          <table className="orders-table">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: `${T.bg}55` }}>
                <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>ID / Data</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Comprador</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Evento</th>
                <th style={{ textAlign: "right", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Valor</th>
                <th style={{ textAlign: "center", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="text-[10px] text-theme-muted animate-pulse tracking-[0.5em] uppercase">Sincronizando Ledger...</div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${T.border}44`, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = `${T.brand}05`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 20px" }}>
                      <div style={{ fontSize: 9, color: T.text3, marginBottom: 2 }}>#{order.id.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize: 8, color: T.text3, fontWeight: 900, textTransform: "uppercase" }}>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</div>
                    </td>
                    <td style={{ padding: "10px 20px" }}>
                      <div style={{ fontSize: 11, color: T.text, fontWeight: 700, fontStyle: "italic" }}>{order.user?.nome || "Convidado"}</div>
                      <div style={{ fontSize: 9, color: T.text3 }}>{order.buyerEmail || order.user?.email || "—"}</div>
                    </td>
                    <td style={{ padding: "10px 20px" }}>
                      <div style={{ fontSize: 10, color: T.brand, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
                        {order.event.title}
                      </div>
                    </td>
                    <td style={{ padding: "10px 20px", textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: T.text, fontWeight: 900 }}>R$ {Number(order.amount).toFixed(2)}</div>
                    </td>
                    <td style={{ padding: "10px 20px", textAlign: "center" }}>
                      <span style={{ 
                        display: "inline-block", padding: "4px 8px", border: `1px solid ${order.status === "APROVADO" ? T.brand : T.border}`,
                        fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: order.status === "APROVADO" ? T.brand : T.text3,
                        background: order.status === "APROVADO" ? `${T.brand}11` : "transparent"
                      }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-zinc-800 text-[10px] font-bold uppercase tracking-[0.5em] italic">
                    Nenhum registro encontrado no arquivo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only">
        {loading ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse">Sincronizando...</div>
        ) : orders.map(order => (
          <div key={order.id} className="order-card-mobile">
            <div className="order-card-top">
              <div>
                <div style={{ fontSize: 10, color: T.text3, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>#{order.id.slice(-8).toUpperCase()}</div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 700, marginTop: 4 }}>{order.user?.nome || "Convidado"}</div>
                <div style={{ fontSize: 10, color: T.text3 }}>{order.buyerEmail || order.user?.email}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, color: T.text, fontWeight: 900 }}>R$ {Number(order.amount).toFixed(2)}</div>
                <div style={{ 
                  display: "inline-block", padding: "2px 6px", border: `1px solid ${order.status === "APROVADO" ? T.brand : T.border}`,
                  fontSize: 7, fontWeight: 900, textTransform: "uppercase", color: order.status === "APROVADO" ? T.brand : T.text3,
                  marginTop: 6
                }}>
                  {order.status}
                </div>
              </div>
            </div>
            <div className="order-card-footer">
              <div style={{ fontSize: 9, color: T.brand, fontWeight: 900, textTransform: "uppercase" }}>{order.event.title}</div>
              <div style={{ fontSize: 9, color: T.text3, fontWeight: 700 }}>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-10 pt-10 border-t border-white/5">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 hover:text-white disabled:opacity-20 transition-all italic underline underline-offset-8"
          >
            PÁGINA ANTERIOR
          </button>
          <span className="text-[10px] font-bold text-zinc-400 tracking-[0.5em] uppercase">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 hover:text-white disabled:opacity-20 transition-all italic underline underline-offset-8"
          >
            PRÓXIMA PÁGINA
          </button>
        </div>
      )}
    </div>
  );
};
