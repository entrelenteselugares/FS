import React, { useState, useEffect, useMemo } from "react";
import { API } from "../../lib/api";
import { X, UserPlus, Shield, Trash2, Edit3, Search, CheckCircle2, ArrowRight } from "lucide-react";

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  active: boolean;
  isVerified: boolean;
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
    franchiseProfile?: {
      id: string;
      printCredits: number;
      active: boolean;
    };
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
    captPct: 30, editPct: 10,
    isFranchise: false, printCredits: 0,
    isVerified: false
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
          isFranchise: formData.isFranchise,
          printCredits: formData.printCredits,
          isVerified: formData.isVerified,
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
      setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "", workflowType: ["TRADICIONAL"], captPct: 30, editPct: 10, isFranchise: false, printCredits: 0, isVerified: false });
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
      editPct: user.profissional?.editPct || 10,
      isFranchise: !!user.franchiseProfile,
      printCredits: user.franchiseProfile?.printCredits || 0,
      isVerified: user.isVerified
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
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none whitespace-nowrap">
              Gestão de <span className="text-brand-tactical">Membros</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
                Operação de Times, Unidades e Parceiros
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button 
              onClick={() => { setIsModalOpen(true); setEditingUser(null); setFormData({ name: "", email: "", password: "", role: "PROFISSIONAL", pixKey: "", otherHabilities: "", equipment: "", workflowType: ["TRADICIONAL"], captPct: 30, editPct: 10, isFranchise: false, printCredits: 0, isVerified: false }); }}
              className="fs-btn bg-brand-tactical text-zinc-950 italic flex-1 md:flex-none whitespace-nowrap"
            >
              <UserPlus size={14} className="inline mr-2" /> CONVOCAR MEMBRO
            </button>
          </div>
        </div>
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
                className="fs-input uppercase tracking-widest"
                style={{ paddingLeft: '3rem' }}
              />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {[
                { value: 'ALL', label: 'Todos' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'PROFISSIONAL', label: 'Profissional' },
                { value: 'CLIENTE', label: 'Cliente' },
                { value: 'CARTORIO', label: 'Unidades' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterRole(value)}
                  className={`fs-btn border transition-all whitespace-nowrap ${filterRole === value ? 'bg-theme-border border-zinc-700 text-theme-text shadow-lg' : 'bg-transparent border-theme-border text-theme-muted hover:border-zinc-700'}`}
                >
                  {label}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-3">
          {/* HEADER TABLE */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[8px] md:text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] border-b border-theme-border/30 bg-zinc-900/20">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Membro / Identidade</div>
            <div className="col-span-3">Nível de Acesso</div>
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
                    <div className="col-span-4 flex items-center gap-5">
                      <div className="w-10 h-10 bg-theme-border border border-theme-border flex items-center justify-center text-[12px] font-black text-theme-text tracking-tighter">
                        {getInitials(u.nome)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-black text-theme-text uppercase tracking-tight leading-none truncate">{u.nome}</div>
                        <div className="text-[10px] text-theme-muted font-bold uppercase mt-1.5 opacity-60 tracking-wider flex items-center gap-2 truncate">
                          {u.email}
                          {u.role === 'PROFISSIONAL' && u.profissional?.workflowType && u.profissional.workflowType.map(wt => (
                            <span key={wt} className={`px-1.5 py-0.5 rounded-sm text-[7px] font-black tracking-tighter ${wt === 'MOBILE' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-blue-500/20 text-blue-500 border border-blue-500/20'}`}>
                              {wt === 'MOBILE' ? 'MOBILE' : 'PC'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 flex flex-wrap gap-2">
                      <span className={`px-3 py-1.5 border ${styles.bg} ${styles.border} ${styles.text} text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 italic`}>
                        {u.role === 'ADMIN' && <Shield size={8} />} {u.role === 'CARTORIO' ? 'CARTÓRIO' : u.role}
                      </span>
                      {u.isVerified && (
                        <span className="px-2 py-1 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={8} /> PRO
                        </span>
                      )}
                      {u.franchiseProfile && (
                        <span className="px-2 py-1 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[7px] font-black uppercase tracking-widest italic">
                          FRANQUIA: {u.franchiseProfile.printCredits} CR
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-[10px] text-theme-text font-black uppercase tracking-tight opacity-80">
                        {u.unidade?.razaoSocial || "DIRETO MATRIZ"}
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-5">
                      <button 
                        onClick={() => handleEditOpen(u)}
                        className="text-theme-muted hover:text-white transition-colors p-2 hover:bg-theme-border"
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
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <UserPlus className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">{editingUser ? 'Ajustar Membro' : 'Novo Membro'}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Protocolo Operacional de Inteligência</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar bg-theme-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Identidade de Acesso</label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Nome de Guerra</label>
                        <input required className="fs-input font-black uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="EX: JOHN DOE" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">E-mail Corporativo</label>
                        <input required type="email" className="fs-input font-black lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Segurança & Função</label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Nova Senha {editingUser && '(Opcional)'}</label>
                        <input type="password" className="fs-input font-black" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" required={!editingUser} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Nível de Acesso</label>
                        <select className="fs-input font-black uppercase appearance-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                          <option value="ADMIN">ADMINISTRADOR</option>
                          <option value="PROFISSIONAL">PROFISSIONAL / PARCEIRO</option>
                          <option value="CARTORIO">UNIDADE FIXA / CARTÓRIO</option>
                          <option value="CLIENTE">CLIENTE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Chave PIX (Para Liquidações Financeiras)</label>
                <input className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:opacity-20 italic" value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="CPF, E-MAIL OU CHAVE ALEATÓRIA" />
              </div>

              {formData.role === "PROFISSIONAL" && (
                <div className="pt-10 border-t border-theme-border/60 space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">% Comissão Captação</label>
                      <div className="relative">
                        <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-xl font-black text-brand-tactical outline-none focus:border-brand-tactical rounded-xl" value={formData.captPct} onChange={e => setFormData({...formData, captPct: Number(e.target.value)})} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-theme-muted opacity-40">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">% Comissão Edição</label>
                      <div className="relative">
                        <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-xl font-black text-brand-tactical outline-none focus:border-brand-tactical rounded-xl" value={formData.editPct} onChange={e => setFormData({...formData, editPct: Number(e.target.value)})} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-theme-muted opacity-40">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Ativos & Hardware de Trabalho</label>
                    <textarea className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl h-24 resize-none uppercase placeholder:opacity-20" value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})} placeholder="CÂMERAS, LENTES, DRONES, ETC..." />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Perfil de Workflow (Entrega)</label>
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
                          className={`p-4 text-[10px] font-black uppercase tracking-[0.2em] border transition-all rounded-2xl relative italic ${formData.workflowType.includes(t) ? 'bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-brand-tactical/30'}`}
                        >
                          {formData.workflowType.includes(t) && <CheckCircle2 className="absolute top-2 right-2" size={12} />}
                          {t === 'TRADICIONAL' ? 'Câmera / Desktop' : 'Mobile Maker (App)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEÇÃO DE FRANQUIA ── */}
              <div className="pt-10 border-t border-theme-border/60 space-y-6">
                <div className="flex items-center justify-between bg-theme-bg-muted/30 p-6 rounded-[30px] border border-theme-border/40">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Ponto de Impressão (Phygital)</label>
                    <p className="text-[8px] text-theme-muted uppercase font-bold opacity-40">Habilitar este usuário como franqueado phygital ativo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isFranchise: !formData.isFranchise})}
                    className={`w-14 h-7 rounded-full transition-all relative ${formData.isFranchise ? 'bg-brand-tactical shadow-lg shadow-brand-tactical/30' : 'bg-theme-border'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${formData.isFranchise ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {formData.isFranchise && (
                  <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 rounded-[30px] animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest italic">Saldo de Créditos de Impressão</label>
                        <p className="text-[7px] text-theme-muted uppercase font-bold opacity-40 italic">Limite operacional de revelações automáticas</p>
                      </div>
                      <input 
                        type="number" 
                        className="bg-transparent border-b border-brand-tactical/40 w-32 text-2xl font-black text-brand-tactical text-right focus:border-brand-tactical outline-none italic"
                        value={formData.printCredits} 
                        onChange={e => setFormData({...formData, printCredits: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── VERIFICAÇÃO PRO ── */}
              {formData.role === "PROFISSIONAL" && (
                <div className="pt-6">
                  <div className="flex items-center justify-between bg-brand-tactical/5 p-6 rounded-[30px] border border-brand-tactical/20">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Verificação Elite (PRO)</label>
                      <p className="text-[8px] text-theme-muted uppercase font-bold opacity-40 italic">Habilitar repasse financeiro imediato (F-09 Protocol)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isVerified: !formData.isVerified})}
                      className={`w-14 h-7 rounded-full transition-all relative ${formData.isVerified ? 'bg-brand-tactical shadow-lg shadow-brand-tactical/30' : 'bg-theme-border'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${formData.isVerified ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="fs-btn flex-1 border border-theme-border text-theme-muted hover:text-white transition-all italic">Cancelar</button>
              <button 
                type="submit" 
                onClick={handleCreate}
                className="fs-btn flex-[2] bg-brand-tactical text-zinc-950 shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all italic flex items-center justify-center gap-4"
              >
                {editingUser ? 'Salvar Membro' : 'Confirmar Convocação'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setConfirmDelete(null)} />
          
          <div className="relative w-full max-w-md bg-theme-card border border-red-500/20 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-[30px] flex items-center justify-center border border-red-500/20 mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text italic">Banir Membro?</h3>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic opacity-60">Protocolo de Exclusão Irreversível</p>
              </div>
              
              <p className="text-[11px] uppercase tracking-[0.2em] leading-relaxed text-theme-muted italic">
                ESTA AÇÃO IRÁ REVOGAR O ACESSO DE <span className="text-theme-text font-black">{confirmDelete.nome}</span> IMEDIATAMENTE DE TODAS AS OPERAÇÕES.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <button 
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="w-full py-5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-700 transition-all rounded-[20px] italic shadow-lg shadow-red-600/20"
                >
                  BANIR AGORA
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="w-full py-5 border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-[0.4em] hover:text-white transition-all rounded-[20px] italic"
                >
                  ABORTAR MISSÃO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[130] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-theme-bg shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-theme-bg'} min-w-[320px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Comando Executado' : 'Falha na Operação'}
                 </span>
                 <p className="text-[12px] font-bold text-theme-text uppercase tracking-widest mt-1">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </>
  );
};
