import React, { useState, useCallback, useMemo } from "react";
import { Calculator, RefreshCw, DollarSign, ArrowRight, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "../../lib/api";
import { toast } from "sonner";
import { AdminConfigsSplits } from "./configs/AdminConfigsSplits";
import { AdminConfigsPayouts } from "./configs/AdminConfigsPayouts";
import { AdminConfigsInfra } from "./configs/AdminConfigsInfra";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const REQUIRED_SPLITS = [
  { key: "markup_cliente", label: "Markup Cliente (Preço Final) %", value: "20" },
  { key: "take_rate_profissional", label: "Taxa de Intermediação Profissional (Take Rate) %", value: "7" },
  { key: "split_affiliate", label: "Taxa de Afiliado (%)", value: "2" },
  { key: "split_taxes", label: "Impostos (%)", value: "6" },
  { key: "split_platform_costs", label: "Custos da Plataforma (%)", value: "5" },
];

const REQUIRED_INFRA = [
  { key: "brand_primary", label: "Cor Primária", value: "#0a0a0a" },
  { key: "brand_tactical", label: "Cor Tática", value: "#85B9AC" },
  { key: "maintenance_mode", label: "Modo Manutenção", value: "false" },
  { key: "public_access", label: "Vitrine Global", value: "true" },
  { key: "min_hourly_rate", label: "Valor Hora Mínimo (€)", value: "14" },
];

export const AdminConfigs: React.FC = () => {
  const queryClient = useQueryClient();
  const [localConfigs, setLocalConfigs] = useState<{ key: string; value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"splits" | "payouts" | "infra">("splits");
  const [payoutModal, setPayoutModal] = useState<{ payoutId: string; itemId: string; name: string; amount: number } | null>(null);
  const [pixTxId, setPixTxId] = useState("");
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // Fetch com React Query
  const { data } = useQuery({
    queryKey: ["admin-configs"],
    queryFn: async () => {
      const [configRes, payoutRes] = await Promise.all([
        API.get("/admin/configs"),
        API.get("/admin/payouts"),
      ]);
      const dbConfigs = configRes.data.configs || [];
      const merged = [...dbConfigs];
      [...REQUIRED_SPLITS, ...REQUIRED_INFRA].forEach(req => {
        if (!merged.find((c: { key: string }) => c.key === req.key)) merged.push(req);
      });
      setLocalConfigs(merged);
      return { configs: merged, payouts: payoutRes.data, splitsValid: configRes.data.splitsValid ?? true };
    },
  });

  const payouts = data?.payouts ?? [];

  const handleChange = useCallback((key: string, value: string) => {
    setLocalConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await API.patch("/admin/configs", { configs: localConfigs });
      setSaved(true);
      toast.success("Configurações sincronizadas!");
      queryClient.invalidateQueries({ queryKey: ["admin-configs"] });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }, [localConfigs, queryClient]);

  const handleGeneratePayout = useCallback(async () => {
    setShowGenerateConfirm(false);
    setGenerating(true);
    try {
      await API.post("/admin/payouts/generate");
      toast.success("Relatório gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-configs"] });
      setTab("payouts");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar relatório.");
    } finally {
      setGenerating(false);
    }
  }, [queryClient]);

  const confirmPayout = useCallback(async () => {
    if (!payoutModal) return;
    try {
      await API.patch(`/admin/payouts/${payoutModal.payoutId}/items/${payoutModal.itemId}/paid`, { pixTxId });
      setPayoutModal(null);
      setPixTxId("");
      queryClient.invalidateQueries({ queryKey: ["admin-configs"] });
      toast.success("Comprovante registrado!");
    } catch {
      toast.error("Erro ao registrar pagamento.");
    }
  }, [payoutModal, pixTxId, queryClient]);

  const splitsValid = useMemo(() => true, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-theme-border pb-10 gap-3 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase text-theme-text">Configurações do Sistema</h1>
          <p className="text-theme-muted mt-2 text-sm">Split de pagamentos, taxas, regras de negócio e infraestrutura</p>
        </div>
        <button
          onClick={() => setShowGenerateConfirm(true)}
          disabled={generating}
          className="px-4 md:px-8 py-4 bg-brand-tactical text-zinc-950 text-[9px] font-bold uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3 "
        >
          {generating ? <RefreshCw className="animate-spin" size={14} /> : <Calculator size={14} />}
          {generating ? "SINCRONIZANDO..." : "FECHAMENTO SEMANAL"}
        </button>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex bg-theme-bg border border-theme-border p-1.5 shadow-sm w-full md:w-auto md:max-w-fit gap-1 rounded-2xl">
        {(["splits", "payouts", "infra"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 md:px-8 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider transition-all rounded-xl ${
              tab === t ? "bg-brand-tactical text-zinc-950 shadow-md" : "text-theme-muted hover:text-theme-text"
            }`}
          >
            {t === "splits" ? "Divisão de Split" : t === "payouts" ? `Orçamentos (${payouts.length})` : "Infraestrutura"}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {tab === "splits" && (
        <AdminConfigsSplits
          configs={localConfigs}
          splitsValid={splitsValid}
          saving={saving}
          saved={saved}
          onChange={handleChange}
          onSave={handleSave}
        />
      )}
      {tab === "payouts" && (
        <AdminConfigsPayouts payouts={payouts} onOpenPayoutModal={setPayoutModal} />
      )}
      {tab === "infra" && (
        <AdminConfigsInfra configs={localConfigs} saving={saving} onChange={handleChange} onSave={handleSave} />
      )}

      {/* MODAL: Gerar Fechamento */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl" onClick={() => setShowGenerateConfirm(false)} />
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-5 md:p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-brand-tactical/10 rounded-[30px] flex items-center justify-center border border-brand-tactical/20 mx-auto">
                <Calculator className="text-brand-tactical" size={32} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold uppercase text-theme-text ">Gerar Fechamento?</h3>
                <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-[0.4em] ">Consolidação de Provisões Semanal</p>
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] leading-relaxed text-theme-muted ">
                ESTA AÇÃO IRÁ CONSOLIDAR TODAS AS VENDAS DA SEMANA E GERAR AS ORDENS DE REPASSE PARA OS PARCEIROS.
              </p>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <button onClick={handleGeneratePayout} className="w-full py-5 bg-brand-tactical text-zinc-950 text-[11px] font-bold uppercase tracking-[0.4em] rounded-[20px] flex items-center justify-center gap-4 hover:brightness-110 transition-all">
                  GERAR AGORA <ArrowRight size={18} strokeWidth={1.5} />
                </button>
                <button onClick={() => setShowGenerateConfirm(false)} className="w-full py-5 border border-theme-border text-theme-muted text-[11px] font-bold uppercase tracking-[0.4em] hover:text-white transition-all rounded-[20px] ">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Liquidação Pix */}
      {payoutModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl" onClick={() => setPayoutModal(null)} />
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-4 md:p-8 border-b border-theme-border flex items-center justify-between bg-theme-bg-muted rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <DollarSign className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase text-theme-text">Liquidação</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Registro de Comprovante Pix</p>
                </div>
              </div>
              <button onClick={() => setPayoutModal(null)} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>
            <div className="p-4 md:p-8 space-y-8">
              <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-[30px] space-y-6">
                <div className="flex justify-between items-center border-b border-theme-border pb-4">
                  <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Favorecido</span>
                  <span className="text-[12px] text-theme-text font-bold uppercase ">{payoutModal.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Valor do Repasse</span>
                  <span className="text-3xl font-heading text-brand-tactical font-bold ">{formatCurrency(payoutModal.amount)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[8px] font-bold text-theme-muted uppercase tracking-widest block mb-2 opacity-60 ">ID da Transação Pix (Auditoria)</label>
                <div className="relative">
                  <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={16} strokeWidth={1.5} />
                  <input
                    autoFocus value={pixTxId}
                    onChange={e => setPixTxId(e.target.value)}
                    placeholder="COLE O COMPROVANTE..."
                    className="w-full bg-theme-bg-muted border border-theme-border p-5 pl-12 text-[11px] font-bold text-theme-text placeholder:opacity-20 focus:border-brand-tactical outline-none transition-all uppercase rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setPayoutModal(null)} className="flex-1 py-5 border border-theme-border text-[11px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] ">Cancelar</button>
                <button onClick={confirmPayout} className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-bold uppercase tracking-[0.3em] rounded-[20px] flex items-center justify-center gap-4 hover:brightness-110 transition-all">
                  CONFIRMAR <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
