import React, { useState, useEffect } from 'react';
import { API } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, 
  CreditCard, 
  Activity,
  Trash2,
  PowerOff,
  Power
} from 'lucide-react';

interface Franchisee {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  franchiseProfile: {
    id: string;
    printCredits: number;
    active: boolean;
    events: { id: string }[];
  } | null;
}

export default function AdminFranchises() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState<{id: string, name: string} | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(100);
  const [allUsers, setAllUsers] = useState<{id: string, nome: string, email: string, role: string, franchiseProfile: unknown}[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  const fetchFranchisees = async () => {
    try {
      const [fRes, uRes] = await Promise.all([
        API.get('/admin/franchises'),
        API.get('/admin/users')
      ]);
      if (fRes.data.success) setFranchisees(fRes.data.franchisees);
      setAllUsers(uRes.data || []);
    } catch (err) {
      console.error('Erro ao buscar franqueados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchisees();
  }, []);



  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsPromoting(true);
    try {
      const { data } = await API.post('/admin/franchises/promote', { userId: selectedUserId });
      if (data.success) {
        setShowAddModal(false);
        fetchFranchisees();
        setSelectedUserId('');
      }
    } catch {
      alert('Erro ao promover usuário');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleAddCredits = async () => {
    if (!showCreditModal) return;
    try {
      const { data } = await API.post('/admin/franchises/credits', {
        profileId: showCreditModal.id,
        amount: creditsToAdd,
        description: `Recarga manual via Admin`
      });
      if (data.success) {
        setShowCreditModal(null);
        fetchFranchisees();
      }
    } catch {
      alert('Erro ao adicionar créditos');
    }
  };

  const handleToggleActive = async (profileId: string, currentActive: boolean) => {
    try {
      await API.patch(`/admin/franchises/${profileId}/toggle`, { active: !currentActive });
      fetchFranchisees();
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const handleRemoveFranchise = async (profileId: string, nome: string) => {
    if (!confirm(`Remover a franquia de ${nome}? O usuário voltará a ser um profissional normal.`)) return;
    try {
      await API.delete(`/admin/franchises/${profileId}`);
      fetchFranchisees();
    } catch {
      alert('Erro ao remover franquia');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-theme-border pb-10">
        <div>
          <h2 className="text-4xl font-black text-theme-text uppercase tracking-tighter">Expansão Phygital</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-black italic">Gestão de Micro-Franquias & Créditos</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-brand-tactical text-zinc-950 px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-3 shadow-xl"
          >
            <Plus size={16} /> Novo Franqueado
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1 border border-theme-border">
        <div className="bg-theme-bg-muted p-8 border border-theme-border">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Total de Franqueados</label>
          <div className="text-3xl font-black text-theme-text">{franchisees.length}</div>
        </div>
        <div className="bg-theme-bg-muted p-8 border border-theme-border">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Créditos em Circulação</label>
          <div className="text-3xl font-black text-brand-tactical">
            {franchisees.reduce((acc, f) => acc + (f.franchiseProfile?.printCredits || 0), 0)}
          </div>
        </div>
        <div className="bg-theme-bg-muted p-8 border border-theme-border">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Eventos Cobertos</label>
          <div className="text-3xl font-black text-theme-text">
            {franchisees.reduce((acc, f) => acc + (f.franchiseProfile?.events?.length || 0), 0)}
          </div>
        </div>
        <div className="bg-theme-bg-muted p-8 border border-theme-border">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block mb-4">Status da Rede</label>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
            <Activity size={14} /> 100% Online
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-theme-border bg-theme-bg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-theme-bg-muted">
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest">Franqueado</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Status</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Saldo Créditos</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Eventos</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center text-theme-muted text-[10px] font-black uppercase tracking-[0.5em]">Sincronizando Rede...</td></tr>
            ) : franchisees.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-theme-muted text-[10px] font-black uppercase tracking-[0.5em]">Nenhum franqueado ativo.</td></tr>
            ) : franchisees.map(f => (
              <tr key={f.id} className="hover:bg-theme-bg-muted transition-all">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-theme-text uppercase tracking-tight">{f.nome}</span>
                    <span className="text-[10px] text-theme-muted font-bold">{f.email}</span>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-full ${f.franchiseProfile?.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {f.franchiseProfile?.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-xl font-black ${(f.franchiseProfile?.printCredits || 0) < 50 ? 'text-amber-500' : 'text-theme-text'}`}>
                      {f.franchiseProfile?.printCredits || 0}
                    </span>
                    <span className="text-[8px] text-theme-muted font-black uppercase">Fotos Disponíveis</span>
                  </div>
                </td>
                <td className="p-6 text-center text-sm font-black text-theme-muted">
                  {f.franchiseProfile?.events?.length || 0}
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    {isAdmin ? (
                      <>
                        <button 
                          onClick={() => setShowCreditModal({ id: f.franchiseProfile?.id || '', name: f.nome })}
                          className="p-3 border border-theme-border text-brand-tactical hover:bg-brand-tactical/10 transition-all"
                          title="Adicionar Créditos"
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(f.franchiseProfile?.id || '', f.franchiseProfile?.active || false)}
                          className={`p-3 border border-theme-border transition-all ${f.franchiseProfile?.active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                          title={f.franchiseProfile?.active ? 'Desativar' : 'Reativar'}
                        >
                          {f.franchiseProfile?.active ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                        <button
                          onClick={() => handleRemoveFranchise(f.franchiseProfile?.id || '', f.nome)}
                          className="p-3 border border-theme-border text-red-500 hover:bg-red-500/10 transition-all"
                          title="Remover Franquia"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest bg-theme-bg-muted px-3 py-2 border border-theme-border">Acesso Restrito</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Novo Franqueado */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-theme-bg/60 backdrop-blur-md">
          <div className="bg-theme-bg border border-theme-border p-10 max-w-lg w-full space-y-8 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-theme-text uppercase tracking-tighter">Ativar Novo Franqueado</h3>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">Selecione um usuário cadastrado no sistema</p>
            </div>
            <form onSubmit={handlePromote} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Usuário</label>
                <select 
                  className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text text-xs font-bold uppercase tracking-widest focus:border-brand-tactical outline-none cursor-pointer"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">SELECIONE O USUÁRIO</option>
                  {allUsers
                    .filter(u => u.role !== 'ADMIN' && !u.franchiseProfile)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nome.toUpperCase()} ({u.email.toLowerCase()})
                      </option>
                    ))
                  }
                </select>
              </div>
              <div className="flex gap-4 pt-4 border-t border-theme-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-theme-border text-theme-muted font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isPromoting || !selectedUserId}
                  className="flex-1 py-4 bg-brand-tactical text-zinc-950 font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                >
                  {isPromoting ? 'Ativando...' : 'Confirmar Ativação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Créditos */}
      {showCreditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-theme-bg/60 backdrop-blur-md">
          <div className="bg-theme-bg border border-theme-border p-10 max-w-sm w-full space-y-8 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest">Recarga de Saldo</span>
              <h3 className="text-xl font-black text-theme-text uppercase">{showCreditModal.name}</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-theme-bg-muted p-6 border border-theme-border">
                <button onClick={() => setCreditsToAdd(Math.max(0, creditsToAdd - 100))} className="text-theme-text text-2xl font-black w-10 h-10 flex items-center justify-center">-</button>
                <div className="text-center">
                  <div className="text-3xl font-black text-theme-text">{creditsToAdd}</div>
                  <div className="text-[8px] text-theme-muted font-black uppercase tracking-widest">Fotos</div>
                </div>
                <button onClick={() => setCreditsToAdd(creditsToAdd + 100)} className="text-theme-text text-2xl font-black w-10 h-10 flex items-center justify-center">+</button>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowCreditModal(null)} className="flex-1 py-4 border border-theme-border text-theme-muted font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={handleAddCredits} className="flex-1 py-4 bg-emerald-500 text-zinc-950 font-black uppercase text-[10px] tracking-widest hover:brightness-110">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
