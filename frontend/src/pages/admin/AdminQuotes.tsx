import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API } from "../../lib/api";
import { 
  Briefcase, 
  Search, User, Plus, 
  Zap, X, Phone, Camera, Video, Smartphone, Flame, Thermometer, Snowflake, DollarSign
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

export const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [activeTab, setActiveTab] = useState<"briefing" | "equipe" | "locacao" | "fechamento">("briefing");
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);

  // Pricing States
  const [selectedStaff, setSelectedStaff] = useState<{id: string, label: string, cost: number, userId?: string}[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<{id: string, qty: number}[]>([]);
  const [transportCost] = useState<number>(0);
  const [lodgingCost] = useState<number>(0);
  const [margin] = useState(30); 
  const [isSplit] = useState(true);
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);

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
  }, [fetchQuotes]);

  const staffTotal = selectedStaff.reduce((acc, s) => acc + s.cost, 0);
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
      setNotification({ message: "Orçamento aprovado e enviado! 🚀", type: 'success' });
      setSelectedQuote(null);
      fetchQuotes();
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification({ message: "Erro ao aprovar orçamento.", type: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleCreateNewQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/admin/quotes", {
        ...newQuoteData,
        usageType: "PROSPECÇÃO_DIRETA",
        quoteStatus: "PENDING"
      });
      setIsNewQuoteModalOpen(false);
      setNewQuoteData({ nomeNoivos: "", clientName: "", clientEmail: "", clientPhone: "", dataEvento: "", location: "", description: "", priceBase: 0, urgency: "MEDIUM", temFoto: true, temVideo: false, temReels: false });
      fetchQuotes();
      setNotification({ message: "Missão aceita! Novo lead no radar. 🔥", type: 'success' });
    } catch {
      setNotification({ message: "Falha ao convocar lead.", type: 'error' });
    }
  };

  const toggleStaffPreset = (roleId: string) => {
    const exists = selectedStaff.find(s => s.id === roleId);
    if (exists) {
      setSelectedStaff(selectedStaff.filter(s => s.id !== roleId));
    } else {
      const role = STAFF_ROLES.find(r => r.id === roleId);
      setSelectedStaff([...selectedStaff, { id: roleId, label: role?.name || "", cost: role?.avgCost || 0 }]);
    }
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border pb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Máquina de Vendas</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-3 font-black italic">Gestão de Leads e Orçamentos Customizados</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} />
            <input
              type="text"
              placeholder="PESQUISAR NO RADAR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-theme-bg-muted border border-theme-border p-3.5 pl-10 text-[10px] text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all font-black"
            />
          </div>
          <button 
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="w-full md:w-auto bg-brand-tactical text-zinc-950 font-black uppercase tracking-[0.4em] px-8 py-4 text-[10px] flex items-center justify-center gap-2 hover:brightness-110 shadow-xl shadow-brand-tactical/10 transition-all active:scale-95"
          >
            <Plus size={16} /> GERAR ORÇAMENTO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* List of Quotes */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
             <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/20">
                <div className="text-[10px] text-theme-muted animate-pulse uppercase tracking-[0.5em] font-black italic">Escaneando Radar...</div>
             </div>
          ) : quotes.length > 0 ? (
            quotes.map((quote) => (
              <div 
                key={quote.id}
                onClick={() => { setSelectedQuote(quote); setActiveTab("briefing"); }}
                className={`p-5 border transition-all relative overflow-hidden group ${selectedQuote?.id === quote.id ? 'border-brand-tactical bg-brand-tactical/5 shadow-[inset_0_0_20px_rgba(133,185,172,0.05)]' : 'border-theme-border bg-theme-bg-muted hover:border-zinc-500'}`}
                style={{ cursor: "pointer" }}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${quote.urgency === 'HIGH' ? 'bg-red-500 animate-pulse' : quote.urgency === 'MEDIUM' ? 'bg-brand-tactical' : 'bg-blue-400 opacity-30'}`} />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border ${quote.quoteStatus === 'PENDING' ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-muted'}`}>
                         {quote.quoteStatus}
                       </span>
                       {quote.urgency === 'HIGH' && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 animate-pulse"><Flame size={8}/> PRIORITÁRIO</span>}
                    </div>
                    <span className="text-[11px] text-theme-text font-black tracking-tighter italic">
                       {quote.priceBase ? `R$ ${quote.priceBase.toLocaleString()}` : "S/ VALOR"}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-heading font-black text-theme-text uppercase tracking-tighter leading-tight group-hover:text-brand-tactical transition-colors">
                    {quote.nomeNoivos}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-[9px] text-theme-muted font-black uppercase tracking-wider overflow-hidden truncate">
                      <User size={10} className="text-brand-tactical" /> {quote.clientName || "LEAD"}
                    </div>
                    {quote.clientPhone && (
                      <div className="flex items-center gap-2 text-[9px] text-brand-tactical font-black uppercase tracking-wider">
                        <Phone size={10} /> {quote.clientPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center border border-dashed border-theme-border flex flex-col items-center justify-center bg-theme-bg-muted/10">
              <div className="relative mb-10">
                 <div className="absolute inset-0 bg-brand-tactical/10 rounded-full animate-ping" />
                 <Briefcase size={44} className="text-theme-muted relative z-10" />
              </div>
              <p className="text-[11px] text-theme-muted uppercase tracking-[0.5em] italic font-black">Silêncio no radar de vendas.</p>
            </div>
          )}
        </div>

        {/* Selected Details & Budgeting Studio */}
        <div className="lg:col-span-7 lg:sticky lg:top-10 h-fit">
          {selectedQuote ? (
            <div className="bg-theme-bg-muted border border-theme-border p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => setSelectedQuote(null)} className="text-zinc-600 hover:text-white p-2 transition-all"><X size={18}/></button>
               </div>

               <div className="flex gap-4 border-b border-theme-border pb-4 overflow-x-auto no-scrollbar scroll-smooth">
                 {(['briefing', 'equipe', 'locacao', 'fechamento'] as const).map(t => (
                   <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === t ? 'text-brand-tactical' : 'text-theme-muted hover:text-white'}`}
                   >
                     {t}
                     {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-tactical" />}
                   </button>
                 ))}
               </div>

               <div className="min-h-[450px]">
                  {activeTab === 'briefing' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-zinc-950/5 p-6 border border-theme-border/20">
                         <div className="space-y-1.5"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Data</span><p className="text-[13px] font-black text-theme-text uppercase tracking-tight">{new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")}</p></div>
                         <div className="space-y-1.5"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Ticket Radar</span><p className="text-[13px] font-black text-brand-tactical uppercase tracking-tight truncate">R$ {selectedQuote.priceBase?.toLocaleString() || "---"}</p></div>
                         <div className="space-y-1.5"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest opacity-60">Lead</span><p className="text-[13px] font-black text-theme-text uppercase tracking-tight">{selectedQuote.clientName}</p></div>
                         <div className="space-y-1.5"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest opacity-60">WhatsApp</span><p className="text-[13px] font-black text-brand-tactical uppercase tracking-tight">{selectedQuote.clientPhone || "S/ CONTATO"}</p></div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] border-b border-theme-border pb-3">Perfil da Demanda</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedQuote.temFoto && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-4 py-2 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-2"><Camera size={10}/> Fotografia</span>}
                          {selectedQuote.temVideo && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-4 py-2 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-2"><Video size={10}/> Vídeo</span>}
                          {selectedQuote.temReels && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-4 py-2 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-2"><Smartphone size={10}/> Reels</span>}
                        </div>
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] border-b border-theme-border pb-3">Briefing de Campo</h4>
                         <div className="bg-theme-bg p-8 border border-theme-border text-[11px] text-theme-text leading-relaxed uppercase tracking-widest font-bold opacity-80 italic whitespace-pre-wrap">
                           {selectedQuote.description || "SEM OBSERVAÇÕES ADICIONAIS."}
                         </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'equipe' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {STAFF_ROLES.map(role => (
                          <button key={role.id} onClick={() => toggleStaffPreset(role.id)} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${selectedStaff.find(s => s.id === role.id) ? 'border-brand-tactical bg-brand-tactical text-zinc-950 shadow-lg' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}>{role.name}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'locacao' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="max-h-[350px] overflow-y-auto space-y-3 pr-3 custom-scrollbar border-b border-theme-border pb-6">
                        {MERLIN_EQUIPMENT.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-theme-bg border border-theme-border hover:border-brand-tactical transition-all">
                            <div><p className="text-[11px] font-black uppercase tracking-widest mb-1">{item.name}</p><p className="text-[9px] text-theme-muted uppercase font-bold tracking-wider opacity-60">R$ {item.price}/DIA</p></div>
                            <button onClick={() => addEquip(item.id)} className="p-2 text-brand-tactical hover:bg-brand-tactical hover:text-zinc-950 transition-all"><Plus size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'fechamento' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                      <div className="bg-theme-bg p-10 border border-theme-border space-y-6 shadow-inner">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-60"><span>Custo Operacional</span><span>R$ {costTotal.toLocaleString()}</span></div>
                        <div className="pt-8 border-t border-brand-tactical/30 flex justify-between items-center"><span className="text-[13px] font-black uppercase tracking-[0.3em] text-theme-text">Preço de Engenharia</span><span className="text-3xl font-heading font-black text-brand-tactical italic">R$ {Math.ceil(suggestedPrice).toLocaleString()}</span></div>
                      </div>
                      <div className="space-y-6">
                        <input type="number" value={finalPrice} onChange={(e) => setFinalPrice(Number(e.target.value))} className="w-full bg-theme-bg border border-brand-tactical p-6 text-4xl font-heading font-black text-theme-text outline-none text-center tracking-tighter" />
                        <button onClick={handleApprove} disabled={finalPrice <= 0 || approving} className="w-full bg-brand-tactical text-zinc-950 p-6 text-[12px] font-black uppercase tracking-[0.6em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-4">{approving ? "PROCESSANDO..." : <><Zap size={18} /> DISPARAR ORÇAMENTO OFICIAL</>}</button>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="h-full border border-theme-border bg-theme-bg-muted/10 flex flex-col items-center justify-center p-12 text-center">
               <div className="relative mb-12 flex items-center justify-center">
                  <div className="w-48 h-48 border border-brand-tactical/10 rounded-full flex items-center justify-center"><div className="w-32 h-32 border border-brand-tactical/20 rounded-full animate-ping" /></div>
                  <div className="absolute w-48 h-1 bg-gradient-to-r from-transparent to-brand-tactical/40 origin-left animate-[spin_4s_linear_infinite]" />
               </div>
               <div className="grid grid-cols-3 gap-8 pt-10 border-t border-theme-border">
                  <div className="space-y-1"><span className="text-[9px] text-theme-muted font-black uppercase tracking-widest block">Radar</span><p className="text-xl font-heading font-black text-theme-text tracking-tighter">{stats.pending}</p></div>
                  <div className="space-y-1"><span className="text-[9px] text-theme-muted font-black uppercase tracking-widest block">Volume</span><p className="text-xl font-heading font-black text-brand-tactical tracking-tighter">R$ {(stats.totalValue / 1000).toFixed(1)}k</p></div>
                  <div className="space-y-1"><span className="text-[9px] text-theme-muted font-black uppercase tracking-widest block">Urgentes</span><p className="text-xl font-heading font-black text-red-500 tracking-tighter">{stats.highUrgency}</p></div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW QUOTE MODAL (MICRO-TACTICAL VERSION) */}
      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setIsNewQuoteModalOpen(false)} />
           <div className="relative border border-theme-border w-full max-w-lg p-5 md:p-6 space-y-4 overflow-y-auto max-h-[95vh] shadow-2xl bg-theme-bg animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start border-b border-theme-border/20 pb-3">
                 <div className="space-y-0.5">
                    <span className="text-[7px] font-black text-brand-tactical uppercase tracking-[0.5em]">Engenharia de Vendas</span>
                    <h3 className="text-lg font-heading uppercase tracking-tighter text-theme-text">Convocar para o Radar</h3>
                 </div>
                 <button onClick={() => setIsNewQuoteModalOpen(false)} className="text-zinc-500 hover:text-brand-tactical p-1 transition-colors"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateNewQuote} className="space-y-3.5">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Título do Evento</label>
                       <input required placeholder="CASAMENTO X" value={newQuoteData.nomeNoivos} onChange={e => setNewQuoteData({...newQuoteData, nomeNoivos: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border p-2 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Data do Evento</label>
                       <input required type="date" value={newQuoteData.dataEvento} onChange={e => setNewQuoteData({...newQuoteData, dataEvento: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border p-2 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Cliente</label>
                       <input required placeholder="NOME" value={newQuoteData.clientName} onChange={e => setNewQuoteData({...newQuoteData, clientName: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border p-2 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">WhatsApp</label>
                       <input required placeholder="DDD 9XXXX-XXXX" value={newQuoteData.clientPhone} onChange={e => setNewQuoteData({...newQuoteData, clientPhone: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border p-2 text-[10px] text-brand-tactical outline-none focus:border-brand-tactical font-black" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">E-mail de Contato</label>
                       <input required type="email" placeholder="CLIENTE@EMAIL.COM" value={newQuoteData.clientEmail} onChange={e => setNewQuoteData({...newQuoteData, clientEmail: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border p-2 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Budget Estimado (R$)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-tactical" size={10} />
                          <input type="number" placeholder="VALOR" value={newQuoteData.priceBase} onChange={e => setNewQuoteData({...newQuoteData, priceBase: Number(e.target.value)})} className="w-full bg-theme-bg-muted border border-theme-border p-2 pl-6 text-[10px] text-brand-tactical outline-none focus:border-brand-tactical font-black" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2 pt-1">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Radar Urgency</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['HIGH', 'MEDIUM', 'LOW'] as const).map(u => (
                         <button key={u} type="button" onClick={() => setNewQuoteData({...newQuoteData, urgency: u})} className={`flex items-center justify-center gap-1.5 py-2 border text-[7px] font-black uppercase tracking-widest transition-all ${newQuoteData.urgency === u ? 'border-brand-tactical bg-brand-tactical text-zinc-950 shadow-md' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}>
                           {u === 'HIGH' ? <><Flame size={9}/> ALTA</> : u === 'MEDIUM' ? <><Thermometer size={9}/> MÉDIA</> : <><Snowflake size={9}/> BAIXA</>}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2 pt-1">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Serviços Pré-Engenharia</label>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setNewQuoteData({...newQuoteData, temFoto: !newQuoteData.temFoto})} className={`flex-1 py-2 border text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${newQuoteData.temFoto ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-muted'}`}><Camera size={11}/> FOTO</button>
                       <button type="button" onClick={() => setNewQuoteData({...newQuoteData, temVideo: !newQuoteData.temVideo})} className={`flex-1 py-2 border text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${newQuoteData.temVideo ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-muted'}`}><Video size={11}/> VÍDEO</button>
                       <button type="button" onClick={() => setNewQuoteData({...newQuoteData, temReels: !newQuoteData.temReels})} className={`flex-1 py-2 border text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${newQuoteData.temReels ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border text-theme-muted'}`}><Smartphone size={11}/> REELS</button>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[7px] font-black text-theme-muted uppercase tracking-[0.4em]">Local e Briefing</label>
                    <textarea required placeholder="LOCAL E OBSERVAÇÕES RÁPIDAS..." value={newQuoteData.description} onChange={e => setNewQuoteData({...newQuoteData, description: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border p-2 text-[10px] text-theme-text outline-none focus:border-brand-tactical h-14 font-bold resize-none" />
                 </div>

                 <div className="pt-2">
                    <button type="submit" className="w-full bg-brand-tactical text-zinc-950 font-black uppercase tracking-[0.5em] py-3.5 text-[9px] shadow-xl hover:scale-[1.01] transition-all">CONVOCAR PARA O RADAR</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[300] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-8 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_40px_rgba(133,185,172,0.15)]' : 'border-red-900 bg-zinc-950'} min-w-[350px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-2">
                 <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>Protocolo Concluído</span>
                 <p className="text-[13px] font-bold text-white uppercase tracking-widest mt-1 leading-tight">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1.5 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
