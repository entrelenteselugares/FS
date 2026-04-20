import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-heading text-theme-text italic">Auditoria de Pedidos</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.3em] mt-2 font-bold">
            Trilha de transições e liquidez do ledger
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="PROCURAR POR E-MAIL OU EVENTO..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent border-b border-theme-border py-3 text-[10px] text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-brand-primary transition-all uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="border border-theme-border bg-theme-bg-muted backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-theme-border text-[9px] font-bold uppercase tracking-[0.4em] text-theme-muted bg-theme-bg/10">
                <th className="text-left px-8 py-6">ID / Data</th>
                <th className="text-left px-8 py-6">Comprador</th>
                <th className="text-left px-8 py-6">Evento</th>
                <th className="text-right px-8 py-6">Valor</th>
                <th className="text-center px-8 py-6">Status</th>
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
                  <tr key={order.id} className="border-b border-theme-border hover:bg-theme-bg/5 transition-all group">
                    <td className="px-8 py-6">
                      <div className="text-[10px] text-theme-muted font-sans mb-1">#{order.id.slice(-8).toUpperCase()}</div>
                      <div className="text-[9px] text-theme-muted uppercase font-bold">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[11px] text-theme-text font-medium italic">{order.user?.nome || "Convidado"}</div>
                      <div className="text-[9px] text-theme-muted font-sans">{order.buyerEmail || order.user?.email || "—"}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] text-brand-primary uppercase tracking-wider font-bold group-hover:underline underline-offset-4 decoration-theme-border">
                        {order.event.title}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-[13px] text-theme-text font-medium italic">R$ {Number(order.amount).toFixed(2)}</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-4 py-1.5 border text-[8px] font-bold uppercase tracking-[0.2em] rounded-sm ${
                        order.status === "APROVADO" ? "border-brand-primary/30 text-brand-primary bg-brand-primary/5" :
                        order.status === "PENDENTE" ? "border-zinc-800 text-zinc-700" :
                        "border-red-900/30 text-red-700"
                      }`}>
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
