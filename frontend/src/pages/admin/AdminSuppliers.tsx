import { useState, useEffect, useCallback, useMemo } from "react";
import { API as api } from "../../lib/api";
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
  X
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
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
      fetchBreakevenData(selectedSupplierId);
    }
  }, [view, selectedSupplierId, fetchBreakevenData]);

  const handleCreateSupplier = async (formData: any) => {
    try {
      await api.post("/admin/suppliers", formData);
      fetchSuppliers();
      setIsModalOpen(false);
      setNotification({ message: "Equipamento cadastrado com sucesso!", type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erro ao cadastrar equipamento.", type: 'error' });
    }
  };

  const updateStatus = async (id: string, status: string, trackingCode?: string) => {
    try {
      await api.patch(`/admin/redemptions/${id}/status`, { status, trackingCode });
      fetchRedemptions();
      setNotification({ 
        message: status === 'PRINTING' ? "Produção iniciada! 🖨️" : "Logística atualizada! 🚚", 
        type: 'success' 
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) { 
      console.error(err);
      setNotification({ message: "Erro ao atualizar status.", type: 'error' });
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border/60 pb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Operação de Impressão</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Logística, Amortização e Fila de Produção</p>
        </div>
        
        <div className="flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm">
          <button 
            onClick={() => setView("production")} 
            className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === "production" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
          >
            Fila de Produção
          </button>
          <button 
            onClick={() => setView("roi")} 
            className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === "roi" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
          >
            Engenharia de ROI
          </button>
          <button 
            onClick={() => setView("suppliers")} 
            className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === "suppliers" ? 'bg-brand-tactical text-zinc-950 shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
          >
            Ativos / Hardware
          </button>
        </div>
      </div>

      {/* VIEW: PRODUCTION QUEUE */}
      {view === "production" && (
        <div className="space-y-8 animate-in fade-in duration-500">
           {/* STATS DE FÁBRICA */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 group hover:border-brand-tactical/50 transition-all shadow-sm">
                 <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Aguardando Início</span><Clock className="text-amber-600" size={14} /></div>
                 <div className="text-3xl font-heading font-black text-theme-text italic">{productionStats.pending}</div>
              </div>
              <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 group hover:border-brand-tactical/50 transition-all shadow-sm">
                 <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Na Impressora</span><Printer className="text-brand-tactical" size={14} /></div>
                 <div className="text-3xl font-heading font-black text-theme-text italic">{productionStats.printing}</div>
              </div>
              <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-3 group hover:border-brand-tactical/50 transition-all shadow-sm">
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
                    className="w-full bg-theme-bg border border-theme-border/60 p-4 pl-12 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase tracking-widest placeholder:text-theme-muted/50" 
                 />
              </div>
              <button className="px-8 py-4 bg-theme-bg border border-theme-border/60 text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-theme-text flex items-center gap-3 transition-all">
                 <Filter size={12} /> Filtros Táticos
              </button>
           </div>

           {/* LISTA DE PRODUÇÃO */}
           <div className="space-y-4">
              {loading ? (
                <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/10 animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic">Sincronizando Fila de Produção...</div>
              ) : filteredRedemptions.length === 0 ? (
                <div className="py-32 text-center border border-dashed border-theme-border bg-theme-bg-muted/5 space-y-4">
                   <Package size={32} className="mx-auto text-theme-muted opacity-30" />
                   <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Linha de montagem vazia.</p>
                </div>
              ) : filteredRedemptions.map(r => (
                <div key={r.id} className="bg-theme-bg-muted border border-theme-border group hover:border-brand-tactical/40 transition-all overflow-hidden">
                   <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="flex-1 space-y-6">
                         <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border ${
                              r.status === 'PENDING' || r.status === 'APROVADO' ? 'border-amber-500 text-amber-500' :
                              r.status === 'PRINTING' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' :
                              r.status === 'SHIPPED' ? 'border-blue-500 text-blue-500' :
                              'border-zinc-500 text-zinc-500'
                            }`}>
                              {r.status}
                            </span>
                            <h4 className="text-lg font-heading font-black text-theme-text uppercase tracking-tighter leading-none">{r.user.nome}</h4>
                            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-widest opacity-60">• {r.packageType} ({r.quantity} un)</span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-theme-border/20">
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
                                    <div key={i} className="px-2 py-1 bg-theme-bg border border-theme-border text-[8px] font-black text-theme-text font-mono">#{photo.slice(-5)}</div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="lg:w-72 space-y-4 pt-6 lg:pt-0 lg:border-l lg:border-theme-border/20 lg:pl-8 flex flex-col justify-center">
                         {r.status === 'PENDING' || r.status === 'APROVADO' ? (
                           <button onClick={() => updateStatus(r.id, 'PRINTING')} className="w-full bg-brand-tactical text-zinc-950 py-4 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"><Printer size={12}/> INICIAR IMPRESSÃO</button>
                         ) : r.status === 'PRINTING' ? (
                           <div className="space-y-3">
                              <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block">Inserir Rastreio</label>
                              <div className="relative">
                                 <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={12} />
                                 <input 
                                    placeholder="CÓDIGO..." 
                                    onBlur={(e) => updateStatus(r.id, 'SHIPPED', e.target.value)}
                                    className="w-full bg-theme-bg border border-theme-border p-2.5 pl-10 text-[9px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase" 
                                 />
                              </div>
                              <button onClick={() => updateStatus(r.id, 'SHIPPED')} className="w-full border border-brand-tactical text-brand-tactical py-3 text-[8px] font-black uppercase tracking-widest hover:bg-brand-tactical/10 transition-all">FINALIZAR & ENVIAR</button>
                           </div>
                         ) : (
                           <div className="text-center p-4 bg-zinc-950/20 border border-theme-border/30">
                              <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2">Objeto em Trânsito</span>
                              <p className="text-[10px] font-black text-brand-tactical uppercase font-mono">{r.trackingCode || "S/ RASTREIO"}</p>
                              <button onClick={() => updateStatus(r.id, 'DELIVERED')} className="mt-4 text-[7px] font-black text-theme-muted uppercase border border-theme-border px-3 py-1.5 hover:text-white transition-all">CONFIRMAR ENTREGA</button>
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
           <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
              {/* Sidebar de Ativos */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-[9px] font-black text-theme-muted uppercase tracking-widest border-b border-theme-border/60 pb-4">
                    <Printer size={12} className="text-brand-tactical" /> Hardware & Ativos
                 </div>
                 <div className="space-y-3">
                    {suppliers.map(s => (
                      <button key={s.id} onClick={() => setSelectedSupplierId(s.id)} className={`w-full p-6 text-left border transition-all relative shadow-sm ${selectedSupplierId === s.id ? 'bg-brand-tactical/5 border-brand-tactical shadow-[0_0_20px_rgba(133,185,172,0.1)]' : 'bg-theme-bg border-theme-border/60 hover:border-zinc-500'}`}>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-4 shadow-sm">
                            <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block">Unitário Operacional</span>
                            <p className="text-2xl font-heading font-black text-theme-text italic">{formatCurrency(breakeven.costPerPhoto)}</p>
                         </div>
                         <div className="bg-theme-bg border border-theme-border/60 p-6 space-y-4 shadow-sm">
                            <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block">Valor do Equipamento</span>
                            <p className="text-2xl font-heading font-black text-theme-text italic">{formatCurrency(breakeven.printerCost)}</p>
                         </div>
                         <div className="bg-brand-tactical/5 border border-brand-tactical p-6 space-y-4 shadow-md">
                            <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block">Fotos para Amortizar</span>
                            <p className="text-2xl font-heading font-black text-brand-tactical italic">{breakeven.photosToBreakeven} <span className="text-[10px] uppercase font-sans">un</span></p>
                         </div>
                      </div>

                      <div className="bg-theme-bg border border-theme-border/60 p-10 relative overflow-hidden group shadow-sm">
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
                                  <tr className="border-b border-theme-border/30 bg-black/5 text-[9px] font-black uppercase tracking-widest text-theme-muted">
                                     <th className="p-4">Investimento</th>
                                     <th className="p-4 text-center">Volume ROI</th>
                                     <th className="p-4 text-right">Tempo Est.</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-theme-border/20">
                                  {breakeven.scenarios.map(s => (
                                    <tr key={s.printerPrice} className="hover:bg-white/5 transition-all text-[11px] font-black text-theme-text uppercase">
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
                   <div className="h-64 bg-theme-bg border border-theme-border/60 flex flex-col items-center justify-center space-y-4 shadow-sm">
                      <Calculator size={32} strokeWidth={1} className="text-theme-muted opacity-40" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-theme-muted">Carregando análise financeira...</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* VIEW: ASSETS / SUPPLIERS */}
      {view === "suppliers" && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="flex justify-between items-center border-b border-theme-border/30 pb-6">
              <h3 className="text-xl font-heading text-theme-text uppercase tracking-tighter">Ativos & Hardware</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-tactical text-zinc-950 px-6 py-3 text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <Plus size={12} /> NOVO EQUIPAMENTO
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map(s => (
                <div key={s.id} className="bg-theme-bg-muted border border-theme-border p-8 space-y-6 group hover:border-brand-tactical transition-all relative">
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

      {/* NOTIFICATIONS */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[300] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-8 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_40px_rgba(133,185,172,0.15)]' : 'border-red-900 bg-zinc-950'} min-w-[350px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-2">
                 <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>Protocolo de Impressão</span>
                 <p className="text-[13px] font-bold text-white uppercase tracking-widest mt-1 leading-tight">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

function NewSupplierModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
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

  const inputClass = "w-full bg-theme-bg border border-theme-border/60 p-3 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical transition-all uppercase placeholder:text-theme-muted/30";
  const labelClass = "text-[7px] font-black text-theme-muted uppercase tracking-widest block mb-1.5 opacity-60";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10">
       <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" onClick={onClose} />
       <div className="bg-theme-bg border border-theme-border/60 w-full max-w-2xl relative animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <h2 className="text-2xl font-heading font-black text-theme-text uppercase tracking-tighter">Novo Equipamento</h2>
                   <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] font-black italic">Cadastrar ativo fixo ou fulfillment</p>
                </div>
                <button onClick={onClose} className="text-theme-muted hover:text-white transition-all"><X size={20} /></button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className={labelClass}>Nome do Ativo</label>
                      <input required className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Impressora Lab Central" />
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>Tipo de Operação</label>
                      <select className={inputClass} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                         <option value="OWN_PRINTER">Impressora Própria</option>
                         <option value="EXTERNAL_LAB">Laboratório Externo</option>
                         <option value="HYBRID">Híbrido</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className={labelClass}>Modelo / Hardware</label>
                      <input className={inputClass} value={form.printerModel} onChange={e => setForm({...form, printerModel: e.target.value})} placeholder="Ex: Epson L805" />
                   </div>
                   <div className="space-y-1.5">
                      <label className={labelClass}>CAPEX (Custo de Compra)</label>
                      <input type="number" step="0.01" className={inputClass} value={form.printerCost} onChange={e => setForm({...form, printerCost: e.target.value})} placeholder="R$ 0,00" />
                   </div>
                </div>

                <div className="pt-8 border-t border-theme-border/20">
                   <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-6">Custos Operacionais (OPEX)</span>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                         <label className={labelClass}>Papel/Tinta</label>
                         <input required type="number" step="0.0001" className={inputClass} value={form.costPer10x15} onChange={e => setForm({...form, costPer10x15: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="space-y-1.5">
                         <label className={labelClass}>Caixa/Emb.</label>
                         <input required type="number" step="0.01" className={inputClass} value={form.boxCost} onChange={e => setForm({...form, boxCost: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="space-y-1.5">
                         <label className={labelClass}>Etiqueta</label>
                         <input required type="number" step="0.01" className={inputClass} value={form.labelCost} onChange={e => setForm({...form, labelCost: e.target.value})} placeholder="0.00" />
                      </div>
                      <div className="space-y-1.5">
                         <label className={labelClass}>Logística</label>
                         <input required type="number" step="0.01" className={inputClass} value={form.uberCost} onChange={e => setForm({...form, uberCost: e.target.value})} placeholder="0.00" />
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={onClose} className="flex-1 py-4 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-white transition-all">Cancelar</button>
                   <button type="submit" className="flex-1 py-4 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all">Salvar Equipamento</button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
}
