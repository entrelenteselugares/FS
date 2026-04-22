import React, { useState, useEffect } from "react";
import { Briefcase, Plus, Trash2, Edit3, Save } from "lucide-react";
import { API } from "../../lib/api";
import { T, BtnPrimary, BtnGhost } from "../../lib/theme";

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
}

export const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/configs");
      const catalog = data.configs.find((c: any) => c.key === "services_catalog");
      if (catalog && catalog.value) {
        setServices(JSON.parse(catalog.value));
      }
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  };

  const persistServices = async (updatedList: Service[]) => {
    setSaving(true);
    try {
      await API.patch("/admin/configs", {
        configs: [
          { key: "services_catalog", value: JSON.stringify(updatedList) }
        ]
      });
      setServices(updatedList);
    } catch (err) {
      alert("Erro ao salvar catálogo de serviços.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newService.name) return;
    
    let updated: Service[];
    if (editingService) {
      updated = services.map(s => s.id === editingService.id ? { ...newService, id: editingService.id } : s);
    } else {
      updated = [...services, { ...newService, id: Date.now().toString() }];
    }
    
    await persistServices(updated);
    setIsAdding(false);
    setEditingService(null);
    setNewService({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });
  };

  const handleEditOpen = (service: Service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      category: service.category
    });
    setIsAdding(true);
  };

  const removeService = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este serviço?")) return;
    const updated = services.filter(s => s.id !== id);
    await persistServices(updated);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-theme-border pb-8">
        <div>
          <h2 className="text-4xl font-heading text-theme-text tracking-tighter uppercase font-black">Catálogo de Serviços</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-black italic">Configuração de Produtos e Tabelas de Preço</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingService(null);
            setNewService({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });
          }}
          style={BtnPrimary}
          className="shadow-xl shadow-brand-tactical/10"
        >
          <Plus size={14} /> ADICIONAR SERVIÇO
        </button>
      </div>

      {isAdding && (
        <div style={{ background: T.bgField, border: `1px solid ${T.brand}44` }} className="p-10 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Nome do Serviço</label>
              <input 
                value={newService.name}
                onChange={e => setNewService({...newService, name: e.target.value})}
                style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                placeholder="Ex: Foto Impressa Extra"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Descrição Curta</label>
              <input 
                value={newService.description}
                onChange={e => setNewService({...newService, description: e.target.value})}
                style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                placeholder="O que está incluso no pacote?"
              />
            </div>
            <div className="space-y-2">
              <label style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Preço Base (R$)</label>
              <input 
                type="number"
                value={newService.basePrice}
                onChange={e => setNewService({...newService, basePrice: Number(e.target.value)})}
                style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
              />
            </div>
          </div>
          <div className="mt-10 flex gap-6 items-center">
            <button 
              onClick={handleAdd} 
              disabled={saving}
              style={BtnPrimary}
            >
              <Save size={14} /> {saving ? "PROCESSANDO..." : editingService ? "SALVAR ALTERAÇÕES" : "SALVAR NOVO SERVIÇO"}
            </button>
            <button 
              onClick={() => { setIsAdding(false); setEditingService(null); }} 
              style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 1, background: "transparent", border: "none", cursor: "pointer" }}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div style={{ background: T.bgField, borderBottom: `1px solid ${T.border}` }} className="grid grid-cols-12 gap-4 px-10 py-4 text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">
          <div className="col-span-1">Categoria</div>
          <div className="col-span-4">Serviço / Descrição</div>
          <div className="col-span-3 text-right">Preço Sugerido</div>
          <div className="col-span-4 text-right">Ações Operacionais</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse font-black">Escaneando Ativos...</div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest font-black">Nenhum serviço configurado.</div>
        ) : (
          services.map(s => (
            <div key={s.id} style={{ background: T.bgCard, border: `1px solid ${T.border}` }} className="hover:border-brand-tactical/30 transition-all group">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-10 py-6">
                <div className="col-span-1">
                  <span style={{ fontSize: 8, fontWeight: 900, color: T.text3, border: `1px solid ${T.border}`, padding: "2px 6px", textTransform: "uppercase" }}>{s.category}</span>
                </div>
                <div className="col-span-4">
                  <div style={{ fontSize: 14, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.5 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }} className="mt-1 opacity-80">{s.description}</div>
                </div>
                <div className="col-span-3 text-right">
                  <div style={{ fontSize: 15, fontFamily: T.fontD, fontWeight: 900, color: T.brand, letterSpacing: 1 }}>R$ {Number(s.basePrice).toFixed(2).replace(".", ",")}</div>
                </div>
                <div className="col-span-4 flex justify-end gap-6 opacity-30 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleEditOpen(s)}
                    style={{ background: "transparent", border: "none", color: T.text3, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Edit3 size={11} /> Ajustar
                  </button>
                  <button 
                    onClick={() => removeService(s.id)} 
                    style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Trash2 size={11} /> Remover
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div style={{ background: T.bgField, border: `1px solid ${T.border}` }} className="mt-20 p-10 flex items-center gap-8">
        <Briefcase style={{ color: T.text3 }} size={32} />
        <div>
          <h4 style={{ color: T.text, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }} className="mb-1 italic">Nota Fiscal e Taxas</h4>
          <p style={{ color: T.text3, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1.6 }}>Os preços acima são apenas base para o gerador de orçamentos. Alterações aqui não afetam eventos que já possuem contratos ativos.</p>
        </div>
      </div>
    </div>
  );
};
