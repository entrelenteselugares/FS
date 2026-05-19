import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Percent, 
  DollarSign, 
  Calculator, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Palette, 
  Shield, 
  ArrowRight,
  Zap,
  Globe,
  Lock,
  Smartphone,
  X
} from "lucide-react";
import { API } from "../../lib/api";

// --- Types ---
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

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const safeDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
};

const REQUIRED_SPLITS: Array<{key: string; label: string; value: string}> = [
  { key: "split_affiliate_l1", label: "Afiliado Direto — Nível 1 (%)", value: "0" },
  { key: "split_affiliate_l2", label: "Afiliado Passivo VIP — Nível 2 (%)", value: "0" },
  { key: "split_captacao", label: "Captação (Fotógrafo)",      value: "0" },
  { key: "split_cartorio", label: "Unidade Fixa (Logística)",  value: "0" },
  { key: "split_edicao",   label: "Edição (Curadoria)",        value: "0" },
  { key: "split_franchisee", label: "Comissão Passiva B2B (%)", value: "0" },
  { key: "split_matriz",    label: "Matriz (Plataforma)",       value: "0" }
];

const REQUIRED_INFRA: Array<{key: string; label: string; value: string}> = [
  { key: "brand_primary", label: "Cor Primária", value: "#0a0a0a" },
  { key: "brand_tactical", label: "Cor Tática", value: "#85B9AC" },
  { key: "maintenance_mode", label: "Modo Manutenção", value: "false" },
  { key: "public_access", label: "Vitrine Global", value: "true" }
];

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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [configRes, payoutRes] = await Promise.all([
        API.get("/admin/configs"),
        API.get("/admin/payouts")
      ]);
      
      // Mescla configs do banco com as obrigatórias para garantir que apareçam
      const dbConfigs = configRes.data.configs || [];
      const mergedConfigs = [...dbConfigs];
      
      REQUIRED_SPLITS.forEach(req => {
        if (!mergedConfigs.find(c => c.key === req.key)) {
          mergedConfigs.push(req);
        }
      });

      REQUIRED_INFRA.forEach(req => {
        if (!mergedConfigs.find(c => c.key === req.key)) {
          mergedConfigs.push(req);
        }
      });

      setConfigs(mergedConfigs);
      setSplitsTotal(configRes.data.splitsTotal || 0);
      setSplitsValid(configRes.data.splitsValid ?? false);
      setPayouts(payoutRes.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (key: string, value: string) => {
    const updatedConfigs = configs.map((c) => c.key === key ? { ...c, value } : c);
    setConfigs(updatedConfigs);

    const splitKeys = REQUIRED_SPLITS.map(s => s.key);
    const total = splitKeys.reduce((acc, k) => {
      const c = updatedConfigs.find((c) => c.key === k);
      return acc + Number(c?.value ?? 0);
    }, 0);
    setSplitsTotal(total);
    setSplitsValid(total === 100);
  };

  const handleSave = async () => {
    if (tab === 'splits' && !splitsValid) return;
    setSaving(true);
    try {
      // Filtra apenas as que foram alteradas ou as obrigatórias para garantir criação no banco
      await API.patch("/admin/configs", { configs });
      setSaved(true);
      setNotification({ message: "Configurações sincronizadas!", type: 'success' });
      setTimeout(() => { setSaved(false); setNotification(null); }, 2500);
    } catch {
      setNotification({ message: "Erro ao salvar configurações.", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePayout = async () => {
    setShowGenerateConfirm(false);
    setGenerating(true);
    try {
      const { data } = await API.post("/admin/payouts/generate");
      setPayouts((p) => [data, ...p]);
      setTab("payouts");
      setNotification({ message: "Relatório gerado com sucesso!", type: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar relatório.";
      setNotification({ message: msg, type: 'error' });
    } finally {
      setGenerating(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const confirmPayout = async () => {
    if (!payoutModal) return;
    try {
      await API.patch(`/admin/payouts/${payoutModal.payoutId}/items/${payoutModal.itemId}/paid`, { pixTxId });
      setPayoutModal(null);
      setPixTxId("");
      fetchData();
      setNotification({ message: "Comprovante registrado!", type: 'success' });
    } catch {
      setNotification({ message: "Erro ao registrar pagamento.", type: 'error' });
    } finally {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const splitConfigs = useMemo(() => configs.filter((c) => c.key.startsWith("split_")), [configs]);
  const infraConfigs = useMemo(() => configs.filter((c) => !c.key.startsWith("split_")), [configs]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER MASTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-theme-border pb-10 gap-6">
        <div className="space-y-4 min-w-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            Ajustes & <span className="text-brand-tactical">Configurações</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Parâmetros Globais do Sistema</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowGenerateConfirm(true)}
          disabled={generating}
          className="px-8 py-4 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3 italic"
        >
          {generating ? <RefreshCw className="animate-spin" size={14} /> : <Calculator size={14} />}
          {generating ? "SINCRONIZANDO..." : "FECHAMENTO SEMANAL"}
        </button>
      </div>

      {/* NAVIGATION TACTICAL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm w-full md:w-auto md:max-w-fit gap-1">
        <button onClick={() => setTab("splits")} className={`px-8 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all ${tab === "splits" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-brand-text'}`}>Divisão de Split</button>
        <button onClick={() => setTab("payouts")} className={`px-8 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all ${tab === "payouts" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-brand-text'}`}>Repasses ({payouts.length})</button>
        <button onClick={() => setTab("infra")} className={`px-8 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all ${tab === "infra" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-brand-text'}`}>Infraestrutura</button>
      </div>

      {/* VIEW: SPLIT DISTRIBUTION */}
      {tab === "splits" && (
        <div className="space-y-10 animate-in fade-in duration-500">
           <div className="bg-theme-bg border border-theme-border/60 p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group">
              <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 text-brand-tactical rounded-none">
                 <Shield size={32} />
              </div>
              <div className="flex-1 space-y-2">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-theme-text italic">Protocolo de Split Manual</h4>
                 <p className="text-[9px] text-theme-muted uppercase tracking-widest font-medium leading-relaxed max-w-3xl">
                    A plataforma centraliza 100% dos recebíveis. Os percentuais abaixo definem a provisão automática para cada parceiro no fechamento semanal, garantindo transparência e segurança operacional.
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
              <div className="bg-theme-bg border border-theme-border/60 p-6 md:p-10 space-y-12 shadow-sm">
                 <div className="flex items-center justify-between border-b border-theme-border/30 pb-6">
                    <h3 className="text-[11px] font-black text-theme-text uppercase tracking-[0.4em] flex items-center gap-3">
                       <Percent size={14} className="text-brand-tactical" /> Distribuição por Venda
                    </h3>
                    <div className={`px-6 py-2 text-[10px] font-black border tracking-widest italic ${splitsValid ? "border-brand-tactical/30 text-brand-tactical bg-brand-tactical/5" : "border-red-900/30 text-red-500 bg-red-900/5"}`}>
                       TOTAL: {splitsTotal}% {splitsValid ? "✓ OPERACIONAL" : "⚠️ DEVE SER 100%"}
                    </div>
                 </div>

                 <div className="space-y-10">
                    {splitConfigs.map((config) => (
                      <div key={config.key} className="space-y-4 group">
                        <div className="flex justify-between items-end">
                          <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] group-hover:text-theme-text transition-colors">
                            {config.key === "split_cartorio" ? "Unidade Fixa (Logística)" : 
                             config.key === "split_captacao" ? "Captação (Fotógrafo)" :
                             config.key === "split_edicao" ? "Edição (Curadoria)" :
                             config.label}
                          </label>
                          <div className="flex items-center gap-3">
                             <input 
                               type="number"
                               value={config.value}
                               onChange={(e) => handleChange(config.key, e.target.value)}
                               className="w-20 bg-theme-bg-muted border-theme-border/60 border text-theme-text text-right py-3 px-4 text-xl font-heading font-black italic tracking-tighter focus:outline-none focus:border-brand-tactical transition-all leading-none"
                             />
                             <span className="text-theme-muted font-black uppercase text-[10px] tracking-widest">%</span>
                          </div>
                        </div>
                        <div className="w-full h-1 bg-theme-bg-muted border border-theme-border/10 overflow-hidden">
                           <div className="h-full bg-brand-tactical transition-all duration-700 shadow-[0_0_10px_rgba(133,185,172,0.3)]" style={{ width: `${Math.min(100, Number(config.value))}%` }} />
                        </div>
                      </div>
                    ))}
                 </div>

                 <button
                   onClick={handleSave}
                   disabled={saving || !splitsValid}
                   className={`w-full py-5 text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-xl transition-all italic ${
                     saved ? "bg-green-600 text-theme-text" : splitsValid ? "bg-theme-text text-theme-bg" : "bg-theme-bg-muted text-theme-muted cursor-not-allowed opacity-50"
                   }`}
                 >
                   {saved ? <CheckCircle size={14} /> : <Save size={14} />}
                   {saved ? "PROTOCOLO SINCRONIZADO" : saving ? "PROCESSANDO..." : "SALVAR CONFIGURAÇÕES FINANCEIRAS"}
                 </button>
              </div>

              <div className="bg-theme-bg border border-theme-border/60 p-10 space-y-10 shadow-sm">
                 <h3 className="text-[11px] font-black text-theme-muted uppercase tracking-[0.4em] flex items-center gap-3">
                    <Zap size={14} className="text-brand-tactical" /> Gatilhos de Sistema
                 </h3>
                 <div className="space-y-8">
                    {infraConfigs.filter(c => !c.key.includes("color") && !c.key.includes("access") && !c.key.includes("maintenance")).map((config) => (
                      <div key={config.key} className="space-y-3">
                        <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] block">{config.label}</label>
                        <input 
                          value={config.value}
                          onChange={(e) => handleChange(config.key, e.target.value)}
                          className="w-full bg-transparent border-b border-theme-border/60 py-3 text-[11px] font-black text-theme-text focus:outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/20"
                        />
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* VIEW: PAYOUTS / REPASSES */}
      {tab === "payouts" && (
        <div className="space-y-10 animate-in fade-in duration-500">
          {payouts.length === 0 ? (
            <div className="py-40 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-6">
              <AlertTriangle className="mx-auto text-theme-muted opacity-20" size={48} />
              <div className="space-y-2">
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Parâmetros Globais do Sistema</p>
                <p className="text-[8px] text-theme-muted/60 uppercase tracking-widest">Inicie um fechamento semanal para consolidar as provisões.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {payouts.map((payout) => (
                <div key={payout.id} className="bg-theme-bg border border-theme-border/60 shadow-sm group overflow-hidden">
                   <div className="px-10 py-8 border-b border-theme-border/30 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-theme-bg-muted/20">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                           <span className="text-2xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
                             Ciclo {safeDate(payout.weekStart)} — {safeDate(payout.weekEnd)}
                           </span>
                           <span className={`text-[8px] font-black px-3 py-1 border uppercase tracking-widest italic ${
                             payout.status === "PAID" ? "border-brand-tactical text-brand-tactical bg-brand-tactical/5" : "border-amber-600 text-amber-600 bg-amber-600/5"
                           }`}>
                             {payout.status === "PAID" ? "LIQUIDADO" : "PENDENTE"}
                           </span>
                        </div>
                        <div className="flex flex-wrap gap-8">
                           <div className="space-y-1"><span className="text-[7px] font-black text-theme-muted uppercase tracking-widest">Faturamento Bruto</span><p className="text-[12px] font-black text-theme-text font-mono italic">{formatCurrency(payout.totalRevenue)}</p></div>
                           <div className="space-y-1"><span className="text-[7px] font-black text-theme-muted uppercase tracking-widest">Provisão de Repasse</span><p className="text-[12px] font-black text-brand-tactical font-mono italic">{formatCurrency(payout.totalPayout)}</p></div>
                        </div>
                      </div>
                      <div className="px-6 py-4 bg-theme-bg border border-theme-border/40 text-theme-muted text-[8px] font-black uppercase tracking-[0.3em] font-mono shadow-inner group-hover:text-theme-text transition-colors">
                        ID: {payout.id.slice(-8).toUpperCase()}
                      </div>
                   </div>

                   <div className="divide-y divide-theme-border/20">
                      {payout.items?.map((item) => (
                        <div key={item.id} className="px-10 py-8 grid grid-cols-1 md:grid-cols-12 items-center gap-8 hover:bg-theme-bg-muted/30 transition-all">
                           <div className="md:col-span-1">
                              <span className="text-[7px] font-black text-theme-muted border border-theme-border/60 px-2 py-1 uppercase tracking-widest block text-center italic">{item.recipientType}</span>
                           </div>
                           <div className="md:col-span-3">
                              <div className="text-[11px] font-black text-theme-text uppercase tracking-widest italic leading-none">{item.recipientName}</div>
                              <div className="text-[9px] text-theme-muted font-black uppercase tracking-widest mt-2 flex items-center gap-2"><Smartphone size={10} /> Pix: {item.pixKey || "S/ CHAVE"}</div>
                           </div>
                           <div className="md:col-span-3 text-center border-l border-theme-border/10">
                              <span className="text-[8px] text-theme-muted uppercase tracking-widest font-black block mb-1">Engenharia de Split</span>
                              <div className="text-[10px] text-theme-text font-black uppercase italic tracking-tighter">{item.orderCount} PEDIDOS • {item.splitPct}% DE {formatCurrency(item.grossRevenue)}</div>
                           </div>
                           <div className="md:col-span-2 text-right">
                              <span className="text-[8px] text-theme-muted uppercase tracking-widest font-black block mb-1">Vlr Líquido</span>
                              <div className="text-xl font-heading font-black text-brand-tactical tracking-tighter italic leading-none">{formatCurrency(item.amount)}</div>
                           </div>
                           <div className="md:col-span-3 flex justify-end">
                              {item.status === "PAID" ? (
                                <div className="text-right space-y-1.5">
                                   <div className="text-[9px] text-green-600 font-black uppercase tracking-widest flex items-center justify-end gap-2 italic">
                                      <CheckCircle size={12} /> REPASSE EFETUADO
                                   </div>
                                   {item.pixTxId && <div className="text-[8px] text-theme-muted font-mono uppercase tracking-widest opacity-60">REF: {item.pixTxId.slice(0, 16)}...</div>}
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setPayoutModal({ payoutId: payout.id, itemId: item.id, name: item.recipientName, amount: item.amount })}
                                  className="text-[9px] font-black text-zinc-950 uppercase tracking-[0.4em] bg-brand-tactical px-8 py-4 hover:brightness-110 transition-all shadow-xl flex items-center gap-3"
                                >
                                  <DollarSign size={14} /> LIQUIDAR
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

      {/* VIEW: INFRASTRUCTURE & GOVERNANCE */}
      {tab === "infra" && (
        <div className="space-y-12 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Branding Section */}
              <div className="bg-theme-bg border border-theme-border/60 p-10 space-y-10 shadow-sm">
                 <div className="flex items-center gap-4 border-b border-theme-border/30 pb-6">
                    <Palette size={16} className="text-brand-tactical" />
                    <h3 className="text-[11px] font-black text-theme-text uppercase tracking-[0.4em]">Identidade Visual Tática</h3>
                 </div>
                 
                 <div className="space-y-10">
                    {["brand_primary", "brand_tactical"].map(key => {
                       const config = configs.find(c => c.key === key);
                       if (!config) return null;
                       return (
                         <div key={key} className="space-y-4">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">{config.label}</label>
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 border border-theme-border shadow-inner" style={{ background: config.value }} />
                               <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    value={config.value} 
                                    onChange={e => handleChange(key, e.target.value)}
                                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] font-black text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all"
                                  />
                                  <input 
                                    type="color" 
                                    value={config.value} 
                                    onChange={e => handleChange(key, e.target.value)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent border-none cursor-pointer"
                                  />
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>

              {/* Security & Access Section */}
              <div className="bg-theme-bg border border-theme-border/60 p-10 space-y-10 shadow-sm">
                 <div className="flex items-center gap-4 border-b border-theme-border/30 pb-6">
                    <Lock size={16} className="text-brand-tactical" />
                    <h3 className="text-[11px] font-black text-theme-text uppercase tracking-[0.4em]">Protocolos de Governança</h3>
                 </div>
                 
                 <div className="space-y-6">
                    {[
                      { key: "maintenance_mode", label: "Modo Manutenção", desc: "Bloqueia acesso público para auditoria técnica", icon: Shield },
                      { key: "public_access", label: "Vitrine Global", desc: "Habilita visualização de álbuns sem credenciais", icon: Globe }
                    ].map(item => {
                       const config = configs.find(c => c.key === item.key);
                       if (!config) return null;
                       const isOn = config.value === "true";
                       const Icon = item.icon;
                       return (
                         <div key={item.key} className="flex items-center justify-between p-6 bg-theme-bg-muted/30 border border-theme-border/40 group hover:border-brand-tactical transition-all">
                            <div className="flex items-center gap-6">
                               <div className={`p-4 border ${isOn ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border/60 text-theme-muted'}`}>
                                  <Icon size={20} />
                               </div>
                               <div>
                                 <div className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">{item.label}</div>
                                 <div className="text-[8px] text-theme-muted uppercase tracking-[0.2em] mt-1">{item.desc}</div>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleChange(item.key, isOn ? "false" : "true")}
                              className={`w-14 h-7 relative transition-all rounded-none ${isOn ? 'bg-brand-tactical' : 'bg-theme-border/60'}`}
                            >
                               <div className={`absolute top-1 w-5 h-5 bg-white shadow-sm transition-all ${isOn ? 'left-8' : 'left-1'}`} />
                            </button>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>

           <div className="flex justify-center pt-10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-12 py-5 bg-theme-text text-theme-bg text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl hover:brightness-110 transition-all flex items-center gap-4"
              >
                {saving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                {saving ? "SINCRONIZANDO..." : "VALIDAR E SALVAR TODA INFRAESTRUTURA"}
              </button>
           </div>
        </div>
      )}

      {/* CONFIRMATION & NOTIFICATION MODALS */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowGenerateConfirm(false)} />
          
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-brand-tactical/10 rounded-[30px] flex items-center justify-center border border-brand-tactical/20 mx-auto mb-6">
                <Calculator className="text-brand-tactical" size={32} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text italic leading-none">Gerar Fechamento?</h3>
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Parâmetros Globais do Sistema</p>
              </div>
              
              <p className="text-[11px] uppercase tracking-[0.2em] leading-relaxed text-theme-muted italic">
                ESTA AÇÃO IRÁ CONSOLIDAR TODAS AS VENDAS DA SEMANA E GERAR AS ORDENS DE REPASSE PARA OS PARCEIROS.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <button 
                  onClick={handleGeneratePayout}
                  className="w-full py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
                >
                  GERAR AGORA
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={() => setShowGenerateConfirm(false)}
                  className="w-full py-5 border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-[0.4em] hover:text-white transition-all rounded-[20px] italic"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {payoutModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPayoutModal(null)} />
          
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <DollarSign className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Liquidação</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Registro de Comprovante Pix</p>
                </div>
              </div>
              <button onClick={() => setPayoutModal(null)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 space-y-8">
              <div className="bg-theme-bg-muted/40 border border-theme-border/40 p-8 rounded-[30px] space-y-6 shadow-inner">
                <div className="flex justify-between items-center border-b border-theme-border/20 pb-4">
                  <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Favorecido</span>
                  <span className="text-[12px] text-theme-text font-black uppercase italic">{payoutModal.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Valor do Repasse</span>
                  <span className="text-3xl font-heading text-brand-tactical tracking-tighter font-black italic">{formatCurrency(payoutModal.amount)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">ID da Transação Pix (Auditoria)</label>
                <div className="relative">
                  <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={16} strokeWidth={1.5} />
                  <input 
                    autoFocus
                    value={pixTxId}
                    onChange={e => setPixTxId(e.target.value)}
                    placeholder="COLE O COMPROVANTE..."
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-5 pl-12 text-[11px] font-black text-theme-text placeholder:opacity-20 focus:border-brand-tactical outline-none transition-all uppercase rounded-xl"
                  />
                </div>
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Parâmetros Globais do Sistema</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setPayoutModal(null)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
                <button 
                  onClick={confirmPayout}
                  className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
                >
                  CONFIRMAR
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 right-10 z-[700] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-8 border ${notification.type === 'success' ? 'border-brand-tactical bg-theme-bg shadow-[0_0_40px_rgba(133,185,172,0.15)]' : 'border-red-900 bg-theme-bg'} min-w-[350px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-2">
                 <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>Sincronização de Inteligência</span>
                 <p className="text-[13px] font-bold text-theme-text uppercase tracking-widest mt-1 leading-tight">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
