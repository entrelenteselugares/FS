import React, { useState } from "react";
import { Shield, Globe, Database, Save, RotateCcw } from "lucide-react";

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    siteName: "Foto Segundo",
    supportEmail: "suporte@foto-segundo.com",
    taxRate: 5.5,
    splitMatriz: 40,
    maintenanceMode: false,
    publicAccess: true
  });

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Configurações do sistema sincronizadas com sucesso! ✅");
    }, 1500);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-white tracking-tighter uppercase">Configurações do Sistema</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mt-2 font-bold italic">Infraestrutura e Parâmetros de Protocolo</p>
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
        {/* Branding */}
        <div className="bg-black p-10 space-y-8">
          <div className="flex items-center gap-4 mb-4">
             <Globe className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.4em]">Identidade Visual</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Nome da Instituição</label>
              <input value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">E-mail de Suporte</label>
              <input value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-black p-10 space-y-8">
          <div className="flex items-center gap-4 mb-4">
             <Database className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.4em]">Parâmetros Financeiros</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Taxa de Serviço (%)</label>
              <input type="number" value={settings.taxRate} onChange={e => setSettings({...settings, taxRate: Number(e.target.value)})} className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Split Matriz (%)</label>
              <input type="number" value={settings.splitMatriz} onChange={e => setSettings({...settings, splitMatriz: Number(e.target.value)})} className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-black p-10 space-y-8 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
             <Shield className="text-brand-tactical" size={18} />
             <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.4em]">Protocolos de Acesso</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="flex items-center justify-between p-6 border border-white/5">
               <div>
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest">Modo Manutenção</div>
                  <div className="text-[9px] text-zinc-700 uppercase mt-1">Bloqueia acesso público à plataforma</div>
               </div>
               <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`w-12 h-6 transition-all rounded-none p-1 ${settings.maintenanceMode ? "bg-red-500" : "bg-zinc-800"}`}>
                  <div className={`w-4 h-4 bg-white transition-all transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-0"}`} />
               </button>
            </div>
            <div className="flex items-center justify-between p-6 border border-white/5">
               <div>
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest">Acesso Público à Vitrine</div>
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
