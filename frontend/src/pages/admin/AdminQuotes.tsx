import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { 
  Briefcase, 
  Mail, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  CheckCircle, 
  Search,
  DollarSign,
  User,
} from "lucide-react";

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
  createdAt: string;
}

export const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [price, setPrice] = useState("");
  const [approving, setApproving] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/quotes", { params: { q: search } });
      setQuotes(data.quotes);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, paddingBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 32, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1, lineHeight: 1 }}>Máquina de Vendas</h2>
          <p style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 8, fontStyle: "italic" }}>Gestão de Leads e Orçamentos Customizados</p>
        </div>
        
        <div style={{ position: "relative", width: 320 }}>
          <Search style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: T.text3 }} size={14} />
          <input
            type="text"
            placeholder="PROCURAR POR NOME OU E-MAIL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`,
              padding: "12px 0 12px 24px", fontSize: 9, color: T.text, textTransform: "uppercase", letterSpacing: 2, outline: "none"
            }}
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
                style={{ 
                  padding: "16px 24px", border: `1px solid ${selectedQuote?.id === quote.id ? T.brand : T.border}`,
                  background: selectedQuote?.id === quote.id ? `${T.brand}08` : T.bgCard,
                  cursor: "pointer", position: "relative", transition: "all 0.2s"
                }}
              >
                {quote.quoteStatus === "PENDING" && (
                  <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: "100%", background: T.brand }} />
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span style={{ 
                        fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, 
                        border: `1px solid ${quote.quoteStatus === "PENDING" ? T.brand : T.border}`,
                        color: quote.quoteStatus === "PENDING" ? T.brand : T.text3,
                        padding: "2px 6px"
                      }}>
                        {quote.quoteStatus}
                      </span>
                      <span style={{ fontSize: 9, color: T.text3 }}>{new Date(quote.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.5 }}>
                      {quote.nomeNoivos}
                    </h3>
                    <div className="flex flex-wrap gap-4 items-center">
                       <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: T.text3, fontWeight: 900, textTransform: "uppercase" }}>
                         <User size={10} style={{ color: T.brand }} /> {quote.clientName || "Convidado"}
                       </div>
                       <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: T.text3, textTransform: "uppercase" }}>
                         <Mail size={10} /> {quote.clientEmail}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Lead</div>
                      <div style={{ fontSize: 10, color: T.text, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
                        {quote.quoteStatus === "PENDING" ? "Pendente" : "Processado"}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: selectedQuote?.id === quote.id ? T.brand : T.text3, transition: "all 0.2s", transform: selectedQuote?.id === quote.id ? "rotate(90deg)" : "none" }} />
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
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: "24px" }} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h4 style={{ fontSize: 9, fontWeight: 900, color: T.brand, textTransform: "uppercase", letterSpacing: 4, marginBottom: 16 }}>Detalhamento</h4>
                  <div className="space-y-4">
                     <div className="flex gap-3 items-start">
                        <Calendar size={12} style={{ color: T.text3, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", fontWeight: 900, marginBottom: 2 }}>Data Solicitada</div>
                          <div style={{ fontSize: 11, color: T.text, fontWeight: 900 }}>{new Date(selectedQuote.dataEvento).toLocaleDateString("pt-BR")}</div>
                        </div>
                     </div>
                     <div className="flex gap-3 items-start">
                        <MapPin size={12} style={{ color: T.text3, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", fontWeight: 900, marginBottom: 2 }}>Localização</div>
                          <div style={{ fontSize: 11, color: T.text, fontWeight: 900 }}>{selectedQuote.location}</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  <h4 style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Briefing</h4>
                  <div style={{ background: `${T.bgField}88`, padding: "12px", border: `1px solid ${T.border}`, fontSize: 9, color: T.text2, lineHeight: 1.6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {selectedQuote.description}
                  </div>
               </div>

               {selectedQuote.quoteStatus === "PENDING" ? (
                 <div className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <label style={{ fontSize: 9, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <DollarSign size={10} style={{ color: T.brand }} /> Definir Preço (R$)
                      </label>
                      <input 
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        style={{ width: "100%", background: T.bgField, border: `1px solid ${T.border}`, padding: "12px", fontSize: 20, fontFamily: T.fontD, fontWeight: 900, color: T.text, outline: "none" }}
                      />
                    </div>

                    <button 
                      onClick={handleApprove}
                      disabled={!price || approving}
                      style={{ 
                        width: "100%", background: T.brand, color: T.brandText, padding: "16px", 
                        fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
                        letterSpacing: 2, cursor: "pointer", border: "none", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {approving ? "ENVIANDO..." : "APROVAR E ENVIAR E-MAIL"}
                    </button>
                 </div>
               ) : (
                 <div className="pt-4">
                    <div style={{ background: `${T.brand}08`, border: `1px solid ${T.brand}22`, padding: "16px", textAlign: "center" }}>
                       <CheckCircle size={20} style={{ color: T.brand, margin: "0 auto 8px" }} />
                       <div style={{ fontSize: 9, color: T.brand, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Orçamento Enviado</div>
                       <div style={{ fontSize: 12, color: T.text, fontWeight: 900, marginTop: 4 }}>R$ {Number(selectedQuote.priceBase).toFixed(2)}</div>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="h-full border border-dashed border-theme-border flex flex-col items-center justify-center p-20 text-center opacity-40">
               <Briefcase size={40} className="text-zinc-800 mb-6" />
               <p className="text-[9px] text-theme-muted uppercase tracking-[0.5em] font-bold italic">Selecione um orçamento para visualizar os detalhes e precificar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
