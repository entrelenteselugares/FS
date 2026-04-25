import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { Settings, Percent, DollarSign, Calculator, Save, CheckCircle, AlertTriangle, RefreshCw, Palette, Shield } from "lucide-react";
import { T } from "../../lib/theme";

interface Config {
  key: string;
  value: string;
  label: string;
}

interface PayoutItem {
  id: string;
  recipientType: string;
  recipientName: string;
  pixKey: string;
  splitPct: number;
  grossRevenue: number;
  amount: number;
  status: "PENDING" | "PAID";
  pixTxId?: string;
  orderCount: number;
}

interface Payout {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: "PENDING" | "PAID";
  totalRevenue: number;
  totalPayout: number;
  items?: PayoutItem[];
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const safeDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
};

export const AdminConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [splitsTotal, setSplitsTotal] = useState(0);
  const [splitsValid, setSplitsValid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"splits" | "payouts" | "infra">("splits");

  const [payoutModal, setPayoutModal] = useState<{payoutId: string, itemId: string, name: string, amount: number} | null>(null);
  const [pixTxId, setPixTxId] = useState("");

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
    } catch (err) {
      const axiosError = err as import("axios").AxiosError<{ error: string }>;
      alert(axiosError.response?.data?.error ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleGeneratePayout = async () => {
    setShowGenerateConfirm(false);
    setGenerating(true);
    try {
      const { data } = await API.post("/admin/payouts/generate");
      setPayouts((p) => [data, ...p]);
      setTab("payouts");
      showNotification("Relatório gerado com sucesso!");
    } catch (err) {
      const axiosError = err as import("axios").AxiosError<{ error: string }>;
      showNotification(axiosError.response?.data?.error ?? "Erro ao gerar relatório.", 'error');
    } finally {
      setGenerating(false);
    }
  };

  const confirmPayout = async () => {
    if (!payoutModal) return;
    try {
      await API.patch(`/admin/payouts/${payoutModal.payoutId}/items/${payoutModal.itemId}/paid`, { pixTxId });
      setPayoutModal(null);
      setPixTxId("");
      fetchData();
      showNotification("Comprovante registrado!");
    } catch {
      showNotification("Erro ao registrar pagamento.", 'error');
    }
  };


  const splitConfigs = configs.filter((c) => c.key.startsWith("split_"));
  const otherConfigs = configs.filter((c) => !c.key.startsWith("split_"));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase leading-none pt-2">Inteligência Financeira</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold italic">Modelo de Repasse Pix Manual (Plataforma Master)</p>
        </div>
        <button
          onClick={() => setShowGenerateConfirm(true)}
          disabled={generating}
          style={{ 
            background: T.brand, color: T.brandText, padding: "10px 20px", 
            border: "none", fontSize: 9, fontWeight: 900, 
            textTransform: "uppercase", letterSpacing: "0.3em", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, opacity: generating ? 0.5 : 1
          }}
        >
          {generating ? <RefreshCw className="animate-spin" size={12} /> : <Calculator size={12} />}
          {generating ? "GERANDO..." : "FECHAMENTO SEMANAL"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}` }}>
        <button 
          onClick={() => setTab("splits")}
          style={{ 
            padding: "10px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: "0.2em", cursor: "pointer", background: "transparent",
            color: tab === "splits" ? T.text : T.text3,
            border: "none", borderBottom: `2px solid ${tab === "splits" ? T.brand : "transparent"}`,
            transition: "all 0.2s"
          }}
        >
          DIVISÃO DE SPLIT
        </button>
        <button 
          onClick={() => setTab("payouts")}
          style={{ 
            padding: "10px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: "0.2em", cursor: "pointer", background: "transparent",
            color: tab === "payouts" ? T.text : T.text3,
            border: "none", borderBottom: `2px solid ${tab === "payouts" ? T.brand : "transparent"}`,
            transition: "all 0.2s"
          }}
        >
          REPASSES ({payouts.length})
        </button>
        <button 
          onClick={() => setTab("infra")}
          style={{ 
            padding: "10px 20px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: "0.2em", cursor: "pointer", background: "transparent",
            color: tab === "infra" ? T.text : T.text3,
            border: "none", borderBottom: `2px solid ${tab === "infra" ? T.brand : "transparent"}`,
            transition: "all 0.2s"
          }}
        >
          INFRAESTRUTURA
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
              <h4 className="text-[11px] font-bold text-theme-text uppercase tracking-widest mb-2">Protocolo de Split Manual</h4>
              <p className="text-theme-muted text-[10px] uppercase tracking-widest leading-relaxed">
                A plataforma recebe 100% dos pagamentos. Os percentuais abaixo definem o valor provisionado para cada parceiro no relatório semanal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Split Distribution */}
            <div className="bg-white/[0.01] border border-white/5 p-10 space-y-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.4em] flex items-center gap-2">
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
                      <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">
                        {config.key === "split_cartorio" ? "Unidade Fixa (Logística)" : 
                         config.key === "split_captacao" ? "Captação (Profissional da Rede)" :
                         config.key === "split_edicao" ? "Edição (Profissional da Rede)" :
                         config.label}
                      </label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number"
                           value={config.value}
                           onChange={(e) => handleChange(config.key, e.target.value)}
                           className="w-20 bg-theme-bg-muted border-theme-border border text-theme-text text-right py-2 px-3 text-lg font-heading tracking-tighter focus:outline-none focus:border-brand-tactical transition-all"
                         />
                         <span className="text-theme-muted font-bold uppercase text-[10px]">%</span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                       <div className="h-full bg-brand-tactical transition-all duration-700" style={{ width: `${Math.min(100, Number(config.value))}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: 16 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !splitsValid}
                  style={{ 
                    width: "100%", padding: "12px", border: "none",
                    background: saved ? "#16a34a" : splitsValid ? T.text : T.bgField,
                    color: saved ? "#fff" : splitsValid ? T.bg : T.text3,
                    fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                    letterSpacing: "0.2em", cursor: splitsValid ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.2s"
                  }}
                >
                  {saved ? <CheckCircle size={12} /> : <Save size={12} />}
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
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">{config.label}</label>
                    <input 
                      value={config.value}
                      onChange={(e) => handleChange(config.key, e.target.value)}
                      className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all font-sans"
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
                             Período {safeDate(payout.weekStart)} — {safeDate(payout.weekEnd)}
                           </span>
                           <span className={`text-[8px] font-bold px-3 py-1 border uppercase tracking-widest ${
                             payout.status === "PAID" ? "border-brand-tactical text-brand-tactical" : "border-amber-900 text-amber-500"
                           }`}>
                             {payout.status === "PAID" ? "PAGO" : "PENDENTE"}
                           </span>
                        </div>
                        <div className="mt-2 flex gap-8">
                           <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Receita: <span className="text-white font-sans">{formatCurrency(payout.totalRevenue)}</span></span>
                           <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Repasse: <span className="text-brand-tactical font-sans">{formatCurrency(payout.totalPayout)}</span></span>
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-[9px] font-sans group-hover:text-white transition-all uppercase tracking-widest">
                        ID: {payout.id.slice(-8).toUpperCase()}
                      </div>
                   </div>

                   <div className="divide-y divide-white/5">
                      {payout.items?.map((item) => (
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
                              <div className="text-[10px] text-zinc-400 font-sans mt-1">{item.orderCount} PEDIDOS · {item.splitPct}% DE {formatCurrency(item.grossRevenue)}</div>
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
                                   {item.pixTxId && <div className="text-[8px] text-zinc-700 font-sans mt-1">REF: {item.pixTxId.slice(0, 16)}...</div>}
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setPayoutModal({ payoutId: payout.id, itemId: item.id, name: item.recipientName, amount: item.amount })}
                                  className="text-[9px] font-bold text-black uppercase tracking-widest bg-brand-tactical border border-brand-tactical px-6 py-3 hover:brightness-110 transition-all rounded-none flex items-center gap-2"
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

      {tab === "infra" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
           {/* Branding */}
           <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: "24px" }}>
              <div className="flex items-center gap-3 mb-8">
                <Palette size={16} style={{ color: T.brand }} />
                <h3 style={{ fontSize: 10, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: 2 }}>Identidade Visual</h3>
              </div>
              
              <div className="space-y-8">
                {["brand_primary", "brand_tactical"].map(key => {
                   const config = configs.find(c => c.key === key);
                   if (!config) return null;
                   return (
                     <div key={key} className="space-y-3">
                        <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>{config.label}</label>
                        <div className="flex items-center gap-4">
                           <div style={{ width: 40, height: 40, background: config.value, border: `1px solid ${T.border}` }} />
                           <input 
                             type="color" 
                             value={config.value} 
                             onChange={e => handleChange(key, e.target.value)}
                             style={{ flex: 1, background: T.bgField, border: "none", height: 40, padding: "0 8px", cursor: "pointer" }}
                           />
                        </div>
                     </div>
                   );
                })}
              </div>
           </div>

           {/* Maintenance & Access */}
           <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: "24px" }}>
              <div className="flex items-center gap-3 mb-8">
                <Shield size={16} style={{ color: T.brand }} />
                <h3 style={{ fontSize: 10, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: 2 }}>Protocolos de Acesso</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { key: "maintenance_mode", label: "Modo Manutenção", desc: "Bloqueia acesso público à plataforma" },
                  { key: "public_access", label: "Acesso à Vitrine", desc: "Permite visualização sem login" }
                ].map(item => {
                   const config = configs.find(c => c.key === item.key);
                   if (!config) return null;
                   const isOn = config.value === "true";
                   return (
                     <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: `1px solid ${T.border}`, background: `${T.bgField}55` }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                          <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", marginTop: 2 }}>{item.desc}</div>
                        </div>
                        <button 
                          onClick={() => handleChange(item.key, isOn ? "false" : "true")}
                          style={{ 
                            width: 32, height: 16, background: isOn ? T.brand : T.border, 
                            border: "none", position: "relative", cursor: "pointer", transition: "all 0.3s"
                          }}
                        >
                          <div style={{ 
                            width: 12, height: 12, background: isOn ? T.brandText : T.text3, 
                            position: "absolute", top: 2, left: isOn ? 18 : 2, transition: "all 0.3s" 
                          }} />
                        </button>
                     </div>
                   );
                })}
              </div>
           </div>

           <div className="md:col-span-2 pt-8 flex justify-center">
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  padding: "16px 40px", background: T.brand, color: T.brandText,
                  fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                  letterSpacing: 4, border: "none", cursor: "pointer"
                }}
              >
                {saving ? "SINCRONIZANDO..." : "SALVAR TODAS AS CONFIGURAÇÕES"}
              </button>
           </div>
        </div>
      )}
      {/* GENERATE PAYOUT CONFIRMATION MODAL */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setShowGenerateConfirm(false)} />
           <div className="relative bg-zinc-950 border border-brand-tactical/30 w-full max-w-sm p-8 space-y-8">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Protocolo Financeiro</span>
                 <h3 className="text-xl font-heading text-white uppercase tracking-tighter">Gerar Fechamento?</h3>
              </div>
              
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                ESTA AÇÃO IRÁ CONSOLIDAR TODAS AS VENDAS DA SEMANA ATUAL E GERAR AS ORDENS DE REPASSE PARA OS PARCEIROS.
              </p>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setShowGenerateConfirm(false)}
                   className="p-4 border border-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                   CANCELAR
                 </button>
                 <button 
                   onClick={handleGeneratePayout}
                   className="p-4 bg-brand-tactical text-black text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                 >
                   GERAR AGORA
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* PAYOUT MODAL (MIDNIGHT LUXURY) */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setPayoutModal(null)} />
           <div className="relative bg-zinc-950 border border-brand-tactical/30 w-full max-w-md shadow-[0_0_50px_rgba(133,185,172,0.1)] p-8 space-y-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/5 -rotate-45 translate-x-16 -translate-y-16" />
              
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Protocolo de Repasse</span>
                 <h3 className="text-2xl font-heading text-white uppercase tracking-tighter">Confirmar Transferência</h3>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Favorecido</span>
                    <span className="text-[11px] text-white font-bold uppercase">{payoutModal.name}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Valor do Pix</span>
                    <span className="text-xl font-heading text-brand-tactical tracking-widest">{formatCurrency(payoutModal.amount)}</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">ID da Transação Pix (Opcional)</label>
                 <input 
                   autoFocus
                   value={pixTxId}
                   onChange={e => setPixTxId(e.target.value)}
                   placeholder="COLE O CÓDIGO OU NÚMERO DO PROTOCOLO..."
                   className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] font-sans text-white placeholder:text-zinc-700 focus:border-brand-tactical focus:outline-none transition-all uppercase"
                 />
                 <p className="text-[8px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                   ESTE REGISTRO SERVIRÁ COMO COMPROVANTE DE AUDITORIA INTERNA NA PLATAFORMA MASTER.
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                   onClick={() => setPayoutModal(null)}
                   className="p-4 border border-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                   CANCELAR
                 </button>
                 <button 
                   onClick={confirmPayout}
                   className="p-4 bg-brand-tactical text-black text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(133,185,172,0.2)]"
                 >
                   CONFIRMAR PAGAMENTO
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* NOTIFICATION (MIDNIGHT LUXURY) */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[120] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[300px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Protocolo Sincronizado' : 'Falha na Operação'}
                 </span>
                 <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
