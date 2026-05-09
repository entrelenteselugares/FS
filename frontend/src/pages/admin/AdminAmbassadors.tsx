import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { Users, Plus, TrendingUp, MousePointer2, Award, Search, X } from "lucide-react";

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
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    ownerId: "",
    rewardType: "CREDIT",
    rewardValue: 10
  });

  const [users, setUsers] = useState<{id: string, nome: string}[]>([]);

  useEffect(() => {
    fetchCampaigns();
    API.get("/admin/users").then(r => setUsers(r.data)).catch(() => {});
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
    } catch (err) {
      alert("Erro ao criar campanha.");
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
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-0.5 w-8 bg-brand-tactical" />
            <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Engine de Escala</p>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">Programa Embaixador</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white transition-all italic shadow-2xl"
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Campanhas", value: campaigns.length, icon: <Users size={16} /> },
          { label: "Cliques Globais", value: campaigns.reduce((acc, c) => acc + c._count.visits, 0), icon: <MousePointer2 size={16} /> },
          { label: "Conversões", value: campaigns.reduce((acc, c) => acc + c._count.conversions, 0), icon: <TrendingUp size={16} /> },
          { label: "Total Recompensas", value: `R$ ${campaigns.reduce((acc, c) => acc + (c._count.conversions * c.rewardValue), 0).toFixed(2)}`, icon: <Award size={16} /> },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 space-y-2">
            <div className="flex items-center gap-2 text-zinc-500">
              {s.icon}
              <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
            </div>
            <p className="text-3xl font-black italic tracking-tighter text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nome, slug ou embaixador..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-white/5 pl-12 pr-4 py-4 text-sm focus:border-brand-tactical/50 transition-all outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/30 border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
              <th className="p-6">Campanha / Slug</th>
              <th className="p-6">Embaixador</th>
              <th className="p-6">Recompensa</th>
              <th className="p-6 text-center">Cliques</th>
              <th className="p-6 text-center">Conversões</th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white uppercase italic">{c.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">/embaixador/{c.slug}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">{c.owner.nome}</span>
                    <span className="text-[10px] text-zinc-600">{c.owner.email}</span>
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-xs font-black text-brand-tactical italic">
                    R$ {Number(c.rewardValue).toFixed(2)} ({c.rewardType})
                  </span>
                </td>
                <td className="p-6 text-center">
                  <span className="text-sm font-black text-zinc-400">{c._count.visits}</span>
                </td>
                <td className="p-6 text-center">
                  <span className="text-sm font-black text-emerald-500">{c._count.conversions}</span>
                </td>
                <td className="p-6">
                  <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest ${c.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {c.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic uppercase text-white">Nova Campanha</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Nome da Campanha</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-800 border border-white/5 p-4 text-sm outline-none focus:border-brand-tactical/50"
                  placeholder="Ex: Verão 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Slug URL</label>
                <input 
                  type="text" required
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-')})}
                  className="w-full bg-zinc-800 border border-white/5 p-4 text-sm font-mono outline-none focus:border-brand-tactical/50"
                  placeholder="verao-26"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Embaixador Responsável</label>
                <select 
                  required
                  value={formData.ownerId}
                  onChange={e => setFormData({...formData, ownerId: e.target.value})}
                  className="w-full bg-zinc-800 border border-white/5 p-4 text-sm outline-none focus:border-brand-tactical/50"
                >
                  <option value="">Selecione um usuário...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tipo de Recompensa</label>
                  <select 
                    value={formData.rewardType}
                    onChange={e => setFormData({...formData, rewardType: e.target.value})}
                    className="w-full bg-zinc-800 border border-white/5 p-4 text-sm outline-none focus:border-brand-tactical/50"
                  >
                    <option value="CREDIT">Crédito (Loja)</option>
                    <option value="CASH">Dinheiro (PIX)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Valor (R$)</label>
                  <input 
                    type="number" required
                    value={formData.rewardValue}
                    onChange={e => setFormData({...formData, rewardValue: Number(e.target.value)})}
                    className="w-full bg-zinc-800 border border-white/5 p-4 text-sm outline-none focus:border-brand-tactical/50"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all italic"
              >
                Ativar Campanha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
