import React, { useState, useCallback, useMemo } from "react";
import {
  Plus, Search, Edit3, Trash2, Zap, Briefcase, Filter, Layers,
  TrendingUp, AlertCircle, DollarSign, Check, Ban, Camera, Video,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "../../lib/api";
import { toast } from "sonner";
import { ServiceModal } from "./services/ServiceModal";

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
  isPackage?: boolean;
  packageItems?: string[];
}

interface PendingService {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  professional?: { user?: { name: string; email: string } | null } | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FOTOGRAFIA: Camera, VIDEO: Video, EXTRAS: Zap, EDICAO: Edit3,
  POS_EDICAO: Layers, PRE_EVENTO: Camera, LOCACAO: Briefcase, DEFAULT: Briefcase,
};


// --- Package Modal Component ---
const PackageModal: React.FC<{ onClose: () => void, onSave: (data: any) => void, initialData: any, saving: boolean, services: Service[] }> = ({ onClose, onSave, initialData, saving, services }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice || 0);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialData?.packageItems || []);

  const availableServices = services.filter(s => !s.isPackage);
  const comboPrice = selectedItems.reduce((acc, id) => {
    const s = availableServices.find(x => x.id === id);
    return acc + (s?.basePrice || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-card border border-theme-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-black text-theme-text uppercase italic">{initialData ? 'Editar Pacote' : 'Montar Novo Pacote'}</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-white"><Trash2 size={20}/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-theme-muted">Nome do Pacote</label>
            <input className="w-full bg-theme-bg p-3 rounded-lg text-white text-sm outline-none border border-theme-border focus:border-amber-500" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-muted">Descrição</label>
            <textarea className="w-full bg-theme-bg p-3 rounded-lg text-white text-sm outline-none border border-theme-border focus:border-amber-500 h-20" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-muted block mb-2">Serviços Inclusos no Pacote</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
              {availableServices.map(s => (
                <label key={s.id} className="flex items-center gap-2 p-3 border border-theme-border rounded-lg bg-theme-bg cursor-pointer hover:border-amber-500/50">
                  <input type="checkbox" className="accent-amber-500" checked={selectedItems.includes(s.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedItems(prev => [...prev, s.id]);
                    else setSelectedItems(prev => prev.filter(id => id !== s.id));
                  }}/>
                  <div>
                    <p className="text-[10px] font-bold text-theme-text uppercase">{s.name}</p>
                    <p className="text-[8px] text-theme-muted">{(s.basePrice).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-theme-bg/50 border border-theme-border rounded-lg">
                <p className="text-[9px] font-black uppercase text-theme-muted">Valor dos Itens Separados</p>
                <p className="text-lg font-black text-theme-text line-through opacity-50">{comboPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-theme-muted">Preço Final do Pacote</label>
                <input type="number" className="w-full bg-theme-bg p-3 rounded-lg text-amber-500 font-bold text-lg outline-none border border-theme-border focus:border-amber-500" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} />
             </div>
          </div>
          <button disabled={saving || !name || selectedItems.length === 0} onClick={() => onSave({ name, description, basePrice, packageItems: selectedItems, category: 'PACOTE' })} className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-lg mt-4 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Pacote'}
          </button>
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const AdminServices: React.FC = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "PENDENTES" | "PACOTES">("CATALOGO");
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Service | null>(null);

  // React Query — catálogo
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["admin-service-catalog"],
    queryFn: async () => {
      const { data } = await API.get("/admin/service-catalog");
      return data;
    },
    enabled: activeTab === "CATALOGO",
  });

  // React Query — pendentes
  const { data: pendingServices = [] } = useQuery<PendingService[]>({
    queryKey: ["admin-services-pending"],
    queryFn: async () => {
      const { data } = await API.get("/admin/services/pending");
      return data;
    },
    enabled: activeTab === "PENDENTES",
  });

  const handleReviewAction = useCallback(async (serviceId: string, outcome: string, reason?: string) => {
    try {
      await API.patch(`/admin/services/${serviceId}/review`, { outcome, reason });
      toast.success(`Ação ${outcome} realizada com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ["admin-services-pending"] });
    } catch {
      toast.error("Erro ao processar avaliação.");
    }
  }, [queryClient]);

  const handleSavePackage = useCallback(async (pkgData: Partial<Service>) => {
    setSaving(true);
    try {
      const payload = { ...pkgData, isPackage: true };
      if (editingPackage) {
        await API.patch(`/admin/service-catalog/${editingPackage.id}`, payload);
        toast.success("Pacote atualizado!");
      } else {
        await API.post("/admin/service-catalog", payload);
        toast.success("Pacote criado!");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-service-catalog"] });
      setIsPackageModalOpen(false);
      setEditingPackage(null);
    } catch {
      toast.error("Erro ao salvar pacote.");
    } finally {
      setSaving(false);
    }
  }, [editingPackage, queryClient]);

  const handleSave = useCallback(async (serviceData: Omit<Service, "id">) => {
    setSaving(true);
    try {
      if (editingService) {
        await API.patch(`/admin/service-catalog/${editingService.id}`, serviceData);
        toast.success("Serviço atualizado!");
      } else {
        await API.post("/admin/service-catalog", serviceData);
        toast.success("Serviço criado!");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-service-catalog"] });
      setIsModalOpen(false);
      setEditingService(null);
    } catch {
      toast.error("Erro ao salvar serviço.");
    } finally {
      setSaving(false);
    }
  }, [editingService, queryClient]);

  const executeDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/admin/service-catalog/${confirmDelete}`);
      toast.success("Serviço removido!");
      queryClient.invalidateQueries({ queryKey: ["admin-service-catalog"] });
      setConfirmDelete(null);
    } catch {
      toast.error("Erro ao remover serviço.");
    }
  }, [confirmDelete, queryClient]);

  const filteredServices = useMemo(() =>
    services.filter(s => activeTab === "PACOTES" ? (s as any).isPackage : !(s as any).isPackage).filter(s =>
      (filterCategory === "" || s.category === filterCategory) &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [services, filterCategory, searchTerm]);

  const stats = useMemo(() => ({
    total: services.length,
    avgPrice: services.length > 0 ? services.reduce((acc, s) => acc + s.basePrice, 0) / services.length : 0,
    categories: new Set(services.map(s => s.category)).size,
  }), [services]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {isPackageModalOpen && (
        <PackageModal
          onClose={() => { setIsPackageModalOpen(false); setEditingPackage(null); }}
          onSave={handleSavePackage}
          initialData={editingPackage}
          saving={saving}
          services={services}
        />
      )}
      {isModalOpen && (
        <ServiceModal
          onClose={() => { setIsModalOpen(false); setEditingService(null); }}
          onSave={handleSave}
          initialData={editingService}
          saving={saving}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-theme-border pb-10 gap-6">
        <div>
                    <p className="text-theme-muted mt-2 text-sm">Gestão de catálogo, portfólio de serviços e aprovações</p>
        </div>
        {activeTab === "PACOTES" ? (
          <button onClick={() => { setEditingPackage(null); setIsPackageModalOpen(true); }} className="px-8 py-4 bg-amber-500 text-black text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3 italic">
            <Layers size={14} /> MONTAR PACOTE
          </button>
        ) : (
          <button onClick={() => { setEditingService(null); setIsModalOpen(true); }} className="px-8 py-4 bg-brand-tactical text-[var(--brand-text)] text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3 italic">
          <Plus size={14} /> ADICIONAR SERVIÇO
        </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-theme-border pb-4 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab("CATALOGO")} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-all ${activeTab === "CATALOGO" ? "bg-brand-tactical text-[var(--brand-text)]" : "text-theme-muted hover:bg-theme-bg-muted"}`}>
          Catálogo Global
        </button>
        <button onClick={() => setActiveTab("PACOTES")} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-all flex items-center gap-2 ${activeTab === "PACOTES" ? "bg-amber-500 text-black" : "text-theme-muted hover:bg-theme-bg-muted"}`}>
          Pacotes (Combos)
        </button>
        <button onClick={() => setActiveTab("PENDENTES")} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-all flex items-center gap-2 ${activeTab === "PENDENTES" ? "bg-brand-tactical text-[var(--brand-text)]" : "text-theme-muted hover:bg-theme-bg-muted"}`}>
          Aprovações Pendentes
          {pendingServices.length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{pendingServices.length}</span>}
        </button>
      </div>

      {activeTab === "CATALOGO" || activeTab === "PACOTES" ? (
        <>
          {/* MÉTRICAS */}
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[
              { label: "Portfólio Ativo", value: stats.total, suffix: "SERVIÇOS", icon: Layers },
              { label: "Ticket Base Médio", value: formatCurrency(stats.avgPrice), suffix: "ESTIMADO", icon: TrendingUp },
              { label: "Diversidade", value: stats.categories, suffix: "CATEGORIAS", icon: Filter },
            ].map(({ label, value, suffix, icon: Icon }) => (
              <div key={label} className="bg-theme-bg border border-theme-border p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all rounded-2xl">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">{label}</span>
                  <Icon className="text-brand-tactical" size={14} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-heading font-black text-theme-text italic">{value}</span>
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">{suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* FILTROS */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="BUSCAR SERVIÇO OU DESCRIÇÃO..." className="w-full bg-theme-bg border border-theme-border p-4 pl-12 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/40 rounded-2xl" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-6 py-4 bg-theme-bg border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-text outline-none focus:border-brand-tactical transition-all cursor-pointer rounded-2xl">
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

          {/* LISTAGEM */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-32 text-center border  border-theme-border bg-theme-bg-muted/5 space-y-4 animate-pulse rounded-2xl">
                <Zap size={32} className="mx-auto text-theme-muted opacity-30" />
                <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Carregando Catálogo...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-32 text-center border  border-theme-border bg-theme-bg-muted/5 space-y-6 rounded-2xl">
                <Briefcase size={40} className="mx-auto text-theme-muted opacity-20" />
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">{activeTab === "PACOTES" ? "Catálogo de Pacotes" : "Tabela de Preços e Serviços"}</p>
                  <p className="text-[8px] text-theme-muted/60 uppercase tracking-widest">{activeTab === "PACOTES" ? "Monte seu primeiro combo de serviços." : "Inicie o seu catálogo para habilitar o gerador de orçamentos."}</p>
                </div>
              </div>
            ) : filteredServices.map(s => {
              const Icon = CATEGORY_ICONS[s.category] || CATEGORY_ICONS.DEFAULT;
              return (
                <div key={s.id} className="bg-theme-bg-muted border border-theme-border rounded-2xl group hover:border-brand-tactical/50 transition-all overflow-hidden shadow-sm">
                  <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1 flex items-start gap-6">
                      <div className="p-4 bg-theme-bg-muted border border-theme-border text-brand-tactical rounded-2xl"><Icon size={20} /></div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 border border-theme-border text-[7px] font-black uppercase tracking-widest text-theme-muted">{s.category}</span>
                          <h4 className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{s.name}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {s.allowProfessional && <span className="px-2 py-0.5 bg-brand-tactical/15 border border-brand-tactical/25 text-[7px] font-black uppercase tracking-widest text-brand-tactical rounded-2xl">PROFISSIONAL: {formatCurrency(s.priceProfessional || 0)}</span>}
                          {s.allowMobile && <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 text-[7px] font-black uppercase tracking-widest text-amber-400 rounded-2xl">MOBILE: {formatCurrency(s.priceMobile || 0)}</span>}
                        </div>
                        <p className="text-[10px] text-theme-muted uppercase tracking-widest font-medium max-w-xl leading-relaxed italic opacity-80 mt-1">{s.description}</p>
                      </div>
                    </div>
                    <div className="lg:w-80 flex items-center justify-between lg:justify-end gap-10 border-t lg:border-t-0 pt-6 lg:pt-0 border-theme-border">
                      <div className="text-right">
                        <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-1">Preço Sugerido</span>
                        <span className="text-xl font-heading font-black text-theme-text italic">{formatCurrency(s.basePrice)}</span>
                      </div>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { if ((s as any).isPackage) { setEditingPackage(s); setIsPackageModalOpen(true); } else { setEditingService(s); setIsModalOpen(true); } }} className="p-3 border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical transition-all">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(s.id)} className="p-3 border border-red-900/30 text-red-900/40 hover:text-red-500 hover:border-red-500 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* APROVAÇÕES PENDENTES */
        <div className="space-y-4">
          {pendingServices.length === 0 ? (
            <div className="py-32 text-center border  border-theme-border bg-theme-bg-muted/5 space-y-6 rounded-2xl">
              <Check size={40} className="mx-auto text-brand-tactical opacity-50" />
              <div className="space-y-2">
                <p className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Tudo limpo!</p>
                <p className="text-[8px] text-theme-muted uppercase tracking-widest">Não há serviços aguardando aprovação.</p>
              </div>
            </div>
          ) : pendingServices.map(ps => (
            <div key={ps.id} className="bg-theme-bg border border-theme-border rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Briefcase size={80} /></div>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-theme-border/50 z-10 relative">
                <button onClick={() => handleReviewAction(ps.id, "NETWORK")} className="px-4 py-2 bg-brand-tactical text-[var(--brand-text)] text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110">
                  <Check size={14} /> Aprovar p/ Rede
                </button>
                <button onClick={() => handleReviewAction(ps.id, "EXCLUSIVE")} className="px-4 py-2 border border-brand-tactical text-brand-tactical text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-tactical/10">
                  Aprovar Exclusivo
                </button>
                <button onClick={() => { const r = prompt("Motivo para ajuste:"); if (r) handleReviewAction(ps.id, "NEEDS_ADJUSTMENT", r); }} className="px-4 py-2 border border-amber-500 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-500/10">
                  Solicitar Ajuste
                </button>
                <button onClick={() => handleReviewAction(ps.id, "REJECTED")} className="px-4 py-2 border border-red-500 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/10">
                  <Ban size={14} /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLIANCE BANNER */}
      <div className="bg-theme-bg border border-theme-border p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group rounded-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><DollarSign size={120} /></div>
        <div className="p-6 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical rounded-full"><AlertCircle size={32} /></div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-theme-text italic">Diretrizes de Precificação e Compliance</h4>
          <p className="text-[9px] text-theme-muted uppercase tracking-widest font-medium leading-relaxed max-w-3xl">
            Os valores cadastrados servem como base dinâmica para o gerador de propostas. Alterações neste catálogo não impactam retroativamente contratos já assinados ou eventos em fase de execução, garantindo a integridade jurídica da operação.
          </p>
        </div>
      </div>

      {/* MODAL: Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-md bg-theme-card border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mx-auto mb-6"><Trash2 className="text-red-500" size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-theme-text italic">Remover Serviço?</h3>
                <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">{activeTab === "PACOTES" ? "Catálogo de Pacotes" : "Tabela de Preços e Serviços"}</p>
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] leading-relaxed text-theme-muted italic">ESTA AÇÃO IRÁ REMOVER PERMANENTEMENTE O ITEM DO GERADOR DE ORÇAMENTOS DA REDE.</p>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <button onClick={executeDelete} className="w-full py-5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-700 transition-all rounded-2xl italic shadow-lg">REMOVER AGORA</button>
                <button onClick={() => setConfirmDelete(null)} className="w-full py-5 border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-[0.4em] hover:text-white transition-all rounded-2xl italic">ABORTAR MISSÃO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
