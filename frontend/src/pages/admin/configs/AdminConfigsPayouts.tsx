import React from "react";
import { AlertTriangle, CheckCircle, DollarSign, Smartphone } from "lucide-react";

interface PayoutItem {
  id: string;
  recipientType: string;
  recipientName: string;
  pixKey: string;
  splitPct: number;
  grossRevenue: number;
  amount: number;
  status: "PENDING" | "PAID";
  pixTxId?: string;
  orderCount: number;
}

interface Payout {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: "PENDING" | "PAID";
  totalRevenue: number;
  totalPayout: number;
  items?: PayoutItem[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const safeDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
};

interface Props {
  payouts: Payout[];
  onOpenPayoutModal: (info: { payoutId: string; itemId: string; name: string; amount: number }) => void;
}

export const AdminConfigsPayouts: React.FC<Props> = ({ payouts, onOpenPayoutModal }) => {
  if (payouts.length === 0) {
    return (
      <div className="py-40 text-center border  border-theme-border bg-theme-bg-muted/5 space-y-6 rounded-2xl">
        <AlertTriangle className="mx-auto text-theme-muted opacity-20" size={48} />
        <div className="space-y-2">
          <p className="text-[9px] sm:text-[11px] font-bold text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] truncate max-w-[80vw]">
            Histórico de Repasses Vazio
          </p>
          <p className="text-[8px] text-theme-muted/60 uppercase tracking-widest">
            Inicie um fechamento semanal para consolidar as provisões.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {payouts.map((payout) => (
        <div key={payout.id} className="bg-theme-bg border border-theme-border shadow-sm group overflow-hidden rounded-2xl">
          <div className="px-5 md:px-10 py-4 md:py-8 border-b border-theme-border flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 bg-theme-bg rounded-2xl">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-2xl font-heading font-bold text-theme-text uppercase leading-none">
                  Ciclo {safeDate(payout.weekStart)} — {safeDate(payout.weekEnd)}
                </span>
                <span className={`text-[8px] font-black px-3 py-1 border uppercase tracking-widest italic ${
                  payout.status === "PAID"
                    ? "border-brand-tactical text-brand-tactical bg-brand-tactical/10"
                    : "border-amber-600 text-amber-600 bg-amber-600/5"
                }`}>
                  {payout.status === "PAID" ? "LIQUIDADO" : "PENDENTE"}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-8">
                <div className="space-y-1">
                  <span className="text-[7px] font-bold text-theme-muted uppercase tracking-widest">Faturamento Bruto</span>
                  <p className="text-[12px] font-bold text-theme-text font-mono ">{formatCurrency(payout.totalRevenue)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[7px] font-bold text-theme-muted uppercase tracking-widest">Provisão de Repasse</span>
                  <p className="text-[12px] font-bold text-brand-tactical font-mono ">{formatCurrency(payout.totalPayout)}</p>
                </div>
              </div>
            </div>
            <div className="px-3 md:px-6 py-4 bg-theme-bg border border-theme-border text-theme-muted text-[8px] font-bold uppercase tracking-[0.3em] font-mono shadow-inner group-hover:text-theme-text transition-colors rounded-2xl">
              ID: {payout.id.slice(-8).toUpperCase()}
            </div>
          </div>

          <div className="divide-y divide-theme-border/20">
            {payout.items?.map((item) => (
              <div key={item.id} className="px-5 md:px-10 py-4 md:py-8 grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-8 hover:bg-theme-bg-muted transition-all">
                <div className="md:col-span-1">
                  <span className="text-[7px] font-bold text-theme-muted border border-theme-border px-2 py-1 uppercase tracking-widest block text-center ">
                    {item.recipientType}
                  </span>
                </div>
                <div className="md:col-span-3">
                  <div className="text-[11px] font-bold text-theme-text uppercase tracking-widest leading-none">{item.recipientName}</div>
                  <div className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Smartphone size={10} /> Pix: {item.pixKey || "S/ CHAVE"}
                  </div>
                </div>
                <div className="md:col-span-3 text-center border-l border-theme-border/10">
                  <span className="text-[8px] text-theme-muted uppercase tracking-widest font-bold block mb-1">Engenharia de Split</span>
                  <div className="text-[10px] text-theme-text font-bold uppercase ">
                    {item.orderCount} PEDIDOS • {item.splitPct}% DE {formatCurrency(item.grossRevenue)}
                  </div>
                </div>
                <div className="md:col-span-2 text-right">
                  <span className="text-[8px] text-theme-muted uppercase tracking-widest font-bold block mb-1">Vlr Líquido</span>
                  <div className="text-xl font-heading font-bold text-brand-tactical leading-none">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  {item.status === "PAID" ? (
                    <div className="text-right space-y-1.5">
                      <div className="text-[9px] text-green-600 font-bold uppercase tracking-widest flex items-center justify-end gap-2 ">
                        <CheckCircle size={12} /> REPASSE EFETUADO
                      </div>
                      {item.pixTxId && (
                        <div className="text-[8px] text-theme-muted font-mono uppercase tracking-widest opacity-60">
                          REF: {item.pixTxId.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenPayoutModal({ payoutId: payout.id, itemId: item.id, name: item.recipientName, amount: item.amount })}
                      className="text-[9px] font-bold text-zinc-950 uppercase tracking-[0.4em] bg-brand-tactical px-4 md:px-8 py-4 hover:brightness-110 transition-all shadow-xl flex items-center gap-3"
                    >
                      <DollarSign size={14} /> LIQUIDAR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
