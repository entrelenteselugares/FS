import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API } from "../../lib/api";
import { 
  Briefcase, 
  Search, User, Plus, 
  Zap, X, Phone, Camera, Video, Smartphone, Flame
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
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [activeTab, setActiveTab] = useState<"briefing" | "equipe" | "locacao" | "fechamento">("briefing");
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState<{id: string, name: string}[]>([]);

  // Pricing States
  const [selectedStaff, setSelectedStaff] = useState<{id: string, label: string, cost: number, userId?: string}[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<{id: string, qty: number}[]>([]);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [lodgingCost, setLodgingCost] = useState<number>(0);
  const [margin, setMargin] = useState(30); 
  const [isSplit, setIsSplit] = useState(true);
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  const [professionals, setProfessionals] = useState<{id: string, nome: string}[]>([]);

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

  // Sync pricing states with selected quote
  useEffect(() => {
    if (selectedQuote) {
      const data = parseBreakdown(selectedQuote.description);
      if (data) {
        const breakdown = data as BudgetBreakdown;
        if (breakdown.STAFF) setSelectedStaff(breakdown.STAFF.map((s) => ({
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

  const toggleStaffPreset = (roleId: string) => {
    const exists = selectedStaff.find(s => s.id === roleId);
    if (exists) {
      setSelectedStaff(selectedStaff.filter(s => s.id !== roleId));
    } else {
      const role = STAFF_ROLES.find(r => r.id === roleId);
      setSelectedStaff([...selectedStaff, { id: roleId, label: role?.name || "", cost: role?.avgCost || 0, userId: "" }]);
    }
  };

  const updateStaffUser = (roleId: string, userId: string) => {
    setSelectedStaff(selectedStaff.map(s => s.id === roleId ? { ...s, userId } : s));
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
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text uppercase font-black leading-none pt-2 tracking-tight">Gestão de Orçamentos</h2>
          <p className="text-[10px] text-theme-text-muted uppercase tracking-[0.4em] mt-3 font-bold">Controle Administrativo de Propostas</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted" size={14} />
            <input
              type="text"
              placeholder="PESQUISAR CLIENTE OU CÓDIGO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-theme-bg-muted border border-theme-border p-3.5 pl-10 text-[10px] text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all font-bold"
            />
          </div>
          <button 
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="w-full md:w-auto bg-brand-tactical text-brand-text font-black uppercase tracking-[0.3em] px-8 py-4 text-[10px] flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} /> NOVO ORÇAMENTO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* List of Quotes */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
             <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/20 rounded-sm">
                <div className="text-[10px] text-theme-text-muted animate-pulse uppercase tracking-[0.4em] font-bold">Carregando dados...</div>
             </div>
          ) : quotes.length > 0 ? (
            quotes.map((quote) => (
              <div 
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`p-5 border transition-all relative overflow-hidden group rounded-sm ${selectedQuote?.id === quote.id ? 'border-brand-tactical bg-brand-tactical/10 ring-1 ring-brand-tactical/30' : 'border-theme-border bg-theme-bg-muted hover:border-theme-text-muted'}`}
                style={{ cursor: "pointer" }}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${quote.urgency === 'HIGH' ? 'bg-red-500' : 'bg-brand-tactical opacity-50'}`} />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border ${quote.quoteStatus === 'PENDING' ? 'border-brand-tactical text-brand-tactical' : 'border-theme-border text-theme-text-muted'}`}>
                         {quote.quoteStatus}
                       </span>
                       {quote.urgency === 'HIGH' && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 animate-pulse"><Flame size={8}/> URGENTE</span>}
                    </div>
                    <span className="text-[11px] text-theme-text font-black">
                       {quote.priceBase ? `R$ ${quote.priceBase.toLocaleString()}` : "---"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-heading font-black text-theme-text uppercase tracking-tight group-hover:text-brand-tactical transition-colors">
                      {quote.nomeNoivos}
                    </h3>
                    <span className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest bg-theme-bg/40 px-2 py-1 border border-theme-border/50">
                      ID: {quote.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-theme-border/10 pt-3">
                    <div className="flex items-center gap-2 text-[9px] text-theme-text-muted font-bold uppercase truncate">
                      <User size={10} className="text-brand-tactical" /> {quote.clientName || "N/A"}
                    </div>
                    {quote.clientPhone && (
                      <div className="flex items-center gap-2 text-[9px] text-brand-tactical font-bold">
                        <Phone size={10} /> {quote.clientPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center border border-dashed border-theme-border flex flex-col items-center justify-center bg-theme-bg-muted/10 rounded-sm">
              <Briefcase size={32} className="text-theme-text-muted mb-4 opacity-30" />
              <p className="text-[10px] text-theme-text-muted uppercase tracking-widest font-bold">Nenhum lead encontrado.</p>
            </div>
          )}
        </div>

        {/* Selected Details & Budgeting Studio */}
        <div className="lg:col-span-7 lg:sticky lg:top-10 h-fit">
          {selectedQuote ? (
            <div className="bg-theme-bg-muted border border-theme-border p-6 md:p-10 space-y-8 animate-in slide-in-from-right-4 duration-500 shadow-2xl rounded-sm">
               <div className="flex justify-between items-center border-b border-theme-border pb-6">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-tight leading-none">{selectedQuote.nomeNoivos}</h3>
                    <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest">Protocolo: {selectedQuote.id.toUpperCase()}</p>
                 </div>
                 <button onClick={() => setSelectedQuote(null)} className="text-theme-text-muted hover:text-red-500 transition-colors"><X size={20}/></button>
               </div>

               <div className="flex gap-4 border-b border-theme-border pb-4 overflow-x-auto no-scrollbar scroll-smooth">
                 {(['briefing', 'equipe', 'locacao', 'fechamento'] as const).map(t => (
                   <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap px-4 ${activeTab === t ? 'text-brand-tactical' : 'text-theme-text-muted hover:text-theme-text'}`}
                   >
                     {t === 'briefing' ? '1. Briefing' : t === 'equipe' ? '2. Equipe' : t === 'locacao' ? '3. Custos' : '4. Fechamento'}
                     {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-tactical" />}
                   </button>
                 ))}
               </div>

               <div className="min-h-[450px]">
                  {activeTab === 'briefing' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-theme-bg/5 p-6 border border-theme-border/20 rounded-sm">
                         <div className="space-y-1"><span className="text-[8px] font-bold text-theme-text-muted uppercase tracking-widest">Data</span><p className="text-[12px] font-black text-theme-text uppercase">{new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")}</p></div>
                         <div className="space-y-1"><span className="text-[8px] font-bold text-theme-text-muted uppercase tracking-widest">Base Cliente</span><p className="text-[12px] font-black text-brand-tactical uppercase">R$ {selectedQuote.priceBase?.toLocaleString() || "---"}</p></div>
                         <div className="space-y-1"><span className="text-[8px] font-bold text-theme-text-muted uppercase tracking-widest">Local</span><p className="text-[12px] font-black text-theme-text uppercase truncate">{selectedQuote.location || "N/A"}</p></div>
                         <div className="space-y-1"><span className="text-[8px] font-bold text-theme-text-muted uppercase tracking-widest">Email</span><p className="text-[12px] font-black text-theme-text lowercase truncate">{selectedQuote.clientEmail}</p></div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3">Serviços Solicitados</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedQuote.temFoto && <span className="bg-brand-tactical/5 text-brand-tactical text-[9px] font-bold px-3 py-1.5 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-2"><Camera size={10}/> FOTOGRAFIA</span>}
                          {selectedQuote.temVideo && <span className="bg-brand-tactical/5 text-brand-tactical text-[9px] font-bold px-3 py-1.5 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-2"><Video size={10}/> VÍDEO</span>}
                          {selectedQuote.temReels && <span className="bg-brand-tactical/5 text-brand-tactical text-[9px] font-bold px-3 py-1.5 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-2"><Smartphone size={10}/> REELS</span>}
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
                           const isSelected = !!selectedStaff.find(s => s.id === role.id);
                           return (
                            <button 
                              key={role.id} 
                              onClick={() => toggleStaffPreset(role.id)} 
                              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded-sm ${isSelected ? 'border-brand-tactical bg-brand-tactical text-brand-text' : 'border-theme-border bg-theme-bg text-theme-text-muted hover:border-brand-tactical/50'}`}
                            >
                              {role.name}
                            </button>
                           );
                        })}
                      </div>

                      <div className="space-y-4 pt-6 border-t border-theme-border/20">
                         <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3">Distribuição de Cachês</h4>
                         {selectedStaff.length > 0 ? (
                           <div className="space-y-3">
                             {selectedStaff.map(s => (
                               <div key={s.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-theme-bg p-4 border border-theme-border group hover:border-brand-tactical/30 transition-all rounded-sm">
                                  <div className="md:col-span-4">
                                     <span className="text-[11px] font-black uppercase tracking-tight block text-theme-text">{s.label}</span>
                                     <span className="text-[9px] font-bold text-brand-tactical">Base: R$ {s.cost}</span>
                                  </div>
                                  
                                  <div className="md:col-span-5 relative">
                                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted opacity-30" size={12} />
                                     <select 
                                       value={s.userId || ""} 
                                       onChange={(e) => updateStaffUser(s.id, e.target.value)}
                                       className="w-full bg-theme-bg-muted border border-theme-border p-2.5 pl-10 text-[10px] font-bold text-theme-text outline-none focus:border-brand-tactical appearance-none uppercase tracking-widest rounded-sm"
                                     >
                                        <option value="">PROFISSIONAL...</option>
                                        {professionals.map(p => (
                                          <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                     </select>
                                  </div>

                                  <div className="md:col-span-3">
                                     <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-theme-text-muted opacity-50">R$</span>
                                        <input 
                                          type="number" 
                                          value={s.cost} 
                                          onChange={(e) => setSelectedStaff(selectedStaff.map(st => st.id === s.id ? {...st, cost: Number(e.target.value)} : st))}
                                          className="w-full bg-theme-bg-muted border border-theme-border p-2.5 pl-9 text-[11px] font-black text-brand-tactical outline-none focus:border-brand-tactical rounded-sm"
                                        />
                                     </div>
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
                      <div className="max-h-[350px] overflow-y-auto space-y-3 pr-3 custom-scrollbar border-b border-theme-border pb-6">
                        <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-3 mb-4">Equipamentos e Logística</h4>
                        {MERLIN_EQUIPMENT.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-theme-bg border border-theme-border hover:border-brand-tactical transition-all rounded-sm group">
                            <div>
                               <p className="text-[11px] font-black uppercase tracking-tight text-theme-text">{item.name}</p>
                               <p className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest">Diária: R$ {item.price}</p>
                            </div>
                            <button onClick={() => addEquip(item.id)} className="p-2 text-brand-tactical hover:bg-brand-tactical hover:text-brand-text transition-all rounded-sm"><Plus size={18} /></button>
                          </div>
                        ))}
                      </div>

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
                      <div className="bg-theme-bg-muted p-8 border border-theme-border space-y-6 shadow-2xl relative rounded-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-tactical" />
                        
                        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                           <span className="text-theme-text-muted">Custo Total Previsto</span>
                           <span className="text-theme-text font-black text-lg">R$ {costTotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-theme-border/10">
                           <span className="text-[11px] font-bold uppercase tracking-widest text-theme-text-muted">Margem Operacional (%)</span>
                           <input 
                             type="number" 
                             value={margin} 
                             onChange={e => setMargin(Number(e.target.value))}
                             className="w-24 bg-theme-bg border border-theme-border p-2.5 text-[14px] font-black text-brand-tactical text-center outline-none focus:border-brand-tactical rounded-sm" 
                           />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-theme-border/10">
                           <span className="text-[11px] font-bold uppercase tracking-widest text-theme-text-muted">Parcelamento (50/50)</span>
                           <button 
                             onClick={() => setIsSplit(!isSplit)}
                             className={`px-6 py-2.5 text-[9px] font-black uppercase border transition-all rounded-sm ${isSplit ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/10' : 'border-theme-border text-theme-text-muted bg-theme-bg/5'}`}
                           >
                             {isSplit ? 'Ativo' : 'Inativo'}
                           </button>
                        </div>
                        
                        <div className="pt-8 border-t border-theme-border flex justify-between items-end">
                           <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-tactical block">Sugestão Foto Segundo</span>
                              <p className="text-[10px] text-theme-text-muted font-bold italic uppercase">Cálculo técnico inteligente</p>
                           </div>
                           <span className="text-4xl font-heading font-black text-brand-tactical tracking-tighter italic">
                              R$ {Math.ceil(suggestedPrice).toLocaleString()}
                           </span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.3em] text-center block">Valor Final da Proposta</label>
                           <input type="number" value={finalPrice} onChange={(e) => setFinalPrice(Number(e.target.value))} className="w-full bg-theme-bg border-2 border-brand-tactical p-8 text-5xl font-heading font-black text-theme-text outline-none text-center tracking-tighter rounded-sm shadow-xl focus:ring-4 ring-brand-tactical/5" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <button 
                              onClick={handleReject}
                              className="bg-theme-bg-muted text-red-500 border border-red-900/30 p-6 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-4 rounded-sm"
                            >
                              ARQUIVAR
                            </button>
                            <button 
                              onClick={handleApprove} 
                              disabled={finalPrice <= 0 || approving} 
                              className="md:col-span-3 bg-brand-tactical text-brand-text p-6 text-[12px] font-black uppercase tracking-[0.5em] hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50 rounded-sm"
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
            <div className="h-full border border-theme-border bg-theme-bg-muted/10 flex flex-col items-center justify-center p-12 text-center rounded-sm min-h-[600px]">
               <div className="relative mb-12 flex items-center justify-center">
                  <div className="w-48 h-48 border border-brand-tactical/10 rounded-full flex items-center justify-center">
                    <Briefcase size={64} className="text-theme-text-muted opacity-20" />
                  </div>
                  <div className="absolute inset-0 border border-brand-tactical/5 rounded-full animate-ping" />
               </div>
               <h4 className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.5em] mb-12">Selecione um lead no radar para iniciar</h4>
               
               <div className="grid grid-cols-3 gap-12 pt-10 border-t border-theme-border/50 w-full max-w-sm">
                  <div className="space-y-1"><span className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest block">Pendentes</span><p className="text-2xl font-heading font-black text-theme-text">{stats.pending}</p></div>
                  <div className="space-y-1"><span className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest block">Total</span><p className="text-2xl font-heading font-black text-brand-tactical">R$ {(stats.totalValue / 1000).toFixed(1)}k</p></div>
                  <div className="space-y-1"><span className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest block">Urgentes</span><p className="text-2xl font-heading font-black text-red-500">{stats.highUrgency}</p></div>
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
                         <button key={u} type="button" onClick={() => setNewQuoteData({...newQuoteData, urgency: u})} className={`py-2.5 border text-[8px] font-black uppercase tracking-widest transition-all rounded-sm ${newQuoteData.urgency === u ? 'border-brand-tactical bg-brand-tactical text-brand-text shadow-md' : 'border-theme-border text-theme-text-muted hover:border-theme-text'}`}>
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
