import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Plus, Search, Edit3, Trash2, Zap, Briefcase, Filter, Layers, TrendingUp, AlertCircle, DollarSign, ArrowRight, Camera, Video,
  Check, Ban, X
} from "lucide-react";
import { API } from "../../lib/api";

// --- Types ---
interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceProfessional: number;
  priceMobile: number;
  allowProfessional: boolean;
  allowMobile: boolean;
  category: string;
}

interface PendingService {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  professional?: {
    user?: {
      name: string;
      email: string;
    } | null;
  } | null;
}


const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FOTOGRAFIA: Camera,
  VIDEO: Video,
  EXTRAS: Zap,
  EDICAO: Edit3,
  POS_EDICAO: Layers,
  PRE_EVENTO: Camera,
  LOCACAO: Briefcase,
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

  const [activeTab, setActiveTab] = useState<"CATALOGO" | "PENDENTES">("CATALOGO");
  const [pendingServices, setPendingServices] = useState<PendingService[]>([]);

  const fetchPendingServices = useCallback(async () => {
    try {
      const { data } = await API.get("/admin/services/pending");
      setPendingServices(data);
    } catch (err) {
      console.error("Erro ao carregar pendentes:", err);
    }
  }, []);

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

  useEffect(() => { 
    if (activeTab === "CATALOGO") fetchServices();
    else fetchPendingServices();
  }, [activeTab, fetchServices, fetchPendingServices]);

  const handleReviewAction = async (serviceId: string, outcome: string, reason?: string) => {
    try {
      await API.patch(`/admin/services/${serviceId}/review`, { outcome, reason });
      setNotification({ message: `Ação ${outcome} realizada com sucesso.`, type: 'success' });
      fetchPendingServices();
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification({ message: "Erro ao processar avaliação.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-theme-border pb-10 gap-6">
        <div className="space-y-4 min-w-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            Gestão de <span className="text-brand-tactical">Serviços</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Tabela de Preços e Serviços Fotográficos</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-brand-tactical text-[var(--brand-text)] text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3 italic"
        >
          <Plus size={14} /> ADICIONAR SERVIÇO
        </button>
      </div>

      <div className="flex gap-4 border-b border-theme-border pb-4">
        <button 
          onClick={() => setActiveTab("CATALOGO")}
          className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-none transition-all ${activeTab === "CATALOGO" ? "bg-brand-tactical text-[var(--brand-text)]" : "text-theme-muted hover:bg-theme-bg-muted"}`}
        >
          Catálogo Global
        </button>
        <button 
          onClick={() => setActiveTab("PENDENTES")}
          className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-none transition-all flex items-center gap-2 ${activeTab === "PENDENTES" ? "bg-brand-tactical text-[var(--brand-text)]" : "text-theme-muted hover:bg-theme-bg-muted"}`}
        >
          Aprovações Pendentes
          {pendingServices.length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{pendingServices.length}</span>}
        </button>
      </div>

      {activeTab === "CATALOGO" ? (
        <>
      {/* DASHBOARD DE MÉTRICAS */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all rounded-none">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Portfólio Ativo</span><Layers className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{stats.total}</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">SERVIÇOS</span>
            </div>
         </div>
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all rounded-none">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Ticket Base Médio</span><TrendingUp className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{formatCurrency(stats.avgPrice)}</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">ESTIMADO</span>
            </div>
         </div>
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all rounded-none">
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
               className="w-full bg-theme-bg border border-theme-border/60 p-4 pl-12 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/40 rounded-none" 
            />
         </div>
         <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-6 py-4 bg-theme-bg border border-theme-border/60 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-text outline-none focus:border-brand-tactical transition-all cursor-pointer rounded-none"
         >
            <option value="">TODAS AS CATEGORIAS</option>
            <option value="FOTOGRAFIA">FOTOGRAFIA</option>
            <option value="VIDEO">VÍDEO</option>
            <option value="EDICAO">EDIÇÃO</option>
            <option value="POS_EDICAO">PÓS-EDIÇÃO</option>
            <option value="PRE_EVENTO">PRÉ-EVENTO</option>
            <option value="LOCACAO">LOCAÇÃO</option>
            <option value="EXTRAS">EXTRAS / ADICIONAIS</option>
         </select>
      </div>

      {/* LISTAGEM DE LEDGER DE SERVIÇOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-4 animate-pulse rounded-none">
             <Zap size={32} className="mx-auto text-theme-muted opacity-30" />
             <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Tabela de Preços e Serviços Fotográficos</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-6 rounded-none">
             <Briefcase size={40} className="mx-auto text-theme-muted opacity-20" />
             <div className="space-y-2">
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Tabela de Preços e Serviços Fotográficos</p>
                <p className="text-[8px] text-theme-muted/60 uppercase tracking-widest">Inicie o seu catálogo para habilitar o gerador de orçamentos.</p>
             </div>
          </div>
        ) : (
          filteredServices.map(s => {
            const Icon = CATEGORY_ICONS[s.category] || CATEGORY_ICONS.DEFAULT;
            return (
              <div key={s.id} className="bg-theme-bg-muted border border-theme-border rounded-none group hover:border-brand-tactical/50 transition-all overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                   <div className="flex-1 flex items-start gap-6">
                      <div className="p-4 bg-theme-bg-muted border border-theme-border/40 text-brand-tactical rounded-none">
                         <Icon size={20} />
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 border border-theme-border/60 text-[7px] font-black uppercase tracking-widest text-theme-muted">{s.category}</span>
                            <h4 className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{s.name}</h4>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-1">
                            {s.allowProfessional && (
                              <span className="px-2 py-0.5 bg-brand-tactical/15 border border-brand-tactical/25 text-[7px] font-black uppercase tracking-widest text-brand-tactical rounded-none">
                                PROFISSIONAL: {formatCurrency(s.priceProfessional || 0)}
                              </span>
                            )}
                            {s.allowMobile && (
                              <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 text-[7px] font-black uppercase tracking-widest text-amber-400 rounded-none">
                                MOBILE: {formatCurrency(s.priceMobile || 0)}
                              </span>
                            )}
                         </div>
                         <p className="text-[10px] text-theme-muted uppercase tracking-widest font-medium max-w-xl leading-relaxed italic opacity-80 mt-1">{s.description}</p>
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

      </>
      ) : (
        <div className="space-y-4">
          {pendingServices.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-6 rounded-none">
               <Check size={40} className="mx-auto text-brand-tactical opacity-50" />
               <div className="space-y-2">
                  <p className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Tudo limpo!</p>
                  <p className="text-[8px] text-theme-muted uppercase tracking-widest">Não há serviços aguardando aprovação no momento.</p>
               </div>
            </div>
          ) : (
            pendingServices.map(ps => (
              <div key={ps.id} className="bg-theme-bg border border-theme-border rounded-none p-6 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                  <Briefcase size={80} />
                </div>
                
                <div className="flex justify-between items-start z-10 relative">
                  <div>
                    <h3 className="text-lg font-heading font-black text-theme-text uppercase italic">{ps.name}</h3>
                    <p className="text-[10px] text-theme-muted uppercase tracking-widest">{ps.description}</p>
                    <div className="mt-2 text-[9px] text-theme-muted uppercase font-bold">
                      <span className="text-brand-tactical">Solicitante:</span> {ps.professional?.user?.name || "Desconhecido"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-black text-theme-text italic">{formatCurrency(Number(ps.price))}</div>
                    <div className="text-[8px] uppercase tracking-widest text-theme-muted">Preço Proposto</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-theme-border/50 relative z-10">
                  <button onClick={() => handleReviewAction(ps.id, 'NETWORK')} className="px-4 py-2 bg-brand-tactical text-[var(--brand-text)] text-[9px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 hover:brightness-110">
                    <Check size={14} /> Aprovar p/ Rede
                  </button>
                  <button onClick={() => handleReviewAction(ps.id, 'EXCLUSIVE')} className="px-4 py-2 border border-brand-tactical text-brand-tactical text-[9px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 hover:bg-brand-tactical/10">
                    Aprovar Exclusivo
                  </button>
                  <button onClick={() => {
                    const reason = prompt("Motivo para ajuste:");
                    if (reason) handleReviewAction(ps.id, 'NEEDS_ADJUSTMENT', reason);
                  }} className="px-4 py-2 border border-amber-500 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 hover:bg-amber-500/10">
                    Solicitar Ajuste
                  </button>
                  <button onClick={() => handleReviewAction(ps.id, 'REJECTED')} className="px-4 py-2 border border-red-500 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 hover:bg-red-500/10">
                    <Ban size={14} /> Rejeitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PAINEL DE COMPLIANCE TÁTICO */}
      <div className="bg-theme-bg border border-theme-border/60 p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group rounded-none">
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
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setConfirmDelete(null)} />
          
          <div className="relative w-full max-w-md bg-theme-card border border-red-500/20 rounded-none overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-none flex items-center justify-center border border-red-500/20 mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text italic">Remover Serviço?</h3>
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Tabela de Preços e Serviços Fotográficos</p>
              </div>
              
              <p className="text-[11px] uppercase tracking-[0.2em] leading-relaxed text-theme-muted italic">
                ESTA AÇÃO IRÁ REMOVER PERMANENTEMENTE O ITEM DO GERADOR DE ORÇAMENTOS DA REDE.
              </p>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <button 
                  onClick={executeDelete}
                  className="w-full py-5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-700 transition-all rounded-none italic shadow-lg shadow-red-600/20"
                >
                  REMOVER AGORA
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="w-full py-5 border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-[0.4em] hover:text-white transition-all rounded-none italic"
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
    priceProfessional: initialData?.priceProfessional || 0,
    priceMobile: initialData?.priceMobile || 0,
    allowProfessional: initialData?.allowProfessional ?? true,
    allowMobile: initialData?.allowMobile ?? false,
    category: initialData?.category || "FOTOGRAFIA"
  });

  const inputClass = "w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase placeholder:text-theme-muted/30 rounded-none";
  const labelClass = "text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
       <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border/60 rounded-none overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-tactical/10 rounded-none flex items-center justify-center border border-brand-tactical/20">
                <Briefcase className="text-brand-tactical" size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">{initialData ? "Ajustar Ativo" : "Novo Ativo de Serviço"}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Configuração de Tabela e Valor de Entrega</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
          </div>

          {/* Scrollable Content e Footer */}
          <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Nome do Serviço</label>
                <input required className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Fotografia de Casamento" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Categoria Comercial</label>
                <select className={inputClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="FOTOGRAFIA">FOTOGRAFIA</option>
                  <option value="VIDEO">VÍDEO</option>
                  <option value="EDICAO">EDIÇÃO</option>
                  <option value="POS_EDICAO">PÓS-EDIÇÃO</option>
                  <option value="PRE_EVENTO">PRÉ-EVENTO</option>
                  <option value="LOCACAO">LOCAÇÃO</option>
                  <option value="EXTRAS">EXTRAS / ADICIONAIS</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Descrição da Entrega</label>
              <textarea 
                rows={3} 
                className={`${inputClass} normal-case resize-none`} 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                placeholder="O que o cliente recebe neste pacote?" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-theme-border/20">
              <div className="space-y-2">
                <label className={labelClass}>Preço Sugerido (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={14} strokeWidth={1.5} />
                  <input required type="number" step="0.01" className={`${inputClass} pl-10`} value={form.basePrice} onChange={e => setForm({...form, basePrice: parseFloat(e.target.value) || 0})} placeholder="0,00" />
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Este valor será utilizado como base fallback no gerador de orçamentos automático da rede.</p>
              </div>
            </div>

            {/* Perfis Elegíveis e Valores */}
            <div className="space-y-4 pt-6 border-t border-theme-border/20">
              <label className={labelClass}>Tipo de Serviço &amp; Precificação Individual</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profissional Card */}
                <div className={`p-6 border rounded-none transition-all ${form.allowProfessional ? 'border-brand-tactical/40 bg-brand-tactical/5' : 'border-theme-border/60 bg-theme-bg-muted/10'}`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
                    <input 
                      type="checkbox" 
                      checked={form.allowProfessional} 
                      onChange={e => setForm({...form, allowProfessional: e.target.checked})} 
                      className="w-4 h-4 rounded-none text-brand-tactical focus:ring-brand-tactical border-theme-border/60 bg-theme-bg-muted rounded-none"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-text">Profissional</span>
                  </label>
                  
                  {form.allowProfessional && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Preço Profissional (R$)</span>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical" size={14} strokeWidth={1.5} />
                        <input 
                          required={form.allowProfessional} 
                          type="number" 
                          step="0.01" 
                          className={`${inputClass} pl-10`} 
                          value={form.priceProfessional} 
                          onChange={e => setForm({...form, priceProfessional: parseFloat(e.target.value) || 0})} 
                          placeholder="0,00" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Card */}
                <div className={`p-6 border rounded-none transition-all ${form.allowMobile ? 'border-amber-500/40 bg-amber-500/5' : 'border-theme-border/60 bg-theme-bg-muted/10'}`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
                    <input 
                      type="checkbox" 
                      checked={form.allowMobile} 
                      onChange={e => setForm({...form, allowMobile: e.target.checked})} 
                      className="w-4 h-4 rounded-none text-amber-500 focus:ring-amber-500 border-theme-border/60 bg-theme-bg-muted rounded-none"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-text">Mobile</span>
                  </label>
                  
                  {form.allowMobile && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Preço Mobile (R$)</span>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={14} strokeWidth={1.5} />
                        <input 
                          required={form.allowMobile} 
                          type="number" 
                          step="0.01" 
                          className={`${inputClass} pl-10`} 
                          value={form.priceMobile} 
                          onChange={e => setForm({...form, priceMobile: parseFloat(e.target.value) || 0})} 
                          placeholder="0,00" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0 rounded-none">
              <button type="button" onClick={onClose} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-none italic">Cancelar</button>
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-[2] py-5 bg-brand-tactical text-[var(--brand-text)] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-none italic flex items-center justify-center gap-4"
              >
                {saving ? "SINCRONIZANDO..." : initialData ? "SALVAR ALTERAÇÕES" : "CONFIRMAR ATIVO"}
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </form>
       </div>
    </div>
  );
}

export default AdminServices;
