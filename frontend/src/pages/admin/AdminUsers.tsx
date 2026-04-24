import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { X } from "lucide-react";
import { T } from "../../lib/theme";

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  active: boolean;
  profissional?: {
    captPct: number;
    editPct: number;
    otherHabilities?: string;
    equipment?: string;
  };
  unidade?: {
    razaoSocial: string;
  };
  pixKey?: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "",
    otherHabilities: "", equipment: ""
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/users");
      setUsers(data || []);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await API.patch(`/admin/users/${editingUser.id}`, {
          nome: formData.name,
          email: formData.email,
          role: formData.role,
          pixKey: formData.pixKey,
          ...(formData.password ? { senha: formData.password } : {})
        });
      } else {
        await API.post("/admin/users", formData);
      }
      if (editingUser?.role === "PROFISSIONAL") {
        await API.patch(`/admin/users/${editingUser.id}`, {
          otherHabilities: formData.otherHabilities,
          equipment: formData.equipment
        });
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "" });
      fetchUsers();
    } catch {
      alert("Erro ao processar usuário");
    }
  };

  const handleEditOpen = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.nome,
      email: user.email,
      password: "", // Não carregar senha
      role: user.role,
      pixKey: user.pixKey || "",
      otherHabilities: user.profissional?.otherHabilities || "",
      equipment: user.profissional?.equipment || ""
    });
    setIsModalOpen(true);
  };

  const toggleActive = async (user: User) => {
    try {
      await API.patch(`/admin/users/${user.id}`, { active: !user.active });
      setUsers(users.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    } catch {
      alert("Erro ao alterar status");
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Deseja realmente remover ${user.nome}? Esta ação removerá o acesso e o perfil do sistema.`)) return;
    try {
      await API.delete(`/admin/users/${user.id}`);
      setUsers(users.filter(u => u.id !== user.id));
    } catch {
      alert("Erro ao excluir usuário. Certifique-se de que ele não possui eventos vinculados.");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-theme-text tracking-tighter uppercase">Rede de Membros</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold italic">Diretório de Profissionais e Unidades Fixas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: T.brand, color: T.brandText, padding: "12px 24px", 
            border: "none", fontSize: 10, fontWeight: 900, 
            textTransform: "uppercase", letterSpacing: 3, cursor: "pointer" 
          }}
        >
          CONVOCAR MEMBRO
        </button>
      </div>

      <div className="space-y-2">
        {/* List Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-4 text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em] border-b border-theme-border bg-theme-bg/10">
          <div className="col-span-2">Perfil</div>
          <div className="col-span-4">Identificação / E-mail</div>
          <div className="col-span-3">Chave PIX</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse border border-theme-border bg-theme-bg-muted">Sincronizando Rede...</div>
        ) : users.map(user => (
          <div key={user.id} className="bg-theme-bg-muted hover:bg-theme-bg/5 border border-theme-border transition-all group">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 md:px-10 py-6">
              {/* Perfil */}
              <div className="col-span-2 flex items-center gap-4">
              </div>

              {/* Identificação */}
              <div className="col-span-4">
                <div className="text-sm font-bold text-theme-text uppercase tracking-tighter truncate">{user.nome}</div>
                <div className="text-[10px] text-theme-muted font-bold uppercase tracking-wider truncate mt-0.5 opacity-60">{user.email}</div>
              </div>

              {/* Financeiro / PIX */}
              <div className="col-span-3">
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest truncate">
                  {user.pixKey ? <span className="text-zinc-500 break-all">{user.pixKey}</span> : <span className="opacity-30 italic">Pendente</span>}
                </div>
                {user.role === "PROFISSIONAL" && user.profissional && (
                  <div className="flex gap-4 mt-1 opacity-40">
                    <span className="text-[8px] font-bold text-zinc-700 uppercase italic">CP: {user.profissional.captPct}%</span>
                    <span className="text-[8px] font-bold text-zinc-700 uppercase italic">ED: {user.profissional.editPct}%</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <button 
                  onClick={() => toggleActive(user)}
                  className={`transition-all hover:scale-110 ${user.active ? "text-brand-tactical" : "text-zinc-800"}`}
                >
                  <div className={`w-8 h-1 ${user.active ? "bg-brand-tactical shadow-[0_0_10px_rgba(133,185,172,0.4)]" : "bg-zinc-900"}`} />
                </button>
              </div>

              {/* Ações */}
              <div className="col-span-2 flex justify-end gap-2">
                <button 
                  onClick={() => handleEditOpen(user)}
                  style={{ 
                    background: "transparent", border: `1px solid ${T.border}`, 
                    padding: "6px 12px", color: T.text2, fontSize: 8, 
                    fontWeight: 900, textTransform: "uppercase", letterSpacing: 1,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}
                >
                   Editar
                </button>
                <button 
                  onClick={() => handleDelete(user)}
                  style={{ 
                    background: "transparent", border: `1px solid #451a1a`, 
                    padding: "6px 12px", color: "#f87171", fontSize: 8, 
                    fontWeight: 900, textTransform: "uppercase", letterSpacing: 1,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#451a1a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                   Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div 
            className="w-full max-w-2xl bg-theme-bg border border-theme-border relative max-h-[90vh] overflow-y-auto lux-card p-6 md:p-12"
          >
            <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="absolute top-6 right-6 text-theme-muted hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="mb-10">
              <div className="text-proportional text-brand-primary mb-4">Ajuste de Perfil</div>
              <h2 className="text-2xl md:text-4xl font-heading text-white uppercase tracking-tighter leading-none">
                {editingUser ? "Ajustar Membro" : "Novo Membro"}
              </h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-proportional">Nome Completo</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em]">E-mail Corporativo</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em]">Chave PIX (CPF, E-mail, Celular ou Aleatória)</label>
                  <input 
                    value={formData.pixKey}
                    onChange={e => setFormData({...formData, pixKey: e.target.value})}
                    placeholder="DADOS PARA REPASSE"
                    className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none placeholder:opacity-20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em]">
                      {editingUser ? "Nova Senha (opcional)" : "Senha Inicial"}
                    </label>
                    <input 
                      type="password" required={!editingUser}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                    />
                  </div>
                </div>
              </div>

              {formData.role === "PROFISSIONAL" && (
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em]">Habilidades Extras</label>
                      <textarea 
                        value={formData.otherHabilities}
                        onChange={e => setFormData({...formData, otherHabilities: e.target.value})}
                        className="w-full bg-transparent border-b border-theme-border py-2 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em]">Meus Equipamentos</label>
                      <textarea 
                        value={formData.equipment}
                        onChange={e => setFormData({...formData, equipment: e.target.value})}
                        className="w-full bg-transparent border-b border-theme-border py-2 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-10 flex gap-4">
                  <button 
                    type="submit" 
                    className="flex-1 font-black uppercase tracking-[0.4em] py-6 text-[11px] hover:brightness-110 transition-all rounded-none"
                    style={{ backgroundColor: 'var(--brand-tactical)', color: 'var(--theme-text-on-brand)' }}
                  >
                    {editingUser ? "SALVAR ALTERAÇÕES" : "REGISTRAR"}
                  </button>
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingUser(null); setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "" }); }} className="px-8 border border-theme-border text-theme-muted hover:text-theme-text transition-all rounded-none uppercase text-[10px] font-black tracking-widest">
                    CANCELAR
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};
