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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-theme-text uppercase tracking-tighter">Meu Perfil</h2>
            {profile.user?.isVerified && (
              <div className="px-3 py-1 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full flex items-center gap-2 animate-pulse">
                <ShieldCheck size={12} className="text-brand-tactical" />
                <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">PRO VERIFICADO</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-black italic">Gerenciamento de Identidade e Ativos Técnicos</p>
        </div>
        
        <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-4 flex flex-col items-end">
          <span className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Visualizações do Perfil</span>
          <span className="text-2xl font-black text-brand-tactical tracking-tighter">{profile.profileViews || 0}</span>
        </div>
      </div>

      <ProfileStepper user={profile.user as unknown as React.ComponentProps<typeof ProfileStepper>["user"]} profile={profile as unknown as React.ComponentProps<typeof ProfileStepper>["profile"]} />

      <ProfessionalBadgesShowcase badges={(profile as unknown as { badges: React.ComponentProps<typeof ProfessionalBadgesShowcase>["badges"] }).badges || []} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Identity & Profile */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 text-brand-tactical">
            <div className="w-8 h-[1px] bg-brand-tactical/30" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Identidade Visual</span>
          </div>

          {/* Foto de Capa (Panorâmica) */}
          <div className="flex flex-col gap-2 p-6 bg-theme-bg-muted border border-theme-border rounded-2xl">
            <div className="space-y-1 text-center md:text-left mb-2">
              <h4 className="text-[12px] font-black text-theme-text uppercase tracking-wider italic">Foto de Capa</h4>
              <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest leading-relaxed">
                Banner principal do seu perfil.
              </p>
            </div>
            <CoverPhotoUpload 
              currentCoverUrl={(profile as any).coverImageUrl}
              onCoverUpdated={(newUrl) => onUpdated({ ...profile, coverImageUrl: newUrl } as any)} 
            />
          </div>

          {/* Foto de Perfil Premium */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-theme-bg-muted border border-theme-border rounded-2xl">
            <ProfilePhotoUpload 
              currentProfileUrl={formData.user?.profileImageUrl} 
              currentNome={formData.user?.nome} 
              onProfileUpdated={(url) => {
                setFormData(prev => {
                  if (!prev.user) return prev;
                  return { ...prev, user: { ...prev.user, profileImageUrl: url } };
                });
                if (onNotify) onNotify("Foto de perfil atualizada com sucesso!", "success");
              }} 
            />
          </div>

          <div className="flex items-center gap-4 text-brand-tactical mt-8">
            <div className="w-8 h-[1px] bg-brand-tactical/30" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Dados Principais</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Nome de Operação</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                value={formData.user?.nome || ""}
                onChange={(e) => setFormData({ ...formData, user: { ...formData.user, nome: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Linha Segura (WhatsApp)</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                value={formData.user?.whatsapp || ""}
                onChange={(e) => setFormData({ ...formData, user: { ...formData.user, whatsapp: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Chave de Liquidação (PIX)</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                value={formData.pixKey || ""}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="Email, CPF ou Aleatória"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Tempo de Atuação (Anos)</label>
              <div className="relative">
                <input
                  type="number"
                  disabled={!!profile.firstJobUrl && !!profile.experienceYears}
                  className={`w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-heading font-black italic text-xl ${profile.firstJobUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={formData.experienceYears || ""}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value === "" ? 0 : Number(e.target.value) })}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-tactical/40 uppercase italic tracking-widest">Anos</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Link do Primeiro Trabalho (Validação)</label>
              <div className="relative">
                <input
                  className={`w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium text-[11px] ${profile.firstJobUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={formData.firstJobUrl || ""}
                  disabled={!!profile.firstJobUrl}
                  onChange={(e) => setFormData({ ...formData, firstJobUrl: e.target.value })}
                  placeholder="Link do primeiro trabalho..."
                />
                {formData.firstJobUrl && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                     <span className={`text-[8px] font-black uppercase tracking-widest ${profile.isExperienceValidated ? "text-brand-tactical" : "text-amber-500"}`}>
                       {profile.isExperienceValidated ? "AUTENTICADO" : "ANÁLISE"}
                     </span>
                     {profile.isExperienceValidated ? <Check size={12} className="text-brand-tactical" /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Perfil de Entrega Técnica</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "TRADICIONAL", label: "Elite Tradicional", icon: <Camera size={14} />, desc: "Câmera Pro" },
                  { id: "MOBILE", label: "Mobile Maker", icon: <Phone size={14} />, desc: "Smartphone" },
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
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-theme-text" : "text-theme-muted"}`}>{type.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Location & Specialties */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 text-brand-tactical">
            <div className="w-8 h-[1px] bg-brand-tactical/30" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Endereço & Atuação</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 bg-theme-bg-muted border border-theme-border rounded-2xl">
            <div className="md:col-span-6 flex items-center gap-2 mb-2">
              <div className="h-0.5 w-4 bg-brand-tactical" />
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Base Operacional</label>
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">CEP</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-mono text-xs"
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

            <div className="md:col-span-4 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">Logradouro</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all text-xs"
                value={formData.user?.address?.split('|')[1] || ""}
                onChange={(e) => {
                  const parts = (formData.user?.address || "||||||").split('|');
                  parts[1] = e.target.value;
                  setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                }}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">Nº</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all text-xs"
                value={formData.user?.address?.split('|')[2] || ""}
                onChange={(e) => {
                  const parts = (formData.user?.address || "||||||").split('|');
                  parts[2] = e.target.value;
                  setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                }}
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">Bairro</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all text-xs"
                value={formData.user?.address?.split('|')[3] || ""}
                onChange={(e) => {
                  const parts = (formData.user?.address || "||||||").split('|');
                  parts[3] = e.target.value;
                  setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                }}
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">Cidade</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all text-xs opacity-70"
                value={formData.user?.address?.split('|')[4] || ""}
                readOnly
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">UF</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all text-xs opacity-70"
                value={formData.user?.address?.split('|')[5] || ""}
                readOnly
              />
            </div>

            <div className="md:col-span-6 space-y-1">
              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest ml-1">Complemento</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-3 text-theme-text focus:border-brand-tactical/50 outline-none transition-all text-xs"
                value={formData.user?.address?.split('|')[6] || ""}
                onChange={(e) => {
                  const parts = (formData.user?.address || "||||||").split('|');
                  parts[6] = e.target.value;
                  setFormData({ ...formData, user: { ...formData.user, address: parts.join('|') } });
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Cidade Base de Atuação</label>
              <input
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium"
                value={formData.city || ""}
                placeholder="Ex: São Paulo, SP"
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Raio Máximo de Deslocamento</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-heading font-black italic text-xl"
                  value={formData.serviceRadiusKm || ""}
                  onChange={(e) => setFormData({ ...formData, serviceRadiusKm: Number(e.target.value) })}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-tactical/40 uppercase italic tracking-widest">Km</div>
              </div>
            </div>
            
            <div className="pt-2">
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
                 className="w-full p-4 border border-brand-tactical/30 text-brand-tactical text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest hover:bg-brand-tactical/10 transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                {formData.baseLocationLat ? `GPS: ${formData.baseLocationLat.toFixed(4)}, ${formData.baseLocationLng?.toFixed(4)} (Atualizar)` : "CALIBRAR MINHA LOCALIZAÇÃO GPS ATUAL"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-brand-tactical pt-4">
            <div className="w-8 h-[1px] bg-brand-tactical/30" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Matriz de Especialidades</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["FOTO", "VÍDEO", "EDIÇÃO", "IMPRESSÃO"].map((s) => {
              const active = formData.services?.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSkill(s)}
                  className={`px-4 py-4 text-[10px] font-black border transition-all flex flex-col gap-2 items-center justify-center ${
                    active ? "bg-brand-tactical border-brand-tactical text-brand-text" : "bg-theme-bg-muted border-theme-border text-theme-muted hover:border-brand-tactical/30"
                  }`}
                >
                  <span className="tracking-[0.4em] italic">{s}</span>
                  <div className={`w-4 h-[1px] ${active ? "bg-brand-text/40" : "bg-brand-tactical/20"}`} />
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Qualificações Complementares</label>
            <textarea
              className="w-full bg-theme-bg-muted border border-theme-border p-6 text-theme-text text-xs min-h-[100px] resize-none focus:border-brand-tactical/40 outline-none transition-all leading-relaxed"
              value={formData.otherHabilities || ""}
              placeholder="Pilotagem de drone, certificações..."
              onChange={(e) => setFormData({ ...formData, otherHabilities: e.target.value })}
            />
          </div>
        </div>

        {/* Column 3: Inventory & Actions */}
        <div className="space-y-8 flex flex-col h-full">
          <div className="flex items-center gap-4 text-brand-tactical">
            <div className="w-8 h-[1px] bg-brand-tactical/30" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Ativos & Patrimônio</span>
          </div>

          <div className="flex-1 p-6 bg-theme-bg-muted border border-theme-border space-y-6 flex flex-col relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.3em] italic">Inventário Técnico</p>
                <p className="text-[9px] text-theme-muted uppercase italic opacity-60 font-bold">Usados p/ multiplicador</p>
              </div>
              <button
                onClick={addEquipment}
                className="px-3 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[9px] font-black uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text transition-all italic rounded-lg"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 relative z-10 min-h-[300px]">
              {(formData.equipmentList || []).map((eq, i) => (
                <div key={i} className="group flex flex-col sm:flex-row gap-2 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex-[2] relative">
                    <input
                      placeholder="Ex: Sony A7IV Body"
                      className="w-full bg-theme-bg border border-theme-border p-3 text-[11px] text-theme-text focus:border-brand-tactical/40 outline-none rounded-md"
                      value={eq.name}
                      onChange={(e) => updateEquipment(i, "name", e.target.value)}
                    />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Valor"
                        className="w-full bg-theme-bg border border-theme-border p-3 pr-8 text-[11px] text-brand-tactical font-black outline-none italic rounded-md"
                        value={eq.value || ""}
                        onChange={(e) => updateEquipment(i, "value", e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-theme-muted/40 uppercase">R$</div>
                    </div>
                    <button onClick={() => removeEquipment(i)} className="w-10 flex items-center justify-center bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-md">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(formData.equipmentList || []).length === 0 && (
                <div className="py-16 text-center space-y-4 border border-theme-border rounded-xl">
                  <div className="flex justify-center text-theme-muted/20"><Briefcase size={36} /></div>
                  <p className="text-[9px] text-theme-muted uppercase tracking-[0.2em] italic font-black">Nenhum ativo técnico registrado</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-theme-border flex justify-between items-center relative z-10 mt-auto">
              <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] italic">Patrimônio Estimado</span>
              <span className="text-xl font-heading font-black text-theme-text italic">
                R$ {totalPatrimony.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          <div className="pt-4 sticky bottom-4 z-20">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-5 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-40 transition-all shadow-2xl shadow-brand-tactical/20 italic flex items-center justify-center gap-3 rounded-xl"
            >
              {saving ? "SINCRONIZANDO..." : <><Save size={18} /> SALVAR ALTERAÇÕES</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
