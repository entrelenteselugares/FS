import React, { useState, useEffect } from 'react';
import { API } from '../../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, 
  CreditCard, 
  Activity,
  Trash2,
  PowerOff,
  Power,
  ArrowRight,
  X,
  ShieldCheck
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

interface SupplyOrder {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string;
  trackingCode?: string;
  shippingNotes?: string;
  franchisee: {
    nome: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
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
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fulfillingOrder, setFulfillingOrder] = useState<string | null>(null);
  const [fulfillModal, setFulfillModal] = useState<{ orderId: string; franchisee: string } | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');

  const fetchFranchisees = async () => {
    try {
      const [fRes, uRes, oRes] = await Promise.all([
        API.get('/admin/franchises'),
        API.get('/admin/users'),
        API.get('/admin/franchises/orders')
      ]);
      if (fRes.data.success) setFranchisees(fRes.data.franchisees);
      setAllUsers(uRes.data || []);
      if (oRes.data.success) setSupplyOrders(oRes.data.orders);
    } catch (err) {
      console.error('Erro ao buscar franqueados:', err);
    } finally {
      setLoading(false);
      setLoadingOrders(false);
    }
  };

  const fulfillOrder = async () => {
    if (!fulfillModal) return;
    const { orderId } = fulfillModal;
    setFulfillingOrder(orderId);
    try {
      await API.patch(`/admin/franchises/orders/${orderId}/status`, { 
        status: 'SHIPPED', 
        trackingCode: trackingCode.trim() || undefined,
        shippingNotes: shippingNotes.trim() || undefined,
      });
      setSupplyOrders(prev => prev.map(o => o.id === orderId 
        ? { ...o, status: 'SHIPPED', trackingCode: trackingCode.trim(), shippingNotes: shippingNotes.trim() } 
        : o
      ));
      await fetchFranchisees();
      toast.success('Pedido despachado e créditos liberados! 🚚');
      setFulfillModal(null);
      setTrackingCode('');
      setShippingNotes('');
    } catch (err) {
      console.error('Erro ao processar fulfillment:', err);
      toast.error('Erro ao processar envio de insumos.');
    } finally {
      setFulfillingOrder(null);
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
        toast.success('Usuário promovido a franqueado com sucesso!');
        setSelectedUserId('');
      }
    } catch {
      toast.error('Erro ao promover usuário');
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
        toast.success('Créditos recarregados com sucesso!');
      }
    } catch {
      toast.error('Erro ao adicionar créditos');
    }
  };

  const handleToggleActive = async (profileId: string, currentActive: boolean) => {
    try {
      await API.patch(`/admin/franchises/${profileId}/toggle`, { active: !currentActive });
      fetchFranchisees();
      toast.success('Status da franquia atualizado!');
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleRemoveFranchise = async (profileId: string, nome: string) => {
    if (!confirm(`Remover a franquia de ${nome}? O usuário voltará a ser um profissional normal.`)) return;
    try {
      await API.delete(`/admin/franchises/${profileId}`);
      fetchFranchisees();
      toast.success('Franquia removida com sucesso!');
    } catch {
      toast.error('Erro ao remover franquia');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/10 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div>
                        <p className="text-theme-muted mt-2 text-sm">Rede de unidades e parceiros de produção</p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex-1 md:flex-none px-8 py-4 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl italic whitespace-nowrap"
              >
                <Plus size={16} /> NOVO FRANQUEADO
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-theme-bg-muted p-6 border border-theme-border space-y-3 group hover:border-brand-tactical/50 transition-all rounded-2xl">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block italic">Total de Franqueados</label>
          <div className="text-3xl font-heading font-black text-theme-text italic">{franchisees.length}</div>
        </div>
        <div className="bg-theme-bg-muted p-6 border border-theme-border space-y-3 group hover:border-brand-tactical/50 transition-all rounded-2xl">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block italic">Créditos em Circulação</label>
          <div className="text-3xl font-heading font-black text-brand-tactical italic">
            {franchisees.reduce((acc, f) => acc + (f.franchiseProfile?.printCredits || 0), 0)}
          </div>
        </div>
        <div className="bg-theme-bg-muted p-6 border border-theme-border space-y-3 group hover:border-brand-tactical/50 transition-all rounded-2xl">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block italic">Eventos Cobertos</label>
          <div className="text-3xl font-heading font-black text-theme-text italic">
            {franchisees.reduce((acc, f) => acc + (f.franchiseProfile?.events?.length || 0), 0)}
          </div>
        </div>
        <div className="bg-theme-bg-muted p-6 border border-theme-border space-y-3 group hover:border-brand-tactical/50 transition-all rounded-2xl">
          <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block italic">Status da Rede</label>
          <div className="flex items-center gap-2 text-brand-tactical font-black text-[12px] font-heading uppercase tracking-widest italic leading-none">
            <Activity size={14} strokeWidth={1.5} /> 100% ONLINE
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-theme-border bg-theme-bg-muted shadow-sm overflow-x-auto w-full rounded-2xl">
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
                      <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest bg-theme-bg-muted px-3 py-2 border border-theme-border rounded-2xl">Acesso Restrito</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Supply Orders Section */}
      <div className="space-y-6 pt-10 border-t border-theme-border">
        <div>
          <h3 className="text-2xl font-black text-theme-text uppercase tracking-tighter">Pedidos de Suprimentos</h3>
          <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Controle de Licenças e Royalties</p>
        </div>

        <div className="border border-theme-border bg-theme-bg-muted shadow-sm overflow-x-auto w-full rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-theme-bg-muted">
                <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest">Pedido</th>
                <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest">Franqueado</th>
                <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest">Itens</th>
                <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest text-center">Total</th>
                <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest text-right">Status</th>
                <th className="p-4 text-[9px] font-black text-theme-muted uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/50">
              {loadingOrders ? (
                <tr><td colSpan={5} className="p-10 text-center text-theme-muted text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest">Carregando pedidos...</td></tr>
              ) : supplyOrders.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-theme-muted text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest">Nenhum pedido registrado.</td></tr>
              ) : supplyOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-theme-text font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className="text-[8px] text-theme-muted">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-theme-text uppercase">{order.franchisee?.nome}</span>
                      <span className="text-[8px] text-theme-muted">{order.franchisee?.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-[9px] text-theme-text font-bold leading-tight max-w-[200px]">
                      {order.items.map(it => `${it.quantity}x ${it.name}`).join(", ")}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[10px] font-black text-emerald-500 italic">R$ {Number(order.total).toFixed(2)}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`text-[8px] font-black px-2 py-1 rounded-sm uppercase tracking-tighter ${
                      order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 
                      order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400' :
                      order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {order.status === 'PAID' ? 'Pago' : order.status === 'SHIPPED' ? 'Enviado' : order.status === 'PENDING' ? 'Pendente' : order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {order.status === 'PAID' && (
                      <button
                        onClick={() => setFulfillModal({ orderId: order.id, franchisee: order.franchisee?.nome })}
                        disabled={fulfillingOrder === order.id}
                        className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {fulfillingOrder === order.id ? 'Processando...' : '✓ Enviar & Creditar'}
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest">✓ Enviado</span>
                        {order.trackingCode && (
                          <span className="text-[8px] text-theme-muted font-mono">{order.trackingCode}</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Franqueado */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[60vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Activity className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Ativar Franqueado</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Expansão de Rede Phygital</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <form id="promote-franchise-form" onSubmit={handlePromote} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Selecione o Usuário Alvo</label>
                <select 
                  className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text text-xs font-black uppercase tracking-widest focus:border-brand-tactical outline-none cursor-pointer rounded-2xl appearance-none"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">BUSCAR NO DIRETÓRIO...</option>
                  {allUsers
                    .filter(u => u.role !== 'ADMIN' && !u.franchiseProfile)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nome.toUpperCase()} ({u.email.toLowerCase()})
                      </option>
                    ))
                  }
                </select>
                <p className="text-[9px] text-theme-muted font-bold italic opacity-40 text-center px-6">
                  SOMENTE USUÁRIOS COM PERFIL PROFISSIONAL ATIVO PODEM SER PROMOVIDOS A FRANQUIA.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                type="submit" 
                form="promote-franchise-form"
                disabled={isPromoting || !selectedUserId}
                className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isPromoting ? 'Processando...' : 'Confirmar Ativação'}
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Créditos */}
      {showCreditModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowCreditModal(null)} />
          
          <div className="relative w-full max-w-sm bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <CreditCard className="text-emerald-500" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Recarga</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gestão de Créditos B2B</p>
                </div>
              </div>
              <button onClick={() => setShowCreditModal(null)} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 space-y-8">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-theme-text uppercase italic tracking-tight">{showCreditModal.name}</h3>
                <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest italic opacity-40">Protocolo de Materialização</p>
              </div>

              <div className="flex items-center justify-between bg-theme-bg-muted p-8 border border-theme-border rounded-[30px] shadow-inner">
                <button 
                  onClick={() => setCreditsToAdd(Math.max(0, creditsToAdd - 100))} 
                  className="w-12 h-12 bg-theme-bg border border-theme-border text-theme-text text-2xl font-black rounded-2xl flex items-center justify-center hover:bg-brand-tactical hover:text-black hover:border-brand-tactical transition-all"
                >
                  -
                </button>
                <div className="text-center">
                  <div className="text-4xl font-black text-theme-text italic tracking-tighter">{creditsToAdd}</div>
                  <div className="text-[8px] text-theme-muted font-black uppercase tracking-widest opacity-60">Unidades</div>
                </div>
                <button 
                  onClick={() => setCreditsToAdd(creditsToAdd + 100)} 
                  className="w-12 h-12 bg-theme-bg border border-theme-border text-theme-text text-2xl font-black rounded-2xl flex items-center justify-center hover:bg-brand-tactical hover:text-black hover:border-brand-tactical transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button onClick={() => setShowCreditModal(null)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                onClick={handleAddCredits} 
                className="flex-[2] py-5 bg-emerald-500 text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
              >
                Confirmar Recarga
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fulfillment — Enviar Insumos */}
      {fulfillModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => { setFulfillModal(null); setTrackingCode(''); setShippingNotes(''); }} />
          
          <div className="relative w-full max-w-lg bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="text-emerald-500" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Despachar Pedido</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Logística de Suprimentos Rede</p>
                </div>
              </div>
              <button onClick={() => { setFulfillModal(null); setTrackingCode(''); setShippingNotes(''); }} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="space-y-1">
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest italic opacity-60">Franqueado Destinatário</p>
                <h3 className="text-xl font-black text-theme-text uppercase italic tracking-tight">{fulfillModal.franchisee}</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Código de Rastreio</label>
                  <input
                    type="text"
                    placeholder="EX: BR123456789BR"
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value)}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-mono outline-none focus:border-brand-tactical rounded-xl uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Observações do Envio</label>
                  <textarea
                    rows={3}
                    placeholder="EX: ENVIADO VIA CORREIOS PAC — PRAZO ESTIMADO 5 DIAS ÚTEIS"
                    value={shippingNotes}
                    onChange={e => setShippingNotes(e.target.value)}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl h-24 resize-none uppercase leading-relaxed"
                  />
                </div>
              </div>

              <div className="bg-brand-tactical/10 border border-brand-tactical/20 p-6 rounded-[24px]">
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic">⚠ ESTA AÇÃO IRÁ DEDUZIR O ESTOQUE DA MATRIZ E CREDITAR OS CRÉDITOS DE IMPRESSÃO AO FRANQUEADO. ESTA OPERAÇÃO É IRREVERSÍVEL NO LEDGER.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button onClick={() => { setFulfillModal(null); setTrackingCode(''); setShippingNotes(''); }} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                onClick={fulfillOrder}
                disabled={fulfillingOrder !== null}
                className="flex-[2] py-5 bg-emerald-500 text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {fulfillingOrder ? 'Processando...' : 'Confirmar Envio'}
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
