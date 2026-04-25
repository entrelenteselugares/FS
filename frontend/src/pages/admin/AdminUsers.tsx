import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { X, UserPlus, Shield, Trash2, Edit3 } from "lucide-react";
import { T, BtnPrimary } from "../../lib/theme";

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
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

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

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

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
      
      // Update professional details if applicable
      if (formData.role === "PROFISSIONAL") {
          const userId = editingUser ? editingUser.id : (await API.get("/admin/users")).data.find((u: User) => u.email === formData.email)?.id;
          if (userId) {
              await API.patch(`/admin/users/${userId}`, {
                otherHabilities: formData.otherHabilities,
                equipment: formData.equipment
              });
          }
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "" });
      fetchUsers();
      showNotification(editingUser ? "Membro atualizado com sucesso!" : "Membro convocado com sucesso!");
    } catch {
      showNotification("Erro ao processar usuário", 'error');
    }
  };

  const handleEditOpen = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.nome,
      email: user.email,
      password: "", 
      role: user.role,
      pixKey: user.pixKey || "",
      otherHabilities: user.profissional?.otherHabilities || "",
      equipment: user.profissional?.equipment || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      setConfirmDelete(null);
      showNotification("Membro removido da base de dados.");
    } catch {
      showNotification("Erro ao remover membro", 'error');
    }
  };

  return (
    <>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-theme-border pb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Gestão de Membros</h2>
            <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-black italic">Operação de Times, Unidades e Parceiros</p>
          </div>
          <button 
            onClick={() => { setIsModalOpen(true); setEditingUser(null); setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "" }); }}
            style={{ 
              background: T.brand, color: T.brandText, padding: "14px 28px", 
              fontSize: 10, fontWeight: 900, textTransform: "uppercase", 
              letterSpacing: "0.2em", cursor: "pointer", border: "none",
              boxShadow: `0 0 20px ${T.brand}22`,
              display: "flex", alignItems: "center", gap: 10
            }}
          >
            <UserPlus size={14} /> CONVOCAR MEMBRO
          </button>
        </div>

        <div className="space-y-2">
          <div style={{ background: T.bgField, borderBottom: `1px solid ${T.border}` }} className="grid grid-cols-12 gap-4 px-10 py-4 text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Membro / Identidade</div>
            <div className="col-span-2">Nível de Acesso</div>
            <div className="col-span-2 text-right">Vinculação</div>
            <div className="col-span-3 text-right">Ações de Comando</div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse font-black">Sincronizando Base de Dados...</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest font-black">Nenhum membro registrado.</div>
          ) : (
            users.map(u => (
              <div key={u.id} style={{ background: T.bgCard, border: `1px solid ${T.border}` }} className="hover:border-brand-tactical/30 transition-all group">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-10 py-6">
                  <div className="col-span-1">
                    <div style={{ 
                      width: 8, height: 8, borderRadius: "50%", 
                      background: u.active ? T.brand : "#f87171",
                      boxShadow: `0 0 10px ${u.active ? T.brand : "#f87171"}44` 
                    }} />
                  </div>
                  <div className="col-span-4">
                    <div style={{ fontSize: 14, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.5 }}>{u.nome}</div>
                    <div style={{ fontSize: 10, color: T.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }} className="mt-1 opacity-80">{u.email}</div>
                  </div>
                  <div className="col-span-2">
                    <span style={{ 
                      fontSize: 8, fontWeight: 900, color: u.role === 'ADMIN' ? T.brand : T.text2, 
                      border: `1px solid ${u.role === 'ADMIN' ? T.brand : T.border}`, 
                      padding: "2px 6px", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4
                    }}>
                      {u.role === 'ADMIN' && <Shield size={8} />} {u.role}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div style={{ fontSize: 10, color: T.text3, fontWeight: 700, textTransform: "uppercase" }}>
                      {u.unidade?.razaoSocial || "DIRETO MATRIZ"}
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-end gap-6 opacity-30 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleEditOpen(u)}
                      style={{ background: "transparent", border: "none", color: T.text3, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Edit3 size={11} /> Ajustar
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(u)} 
                      style={{ background: "transparent", border: "none", color: "#f87171", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Trash2 size={11} /> Banir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0" style={{ background: T.overlay, backdropFilter: "blur(4px)" }} onClick={() => setIsModalOpen(false)} />
           <div className="relative border border-brand-tactical/30 w-full max-w-xl p-10 space-y-10 overflow-y-auto max-h-[90vh]" style={{ background: T.bgCard }}>
              <div className="flex justify-between items-start">
                 <div className="space-y-2">
                    <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Cadastro Operacional</span>
                    <h3 className="text-2xl font-heading uppercase tracking-tighter" style={{ color: T.text }}>{editingUser ? 'Ajustar Membro' : 'Novo Membro'}</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Nome de Guerra</label>
                       <input 
                         required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                         style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                       />
                    </div>
                    <div className="space-y-2">
                       <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>E-mail de Acesso</label>
                       <input 
                         required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                         style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                       />
                    </div>
                    <div className="space-y-2">
                       <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Nova Senha {editingUser && '(Opcional)'}</label>
                       <input 
                         type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                         style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                         required={!editingUser}
                       />
                    </div>
                    <div className="space-y-2">
                       <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Função Tática</label>
                       <select 
                         value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                         style={{ background: T.bgField, border: `1px solid ${T.border}`, padding: "12px", fontSize: 11, color: T.text, width: "100%", outline: "none", textTransform: "uppercase", fontWeight: 700 }}
                       >
                          <option value="ADMIN">ADMINISTRADOR</option>
                          <option value="PROFISSIONAL">PROFISSIONAL / PARCEIRO</option>
                          <option value="UNIDADE_FIXA">UNIDADE FIXA / CARTÓRIO</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Chave PIX (Para Repasses)</label>
                    <input 
                      value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})}
                      style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                      placeholder="CPF, E-mail ou Aleatória"
                    />
                 </div>

                 {formData.role === "PROFISSIONAL" && (
                   <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="space-y-2">
                         <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Equipamento Operacional</label>
                         <textarea 
                           value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})}
                           style={{ background: T.bgField, border: `1px solid ${T.border}`, padding: "12px", fontSize: 12, color: T.text, width: "100%", outline: "none", height: 80 }}
                           placeholder="Câmeras, Lentes, Drones..."
                         />
                      </div>
                      <div className="space-y-2">
                         <label style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>Outras Habilidades</label>
                         <input 
                           value={formData.otherHabilities} onChange={e => setFormData({...formData, otherHabilities: e.target.value})}
                           style={{ background: "transparent", borderBottom: `1px solid ${T.border}`, padding: "12px 0", fontSize: 14, color: T.text, width: "100%", outline: "none" }}
                         />
                      </div>
                   </div>
                 )}

                 <div className="pt-6">
                    <button type="submit" style={{ ...BtnPrimary, width: "100%", justifyContent: "center", padding: 20 }}>
                       {editingUser ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CONVOCAÇÃO'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0" style={{ background: T.overlay, backdropFilter: "blur(4px)" }} onClick={() => setConfirmDelete(null)} />
           <div className="relative border border-red-900/30 w-full max-w-sm p-8 space-y-8" style={{ background: T.bgCard }}>
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Protocolo de Exclusão</span>
                 <h3 className="text-xl font-heading uppercase tracking-tighter" style={{ color: T.text }}>Banir Membro?</h3>
              </div>
              
              <p className="text-[11px] uppercase tracking-widest leading-relaxed" style={{ color: T.text3 }}>
                ESTA AÇÃO IRÁ REVOGAR O ACESSO DE <span style={{ color: T.text, fontWeight: "bold" }}>{confirmDelete.nome}</span> IMEDIATAMENTE.
              </p>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setConfirmDelete(null)}
                   className="p-4 border border-zinc-800 text-zinc-500 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                 >
                   CANCELAR
                 </button>
                 <button 
                   onClick={() => handleDelete(confirmDelete.id)}
                   className="p-4 bg-red-900 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                 >
                   CONFIRMAR BANIMENTO
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[130] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[300px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Comando Executado' : 'Falha na Operação'}
                 </span>
                 <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </>
  );
};
