import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Briefcase, 
  Search, 
  Filter, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  X, 
  AlertCircle,
  Camera,
  Video,
  Layers
} from "lucide-react";
import { API } from "../../lib/api";

// --- Types ---
interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
}


const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FOTOGRAFIA: Camera,
  VIDEO: Video,
  EXTRAS: Zap,
  DEFAULT: Briefcase
};

export const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/service-catalog");
      setServices(data);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleSave = async (serviceData: Omit<Service, 'id'>) => {
    setSaving(true);
    try {
      if (editingService) {
        await API.patch(`/admin/service-catalog/${editingService.id}`, serviceData);
        setNotification({ message: "Serviço atualizado!", type: 'success' });
      } else {
        await API.post("/admin/service-catalog", serviceData);
        setNotification({ message: "Serviço criado!", type: 'success' });
      }
      fetchServices();
      setIsModalOpen(false);
      setEditingService(null);
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification({ message: "Erro ao salvar serviço.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/admin/service-catalog/${confirmDelete}`);
      setNotification({ message: "Serviço removido!", type: 'success' });
      fetchServices();
      setConfirmDelete(null);
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification({ message: "Erro ao remover serviço.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      (filterCategory === "" || s.category === filterCategory) &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [services, filterCategory, searchTerm]);

  const stats = useMemo(() => {
    const total = services.length;
    const avgPrice = total > 0 ? services.reduce((acc, s) => acc + s.basePrice, 0) / total : 0;
    const categories = Array.from(new Set(services.map(s => s.category))).length;
    return { total, avgPrice, categories };
  }, [services]);

  const formatCurrency = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* MODAL DE ENGENHARIA DE SERVIÇO */}
      {isModalOpen && (
        <ServiceModal 
          onClose={() => { setIsModalOpen(false); setEditingService(null); }} 
          onSave={handleSave} 
          initialData={editingService} 
          saving={saving}
        />
      )}

      {/* HEADER MASTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border/60 pb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Catálogo de Serviços</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Engenharia Comercial e Tabelas de Preço</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3"
        >
          <Plus size={14} /> ADICIONAR SERVIÇO
        </button>
      </div>

      {/* DASHBOARD DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Portfólio Ativo</span><Layers className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{stats.total}</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">SERVIÇOS</span>
            </div>
         </div>
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Ticket Base Médio</span><TrendingUp className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{formatCurrency(stats.avgPrice)}</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">ESTIMADO</span>
            </div>
         </div>
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Diversidade</span><Filter className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{stats.categories}</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">CATEGORIAS</span>
            </div>
         </div>
      </div>

      {/* FILTROS TÁTICOS */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} />
            <input 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="BUSCAR SERVIÇO OU DESCRIÇÃO..." 
               className="w-full bg-theme-bg border border-theme-border/60 p-4 pl-12 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/40" 
            />
         </div>
         <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-6 py-4 bg-theme-bg border border-theme-border/60 text-[9px] font-black uppercase tracking-widest text-theme-text outline-none focus:border-brand-tactical transition-all cursor-pointer"
         >
            <option value="">TODAS AS CATEGORIAS</option>
            <option value="FOTOGRAFIA">FOTOGRAFIA</option>
            <option value="VIDEO">VÍDEO</option>
            <option value="EXTRAS">EXTRAS / ADICIONAIS</option>
         </select>
      </div>

      {/* LISTAGEM DE LEDGER DE SERVIÇOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-4 animate-pulse">
             <Zap size={32} className="mx-auto text-theme-muted opacity-30" />
             <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Escaneando Ativos de Serviço...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-6">
             <Briefcase size={40} className="mx-auto text-theme-muted opacity-20" />
             <div className="space-y-2">
                <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Nenhum serviço configurado no momento.</p>
                <p className="text-[8px] text-theme-muted/60 uppercase tracking-widest">Inicie o seu catálogo para habilitar o gerador de orçamentos.</p>
             </div>
          </div>
        ) : (
          filteredServices.map(s => {
            const Icon = CATEGORY_ICONS[s.category] || CATEGORY_ICONS.DEFAULT;
            return (
              <div key={s.id} className="bg-theme-bg border border-theme-border/60 group hover:border-brand-tactical transition-all overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                   <div className="flex-1 flex items-start gap-6">
                      <div className="p-4 bg-theme-bg-muted border border-theme-border/40 text-brand-tactical">
                         <Icon size={20} />
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 border border-theme-border/60 text-[7px] font-black uppercase tracking-widest text-theme-muted">{s.category}</span>
                            <h4 className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{s.name}</h4>
                         </div>
                         <p className="text-[10px] text-theme-muted uppercase tracking-widest font-medium max-w-xl leading-relaxed italic opacity-80">{s.description}</p>
                      </div>
                   </div>

                   <div className="lg:w-80 flex items-center justify-between lg:justify-end gap-10 border-t lg:border-t-0 pt-6 lg:pt-0 border-theme-border/20">
                      <div className="text-right">
                         <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-1">Preço Sugerido</span>
                         <span className="text-xl font-heading font-black text-theme-text italic">{formatCurrency(s.basePrice)}</span>
                      </div>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                         <button 
                            onClick={() => { setEditingService(s); setIsModalOpen(true); }}
                            className="p-3 border border-theme-border/60 text-theme-muted hover:text-brand-tactical hover:border-brand-tactical transition-all"
                         >
                            <Edit3 size={14} />
                         </button>
                         <button 
                            onClick={() => setConfirmDelete(s.id)}
                            className="p-3 border border-red-900/30 text-red-900/40 hover:text-red-500 hover:border-red-500 transition-all"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAINEL DE COMPLIANCE TÁTICO */}
      <div className="bg-theme-bg border border-theme-border/60 p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <DollarSign size={120} />
         </div>
         <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 text-brand-tactical rounded-full">
            <AlertCircle size={32} />
         </div>
         <div className="flex-1 space-y-2 text-center md:text-left">
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-theme-text italic">Diretrizes de Precificação e Compliance</h4>
            <p className="text-[9px] text-theme-muted uppercase tracking-widest font-medium leading-relaxed max-w-3xl">
               Os valores cadastrados servem como base dinâmica para o gerador de propostas. Alterações neste catálogo **não impactam retroativamente** contratos já assinados ou eventos em fase de execução, garantindo a integridade jurídica da operação. Recomenda-se revisão trimestral baseada no IPCA.
            </p>
         </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
           <div className="relative bg-theme-bg border border-red-900/40 w-full max-w-sm p-10 space-y-8 shadow-2xl">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Gestão de Portfólio</span>
                 <h3 className="text-2xl font-heading text-theme-text uppercase tracking-tighter font-black">Remover Serviço?</h3>
              </div>
              <p className="text-[11px] text-theme-muted uppercase tracking-widest leading-relaxed font-bold italic">
                ESTA AÇÃO IRÁ REMOVER PERMANENTEMENTE O ITEM DO GERADOR DE ORÇAMENTOS.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setConfirmDelete(null)} className="p-4 border border-theme-border text-theme-muted text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">CANCELAR</button>
                 <button onClick={executeDelete} className="p-4 bg-red-900 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">REMOVER AGORA</button>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[700] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-8 border ${notification.type === 'success' ? 'border-brand-tactical bg-theme-bg shadow-[0_0_40px_rgba(133,185,172,0.15)]' : 'border-red-900 bg-theme-bg'} min-w-[350px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-2">
                 <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>Sincronização de Ativos</span>
                 <p className="text-[13px] font-bold text-theme-text uppercase tracking-widest mt-1 leading-tight">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};

// --- SUBCOMPONENTS ---

function ServiceModal({ onClose, onSave, initialData, saving }: { onClose: () => void; onSave: (data: Omit<Service, 'id'>) => Promise<void>; initialData?: Service | null; saving: boolean }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    basePrice: initialData?.basePrice || 0,
    category: initialData?.category || "FOTOGRAFIA"
  });

  const inputClass = "w-full bg-theme-bg border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase placeholder:text-theme-muted/30";
  const labelClass = "text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10">
       <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" onClick={onClose} />
       <div className="bg-theme-bg border border-theme-border/60 w-full max-w-2xl relative animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <h2 className="text-3xl font-heading font-black text-theme-text uppercase tracking-tighter">{initialData ? "Ajustar Ativo" : "Novo Ativo de Serviço"}</h2>
                   <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Configuração de Tabela e Valor de Entrega</p>
                </div>
                <button onClick={onClose} className="text-theme-muted hover:text-white transition-all"><X size={24} /></button>
             </div>

             <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className={labelClass}>Nome do Serviço</label>
                      <input required className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Fotografia de Casamento" />
                   </div>
                   <div className="space-y-2">
                      <label className={labelClass}>Categoria Comercial</label>
                      <select className={inputClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                         <option value="FOTOGRAFIA">FOTOGRAFIA</option>
                         <option value="VIDEO">VÍDEO</option>
                         <option value="EXTRAS">EXTRAS / ADICIONAIS</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className={labelClass}>Descrição da Entrega</label>
                   <textarea 
                     rows={3} 
                     className={`${inputClass} normal-case`} 
                     value={form.description} 
                     onChange={e => setForm({...form, description: e.target.value})} 
                     placeholder="O que o cliente recebe neste pacote?" 
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-theme-border/20">
                   <div className="space-y-2">
                      <label className={labelClass}>Preço Sugerido (R$)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={14} />
                         <input required type="number" step="0.01" className={`${inputClass} pl-10`} value={form.basePrice} onChange={e => setForm({...form, basePrice: parseFloat(e.target.value)})} placeholder="0,00" />
                      </div>
                   </div>
                   <div className="flex items-end">
                      <p className="text-[9px] text-theme-muted uppercase tracking-widest font-medium italic opacity-60">
                        Este valor será utilizado como base no gerador de orçamentos automático.
                      </p>
                   </div>
                </div>

                <div className="flex gap-4 pt-8">
                   <button type="button" onClick={onClose} className="flex-1 py-5 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-white transition-all">Cancelar</button>
                   <button type="submit" disabled={saving} className="flex-1 py-5 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3">
                      <Save size={14} /> {saving ? "SINCRONIZANDO..." : initialData ? "SALVAR ALTERAÇÕES" : "CONFIRMAR ATIVO"}
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
}

export default AdminServices;
