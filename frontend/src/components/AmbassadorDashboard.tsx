import { useState, useEffect } from "react";
import { API } from "../lib/api";
import { Users, MousePointer2, TrendingUp, Copy, Check, ExternalLink, Award } from "lucide-react";

interface CampaignStats {
  id: string;
  name: string;
  slug: string;
  rewardType: string;
  rewardValue: number;
  visits: number;
  conversions: number;
  active: boolean;
}

export const AmbassadorDashboard = () => {
  const [stats, setStats] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    API.get("/ambassador/stats")
      .then(({ data }) => setStats(data))
      .catch(err => console.error("Error fetching ambassador stats:", err))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/embaixador/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="text-[10px] font-black tracking-[0.5em] text-brand-tactical animate-pulse uppercase">Sincronizando Rede...</div>
    </div>
  );

  const totalClicks = stats.reduce((acc, curr) => acc + curr.visits, 0);
  const totalConversions = stats.reduce((acc, curr) => acc + curr.conversions, 0);
  const totalEarnings = stats.reduce((acc, curr) => acc + (curr.conversions * curr.rewardValue), 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="border-b border-theme-border/60 pb-6">
        <h2 className="text-3xl font-black text-theme-text uppercase tracking-tighter italic">Painel de Embaixador</h2>
        <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-black italic">Compartilhe e Ganhe Recompensas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Cliques Totais", value: totalClicks, icon: <MousePointer2 size={20} />, color: "text-blue-400" },
          { label: "Conversões", value: totalConversions, icon: <TrendingUp size={20} />, color: "text-emerald-400" },
          { label: "Ganhos Acumulados", value: `R$ ${totalEarnings.toFixed(2)}`, icon: <Award size={20} />, color: "text-brand-tactical" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-theme-bg-muted/30 border border-theme-border/20 p-8 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {kpi.icon}
            </div>
            <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">{kpi.label}</p>
            <p className={`text-4xl font-black italic tracking-tighter ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-6 bg-brand-tactical" />
            <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Suas Campanhas Ativas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {stats.length > 0 ? (
            stats.map(c => (
              <div key={c.id} className="bg-theme-bg border border-theme-border/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-tactical/30 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-theme-bg-muted flex items-center justify-center text-brand-tactical border border-theme-border/20">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tight">{c.name}</h3>
                    <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">
                      {c.rewardType === "CREDIT" ? "Recompensa em Créditos" : "Recompensa em Dinheiro"} • R$ {Number(c.rewardValue).toFixed(2)} por venda
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:flex-none flex items-center gap-4 bg-zinc-950 px-4 py-2 border border-white/5">
                    <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">/embaixador/{c.slug}</span>
                    <button 
                      onClick={() => copyLink(c.slug)}
                      className="text-brand-tactical hover:text-white transition-colors"
                    >
                      {copiedSlug === c.slug ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <button 
                    onClick={() => window.open(`${window.location.origin}/embaixador/${c.slug}`, "_blank")}
                    className="p-2 border border-white/10 hover:border-brand-tactical/50 transition-all text-theme-muted hover:text-brand-tactical"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 border border-dashed border-theme-border/40 text-center space-y-4 bg-theme-bg-muted/10">
              <Users size={40} className="mx-auto text-theme-border/20" />
              <div className="space-y-2">
                <p className="text-[10px] text-theme-muted uppercase font-black italic tracking-widest">Nenhuma campanha vinculada.</p>
                <p className="text-[8px] text-zinc-600 uppercase font-bold max-w-xs mx-auto leading-relaxed">Solicite ao administrador para participar do programa de embaixadores e começar a lucrar com sua rede.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules Footer */}
      <div className="p-8 bg-brand-tactical/5 border border-brand-tactical/10 rounded-2xl space-y-4">
        <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Regras de Ouro</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "As recompensas são creditadas após a aprovação do pedido.",
            "O rastreamento via cookies dura 30 dias após o primeiro clique.",
            "Créditos podem ser usados para comprar fotos ou produtos físicos.",
            "O uso indevido de links pode levar à suspensão da conta."
          ].map((rule, i) => (
            <li key={i} className="flex items-center gap-3 text-[9px] text-theme-muted uppercase font-bold tracking-tight">
              <div className="w-1 h-1 bg-brand-tactical rounded-full" /> {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
