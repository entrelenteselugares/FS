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
          <h2 className="text-3xl font-serif text-white italic">Auditoria de Pedidos</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] mt-2 font-bold">
            Trilha de transições e liquidez do ledger
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="PROCURAR POR E-MAIL OU EVENTO..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent border-b border-white/10 py-3 text-[10px] text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-500 bg-white/[0.02]">
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
                    <div className="text-[10px] text-zinc-700 animate-pulse tracking-[0.5em] uppercase">Sincronizando Ledger...</div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                    <td className="px-8 py-6">
                      <div className="text-[10px] text-zinc-400 font-mono mb-1">#{order.id.slice(-8).toUpperCase()}</div>
                      <div className="text-[9px] text-zinc-700 uppercase font-bold">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[11px] text-white font-serif italic">{order.user?.nome || "Convidado"}</div>
                      <div className="text-[9px] text-zinc-600 font-mono">{order.buyerEmail || order.user?.email || "—"}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] text-brand-olive uppercase tracking-wider font-bold group-hover:underline underline-offset-4 decoration-white/10">
                        {order.event.title}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-[13px] text-white font-serif italic">R$ {Number(order.amount).toFixed(2)}</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-4 py-1.5 border text-[8px] font-bold uppercase tracking-[0.2em] rounded-sm ${
                        order.status === "APROVADO" ? "border-brand-olive/30 text-brand-olive bg-brand-olive/5" :
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
