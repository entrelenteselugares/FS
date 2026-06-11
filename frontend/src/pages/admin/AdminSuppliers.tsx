import { useState, useEffect, useCallback, useMemo } from "react";
import { API as api } from "../../lib/api";
import { toast } from "sonner";
import { 
  Printer, 
  Settings,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Barcode,
  Search,
  Filter,
  Calculator,
  BarChart3,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  ArrowRight
} from "lucide-react";

// --- Types ---
interface Redemption {
  id: string;
  userId: string;
  status: "PENDING" | "APROVADO" | "PRINTING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  packageType: string;
  quantity: number;
  selectedPhotos: string[];
  trackingCode?: string;
  deliveryType: string;
  addressJson?: string;
  createdAt: string;
  user: { nome: string; email: string; whatsapp: string };
  supplier?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  active: boolean;
  costPer10x15: number;
  printerCost: number | null;
  _count: { redemptions: number };
}

interface Breakeven {
  printerCost: number;
  costPerPhoto: string;
  photosToBreakeven: number;
  estimatedConcursos: number;
  packages: Array<{
    curtidas: number;
    photos: number;
    totalCost: string;
  }>;
  scenarios: Array<{
    printerPrice: number;
    photosNeeded: number;
    monthsAt10PerMonth: number;
  }>;
}

export default function AdminSuppliers() {
  const [view, setView] = useState<"production" | "roi" | "suppliers">("production");
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [breakeven, setBreakeven] = useState<Breakeven | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRedemptions = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/redemptions");
      setRedemptions(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/suppliers");
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplierId) setSelectedSupplierId(data[0].id);
    } catch (err) { console.error(err); }
  }, [selectedSupplierId]);

  const fetchBreakevenData = useCallback(async (id: string) => {
    try {
      const { data } = await api.get(`/admin/suppliers/${id}/breakeven`);
      setBreakeven(data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isMounted) setLoading(true);
      await Promise.all([fetchRedemptions(), fetchSuppliers()]);
      if (isMounted) setLoading(false);
    };
    init();
    return () => { isMounted = false; };
  }, [fetchRedemptions, fetchSuppliers]);

  useEffect(() => {
    if (view === "roi" && selectedSupplierId) {
      const loadROI = async () => {
        await fetchBreakevenData(selectedSupplierId);
      };
      loadROI();
    }
  }, [view, selectedSupplierId, fetchBreakevenData]);

  const handleCreateSupplier = async (formData: SupplierFormData) => {
    try {
      await api.post("/admin/suppliers", formData);
      fetchSuppliers();
      setIsModalOpen(false);
      toast.success("Equipamento cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar equipamento.");
    }
  };

  const updateStatus = async (id: string, status: string, trackingCode?: string) => {
    try {
      await api.patch(`/admin/redemptions/${id}/status`, { status, trackingCode });
      fetchRedemptions();
      toast.success(status === 'PRINTING' ? "Produção iniciada! 🖨️" : "Logística atualizada! 🚚");
    } catch (err) { 
      console.error(err);
      toast.error("Erro ao atualizar status.");
    }
  };

  const productionStats = useMemo(() => {
    return {
      pending: redemptions.filter(r => r.status === "PENDING" || r.status === "APROVADO").length,
      printing: redemptions.filter(r => r.status === "PRINTING").length,
      shipped: redemptions.filter(r => r.status === "SHIPPED").length,
    };
  }, [redemptions]);

  const filteredRedemptions = useMemo(() => {
    return redemptions.filter(r => 
      r.user.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [redemptions, searchTerm]);

  const formatCurrency = (val: string | number = 0) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* MODAL NOVO EQUIPAMENTO */}
      {isModalOpen && <NewSupplierModal onClose={() => setIsModalOpen(false)} onSave={handleCreateSupplier} />}

      {/* HEADER MASTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-theme-border pb-10 gap-3 md:gap-6">
        <div>
                    <p className="text-theme-muted mt-2 text-sm">Fila de produção, ROI de equipamentos e fornecedores</p>
        </div>
        
        <div className="grid grid-cols-3 md:flex bg-theme-bg border border-theme-border p-1.5 shadow-sm italic gap-1 rounded-2xl">
          <button 
            onClick={() => setView("production")} 
            className={`px-3 md:px-6 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all whitespace-nowrap italic ${view === "production" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-brand-text'}`}
          >
            Fila de Produção
          </button>
          <button 
            onClick={() => setView("roi")} 
            className={`px-3 md:px-6 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all whitespace-nowrap italic ${view === "roi" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-brand-text'}`}
          >
            Engenharia de ROI
          </button>
          <button 
            onClick={() => setView("suppliers")} 
            className={`px-3 md:px-6 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all whitespace-nowrap italic ${view === "suppliers" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-brand-text'}`}
          >
            Ativos / Hardware
          </button>
        </div>
      </div>

      {/* VIEW: PRODUCTION QUEUE */}
      {view === "production" && (
        <div className="space-y-8 animate-in fade-in duration-500">
           {/* STATS DE FÁBRICA */}
           <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-theme-bg border border-theme-border rounded-2xl p-3 md:p-6 space-y-3 group hover:border-brand-tactical/50 transition-all shadow-sm">
                 <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Aguardando Início</span><Clock className="text-amber-600" size={14} /></div>
                 <div className="text-3xl font-heading font-black text-theme-text italic">{productionStats.pending}</div>
              </div>
              <div className="bg-theme-bg border border-theme-border rounded-2xl p-3 md:p-6 space-y-3 group hover:border-brand-tactical/50 transition-all shadow-sm">
                 <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Na Impressora</span><Printer className="text-brand-tactical" size={14} /></div>
                 <div className="text-3xl font-heading font-black text-theme-text italic">{productionStats.printing}</div>
              </div>
              <div className="bg-theme-bg border border-theme-border rounded-2xl p-3 md:p-6 space-y-3 group hover:border-brand-tactical/50 transition-all shadow-sm">
                 <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Em Trânsito</span><Truck className="text-blue-600" size={14} /></div>
                 <div className="text-3xl font-heading font-black text-theme-text italic">{productionStats.shipped}</div>
              </div>
           </div>

           {/* FILTROS E BUSCA */}
           <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} />
                 <input 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="BUSCAR CLIENTE OU PROTOCOLO..." 
                    className="w-full bg-theme-bg border border-theme-border p-4 pl-12 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/50 rounded-2xl" 
                 />
              </div>
              <button className="px-4 md:px-8 py-4 bg-theme-bg border border-theme-border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-muted hover:text-theme-text flex items-center gap-3 transition-all rounded-2xl">
                 <Filter size={12} /> Filtros Táticos
              </button>
           </div>

           {/* LISTA DE PRODUÇÃO */}
           <div className="space-y-4">
              {loading ? (
                <div className="py-24 text-center border border-theme-border bg-theme-bg animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic rounded-2xl">Sincronizando Fila de Produção...</div>
              ) : filteredRedemptions.length === 0 ? (
                <div className="py-32 text-center border  border-theme-border bg-theme-bg-muted/5 space-y-4 rounded-2xl">
                   <Package size={32} className="mx-auto text-theme-muted opacity-30" />
                   <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Nenhum protocolo na fila de impressão</p>
                </div>
              ) : filteredRedemptions.map(r => (
                <div key={r.id} className="bg-theme-bg-muted border border-theme-border rounded-2xl group hover:border-brand-tactical/40 transition-all overflow-hidden">
                   <div className="p-3 md:p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
                      <div className="flex-1 space-y-6">
                         <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border ${
                              r.status === 'PENDING' || r.status === 'APROVADO' ? 'border-amber-500 text-amber-500' :
                              r.status === 'PRINTING' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/10' :
                              r.status === 'SHIPPED' ? 'border-blue-500 text-blue-500' :
                              'border-zinc-500 text-zinc-500'
                            }`}>
                              {r.status}
                            </span>
                            <h4 className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter leading-none">{r.user.nome}</h4>
                            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest opacity-60">• {r.packageType} ({r.quantity} un)</span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-6 border-t border-theme-border">
                            <div className="space-y-3">
                               <div className="flex items-center gap-2 text-[8px] font-black text-theme-muted uppercase tracking-widest"><MapPin size={10} /> Destino de Entrega</div>
                               <p className="text-[10px] text-theme-text font-black uppercase leading-relaxed max-w-sm italic opacity-80">
                                  {r.addressJson ? JSON.parse(r.addressJson).logradouro + ", " + JSON.parse(r.addressJson).numero : "Retirada em Unidade"}
                               </p>
                               <div className="flex items-center gap-4 pt-2">
                                  <a href={`https://wa.me/${r.user.whatsapp}`} target="_blank" rel="noreferrer" className="text-[8px] font-black text-brand-tactical uppercase tracking-widest border-b border-brand-tactical/30 pb-0.5 hover:border-brand-tactical transition-all">WhatsApp Direto</a>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex items-center gap-2 text-[8px] font-black text-theme-muted uppercase tracking-widest"><ImageIcon size={10} /> Ativos para Impressão</div>
                               <div className="flex flex-wrap gap-1.5">
                                  {r.selectedPhotos.map((photo, i) => (
                                    <div key={i} className="px-2 py-1 bg-theme-bg border border-theme-border text-[8px] font-black text-theme-text font-mono rounded-2xl">#{photo.slice(-5)}</div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="lg:w-72 space-y-4 pt-6 lg:pt-0 lg:border-l lg:border-theme-border lg:pl-8 flex flex-col justify-center">
                         {r.status === 'PENDING' || r.status === 'APROVADO' ? (
                           <button onClick={() => updateStatus(r.id, 'PRINTING')} className="w-full bg-brand-tactical text-zinc-950 py-4 text-[9px] font-black uppercase tracking-[0.4em] rounded-xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"><Printer size={12}/> INICIAR IMPRESSÃO</button>
                         ) : r.status === 'PRINTING' ? (
                           <div className="space-y-3">
                              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block">Inserir Rastreio</label>
                              <div className="relative">
                                 <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={12} />
                                 <input 
                                    placeholder="CÓDIGO..." 
                                    onBlur={(e) => updateStatus(r.id, 'SHIPPED', e.target.value)}
                                    className="w-full bg-theme-bg border border-theme-border p-2.5 pl-10 text-[9px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase rounded-2xl" 
                                 />
                              </div>
                              <button onClick={() => updateStatus(r.id, 'SHIPPED')} className="w-full border border-brand-tactical text-brand-tactical py-3 text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-tactical/10 transition-all italic">FINALIZAR & ENVIAR</button>
                           </div>
                         ) : (
                           <div className="text-center p-4 bg-zinc-950/20 border border-theme-border">
                              <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2">Objeto em Trânsito</span>
                              <p className="text-[10px] font-black text-brand-tactical uppercase font-mono">{r.trackingCode || "S/ RASTREIO"}</p>
                              <button onClick={() => updateStatus(r.id, 'DELIVERED')} className="mt-4 text-[7px] font-black text-theme-muted uppercase border border-theme-border px-3 py-1.5 hover:text-white transition-all italic">CONFIRMAR ENTREGA</button>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* VIEW: ROI ANALYSIS */}
      {view === "roi" && (
        <div className="space-y-10 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 md:gap-10">
              {/* Sidebar de Ativos */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-[9px] font-black text-theme-muted uppercase tracking-widest border-b border-theme-border pb-4">
                    <Printer size={12} className="text-brand-tactical" /> Hardware & Ativos
                 </div>
                 <div className="space-y-3">
                    {suppliers.map(s => (
                      <button key={s.id} onClick={() => setSelectedSupplierId(s.id)} className={`w-full p-3 md:p-6 text-left border transition-all relative shadow-sm ${selectedSupplierId === s.id ? 'bg-brand-tactical/10 border-brand-tactical shadow-[0_0_20px_rgba(133,185,172,0.1)]' : 'bg-theme-bg border-theme-border hover:border-zinc-500'}`}>
                         <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${selectedSupplierId === s.id ? 'text-brand-tactical' : 'text-theme-text'}`}>{s.name}</span>
                         <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">{s.type === "OWN_PRINTER" ? "Ativo Local" : "Fulfillment"}</span>
                         {selectedSupplierId === s.id && <div className="absolute top-0 right-0 p-2"><CheckCircle2 size={10} className="text-brand-tactical" /></div>}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Workspace de ROI */}
              <div className="space-y-10">
                 {breakeven ? (
                   <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                         <div className="bg-theme-bg border border-theme-border rounded-2xl p-3 md:p-6 space-y-4 shadow-sm">
                            <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block">Unitário Operacional</span>
                            <p className="text-2xl font-heading font-black text-theme-text italic">{formatCurrency(breakeven.costPerPhoto)}</p>
                         </div>
                         <div className="bg-theme-bg border border-theme-border rounded-2xl p-3 md:p-6 space-y-4 shadow-sm">
                            <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block">Valor do Equipamento</span>
                            <p className="text-2xl font-heading font-black text-theme-text italic">{formatCurrency(breakeven.printerCost)}</p>
                         </div>
                         <div className="bg-brand-tactical/10 border border-brand-tactical rounded-2xl p-3 md:p-6 space-y-4 shadow-md">
                            <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block">Fotos para Amortizar</span>
                            <p className="text-2xl font-heading font-black text-brand-tactical italic">{breakeven.photosToBreakeven} <span className="text-[10px] uppercase font-sans">un</span></p>
                         </div>
                      </div>

                      <div className="bg-theme-bg border border-theme-border rounded-2xl p-5 md:p-10 relative overflow-hidden group shadow-sm">
                         <div className="flex items-center justify-between mb-10">
                            <div className="space-y-1">
                               <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-theme-text italic">Simulador de Conversão</h4>
                               <p className="text-[9px] text-theme-muted uppercase tracking-widest font-bold">Projeção orgânica de retorno</p>
                            </div>
                            <BarChart3 className="text-brand-tactical opacity-20" size={32} />
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                               <thead>
                                  <tr className="border-b border-theme-border bg-black/5 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-muted">
                                     <th className="p-4">Investimento</th>
                                     <th className="p-4 text-center">Volume ROI</th>
                                     <th className="p-4 text-right">Tempo Est.</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-theme-border/20">
                                  {breakeven.scenarios.map(s => (
                                    <tr key={s.printerPrice} className="hover:bg-theme-bg-muted transition-all text-[11px] font-black text-theme-text uppercase">
                                       <td className="p-4 italic">{formatCurrency(s.printerPrice)}</td>
                                       <td className="p-4 text-center">
                                          <span className="px-3 py-1 bg-brand-tactical/10 text-brand-tactical border border-brand-tactical/20 italic">{s.photosNeeded} FOTOS</span>
                                       </td>
                                       <td className="p-4 text-right text-theme-muted italic">{s.monthsAt10PerMonth} Meses</td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </>
                 ) : (
                   <div className="h-64 bg-theme-bg border border-theme-border flex flex-col items-center justify-center space-y-4 shadow-sm rounded-2xl">
                      <Calculator size={32} strokeWidth={1.5} className="text-theme-muted opacity-40" />
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-muted">Carregando análise financeira...</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* VIEW: ASSETS / SUPPLIERS */}
      {view === "suppliers" && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex justify-between items-center border-b border-theme-border pb-6">
              <h3 className="text-xl font-heading text-theme-text uppercase tracking-tighter">Ativos & Hardware</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-tactical text-zinc-950 px-3 md:px-6 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest shadow-lg flex items-center gap-2 hover:brightness-110 transition-all italic"
              >
                <Plus size={12} /> NOVO EQUIPAMENTO
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {suppliers.map(s => (
                <div key={s.id} className="bg-theme-bg-muted border border-theme-border rounded-2xl p-4 md:p-8 space-y-6 group hover:border-brand-tactical transition-all relative">
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-brand-tactical uppercase tracking-[0.4em]">{s.type}</span>
                      <h4 className="text-xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{s.name}</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-4 pt-6 border-t border-theme-border/10">
                      <div className="space-y-1"><span className="text-[7px] font-black text-theme-muted uppercase tracking-widest">Custo Foto</span><p className="text-sm font-black text-theme-text italic">{formatCurrency(s.costPer10x15)}</p></div>
                      <div className="space-y-1"><span className="text-[7px] font-black text-theme-muted uppercase tracking-widest">Resgates</span><p className="text-sm font-black text-theme-text italic">{s._count.redemptions}</p></div>
                   </div>
                   <div className="pt-6 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 border border-theme-border text-theme-muted hover:text-white transition-all"><Settings size={14}/></button>
                      <button className="p-2 border border-red-900/30 text-red-900/50 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}


    </div>
  );
}

// --- SUBCOMPONENTS ---

interface SupplierFormData {
  name: string;
  type: string;
  printerModel: string;
  printerCost: string;
  costPer10x15: string;
  boxCost: string;
  labelCost: string;
  uberCost: string;
  baseCep: string;
}

function NewSupplierModal({ onClose, onSave }: { onClose: () => void; onSave: (data: SupplierFormData) => void }) {
  const [form, setForm] = useState({
    name: "",
    type: "OWN_PRINTER",
    printerModel: "",
    printerCost: "",
    costPer10x15: "",
    boxCost: "1.50",
    labelCost: "0.50",
    uberCost: "40.00",
    baseCep: "13050-251"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-theme-card border border-theme-border rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 md:p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
              <Printer className="text-brand-tactical" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Novo Equipamento</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ativo de Hardware / Fulfillment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted"><X size={24} /></button>
        </div>

        {/* Content */}
        <form id="new-supplier-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 md:p-10 space-y-10 custom-scrollbar bg-theme-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Informações do Ativo</label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Nome do Equipamento</label>
                    <input required className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:opacity-20" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="EX: IMPRESSORA LAB CENTRAL" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Tipo de Operação</label>
                    <select className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl appearance-none cursor-pointer" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="OWN_PRINTER">IMPRESSORA PRÓPRIA</option>
                      <option value="EXTERNAL_LAB">LABORATÓRIO EXTERNO</option>
                      <option value="HYBRID">HÍBRIDO</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Hardware & Capex</label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Modelo / Marca</label>
                    <input className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:opacity-20" value={form.printerModel} onChange={e => setForm({...form, printerModel: e.target.value})} placeholder="EX: EPSON L805" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Custo de Aquisição (R$)</label>
                    <input type="number" step="0.01" className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl placeholder:opacity-20" value={form.printerCost} onChange={e => setForm({...form, printerCost: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-theme-border">
            <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-8 opacity-60 italic">Custos Operacionais Unitários (OPEX)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="space-y-2">
                <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Papel/Tinta</label>
                <input required type="number" step="0.0001" className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={form.costPer10x15} onChange={e => setForm({...form, costPer10x15: e.target.value})} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Caixa/Emb.</label>
                <input required type="number" step="0.01" className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={form.boxCost} onChange={e => setForm({...form, boxCost: e.target.value})} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Etiqueta</label>
                <input required type="number" step="0.01" className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={form.labelCost} onChange={e => setForm({...form, labelCost: e.target.value})} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1 opacity-40 italic">Logística</label>
                <input required type="number" step="0.01" className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={form.uberCost} onChange={e => setForm({...form, uberCost: e.target.value})} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 bg-brand-tactical/10 border border-brand-tactical/20 rounded-[30px] shadow-inner text-center">
            <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">⚠ ESTES DADOS ALIMENTAM A ENGENHARIA DE ROI E O PONTO DE EQUILÍBRIO DA OPERAÇÃO DE IMPRESSÃO.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 md:p-8 md:p-10 bg-theme-bg-muted border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
          <button type="button" onClick={onClose} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
          <button 
            type="submit" 
            form="new-supplier-form"
            className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
          >
            Salvar Equipamento
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
