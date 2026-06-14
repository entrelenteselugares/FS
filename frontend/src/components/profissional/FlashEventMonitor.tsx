import { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import {
  Activity, CreditCard, Printer, RefreshCw, CheckCircle2,
  XCircle, Clock, Zap, AlertTriangle, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EventStats {
  event: { id: string; title: string; slug: string; type: string };
  cards: {
    total: number; unused: number; used: number; claimed: number;
    conversionRate: string;
  };
  prints: { pending: number; printing: number; done: number; error: number };
  checkedAt: string;
}

const POLL_INTERVAL = 10000; // 10s

export function FlashEventMonitor({ eventId }: { eventId: string }) {
  const [stats, setStats]       = useState<EventStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [isError, setIsError]   = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await API.get(`/flash/${eventId}/stats`);
      setStats(data);
      setLastPoll(new Date());
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Poll every 10s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return (
    <div className="flex items-center gap-3 p-12 justify-center">
      <div className="w-4 h-4 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Carregando monitoramento...</p>
    </div>
  );

  if (isError || !stats) return (
    <div className="p-12 text-center border border-red-500/20 bg-red-500/5">
      <AlertTriangle size={32} className="mx-auto text-red-500/60 mb-3" />
      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Erro ao carregar dados do evento.</p>
    </div>
  );

  const printTotal = stats.prints.pending + stats.prints.printing + stats.prints.done + stats.prints.error;
  const printDonePct = printTotal > 0
    ? Math.round((stats.prints.done / printTotal) * 100)
    : 0;

  const convRate = parseFloat(stats.cards.conversionRate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[9px] font-bold text-theme-brand uppercase tracking-[0.4em]">Ao vivo</p>
          </div>
          <h3 className="text-xl font-bold text-theme-text uppercase">
            {stats.event.title}
          </h3>
          <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">
            Atualizado {lastPoll ? lastPoll.toLocaleTimeString("pt-BR") : "—"} • polling a cada 10s
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical/40 transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Conversion Rate Highlight */}
      <div className="p-6 bg-brand-tactical/10 border border-brand-tactical/20 flex items-center gap-6">
        <div className="p-3 bg-brand-tactical/10">
          <TrendingUp size={20} className="text-brand-tactical" />
        </div>
        <div>
          <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Taxa de Conversão</p>
          <p className="text-4xl font-bold text-brand-tactical leading-none mt-1">
            {stats.cards.conversionRate}
          </p>
        </div>
        {/* Mini funnel */}
        <div className="ml-auto hidden md:flex items-end gap-1 h-10">
          {[
            { h: 100, color: "bg-blue-500", label: `${stats.cards.total} total` },
            { h: stats.cards.total > 0 ? (stats.cards.used / stats.cards.total) * 100 : 0, color: "bg-brand-tactical", label: `${stats.cards.used} usados` },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div style={{ height: `${Math.max(4, b.h)}%` }} className={`w-6 ${b.color} transition-all duration-500`} />
              <p className="text-[9px] font-bold text-theme-muted uppercase">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card Status Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={13} className="text-brand-tactical" />
          <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em]">Cartões Flash</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total",     value: stats.cards.total,   color: "text-theme-text",  bg: "bg-theme-bg" },
            { label: "Não Usados",value: stats.cards.unused,  color: "text-blue-500",    bg: "bg-blue-500" },
            { label: "Utilizados",value: stats.cards.used,    color: "text-brand-tactical", bg: "bg-brand-tactical/10" },
            { label: "Resgatados",value: stats.cards.claimed, color: "text-theme-brand", bg: "bg-emerald-500/5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`p-4 border border-theme-border ${bg} space-y-2`}>
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">{label}</p>
              <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Print Queue */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Printer size={13} className="text-theme-muted" />
          <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em]">Fila de Impressão</p>
          {stats.prints.printing > 0 && (
            <span className="ml-auto text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
              {stats.prints.printing} imprimindo
            </span>
          )}
        </div>

        {/* Progress bar */}
        {printTotal > 0 && (
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-theme-muted uppercase tracking-widest">
              <span>{stats.prints.done} concluídas</span>
              <span>{printDonePct}%</span>
            </div>
            <div className="h-1.5 bg-theme-bg-muted w-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${printDonePct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pendentes",  value: stats.prints.pending,  icon: <Clock size={12} />,        color: "text-amber-400" },
            { label: "Imprimindo", value: stats.prints.printing, icon: <Activity size={12} />,     color: "text-blue-500" },
            { label: "Concluídas", value: stats.prints.done,     icon: <CheckCircle2 size={12} />, color: "text-theme-brand" },
            { label: "Com Erro",   value: stats.prints.error,    icon: <XCircle size={12} />,      color: "text-red-400" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="flex items-center gap-3 p-4 border border-theme-border bg-theme-bg-muted/5">
              <div className={color}>{icon}</div>
              <div>
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">{label}</p>
                <p className={`text-lg font-black italic tracking-tighter leading-none mt-0.5 ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {stats.prints.error > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/5"
          >
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide">
              {stats.prints.error} impressão(ões) com erro — verifique a fila e reinicie o agente de impressão.
            </p>
          </motion.div>
        )}
        {convRate >= 80 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 border border-brand-tactical/30 bg-brand-tactical/10"
          >
            <Zap size={14} className="text-brand-tactical flex-shrink-0" />
            <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-wide">
              Alta conversão ({stats.cards.conversionRate})! Considere gerar mais cartões se necessário.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
