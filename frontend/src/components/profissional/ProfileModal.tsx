import { useState } from "react";
import { X, Briefcase, Camera, Phone, CheckCircle2, Check } from "lucide-react";
import { API } from "../../lib/api";
import type { ProfileData, EquipmentItem } from "./types";

interface ProfileModalProps {
  profile: ProfileData;
  onClose: () => void;
  onUpdated: (p: ProfileData) => void;
}

export function ProfileModal({ profile, onClose, onUpdated }: ProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    ...profile,
    equipmentList: Array.isArray(profile.equipmentList) ? profile.equipmentList : [],
    experienceYears: profile.experienceYears || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch("profissional/me", formData);
      onUpdated(data);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    const current = formData.services || [];
    const next = current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill];
    setFormData({ ...formData, services: next });
  };

  const addEquipment = () => {
    setFormData((prev) => ({
      ...prev,
      equipmentList: [...(prev.equipmentList || []), { name: "", value: 0 }],
    }));
  };

  const updateEquipment = (index: number, field: keyof EquipmentItem, val: string | number) => {
    const newList = [...(formData.equipmentList || [])];
    newList[index] = { ...newList[index], [field]: val };
    setFormData({ ...formData, equipmentList: newList });
  };

  const removeEquipment = (index: number) => {
    setFormData({
      ...formData,
      equipmentList: (formData.equipmentList || []).filter((_, i) => i !== index),
    });
  };

  const totalPatrimony = (formData.equipmentList || []).reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 backdrop-blur-xl bg-black/40">
      <div className="w-full max-w-5xl max-h-[90vh] bg-theme-bg border border-theme-border flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-tactical/50 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center px-8 md:px-12 py-8 border-b border-theme-border relative z-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-heading font-bold text-theme-text uppercase leading-none">
              Configuração de Perfil
            </h2>
            <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] font-bold">
              Gerenciamento de Identidade e Ativos Técnicos
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted text-theme-muted hover:text-brand-tactical transition-all">
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 md:p-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* Left Column: Data & Specialties */}
            <div className="space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-4 text-brand-tactical">
                  <div className="w-8 h-[1px] bg-brand-tactical/30" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Credenciais Operacionais</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Nome de Operação</label>
                    <input
                      className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                      value={formData.user?.nome || ""}
                      onChange={(e) => setFormData({ ...formData, user: { ...formData.user, nome: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Linha Segura (WhatsApp)</label>
                    <input
                      className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                      value={formData.user?.whatsapp || ""}
                      onChange={(e) => setFormData({ ...formData, user: { ...formData.user, whatsapp: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Chave de Liquidação (PIX)</label>
                    <input
                      className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                      value={formData.pixKey || ""}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                      placeholder="Email, CPF ou Aleatória"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Tempo de Atuação (Anos)</label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={!!profile.firstJobUrl && !!profile.experienceYears}
                        className={`w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-heading font-black italic text-xl ${profile.firstJobUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-tactical/40 uppercase tracking-widest">Anos</div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Link do Primeiro Trabalho (Validação de Experiência)</label>
                    <div className="relative">
                      <input
                        className={`w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium text-[11px] ${profile.firstJobUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={formData.firstJobUrl || ""}
                        disabled={!!profile.firstJobUrl}
                        onChange={(e) => setFormData({ ...formData, firstJobUrl: e.target.value })}
                        placeholder="Link do Instagram, YouTube ou Portfolio de quando começou..."
                      />
                      {formData.firstJobUrl && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${profile.isExperienceValidated ? "text-brand-tactical" : "text-amber-500"}`}>
                             {profile.isExperienceValidated ? "AUTENTICADO" : "EM ANÁLISE"}
                           </span>
                           {profile.isExperienceValidated ? <Check size={12} className="text-brand-tactical" /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-theme-muted/50 uppercase tracking-widest font-bold">O tempo de experiência será validado pela data de publicação deste link.</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Perfil de Entrega Técnica</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: "TRADICIONAL", label: "Elite Tradicional", icon: <Camera size={14} />, desc: "Câmera Pro + PC" },
                        { id: "MOBILE", label: "Mobile Maker", icon: <Phone size={14} />, desc: "Smartphone High-End" },
                      ].map((type) => {
                        const isActive = (formData.workflowType || []).includes(type.id);
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              const current = formData.workflowType || [];
                              const next = current.includes(type.id)
                                ? current.filter((id) => id !== type.id)
                                : [...current, type.id];
                              if (next.length > 0) setFormData({ ...formData, workflowType: next });
                            }}
                            className={`p-4 border text-left transition-all flex items-center gap-4 relative ${
                              isActive
                                ? "bg-brand-tactical/10 border-brand-tactical shadow-[0_0_20px_rgba(133,185,172,0.1)]"
                                : "bg-theme-bg-muted border-theme-border text-theme-muted hover:border-brand-tactical/20"
                            }`}
                          >
                            {isActive && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 size={10} className="text-brand-tactical" />
                              </div>
                            )}
                            <div className={`flex-shrink-0 ${isActive ? "text-brand-tactical" : "opacity-30"}`}>{type.icon}</div>
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-theme-text" : "text-theme-muted"}`}>{type.label}</p>
                              <p className="text-[10px] font-bold uppercase opacity-60">{type.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 text-brand-tactical">
                  <div className="w-8 h-[1px] bg-brand-tactical/30" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Matriz de Especialidades</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {["FOTO", "VÍDEO", "EDIÇÃO"].map((s) => {
                    const active = formData.services?.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSkill(s)}
                        className={`flex-1 min-w-[120px] px-6 py-4 text-[10px] font-black border transition-all flex flex-col gap-2 items-center justify-center ${
                          active ? "bg-brand-tactical border-brand-tactical text-brand-text" : "bg-theme-bg-muted border-theme-border text-theme-muted hover:border-brand-tactical/30"
                        }`}
                      >
                        <span className="tracking-[0.4em]">{s}</span>
                        <div className={`w-4 h-[1px] ${active ? "bg-brand-text/40" : "bg-brand-tactical/20"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Qualificações Complementares</label>
                <textarea
                  className="w-full bg-theme-bg-muted border border-theme-border p-6 text-theme-text text-xs min-h-[120px] resize-none focus:border-brand-tactical/40 outline-none transition-all leading-relaxed"
                  value={formData.otherHabilities || ""}
                  placeholder="Pilotagem de drone, certificações, color grading avançado..."
                  onChange={(e) => setFormData({ ...formData, otherHabilities: e.target.value })}
                />
              </div>
            </div>

            {/* Right Column: Inventory */}
            <div className="space-y-10">
              <div className="p-8 bg-theme-bg-muted border border-theme-border space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-brand-tactical uppercase tracking-[0.3em]">Inventário Técnico</p>
                    <p className="text-[9px] text-theme-muted uppercase opacity-60 font-bold">Ativos usados para cálculo de multiplicador</p>
                  </div>
                  <button
                    onClick={addEquipment}
                    className="px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[9px] font-bold uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text transition-all"
                  >
                    + Inserir Item
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {(formData.equipmentList || []).map((eq, i) => (
                    <div key={i} className="group flex gap-3 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex-[3] relative">
                        <input
                          placeholder="Ex: Sony A7IV Body"
                          className="w-full bg-theme-bg border border-theme-border p-4 text-[11px] text-theme-text focus:border-brand-tactical/40 outline-none"
                          value={eq.name}
                          onChange={(e) => updateEquipment(i, "name", e.target.value)}
                        />
                      </div>
                      <div className="flex-[1.5] relative">
                        <input
                          type="number"
                          placeholder="Valor"
                          className="w-full bg-theme-bg border border-theme-border p-4 text-[11px] text-brand-tactical font-bold outline-none"
                          value={eq.value}
                          onChange={(e) => updateEquipment(i, "value", Number(e.target.value))}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-theme-muted/40 uppercase">BRL</div>
                      </div>
                      <button onClick={() => removeEquipment(i)} className="p-4 bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(formData.equipmentList || []).length === 0 && (
                    <div className="py-20 text-center space-y-4 border border-theme-border">
                      <div className="flex justify-center text-theme-muted/20"><Briefcase size={48} /></div>
                      <p className="text-[9px] text-theme-muted uppercase tracking-[0.2em] font-bold">Nenhum ativo técnico registrado</p>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-theme-border flex justify-between items-center">
                  <span className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.2em]">Patrimônio Técnico Estimado</span>
                  <span className="text-xl font-heading font-bold text-theme-text">
                    R$ {totalPatrimony.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 md:p-12 border-t border-theme-border bg-theme-bg flex justify-end gap-6 relative z-10">
          <button onClick={onClose} className="px-8 py-5 text-theme-muted text-[11px] font-bold uppercase tracking-[0.3em] hover:text-theme-text transition-all">
            Descartar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-16 py-5 bg-brand-tactical text-brand-text text-[11px] font-bold uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-40 transition-all shadow-2xl shadow-brand-tactical/20 flex items-center gap-4"
          >
            {saving ? "SINCRONIZANDO..." : <><Check size={20} /> EFETIVAR ATUALIZAÇÃO</>}
          </button>
        </div>
      </div>
    </div>
  );
}

