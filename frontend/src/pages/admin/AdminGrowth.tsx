import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Share2, Phone, Copy, Check, Activity } from "lucide-react";
import { API } from "../../lib/api";
import { QRCodeSVG } from "qrcode.react";

interface Coupon {
  id: string;
  code: string;
  discountPct?: number;
  discountAbs?: number;
  usedCount: number;
  active: boolean;
}

interface Ambassador {
  id: string;
  nome: string;
  email: string;
  affiliatePayoutType: string;
}

interface WhatsAppStatus {
  connected?: boolean;
  qrCode?: string;
}

export function AdminGrowth() {
  const [activeTab, setActiveTab] = useState<"COUPONS" | "LINKS" | "WHATSAPP">("COUPONS");

  // State
  const [coupons, setCoupons] = useState<{id: string, code: string, discountPct?: number, discountAbs?: number, usedCount: number, active: boolean}[]>([]);
  const [links, setLinks] = useState<{id: string, nome: string, email: string, affiliatePayoutType: string}[]>([]);
  const [waStatus, setWaStatus] = useState<{connected?: boolean, qrCode?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "COUPONS") {
        const { data } = await API.get("/admin/coupons");
        setCoupons(data.coupons || []);
      } else if (activeTab === "LINKS") {
        const { data } = await API.get("/admin/ambassadors");
        setLinks(data.ambassadors || []);
      } else if (activeTab === "WHATSAPP") {
        const { data } = await API.get("/admin/whatsapp/status");
        setWaStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="space-y-4 relative z-10">
          <h1 className="text-4xl md:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
            Growth & Engine
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
              Escala • Aquisição, Retenção e Afiliados
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-border/40 overflow-x-auto hide-scrollbar">
        {[
          { id: "COUPONS", icon: Tag, label: "Cupons Genéricos" },
          { id: "LINKS", icon: Share2, label: "Links de Embaixador" },
          { id: "WHATSAPP", icon: Phone, label: "Motor WhatsApp" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "COUPONS" | "LINKS" | "WHATSAPP")}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id ? "border-brand-tactical text-brand-tactical" : "border-transparent text-theme-text-muted hover:text-theme-text"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-4">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin text-brand-tactical"><Activity size={24} /></div></div>
        ) : activeTab === "COUPONS" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
               <button className="flex items-center gap-2 px-4 py-2 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors">
                  <Plus size={14} /> Novo Cupom
               </button>
            </div>
            {coupons.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-theme-border rounded-xl">
                 <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Nenhum cupom ativo</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                 {coupons.map(c => (
                   <div key={c.id} className="p-6 bg-theme-bg-muted border border-theme-border rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <h4 className="text-xl font-black italic text-brand-tactical uppercase tracking-widest">{c.code}</h4>
                        <p className="text-[10px] font-bold text-theme-text-muted mt-1">
                           {c.discountPct ? `${c.discountPct}% OFF` : `R$ ${c.discountAbs} OFF`} • {c.usedCount} usos
                        </p>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-1 text-[8px] font-black uppercase rounded ${c.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                           {c.active ? 'Ativo' : 'Inativo'}
                         </span>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        ) : activeTab === "LINKS" ? (
          <div className="space-y-4">
             <div className="grid md:grid-cols-2 gap-4">
                 {links.map(l => (
                   <div key={l.id} className="p-6 bg-theme-bg-muted border border-theme-border rounded-2xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-start">
                         <div>
                           <h4 className="text-sm font-black text-theme-text uppercase">{l.nome}</h4>
                           <p className="text-[10px] font-bold text-theme-text-muted mt-1">{l.email}</p>
                         </div>
                         <span className="px-2 py-1 text-[8px] font-black uppercase rounded bg-brand-tactical/20 text-brand-tactical">
                           {l.affiliatePayoutType}
                         </span>
                      </div>
                      <div className="flex gap-2">
                         <input 
                           readOnly 
                           value={`${window.location.origin}?ref=${l.id}`} 
                           className="fs-input flex-1 text-[10px] opacity-70"
                         />
                         <button 
                           onClick={() => copyToClipboard(`${window.location.origin}?ref=${l.id}`, l.id)}
                           className="p-3 bg-theme-text/5 hover:bg-theme-text/10 rounded-xl transition-colors"
                         >
                           {copied === l.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-theme-text" />}
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
          </div>
        ) : (
          <div className="p-8 border border-theme-border bg-theme-bg-muted/50 rounded-3xl flex flex-col md:flex-row gap-8 items-center justify-center min-h-[400px]">
             {waStatus?.connected ? (
               <div className="text-center space-y-6">
                 <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Phone size={40} className="text-emerald-500" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-theme-text uppercase">WhatsApp Conectado</h3>
                    <p className="text-[10px] font-black text-emerald-500 tracking-widest uppercase mt-2">Motor de notificações ativo</p>
                 </div>
               </div>
             ) : waStatus?.qrCode ? (
               <div className="text-center space-y-6">
                 <div>
                    <h3 className="text-2xl font-black italic text-theme-text uppercase">Conectar Aparelho</h3>
                    <p className="text-[10px] font-black text-theme-text-muted tracking-widest uppercase mt-2">Leia o QR Code com seu WhatsApp para ativar as automações de carrinho</p>
                 </div>
                 <div className="p-4 bg-white inline-block rounded-2xl mx-auto shadow-2xl">
                    <QRCodeSVG value={waStatus.qrCode} size={256} />
                 </div>
                 <button onClick={fetchData} className="text-[10px] font-black uppercase text-brand-tactical hover:underline">Atualizar QR Code</button>
               </div>
             ) : (
               <div className="text-center space-y-4">
                  <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Motor de WhatsApp Offline</p>
                  <button onClick={fetchData} className="px-6 py-3 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-widest">Tentar Iniciar Sessão</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
