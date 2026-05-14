import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { API } from "../../lib/api";
import { TrendingUp, AlertCircle } from "lucide-react";

interface CashflowData {
  week: string;
  amount: number;
}

export function CashflowChart() {
  const [data, setData] = useState<CashflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    API.get("/profissional/finance/cashflow")
      .then(({ data }) => {
        setData(data);
        setError(false);
      })
      .catch((err) => {
        console.error("CashflowChart Error:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full bg-theme-bg-muted/30 border border-theme-border/20 flex items-center justify-center animate-pulse">
        <span className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em] italic">Calculando Projeções...</span>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-[300px] w-full bg-theme-bg-muted/30 border border-theme-border/20 flex flex-col items-center justify-center gap-4">
        <AlertCircle size={24} className="text-theme-muted opacity-30" />
        <span className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em] italic text-center px-12">
          {error ? "Falha na sincronização de fluxo" : "Nenhuma projeção disponível para os próximos 30 dias"}
        </span>
      </div>
    );
  }

  const totalProjected = data.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.3em] italic">Projeção de Caixa (30 dias)</p>
          <div className="flex items-center gap-3">
             <span className="text-3xl font-heading font-black text-theme-text italic">
               R$ {totalProjected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
             </span>
             <div className="px-2 py-0.5 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full flex items-center gap-1">
                <TrendingUp size={10} className="text-brand-tactical" />
                <span className="text-[8px] font-black text-brand-tactical uppercase">Estimado</span>
             </div>
          </div>
        </div>
        <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest text-right max-w-[200px]">
          Valores baseados em pedidos aprovados aguardando janela de escrow.
        </p>
      </div>

      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 10, fontWeight: 900 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 10, fontWeight: 900 }}
              tickFormatter={(v) => `R$ ${v}`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(133,185,172,0.05)' }}
              contentStyle={{ 
                backgroundColor: "#000", 
                border: "1px solid rgba(133,185,172,0.3)",
                borderRadius: "0",
                padding: "12px"
              }}
              labelStyle={{ 
                color: "#14b8a6", 
                fontSize: "10px", 
                fontWeight: "900", 
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "4px"
              }}
              itemStyle={{ 
                color: "#fff", 
                fontSize: "12px", 
                fontWeight: "700",
                fontStyle: "italic"
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Montante"]}
            />
            <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill="#14b8a6" fillOpacity={Math.min(1, 0.8 + index * 0.05)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
