import React from "react";
import { Percent, Save, CheckCircle, Shield } from "lucide-react";
import AdminMenuSection from "../../../components/AdminMenuSection";

const REQUIRED_SPLITS: Array<{key: string; label: string; value: string}> = [
  { key: "markup_cliente", label: "Markup Cliente (Preço Final) %", value: "20" },
  { key: "take_rate_profissional", label: "Taxa de Intermediação Profissional (Take Rate) %", value: "7" },
  { key: "split_affiliate", label: "Taxa de Afiliado (%)", value: "2" },
  { key: "split_taxes", label: "Impostos (%)", value: "6" },
  { key: "split_platform_costs", label: "Custos da Plataforma (%)", value: "5" },
];

interface Config { key: string; value: string; label: string; }

interface Props {
  configs: Config[];
  splitsValid: boolean;
  saving: boolean;
  saved: boolean;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
}

export const AdminConfigsSplits: React.FC<Props> = ({
  configs, splitsValid, saving, saved, onChange, onSave,
}) => {
  const splitConfigs = configs.filter((c) => REQUIRED_SPLITS.some(rs => rs.key === c.key));

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-theme-bg border border-theme-border p-5 md:p-10 flex flex-col md:flex-row items-center gap-5 md:gap-10 shadow-sm relative overflow-hidden group rounded-2xl">
        <div className="p-3 md:p-6 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical rounded-none">
          <Shield size={32} />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.5em] text-theme-text">Protocolo de Precificação (Markup)</h4>
          <p className="text-[9px] text-theme-muted uppercase tracking-widest font-medium leading-relaxed max-w-3xl">
            A plataforma utiliza um modelo de Precificação Bottom-Up. O valor final cobrado do cliente é o custo base somado ao Markup. Do repasse ao profissional, descontamos a Taxa de Intermediação (Take Rate).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:gap-10 items-start max-w-4xl">
        <AdminMenuSection>
          <div className="flex items-center justify-between border-b border-theme-border pb-6">
            <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-[0.4em] flex items-center gap-3">
              <Percent size={14} className="text-brand-tactical" /> Taxas e Margens
            </h3>
            <div className="px-3 md:px-6 py-2 text-[10px] font-bold border tracking-widest border-brand-tactical/30 text-brand-tactical bg-brand-tactical/10">
              MODELO MARKUP ATIVO
            </div>
          </div>

          <div className="space-y-10">
            {splitConfigs.map((config) => (
              <div key={config.key} className="space-y-4 group">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em] group-hover:text-theme-text transition-colors">
                    {config.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={config.value}
                      onChange={(e) => onChange(config.key, e.target.value)}
                      className="w-24 bg-theme-bg-muted border-theme-border border text-theme-text text-right py-3 px-4 text-sm focus:outline-none focus:border-brand-tactical transition-all leading-none rounded-xl"
                    />
                    <span className="text-theme-muted font-bold uppercase text-[10px] tracking-widest">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onSave}
            disabled={saving || !splitsValid}
            className={`w-full py-5 text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-xl transition-all italic ${
              saved ? "bg-brand-tactical text-brand-text" : splitsValid ? "bg-theme-text text-theme-bg" : "bg-theme-bg-muted text-theme-muted cursor-not-allowed opacity-50"
            }`}
          >
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? "PROTOCOLO SINCRONIZADO" : saving ? "PROCESSANDO..." : "SALVAR CONFIGURAÇÕES FINANCEIRAS"}
          </button>
        </AdminMenuSection>
      </div>
    </div>
  );
};
