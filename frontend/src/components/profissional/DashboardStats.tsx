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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <div key={kpi.label} className={`lux-card rounded-2xl border border-theme-border/60 hover:border-brand-tactical/30 p-4 md:p-6 space-y-2 md:space-y-4 group ${kpi.highlight ? 'border-brand-tactical/50 shadow-brand-tactical/5 bg-brand-tactical/[0.02]' : ''} transition-all`}>
          <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">{kpi.label}</span>
          <div className={`text-2xl md:text-3xl font-heading font-black italic leading-none ${kpi.highlight ? 'text-brand-tactical' : 'text-theme-text'}`}>{kpi.value}</div>
          <div className="text-[8px] font-black text-theme-muted uppercase tracking-widest">{kpi.unit}</div>
        </div>
      ))}
    </div>
  );
}
