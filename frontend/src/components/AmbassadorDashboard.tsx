import { useState, useEffect, useCallback } from "react";
import { API } from "../lib/api";
import {
  Users, MousePointer2, TrendingUp, Copy, Check, ExternalLink,
  Award, BarChart3, Clock, CheckCircle2,
  Zap, ChevronRight, ChevronLeft, ToggleLeft, ToggleRight, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CampaignSummary {
  id: string; name: string; slug: string; rewardType: string;
  rewardValue: number; active: boolean; visits: number; conversions: number;
  conversionRate: string; earnedPaid: number; earnedPending: number;
}
interface NetworkSummary {
  campaigns: CampaignSummary[];
  totals: {
    visits: number; conversions: number;
    earnedPaid: number; earnedPending: number; campaigns: number;
  };
}
interface Conversion {
  id: string; campaignName: string; campaignSlug: string;
  rewardType: string; rewardAmount: number; status: string;
  createdAt: string; hasOrder: boolean; hasNewUser: boolean;
}
interface ConversionPage { conversions: Conversion[]; total: number; page: number; totalPages: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const pct = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "0%";
const relDate = (iso: string) => {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60)   return `${diff}min atrás`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
  return d.toLocaleDateString("pt-BR");
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden p-6 border transition-all group ${
      accent ? "bg-brand-tactical/10 border-brand-tactical/30" : "bg-theme-bg border-theme-border hover:border-theme-border"
    }`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-10 -translate-y-10" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${accent ? "bg-brand-tactical text-black" : "bg-theme-bg-muted text-theme-text-muted"}`}>
            {icon}
          </div>
          <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">{label}</p>
        </div>
        <p className={`text-3xl font-black italic tracking-tighter leading-none ${accent ? "text-brand-tactical" : "text-theme-text"}`}>
          {value}
        </p>
        {sub && <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">{sub}</p>}
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">{label}</p>
        <p className="text-[10px] font-black text-theme-text">{value.toLocaleString("pt-BR")}</p>
      </div>
      <div className="h-1.5 bg-theme-bg-muted w-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const AmbassadorDashboard = () => {
  const [tab, setTab]               = useState<"overview" | "campaigns" | "history">("overview");
  const [network, setNetwork]       = useState<NetworkSummary | null>(null);
  const [history, setHistory]       = useState<ConversionPage | null>(null);
  const [loading, setLoading]       = useState(true);
  const [histPage, setHistPage]     = useState(1);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toggling, setToggling]     = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // ── Fetch overview
  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/ambassador/network");
      setNetwork(data);
    } catch (e) {
      console.error("Ambassador network fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch conversion history
  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const { data } = await API.get(`/ambassador/conversions?page=${page}`);
      setHistory(data);
    } catch (e) {
      console.error("Ambassador history fetch failed:", e);
    }
  }, []);

  useEffect(() => { fetchNetwork(); }, [fetchNetwork]);
  useEffect(() => { if (tab === "history") fetchHistory(histPage); }, [tab, histPage, fetchHistory]);

  // ── Copy link
  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/embaixador/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // ── Toggle campaign
  const toggleCampaign = async (id: string) => {
    setToggling(id);
    try {
      await API.patch(`/ambassador/campaigns/${id}/toggle`);
      await fetchNetwork();
    } finally {
      setToggling(null);
    }
  };

  // ── Generate default code
  const generateCode = async () => {
    setGenerating(true);
    try {
      const { data } = await API.post("/ambassador/generate-code");
      setGeneratedLink(data.url);
      await fetchNetwork();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em]">Sincronizando Rede...</p>
      </div>
    </div>
  );

  const t = network?.totals;

  return (
    <div className="space-y-10">
      {/* ── Action Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold">
            Monitoramento de Performance em Tempo Real
          </p>
        </div>

        {/* Generate default link */}
        <div className="flex-shrink-0">
          {generatedLink ? (
            <div className="flex items-center gap-2 bg-brand-tactical/10 border border-brand-tactical/30 px-4 py-2">
              <Zap size={12} className="text-brand-tactical" />
              <span className="text-[10px] font-mono text-brand-tactical truncate max-w-[200px]">{generatedLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(generatedLink); setCopiedSlug("gen"); setTimeout(() => setCopiedSlug(null), 2000); }}>
                {copiedSlug === "gen" ? <Check size={12} className="text-brand-tactical" /> : <Copy size={12} className="text-theme-muted" />}
              </button>
            </div>
          ) : (
            <button
              onClick={generateCode}
              disabled={generating}
              className="fs-btn bg-brand-tactical text-black flex items-center gap-2"
            >
              {generating ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Sparkles size={14} />}
              Gerar Link de Embaixador
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Cliques Totais"   value={(t?.visits ?? 0).toLocaleString("pt-BR")} icon={<MousePointer2 size={14} />} />
        <KpiCard label="Conversões"       value={(t?.conversions ?? 0).toLocaleString("pt-BR")}
                 sub={pct(t?.conversions ?? 0, t?.visits ?? 0) + " de conversão"} icon={<TrendingUp size={14} />} />
        <KpiCard label="Ganhos Pagos"     value={fmt(t?.earnedPaid ?? 0)} icon={<Award size={14} />} accent />
        <KpiCard label="Pendente Liberar" value={fmt(t?.earnedPending ?? 0)}
                 sub="aprovação em até 7 dias" icon={<Clock size={14} />} />
      </div>

      {/* ── Funnel Visual ── */}
      {t && t.visits > 0 && (
        <div className="border border-theme-border bg-theme-bg-muted/5 p-8 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={14} className="text-brand-tactical" />
            <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Funil de Conversão</p>
          </div>
          <FunnelBar label="Visitas ao Link" value={t.visits} max={t.visits} color="bg-blue-500/60" />
          <FunnelBar label="Conversões" value={t.conversions} max={t.visits} color="bg-brand-tactical" />
          <FunnelBar label="Ganhos Pagos (R$)" value={Math.round(t.earnedPaid)} max={Math.round(t.earnedPaid + t.earnedPending)} color="bg-emerald-500" />
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-theme-border">
        {(["overview", "campaigns", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-[9px] font-black uppercase tracking-[0.3em] border-b-2 transition-all ${
              tab === t
                ? "border-brand-tactical text-brand-tactical"
                : "border-transparent text-theme-muted hover:text-theme-text"
            }`}
          >
            {t === "overview" ? "Resumo" : t === "campaigns" ? "Campanhas" : "Histórico"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── Tab: Overview ── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {(network?.campaigns ?? []).length === 0 ? (
                <div className="border  border-theme-border p-20 text-center space-y-4">
                  <Users size={36} className="mx-auto text-theme-border/20" />
                  <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Nenhuma campanha ativa.</p>
                  <p className="text-[9px] text-zinc-600 font-bold max-w-xs mx-auto">Clique em "Gerar Meu Link" para começar a ganhar com indicações.</p>
                </div>
              ) : (
                network?.campaigns.map(c => (
                  <div key={c.id} className="border border-theme-border bg-theme-bg-muted/5 p-6 space-y-4 hover:border-theme-border transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-theme-text uppercase italic">{c.name}</h3>
                        <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">
                          {c.rewardType === "CREDIT" ? "Crédito" : "Dinheiro"} • {fmt(c.rewardValue)} por conversão
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 ${c.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {c.active ? "Ativa" : "Pausada"}
                        </span>
                        <button onClick={() => toggleCampaign(c.id)} disabled={toggling === c.id} className="text-theme-muted hover:text-brand-tactical transition-colors">
                          {toggling === c.id
                            ? <div className="w-4 h-4 border border-theme-muted border-t-transparent rounded-full animate-spin" />
                            : c.active ? <ToggleRight size={18} className="text-brand-tactical" /> : <ToggleLeft size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-theme-border">
                      {[
                        { label: "Cliques", val: c.visits },
                        { label: "Conversões", val: c.conversions },
                        { label: "Taxa", val: c.conversionRate + "%" },
                      ].map(m => (
                        <div key={m.label} className="space-y-1">
                          <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest">{m.label}</p>
                          <p className="text-base font-black italic text-theme-text">{m.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 bg-theme-bg px-3 py-2 border border-theme-border">
                        <span className="text-[10px] font-mono text-theme-muted truncate">/embaixador/{c.slug}</span>
                        <button onClick={() => copyLink(c.slug)} className="ml-auto text-theme-muted hover:text-brand-tactical transition-colors">
                          {copiedSlug === c.slug ? <Check size={13} className="text-brand-tactical" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <button onClick={() => window.open(`${window.location.origin}/embaixador/${c.slug}`, "_blank")}
                        className="p-2 border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical/50 transition-all">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Campaigns grid ── */}
          {tab === "campaigns" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(network?.campaigns ?? []).map(c => (
                <div key={c.id} className={`border p-6 space-y-4 transition-all ${c.active ? "border-theme-border" : "border-theme-border/10 opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-theme-text uppercase italic">{c.name}</p>
                    <button onClick={() => toggleCampaign(c.id)} disabled={toggling === c.id} className="text-theme-muted hover:text-brand-tactical transition-colors">
                      {c.active ? <ToggleRight size={16} className="text-brand-tactical" /> : <ToggleLeft size={16} />}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <FunnelBar label="Pagos" value={Math.round(c.earnedPaid)} max={Math.round(c.earnedPaid + c.earnedPending + 1)} color="bg-emerald-500" />
                    <FunnelBar label="Pendente" value={Math.round(c.earnedPending)} max={Math.round(c.earnedPaid + c.earnedPending + 1)} color="bg-amber-500" />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-theme-muted">{c.visits} cliques • {c.conversions} conv.</span>
                    <span className="text-brand-tactical">{fmt(c.earnedPaid + c.earnedPending)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: History ── */}
          {tab === "history" && (
            <div className="space-y-4">
              {!history ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-4 h-4 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.conversions.length === 0 ? (
                <div className="border  border-theme-border p-16 text-center">
                  <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Nenhuma conversão ainda.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-theme-border/10 border border-theme-border">
                    {history.conversions.map(cv => (
                      <div key={cv.id} className="flex items-center justify-between p-5 hover:bg-theme-bg-muted/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 flex items-center justify-center ${cv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {cv.status === "PAID" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-theme-text uppercase italic">{cv.campaignName}</p>
                            <p className="text-[8px] font-bold text-theme-muted uppercase tracking-widest mt-0.5">
                              {cv.hasOrder ? "Compra" : cv.hasNewUser ? "Cadastro" : "Evento"} • {relDate(cv.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black italic tracking-tighter ${cv.status === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>
                            +{fmt(cv.rewardAmount)}
                          </p>
                          <p className={`text-[8px] font-black uppercase tracking-widest ${cv.status === "PAID" ? "text-emerald-500/60" : "text-amber-500/60"}`}>
                            {cv.status === "PAID" ? "Creditado" : "Pendente"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {history.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <button
                        onClick={() => setHistPage(p => Math.max(1, p - 1))}
                        disabled={histPage === 1}
                        className="fs-btn border border-theme-border text-theme-muted disabled:opacity-30 flex items-center gap-2"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>
                      <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">
                        Pág. {history.page} / {history.totalPages}
                      </p>
                      <button
                        onClick={() => setHistPage(p => Math.min(history.totalPages, p + 1))}
                        disabled={histPage === history.totalPages}
                        className="fs-btn border border-theme-border text-theme-muted disabled:opacity-30 flex items-center gap-2"
                      >
                        Próxima <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Rules Footer ── */}
      <div className="p-8 bg-brand-tactical/10 border border-brand-tactical/10 space-y-4">
        <h4 className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.3em] italic">Regras de Ouro</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Recompensas creditadas após aprovação do pedido (até 7 dias).",
            "Rastreamento via cookie dura 30 dias após o primeiro clique.",
            "Créditos podem comprar fotos ou produtos físicos.",
            "Uso indevido de links pode suspender a conta.",
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-[9px] text-theme-muted font-bold uppercase tracking-tight">
              <div className="mt-1.5 w-1 h-1 bg-brand-tactical rounded-full flex-shrink-0" />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
