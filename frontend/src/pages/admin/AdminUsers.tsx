import React, { useState, useEffect, useMemo } from "react";
import { API } from "../../lib/api";
import { X, UserPlus, Shield, Trash2, Edit3, Search, CheckCircle2 } from "lucide-react";

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
      workflowType?: string[];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "",
    otherHabilities: "", equipment: "", workflowType: ["TRADICIONAL"] as string[],
    captPct: 30, editPct: 10
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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterRole === "ALL" || u.role === filterRole;
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterRole]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleStyle = (role: string) => {
    switch(role) {
      case 'ADMIN': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500' };
      case 'PROFISSIONAL': return { bg: 'bg-brand-tactical/10', border: 'border-brand-tactical/30', text: 'text-brand-tactical' };
      case 'CARTORIO': 
      case 'UNIDADE_FIXA': return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
      default: return { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-500' };
    }
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
      
      if (formData.role === "PROFISSIONAL") {
          const userId = editingUser ? editingUser.id : (await API.get("/admin/users")).data.find((u: User) => u.email === formData.email)?.id;
          if (userId) {
              await API.patch(`/admin/users/${userId}`, {
                otherHabilities: formData.otherHabilities,
                equipment: formData.equipment,
                captPct: Number(formData.captPct),
                editPct: Number(formData.editPct),
                workflowType: formData.workflowType
              });
          }
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "", workflowType: ["TRADICIONAL"], captPct: 30, editPct: 10 });
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
      equipment: user.profissional?.equipment || "",
      workflowType: user.profissional?.workflowType || ["TRADICIONAL"],
      captPct: user.profissional?.captPct || 30,
      editPct: user.profissional?.editPct || 10
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
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-theme-border pb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Gestão de Membros</h2>
            <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Operação de Times, Unidades e Parceiros</p>
          </div>
          <button 
            onClick={() => { setIsModalOpen(true); setEditingUser(null); setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "", workflowType: ["TRADICIONAL"], captPct: 30, editPct: 10 }); }}
            className="font-black uppercase tracking-[0.3em] px-8 py-4 bg-brand-tactical text-zinc-950 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 flex items-center gap-3 text-[10px]"
          >
            <UserPlus size={14} /> CONVOCAR MEMBRO
          </button>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col md:flex-row gap-6 items-center">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={16} />
              <input 
                type="text"
                placeholder="PROCURAR MEMBRO POR NOME OU E-MAIL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-4 pl-12 text-[11px] font-bold text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all"
              />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {['ALL', 'ADMIN', 'PROFISSIONAL', 'CARTORIO'].map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-4 py-4 text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterRole === r ? 'bg-zinc-800 border-zinc-700 text-white shadow-lg' : 'bg-transparent border-theme-border text-theme-muted hover:border-zinc-700'}`}
                >
                  {r === 'ALL' ? 'Todos' : r === 'CARTORIO' ? 'Unidades' : r}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-3">
          {/* HEADER TABLE */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[8px] md:text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] border-b border-theme-border/30 bg-zinc-900/20">
            <div className="col-span-1">Status</div>
            <div className="col-span-5">Membro / Identidade</div>
            <div className="col-span-2">Nível de Acesso</div>
            <div className="col-span-2 text-right">Vinculação</div>
            <div className="col-span-2 text-right">Comandos</div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse font-black">Sincronizando Base de Dados...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest font-black border border-dashed border-theme-border">Nenhum membro encontrado.</div>
          ) : (
            filteredUsers.map(u => {
              const styles = getRoleStyle(u.role);
              return (
                <div key={u.id} className="bg-theme-bg-muted border border-theme-border hover:border-brand-tactical/30 transition-all group shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-4 md:px-5 py-2.5">
                    <div className="col-span-1 flex items-center justify-center md:justify-start">
                      <div className={`w-2.5 h-2.5 rounded-full ${u.active ? 'bg-brand-tactical shadow-[0_0_10px_rgba(133,185,172,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'} ${u.active ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="col-span-5 flex items-center gap-5">
                      <div className="w-10 h-10 bg-zinc-800 border border-theme-border flex items-center justify-center text-[12px] font-black text-theme-text tracking-tighter">
                        {getInitials(u.nome)}
                      </div>
                      <div>
                        <div className="text-[13px] font-black text-theme-text uppercase tracking-tight leading-none">{u.nome}</div>
                        <div className="text-[10px] text-theme-muted font-bold uppercase mt-1.5 opacity-60 tracking-wider flex items-center gap-2">
                          {u.email}
                          {u.role === 'PROFISSIONAL' && u.profissional?.workflowType && u.profissional.workflowType.map(wt => (
                            <span key={wt} className={`px-1.5 py-0.5 rounded-sm text-[7px] font-black tracking-tighter ${wt === 'MOBILE' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-blue-500/20 text-blue-500 border border-blue-500/20'}`}>
                              {wt === 'MOBILE' ? 'MOBILE MAKER' : 'CAMERA/PC'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-3 py-1.5 border ${styles.bg} ${styles.border} ${styles.text} text-[8px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2`}>
                        {u.role === 'ADMIN' && <Shield size={8} />} {u.role === 'UNIDADE_FIXA' ? 'CARTÓRIO' : u.role}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-[10px] text-theme-text font-black uppercase tracking-tight opacity-80">
                        {u.unidade?.razaoSocial || "DIRETO MATRIZ"}
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-5">
                      <button 
                        onClick={() => handleEditOpen(u)}
                        className="text-theme-muted hover:text-white transition-colors p-2 hover:bg-zinc-800"
                        title="AJUSTAR"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(u)} 
                        className="text-red-500/40 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10"
                        title="BANIR"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
           <div className="relative border border-theme-border w-full max-w-xl p-6 md:p-8 space-y-8 md:space-y-10 overflow-y-auto max-h-[90vh] shadow-2xl bg-theme-bg animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start">
                 <div className="space-y-2">
                    <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em]">Protocolo Operacional</span>
                    <h3 className="text-2xl font-heading uppercase tracking-tighter text-theme-text">{editingUser ? 'Ajustar Membro' : 'Novo Membro'}</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-brand-tactical transition-colors p-2"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Nome de Guerra</label>
                       <input 
                         required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[13px] text-theme-text outline-none focus:border-brand-tactical font-black transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">E-mail de Acesso</label>
                       <input 
                         required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[13px] text-theme-text outline-none focus:border-brand-tactical font-black transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Nova Senha {editingUser && '(Opcional)'}</label>
                       <input 
                         type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                         className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[13px] text-theme-text outline-none focus:border-brand-tactical font-black transition-all"
                         required={!editingUser}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Função Tática</label>
                       <select 
                         value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                         className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[11px] text-theme-text outline-none focus:border-brand-tactical font-black cursor-pointer appearance-none uppercase tracking-widest"
                       >
                          <option value="ADMIN">ADMINISTRADOR</option>
                          <option value="PROFISSIONAL">PROFISSIONAL / PARCEIRO</option>
                          <option value="UNIDADE_FIXA">UNIDADE FIXA / CARTÓRIO</option>
                          <option value="CLIENTE">CLIENTE</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Chave PIX (Financeiro)</label>
                    <input 
                      value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})}
                      className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[13px] text-theme-text outline-none focus:border-brand-tactical font-black transition-all italic"
                      placeholder="CPF, E-mail ou Aleatória"
                    />
                 </div>

                 {formData.role === "PROFISSIONAL" && (
                   <div className="space-y-10 pt-10 border-t border-theme-border/30">
                      <div className="grid grid-cols-2 gap-10">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">% Captação</label>
                            <div className="relative">
                               <input 
                                 type="number" value={formData.captPct} onChange={e => setFormData({...formData, captPct: Number(e.target.value)})}
                                 className="w-full bg-theme-bg-muted border border-theme-border p-4 text-lg text-brand-tactical outline-none font-black"
                               />
                               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-theme-muted opacity-40">%</span>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">% Edição</label>
                            <div className="relative">
                               <input 
                                 type="number" value={formData.editPct} onChange={e => setFormData({...formData, editPct: Number(e.target.value)})}
                                 className="w-full bg-theme-bg-muted border border-theme-border p-4 text-lg text-brand-tactical outline-none font-black"
                               />
                               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-theme-muted opacity-40">%</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Equipamento Operacional</label>
                         <textarea 
                           value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})}
                           className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[12px] text-theme-text outline-none focus:border-brand-tactical h-24 font-bold resize-none"
                           placeholder="Câmeras, Lentes, Drones..."
                         />
                      </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Perfil de Entrega</label>
                          <div className="grid grid-cols-2 gap-4">
                             {['TRADICIONAL', 'MOBILE'].map(t => (
                               <button 
                                 key={t}
                                 type="button"
                                 onClick={() => {
                                   const current = formData.workflowType;
                                   const exists = current.includes(t);
                                   const next = exists ? current.filter(id => id !== t) : [...current, t];
                                   if (next.length > 0) setFormData({...formData, workflowType: next});
                                 }}
                                 className={`p-3 text-[9px] font-black uppercase tracking-widest border transition-all relative ${formData.workflowType.includes(t) ? 'bg-brand-tactical text-zinc-950 border-brand-tactical' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-brand-tactical/30'}`}
                               >
                                 {formData.workflowType.includes(t) && (
                                   <div className="absolute top-1 right-1">
                                      <CheckCircle2 size={8} />
                                   </div>
                                 )}
                                 {t === 'TRADICIONAL' ? 'Câmera/PC' : 'Mobile Maker'}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 <div className="pt-6">
                    <button type="submit" className="w-full bg-brand-tactical text-zinc-950 font-black uppercase tracking-[0.5em] py-5 text-[11px] shadow-lg shadow-brand-tactical/10 hover:brightness-110 transition-all">
                       {editingUser ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CONVOCAÇÃO'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setConfirmDelete(null)} />
           <div className="relative border border-red-900/30 w-full max-w-sm p-10 space-y-10 shadow-2xl bg-theme-bg animate-in zoom-in-95 duration-500">
              <div className="space-y-3">
                 <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em]">Protocolo de Exclusão</span>
                 <h3 className="text-2xl font-heading uppercase tracking-tighter text-theme-text">Banir Membro?</h3>
              </div>
              
              <p className="text-[11px] uppercase tracking-widest leading-relaxed text-theme-muted">
                ESTA AÇÃO IRÁ REVOGAR O ACESSO DE <span className="text-white font-black">{confirmDelete.nome}</span> IMEDIATAMENTE.
              </p>

              <div className="grid grid-cols-2 gap-6">
                 <button 
                   onClick={() => setConfirmDelete(null)}
                   className="p-4 border border-theme-border text-theme-muted text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                 >
                   CANCELAR
                 </button>
                 <button 
                   onClick={() => handleDelete(confirmDelete.id)}
                   className="p-4 bg-red-900 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-900/20"
                 >
                   BANIR
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[130] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[320px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Comando Executado' : 'Falha na Operação'}
                 </span>
                 <p className="text-[12px] font-bold text-white uppercase tracking-widest mt-1">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </>
  );
};
