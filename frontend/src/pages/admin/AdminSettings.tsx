import React, { useState, useEffect } from "react";
import { Shield, Database, Save, RotateCcw, Palette, TrendingUp } from "lucide-react";

import { API } from "../../lib/api";

interface Config {
  key: string;
  value: string;
  label: string;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data } = await API.get("/admin/configs");
      setSettings(data.configs || []);
    } catch (err) {
      console.error("Erro ao carregar configs:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateKey = (key: string, value: string) => {
    setSettings(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  const getConfig = (key: string) => settings.find(c => c.key === key)?.value || "";

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.patch("/admin/configs", { configs: settings });
      setNotification({ message: "Configurações do sistema sincronizadas com sucesso! ✅", type: 'success' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      const axiosError = err as import("axios").AxiosError<{ error: string }>;
      setNotification({ message: axiosError.response?.data?.error || "Erro ao salvar.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-zinc-500 animate-pulse uppercase tracking-[0.5em] text-[10px]">Carregando Protocolos...</div>;


  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-theme-text tracking-tighter uppercase">Configurações do Sistema</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold italic">Infraestrutura e Parâmetros de Protocolo</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-tactical text-white text-[10px] font-bold uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all rounded-none flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? "SINCRONIZANDO..." : <><Save size={14} /> SALVAR ALTERAÇÕES</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
        {/* Branding & Identity */}
        <div className="bg-theme-bg p-10 space-y-10 border-b md:border-b-0 md:border-r border-theme-border">
          <div className="flex items-center gap-4 mb-4">
             <Palette className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Look & Feel (Identidade)</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {/* Primary Color */}
            <div className="space-y-4">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] flex justify-between">
                Cor Primária (Principal)
                <span className="text-zinc-400">{getConfig("brand_primary")}</span>
              </label>
              <div className="flex gap-4 items-center">
                <div 
                  className="w-12 h-12 border border-white/10" 
                  style={{ backgroundColor: getConfig("brand_primary") }} 
                />
                <input 
                  type="color" 
                  value={getConfig("brand_primary")} 
                  onChange={e => updateKey("brand_primary", e.target.value)}
                  className="flex-1 bg-zinc-900 border-none h-10 px-2 cursor-pointer"
                />
              </div>
              <p className="text-[8px] text-zinc-700 uppercase tracking-widest">
                Usada em botões, destaques e elementos de ação principal.
              </p>
            </div>

            {/* Tactical Color */}
            <div className="space-y-4">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] flex justify-between">
                Cor Secundária (Tática)
                <span className="text-zinc-400">{getConfig("brand_tactical")}</span>
              </label>
              <div className="flex gap-4 items-center">
                <div 
                  className="w-12 h-12 border border-white/10" 
                  style={{ backgroundColor: getConfig("brand_tactical") }} 
                />
                <input 
                  type="color" 
                  value={getConfig("brand_tactical")} 
                  onChange={e => updateKey("brand_tactical", e.target.value)}
                  className="flex-1 bg-zinc-900 border-none h-10 px-2 cursor-pointer"
                />
              </div>
              <p className="text-[8px] text-zinc-700 uppercase tracking-widest">
                Usada para elementos de dashboard e menus administrativos.
              </p>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-theme-bg p-10 space-y-8 border-b md:border-b-0 border-theme-border">
          <div className="flex items-center gap-4 mb-4">
             <Database className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Engenharia de Repasse</h3>
          </div>
          <div className="space-y-6">
            {["split_matriz", "split_captacao", "split_edicao", "split_cartorio"].map(key => (
              <div key={key} className="space-y-2">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">
                  {settings.find(c => c.key === key)?.label || key}
                </label>
                <div className="flex items-center gap-4 border-b border-theme-border">
                  <input 
                    type="number" 
                    value={getConfig(key)} 
                    onChange={e => updateKey(key, e.target.value)} 
                    className="w-full bg-transparent py-3 text-sm text-theme-text focus:outline-none" 
                  />
                  <span className="text-theme-muted text-xs">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meritocracia de Valor Hora */}
        <div className="bg-theme-bg p-10 space-y-8 border-b md:border-b-0 border-theme-border">
          <div className="flex items-center gap-4 mb-4">
             <TrendingUp className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Meritocracia — Valor Hora</h3>
          </div>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-relaxed">
            Piso e teto do valor/hora automático dos profissionais, em EUR. Convertido para BRL no cálculo usando a cotação em tempo real.
          </p>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">
                Piso Mínimo (EUR/hora)
              </label>
              <div className="flex items-center gap-4 border-b border-theme-border">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={getConfig("hourly_rate_floor_eur") || "10"}
                  onChange={e => updateKey("hourly_rate_floor_eur", e.target.value)}
                  className="w-full bg-transparent py-3 text-sm text-theme-text focus:outline-none"
                />
                <span className="text-theme-muted text-xs">€</span>
              </div>
              <p className="text-[8px] text-zinc-700 uppercase tracking-widest">Profissional com multiplicador 1.0 recebe este valor/hora.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">
                Teto Máximo (EUR/hora)
              </label>
              <div className="flex items-center gap-4 border-b border-theme-border">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={getConfig("hourly_rate_ceiling_eur") || "55"}
                  onChange={e => updateKey("hourly_rate_ceiling_eur", e.target.value)}
                  className="w-full bg-transparent py-3 text-sm text-theme-text focus:outline-none"
                />
                <span className="text-theme-muted text-xs">€</span>
              </div>
              <p className="text-[8px] text-zinc-700 uppercase tracking-widest">Profissional com multiplicador 5.0 (topo) recebe este valor/hora.</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-bg p-10 space-y-8 md:col-span-3 border-t border-theme-border">
          <div className="flex items-center gap-4 mb-4">
             <Shield className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Protocolos de Acesso</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="flex items-center justify-between p-6 border border-theme-border">
               <div>
                  <div className="text-[10px] font-bold text-theme-text uppercase tracking-widest">Modo Manutenção</div>
                  <div className="text-[9px] text-zinc-700 uppercase mt-1">Bloqueia acesso público à plataforma</div>
               </div>
               <button 
                 onClick={() => updateKey("maintenance_mode", getConfig("maintenance_mode") === "true" ? "false" : "true")} 
                 className={`w-12 h-6 transition-all rounded-none p-1 ${getConfig("maintenance_mode") === "true" ? "bg-red-500" : "bg-zinc-800"}`}
               >
                 <div className={`w-4 h-4 bg-white transition-all transform ${getConfig("maintenance_mode") === "true" ? "translate-x-6" : "translate-x-0"}`} />
               </button>
            </div>
            <div className="flex items-center justify-between p-6 border border-theme-border">
               <div>
                  <div className="text-[10px] font-bold text-theme-text uppercase tracking-widest">Acesso Público à Vitrine</div>
                  <div className="text-[9px] text-zinc-700 uppercase mt-1">Permite visualização sem login</div>
               </div>
               <button 
                 onClick={() => updateKey("public_access", getConfig("public_access") === "true" ? "false" : "true")} 
                 className={`w-12 h-6 transition-all rounded-none p-1 ${getConfig("public_access") === "true" ? "bg-brand-tactical" : "bg-zinc-800"}`}
               >
                 <div className={`w-4 h-4 bg-white transition-all transform ${getConfig("public_access") === "true" ? "translate-x-6" : "translate-x-0"}`} />
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-20 flex flex-col items-center">
         <RotateCcw className="text-zinc-900 mb-4" size={24} />
         <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">Protocolo V4.0.2 - Todos os direitos reservados</p>
      </div>
      {/* NOTIFICATION (MIDNIGHT LUXURY) */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[300px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Protocolo Sincronizado' : 'Erro de Infraestrutura'}
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
