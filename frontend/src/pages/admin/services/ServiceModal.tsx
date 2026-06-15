import React, { useState } from "react";
import { Briefcase, DollarSign, ArrowRight, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceProfessional: number;
  priceMobile: number;
  allowProfessional: boolean;
  allowMobile: boolean;
  category: string;
  eventTypes?: string[];
}

interface Props {
  onClose: () => void;
  onSave: (data: Omit<Service, "id">) => Promise<void>;
  initialData?: Service | null;
  saving: boolean;
}

const inputClass =
  "w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase placeholder:text-theme-muted/30 rounded-2xl";
const labelClass =
  "text-[10px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic";

export const ServiceModal: React.FC<Props> = ({ onClose, onSave, initialData, saving }) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    basePrice: initialData?.basePrice || 0,
    priceProfessional: initialData?.priceProfessional || 0,
    priceMobile: initialData?.priceMobile || 0,
    allowProfessional: initialData?.allowProfessional ?? true,
    allowMobile: initialData?.allowMobile ?? false,
    category: initialData?.category || "FOTOGRAFIA",
    eventTypes: initialData?.eventTypes || [],
  });

  const update = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 md:p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
              <Briefcase className="text-brand-tactical" size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase text-theme-text">
                {initialData ? "Ajustar Ativo" : "Novo Ativo de Serviço"}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Configuração de Tabela e Valor de Entrega</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 md:p-10 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Nome do Serviço</label>
                <input required className={inputClass} value={form.name} onChange={e => update({ name: e.target.value })} placeholder="Ex: Fotografia de Casamento" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Categoria Comercial</label>
                <select className={inputClass} value={form.category} onChange={e => update({ category: e.target.value })}>
                  <option value="FOTOGRAFIA">FOTOGRAFIA</option>
                  <option value="VIDEO">VÍDEO</option>
                  <option value="EDICAO">EDIÇÃO</option>
                  <option value="POS_EDICAO">PÓS-EDIÇÃO</option>
                  <option value="PRE_EVENTO">PRÉ-EVENTO</option>
                  <option value="LOCACAO">LOCAÇÃO</option>
                  <option value="EXTRAS">EXTRAS / ADICIONAIS</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t border-theme-border">
              <label className={labelClass}>
                Tipos de Evento Permitidos
                <span className="ml-2 normal-case text-theme-muted opacity-70">(Deixe vazio para permitir todos)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: "CASAMENTO", label: "CASAMENTO" },
                  { id: "ANIVERSARIO", label: "ANIVERSÁRIO" },
                  { id: "SHOW_FESTIVAL", label: "SHOW / FESTIVAL" },
                  { id: "CORPORATIVO", label: "EVENTO CORPORATIVO" },
                  { id: "FORMATURA", label: "FORMATURA" },
                  { id: "ENSAIO", label: "ENSAIO FOTOGRÁFICO" },
                  { id: "BAILE_FESTA", label: "BAILE / FESTA" },
                  { id: "CONFRATERNIZACAO", label: "CONFRATERNIZAÇÃO" },
                  { id: "CHURRASCO_BUFFET", label: "CHURRASCO / BUFFET" },
                  { id: "OUTROS", label: "OUTROS" }
                ].map(type => (
                  <label key={type.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={form.eventTypes.includes(type.id)} 
                      onChange={e => {
                        if (e.target.checked) {
                          update({ eventTypes: [...form.eventTypes, type.id] });
                        } else {
                          update({ eventTypes: form.eventTypes.filter((t: string) => t !== type.id) });
                        }
                      }}
                      className="w-3.5 h-3.5 text-brand-tactical border-theme-border bg-theme-bg-muted rounded" 
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t border-theme-border">
              <label className={labelClass}>Descrição da Entrega</label>
              <textarea rows={3} className={`${inputClass} normal-case resize-none`} value={form.description} onChange={e => update({ description: e.target.value })} placeholder="O que o cliente recebe neste pacote?" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-6 border-t border-theme-border">
              <div className="space-y-2">
                <label className={labelClass}>Preço Sugerido (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={14} strokeWidth={1.5} />
                  <input required type="number" step="0.01" className={`${inputClass} pl-10`} value={form.basePrice} onChange={e => update({ basePrice: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-[9px] sm:text-[11px] font-bold text-brand-tactical uppercase tracking-[0.4em]">
                  Este valor será utilizado como base fallback no gerador de orçamentos automático da rede.
                </p>
              </div>
            </div>

            {/* Perfis Elegíveis */}
            <div className="space-y-4 pt-6 border-t border-theme-border">
              <label className={labelClass}>Tipo de Serviço &amp; Precificação Individual</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* Profissional */}
                <div className={`p-3 md:p-6 border rounded-2xl transition-all ${form.allowProfessional ? "border-brand-tactical/40 bg-brand-tactical/10" : "border-theme-border bg-theme-bg"}`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
                    <input type="checkbox" checked={form.allowProfessional} onChange={e => update({ allowProfessional: e.target.checked })} className="w-4 h-4 text-brand-tactical border-theme-border bg-theme-bg-muted rounded" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text">Profissional</span>
                  </label>
                  {form.allowProfessional && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className={labelClass}>Preço Profissional (R$)</span>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={14} strokeWidth={1.5} />
                        <input required={form.allowProfessional} type="number" step="0.01" className={`${inputClass} pl-10`} value={form.priceProfessional} onChange={e => update({ priceProfessional: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Mobile */}
                <div className={`p-3 md:p-6 border rounded-2xl transition-all ${form.allowMobile ? "border-brand-warning/40 bg-brand-warning/5" : "border-theme-border bg-theme-bg"}`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
                    <input type="checkbox" checked={form.allowMobile} onChange={e => update({ allowMobile: e.target.checked })} className="w-4 h-4 text-brand-warning border-theme-border bg-theme-bg-muted rounded" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text">Mobile</span>
                  </label>
                  {form.allowMobile && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className={labelClass}>Preço Mobile (R$)</span>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-warning" size={14} strokeWidth={1.5} />
                        <input required={form.allowMobile} type="number" step="0.01" className={`${inputClass} pl-10`} value={form.priceMobile} onChange={e => update({ priceMobile: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-8 md:p-10 bg-theme-bg-muted border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
            <button type="button" onClick={onClose} className="flex-1 py-5 border border-theme-border text-[11px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all rounded-2xl">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-[2] py-5 bg-brand-tactical text-[var(--brand-text)] text-[11px] font-bold uppercase tracking-[0.3em] shadow-2xl hover:brightness-110 transition-all rounded-2xl flex items-center justify-center gap-4">
              {saving ? "SINCRONIZANDO..." : initialData ? "SALVAR ALTERAÇÕES" : "CONFIRMAR ATIVO"}
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
