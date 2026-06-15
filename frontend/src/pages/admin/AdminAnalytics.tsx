import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { BarChart3, TrendingUp, Users, RefreshCw } from "lucide-react";

interface CouponReport {
  id: string;
  code: string;
  discountPct: number | null;
  discountAbs: number | null;
  usedCount: number;
  actualPaidUses: number;
  totalRevenueGenerated: number;
  active: boolean;
}

export const AdminAnalytics: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/analytics/marketing/coupons");
      setCoupons(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/10 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-3 md:gap-6 relative z-10">
          <div>
            <h2 className="text-2xl font-bold uppercase text-theme-text font-heading">Analytics</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-theme-muted mt-2">Monitoramento Global de Mercado e Cupons</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex-1 md:flex-none px-4 md:px-8 py-4 bg-brand-tactical text-zinc-950 text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl whitespace-nowrap rounded-xl"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> ATUALIZAR
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-3 md:p-6 md:p-12 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.text3 }}>
          Carregando Metadados...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-3 md:p-6 rounded-2xl border" style={{ background: T.bgCard, borderColor: T.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Total Gerado via Cupons</h4>
                  <BarChart3 size={16} color={T.brand} />
                </div>
                <div className="text-3xl font-heading font-bold text-theme-text">
                  {formatCurrency(coupons.reduce((acc, c) => acc + c.totalRevenueGenerated, 0))}
                </div>
             </div>
             <div className="p-3 md:p-6 rounded-2xl border" style={{ background: T.bgCard, borderColor: T.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Uso de Cupons Convertidos</h4>
                  <TrendingUp size={16} color={T.brand} />
                </div>
                <div className="text-3xl font-heading font-bold text-theme-text">
                  {coupons.reduce((acc, c) => acc + c.actualPaidUses, 0)} <span className="text-sm">usos</span>
                </div>
             </div>
          </div>

          <div className="p-3 md:p-6 rounded-2xl border" style={{ background: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: T.text }}>
              <Users size={14} /> Relatório de Eficiência de Cupons
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: T.border }}>
                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Cupom</th>
                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Status</th>
                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Desconto</th>
                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Tentativas de Uso</th>
                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Vendas Pagas</th>
                    <th className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>Receita Gerada</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-theme-bg-muted transition-colors" style={{ borderColor: T.border }}>
                      <td className="py-4 px-4 font-bold" style={{ color: T.text }}>{c.code}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${c.active ? 'bg-brand-tactical/20 text-theme-brand' : 'bg-brand-danger/20 text-brand-danger'}`}>
                          {c.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[11px]" style={{ color: T.text2 }}>
                        {c.discountPct ? `${c.discountPct}%` : formatCurrency(c.discountAbs || 0)}
                      </td>
                      <td className="py-4 px-4 text-[11px]" style={{ color: T.text2 }}>{c.usedCount}</td>
                      <td className="py-4 px-4 font-bold" style={{ color: T.brand }}>{c.actualPaidUses}</td>
                      <td className="py-4 px-4 font-bold" style={{ color: T.text }}>{formatCurrency(c.totalRevenueGenerated)}</td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 md:py-8 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>
                        Nenhum dado disponível.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
