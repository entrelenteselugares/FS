import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { Users, Plus, TrendingUp, MousePointer2, Award, Search, X, ArrowRight, Trash2, Power } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  rewardType: string;
  rewardValue: number;
  active: boolean;
  owner: { nome: string, email: string };
  _count: { visits: number, conversions: number };
}

export const AdminAmbassadors: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState<{
    name: string,
    slug: string,
    ownerId: string,
    rewardType: string,
    rewardValue: number,
    targetCategories: string[],
    targetServices: string[]
  }>({
    name: "",
    slug: "",
    ownerId: "",
    rewardType: "CREDIT",
    rewardValue: 10,
    targetCategories: [],
    targetServices: []
  });

  const [users, setUsers] = useState<{id: string, nome: string}[]>([]);
  const [catalog, setCatalog] = useState<{id: string, name: string, category: string}[]>([]);

  useEffect(() => {
    fetchCampaigns();
    API.get("/admin/users").then(r => setUsers(r.data)).catch(() => {});
    API.get("/admin/service-catalog").then(r => setCatalog(r.data)).catch(() => {});
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/ambassador/stats");
      setCampaigns(data);
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/admin/ambassador/campaigns", formData);
      setIsModalOpen(false);
      fetchCampaigns();
    } catch {
      alert("Erro ao criar campanha.");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await API.patch(`/admin/ambassador/campaigns/${id}/toggle`);
      fetchCampaigns();
    } catch {
      alert("Erro ao alterar status da campanha.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a campanha "${name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    try {
      await API.delete(`/admin/ambassador/campaigns/${id}`);
      fetchCampaigns();
    } catch {
      alert("Erro ao excluir campanha.");
    }
  };

  const filtered = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.owner.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 h-screen flex flex-col items-center justify-center space-y-4">
        <div className="h-1 w-32 bg-zinc-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-tactical animate-shimmer" style={{ width: '40%' }} />
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Engine...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div className="space-y-4 min-w-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            Rede de <span className="text-brand-tactical">Embaixadores</span>
          </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Marketing de Afiliados e Influência</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white transition-all italic shadow-2xl whitespace-nowrap"
          >
            <Plus size={16} /> Nova Campanha
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Campanhas", value: campaigns.length, icon: <Users size={16} /> },
          { label: "Cliques Globais", value: campaigns.reduce((acc, c) => acc + c._count.visits, 0), icon: <MousePointer2 size={16} /> },
          { label: "Conversões", value: campaigns.reduce((acc, c) => acc + c._count.conversions, 0), icon: <TrendingUp size={16} /> },
          { label: "Total Recompensas", value: `R$ ${campaigns.reduce((acc, c) => acc + (c._count.conversions * c.rewardValue), 0).toFixed(2)}`, icon: <Award size={16} /> },
        ].map((s, i) => (
          <div key={i} className="bg-theme-card border border-theme-border p-6 space-y-2">
            <div className="flex items-center gap-2 text-theme-subtle">
              {s.icon}
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest">{s.label}</span>
            </div>
            <p className="text-3xl font-black italic tracking-tighter text-theme-text">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-subtle" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nome, slug ou embaixador..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-theme-bg border border-theme-border text-theme-text pl-12 pr-4 py-4 text-sm focus:border-brand-tactical/50 transition-all outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-theme-card border border-theme-border overflow-x-auto w-full rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-theme-border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-subtle">
              <th className="p-6">Campanha / Slug</th>
              <th className="p-6">Embaixador</th>
              <th className="p-6">Recompensa</th>
              <th className="p-6 text-center">Cliques</th>
              <th className="p-6 text-center">Conversões</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-theme-border/20 transition-colors group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-theme-text uppercase italic">{c.name}</span>
                    <span className="text-[10px] font-mono text-theme-subtle">/embaixador/{c.slug}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-theme-text">{c.owner.nome}</span>
                    <span className="text-[10px] text-theme-subtle">{c.owner.email}</span>
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-xs font-black text-brand-tactical italic">
                    R$ {Number(c.rewardValue).toFixed(2)} ({c.rewardType})
                  </span>
                </td>
                <td className="p-6 text-center">
                  <span className="text-sm font-black text-theme-muted">{c._count.visits}</span>
                </td>
                <td className="p-6 text-center">
                  <span className="text-sm font-black text-emerald-500">{c._count.conversions}</span>
                </td>
                <td className="p-6">
                  <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest ${c.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {c.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleToggle(c.id)}
                      title={c.active ? 'Desativar campanha' : 'Ativar campanha'}
                      className={`p-2 rounded-lg transition-all ${
                        c.active
                          ? 'text-emerald-500 hover:bg-emerald-500/10'
                          : 'text-zinc-500 hover:bg-white/5'
                      }`}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      title="Excluir campanha permanentemente"
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Award className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Nova Campanha</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Engenharia de Escala e Referral</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Nome da Campanha</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase"
                  placeholder="Ex: Verão 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Slug URL</label>
                <input 
                  type="text" required
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-')})}
                  className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-mono outline-none focus:border-brand-tactical rounded-xl"
                  placeholder="verao-26"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Embaixador Responsável</label>
                <select 
                  required
                  value={formData.ownerId}
                  onChange={e => setFormData({...formData, ownerId: e.target.value})}
                  className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl cursor-pointer"
                >
                  <option value="">Selecione um usuário...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Tipo de Recompensa</label>
                  <select 
                    value={formData.rewardType}
                    onChange={e => setFormData({...formData, rewardType: e.target.value})}
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl cursor-pointer"
                  >
                    <option value="CREDIT">Crédito (Loja)</option>
                    <option value="CASH">Dinheiro (PIX)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Valor (R$)</label>
                  <input 
                    type="number" required
                    value={formData.rewardValue}
                    onChange={e => setFormData({...formData, rewardValue: Number(e.target.value)})}
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-brand-tactical font-black outline-none focus:border-brand-tactical rounded-xl"
                  />
                </div>
              </div>

              {/* Seleção de Categorias/Serviços */}
              <div className="space-y-6 pt-4 border-t border-theme-border/20">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text mb-4">Escopo da Campanha</h3>
                  <p className="text-[9px] text-theme-muted uppercase tracking-wider mb-6 opacity-60">Selecione as categorias ou serviços que ativam a recompensa</p>
                </div>

                {Object.entries(
                  catalog.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  }, {} as Record<string, typeof catalog>)
                ).map(([category, items]) => {
                  const isCategorySelected = formData.targetCategories.includes(category);

                  const toggleCategory = () => {
                    if (isCategorySelected) {
                      setFormData({
                        ...formData,
                        targetCategories: formData.targetCategories.filter(c => c !== category),
                        targetServices: formData.targetServices.filter(id => !items.find(i => i.id === id))
                      });
                    } else {
                      const otherServices = formData.targetServices.filter(id => !items.find(i => i.id === id));
                      setFormData({
                        ...formData,
                        targetCategories: [...formData.targetCategories, category],
                        targetServices: [...otherServices, ...items.map(i => i.id)]
                      });
                    }
                  };

                  return (
                    <div key={category} className="space-y-4 bg-theme-bg-muted/30 p-6 rounded-3xl border border-theme-border/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isCategorySelected ? 'bg-brand-tactical' : 'bg-zinc-800'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-theme-text italic">{category}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={toggleCategory}
                          className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                            isCategorySelected 
                              ? 'bg-brand-tactical text-zinc-950' 
                              : 'border border-theme-border text-theme-muted hover:text-white'
                          }`}
                        >
                          {isCategorySelected ? 'CATEGORIA SELECIONADA' : 'SELECIONAR CATEGORIA'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-5">
                        {items.map(item => {
                          const isSelected = formData.targetServices.includes(item.id);
                          const toggleService = () => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                targetServices: formData.targetServices.filter(id => id !== item.id),
                                targetCategories: formData.targetCategories.filter(c => c !== category) // Desmarca a categoria se desmarcar um item
                              });
                            } else {
                              const newServices = [...formData.targetServices, item.id];
                              const allInCategorySelected = items.every(i => i.id === item.id || formData.targetServices.includes(i.id));
                              setFormData({
                                ...formData,
                                targetServices: newServices,
                                targetCategories: allInCategorySelected 
                                  ? [...formData.targetCategories, category] 
                                  : formData.targetCategories
                              });
                            }
                          };

                          return (
                            <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={toggleService}
                                className="hidden"
                              />
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-brand-tactical border-brand-tactical shadow-lg shadow-brand-tactical/20' : 'border-theme-border bg-theme-bg group-hover:border-theme-muted'
                              }`}>
                                {isSelected && <ArrowRight size={10} className="text-zinc-950" />}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider transition-all ${isSelected ? 'text-white' : 'text-theme-subtle group-hover:text-theme-muted'}`}>
                                {item.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                type="submit"
                onClick={handleCreate}
                className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
              >
                Ativar Campanha
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
