import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import { 
  Briefcase, Mail, ChevronRight, 
  Search, User, Plus, Trash2,
  HardDrive, Users, Settings, MapPin
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
  quoteStatus: "PENDING" | "PRICED" | "APPROVED" | "REJECTED" | "CONVERTED";
  priceBase: number;
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

interface PlatformUser {
  id: string;
  nome: string;
  role: string;
}

export const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [activeTab, setActiveTab] = useState<"briefing" | "equipe" | "locacao" | "logistica" | "hospedagem" | "fechamento">("briefing");

  // State for Pricing Methodology
  const [selectedStaff, setSelectedStaff] = useState<{id: string, label: string, cost: number, userId?: string}[]>([]);
  const [customRoleName, setCustomRoleName] = useState("");
  const [selectedEquip, setSelectedEquip] = useState<{id: string, qty: number}[]>([]);
  
  // New Logistics & Lodging State
  const [transportType, setTransportType] = useState<string>("nenhum");
  const [transportCost, setTransportCost] = useState<number>(0);
  const [lodgingType, setLodgingType] = useState<string>("nenhum");
  const [lodgingCost, setLodgingCost] = useState<number>(0);

  const [margin, setMargin] = useState(30); 
  const [isSplit, setIsSplit] = useState(true);
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, uRes] = await Promise.all([
        API.get("/admin/quotes", { params: { q: search } }),
        API.get("/admin/users")
      ]);
      setQuotes(qRes.data.quotes);
      setUsers(uRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Calculations
  const staffTotal = selectedStaff.reduce((acc, s) => acc + s.cost, 0);
  const equipTotal = selectedEquip.reduce((acc, e) => {
    const item = MERLIN_EQUIPMENT.find(m => m.id === e.id);
    return acc + (item ? item.price * e.qty : 0);
  }, 0);
  const costTotal = staffTotal + equipTotal + transportCost + lodgingCost;
  const suggestedPrice = costTotal > 0 ? costTotal / (1 - margin / 100) : 0;
  const [finalPrice, setFinalPrice] = useState<number>(0);

  useEffect(() => {
    if (suggestedPrice > 0) setFinalPrice(Math.ceil(suggestedPrice));
  }, [suggestedPrice]);

  const handleApprove = async () => {
    if (!selectedQuote || finalPrice <= 0) return;
    setApproving(true);
    try {
      await API.patch(`/admin/quotes/${selectedQuote.id}/approve`, { 
        finalPrice,
        isSplit,
        breakdown: { 
          staff: selectedStaff, 
          equipment: selectedEquip, 
          transport: { type: transportType, cost: transportCost },
          lodging: { type: lodgingType, cost: lodgingCost },
          costTotal, 
          margin 
        }
      });
      setNotification({ message: "Orçamento aprovado e e-mail enviado com sucesso! 🚀", type: 'success' });
      setSelectedQuote(null);
      setActiveTab("briefing");
      fetchQuotes();
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erro ao aprovar orçamento.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setApproving(false);
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

  const addCustomRole = () => {
    if (!customRoleName) return;
    const newId = `custom-${Date.now()}`;
    setSelectedStaff([...selectedStaff, { id: newId, label: customRoleName, cost: 0 }]);
    setCustomRoleName("");
  };

  const addProfessional = (user: PlatformUser) => {
    const exists = selectedStaff.find(s => s.userId === user.id);
    if (exists) return;
    const newId = `user-${user.id}`;
    setSelectedStaff([...selectedStaff, { id: newId, label: user.nome, cost: 350, userId: user.id }]);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-theme-border pb-8">
        <div>
          <h2 className="text-2xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase font-black leading-none pt-2">Máquina de Vendas</h2>
          <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-black italic">Gestão de Leads e Orçamentos Customizados</p>
        </div>
        
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted" size={14} />
          <input
            type="text"
            placeholder="PROCURAR POR NOME OU E-MAIL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none border-b border-theme-border py-3 pl-8 text-[10px] text-theme-text uppercase tracking-widest outline-none focus:border-brand-tactical transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* List of Quotes */}
        <div className="lg:col-span-6 space-y-4">
          {loading ? (
             <div className="py-20 text-center border border-white/5 bg-white/[0.01]">
                <div className="text-[10px] text-theme-muted animate-pulse uppercase tracking-[0.5em]">Escaneando Leads...</div>
             </div>
          ) : quotes.length > 0 ? (
            quotes.map((quote) => (
              <div 
                key={quote.id}
                onClick={() => {
                  setSelectedQuote(quote);
                  setActiveTab("briefing");
                  
                  // Reset states
                  setSelectedStaff([]);
                  setSelectedEquip([]);
                  setTransportCost(0);
                  setTransportType("nenhum");
                  setLodgingCost(0);
                  setLodgingType("nenhum");
                  setMargin(30);

                  // Restore from breakdown if exists
                  const breakdownMatch = (quote.description || "").match(/\[BUDGET_BREAKDOWN\]\s*({.*})/s);
                  if (breakdownMatch) {
                    try {
                      const data = JSON.parse(breakdownMatch[1]);
                      if (data.staff) setSelectedStaff(data.staff);
                      if (data.equipment) setSelectedEquip(data.equipment);
                      if (data.transport) {
                        setTransportCost(data.transport.cost || 0);
                        setTransportType(data.transport.type || "nenhum");
                      }
                      if (data.lodging) {
                        setLodgingCost(data.lodging.cost || 0);
                        setLodgingType(data.lodging.type || "nenhum");
                      }
                      if (data.margin !== undefined) setMargin(data.margin);
                    } catch (e) {
                      console.error("Erro ao parsear breakdown:", e);
                    }
                  }
                }}
                className={`p-6 border transition-all ${selectedQuote?.id === quote.id ? 'border-brand-tactical bg-brand-tactical/5' : 'border-theme-border bg-theme-bg-muted hover:border-zinc-700'}`}
                style={{ cursor: "pointer", position: "relative" }}
              >
                {quote.quoteStatus === "PENDING" && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical" />
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 ${quote.quoteStatus === 'PENDING' ? 'border-brand-tactical text-brand-tactical' : 'border-theme-border text-theme-muted'}`}>
                        {quote.quoteStatus}
                      </span>
                      <span className="text-[9px] text-theme-muted font-bold tracking-wider">{new Date(quote.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <h3 className="text-xl font-heading font-black text-theme-text uppercase tracking-tighter leading-none">
                      {quote.nomeNoivos}
                    </h3>
                    <div className="flex flex-wrap gap-6 items-center">
                       <div className="flex items-center gap-2 text-[10px] text-theme-muted font-black uppercase tracking-wider">
                         <User size={12} className="text-brand-tactical" /> {quote.clientName || "Lead"}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-theme-muted uppercase tracking-wider font-bold">
                         <Mail size={12} /> {quote.clientEmail}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[8px] text-theme-muted uppercase tracking-widest font-black mb-1">Status</div>
                      <div className="text-[10px] text-theme-text font-black uppercase tracking-widest">
                        {quote.quoteStatus === "PENDING" ? "Aguardando" : "Finalizado"}
                      </div>
                    </div>
                    <ChevronRight size={18} className={`transition-all ${selectedQuote?.id === quote.id ? 'text-brand-tactical rotate-90' : 'text-theme-muted'}`} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border border-dashed border-theme-border bg-white/[0.01]">
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] italic font-black">Silêncio no radar de vendas.</p>
            </div>
          )}
        </div>

        {/* Selected Details & Budgeting Studio */}
        <div className="lg:col-span-6 lg:sticky lg:top-10 h-fit">
          {selectedQuote ? (
            <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl">
               <div className="flex gap-3 border-b border-theme-border pb-4 overflow-x-auto no-scrollbar scroll-smooth">
                 {(['briefing', 'equipe', 'locacao', 'logistica', 'hospedagem', 'fechamento'] as const).map(t => (
                   <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`pb-2 text-[8px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${activeTab === t ? 'text-brand-tactical' : 'text-theme-muted hover:text-white'}`}
                   >
                     {t}
                     {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-tactical" />}
                   </button>
                 ))}
               </div>

               {/* TAB CONTENTS */}
               <div className="min-h-[400px]">
                  {activeTab === 'briefing' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block">Data do Evento</span>
                            <p className="text-sm font-black text-theme-text uppercase">{new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block">Local</span>
                            <p className="text-sm font-black text-theme-text uppercase">{selectedQuote.location || "Não informado"}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block">Tipo de Uso</span>
                            <p className="text-sm font-black text-theme-text uppercase">{selectedQuote.usageType || "PESSOAL"}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block">Duração Estimada</span>
                            <p className="text-sm font-black text-theme-text uppercase">{selectedQuote.eventHours || 2} Horas</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] border-b border-theme-border pb-2">Serviços Solicitados</h4>
                        <div className="flex flex-wrap gap-2">
                          {/* 1. Campos Booleanos Diretos */}
                          {selectedQuote.temFoto && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Fotografia</span>}
                          {selectedQuote.temFotoEditada && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Fotos Editadas</span>}
                          {selectedQuote.temVideo && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Vídeo</span>}
                          {selectedQuote.temVideoEditado && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Vídeo Editado</span>}
                          {selectedQuote.temReels && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Reels / Mobile</span>}
                          {selectedQuote.temFotoImpressa && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Fotos Impressas</span>}
                          {selectedQuote.temAlbumImpresso && <span className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest">Álbum Premium</span>}

                          {/* 2. Parser de Texto para Orçamentos Automáticos (Regex Ultra Permissivo) */}
                          {(() => {
                            const desc = selectedQuote.description || "";
                            const svcMatch = desc.match(/SERVI[ÇC]O[S]?[:]?\s*([\d\s,]+)/i);
                            if (!svcMatch) return null;
                            const ids = svcMatch[1].replace(/[^\d,]/g, '').split(',').filter(id => id.length > 0);
                            const map: Record<string, string> = {
                              "1": "Fotografia", "2": "Vídeo", "3": "Fotos Editadas", "4": "Vídeo Editado", "5": "Reels / Mobile", "6": "Fotos Impressas", "7": "Álbum Premium"
                            };
                            return ids.map(id => map[id] ? (
                              <span key={`parsed-${id}`} className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black px-3 py-1 border border-brand-tactical/20 uppercase tracking-widest inline-block">
                                {map[id]}
                              </span>
                            ) : null);
                          })()}

                          {/* 3. Parser de Convidados */}
                          {(() => {
                             const guestsMatch = (selectedQuote.description || "").match(/CONVIDADO[S]?[:]?\s*(\d+)/i);
                             if (guestsMatch) {
                               return <span className="bg-white/5 text-theme-muted text-[9px] font-black px-3 py-1 border border-white/10 uppercase tracking-widest inline-block">Público: {guestsMatch[1]} pessoas</span>;
                             }
                             return null;
                          })()}
                        </div>
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] border-b border-theme-border pb-2">Briefing e Observações</h4>
                         <div className="bg-theme-bg p-6 border border-theme-border text-[11px] text-theme-text leading-relaxed uppercase tracking-widest font-bold opacity-80 italic whitespace-pre-wrap">
                           {(selectedQuote.description || "").replace(/\[BUDGET_BREAKDOWN\].*?(?=ORIGINAL:|$)/s, "").trim() || "Sem observações adicionais."}
                         </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'equipe' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={14} /> Escala Técnica e Humana
                      </h4>
                      <div className="space-y-3">
                        <p className="text-[8px] text-theme-muted uppercase font-black tracking-widest">Funções Sugeridas</p>
                        <div className="flex flex-wrap gap-2">
                          {STAFF_ROLES.map(role => (
                            <button
                              key={role.id}
                              onClick={() => toggleStaffPreset(role.id)}
                              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-all ${selectedStaff.find(s => s.id === role.id) ? 'border-brand-tactical bg-brand-tactical text-black' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}
                            >
                              {role.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[8px] text-theme-muted uppercase font-black tracking-widest">Função Extra / Manual</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="EX: PILOTO DE DRONE, MAKEUP..." 
                            value={customRoleName}
                            onChange={(e) => setCustomRoleName(e.target.value.toUpperCase())}
                            className="flex-1 bg-theme-bg-muted border border-theme-border p-2 text-[10px] font-black text-theme-text outline-none focus:border-brand-tactical"
                          />
                          <button onClick={addCustomRole} className="bg-brand-tactical p-2 text-black hover:bg-white transition-all"><Plus size={14}/></button>
                        </div>
                      </div>
                      <div className="space-y-3">
                         <p className="text-[8px] text-theme-muted uppercase font-black tracking-widest">Vincular Profissional da Rede</p>
                         <div className="max-h-32 overflow-y-auto border border-theme-border p-2 space-y-1 bg-theme-bg/50 custom-scrollbar">
                           {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                             <div key={u.id} className="flex items-center justify-between p-2 hover:bg-brand-tactical/10 transition-all border-b border-white/5 last:border-0">
                               <span className="text-[10px] font-bold text-theme-text uppercase">{u.nome}</span>
                               <button onClick={() => addProfessional(u)} className="text-brand-tactical p-1 hover:text-white transition-all"><Plus size={12}/></button>
                             </div>
                           ))}
                         </div>
                      </div>

                      <div className="pt-6 border-t border-theme-border space-y-3">
                        <p className="text-[10px] font-black text-theme-text uppercase tracking-widest">Escala Técnica (Resumo)</p>
                        {selectedStaff.length === 0 && <p className="text-[9px] text-zinc-800 italic uppercase font-black">Nenhuma função atribuída ao evento.</p>}
                        {selectedStaff.map(s => (
                          <div key={s.id} className="p-4 border border-theme-border bg-theme-bg flex items-center justify-between group hover:border-brand-tactical transition-all">
                             <div className="flex flex-col">
                               <span className="text-[11px] font-black uppercase tracking-widest text-brand-tactical">{s.label}</span>
                               {s.userId && <span className="text-[8px] text-theme-muted uppercase font-black tracking-tighter opacity-70">Artista Cadastrado</span>}
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-theme-muted font-black uppercase">Custo:</span>
                                  <input 
                                    type="number" 
                                    value={s.cost}
                                    onChange={(e) => setSelectedStaff(selectedStaff.map(x => x.id === s.id ? { ...x, cost: Number(e.target.value) } : x))}
                                    className="w-20 bg-theme-bg-muted border border-theme-border p-2 text-[11px] font-black text-theme-text outline-none focus:border-brand-tactical text-right" 
                                  />
                                </div>
                                <button onClick={() => setSelectedStaff(selectedStaff.filter(x => x.id !== s.id))} className="text-red-900 opacity-20 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                             </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-6 border-t border-theme-border flex justify-between items-center">
                        <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Investimento Operacional Equipe</span>
                        <span className="text-xl font-heading font-black text-theme-text tracking-tighter">R$ {staffTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'locacao' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em] flex items-center gap-2">
                          <HardDrive size={14} /> Locação Merlin
                        </h4>
                        <span className="text-[9px] text-theme-muted uppercase font-black bg-theme-bg px-2 py-1 border border-theme-border">Catálogo 2026</span>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {MERLIN_EQUIPMENT.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-theme-bg border border-theme-border hover:border-zinc-600 group transition-all">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">{item.name}</p>
                              <p className="text-[8px] text-theme-muted uppercase font-bold">{item.category} · R$ {item.price}/dia</p>
                            </div>
                            <button onClick={() => addEquip(item.id)} className="p-2 text-brand-tactical opacity-20 group-hover:opacity-100 transition-all">
                              <Plus size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 pt-6 border-t border-theme-border">
                        <p className="text-[10px] font-black text-theme-text uppercase tracking-widest mb-4">Inventário Selecionado</p>
                        {selectedEquip.length === 0 && <p className="text-[9px] text-zinc-800 italic uppercase font-black">Nenhum item adicionado.</p>}
                        {selectedEquip.map(e => {
                          const item = MERLIN_EQUIPMENT.find(m => m.id === e.id);
                          return (
                            <div key={e.id} className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest bg-theme-bg border border-theme-border p-3">
                               <span>{item?.name} (x{e.qty})</span>
                               <div className="flex items-center gap-4">
                                 <span>R$ {(item?.price || 0) * e.qty}</span>
                                 <button onClick={() => setSelectedEquip(selectedEquip.filter(x => x.id !== e.id))} className="text-red-900"><Trash2 size={12}/></button>
                               </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="pt-6 border-t border-theme-border flex justify-between items-center">
                        <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Subtotal Equipamentos</span>
                        <span className="text-xl font-heading font-black text-theme-text tracking-tighter">R$ {equipTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'logistica' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em] flex items-center gap-2">
                        <Briefcase size={14} /> Logística de Deslocamento
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {(['onibus', 'carro', 'uber', 'aviao', 'nenhum'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setTransportType(type)}
                            className={`p-4 border text-[10px] font-black uppercase tracking-widest transition-all ${transportType === type ? 'border-brand-tactical bg-brand-tactical text-black' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-4 pt-6 border-t border-theme-border">
                         <div className="flex flex-col gap-2">
                           <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Custo de Deslocamento (R$)</label>
                           <input 
                            type="number"
                            value={transportCost}
                            onChange={(e) => setTransportCost(Number(e.target.value))}
                            className="w-full bg-theme-bg border border-theme-border p-4 text-xl font-black text-theme-text outline-none focus:border-brand-tactical"
                           />
                         </div>
                      </div>

                      <div className="pt-6 border-t border-theme-border flex justify-between items-center text-theme-muted uppercase font-black text-[10px]">
                        <span>Total Logística</span>
                        <span>R$ {transportCost.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'hospedagem' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em] flex items-center gap-2">
                         <MapPin size={14} /> Hospedagem e Acomodação
                      </h4>

                      <div className="grid grid-cols-3 gap-4">
                        {(['hotel', 'airbnb', 'nenhum'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setLodgingType(type)}
                            className={`p-4 border text-[10px] font-black uppercase tracking-widest transition-all ${lodgingType === type ? 'border-brand-tactical bg-brand-tactical text-black' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-4 pt-6 border-t border-theme-border">
                         <div className="flex flex-col gap-2">
                           <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Custo de Hospedagem (R$)</label>
                           <input 
                            type="number"
                            value={lodgingCost}
                            onChange={(e) => setLodgingCost(Number(e.target.value))}
                            className="w-full bg-theme-bg border border-theme-border p-4 text-xl font-black text-theme-text outline-none focus:border-brand-tactical"
                           />
                         </div>
                      </div>

                      <div className="pt-6 border-t border-theme-border flex justify-between items-center text-theme-muted uppercase font-black text-[10px]">
                        <span>Total Hospedagem</span>
                        <span>R$ {lodgingCost.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'fechamento' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em] flex items-center gap-2">
                        <Settings size={14} /> Consolidação de Orçamento
                      </h4>

                      <div className="bg-theme-bg p-6 border border-theme-border space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                          <span>Equipe</span>
                          <span>R$ {staffTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                          <span>Equipamentos (Merlin)</span>
                          <span>R$ {equipTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                          <span>Logística (Transporte)</span>
                          <span>R$ {transportCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                          <span>Hospedagem</span>
                          <span>R$ {lodgingCost.toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand-tactical">
                          <span>Custo Operacional Total</span>
                          <span>R$ {costTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span>Margem Pretendida (%)</span>
                          <input 
                            type="number" 
                            value={margin} 
                            onChange={(e) => setMargin(Number(e.target.value))}
                            className="w-16 bg-transparent border-b border-theme-border text-right text-brand-tactical outline-none" 
                          />
                        </div>
                        <div className="pt-4 border-t border-theme-border/50 flex justify-between items-center">
                          <span className="text-[11px] font-black uppercase tracking-widest text-brand-tactical">Preço Sugerido (Break-even)</span>
                          <span className="text-xl font-heading font-black text-brand-tactical">R$ {Math.ceil(suggestedPrice).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-theme-text uppercase tracking-widest">Preço Final ao Cliente (R$)</label>
                           <input 
                            type="number"
                            value={finalPrice}
                            onChange={(e) => setFinalPrice(Number(e.target.value))}
                            className="w-full bg-theme-bg border border-brand-tactical p-4 text-3xl font-heading font-black text-theme-text outline-none focus:shadow-[0_0_20px_rgba(133,185,172,0.1)] transition-all"
                           />
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-theme-bg border border-theme-border">
                           <input type="checkbox" checked={isSplit} onChange={() => setIsSplit(!isSplit)} className="accent-brand-tactical w-4 h-4" />
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-widest">Pagamento 50/50</p>
                             <p className="text-[8px] text-theme-muted uppercase font-bold">Gerar reserva antecipada + quitação na entrega</p>
                           </div>
                        </div>

                        <button 
                          onClick={handleApprove}
                          disabled={finalPrice <= 0 || approving}
                          className="w-full bg-brand-tactical text-black p-5 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                          {approving ? "PROCESSANDO..." : <><Mail size={16} /> ENVIAR ORÇAMENTO OFICIAL</>}
                        </button>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="h-[600px] border border-dashed border-theme-border flex flex-col items-center justify-center p-20 text-center opacity-40">
               <Briefcase size={48} className="text-zinc-800 mb-8" />
               <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic max-w-xs leading-relaxed">
                 O radar está limpo. Selecione uma oportunidade para iniciar a engenharia de preço.
               </p>
            </div>
          )}
        </div>
      </div>
      {/* NOTIFICATION (MIDNIGHT LUXURY) */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 md:top-auto md:bottom-10 md:right-10 md:left-auto md:translate-x-0 z-[100] animate-in slide-in-from-top-10 md:slide-in-from-right-10 duration-500 w-[90vw] md:w-auto">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[300px] relative overflow-hidden`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Protocolo Concluído' : 'Falha no Sistema'}
                 </span>
                 <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};
