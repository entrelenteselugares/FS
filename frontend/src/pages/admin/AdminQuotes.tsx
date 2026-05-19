import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { API } from "../../lib/api";
import {
  Briefcase, Search, User, Plus, Zap, X,
  Camera, Video, Smartphone, Flame, ChevronDown, ChevronRight,
  ArrowRight
} from "lucide-react";
import { MERLIN_EQUIPMENT, STAFF_ROLES } from "../../data/merlin_pricing";

interface Quote {
  id: string; nomeNoivos: string; dataEvento: string; location: string;
  description: string; clientEmail: string; clientName: string; clientPhone?: string;
  urgency?: "HIGH" | "MEDIUM" | "LOW"; priceBase: number;
  quoteStatus: "PENDING" | "PRICED" | "APPROVED" | "REJECTED" | "CONVERTED" | "ARCHIVED";
  usageType: string; eventHours?: number; temFoto?: boolean; temVideo?: boolean;
  temReels?: boolean; temFotoEditada?: boolean; temVideoEditado?: boolean;
  temFotoImpressa?: boolean; temAlbumImpresso?: boolean; createdAt: string;
  pedidos?: { id: string; status: string }[];
}
interface StaffBreakdown { ID?: string; id?: string; LABEL?: string; label?: string; COST?: number; cost?: number; USER_ID?: string; userId?: string; }
interface EquipBreakdown { ID?: string; id?: string; QTY?: number; qty?: number; }
interface BudgetBreakdown { STAFF?: StaffBreakdown[]; EQUIPMENT?: EquipBreakdown[]; MARGIN?: number; margin?: number; }

const KANBAN_COLUMNS = [
  { id: "PENDING",   label: "Novos Leads",       color: "amber",   border: "border-amber-500/40",   text: "text-amber-500",   badge: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  { id: "PRICED",    label: "Em Análise",         color: "blue",    border: "border-blue-500/40",    text: "text-blue-500",    badge: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { id: "APPROVED",  label: "Proposta Enviada",   color: "emerald", border: "border-emerald-500/40", text: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  { id: "CONVERTED", label: "Convertidos",        color: "teal",    border: "border-teal-500/40",    text: "text-teal-400",    badge: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
  { id: "ARCHIVED",  label: "Arquivados",         color: "zinc",    border: "border-zinc-500/40",    text: "text-zinc-500",    badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30" },
  { id: "REJECTED",  label: "Recusados",          color: "red",     border: "border-red-500/40",     text: "text-red-500",     badge: "bg-red-500/10 text-red-500 border-red-500/30" },
] as const;

export const AdminQuotes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [activeTab, setActiveTab] = useState<"briefing"|"equipe"|"locacao"|"custos"|"fechamento">("briefing");
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{instanceId:string,id:string,label:string,cost:number,userId?:string}[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<{id:string,qty:number}[]>([]);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [lodgingCost, setLodgingCost] = useState<number>(0);
  const [margin, setMargin] = useState(30);
  const [isSplit, setIsSplit] = useState(true);
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<{message:string,type:"success"|"error"}|null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [professionals, setProfessionals] = useState<{id:string,nome:string,profissional?:{workflowType:string[]}}[]>([]);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState({
    nomeNoivos:"",clientName:"",clientEmail:"",clientPhone:"",dataEvento:"",
    location:"",description:"",priceBase:190,urgency:"MEDIUM" as "HIGH"|"MEDIUM"|"LOW",
    temFoto:true,temVideo:false,temReels:false
  });

  const parseBreakdown = useCallback((description: string) => {
    if (!description) return null;
    const match = description.match(/\[BUDGET_BREAKDOWN\]\s*(\{.*?\})/s);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
  }, []);

  const fetchProfessionals = useCallback(async () => {
    try { const {data} = await API.get("/admin/users",{params:{role:"PROFISSIONAL"}}); setProfessionals(data||[]); } catch (e) { console.error(e); }
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try { const r = await API.get("/admin/quotes",{params:{q:search}}); setQuotes(r.data.quotes||[]); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchQuotes(); fetchProfessionals(); }, [fetchQuotes,fetchProfessionals]);

  useEffect(() => {
    if (selectedQuote) {
      const data = parseBreakdown(selectedQuote.description);
      if (data) {
        const b = data as BudgetBreakdown;
        if (b.STAFF) setSelectedStaff(b.STAFF.map(s=>({instanceId:Math.random().toString(36).substr(2,9),id:s.ID||s.id||"",label:s.LABEL||s.label||"",cost:Number(s.COST||s.cost||0),userId:s.USER_ID||s.userId||""})));
        if (b.EQUIPMENT) setSelectedEquip(b.EQUIPMENT.map(e=>({id:e.ID||e.id||"",qty:Number(e.QTY||e.qty||0)})));
        if (b.MARGIN||b.margin) setMargin(Number(b.MARGIN||b.margin));
      } else { setSelectedStaff([]); setSelectedEquip([]); setMargin(30); }
      setTransportCost(0); setLodgingCost(0); setFinalPrice(0); setActiveTab("briefing");
    }
  }, [selectedQuote,parseBreakdown]);

  const staffTotal = selectedStaff.reduce((a,s)=>a+(s.cost||0),0);
  const equipTotal = selectedEquip.reduce((a,e)=>{const i=MERLIN_EQUIPMENT.find(m=>m.id===e.id);return a+(i?i.price*e.qty:0);},0);
  const costTotal = staffTotal+equipTotal+transportCost+lodgingCost;
  const suggestedPrice = Math.max(selectedQuote?.priceBase || 0, costTotal > 0 ? costTotal / (1 - margin / 100) : 0);
  useEffect(()=>{ if(suggestedPrice>0) setFinalPrice(Math.ceil(suggestedPrice)); },[suggestedPrice, selectedQuote?.id]);

  const stats = useMemo(()=>({
    total:quotes.length,
    pending:quotes.filter(q=>q.quoteStatus==="PENDING").length,
    highUrgency:quotes.filter(q=>q.urgency==="HIGH").length,
    totalValue:quotes.reduce((a,q)=>a+(q.priceBase||0),0)
  }),[quotes]);

  // Deep-linking: seleciona orçamento via URL (?id=...)
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && quotes.length > 0 && !selectedQuote) {
      const found = quotes.find(q => q.id === id);
      if (found) setSelectedQuote(found);
    }
  }, [searchParams, quotes, selectedQuote]);

  const handleApprove = async () => {
    if (!selectedQuote||finalPrice<=0) return;
    setApproving(true);
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/approve`,{finalPrice,isSplit,breakdown:{staff:selectedStaff,equipment:selectedEquip,costTotal,margin}});
      setNotification({message:"Orçamento aprovado!",type:"success"});
      setSelectedQuote(null); fetchQuotes(); setTimeout(()=>setNotification(null),5000);
    } catch { setNotification({message:"Erro ao aprovar.",type:"error"}); }
    finally { setApproving(false); }
  };

  const handleSaveDraft = async () => {
    if (!selectedQuote) return;
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/price`, {
        finalPrice: finalPrice > 0 ? finalPrice : Math.ceil(suggestedPrice),
        breakdown: { staff: selectedStaff, equipment: selectedEquip, costTotal, margin },
      });
      setNotification({ message: "Análise salva! Lead movido para \"Em Análise\".", type: "success" });
      setSelectedQuote(null); fetchQuotes(); setTimeout(() => setNotification(null), 5000);
    } catch { setNotification({ message: "Erro ao salvar análise.", type: "error" }); }
  };

  const handleReject = async () => {
    if (!selectedQuote) return;
    const reason = prompt("MOTIVO DA REJEIÇÃO:");
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/reject`,{reason});
      setNotification({message:"Orçamento recusado.",type:"success"});
      setSelectedQuote(null); fetchQuotes();
    } catch { setNotification({message:"Erro ao recusar.",type:"error"}); }
  };

  const handleArchive = async () => {
    if (!selectedQuote) return;
    if (!confirm("Deseja finalizar e arquivar este protocolo? Isso indica que todo material foi entregue.")) return;
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/archive`);
      setNotification({message:"Protocolo arquivado com sucesso!",type:"success"});
      setSelectedQuote(null); fetchQuotes();
    } catch { setNotification({message:"Erro ao arquivar protocolo.",type:"error"}); }
  };

  const handleCreateNewQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/admin/quotes",{...newQuoteData,usageType:"VENDA_DIRETA",quoteStatus:"PENDING"});
      setIsNewQuoteModalOpen(false);
      setNewQuoteData({nomeNoivos:"",clientName:"",clientEmail:"",clientPhone:"",dataEvento:"",location:"",description:"",priceBase:190,urgency:"MEDIUM",temFoto:true,temVideo:false,temReels:false});
      fetchQuotes(); setNotification({message:"Novo lead cadastrado!",type:"success"});
    } catch { setNotification({message:"Erro ao cadastrar.",type:"error"}); }
  };

  const toggleService = (service: 'temFoto' | 'temVideo' | 'temReels', price: number) => {
    setNewQuoteData(prev => {
      const isAdding = !prev[service];
      return {
        ...prev,
        [service]: isAdding,
        priceBase: Math.max(0, (prev.priceBase || 0) + (isAdding ? price : -price))
      };
    });
  };

  const addStaffPreset = (roleId: string) => {
    const role = STAFF_ROLES.find(r=>r.id===roleId)||{id:"custom",name:"OUTROS",avgCost:0};
    const existingCount = selectedStaff.filter(s=>s.id===roleId).length;
    let baseName = role.name.toUpperCase();
    if (roleId==="photographer") baseName="FOTÓGRAFO";
    if (roleId==="videographer") baseName="CINEGRAFISTA";
    const label = roleId==="custom"?"NOVA FUNÇÃO":`${existingCount+1}º ${baseName}`;
    setSelectedStaff([...selectedStaff,{instanceId:Math.random().toString(36).substr(2,9),id:roleId,label,cost:role.avgCost||0,userId:""}]);
  };
  const removeStaffInstance = (id:string) => setSelectedStaff(selectedStaff.filter(s=>s.instanceId!==id));
  const updateStaffUser = (id:string,userId:string) => setSelectedStaff(selectedStaff.map(s=>s.instanceId===id?{...s,userId}:s));
  const addEquip = (id:string) => {
    const e = selectedEquip.find(e=>e.id===id);
    if (e) setSelectedEquip(selectedEquip.map(e=>e.id===id?{...e,qty:e.qty+1}:e));
    else setSelectedEquip([...selectedEquip,{id,qty:1}]);
  };

  const getColQuotes = (status: string) => quotes.filter(q => {
    const hasApprovedOrder = q.pedidos && q.pedidos.length > 0;
    let effectiveStatus = q.quoteStatus;

    // Se tiver pedido pago e estiver em APPROVED, tratamos como CONVERTED no Kanban
    if (q.quoteStatus === "APPROVED" && hasApprovedOrder) {
      effectiveStatus = "CONVERTED";
    }

    const matchesStatus = effectiveStatus === status;
    const matchesSearch = !search || 
      q.nomeNoivos.toLowerCase().includes(search.toLowerCase()) || 
      (q.clientName && q.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (q.clientEmail && q.clientEmail.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });
  const QuoteCard = ({quote, onClick}: {quote:Quote, onClick:()=>void}) => {
    const hasApprovedOrder = quote.pedidos && quote.pedidos.length > 0;
    const effectiveStatus = (quote.quoteStatus === "APPROVED" && hasApprovedOrder) ? "CONVERTED" : quote.quoteStatus;
    const col = KANBAN_COLUMNS.find(c=>c.id===effectiveStatus)!;
    const daysLeft = Math.ceil((new Date(quote.dataEvento).getTime()-Date.now())/(1000*60*60*24));
    return (
      <motion.div
        whileHover={{scale:1.015,y:-2}} whileTap={{scale:0.99}}
        onClick={onClick}
        className={`p-4 border rounded-lg cursor-pointer transition-colors relative overflow-hidden ${selectedQuote?.id===quote.id?"border-brand-tactical bg-brand-tactical/5 shadow-[0_0_20px_rgba(133,185,172,0.15)]":"border-theme-border bg-theme-card/60 hover:border-theme-border-2 hover:bg-theme-card"}`}
      >
        {quote.urgency==="HIGH"&&<div className="absolute top-0 left-0 w-1 h-full bg-red-500"/>}
        <div className="space-y-3 pl-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-black text-theme-text uppercase italic tracking-tight leading-tight flex-1">{quote.nomeNoivos}</h4>
            {quote.urgency==="HIGH"&&<div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded shrink-0"><Flame size={9} className="text-red-500"/><span className="text-[8px] font-black text-red-500 uppercase">Urgente</span></div>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-theme-text-muted font-bold truncate max-w-[60%]">{quote.clientName||"—"}</span>
            <span className="text-[10px] font-black text-brand-tactical italic">{quote.priceBase?`R$ ${quote.priceBase.toLocaleString()}`:"S/ VALOR"}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-theme-border/50">
            <div className="flex items-center gap-2">
              {quote.temFoto&&<Camera size={11} className="text-theme-text-muted opacity-60"/>}
              {quote.temVideo&&<Video size={11} className="text-theme-text-muted opacity-60"/>}
              {quote.temReels&&<Smartphone size={11} className="text-theme-text-muted opacity-60"/>}
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border rounded ${col.badge}`}>{effectiveStatus}</span>
              {quote.pedidos && quote.pedidos.length > 0 && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-emerald-500 text-black rounded animate-pulse font-black italic">PAGO</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-theme-text-muted font-bold">{daysLeft>0?`${daysLeft}d`:"Passado"}</span>
              <span className="text-[8px] text-theme-subtle font-mono">#{quote.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div className="space-y-4 min-w-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            Gestão de <span className="text-brand-tactical">Orçamentos</span>
          </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Propostas e Negociações Comerciais</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" size={14}/>
              <input type="text" placeholder="BUSCAR..." value={search} onChange={e=>setSearch(e.target.value)}
                className="bg-theme-bg-muted border border-theme-border pl-9 pr-4 py-3 text-[10px] text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-all font-bold rounded-lg w-56"/>
            </div>
            <button onClick={()=>setIsNewQuoteModalOpen(true)}
              className="bg-brand-tactical text-black font-display font-black uppercase tracking-[0.2em] px-6 py-3 text-[10px] flex items-center gap-2 hover:brightness-110 shadow-xl transition-all rounded-lg whitespace-nowrap">
              <Plus size={16}/> Novo Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 md:hidden">
        {[{l:"Pendentes",v:stats.pending,c:"text-amber-500"},{l:"Alta Prior.",v:stats.highUrgency,c:"text-red-500"},{l:"Volume",v:`R${(stats.totalValue/1000).toFixed(1)}k`,c:"text-brand-tactical"}].map(s=>(
          <div key={s.l} className="bg-theme-card border border-theme-border rounded-lg p-3 text-center">
            <p className={`text-2xl font-heading font-black italic ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-theme-text-muted uppercase tracking-widest mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading?(
        <div className="py-24 text-center"><div className="text-[10px] text-theme-text-muted animate-pulse uppercase tracking-[0.4em] font-bold">Carregando pipeline...</div></div>
      ):(
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2" style={{minHeight:"60vh"}}>
          {KANBAN_COLUMNS.map(col=>{
            if (col.id==="REJECTED") return (
              <div key={col.id} className="flex-shrink-0 w-10">
                <button onClick={()=>setArchivedOpen(o=>!o)}
                  className={`h-full w-10 flex flex-col items-center justify-center gap-3 border rounded-lg bg-theme-card/30 border-theme-border hover:border-red-500/30 transition-colors group`}>
                  {archivedOpen?<ChevronRight size={14} className="text-red-500"/>:<ChevronDown size={14} className="text-red-500 rotate-90"/>}
                  <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest" style={{writingMode:"vertical-rl",transform:"rotate(180deg)"}}>Arquivados</span>
                  <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{getColQuotes("REJECTED").length}</span>
                </button>
              </div>
            );
            const colQuotes = getColQuotes(col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-72 flex flex-col gap-3">
                <div className={`border-t-2 ${col.border} pt-3 flex items-center justify-between`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${col.text}`}>{col.label}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 border rounded ${col.badge}`}>{colQuotes.length}</span>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto" style={{maxHeight:"68vh"}}>
                  {colQuotes.length===0?(
                    <div className="border border-dashed border-theme-border/30 rounded-lg py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                      <Briefcase size={20} className="text-theme-text-muted"/>
                      <p className="text-[9px] text-theme-text-muted uppercase tracking-widest font-bold text-center px-4">Nenhum protocolo</p>
                    </div>
                  ):colQuotes.map(q=><QuoteCard key={q.id} quote={q} onClick={()=>setSelectedQuote(q)}/>)}
                </div>
              </div>
            );
          })}
          {/* Arquivados expanded */}
          {archivedOpen&&(
            <div className="flex-shrink-0 w-72 flex flex-col gap-3 animate-in slide-in-from-right-4 duration-300">
              <div className="border-t-2 border-red-500/40 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Arquivados</span>
                <span className="text-[9px] font-black px-2 py-0.5 border rounded bg-red-500/10 text-red-500 border-red-500/20">{getColQuotes("REJECTED").length}</span>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto" style={{maxHeight:"68vh"}}>
                {getColQuotes("REJECTED").map(q=><QuoteCard key={q.id} quote={q} onClick={()=>setSelectedQuote(q)}/>)}
              </div>
            </div>
          )}
        </div>
      )}
      {/* QUOTE DETAIL MODAL */}
      <AnimatePresence>
        {selectedQuote&&(
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl" onClick={()=>setSelectedQuote(null)}/>
            <motion.div
              initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              transition={{type:"spring",damping:30,stiffness:300}}
              className="relative w-full max-w-3xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl flex flex-col" style={{maxHeight:"90vh"}}
            >
              {/* Modal Header */}
              <div className="p-8 md:p-10 border-b border-theme-border flex items-start justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                    <Briefcase className="text-brand-tactical" size={24} strokeWidth={1.5}/>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">{selectedQuote.nomeNoivos}</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">Protocolo: {selectedQuote.id.toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={()=>setSelectedQuote(null)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24}/></button>
              </div>
              {/* Tab Nav */}
              <div className="px-8 md:px-10 pt-4 flex gap-1 border-b border-theme-border shrink-0 overflow-x-auto no-scrollbar">
                {(["briefing","equipe","locacao","custos","fechamento"] as const).map(t=>(
                  <button key={t} onClick={()=>setActiveTab(t)}
                    className={`pb-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap italic ${activeTab===t?"text-brand-tactical":"text-theme-subtle hover:text-white"}`}>
                    {t==="briefing"?"1. Briefing":t==="equipe"?"2. Equipe":t==="locacao"?"3. Locação":t==="custos"?"4. Custos":"5. Fechamento"}
                    {activeTab===t&&<div className="absolute bottom-0 left-0 right-0 h-px bg-brand-tactical"/>}
                  </button>
                ))}
              </div>
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
                {activeTab==="briefing"&&(
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-4 border border-theme-border rounded-lg">
                      <div>
                        <span className="text-[8px] font-black text-theme-subtle uppercase tracking-widest italic block mb-1">Data do Evento</span>
                        <p className="text-xs font-display font-black text-theme-text uppercase italic">
                          {new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")} {new Date(selectedQuote.dataEvento).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-theme-subtle uppercase tracking-widest italic block mb-1">Estimativa Auto</span>
                        <p className="text-xs font-display font-black text-brand-tactical uppercase italic">R$ {selectedQuote.priceBase?.toLocaleString()||"---"}</p>
                        <p className="text-[7px] text-theme-muted opacity-50 italic mt-0.5">Calculado automaticamente</p>
                      </div>
                      <div><span className="text-[8px] font-black text-theme-subtle uppercase tracking-widest italic block mb-1">Local</span><p className="text-xs font-display font-black text-theme-text uppercase truncate italic">{selectedQuote.location||"N/A"}</p></div>
                      <div><span className="text-[8px] font-black text-theme-subtle uppercase tracking-widest italic block mb-1">Email</span><p className="text-xs font-display font-black text-theme-text lowercase truncate italic">{selectedQuote.clientEmail}</p></div>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-brand-tactical uppercase tracking-widest border-l border-brand-tactical pl-3 italic mb-3">Serviços</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedQuote.temFoto&&<span className="bg-brand-tactical/5 text-brand-tactical text-[8px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-1 italic rounded"><Camera size={9}/> FOTO</span>}
                        {selectedQuote.temVideo&&<span className="bg-brand-tactical/5 text-brand-tactical text-[8px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-1 italic rounded"><Video size={9}/> VÍDEO</span>}
                        {selectedQuote.temReels&&<span className="bg-brand-tactical/5 text-brand-tactical text-[8px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest flex items-center gap-1 italic rounded"><Smartphone size={9}/> REELS</span>}
                      </div>
                    </div>
                    {(()=>{
                      const data=parseBreakdown(selectedQuote.description);
                      const cleanText=selectedQuote.description.replace(/\[BUDGET_BREAKDOWN\].*?(\n\n|$)/s,"").replace(/\[REJECTED_REASON\].*?$/s,"").trim();
                      return(
                        <div className="space-y-3">
                          {data && (
                            <div className="bg-brand-tactical/5 p-4 border border-brand-tactical/20 rounded-xl space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Zap size={10} className="text-brand-tactical" />
                                <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">Análise de Recursos</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2 text-[10px]">
                                <div className="flex justify-between border-b border-brand-tactical/10 pb-1">
                                  <span className="text-theme-subtle italic">Equipe Sugerida</span>
                                  <span className="text-theme-text font-bold italic">{(data as BudgetBreakdown).STAFF?.map(s => s.LABEL || s.label).join(", ") || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-brand-tactical/10 pb-1">
                                  <span className="text-theme-subtle italic">Margem Operacional</span>
                                  <span className="text-theme-text font-bold italic">{(data as BudgetBreakdown).MARGIN || ((data as BudgetBreakdown).margin)}%</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="bg-theme-bg-muted p-4 border border-theme-border text-[11px] text-theme-text leading-relaxed font-medium italic whitespace-pre-wrap rounded-lg">{cleanText||"Nenhuma observação adicional."}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {activeTab==="equipe"&&(
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-2">
                      {STAFF_ROLES.map(role=>{const n=selectedStaff.filter(s=>s.id===role.id).length;return(
                        <button key={role.id} onClick={()=>addStaffPreset(role.id)}
                          className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest border rounded-lg flex items-center justify-between transition-all ${n>0?"border-brand-tactical bg-brand-tactical/10 text-brand-tactical":"border-theme-border text-theme-text-muted hover:border-brand-tactical/50"}`}>
                          <span className="truncate">{role.name}</span>
                          <div className="flex items-center gap-1">{n>0&&<span className="bg-brand-tactical text-black px-1.5 py-0.5 rounded text-[8px]">{n}</span>}<Plus size={10}/></div>
                        </button>
                      );})}
                      <button onClick={()=>addStaffPreset("custom")} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest border border-dashed border-theme-border text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical rounded-lg flex items-center justify-between transition-all">OUTROS <Plus size={10}/></button>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-theme-border/20">
                      <h4 className="text-[9px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-2 mb-2">Cachês</h4>
                      {selectedStaff.length===0?(<div className="py-8 text-center border border-dashed border-theme-border rounded-lg opacity-40"><p className="text-[9px] text-theme-text-muted uppercase tracking-widest">Selecione os papéis</p></div>):selectedStaff.map(s=>(
                        <div key={s.instanceId} className="flex items-center gap-2 bg-theme-bg p-3 border border-theme-border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <input type="text" value={s.label} onChange={e=>setSelectedStaff(selectedStaff.map(st=>st.instanceId===s.instanceId?{...st,label:e.target.value.toUpperCase()}:st))}
                              className="w-full bg-transparent border-none text-[10px] font-black uppercase text-theme-text outline-none focus:text-brand-tactical"/>
                            <span className="text-[8px] text-brand-tactical">Sug: R$ {STAFF_ROLES.find(r=>r.id===s.id)?.avgCost||s.cost}</span>
                          </div>
                          <div className="relative w-32">
                            <User className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-text-muted opacity-30" size={10}/>
                            <select value={s.userId||""} onChange={e=>updateStaffUser(s.instanceId,e.target.value)}
                              className="w-full bg-theme-bg-muted border border-theme-border p-1.5 pl-7 text-[8px] font-bold text-theme-text outline-none appearance-none uppercase rounded">
                              <option value="">Profissional...</option>
                              {professionals.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                          </div>
                          <div className="relative w-20">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-theme-text-muted">R$</span>
                            <input type="number" value={s.cost} onChange={e=>setSelectedStaff(selectedStaff.map(st=>st.instanceId===s.instanceId?{...st,cost:Number(e.target.value)}:st))}
                              className="w-full bg-theme-bg-muted border border-theme-border p-1.5 pl-6 text-[9px] font-black text-brand-tactical outline-none rounded"/>
                          </div>
                          <button onClick={()=>removeStaffInstance(s.instanceId)} className="p-1.5 text-theme-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-all"><X size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab==="locacao"&&(
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-l-2 border-brand-tactical pl-2">
                      <h4 className="text-[9px] font-black text-theme-text uppercase tracking-widest">Locação de Equipamentos</h4>
                      <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest bg-brand-tactical/10 px-2 py-0.5 rounded">Total: R$ {equipTotal.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {MERLIN_EQUIPMENT.map(item=>{
                        const selection = selectedEquip.find(e => e.id === item.id);
                        const isSelected = !!selection;
                        return (
                          <div key={item.id} className={`flex items-center justify-between p-3 border rounded-lg transition-all ${isSelected?"bg-brand-tactical/10 border-brand-tactical shadow-[0_0_15px_rgba(133,185,172,0.1)]":"bg-theme-bg border-theme-border hover:border-theme-border-2"}`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-black uppercase ${isSelected?"text-brand-tactical":"text-theme-text"}`}>{item.name}</p>
                              <p className="text-[8px] text-theme-text-muted font-bold">{item.category} • R$ {item.price.toLocaleString()} / UN</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected&&(
                                <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-brand-tactical/20">
                                  <button onClick={()=>{if(selection.qty>1){setSelectedEquip(prev=>prev.map(e=>e.id===item.id?{...e,qty:e.qty-1}:e));}else{setSelectedEquip(prev=>prev.filter(e=>e.id!==item.id));}}} className="w-6 h-6 flex items-center justify-center text-brand-tactical hover:bg-brand-tactical hover:text-black rounded transition-all"><X size={10}/></button>
                                  <span className="w-8 text-center text-[10px] font-black text-brand-tactical italic">{selection.qty}</span>
                                  <button onClick={()=>addEquip(item.id)} className="w-6 h-6 flex items-center justify-center text-brand-tactical hover:bg-brand-tactical hover:text-black rounded transition-all"><Plus size={10}/></button>
                                </div>
                              )}
                              {!isSelected&&(
                                <button onClick={()=>addEquip(item.id)} className="p-2 border border-theme-border text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical rounded-lg transition-all"><Plus size={14}/></button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {activeTab==="custos"&&(
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <h4 className="text-[9px] font-black text-theme-text uppercase tracking-widest border-l-2 border-brand-tactical pl-2">Logística e Despesas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Deslocamento (R$)</label><input type="number" value={transportCost} onChange={e=>setTransportCost(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border p-2.5 text-[11px] font-black text-theme-text outline-none focus:border-brand-tactical rounded-lg"/></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">Hospedagem (R$)</label><input type="number" value={lodgingCost} onChange={e=>setLodgingCost(Number(e.target.value))} className="w-full bg-theme-bg border border-theme-border p-2.5 text-[11px] font-black text-theme-text outline-none focus:border-brand-tactical rounded-lg"/></div>
                    </div>
                  </div>
                )}
                {activeTab==="fechamento"&&(
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-theme-bg p-5 border border-theme-border space-y-3 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-px h-full bg-brand-tactical"/>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-theme-muted italic"><span>Custo Total</span><span className="text-theme-text text-lg font-display">R$ {costTotal.toLocaleString()}</span></div>
                      <div className="flex items-center justify-between pt-2 border-t border-theme-border"><span className="text-[10px] font-black uppercase tracking-widest text-theme-muted italic">Margem (%)</span><input type="number" value={margin} onChange={e=>setMargin(Number(e.target.value))} className="w-20 bg-theme-card border border-theme-border p-2 text-sm font-display font-black text-brand-tactical text-center outline-none focus:border-brand-tactical italic rounded-lg"/></div>
                      <div className="flex items-center justify-between pt-2 border-t border-theme-border"><span className="text-[10px] font-black uppercase tracking-widest text-theme-muted italic">Parcelamento 50/50</span><button onClick={()=>setIsSplit(!isSplit)} className={`px-5 py-1.5 text-[8px] font-black uppercase border rounded-lg transition-all italic ${isSplit?"border-brand-tactical text-brand-tactical bg-brand-tactical/10":"border-theme-border text-theme-subtle"}`}>{isSplit?"Ativo":"Inativo"}</button></div>
                      <div className="pt-4 border-t border-theme-border flex justify-between items-end"><span className="text-[8px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Sugestão Técnica</span><span className="text-3xl font-display font-black text-brand-tactical italic">R$ {Math.ceil(suggestedPrice).toLocaleString()}</span></div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] text-center block italic">Valor Final da Proposta</label>
                      <input type="number" value={finalPrice} onChange={e=>setFinalPrice(Number(e.target.value))} className="w-full bg-theme-bg-muted border border-brand-tactical/30 p-5 text-4xl font-display font-black text-theme-text outline-none text-center italic shadow-[0_0_30px_rgba(133,185,172,0.1)] focus:border-brand-tactical transition-all rounded-lg"/>
                      <button onClick={handleSaveDraft} className="w-full border border-theme-border text-theme-muted p-2.5 text-[8px] font-black uppercase tracking-[0.2em] hover:border-brand-tactical hover:text-brand-tactical transition-all rounded-lg italic flex items-center justify-center gap-2">
                        Salvar Rascunho (Em Análise)
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Modal Footer */}
              <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0">
                <button onClick={handleReject} className="py-5 px-6 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all rounded-[20px] italic">Recusar</button>
                
                {selectedQuote.quoteStatus === "CONVERTED" && (
                  <button onClick={handleArchive} className="flex-1 py-5 bg-zinc-800 text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-zinc-700 transition-all rounded-[20px] italic flex items-center justify-center gap-4">
                    Finalizar Entrega & Arquivar
                  </button>
                )}

                {selectedQuote.quoteStatus !== "CONVERTED" && selectedQuote.quoteStatus !== "ARCHIVED" && (
                  <button onClick={handleApprove} disabled={finalPrice<=0||approving} className="flex-1 py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4 disabled:opacity-50">
                    {approving?"ENVIANDO...":<><Zap size={16}/> DISPARAR ORÇAMENTO OFICIAL</>}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* NEW QUOTE MODAL */}
      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsNewQuoteModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Briefcase className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Novo Lead</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Abertura de Protocolo Direto</p>
                </div>
              </div>
              <button onClick={() => setIsNewQuoteModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleCreateNewQuote} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Evento (Título)</label>
                  <input required placeholder="EX: CASAMENTO ANA & LEO" value={newQuoteData.nomeNoivos} onChange={e => setNewQuoteData({...newQuoteData, nomeNoivos: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black rounded-xl uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Data do Evento</label>
                  <input required type="datetime-local" value={newQuoteData.dataEvento} onChange={e => setNewQuoteData({...newQuoteData, dataEvento: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Nome do Cliente</label>
                  <input required placeholder="NOME COMPLETO" value={newQuoteData.clientName} onChange={e => setNewQuoteData({...newQuoteData, clientName: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black rounded-xl uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">WhatsApp</label>
                  <input required placeholder="DDD 9XXXX-XXXX" value={newQuoteData.clientPhone} onChange={e => setNewQuoteData({...newQuoteData, clientPhone: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-brand-tactical outline-none focus:border-brand-tactical font-black rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">E-mail</label>
                  <input required type="email" placeholder="CLIENTE@EMAIL.COM" value={newQuoteData.clientEmail} onChange={e => setNewQuoteData({...newQuoteData, clientEmail: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text outline-none focus:border-brand-tactical font-black rounded-xl uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Orçamento (R$)</label>
                  <input type="number" placeholder="VALOR BASE" value={newQuoteData.priceBase} onChange={e => setNewQuoteData({...newQuoteData, priceBase: Number(e.target.value)})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-brand-tactical outline-none focus:border-brand-tactical font-black rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Urgência</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["HIGH", "MEDIUM", "LOW"] as const).map(u => (
                    <button 
                      key={u} 
                      type="button" 
                      onClick={() => setNewQuoteData({...newQuoteData, urgency: u})} 
                      className={`py-4 border text-[9px] font-black uppercase tracking-widest rounded-xl transition-all italic ${newQuoteData.urgency === u ? "border-brand-tactical bg-brand-tactical text-black shadow-lg shadow-brand-tactical/20" : "border-theme-border text-theme-muted hover:border-theme-text"}`}
                    >
                      {u === "HIGH" ? "Urgente" : u === "MEDIUM" ? "Normal" : "Baixa"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Serviços</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => toggleService('temFoto', 190)} className={`py-4 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all italic ${newQuoteData.temFoto ? "border-brand-tactical text-brand-tactical bg-brand-tactical/10 shadow-sm" : "border-theme-border text-theme-muted"}`}><Camera size={14}/>FOTO</button>
                  <button type="button" onClick={() => toggleService('temVideo', 190)} className={`py-4 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all italic ${newQuoteData.temVideo ? "border-brand-tactical text-brand-tactical bg-brand-tactical/10 shadow-sm" : "border-theme-border text-theme-muted"}`}><Video size={14}/>VÍDEO</button>
                  <button type="button" onClick={() => toggleService('temReels', 120)} className={`py-4 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all italic ${newQuoteData.temReels ? "border-brand-tactical text-brand-tactical bg-brand-tactical/10 shadow-sm" : "border-theme-border text-theme-muted"}`}><Smartphone size={14}/>REELS</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Descrição</label>
                <textarea required placeholder="DETALHES ADICIONAIS..." value={newQuoteData.description} onChange={e => setNewQuoteData({...newQuoteData, description: e.target.value.toUpperCase()})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text outline-none focus:border-brand-tactical h-24 font-bold resize-none rounded-xl uppercase leading-relaxed" />
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0">
              <button type="button" onClick={() => setIsNewQuoteModalOpen(false)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                onClick={handleCreateNewQuote} 
                className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
              >
                Cadastrar no Radar
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification&&(
        <div className="fixed bottom-10 right-10 z-[300] animate-in slide-in-from-right-10 duration-500">
          <div className={`p-5 border ${notification.type==="success"?"border-brand-tactical bg-theme-bg shadow-2xl":"border-red-900 bg-theme-bg"} min-w-[300px] relative overflow-hidden rounded-xl`}>
            <div className="flex flex-col gap-1">
              <span className={`text-[8px] font-black uppercase tracking-widest ${notification.type==="success"?"text-brand-tactical":"text-red-500"}`}>Protocolo Administrativo</span>
              <p className="text-sm font-bold text-theme-text uppercase tracking-tight mt-1">{notification.message}</p>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 ${notification.type==="success"?"bg-brand-tactical":"bg-red-500"} animate-out fade-out duration-[5000ms] w-full`}/>
          </div>
        </div>
      )}
    </div>
  );
};
