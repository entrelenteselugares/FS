import { useState } from "react";
import { Briefcase, Camera, Phone, CheckCircle2, Check, Save, X, ShieldCheck } from "lucide-react";
import { API } from "../../lib/api";
import type { ProfileData, EquipmentItem } from "./types";
import { ProfileStepper } from "../ProfileStepper";
import { ProfessionalBadgesShowcase } from "./ProfessionalBadgesShowcase";
import { CoverPhotoUpload } from "../CoverPhotoUpload";
import { ProfilePhotoUpload } from "../ProfilePhotoUpload";

interface ProfileTabProps {
  profile: ProfileData;
  onUpdated: (p: ProfileData) => void;
  onNotify?: (msg: string, type?: "success" | "error") => void;
}

export function ProfileTab({ profile, onUpdated, onNotify }: ProfileTabProps) {
  const [formData, setFormData] = useState<ProfileData>({
    ...profile,
    equipmentList: Array.isArray(profile.equipmentList) ? profile.equipmentList : [],
    experienceYears: profile.experienceYears || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if ((formData.experienceYears ?? 0) > 0 && !formData.firstJobUrl?.trim()) {
      if (onNotify) onNotify("É obrigatório informar o link do primeiro trabalho para validar seus anos de experiência.", "error");
      return;
    }

    setSaving(true);
    try {
      const { data } = await API.patch("profissional/me", formData);
      onUpdated(data);
      if (onNotify) onNotify("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify("Erro ao atualizar perfil.", "error");
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-text uppercase ">Meu Perfil</h2>
            {profile.user?.isVerified && (
              <div className="px-3 py-1 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full flex items-center gap-2">
                <ShieldCheck size={12} className="text-brand-tactical" />
                <span className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest ">PRO VERIFICADO</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-1 font-bold ">Gerenciamento de Identidade e Ativos Técnicos</p>
        </div>
        
        <div className="bg-theme-bg-muted border border-theme-border rounded-xl px-4 py-2 flex flex-col items-end shadow-sm">
          <span className="text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Visualizações do Perfil</span>
          <span className="text-xl font-bold text-brand-tactical ">{profile.profileViews || 0}</span>
        </div>
      </div>

      <ProfileStepper user={profile.user as any} profile={profile as any} />

      <ProfessionalBadgesShowcase badges={(profile as any).badges || []} />

      {/* NEW COMPACT HEADER: Cover + Profile Photo merged */}
      <div className="relative rounded-2xl overflow-hidden bg-theme-bg-muted border border-theme-border shadow-sm">
        <div className="h-40 sm:h-56 relative w-full bg-theme-bg-muted/50 border-b border-theme-border">
          <CoverPhotoUpload 
            currentCoverUrl={(profile as any).coverImageUrl}
            onCoverUpdated={(newUrl) => onUpdated({ ...profile, coverImageUrl: newUrl } as any)} 
          />
        </div>
        
        <div className="relative px-6 pb-6 flex flex-col md:flex-row md:items-end gap-4 -mt-12 sm:-mt-16 z-10">
          <div className="bg-theme-bg p-1.5 sm:p-2 rounded-2xl shadow-xl inline-block border border-theme-border flex-shrink-0">
            <ProfilePhotoUpload 
              currentProfileUrl={formData.user?.profileImageUrl} 
              currentNome={formData.user?.nome} 
              onProfileUpdated={(url) => {
                setFormData(prev => {
                  if (!prev.user) return prev;
                  return { ...prev, user: { ...prev.user, profileImageUrl: url } };
                });
                if (onNotify) onNotify("Foto atualizada!", "success");
              }} 
            />
          </div>
          <div className="pb-1 sm:pb-3 space-y-1 flex-1">
             <p className="text-lg sm:text-xl font-heading font-bold text-theme-text uppercase drop-shadow-md">
               {formData.user?.nome || "Sem Nome de Operação"}
             </p>
             <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.2em]">{formData.city || "Base Não Informada"}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Data vs Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Column 1: Formulários (Col 7) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Dados Principais */}
          <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-tactical border-b border-theme-border/50 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] ">Dados Principais</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Nome de Operação</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium rounded-lg"
                  value={formData.user?.nome || ""}
                  onChange={(e) => setFormData({ ...formData, user: { ...formData.user, nome: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Linha Segura (WhatsApp)</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium rounded-lg"
                  value={formData.user?.whatsapp || ""}
                  onChange={(e) => setFormData({ ...formData, user: { ...formData.user, whatsapp: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Chave PIX</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium rounded-lg"
                  value={formData.pixKey || ""}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="Email, CPF ou Celular"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Tempo de Atuação (Anos)</label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={!!profile.firstJobUrl && !!profile.experienceYears}
                    className={`w-full bg-theme-bg border border-theme-border p-3 text-sm text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-heading font-black italic rounded-lg ${profile.firstJobUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.experienceYears || ""}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value === "" ? 0 : Number(e.target.value) })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-theme-muted/50 uppercase ">Anos</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Link do Primeiro Trabalho (Validação de Tempo)</label>
              <div className="relative">
                <input
                  className={`w-full bg-theme-bg border border-theme-border p-3 text-xs text-theme-text focus:border-brand-tactical/50 outline-none transition-all rounded-lg ${profile.firstJobUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={formData.firstJobUrl || ""}
                  disabled={!!profile.firstJobUrl}
                  onChange={(e) => setFormData({ ...formData, firstJobUrl: e.target.value })}
                  placeholder="URL para checagem..."
                />
                {formData.firstJobUrl && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${profile.isExperienceValidated ? "text-brand-tactical" : "text-amber-500"}`}>
                      {profile.isExperienceValidated ? "AUTENTICADO" : "ANÁLISE"}
                    </span>
                    {profile.isExperienceValidated ? <Check size={12} className="text-brand-tactical" /> : <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Perfil de Entrega</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "TRADICIONAL", label: "Elite Tradicional", icon: <Camera size={14} /> },
                  { id: "MOBILE", label: "Mobile Maker", icon: <Phone size={14} /> },
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
                      className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 relative ${
                        isActive
                          ? "bg-brand-tactical/10 border-brand-tactical shadow-sm"
                          : "bg-theme-bg border-theme-border hover:border-brand-tactical/30"
                      }`}
                    >
                      {isActive && <CheckCircle2 size={10} className="absolute top-1.5 right-1.5 text-brand-tactical" />}
                      <div className={isActive ? "text-brand-tactical" : "text-theme-muted"}>{type.icon}</div>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-theme-text" : "text-theme-muted"}`}>{type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Endereço & Atuação */}
          <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-tactical border-b border-theme-border/50 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] ">Base & Endereço</span>
            </div>

            <div className="grid grid-cols-6 gap-2.5">
              <div className="col-span-2 sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">CEP</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-xs text-theme-text focus:border-brand-tactical/50 rounded-md"
                  value={formData.user?.address?.split('|')[0] || ""}
                  placeholder="00000-000"
                  onChange={(e) => {
                    const parts = (formData.user?.address || "||||||").split('|');
                    parts[0] = e.target.value;
                    setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                  }}
                  onBlur={async (e) => {
                    const cep = e.target.value.replace(/\D/g, '');
                    if (cep.length === 8) {
                      try {
                        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        const data = await res.json();
                        if (!data.erro) {
                          const parts = [cep, data.logradouro, "", data.bairro, data.localidade, data.uf, ""];
                          setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                        }
                      } catch (err) { console.error("CEP error", err); }
                    }
                  }}
                />
              </div>

              <div className="col-span-4 sm:col-span-4 space-y-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Logradouro</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-xs text-theme-text focus:border-brand-tactical/50 rounded-md"
                  value={formData.user?.address?.split('|')[1] || ""}
                  onChange={(e) => {
                    const parts = (formData.user?.address || "||||||").split('|');
                    parts[1] = e.target.value;
                    setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                  }}
                />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Nº</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-xs text-theme-text focus:border-brand-tactical/50 rounded-md"
                  value={formData.user?.address?.split('|')[2] || ""}
                  onChange={(e) => {
                    const parts = (formData.user?.address || "||||||").split('|');
                    parts[2] = e.target.value;
                    setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                  }}
                />
              </div>

              <div className="col-span-4 sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Bairro</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-xs text-theme-text focus:border-brand-tactical/50 rounded-md"
                  value={formData.user?.address?.split('|')[3] || ""}
                  onChange={(e) => {
                    const parts = (formData.user?.address || "||||||").split('|');
                    parts[3] = e.target.value;
                    setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                  }}
                />
              </div>

              <div className="col-span-4 sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Cidade</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-xs text-theme-text rounded-md opacity-70"
                  value={formData.user?.address?.split('|')[4] || ""}
                  readOnly
                />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">UF</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-xs text-theme-text rounded-md opacity-70"
                  value={formData.user?.address?.split('|')[5] || ""}
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Cidade Base Primária</label>
                <input
                  className="w-full bg-theme-bg border border-theme-border p-2.5 text-sm text-theme-text focus:border-brand-tactical/50 rounded-md"
                  value={formData.city || ""}
                  placeholder="São Paulo, SP"
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-80">Raio de Cobertura (Km)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-theme-bg border border-theme-border p-2.5 pr-8 text-sm text-theme-text focus:border-brand-tactical/50 font-heading font-bold rounded-md"
                    value={formData.serviceRadiusKm || ""}
                    onChange={(e) => setFormData({ ...formData, serviceRadiusKm: Number(e.target.value) })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-brand-tactical/50">KM</span>
                </div>
              </div>
            </div>

            <button
               type="button"
               onClick={() => {
                 if ("geolocation" in navigator) {
                   navigator.geolocation.getCurrentPosition((pos) => {
                     setFormData({
                       ...formData,
                       baseLocationLat: pos.coords.latitude,
                       baseLocationLng: pos.coords.longitude
                     });
                     if (onNotify) onNotify("Coordenadas GPS capturadas!", "success");
                   });
                 } else {
                   if (onNotify) onNotify("Geolocalização não disponível.", "error");
                 }
               }}
               className="w-full p-3 border border-brand-tactical/30 rounded-lg text-brand-tactical text-[9px] font-bold uppercase tracking-widest hover:bg-brand-tactical/10 transition-all flex items-center justify-center gap-2"
            >
              {formData.baseLocationLat ? `GPS: ${formData.baseLocationLat.toFixed(4)}, ${formData.baseLocationLng?.toFixed(4)}` : "CAPTURAR LOCALIZAÇÃO GPS ATUAL"}
            </button>
          </div>

          {/* Especialidades e Extras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-brand-tactical border-b border-theme-border/50 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] ">Especialidades</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["FOTO", "VÍDEO", "EDIÇÃO", "IMPRESSÃO"].map((s) => {
                  const active = formData.services?.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={`p-3 rounded-lg text-[9px] font-black border transition-all ${
                        active ? "bg-brand-tactical border-brand-tactical text-brand-text shadow-sm" : "bg-theme-bg border-theme-border text-theme-muted hover:border-brand-tactical/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-brand-tactical border-b border-theme-border/50 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] ">Qualificações Extras</span>
              </div>
              <textarea
                className="w-full bg-theme-bg border border-theme-border rounded-lg p-3 text-xs text-theme-text min-h-[92px] resize-none focus:border-brand-tactical/40"
                value={formData.otherHabilities || ""}
                placeholder="Drone, Direção de Arte..."
                onChange={(e) => setFormData({ ...formData, otherHabilities: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Inventory & Actions (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="flex-1 bg-theme-bg-muted border border-theme-border rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden min-h-[400px]">
            <div className="flex justify-between items-center border-b border-theme-border/50 pb-3 mb-4">
              <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.2em] ">Inventário Técnico</span>
              <button
                onClick={addEquipment}
                className="px-2.5 py-1.5 bg-brand-tactical/10 border border-brand-tactical/30 rounded-md text-brand-tactical text-[10px] font-bold uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text transition-all"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {(formData.equipmentList || []).map((eq, i) => (
                <div key={i} className="flex gap-2 items-center bg-theme-bg border border-theme-border p-2 rounded-lg">
                  <input
                    placeholder="Ex: Lente 50mm f/1.8"
                    className="flex-1 min-w-0 bg-transparent text-xs text-theme-text focus:outline-none"
                    value={eq.name}
                    onChange={(e) => updateEquipment(i, "name", e.target.value)}
                  />
                  <div className="w-px h-6 bg-theme-border" />
                  <div className="w-24 relative">
                    <input
                      type="number"
                      placeholder="Valor"
                      className="w-full bg-transparent text-xs text-brand-tactical font-bold pr-5 focus:outline-none text-right"
                      value={eq.value || ""}
                      onChange={(e) => updateEquipment(i, "value", e.target.value === "" ? 0 : Number(e.target.value))}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-theme-muted font-bold">R$</span>
                  </div>
                  <button onClick={() => removeEquipment(i)} className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(formData.equipmentList || []).length === 0 && (
                <div className="py-12 flex flex-col items-center gap-3 opacity-40">
                  <Briefcase size={28} />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Vazio</span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-theme-border/50 flex justify-between items-center">
              <span className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.2em]">Patrimônio Total</span>
              <span className="text-xl font-heading font-bold text-theme-text ">
                R$ {totalPatrimony.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-brand-tactical rounded-xl text-brand-text text-[11px] font-bold uppercase tracking-[0.3em] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-tactical/10 "
          >
            {saving ? "SALVANDO..." : <><Save size={16} /> CONFIRMAR ALTERAÇÕES</>}
          </button>
        </div>
      </div>
    </div>
  );
}
