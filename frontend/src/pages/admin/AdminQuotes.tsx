import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { 
  Briefcase, 
  Mail, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  CheckCircle, 
  Send,
  Search,
  DollarSign,
  User,
  Info
} from "lucide-react";

interface Quote {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  location: string;
  description: string;
  clientEmail: string;
  clientName: string;
  quoteStatus: "PENDING" | "PRICED" | "APPROVED" | "REJECTED";
  priceBase: number;
  usageType: string;
  createdAt: string;
}

export const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [price, setPrice] = useState("");
  const [approving, setApproving] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/quotes", { params: { q: search } });
      setQuotes(data.quotes);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [search]);

  const handleApprove = async () => {
    if (!selectedQuote || !price) return;
    setApproving(true);
    try {
      await API.post(`/admin/quotes/${selectedQuote.id}/approve`, { finalPrice: price });
      alert("Orçamento aprovado e e-mail enviado com sucesso! 🚀");
      setSelectedQuote(null);
      setPrice("");
      fetchQuotes();
    } catch (err) {
      console.error(err);
      alert("Erro ao aprovar orçamento.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-4xl font-heading text-theme-text italic uppercase tracking-tighter">Máquina de Vendas</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-bold italic">Gestão de Leads e Orçamentos Customizados</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted" size={14} />
          <input
            type="text"
            placeholder="PROCURAR POR NOME OU E-MAIL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-b border-white/5 py-4 pl-8 text-[11px] text-white placeholder-theme-muted/30 focus:outline-none focus:border-brand-tactical transition-all uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* List of Quotes */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
             <div className="py-20 text-center border border-white/5 bg-white/[0.01]">
                <div className="text-[10px] text-theme-muted animate-pulse uppercase tracking-[0.5em]">Escaneando Leads...</div>
             </div>
          ) : quotes.length > 0 ? (
            quotes.map((quote) => (
              <div 
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`group p-8 border hover:bg-white/[0.03] transition-all cursor-pointer relative overflow-hidden ${
                  selectedQuote?.id === quote.id ? "bg-white/[0.05] border-brand-tactical" : "bg-white/[0.01] border-white/5"
                }`}
              >
                {quote.quoteStatus === "PENDING" && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-brand-tactical/30" />
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-bold px-2 py-0.5 uppercase tracking-widest border ${
                        quote.quoteStatus === "PENDING" ? "border-brand-tactical text-brand-tactical" : "border-zinc-800 text-zinc-500"
                      }`}>
                        {quote.quoteStatus}
                      </span>
                      <span className="text-[9px] text-theme-muted font-sans">{new Date(quote.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <h3 className="text-xl font-heading text-white uppercase tracking-tight italic group-hover:text-brand-tactical transition-colors">
                      {quote.nomeNoivos}
                    </h3>
                    <div className="flex flex-wrap gap-6 items-center">
                       <div className="flex items-center gap-2 text-[10px] text-theme-muted uppercase tracking-widest font-bold">
                         <User size={12} className="text-brand-tactical" /> {quote.clientName || "Convidado"}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-theme-muted uppercase tracking-widest">
                         <Mail size={12} className="text-zinc-700" /> {quote.clientEmail}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[9px] text-theme-muted uppercase tracking-widest mb-1">Status</div>
                      <div className="text-[11px] text-white font-bold uppercase tracking-widest">
                        {quote.quoteStatus === "PENDING" ? "Aguardando Preço" : "Enviado"}
                      </div>
                    </div>
                    <ChevronRight size={20} className={`text-zinc-800 group-hover:text-brand-tactical transition-all ${selectedQuote?.id === quote.id ? "rotate-90 text-brand-tactical" : ""}`} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border border-white/5 bg-white/[0.01]">
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] italic">Nenhum orçamento pendente no momento.</p>
            </div>
          )}
        </div>

        {/* Selected Details & Pricing */}
        <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit">
          {selectedQuote ? (
            <div className="bg-white/[0.02] border border-white/5 p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h4 className="text-[11px] font-bold text-brand-tactical uppercase tracking-[0.5em] mb-6">Detalhamento do Evento</h4>
                  <div className="space-y-6">
                     <div className="flex gap-4 items-start">
                        <Calendar size={14} className="text-zinc-700 mt-1" />
                        <div>
                          <div className="text-[9px] text-theme-muted uppercase font-bold tracking-widest mb-1">Data Solicitada</div>
                          <div className="text-[11px] text-white uppercase font-bold">{new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")}</div>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <MapPin size={14} className="text-zinc-700 mt-1" />
                        <div>
                          <div className="text-[9px] text-theme-muted uppercase font-bold tracking-widest mb-1">Localização</div>
                          <div className="text-[11px] text-white uppercase font-bold">{selectedQuote.location}</div>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <Info size={14} className="text-zinc-700 mt-1" />
                        <div>
                          <div className="text-[9px] text-theme-muted uppercase font-bold tracking-widest mb-1">Tipo de Uso</div>
                          <div className="text-[11px] text-brand-tactical uppercase font-bold tracking-widest">{selectedQuote.usageType || "PESSOAL"}</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-white/5">
                  <h4 className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.5em] mb-4">Briefing do Cliente</h4>
                  <div className="bg-black/40 p-6 border border-white/5 text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest whitespace-pre-line">
                    {selectedQuote.description}
                  </div>
               </div>

               {selectedQuote.quoteStatus === "PENDING" ? (
                 <div className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-white uppercase tracking-[0.4em] flex items-center gap-2">
                        <DollarSign size={12} className="text-brand-tactical" /> Definir Preço Final (R$)
                      </label>
                      <input 
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-theme-bg-muted border border-white/10 py-5 px-6 text-2xl font-heading text-white focus:outline-none focus:border-brand-tactical"
                      />
                    </div>

                    <button 
                      onClick={handleApprove}
                      disabled={!price || approving}
                      className="w-full bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] py-6 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {approving ? "ENVIANDO..." : <><Send size={14} /> APROVAR E ENVIAR E-MAIL</>}
                    </button>
                 </div>
               ) : (
                 <div className="pt-6">
                    <div className="bg-brand-tactical/5 border border-brand-tactical/20 p-6 text-center">
                       <CheckCircle size={24} className="text-brand-tactical mx-auto mb-4" />
                       <div className="text-[10px] text-brand-tactical font-bold uppercase tracking-widest">Orçamento Já Enviado</div>
                       <div className="text-[11px] text-white font-bold mt-2 font-sans">VALOR: R$ {Number(selectedQuote.priceBase).toFixed(2)}</div>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="h-full border border-dashed border-white/10 flex flex-col items-center justify-center p-20 text-center opacity-40">
               <Briefcase size={40} className="text-zinc-800 mb-6" />
               <p className="text-[9px] text-theme-muted uppercase tracking-[0.5em] font-bold italic">Selecione um orçamento para visualizar os detalhes e precificar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
