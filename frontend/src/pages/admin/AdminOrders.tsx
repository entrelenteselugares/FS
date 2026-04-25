import React, { useState, useEffect, useMemo } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { ChevronDown, ChevronRight, PieChart, CheckCircle2, Clock } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/orders", {
          params: { page, q: search, limit: 100 } // Aumentamos o limite para garantir agrupamento coerente
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

  // Agrupamento por Evento
  const groupedOrders = useMemo(() => {
    const groups: Record<string, OrderGroup> = {};

    orders.forEach(o => {
      const eid = o.eventId || o.event.slug;
      if (!groups[eid]) {
        groups[eid] = {
          eventId: eid,
          eventTitle: o.event.title,
          eventSlug: o.event.slug,
          clientName: o.user?.nome || "Convidado",
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

    // Definir Status Unificado
    Object.values(groups).forEach(g => {
      const allPaid = g.orders.every(o => o.status === "APROVADO" || o.status === "APPROVED");
      const somePaid = g.orders.some(o => o.status === "APROVADO" || o.status === "APPROVED");
      
      if (allPaid) g.status = "QUITADO";
      else if (somePaid) g.status = "PARCIAL";
      else g.status = "PENDENTE";
    });

    return Object.values(groups).sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
  }, [orders]);

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style>{`
        .orders-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${T.border}; padding-bottom: 24px; }
        .orders-table-wrapper { border: 1px solid ${T.border}; background: ${T.bgField}; overflow: hidden; }
        .orders-table { width: 100%; border-collapse: collapse; }
        
        .row-group { cursor: pointer; border-bottom: 1px solid ${T.border}44; transition: all 0.2s; }
        .row-group:hover { background: ${T.brand}05; }
        .row-expanded { background: ${T.bg}aa; }

        .status-badge { 
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; 
          font-size: 8px; fontWeight: 900; text-transform: uppercase; letter-spacing: 1; border-radius: 2px;
        }

        @media (max-width: 768px) {
          .orders-header { flex-direction: column; align-items: stretch; gap: 20px; }
          .search-container { width: 100% !important; }
        }
      `}</style>

      <div className="orders-header">
        <div>
          <h2 style={{ fontSize: 24, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1 }}>Auditoria de Projetos</h2>
          <p style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>Visão consolidada de transações por evento</p>
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
                <th style={{ width: 40 }}></th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Projeto / Comprador</th>
                <th style={{ textAlign: "center", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Parcelas</th>
                <th style={{ textAlign: "right", padding: "12px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: T.text3 }}>Total Bruto</th>
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
              ) : groupedOrders.length > 0 ? (
                groupedOrders.map((group) => (
                  <React.Fragment key={group.eventId}>
                    <tr 
                      className={`row-group ${expandedId === group.eventId ? "row-expanded" : ""}`}
                      onClick={() => setExpandedId(expandedId === group.eventId ? null : group.eventId)}
                    >
                      <td style={{ padding: "15px 0 15px 20px" }}>
                        {expandedId === group.eventId ? <ChevronDown size={14} className="text-brand-primary" /> : <ChevronRight size={14} className="opacity-20" />}
                      </td>
                      <td style={{ padding: "15px 20px" }}>
                        <div style={{ fontSize: 11, color: T.text, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{group.eventTitle}</div>
                        <div style={{ fontSize: 9, color: T.text3, marginTop: 2 }}>{group.clientName} · {group.clientEmail}</div>
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.text, fontWeight: 900, opacity: 0.6 }}>
                          {group.orders.length}
                        </div>
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "right" }}>
                        <div style={{ fontSize: 13, color: T.text, fontWeight: 900 }}>{formatCurrency(group.totalAmount)}</div>
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "center" }}>
                        {group.status === "QUITADO" && (
                          <span className="status-badge" style={{ border: `1px solid ${T.brand}`, color: T.brand, background: `${T.brand}11` }}>
                            <CheckCircle2 size={10} /> {group.status}
                          </span>
                        )}
                        {group.status === "PARCIAL" && (
                          <span className="status-badge" style={{ border: "1px solid #f59e0b", color: "#f59e0b", background: "#f59e0b11" }}>
                            <PieChart size={10} /> {group.status}
                          </span>
                        )}
                        {group.status === "PENDENTE" && (
                          <span className="status-badge" style={{ border: `1px solid ${T.text3}`, color: T.text3 }}>
                            <Clock size={10} /> {group.status}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Detalhamento das Parcelas */}
                    {expandedId === group.eventId && (
                      <tr>
                        <td colSpan={5} style={{ padding: "0 20px 20px 60px", background: `${T.bg}aa` }}>
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <table style={{ width: "100%", borderCollapse: "collapse", background: "rgba(0,0,0,0.2)", border: `1px solid ${T.border}22` }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}44` }}>
                                  <th style={{ textAlign: "left", padding: "10px", fontSize: 8, color: T.text3, textTransform: "uppercase" }}>ID Pedido</th>
                                  <th style={{ textAlign: "left", padding: "10px", fontSize: 8, color: T.text3, textTransform: "uppercase" }}>Tipo / Data</th>
                                  <th style={{ textAlign: "right", padding: "10px", fontSize: 8, color: T.text3, textTransform: "uppercase" }}>Valor</th>
                                  <th style={{ textAlign: "center", padding: "10px", fontSize: 8, color: T.text3, textTransform: "uppercase" }}>Status MP</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.orders.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(o => (
                                  <tr key={o.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                                    <td style={{ padding: "12px 10px", fontSize: 9, color: T.text3, fontFamily: "monospace" }}>#{o.id.toUpperCase()}</td>
                                    <td style={{ padding: "12px 10px" }}>
                                      <div style={{ fontSize: 9, color: T.text, fontWeight: 700 }}>{o.manualType || "Parcela"}</div>
                                      <div style={{ fontSize: 8, color: T.text3 }}>{new Date(o.createdAt).toLocaleString("pt-BR")}</div>
                                    </td>
                                    <td style={{ padding: "12px 10px", textAlign: "right", fontSize: 10, fontWeight: 900 }}>{formatCurrency(o.amount)}</td>
                                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                                      <div style={{ 
                                        fontSize: 7, fontWeight: 900, 
                                        color: (o.status === "APROVADO" || o.status === "APPROVED") ? T.brand : "#f87171" 
                                      }}>
                                        {o.status}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
