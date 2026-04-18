import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  active: boolean;
  profissional?: {
    captPct: number;
    editPct: number;
  };
  cartorio?: {
    razaoSocial: string;
  };
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "PROFISSIONAL"
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
      await API.post("/admin/users", formData);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert("Erro ao criar usuário");
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await API.patch(`/admin/users/${user.id}`, { active: !user.active });
      setUsers(users.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    } catch {
      alert("Erro ao alterar status");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-serif text-white italic tracking-tight">Rede de Membros</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] mt-2 font-bold">Diretório de Profissionais e Unidades</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] px-8 py-4 hover:bg-zinc-200 transition-all"
        >
          Convidar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest animate-pulse bg-black">Sincronizando Rede...</div>
        ) : users.map(user => (
          <div key={user.id} className="bg-black p-10 flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-[0.3em] px-3 py-1 border mb-4 inline-block ${
                  user.role === "ADMIN" ? "border-brand-olive text-brand-olive" : "border-zinc-800 text-zinc-600"
                }`}>
                  {user.role}
                </span>
                <h3 className="text-2xl font-serif text-white italic">{user.nome}</h3>
                <p className="text-[10px] text-zinc-700 font-mono mt-1">{user.email}</p>
              </div>
              <button 
                onClick={() => toggleActive(user)}
                className={`p-2 transition-all ${user.active ? "text-brand-olive" : "text-zinc-800"}`}
              >
                <div className={`w-10 h-1 ${user.active ? "bg-brand-olive" : "bg-zinc-900"}`} />
              </button>
            </div>

            {user.role === "PROFISSIONAL" && user.profissional && (
               <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.3em] mb-2 block">Cota Captação</label>
                    <div className="text-lg text-white font-serif">{user.profissional.captPct}%</div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.3em] mb-2 block">Cota Edição</label>
                    <div className="text-lg text-white font-serif">{user.profissional.editPct}%</div>
                  </div>
               </div>
            )}

            <div className="flex justify-end gap-6 mt-4">
              <button className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white transition-all underline underline-offset-8">Ajustar Perfil</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-[#080808] border border-white/5 p-12 animate-in zoom-in-95 duration-300">
             <div className="mb-12">
               <h2 className="text-4xl font-serif text-white italic mb-2">Novo Membro</h2>
               <div className="w-12 h-1 bg-brand-olive" />
             </div>

             <form onSubmit={handleCreate} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Nome Completo</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">E-mail Corporativo</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Senha Inicial</label>
                    <input 
                      type="password" required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Nível de Acesso</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-black border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive appearance-none"
                    >
                      <option value="PROFISSIONAL">PROFISSIONAL</option>
                      <option value="CARTORIO">CARTÓRIO / UNIDADE</option>
                      <option value="ADMIN">ADMINISTRADOR</option>
                    </select>
                  </div>
                </div>

                <div className="pt-10 flex gap-4">
                  <button type="submit" className="flex-1 bg-white text-black font-bold uppercase tracking-[0.3em] py-5 text-[11px] hover:bg-zinc-200 transition-all">
                    Registrar
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 border border-white/5 text-zinc-600 hover:text-white transition-all">
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
