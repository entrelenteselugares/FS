import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { Settings, Percent, DollarSign, Calculator, Save, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface Config {
  key: string;
  value: string;
  label: string;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const AdminConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [splitsTotal, setSplitsTotal] = useState(0);
  const [splitsValid, setSplitsValid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"splits" | "payouts">("splits");

  const fetchData = async () => {
    try {
      const [configRes, payoutRes] = await Promise.all([
        API.get("/admin/configs"),
        API.get("/admin/payouts")
      ]);
      setConfigs(configRes.data.configs);
      setSplitsTotal(configRes.data.splitsTotal);
      setSplitsValid(configRes.data.splitsValid);
      setPayouts(payoutRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (key: string, value: string) => {
    const updatedConfigs = configs.map((c) => c.key === key ? { ...c, value } : c);
    setConfigs(updatedConfigs);

    // Recalcula total dos splits em tempo real
    const splitKeys = ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"];
    const total = splitKeys.reduce((acc, k) => {
      const c = updatedConfigs.find((c) => c.key === k);
      return acc + Number(c?.value ?? 0);
    }, 0);
    setSplitsTotal(total);
    setSplitsValid(total === 100);
  };

  const handleSave = async () => {
    if (!splitsValid) return;
    setSaving(true);
    try {
      await API.patch("/admin/configs", { configs });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePayout = async () => {
    if (!confirm("Gerar relatório de repasse da semana atual?")) return;
    setGenerating(true);
    try {
      const { data } = await API.post("/admin/payouts/generate");
      setPayouts((p) => [data, ...p]);
      setTab("payouts");
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Erro ao gerar relatório.");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (payoutId: string, itemId: string) => {
    const pixTxId = prompt("ID da transação Pix (opcional):");
    try {
      await API.patch(`/admin/payouts/${payoutId}/items/${itemId}/paid`, { pixTxId });
      fetchData();
    } catch {
      alert("Erro ao marcar pagamento.");
    }
  };

  const splitConfigs = configs.filter((c) => c.key.startsWith("split_"));
  const otherConfigs = configs.filter((c) => !c.key.startsWith("split_"));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-6">
        <div>
          <h2 className="text-4xl font-heading text-white tracking-tighter uppercase">Inteligência Financeira</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mt-2 font-bold italic">Modelo de Repasse Pix Manual (Plataforma Master)</p>
        </div>
        <button
          onClick={handleGeneratePayout}
          disabled={generating}
          className="bg-brand-tactical text-white text-[10px] font-bold uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all rounded-none flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-brand-tactical/10"
        >
          {generating ? <RefreshCw className="animate-spin" size={14} /> : <Calculator size={14} />}
          {generating ? "GERANDO..." : "FECHAMENTO SEMANAL"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        <button 
          onClick={() => setTab("splits")}
          className={`px-8 py-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all border-b-2 ${tab === "splits" ? "border-brand-tactical text-white" : "border-transparent text-zinc-700 hover:text-zinc-400"}`}
        >
          DIVISÃO DE SPLIT
        </button>
        <button 
          onClick={() => setTab("payouts")}
          className={`px-8 py-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all border-b-2 ${tab === "payouts" ? "border-brand-tactical text-white" : "border-transparent text-zinc-700 hover:text-zinc-400"}`}
        >
          HISTÓRICO DE REPASSES ({payouts.length})
        </button>
      </div>

      {tab === "splits" && (
        <div className="space-y-12">
          {/* Info Banner */}
          <div className="bg-brand-tactical/5 border border-brand-tactical/20 p-8 flex gap-6 items-start">
            <div className="p-3 bg-brand-tactical/10 text-brand-tactical border border-brand-tactical/20">
              <Settings size={20} />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-2">Protocolo de Split Manual</h4>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-relaxed">
                A plataforma recebe 100% dos pagamentos. Os percentuais abaixo definem o valor provisionado para cada parceiro no relatório semanal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Split Distribution */}
            <div className="bg-white/[0.01] border border-white/5 p-10 space-y-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Percent size={14} /> Distribuição por Venda
                </h3>
                <div className={`px-4 py-1 text-[10px] font-bold border ${splitsValid ? "border-brand-tactical text-brand-tactical" : "border-red-900 text-red-500"}`}>
                  TOTAL: {splitsTotal}% {splitsValid ? "✓" : "⚠️ DEVE SER 100%"}
                </div>
              </div>

              <div className="space-y-8">
                {splitConfigs.map((config) => (
                  <div key={config.key} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">{config.label}</label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number"
                           value={config.value}
                           onChange={(e) => handleChange(config.key, e.target.value)}
                           className="w-20 bg-black border-zinc-900 border text-white text-right py-2 px-3 text-lg font-heading tracking-tighter focus:outline-none focus:border-brand-tactical transition-all"
                         />
                         <span className="text-zinc-800 font-bold uppercase text-[10px]">%</span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                       <div className="h-full bg-brand-tactical transition-all duration-700" style={{ width: `${Math.min(100, Number(config.value))}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSave}
                  disabled={saving || !splitsValid}
                  className={`w-full py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-2 ${
                    saved ? "bg-green-600 text-white" : splitsValid ? "bg-white text-black hover:bg-white/90" : "bg-zinc-900 text-zinc-700 cursor-not-allowed"
                  }`}
                >
                  {saved ? <CheckCircle size={14} /> : <Save size={14} />}
                  {saved ? "CONFIGURAÇÕES SINCRONIZADAS" : saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                </button>
              </div>
            </div>

            {/* Other Configs */}
            <div className="bg-white/[0.01] border border-white/5 p-10 space-y-10">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
                <Settings size={14} /> Parâmetros de Protocolo
              </h3>
              
              <div className="space-y-8">
                {otherConfigs.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">{config.label}</label>
                    <input 
                      value={config.value}
                      onChange={(e) => handleChange(config.key, e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical transition-all font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "payouts" && (
        <div className="space-y-8">
          {payouts.length === 0 ? (
            <div className="py-40 text-center border border-white/5 bg-black/40">
              <AlertTriangle className="mx-auto text-zinc-800 mb-4" size={48} />
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] font-bold italic">Nenhum relatório de repasse gerado no sistema.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="bg-black border border-white/5 hover:border-white/10 transition-all group overflow-hidden">
                   <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div>
                        <div className="flex items-center gap-4">
                           <span className="text-xl font-heading text-white uppercase tracking-tighter">
                             Período {new Date(payout.weekStart).toLocaleDateString("pt-BR")} — {new Date(payout.weekEnd).toLocaleDateString("pt-BR")}
                           </span>
                           <span className={`text-[8px] font-bold px-3 py-1 border uppercase tracking-widest ${
                             payout.status === "PAID" ? "border-brand-tactical text-brand-tactical" : "border-amber-900 text-amber-500"
                           }`}>
                             {payout.status === "PAID" ? "PAGO" : "PENDENTE"}
                           </span>
                        </div>
                        <div className="mt-2 flex gap-8">
                           <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Receita: <span className="text-white font-mono">{formatCurrency(payout.totalRevenue)}</span></span>
                           <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Repasse: <span className="text-brand-tactical font-mono">{formatCurrency(payout.totalPayout)}</span></span>
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-[9px] font-mono group-hover:text-white transition-all uppercase tracking-widest">
                        ID: {payout.id.slice(-8).toUpperCase()}
                      </div>
                   </div>

                   <div className="divide-y divide-white/5">
                      {payout.items?.map((item: any) => (
                        <div key={item.id} className="px-10 py-6 grid grid-cols-12 items-center gap-8 hover:bg-white/[0.01] transition-all">
                           <div className="col-span-1">
                              <span className="text-[8px] font-bold text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-none">{item.recipientType}</span>
                           </div>
                           <div className="col-span-3">
                              <div className="text-[11px] font-bold text-white uppercase tracking-widest">{item.recipientName}</div>
                              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Pix: {item.pixKey || "NÃO CADASTRADO"}</div>
                           </div>
                           <div className="col-span-3 text-center border-l border-white/5">
                              <div className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Base de Cálculo</div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-1">{item.orderCount} PEDIDOS · {item.splitPct}% DE {formatCurrency(item.grossRevenue)}</div>
                           </div>
                           <div className="col-span-2 text-right">
                              <div className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Valor Líquido</div>
                              <div className="text-lg font-heading text-brand-tactical tracking-widest mt-0.5">{formatCurrency(item.amount)}</div>
                           </div>
                           <div className="col-span-3 flex justify-end">
                              {item.status === "PAID" ? (
                                <div className="flex flex-col items-end">
                                   <div className="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                      <CheckCircle size={10} /> REPASSE CONCLUÍDO
                                   </div>
                                   {item.pixTxId && <div className="text-[8px] text-zinc-700 font-mono mt-1">REF: {item.pixTxId.slice(0, 16)}...</div>}
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleMarkPaid(payout.id, item.id)}
                                  className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest border border-brand-tactical/30 px-6 py-3 hover:bg-brand-tactical hover:text-white transition-all rounded-none flex items-center gap-2"
                                >
                                  <DollarSign size={10} /> REPASSAR VIA PIX
                                </button>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
