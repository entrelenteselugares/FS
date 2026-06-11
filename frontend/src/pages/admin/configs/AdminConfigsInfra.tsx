import React from "react";
import { Palette, Lock, Shield, Globe, DollarSign, CheckCircle, RefreshCw } from "lucide-react";

interface Config { key: string; value: string; label: string; }

interface Props {
  configs: Config[];
  saving: boolean;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
}

export const AdminConfigsInfra: React.FC<Props> = ({ configs, saving, onChange, onSave }) => {
  const getConfig = (key: string) => configs.find(c => c.key === key);
  const hourlyRateConfig = getConfig("min_hourly_rate");
  const hourlyRate = Number(hourlyRateConfig?.value) || 83.58;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">

        {/* Branding */}
        <div className="bg-theme-bg border border-theme-border p-5 md:p-10 space-y-10 shadow-sm rounded-2xl">
          <div className="flex items-center gap-4 border-b border-theme-border pb-6">
            <Palette size={16} className="text-brand-tactical" />
            <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Identidade Visual Tática</h3>
          </div>
          <div className="space-y-10">
            {["brand_primary", "brand_tactical"].map(key => {
              const config = getConfig(key);
              if (!config) return null;
              return (
                <div key={key} className="space-y-4">
                  <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">{config.label}</label>
                  <div className="flex items-center gap-3 md:gap-6">
                    <div className="w-14 h-14 border border-theme-border shadow-inner" style={{ background: config.value }} />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={config.value}
                        onChange={e => onChange(key, e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[11px] font-bold text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all rounded-2xl"
                      />
                      <input
                        type="color"
                        value={config.value}
                        onChange={e => onChange(key, e.target.value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-transparent border-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Governance */}
        <div className="bg-theme-bg border border-theme-border p-5 md:p-10 space-y-10 shadow-sm rounded-2xl">
          <div className="flex items-center gap-4 border-b border-theme-border pb-6">
            <Lock size={16} className="text-brand-tactical" />
            <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Protocolos de Governança</h3>
          </div>
          <div className="space-y-6">
            {[
              { key: "maintenance_mode", label: "Modo Manutenção", desc: "Bloqueia acesso público para auditoria técnica", icon: Shield },
              { key: "public_access", label: "Vitrine Global", desc: "Habilita visualização de álbuns sem credenciais", icon: Globe },
            ].map(item => {
              const config = getConfig(item.key);
              if (!config) return null;
              const isOn = config.value === "true";
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between p-3 md:p-6 bg-theme-bg-muted border border-theme-border group hover:border-brand-tactical transition-all rounded-2xl">
                  <div className="flex items-center gap-3 md:gap-6">
                    <div className={`p-4 border ${isOn ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/10' : 'border-theme-border text-theme-muted'}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-theme-text uppercase tracking-widest ">{item.label}</div>
                      <div className="text-[8px] text-theme-muted uppercase tracking-[0.2em] mt-1">{item.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onChange(item.key, isOn ? "false" : "true")}
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

      {/* Pricing Policy */}
      <div className="bg-theme-bg border border-brand-tactical/30 p-5 md:p-10 space-y-8 shadow-sm rounded-2xl">
        <div className="flex items-center gap-4 border-b border-theme-border pb-6">
          <DollarSign size={16} className="text-brand-tactical" />
          <div>
            <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em]">Política de Precificação Mínima</h3>
            <p className="text-[9px] text-theme-muted uppercase tracking-widest mt-1">Piso de valor hora que o profissional não pode cobrar abaixo</p>
          </div>
        </div>
        {hourlyRateConfig && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em] block">Valor Hora Mínimo (R$/hora)</label>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-heading font-bold text-brand-tactical ">R$</span>
                <input
                  type="number" min="1" step="0.5"
                  value={hourlyRateConfig.value}
                  onChange={e => onChange("min_hourly_rate", e.target.value)}
                  className="flex-1 bg-theme-bg-muted border border-theme-border rounded-2xl p-4 text-2xl font-heading font-bold text-theme-text focus:outline-none focus:border-brand-tactical transition-all"
                />
                <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">/hora</span>
              </div>
              <p className="text-[9px] text-theme-muted uppercase font-bold">
                Valor Base Sugerido: <span className="text-brand-tactical">R$83,58/hora</span> — atualizar conforme sua estratégia comercial.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[60, 120, 180, 240, 360, 480].map(minutes => (
                <div key={minutes} className="p-4 bg-theme-bg-muted border border-theme-border rounded-xl text-center">
                  <p className="text-[8px] font-bold text-theme-muted uppercase tracking-widest mb-1">{minutes}min</p>
                  <p className="text-base font-heading font-bold text-brand-tactical ">R${(hourlyRate * minutes / 60).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-10">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-3 md:px-6 md:px-12 py-5 bg-theme-text text-theme-bg text-[10px] font-bold uppercase tracking-[0.5em] shadow-2xl hover:brightness-110 transition-all flex items-center gap-4"
        >
          {saving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
          {saving ? "SINCRONIZANDO..." : "VALIDAR E SALVAR TODA INFRAESTRUTURA"}
        </button>
      </div>
    </div>
  );
};
