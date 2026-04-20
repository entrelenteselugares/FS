import React, { useState, useEffect } from "react";
import { Shield, Globe, Database, Save, RotateCcw, Palette } from "lucide-react";
import { API } from "../../lib/api";

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.patch("/admin/configs", { configs: settings });
      alert("Configurações do sistema sincronizadas com sucesso! ✅");
      // Trigger a global theme update by reloading if necessary, 
      // or just trust the next visit. Here we reload for immediate feedback.
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao salvar.");
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
        {/* Branding & Identity */}
        <div className="bg-theme-bg p-10 space-y-10 border-b md:border-b-0 md:border-r border-theme-border">
          <div className="flex items-center gap-4 mb-4">
             <Palette className="text-brand-primary" size={18} />
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

        {/* Segurança */}
        <div className="bg-theme-bg p-10 space-y-8 md:col-span-2 border-t border-theme-border">
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
               <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 transition-all rounded-none p-1 ${settings.maintenanceMode ? "bg-red-500" : "bg-zinc-800"}`}>
                  <div className={`w-4 h-4 bg-white transition-all transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-0"}`} />
               </button>
            </div>
            <div className="flex items-center justify-between p-6 border border-theme-border">
               <div>
                  <div className="text-[10px] font-bold text-theme-text uppercase tracking-widest">Acesso Público à Vitrine</div>
                  <div className="text-[9px] text-zinc-700 uppercase mt-1">Permite visualização sem login</div>
               </div>
               <button onClick={() => setSettings({...settings, publicAccess: !settings.publicAccess})} className={`w-12 h-6 transition-all rounded-none p-1 ${settings.publicAccess ? "bg-brand-tactical" : "bg-zinc-800"}`}>
                  <div className={`w-4 h-4 bg-white transition-all transform ${settings.publicAccess ? "translate-x-6" : "translate-x-0"}`} />
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-20 flex flex-col items-center">
         <RotateCcw className="text-zinc-900 mb-4" size={24} />
         <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">Protocolo V4.0.2 - Todos os direitos reservados</p>
      </div>
    </div>
  );
};
