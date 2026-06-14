interface StatsProps {
  completedEvents: number;
  totalEarnings: number;
  monthEarnings: number;
  agilityPoints?: number;
}

export function DashboardStats({ completedEvents, totalEarnings, monthEarnings, agilityPoints = 0 }: StatsProps) {
  const kpis = [
    { label: "Performance de Entrega", value: `${completedEvents}`, unit: "Eventos" },
    { label: "Acumulado Global", value: `R$ ${totalEarnings.toLocaleString()}`, unit: "Provisionado p/ Repasse" },
    { label: "Resultado do Mês", value: `R$ ${monthEarnings.toLocaleString()}`, unit: "Meta de Produção Ativa" },
    { label: "Pontos de Agilidade", value: `${agilityPoints}`, unit: "SLA Gamification", highlight: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {kpis.map((kpi) => (
        <div key={kpi.label} className={`bg-theme-bg-muted rounded-xl border border-theme-border hover:border-brand-tactical/30 p-3 md:p-6 space-y-1 md:space-y-4 group flex flex-col justify-between ${kpi.highlight ? 'border-brand-tactical/50 shadow-brand-tactical/5 bg-brand-tactical/[0.02]' : 'shadow-sm'} transition-all min-w-0`}>
          <span className="text-[9px] md:text-[10px] font-bold text-theme-muted uppercase tracking-widest line-clamp-2 md:line-clamp-none leading-tight">{kpi.label}</span>
          <div className={`text-lg md:text-3xl font-heading font-black italic leading-none truncate ${kpi.highlight ? 'text-brand-tactical' : 'text-theme-text'}`} title={kpi.value}>{kpi.value}</div>
          <div className="text-[9px] md:text-[10px] font-bold text-theme-muted uppercase tracking-widest leading-tight">{kpi.unit}</div>
        </div>
      ))}
    </div>
  );
}
