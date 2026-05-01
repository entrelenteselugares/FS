interface StatsProps {
  completedEvents: number;
  totalEarnings: number;
  monthEarnings: number;
}

export function DashboardStats({ completedEvents, totalEarnings, monthEarnings }: StatsProps) {
  const kpis = [
    { label: "Performance de Entrega", value: `${completedEvents}`, unit: "Eventos" },
    { label: "Acumulado Global", value: `R$ ${totalEarnings.toLocaleString()}`, unit: "Provisionado p/ Repasse" },
    { label: "Resultado do Mês", value: `R$ ${monthEarnings.toLocaleString()}`, unit: "Meta de Produção Ativa" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-theme-bg border border-theme-border/60 p-4 md:p-6 space-y-2 md:space-y-4 group hover:border-brand-tactical/50 transition-all shadow-sm">
          <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">{kpi.label}</span>
          <div className="text-2xl md:text-3xl font-heading font-black text-brand-tactical italic leading-none">{kpi.value}</div>
          <div className="text-[8px] font-black text-theme-muted uppercase tracking-widest">{kpi.unit}</div>
        </div>
      ))}
    </div>
  );
}
