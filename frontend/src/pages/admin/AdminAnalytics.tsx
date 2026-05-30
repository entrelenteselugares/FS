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
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-brand-tactical rounded-full" />
            <h2 className="text-xl md:text-2xl font-heading font-black italic tracking-tighter uppercase leading-none" style={{ color: T.text }}>
              Advanced Analytics
            </h2>
          </div>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest" style={{ color: T.text3 }}>
            Monitoramento Global de Mercado e Cupons
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-3 border rounded-xl hover:border-brand-tactical transition-colors flex items-center gap-2"
          style={{ borderColor: T.border, color: T.text }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="text-[9px] font-black tracking-widest uppercase">Atualizar</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-[10px] uppercase font-black tracking-widest" style={{ color: T.text3 }}>
          Carregando Metadados...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-6 rounded-2xl border" style={{ background: T.bgCard, borderColor: T.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Total Gerado via Cupons</h4>
                  <BarChart3 size={16} color={T.brand} />
                </div>
                <div className="text-3xl font-heading font-black italic tracking-tighter text-theme-text">
                  {formatCurrency(coupons.reduce((acc, c) => acc + c.totalRevenueGenerated, 0))}
                </div>
             </div>
             <div className="p-6 rounded-2xl border" style={{ background: T.bgCard, borderColor: T.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Uso de Cupons Convertidos</h4>
                  <TrendingUp size={16} color={T.brand} />
                </div>
                <div className="text-3xl font-heading font-black italic tracking-tighter text-theme-text">
                  {coupons.reduce((acc, c) => acc + c.actualPaidUses, 0)} <span className="text-sm">usos</span>
                </div>
             </div>
          </div>

          <div className="p-6 rounded-2xl border" style={{ background: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: T.text }}>
              <Users size={14} /> Relatório de Eficiência de Cupons
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: T.border }}>
                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Cupom</th>
                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Status</th>
                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Desconto</th>
                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Tentativas de Uso</th>
                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Vendas Pagas</th>
                    <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>Receita Gerada</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-white/5 transition-colors" style={{ borderColor: T.border }}>
                      <td className="py-4 px-4 font-bold" style={{ color: T.text }}>{c.code}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${c.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
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
                      <td colSpan={6} className="py-8 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: T.text3 }}>
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
