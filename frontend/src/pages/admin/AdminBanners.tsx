import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "../../lib/api";
import { T, S } from "../../lib/theme";
import { Plus, Edit2, Trash2, Check, X, GripVertical, Image as ImageIcon } from "lucide-react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  primaryBtn: string;
  primaryAction: string;
  icon: string | null;
  bgImage: string;
  order: number;
  active: boolean;
}

export const AdminBanners: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<HeroSlide>>({});
  const [isAdding, setIsAdding] = useState(false);

  const { data: banners = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["admin_banners"],
    queryFn: () => API.get("/admin/banners").then(res => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (banner: Partial<HeroSlide>) => {
      if (banner.id) {
        return API.put(`/admin/banners/${banner.id}`, banner);
      }
      return API.post("/admin/banners", banner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      queryClient.invalidateQueries({ queryKey: ["public_banners"] });
      setEditingId(null);
      setIsAdding(false);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      queryClient.invalidateQueries({ queryKey: ["public_banners"] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (banner: HeroSlide) => API.put(`/admin/banners/${banner.id}`, { active: !banner.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_banners"] });
      queryClient.invalidateQueries({ queryKey: ["public_banners"] });
    }
  });

  const handleEdit = (banner: HeroSlide) => {
    setEditingId(banner.id);
    setFormData(banner);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) return <div style={{ color: T.text3 }}>Carregando...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: T.text }}>Banners da Vitrine</h2>
          <p style={{ color: T.text3, marginTop: 4 }}>Gerencie os slides exibidos na página inicial.</p>
        </div>
        <button style={S.btnPrimary} onClick={() => { setIsAdding(true); setFormData({ active: true, order: banners.length }); }}>
          <Plus size={16} style={{ marginRight: 8 }} />
          Novo Banner
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {isAdding && (
          <BannerEditor 
            banner={formData} 
            onChange={(d: any) => setFormData(p => ({ ...p, ...d }))} 
            onSave={handleSave} 
            onCancel={() => setIsAdding(false)} 
            isSaving={saveMutation.isPending}
          />
        )}

        {banners.map((banner) => (
          <div key={banner.id}>
            {editingId === banner.id ? (
              <BannerEditor 
                banner={formData} 
                onChange={(d: any) => setFormData(p => ({ ...p, ...d }))} 
                onSave={handleSave} 
                onCancel={() => setEditingId(null)} 
                isSaving={saveMutation.isPending}
              />
            ) : (
              <div style={{ ...S.card, padding: 16, display: "flex", alignItems: "center", gap: 16, opacity: banner.active ? 1 : 0.5 }}>
                <div style={{ cursor: "grab", color: T.text3 }}><GripVertical size={20} /></div>
                
                <div style={{ width: 80, height: 45, borderRadius: 4, overflow: "hidden", background: "#333", flexShrink: 0, position: "relative" }}>
                  {banner.bgImage ? (
                    <img src={banner.bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageIcon size={20} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: T.text3 }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: T.text, fontSize: 15 }}>{banner.title}</div>
                  <div style={{ color: T.text3, fontSize: 13, marginTop: 2 }}>{banner.subtitle}</div>
                </div>

                <div style={{ flexShrink: 0, fontSize: 12, color: T.text3 }}>
                  <div><strong>Botão:</strong> {banner.primaryBtn}</div>
                  <div><strong>Link:</strong> {banner.primaryAction}</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
                  <button style={{ ...S.btnGhost, color: banner.active ? "#85b9ac" : T.text3 }} onClick={() => toggleActiveMutation.mutate(banner)}>
                    {banner.active ? <Check size={16} /> : <X size={16} />}
                  </button>
                  <button style={S.btnGhost} onClick={() => handleEdit(banner)}>
                    <Edit2 size={16} />
                  </button>
                  <button style={{ ...S.btnGhost, color: "#ef4444" }} onClick={() => { if(window.confirm("Excluir banner?")) deleteMutation.mutate(banner.id); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const BannerEditor = ({ banner, onChange, onSave, onCancel, isSaving }: any) => {
  return (
    <div style={{ ...S.card, padding: 24, background: T.bgCard, border: `1px solid ${T.brand}40` }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>Título Principal</label>
          <input 
            type="text" 
            value={banner.title || ""} 
            onChange={e => onChange({ title: e.target.value })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>Subtítulo (Em Cima)</label>
          <input 
            type="text" 
            value={banner.subtitle || ""} 
            onChange={e => onChange({ subtitle: e.target.value })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>Descrição Curta (Abaixo)</label>
          <input 
            type="text" 
            value={banner.description || ""} 
            onChange={e => onChange({ description: e.target.value })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>Texto do Botão</label>
          <input 
            type="text" 
            value={banner.primaryBtn || ""} 
            onChange={e => onChange({ primaryBtn: e.target.value })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>Link do Botão (/rota ou https://...)</label>
          <input 
            type="text" 
            value={banner.primaryAction || ""} 
            onChange={e => onChange({ primaryAction: e.target.value })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>URL da Imagem de Fundo (1920x1080)</label>
          <input 
            type="text" 
            value={banner.bgImage || ""} 
            onChange={e => onChange({ bgImage: e.target.value })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: T.text3, marginBottom: 4 }}>Ordem (Menor aparece primeiro)</label>
          <input 
            type="number" 
            value={banner.order ?? 0} 
            onChange={e => onChange({ order: Number(e.target.value) })}
            style={{ width: "100%", padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: T.text, fontSize: 14 }}>
            <input type="checkbox" checked={banner.active ?? true} onChange={e => onChange({ active: e.target.checked })} />
            Ativo (Visível na Vitrine)
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
        <button style={S.btnGhost} onClick={onCancel} disabled={isSaving}>Cancelar</button>
        <button style={S.btnPrimary} onClick={onSave} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Banner"}</button>
      </div>
    </div>
  );
};
