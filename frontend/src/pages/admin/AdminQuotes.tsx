import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API } from "../../lib/api";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Search, User, Plus, 
  Zap, X, Camera, Video, Smartphone, Flame
} from "lucide-react";
import { MERLIN_EQUIPMENT, STAFF_ROLES } from "../../data/merlin_pricing";

interface Quote {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  location: string;
  description: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  urgency?: "HIGH" | "MEDIUM" | "LOW";
  priceBase: number;
  quoteStatus: "PENDING" | "PRICED" | "APROVADO" | "REJECTED" | "CONVERTED";
  usageType: string;
  eventHours?: number;
  temFoto?: boolean;
  temVideo?: boolean;
  temReels?: boolean;
  temFotoEditada?: boolean;
  temVideoEditado?: boolean;
  temFotoImpressa?: boolean;
  temAlbumImpresso?: boolean;
  createdAt: string;
}

interface StaffBreakdown {
  ID?: string;
  id?: string;
  LABEL?: string;
  label?: string;
  COST?: number;
  cost?: number;
  USER_ID?: string;
  userId?: string;
}

interface EquipBreakdown {
  ID?: string;
  id?: string;
  QTY?: number;
  qty?: number;
}

interface BudgetBreakdown {
  STAFF?: StaffBreakdown[];
  EQUIPMENT?: EquipBreakdown[];
  MARGIN?: number;
  margin?: number;
}

export const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Quote["quoteStatus"] | "ALL">("ALL");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const detailsRef = React.useRef<HTMLDivElement>(null);

  // Scroll to details on mobile when a quote is selected
  useEffect(() => {
    if (selectedQuote && window.innerWidth < 1024) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedQuote]);

  const [activeTab, setActiveTab] = useState<"briefing" | "equipe" | "locacao" | "custos" | "fechamento">("briefing");
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState<{id: string, name: string}[]>([]);

  // Pricing States
  const [selectedStaff, setSelectedStaff] = useState<{instanceId: string, id: string, label: string, cost: number, userId?: string}[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<{id: string, qty: number}[]>([]);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [lodgingCost, setLodgingCost] = useState<number>(0);
  const [margin, setMargin] = useState(30); 
  const [isSplit, setIsSplit] = useState(true);
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  const [professionals, setProfessionals] = useState<{id: string, nome: string, profissional?: { workflowType: string[] }}[]>([]);

  // Advanced New Quote Form State
  const [newQuoteData, setNewQuoteData] = useState({
    nomeNoivos: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    dataEvento: "",
    location: "",
    description: "",
    priceBase: 0,
    urgency: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    temFoto: true,
    temVideo: false,
    temReels: false
  });

  const parseBreakdown = useCallback((description: string) => {
    if (!description) return null;
    // Robust parsing for budget breakdown JSON
    const match = description.match(/\[BUDGET_BREAKDOWN\]\s*(\{.*?\})/s);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }, []);

  const fetchProfessionals = useCallback(async () => {
    try {
      const { data } = await API.get("/admin/users", { params: { role: "PROFISSIONAL" } });
      setProfessionals(data || []);
    } catch (err) {
      console.error("Erro ao carregar profissionais:", err);
    }
  }, []);

  const fetchServiceCatalog = useCallback(async () => {
    try {
      const { data } = await API.get("/public/service-catalog");
      setServiceCatalog(data || []);
    } catch (err) {
      console.error("Erro ao carregar catálogo de serviços:", err);
    }
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const qRes = await API.get("/admin/quotes", { params: { q: search } });
      setQuotes(qRes.data.quotes || []);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQuotes();
    fetchProfessionals();
    fetchServiceCatalog();
  }, [fetchQuotes, fetchProfessionals, fetchServiceCatalog]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = !search || 
        q.nomeNoivos.toLowerCase().includes(search.toLowerCase()) || 
        q.id.toLowerCase().includes(search.toLowerCase()) ||
        q.clientName.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || q.quoteStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  const getStatusConfig = (status: Quote["quoteStatus"]) => {
    const configs: Record<Quote["quoteStatus"], { label: string, color: string, bg: string, border: string }> = {
      PENDING: { label: "PENDENTE", color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" },
      PRICED: { label: "PRECIFICADO", color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
      APROVADO: { label: "APROVADO", color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
      REJECTED: { label: "REJEITADO", color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/20" },
      CONVERTED: { label: "CONVERTIDO", color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" }
    };
    return configs[status] || configs.PENDING;
  };

  // Sync pricing states with selected quote
  useEffect(() => {
    if (selectedQuote) {
      const data = parseBreakdown(selectedQuote.description);
      if (data) {
        const breakdown = data as BudgetBreakdown;
        if (breakdown.STAFF) setSelectedStaff(breakdown.STAFF.map((s) => ({
          instanceId: Math.random().toString(36).substr(2, 9),
          id: s.ID || s.id || "", 
          label: s.LABEL || s.label || "", 
          cost: Number(s.COST || s.cost || 0), 
          userId: s.USER_ID || s.userId || ""
        })));
        if (breakdown.EQUIPMENT) setSelectedEquip(breakdown.EQUIPMENT.map((e) => ({
          id: e.ID || e.id || "", 
          qty: Number(e.QTY || e.qty || 0)
        })));
        if (breakdown.MARGIN || breakdown.margin) setMargin(Number(breakdown.MARGIN || breakdown.margin));
      } else {
        setSelectedStaff([]);
        setSelectedEquip([]);
        setMargin(30);
      }
      setTransportCost(0);
      setLodgingCost(0);
      setFinalPrice(0);
      setActiveTab("briefing");
    }
  }, [selectedQuote, parseBreakdown]);

  const staffTotal = selectedStaff.reduce((acc, s) => acc + (s.cost || 0), 0);
  const equipTotal = selectedEquip.reduce((acc, e) => {
    const item = MERLIN_EQUIPMENT.find(m => m.id === e.id);
    return acc + (item ? item.price * e.qty : 0);
  }, 0);
  const costTotal = staffTotal + equipTotal + transportCost + lodgingCost;
  const suggestedPrice = costTotal > 0 ? costTotal / (1 - margin / 100) : 0;

  useEffect(() => {
    if (suggestedPrice > 0) setFinalPrice(Math.ceil(suggestedPrice));
  }, [suggestedPrice]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter(q => q.quoteStatus === "PENDING").length;
    const highUrgency = quotes.filter(q => q.urgency === "HIGH").length;
    const totalValue = quotes.reduce((acc, q) => acc + (q.priceBase || 0), 0);
    return { total, pending, highUrgency, totalValue };
  }, [quotes]);

  const handleApprove = async () => {
    if (!selectedQuote || finalPrice <= 0) return;
    setApproving(true);
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/approve`, { 
        finalPrice,
        isSplit,
        breakdown: { staff: selectedStaff, equipment: selectedEquip, costTotal, margin }
      });
      setNotification({ message: "Orçamento aprovado com sucesso!", type: 'success' });
      setSelectedQuote(null);
      fetchQuotes();
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification({ message: "Erro ao processar aprovação.", type: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedQuote) return;
    const reason = prompt("MOTIVO DA REJEIÇÃO:");
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/reject`, { reason });
      setNotification({ message: "Orçamento arquivado.", type: 'success' });
      setSelectedQuote(null);
      fetchQuotes();
    } catch {
      setNotification({ message: "Erro ao arquivar.", type: 'error' });
    }
  };

  const handleCreateNewQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/admin/quotes", {
        ...newQuoteData,
        usageType: "VENDA_DIRETA",
        quoteStatus: "PENDING"
      });
      setIsNewQuoteModalOpen(false);
      setNewQuoteData({ nomeNoivos: "", clientName: "", clientEmail: "", clientPhone: "", dataEvento: "", location: "", description: "", priceBase: 0, urgency: "MEDIUM", temFoto: true, temVideo: false, temReels: false });
      fetchQuotes();
      setNotification({ message: "Novo lead cadastrado!", type: 'success' });
    } catch {
      setNotification({ message: "Erro ao cadastrar lead.", type: 'error' });
    }
  };

  const addStaffPreset = (roleId: string) => {
    const role = STAFF_ROLES.find(r => r.id === roleId) || { id: "custom", name: "OUTROS", avgCost: 0 };
    const existingCount = selectedStaff.filter(s => s.id === roleId).length;
    
    let baseName = role.name.toUpperCase();
    if (roleId === "photographer") baseName = "FOTÓGRAFO";
    if (roleId === "videographer") baseName = "CINEGRAFISTA";
    
    const label = roleId === "custom" ? "NOVA FUNÇÃO" : `${existingCount + 1}º ${baseName}`;

    setSelectedStaff([...selectedStaff, { 
      instanceId: Math.random().toString(36).substr(2, 9),
      id: roleId, 
      label, 
      cost: role.avgCost || 0, 
      userId: "" 
    }]);
  };

  const removeStaffInstance = (instanceId: string) => {
    setSelectedStaff(selectedStaff.filter(s => s.instanceId !== instanceId));
  };

  const updateStaffUser = (instanceId: string, userId: string) => {
    setSelectedStaff(selectedStaff.map(s => s.instanceId === instanceId ? { ...s, userId } : s));
  };

  const addEquip = (id: string) => {
    const exists = selectedEquip.find(e => e.id === id);
    if (exists) {
      setSelectedEquip(selectedEquip.map(e => e.id === id ? { ...e, qty: e.qty + 1 } : e));
    } else {
      setSelectedEquip([...selectedEquip, { id, qty: 1 }]);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border pb-10">
        <div>
          <h2 className="text-4xl md:text-6xl font-display text-theme-text uppercase font-black italic leading-none pt-2 tracking-tighter">Gestão de Orçamentos</h2>
          <p className="text-[10px] text-emerald-500 uppercase tracking-[0.5em] mt-4 font-black italic">Controle Administrativo de Propostas</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 w-full lg:w-auto">
          <div className="flex flex-col gap-2.5 w-full md:w-auto">
            <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-1">Filtro de Status</label>
            <div className="flex items-center gap-1.5 bg-theme-bg-muted p-1.5 border border-theme-border rounded-sm">
              {(['ALL', 'PENDING', 'PRICED', 'APROVADO', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${statusFilter === s ? 'bg-theme-text text-theme-bg shadow-lg' : 'text-theme-text-muted hover:text-white'}`}
                >
                  {s === 'ALL' ? 'Todos' : s === 'APROVADO' ? 'Aprov.' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full md:w-auto">
            <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-1">Busca Rápida</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted" size={16} />
              <input
                type="text"
                placeholder="CLIENTE, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-72 bg-theme-bg-muted border border-theme-border p-4 pl-12 text-[11px] text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all font-bold rounded-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto self-end">
            <button 
              onClick={() => setIsNewQuoteModalOpen(true)}
              className="bg-emerald-500 text-white font-display font-black uppercase tracking-[0.2em] px-10 py-5 text-[11px] flex items-center justify-center gap-3 hover:brightness-110 shadow-xl transition-all active:scale-95 italic"
            >
              <Plus size={18} /> NOVO ORÇAMENTO
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* List of Quotes */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
             <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/20 rounded-sm">
                <div className="text-[10px] text-theme-text-muted animate-pulse uppercase tracking-[0.4em] font-bold">Carregando dados...</div>
             </div>
          ) : filteredQuotes.length > 0 ? (
            filteredQuotes.map((quote) => {
              const status = getStatusConfig(quote.quoteStatus);
              return (
                <div 
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className={`p-6 border transition-all relative overflow-hidden group ${selectedQuote?.id === quote.id ? 'border-white bg-theme-card shadow-2xl ring-1 ring-white/10' : 'border-theme-border bg-theme-card/40 hover:border-theme-border-2 hover:bg-theme-card/80'}`}
                  style={{ cursor: "pointer" }}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${quote.urgency === 'HIGH' ? 'bg-red-500' : 'bg-emerald-500 opacity-20'}`} />
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border ${status.border} ${status.bg} ${status.color} italic`}>
                           {status.label}
                         </span>
                         {quote.urgency === 'HIGH' && (
                           <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 border border-red-500/20 animate-pulse">
                             <Flame size={10} className="text-red-500" />
                             <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Urgente</span>
                           </div>
                         )}
                      </div>
                      <span className="text-xl text-theme-text font-display font-black italic tracking-tighter">
                         {quote.priceBase ? `R$ ${quote.priceBase.toLocaleString()}` : "S/ VALOR"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-2xl font-display font-black text-theme-text uppercase tracking-tighter italic group-hover:text-emerald-500 transition-colors">
                        {quote.nomeNoivos}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-theme-border">
                      <div className="flex items-center gap-2.5 text-[10px] text-theme-muted font-black uppercase tracking-widest italic truncate max-w-[65%]">
                        {quote.clientName || "CLIENTE NÃO INFORMADO"}
                      </div>
                      <span className="text-[9px] font-black text-theme-subtle uppercase tracking-[0.2em] italic">
                         #{quote.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-32 text-center border border-dashed border-theme-border/40 bg-theme-bg-muted/10 flex flex-col items-center justify-center rounded-sm">
              <div className="w-16 h-16 bg-theme-bg-muted border border-theme-border flex items-center justify-center rounded-full mb-6 opacity-30">
                <Briefcase size={24} className="text-theme-text-muted" />
              </div>
              <p className="text-[10px] text-theme-text-muted uppercase tracking-[0.4em] font-black max-w-[200px] leading-relaxed">Nenhum protocolo encontrado com estes filtros.</p>
              <button onClick={() => { setStatusFilter("ALL"); setSearch(""); }} className="mt-6 text-[8px] font-black text-brand-tactical uppercase tracking-widest border-b border-brand-tactical/20 pb-1 hover:border-brand-tactical transition-all">Limpar Filtros</button>
            </div>
          )}
        </div>

        {/* Selected Details & Budgeting Studio */}
        <div ref={detailsRef} className="lg:col-span-7 lg:sticky lg:top-10 h-fit">
          {selectedQuote ? (
            <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500 shadow-2xl rounded-sm">
               <div className="flex justify-between items-center border-b border-theme-border pb-4 md:pb-6">
                 <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-heading font-black text-theme-text uppercase tracking-tight leading-none">{selectedQuote.nomeNoivos}</h3>
                    <p className="text-[9px] md:text-[10px] text-theme-text-muted font-bold uppercase tracking-widest">Protocolo: {selectedQuote.id.toUpperCase()}</p>
                 </div>
                 <button onClick={() => setSelectedQuote(null)} className="text-theme-text-muted hover:text-red-500 transition-colors"><X size={20}/></button>
               </div>

               <div className="flex gap-4 border-b border-theme-border pb-4 overflow-x-auto no-scrollbar scroll-smooth">
                 {(['briefing', 'equipe', 'locacao', 'custos', 'fechamento'] as const).map(t => (
                   <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap px-4 italic ${activeTab === t ? 'text-emerald-500' : 'text-theme-subtle hover:text-white'}`}
                   >
                     {t === 'briefing' ? '1. Briefing' : t === 'equipe' ? '2. Equipe' : t === 'locacao' ? '3. Locação' : t === 'custos' ? '4. Custos' : '5. Fechamento'}
                     {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                   </button>
                 ))}
               </div>

               <div className="min-h-[450px]">
                  {activeTab === 'briefing' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white/[0.02] p-8 border border-theme-border rounded-sm">
                         <div className="space-y-1.5"><span className="text-[10px] font-black text-theme-subtle uppercase tracking-widest italic">Data</span><p className="text-lg font-display font-black text-theme-text uppercase tracking-tighter italic">{new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")}</p></div>
                         <div className="space-y-1.5"><span className="text-[10px] font-black text-theme-subtle uppercase tracking-widest italic">Base Cliente</span><p className="text-lg font-display font-black text-emerald-500 uppercase tracking-tighter italic">R$ {selectedQuote.priceBase?.toLocaleString() || "---"}</p></div>
                         <div className="space-y-1.5"><span className="text-[10px] font-black text-theme-subtle uppercase tracking-widest italic">Local</span><p className="text-lg font-display font-black text-theme-text uppercase truncate tracking-tighter italic">{selectedQuote.location || "N/A"}</p></div>
                         <div className="space-y-1.5"><span className="text-[10px] font-black text-theme-subtle uppercase tracking-widest italic">Email</span><p className="text-lg font-display font-black text-theme-text lowercase truncate tracking-tighter italic">{selectedQuote.clientEmail}</p></div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-l border-emerald-500 pl-4 italic">Serviços Solicitados</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedQuote.temVideo && <span className="bg-emerald-500/5 text-emerald-500 text-[9px] font-black px-4 py-2 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-2 italic"><Video size={10}/> VÍDEO</span>}
                          {selectedQuote.temReels && <span className="bg-emerald-500/5 text-emerald-500 text-[9px] font-black px-4 py-2 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-2 italic"><Smartphone size={10}/> REELS</span>}
                        </div>
                      </div>

                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3">Observações do Lead</h4>
                         {(() => {
                            const data = parseBreakdown(selectedQuote.description);
                            const cleanText = selectedQuote.description.replace(/\[BUDGET_BREAKDOWN\].*?(\n\n|$)/s, "").replace(/\[REJECTED_REASON\].*?$/s, "").trim();
                            
                            return (
                              <div className="space-y-6">
                                {data && (
                                  <div className="bg-brand-tactical/5 p-4 border border-brand-tactical/10 rounded-sm">
                                     <span className="text-[8px] font-bold text-brand-tactical uppercase tracking-widest block mb-2 opacity-70">Simulação Prévia</span>
                                     <div className="flex gap-10 text-[10px]">
                                        <div><span className="text-theme-text-muted">Equipe:</span> <span className="text-theme-text font-black">{(data as BudgetBreakdown).STAFF?.map((s) => s.LABEL || s.label).join(", ")}</span></div>
                                        <div><span className="text-theme-text-muted">Margem:</span> <span className="text-brand-tactical font-black">{(data as BudgetBreakdown).MARGIN || (data as BudgetBreakdown).margin}%</span></div>
                                     </div>
                                  </div>
                                )}
                                <div className="bg-theme-bg p-6 border border-theme-border text-[12px] text-theme-text leading-relaxed font-medium italic whitespace-pre-wrap rounded-sm shadow-inner">
                                  {(() => {
                                    let text = cleanText;
                                    // Resolve "Serviços: ID1, ID2..."
                                    const serviceMatch = text.match(/Serviços: (.*)/);
                                    if (serviceMatch && serviceCatalog.length > 0) {
                                      const ids = serviceMatch[1].split(",").map(id => id.trim());
                                      const names = ids.map(id => {
                                        const s = serviceCatalog.find(sc => sc.id === id);
                                        return s ? s.name : id;
                                      });
                                      text = text.replace(serviceMatch[0], `Serviços: ${names.join(", ")}`);
                                    }
                                    return text || "Nenhuma observação adicional fornecida.";
                                  })()}
                                </div>
                              </div>
                            );
                         })()}
                      </div>
                    </div>
                  )}

                  {activeTab === 'equipe' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {STAFF_ROLES.map(role => {
                           const instances = selectedStaff.filter(s => s.id === role.id).length;
                           return (
                            <button 
                              key={role.id} 
                              onClick={() => addStaffPreset(role.id)} 
                              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded-sm flex items-center justify-center gap-2 ${instances > 0 ? 'border-brand-tactical bg-brand-tactical/10 text-brand-tactical' : 'border-theme-border bg-theme-bg text-theme-text-muted hover:border-brand-tactical/50'}`}
                            >
                              {role.name}
                              {instances > 0 && <span className="bg-brand-tactical text-brand-text px-1.5 py-0.5 rounded-full text-[8px]">{instances}</span>}
                              <Plus size={12} className={instances > 0 ? "opacity-100" : "opacity-30"} />
                            </button>
                           );
                        })}
                        <button 
                          onClick={() => addStaffPreset("custom")} 
                          className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-dashed border-theme-border bg-theme-bg/40 text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical transition-all rounded-sm flex items-center justify-center gap-2"
                        >
                          OUTROS <Plus size={12} />
                        </button>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-theme-border/20">
                         <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3">Distribuição de Cachês</h4>
                         {selectedStaff.length > 0 ? (
                           <div className="space-y-3">
                             {selectedStaff.map(s => (
                                <div key={s.instanceId} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-theme-bg p-4 border border-theme-border group hover:border-brand-tactical/30 transition-all rounded-sm relative">
                                   <div className="md:col-span-4">
                                      <input 
                                        type="text"
                                        value={s.label}
                                        onChange={(e) => setSelectedStaff(selectedStaff.map(st => st.instanceId === s.instanceId ? { ...st, label: e.target.value.toUpperCase() } : st))}
                                        className="w-full bg-transparent border-none text-[11px] font-black uppercase tracking-tight text-theme-text outline-none focus:text-brand-tactical p-0 mb-1"
                                      />
                                      <span className="text-[9px] font-bold text-brand-tactical">Sugerido: R$ {STAFF_ROLES.find(r => r.id === s.id)?.avgCost || s.cost}</span>
                                   </div>
                                   
                                   <div className="md:col-span-5 relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted opacity-30" size={12} />
                                      <select 
                                        value={s.userId || ""} 
                                        onChange={(e) => updateStaffUser(s.instanceId, e.target.value)}
                                        className="w-full bg-theme-bg-muted border border-theme-border p-2.5 pl-10 text-[10px] font-bold text-theme-text outline-none focus:border-brand-tactical appearance-none uppercase tracking-widest rounded-sm"
                                      >
                                         <option value="">PROFISSIONAL...</option>
                                         {(() => {
                                            const eventPref = selectedQuote?.description?.includes("Preferência: MOBILE") ? "MOBILE" : 
                                                            selectedQuote?.description?.includes("Preferência: TRADICIONAL") ? "TRADICIONAL" : null;
                                            
                                            // Se houver preferência, filtramos. Se for AMBOS ou N/A, mostra todos.
                                            const filtered = professionals.filter(p => {
                                              if (!eventPref) return true;
                                              const proTypes = p.profissional?.workflowType || [];
                                              if (proTypes.length === 0) return true; // Se não tem preferência cadastrada, mostra
                                              return proTypes.includes(eventPref);
                                            });

                                            return filtered.map(p => {
                                              const workflowStr = p.profissional?.workflowType ? p.profissional.workflowType.join(", ") : "";
                                              return (
                                                <option key={p.id} value={p.id}>
                                                  {p.nome} {workflowStr ? `(${workflowStr})` : ""}
                                                </option>
                                              );
                                            });
                                          })()}
                                      </select>
                                   </div>

                                   <div className="md:col-span-3 flex items-center gap-2">
                                      <div className="relative flex-1">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-theme-text-muted opacity-50">R$</span>
                                         <input 
                                           type="number" 
                                           value={s.cost} 
                                           onChange={(e) => setSelectedStaff(selectedStaff.map(st => st.instanceId === s.instanceId ? {...st, cost: Number(e.target.value)} : st))}
                                           className="w-full bg-theme-bg-muted border border-theme-border p-2.5 pl-9 text-[11px] font-black text-brand-tactical outline-none focus:border-brand-tactical rounded-sm"
                                         />
                                      </div>
                                      <button 
                                        onClick={() => removeStaffInstance(s.instanceId)}
                                        className="p-2.5 text-theme-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm"
                                      >
                                        <X size={14} />
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </div>
                         ) : (
                           <div className="py-12 text-center border border-dashed border-theme-border bg-theme-bg/5 rounded-sm">
                             <p className="text-[10px] text-theme-text-muted uppercase tracking-widest font-bold opacity-50">Selecione os papéis para este evento.</p>
                           </div>
                         )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'locacao' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="max-h-[450px] overflow-y-auto space-y-3 pr-3 custom-scrollbar border-b border-theme-border pb-6">
                        <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3 mb-4">Locação de Equipamentos</h4>
                        {MERLIN_EQUIPMENT.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-theme-bg border border-theme-border hover:border-brand-tactical transition-all rounded-sm group">
                            <div>
                               <p className="text-[11px] font-black uppercase tracking-tight text-theme-text">{item.name}</p>
                               <p className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest">{item.category} | Diária: R$ {item.price}</p>
                            </div>
                            <button onClick={() => addEquip(item.id)} className="p-2 text-brand-tactical hover:bg-brand-tactical hover:text-brand-text transition-all rounded-sm"><Plus size={18} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'custos' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3 mb-4">Logística e Despesas Extras</h4>
                      <div className="grid grid-cols-2 gap-6 pt-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Deslocamento (R$)</label>
                           <input type="number" value={transportCost} onChange={e => setTransportCost(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border p-3 text-[12px] font-black text-theme-text outline-none focus:border-brand-tactical rounded-sm" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Hospedagem (R$)</label>
                           <input type="number" value={lodgingCost} onChange={e => setLodgingCost(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border p-3 text-[12px] font-black text-theme-text outline-none focus:border-brand-tactical rounded-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'fechamento' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                      <div className="bg-theme-bg p-10 border border-theme-border space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-px h-full bg-emerald-500" />
                        
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic text-theme-muted">
                           <span>Custo Total Previsto</span>
                           <span className="text-theme-text text-xl font-display font-black italic tracking-tighter">R$ {costTotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-theme-border">
                           <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted italic">Margem Operacional (%)</span>
                           <input 
                             type="number" 
                             value={margin} 
                             onChange={e => setMargin(Number(e.target.value))}
                             className="w-24 bg-theme-card border border-theme-border p-3 text-lg font-display font-black text-emerald-500 text-center outline-none focus:border-emerald-500 italic" 
                           />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-theme-border">
                           <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted italic">Parcelamento (50/50)</span>
                           <button 
                             onClick={() => setIsSplit(!isSplit)}
                             className={`px-8 py-3 text-[9px] font-black uppercase border transition-all italic ${isSplit ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-theme-border text-theme-subtle bg-white/5'}`}
                           >
                             {isSplit ? 'Ativo' : 'Inativo'}
                           </button>
                        </div>
                        
                        <div className="pt-10 border-t border-theme-border flex justify-between items-end">
                           <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 block italic">Sugestão Foto Segundo</span>
                              <p className="text-[9px] text-theme-subtle font-black italic uppercase tracking-widest">Cálculo técnico inteligente</p>
                           </div>
                           <span className="text-5xl font-display font-black text-emerald-500 tracking-tighter italic">
                              R$ {Math.ceil(suggestedPrice).toLocaleString()}
                           </span>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-theme-muted uppercase tracking-[0.4em] text-center block italic">Valor Final da Proposta</label>
                           <input type="number" value={finalPrice} onChange={(e) => setFinalPrice(Number(e.target.value))} className="w-full bg-black border border-emerald-500/30 p-10 text-7xl font-display font-black text-theme-text outline-none text-center tracking-tighter italic shadow-[0_0_50px_rgba(16,185,129,0.1)] focus:border-emerald-500 transition-all" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <button 
                              onClick={handleReject}
                              className="bg-theme-card text-red-500 border border-red-500/20 p-6 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-4 italic"
                            >
                              ARQUIVAR
                            </button>
                            <button 
                              onClick={handleApprove} 
                              disabled={finalPrice <= 0 || approving} 
                              className="md:col-span-3 bg-emerald-500 text-white p-6 text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50 italic"
                            >
                              {approving ? "ENVIANDO..." : <><Zap size={22} /> DISPARAR ORÇAMENTO OFICIAL</>}
                            </button>
                         </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="h-full border border-theme-border bg-theme-bg-muted/10 flex flex-col items-center justify-center p-12 text-center rounded-sm min-h-[600px] relative overflow-hidden">
               {/* Background Decorative Elements */}
               <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-tactical rounded-full blur-[120px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500 rounded-full blur-[120px]" />
               </div>

               <div className="relative mb-16 flex items-center justify-center">
                  <div className="w-56 h-56 border border-theme-border/40 rounded-full flex items-center justify-center bg-theme-bg/40 backdrop-blur-sm shadow-inner">
                    <Briefcase size={80} className="text-theme-text-muted opacity-10" strokeWidth={1} />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-brand-tactical/5 rounded-full border-dashed" 
                  />
               </div>

               <div className="space-y-4 mb-20 max-w-sm">
                 <h4 className="text-[11px] font-black text-theme-text uppercase tracking-[0.6em] italic">Radar de Propostas</h4>
                 <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-[0.2em] leading-relaxed opacity-40">Selecione um lead operacional na lista lateral para iniciar o processamento técnico e financeiro.</p>
               </div>
               
               <div className="grid grid-cols-3 gap-12 pt-16 border-t border-theme-border/30 w-full max-w-md">
                  <div className="space-y-2">
                    <span className="text-[8px] text-theme-text-muted font-black uppercase tracking-[0.3em] block opacity-50">Pendentes</span>
                    <p className="text-4xl font-heading font-black text-theme-text tracking-tighter italic">{stats.pending}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[8px] text-theme-text-muted font-black uppercase tracking-[0.3em] block opacity-50">Volume Total</span>
                    <p className="text-4xl font-heading font-black text-brand-tactical tracking-tighter italic">R$ {(stats.totalValue / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[8px] text-theme-text-muted font-black uppercase tracking-[0.3em] block opacity-50">Alta Prioridade</span>
                    <p className="text-4xl font-heading font-black text-red-500 tracking-tighter italic">{stats.highUrgency}</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW QUOTE MODAL */}
      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setIsNewQuoteModalOpen(false)} />
           <div className="relative border border-theme-border w-full max-w-lg p-8 space-y-6 overflow-y-auto max-h-[95vh] shadow-2xl bg-theme-bg animate-in zoom-in-95 duration-500 rounded-sm">
              <div className="flex justify-between items-start border-b border-theme-border/20 pb-4">
                 <div className="space-y-1">
                    <h3 className="text-xl font-heading font-black uppercase tracking-tight text-theme-text">Novo Lead Administrativo</h3>
                    <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest">Abertura de Protocolo Direto</p>
                 </div>
                 <button onClick={() => setIsNewQuoteModalOpen(false)} className="text-theme-text-muted hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateNewQuote} className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Evento (Título)</label>
                       <input required placeholder="EX: CASAMENTO ANA & LEO" value={newQuoteData.nomeNoivos} onChange={e => setNewQuoteData({...newQuoteData, nomeNoivos: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-theme-text outline-none focus:border-brand-tactical font-bold rounded-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Data do Evento</label>
                       <input required type="date" value={newQuoteData.dataEvento} onChange={e => setNewQuoteData({...newQuoteData, dataEvento: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-theme-text outline-none focus:border-brand-tactical font-bold rounded-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Nome do Cliente</label>
                       <input required placeholder="NOME COMPLETO" value={newQuoteData.clientName} onChange={e => setNewQuoteData({...newQuoteData, clientName: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-theme-text outline-none focus:border-brand-tactical font-bold rounded-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">WhatsApp / Celular</label>
                       <input required placeholder="DDD 9XXXX-XXXX" value={newQuoteData.clientPhone} onChange={e => setNewQuoteData({...newQuoteData, clientPhone: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-brand-tactical outline-none focus:border-brand-tactical font-black rounded-sm" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">E-mail</label>
                       <input required type="email" placeholder="CLIENTE@EMAIL.COM" value={newQuoteData.clientEmail} onChange={e => setNewQuoteData({...newQuoteData, clientEmail: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-theme-text outline-none focus:border-brand-tactical font-bold rounded-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Orçamento Estimado (R$)</label>
                       <input type="number" placeholder="VALOR BASE" value={newQuoteData.priceBase} onChange={e => setNewQuoteData({...newQuoteData, priceBase: Number(e.target.value)})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-brand-tactical outline-none focus:border-brand-tactical font-black rounded-sm" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Urgência</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['HIGH', 'MEDIUM', 'LOW'] as const).map(u => (
                         <button key={u} type="button" onClick={() => setNewQuoteData({...newQuoteData, urgency: u})} className={`py-2.5 border text-[8px] font-black uppercase tracking-widest transition-all rounded-sm ${newQuoteData.urgency === u ? 'border-brand-tactical bg-brand-tactical text-brand-text shadow-md' : 'border-theme-border text-brand-text-muted hover:border-theme-text'}`}>
                           {u === 'HIGH' ? 'Urgente' : u === 'MEDIUM' ? 'Normal' : 'Baixa'}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Serviços Base</label>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setNewQuoteData({...newQuoteData, temFoto: !newQuoteData.temFoto})} className={`flex-1 py-2.5 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-sm ${newQuoteData.temFoto ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-text-muted'}`}><Camera size={12}/> FOTO</button>
                       <button type="button" onClick={() => setNewQuoteData({...newQuoteData, temVideo: !newQuoteData.temVideo})} className={`flex-1 py-2.5 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-sm ${newQuoteData.temVideo ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-text-muted'}`}><Video size={12}/> VÍDEO</button>
                       <button type="button" onClick={() => setNewQuoteData({...newQuoteData, temReels: !newQuoteData.temReels})} className={`flex-1 py-2.5 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-sm ${newQuoteData.temReels ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-text-muted'}`}><Smartphone size={12}/> REELS</button>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Descrição e Localização</label>
                    <textarea required placeholder="DETALHES ADICIONAIS..." value={newQuoteData.description} onChange={e => setNewQuoteData({...newQuoteData, description: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border p-3 text-[11px] text-theme-text outline-none focus:border-brand-tactical h-20 font-medium resize-none rounded-sm" />
                 </div>

                 <button type="submit" className="w-full bg-brand-tactical text-brand-text font-black uppercase tracking-[0.4em] py-4 text-[10px] shadow-xl hover:scale-[1.01] transition-all rounded-sm mt-4">CADASTRAR ORÇAMENTO NO RADAR</button>
              </form>
           </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[300] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-theme-bg shadow-2xl' : 'border-red-900 bg-theme-bg'} min-w-[320px] relative overflow-hidden rounded-sm`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-widest ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>Protocolo Administrativo</span>
                 <p className="text-[14px] font-bold text-theme-text uppercase tracking-tight mt-1">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-500'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
