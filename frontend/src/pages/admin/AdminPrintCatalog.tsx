import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API } from "../../lib/api";
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  ToggleLeft, 
  ToggleRight, 
  Eye, 
  EyeOff, 
  Tag, 
  Search,
  TrendingUp,
  Package,
  Layers,
  X,
  Target
} from "lucide-react";

// --- Types ---
interface PrintProduct {
  id: string;
  category: string;
  name: string;
  sku: string;
  supplierCost: number;
  supplier: string;
  active: boolean;
  marginPct: number;
  sellingPrice: number | null;
  calculatedPrice: number;
  finalPrice: number;
  description: string | null;
  unit: string;
  maxPhotos: number | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ALBUM:      { label: "Álbuns Encadernados", color: "#85B9AC" },
  ALBUM_30X40:{ label: "Álbuns 30×40",        color: "#a78bfa" },
  ACESSORIOS: { label: "Acabamentos e Acessórios", color: "#f59e0b" },
  QUADROS:    { label: "Quadros e Cadernos",   color: "#60a5fa" },
  REVELACAO:  { label: "Revelação de Fotos",   color: "#f87171" },
};

export const AdminPrintCatalog: React.FC = () => {
  const [products, setProducts] = useState<PrintProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.keys(CATEGORY_LABELS));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/print-catalog");
      setProducts(data.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleUpdate = async (id: string, updates: Partial<PrintProduct>) => {
    setSaving(id);
    try {
      const { data } = await API.patch(`/admin/print-catalog/${id}`, updates);
      setProducts(ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
    } finally { setSaving(null); }
  };

  const handleBulkMargin = async (category: string, marginPct: number) => {
    await API.patch("/admin/print-catalog/bulk-margin", { category, marginPct });
    load();
  };


  const stats = useMemo(() => {
    const active = products.filter(p => p.active);
    const avgMargin = active.length > 0 ? active.reduce((acc, p) => acc + p.marginPct, 0) / active.length : 0;
    return { activeCount: active.length, totalCount: products.length, avgMargin };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (filterCategory === "" || p.category === filterCategory) &&
      (searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, filterCategory, searchTerm]);

  const formatCurrency = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* MODAL: NOVO PRODUTO */}
      {isModalOpen && (
        <NewProductModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={async (data: Partial<PrintProduct>) => {
            const res = await API.post("/admin/print-catalog", data);
            setProducts(ps => [...ps, res.data]);
          }} 
        />
      )}

      {/* HEADER MASTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border/60 pb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Catálogo de Impressão</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Engenharia de Portfólio e Margens de Lucro</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-2">
            <Plus size={14} /> NOVO ITEM
          </button>
        </div>
      </div>

      {/* DASHBOARD DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Mix Ativo</span><Package className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{stats.activeCount}</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">/ {stats.totalCount} ITENS</span>
            </div>
         </div>
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Margem Média</span><TrendingUp className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">{stats.avgMargin.toFixed(1)}%</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">PROPORCIONAL</span>
            </div>
         </div>
         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 shadow-sm group hover:border-brand-tactical/40 transition-all">
            <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Hub de Produção</span><Layers className="text-brand-tactical" size={14} /></div>
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-heading font-black text-theme-text italic">CK</span>
               <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">LOGÍSTICA ATIVA</span>
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
               placeholder="BUSCAR NO CATÁLOGO..." 
               className="w-full bg-theme-bg border border-theme-border/60 p-4 pl-12 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/40" 
            />
         </div>
         <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-6 py-4 bg-theme-bg border border-theme-border/60 text-[9px] font-black uppercase tracking-widest text-theme-text outline-none focus:border-brand-tactical transition-all cursor-pointer"
         >
            <option value="">TODAS AS CATEGORIAS</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
         </select>
         <button 
            onClick={() => setShowInactive(!showInactive)}
            className="px-8 py-4 bg-theme-bg border border-theme-border/60 text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-white flex items-center gap-3 transition-all"
         >
            {showInactive ? <Eye size={14} /> : <EyeOff size={14} />} {showInactive ? 'OCULTAR INATIVOS' : 'EXIBIR TODOS'}
         </button>
      </div>

      {loading ? (
        <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-4 animate-pulse">
           <Layers size={32} className="mx-auto text-theme-muted opacity-30" />
           <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Sincronizando Ativos do Catálogo...</p>
        </div>
      ) : (
        <div className="space-y-6">
           {Object.entries(CATEGORY_LABELS).map(([catId, catInfo]) => {
            const catProducts = filteredProducts.filter(p => p.category === catId && (showInactive || p.active));
            if (catProducts.length === 0 && filterCategory !== "") return null;
            if (catProducts.length === 0 && searchTerm !== "") return null;

            const isExpanded = expandedCategories.includes(catId);

            return (
               <div key={catId} className="bg-theme-bg border border-theme-border/60 overflow-hidden shadow-sm">
                  {/* CATEGORY HEADER */}
                  <div 
                    onClick={() => toggleCategory(catId)}
                    className="p-5 border-b border-theme-border/40 flex items-center justify-between cursor-pointer hover:bg-theme-bg-muted/30 transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: catInfo.color }} />
                        <h3 className="text-xs font-heading font-black text-theme-text uppercase tracking-widest">{catInfo.label}</h3>
                        <span className="text-[8px] font-bold text-theme-muted uppercase tracking-[0.2em] opacity-60">• {catProducts.length} ITENS</span>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group/bulk" onClick={e => e.stopPropagation()}>
                           <input 
                              placeholder="MARGEM %" 
                              className="w-16 bg-theme-bg-muted border border-theme-border/40 p-1.5 text-[9px] text-center font-black outline-none focus:border-brand-tactical" 
                              onKeyDown={e => {
                                 if (e.key === 'Enter') handleBulkMargin(catId, parseFloat(e.currentTarget.value));
                              }}
                           />
                           <button className="text-[8px] font-black text-theme-muted uppercase tracking-widest hover:text-brand-tactical transition-all">APLICAR</button>
                        </div>
                        {isExpanded ? <ChevronDown size={14} className="text-theme-muted" /> : <ChevronRight size={14} className="text-theme-muted" />}
                     </div>
                  </div>

                  {/* PRODUCT LIST */}
                  {isExpanded && (
                     <div className="divide-y divide-theme-border/20 overflow-x-auto">
                        {/* TABLE HEADER */}
                        <div className="min-w-[700px] grid grid-cols-[40px_1fr_100px_80px_80px_80px_80px_110px] gap-4 p-4 bg-theme-bg-muted/20 text-[7px] font-black uppercase tracking-widest text-theme-muted italic">
                           <div>STATUS</div>
                           <div>IDENTIFICAÇÃO DO PRODUTO</div>
                           <div className="text-right">CUSTO</div>
                           <div className="text-right">MARGEM %</div>
                           <div className="text-right">CALCULADO</div>
                           <div className="text-right">MANUAL</div>
                           <div className="text-right">LMT FOTOS</div>
                           <div className="text-right">PREÇO FINAL</div>
                        </div>

                        {catProducts.map(p => (
                              <div key={p.id} className={`min-w-[700px] grid grid-cols-[40px_1fr_100px_80px_80px_80px_80px_110px] gap-4 p-4 items-center group transition-all ${!p.active ? 'opacity-40 grayscale' : 'hover:bg-theme-bg-muted/40'}`}>
                                 <button 
                                    onClick={() => handleUpdate(p.id, { active: !p.active })}
                                    className="text-theme-muted hover:text-brand-tactical transition-all"
                                 >
                                    {p.active ? <ToggleRight size={24} className="text-brand-tactical" /> : <ToggleLeft size={24} />}
                                 </button>

                                 <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-theme-text uppercase tracking-tight leading-tight">{p.name}</p>
                                    <div className="flex items-center gap-3 text-[7px] font-black text-theme-muted uppercase tracking-widest">
                                       <Tag size={8} /> {p.sku} <span className="opacity-40">•</span> {p.unit}
                                    </div>
                                 </div>

                                 <div className="text-right text-[10px] font-black text-theme-text font-mono italic opacity-60">
                                    {formatCurrency(p.supplierCost)}
                                 </div>

                                 <div className="text-right flex justify-end">
                                    <input 
                                       defaultValue={p.marginPct}
                                       onBlur={e => handleUpdate(p.id, { marginPct: parseFloat(e.target.value) })}
                                       className="w-14 bg-transparent border-b border-transparent focus:border-brand-tactical text-right text-[10px] font-black text-theme-text outline-none transition-all"
                                    />
                                 </div>

                                 <div className="text-right text-[10px] font-black text-brand-tactical/60 font-mono italic">
                                    {formatCurrency(p.calculatedPrice)}
                                 </div>

                                 <div className="text-right flex justify-end">
                                    <input 
                                       defaultValue={p.sellingPrice || ""}
                                       placeholder="--"
                                       onBlur={e => handleUpdate(p.id, { sellingPrice: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                       className="w-16 bg-transparent border-b border-transparent focus:border-brand-tactical text-right text-[10px] font-black text-theme-text outline-none transition-all placeholder:text-theme-muted/20"
                                    />
                                 </div>

                                 <div className="text-right flex justify-end">
                                    <input 
                                       defaultValue={p.maxPhotos || ""}
                                       placeholder="∞"
                                       onBlur={e => handleUpdate(p.id, { maxPhotos: e.target.value === "" ? null : parseInt(e.target.value) })}
                                       className="w-12 bg-transparent border-b border-transparent focus:border-brand-tactical text-right text-[10px] font-black text-theme-text outline-none transition-all placeholder:text-theme-muted/20"
                                    />
                                 </div>

                                 <div className="text-right">
                                    <span className={`text-[12px] font-black font-heading tracking-tighter ${saving === p.id ? 'animate-pulse' : ''} ${p.sellingPrice ? 'text-blue-500' : 'text-theme-text'}`}>
                                       {formatCurrency(p.finalPrice)}
                                    </span>
                                 </div>
                              </div>
                        ))}
                     </div>
                  )}
               </div>
            );
         })}
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

interface NewProductFormData {
  supplier: string; category: string; name: string; sku: string;
  supplierCost: number; unit: string; marginPct: number; description: string;
}

function NewProductModal({ onClose, onSave }: { onClose: () => void; onSave: (data: NewProductFormData) => Promise<void> }) {
  const [form, setForm] = useState({
    supplier: "CK",
    category: "ALBUM",
    name: "",
    sku: "",
    supplierCost: "",
    unit: "un",
    marginPct: "30",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full bg-theme-bg border border-theme-border/60 p-3 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase placeholder:text-theme-muted/30";
  const labelClass = "text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1.5 opacity-60";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...form,
        supplierCost: parseFloat(form.supplierCost),
        marginPct: parseFloat(form.marginPct)
      });
      onClose();
    } catch { alert("Erro ao criar produto."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10">
       <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" onClick={onClose} />
       <div className="bg-theme-bg border border-theme-border/60 w-full max-w-xl relative animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <h2 className="text-2xl font-heading font-black text-theme-text uppercase tracking-tighter">Novo Ativo no Catálogo</h2>
                   <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Expansão de Mix de Produtos</p>
                </div>
                <button onClick={onClose} className="text-theme-muted hover:text-white transition-all"><X size={20} /></button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className={labelClass}>Operador Logístico</label>
                      <select className={inputClass} value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}>
                         <option value="CK">CK ENCADERNADORA (Padrão)</option>
                         <option value="INTERNO">PRODUÇÃO LOCAL / PRÓPRIA</option>
                         <option value="TERCEIRO">OUTRO FORNECEDOR TÉCNICO</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>Categoria</label>
                      <select className={inputClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                         {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className={labelClass}>Nome Comercial do Produto</label>
                   <input required className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Álbum 15x21 - Capa Linho" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className={labelClass}>SKU / ID Único</label>
                      <input required className={inputClass} value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="ALB-UNIQ-001" />
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>Unidade de Medida</label>
                      <input className={inputClass} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="un, cópia, lâmina..." />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-theme-border/20">
                   <div className="space-y-1.5">
                      <label className={labelClass}>Custo Fornecedor (R$)</label>
                      <input required type="number" step="0.01" className={inputClass} value={form.supplierCost} onChange={e => setForm({...form, supplierCost: e.target.value})} placeholder="0,00" />
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>Margem Padrão (%)</label>
                      <input type="number" className={inputClass} value={form.marginPct} onChange={e => setForm({...form, marginPct: e.target.value})} />
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={onClose} className="flex-1 py-4 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-white transition-all">Cancelar</button>
                   <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <Target size={12} /> {loading ? "Sincronizando..." : "Confirmar Cadastro"}
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
}

export default AdminPrintCatalog;
