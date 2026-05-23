import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, ShoppingBag, Plus, Search } from "lucide-react";
import { API } from "../../lib/api";
import { QRCodeSVG } from "qrcode.react";
import type { Partner, ExpressFormData, ProfessionalService } from "./types";

interface ExpressSaleModalProps {
  network: Partner[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
}

const INITIAL_FORM: ExpressFormData = {
  customerName: "",
  customerEmail: "",
  whatsapp: "",
  amount: 0,
  location: "",
  productType: "MULTIPLE",
  paymentMethod: "MONEY",
  internalNotes: "",
  editorId: "",
};

export function ExpressSaleModal({ network, onClose, onSuccess, onError }: ExpressSaleModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [successData, setSuccessData] = useState<{ msg: string; magicLink?: string; checkoutUrl?: string } | null>(null);
  const [form, setForm] = useState<ExpressFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalService[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [customPrice, setCustomPrice] = useState(30);
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    API.get("profissional/me").then(r => {
      setProfessionalServices(r.data.proServices || []);
    });
  }, []);

  const addToCart = (name: string, rawPrice: number | string) => {
    const price = Number(rawPrice);
    const newItem = { id: Math.random().toString(36).substr(2, 9), name, price };
    setCartItems(prev => [...prev, newItem]);
    setForm(prev => ({ ...prev, amount: prev.amount + price }));
  };

  const removeFromCart = (id: string, price: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    setForm(prev => ({ ...prev, amount: Math.max(0, prev.amount - price) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const itemsList = cartItems.map(i => `${i.name} (R$${i.price})`).join(", ");
      const payload = {
        ...form,
        productType: cartItems.length === 1 ? cartItems[0].name : "PDV_MULTIPLO",
        internalNotes: `[CARRINHO: ${itemsList}] ${form.internalNotes}`.trim(),
      };
      const { data } = await API.post("marketplace/express-sale", payload);

      setSuccessData({ 
        msg: data.isDigital ? "Venda registrada! Aguardando pagamento." : "Venda e Operação Live Print registradas!", 
        magicLink: data.magicLink,
        checkoutUrl: data.checkoutUrl
      });
      setStep(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na venda expressa.";
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = { 1: "Identificação", 2: "Configuração", 3: "Logística", 4: "Finalização", 5: "Sucesso" };

  return createPortal(
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300 dark:bg-black/95" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full h-full sm:h-[80vh] max-w-2xl flex flex-col border-none sm:border border-theme-border/60 rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl z-[10000] bg-theme-card">
        {/* Header */}
        <div className="p-8 md:p-10 border-b flex flex-col shrink-0 relative" style={{ borderColor: "var(--theme-border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                <ShoppingBag className="text-brand-tactical" size={24} />
              </div>
              <div>
                <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em] italic opacity-60">Unidade de Venda Direta</div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text leading-none">
                  {stepLabel[step]}
                </h2>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-all active:scale-90 text-theme-text/40">
              <X size={24} />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex gap-2 pt-6">
            {([1, 2, 3, 4] as const).map((s) => (
              <div key={s} className="flex-1 space-y-1">
                <div className={`h-[2px] transition-all duration-500 ${step >= s ? "bg-brand-tactical" : "bg-theme-border/20"}`} />
                <div className={`text-[9px] font-black uppercase tracking-widest ${step >= s ? "text-brand-tactical" : "text-theme-muted/20"}`}>
                  Fase 0{s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
          {/* PHASE 1: Customer Data */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">E-mail do Cliente *</label>
                  <input
                    type="email"
                    autoFocus
                    placeholder="cliente@exemplo.com"
                    value={form.customerEmail}
                    onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    onBlur={async () => {
                      if (!form.customerEmail || !form.customerEmail.includes("@")) return;
                      try {
                        const { data } = await API.get(`/public/auth/check?email=${form.customerEmail}`);
                        if (data.exists) {
                          setForm((prev) => ({ ...prev, customerName: data.name || prev.customerName, whatsapp: data.whatsapp || prev.whatsapp || "" }));
                        }
                      } catch { /* silent */ }
                    }}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={form.customerName}
                    onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={form.whatsapp}
                    onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHASE 2: Tactical POS (PDV) */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Seleção de Itens (Atalhos)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Grade de 6-8 Serviços Principais */}
                    {professionalServices
                      .filter(s => s.catalogService || s.catalog)
                      .slice(0, 8)
                      .map((s) => {
                        const name = s.catalogService?.name || s.catalog?.name || "Serviço";
                        const price = s.catalogService?.basePrice || s.catalog?.basePrice || 0;
                        return (
                          <button
                            key={s.id}
                            onClick={() => addToCart(name, price)}
                            className="p-3 text-center border border-theme-border/60 bg-theme-bg-muted hover:border-brand-tactical hover:bg-brand-tactical/5 transition-all group"
                          >
                            <div className="text-[10px] font-black text-theme-text uppercase truncate mb-1">{name}</div>
                            <div className="text-[11px] font-black text-brand-tactical italic">R$ {price}</div>
                          </button>
                        );
                      })}
                    
                    
                    {/* Botão + Adicionar (Compacto) */}
                    <button
                      onClick={() => setShowCustomForm(!showCustomForm)}
                      className={`flex flex-col items-center justify-center border-2 border-dashed transition-all rounded-xl h-full min-h-[70px] ${showCustomForm ? 'border-brand-tactical bg-brand-tactical/10' : 'border-theme-border/40 hover:border-brand-tactical/60 hover:bg-white/5'}`}
                    >
                      <Plus className={showCustomForm ? 'text-brand-tactical' : 'text-theme-muted'} size={24} />
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${showCustomForm ? 'text-brand-tactical' : 'text-theme-muted'}`}>
                        {showCustomForm ? 'Fechar' : 'Novo Item'}
                      </span>
                    </button>
                  </div>

                  {showCustomForm && (
                    <div className="p-6 bg-theme-bg-muted border border-brand-tactical/30 space-y-5 animate-in slide-in-from-top-2 rounded-2xl shadow-xl">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={14} />
                        <input 
                          autoFocus
                          placeholder="BUSCAR SERVIÇO OU CRIAR NOVO..."
                          value={serviceSearch}
                          onChange={(e) => {
                            setServiceSearch(e.target.value.toUpperCase());
                            setCustomProductName(e.target.value.toUpperCase());
                          }}
                          className="w-full bg-theme-bg border border-theme-border p-3 pl-10 text-[11px] font-black text-theme-text outline-none focus:border-brand-tactical rounded-xl uppercase transition-all"
                        />
                      </div>

                      {/* Lista de Sugestões / Serviços Disponíveis */}
                      <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {(serviceSearch 
                          ? professionalServices.filter(s => {
                              const name = s.name || s.catalogService?.name || s.catalog?.name || "";
                              return name.toUpperCase().includes(serviceSearch);
                            })
                          : professionalServices
                        ).map(s => {
                          const name = s.name || s.catalogService?.name || s.catalog?.name || "Serviço";
                          const price = s.price || s.catalogService?.basePrice || s.catalog?.basePrice || 0;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                addToCart(name, price);
                                setServiceSearch("");
                                setCustomProductName("");
                                setShowCustomForm(false);
                              }}
                              className="w-full p-3 text-left border border-theme-border/40 bg-theme-bg hover:border-brand-tactical/50 hover:bg-brand-tactical/5 transition-all flex justify-between items-center group rounded-lg"
                            >
                              <span className="text-[10px] font-black text-theme-text uppercase tracking-tight group-hover:text-brand-tactical">{name}</span>
                              <span className="text-[10px] font-black text-brand-tactical italic">R$ {price}</span>
                            </button>
                          );
                        })}
                        {professionalServices.length === 0 && !serviceSearch && (
                          <p className="text-[9px] text-center text-theme-muted uppercase tracking-widest py-4">Nenhum serviço pré-cadastrado.</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-theme-border/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Item Personalizado</span>
                          <span className="h-px flex-1 bg-theme-border/10 mx-4" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-40">Nome do Produto</label>
                            <input 
                              placeholder="EX: QUADRO LUXO"
                              value={customProductName}
                              onChange={(e) => setCustomProductName(e.target.value.toUpperCase())}
                              className="w-full bg-theme-bg border border-theme-border p-3 text-[10px] font-black text-theme-text outline-none focus:border-brand-tactical rounded-lg uppercase"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-40">Valor (R$)</label>
                            <input 
                              type="number"
                              placeholder="0,00"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(Number(e.target.value))}
                              className="w-full bg-theme-bg border border-theme-border p-3 text-[10px] font-black text-brand-tactical outline-none focus:border-brand-tactical rounded-lg"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (!customProductName) return;
                            addToCart(customProductName, customPrice);
                            setCustomProductName("");
                            setServiceSearch("");
                            setShowCustomForm(false);
                          }}
                          className="w-full py-4 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all italic rounded-xl"
                        >
                          ADICIONAR AO CUPOM
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cupom de Compras (Cart) */}
                <div className="space-y-3 pt-4 border-t border-theme-border/30">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Resumo do Cupom</label>
                    <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest bg-brand-tactical/10 px-2 py-0.5">{cartItems.length} ITENS</span>
                  </div>
                  
                  <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
                    {cartItems.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-theme-border/40 text-[9px] text-theme-muted uppercase tracking-[0.2em] font-black italic">Aguardando seleção de itens...</div>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-theme-bg-muted/50 border border-theme-border/40 group">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-theme-text uppercase tracking-tight">{item.name}</span>
                            <span className="text-[11px] font-black text-brand-tactical italic">R$ {Number(item.price).toFixed(2)}</span>
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.price)} className="text-theme-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2">
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-4 flex justify-between items-end border-t border-theme-border/60">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest block opacity-40">Total do Cupom</span>
                      <div className="text-3xl font-heading font-black text-brand-tactical italic leading-none">R$ {Number(form.amount).toFixed(2).replace(".", ",")}</div>
                    </div>
                    {cartItems.length > 0 && (
                      <button onClick={() => setStep(3)} className="bg-brand-tactical text-zinc-950 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">AVANÇAR</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3: Delegation & Payment */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                {(form.productType === "FOTOS" || form.productType === "REELS") && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Delegar Edição (Split de 40%)</label>
                    <select
                      value={form.editorId}
                      onChange={(e) => setForm((p) => ({ ...p, editorId: e.target.value }))}
                      className="w-full bg-theme-bg-muted border border-brand-tactical/30 p-4 text-theme-text font-black text-[11px] uppercase outline-none focus:border-brand-tactical appearance-none cursor-pointer"
                    >
                      <option value="">EU MESMO (RECEBER 90%)</option>
                      {network.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome.toUpperCase()} (PARCEIRO)</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Metodologia de Liquidação</label>
                  <div className="grid grid-cols-1 gap-2">
                    {([
                      { id: "MONEY", label: "💵 DINHEIRO (ABATER COMISSÃO)" },
                      { id: "PIX", label: "⚡ PIX (RECEBIMENTO INSTANTÂNEO)" },
                      { id: "CARD", label: "💳 CARTÃO (MERCADO PAGO)" },
                    ] as const).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setForm((p) => ({ ...p, paymentMethod: m.id }))}
                        className={`p-4 text-left text-[11px] font-black uppercase tracking-widest border transition-all ${
                          form.paymentMethod === m.id
                            ? "bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg"
                            : "bg-theme-bg-muted border-theme-border/60 text-theme-muted hover:border-brand-tactical/40"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 4: Review */}
          {step === 4 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 space-y-4">
                <div className="flex justify-between items-center border-b border-brand-tactical/10 pb-3">
                  <span className="text-[11px] font-black text-brand-tactical uppercase tracking-widest italic">Borderô de Transação</span>
                  <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Cliente</span>
                    <span className="text-[11px] font-black text-theme-text uppercase">{form.customerEmail}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Itens</span>
                    <div className="text-right flex flex-col gap-1">
                      {cartItems.map(item => (
                        <span key={item.id} className="text-[10px] font-black text-theme-text uppercase italic">{item.name} (R$ {item.price})</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-brand-tactical/10">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-brand-tactical uppercase italic">Total Líquido</span>
                      <span className="text-3xl font-heading font-black text-brand-tactical italic">
                        R$ {form.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* PHASE 5: Success & Share */}
          {step === 5 && successData && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-10">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShoppingBag className="text-emerald-500" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">{successData.msg}</h3>
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60 font-bold">
                  {successData.checkoutUrl ? "Apresente o link de cobrança abaixo para o cliente pagar." : "O cliente recebeu as instruções de acesso por e-mail."}
                </p>
              </div>

              {successData.checkoutUrl && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="p-4 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                    <QRCodeSVG value={successData.checkoutUrl} size={180} level="M" />
                  </div>

                  <div className="w-full p-6 bg-brand-tactical/10 border border-brand-tactical/30 rounded-[20px] space-y-4 text-left">
                    <label className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic block">Link de Pagamento (Pix / Cartão)</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      value={successData.checkoutUrl}
                      className="flex-1 bg-theme-bg border border-theme-border p-3 text-[10px] font-mono text-theme-text/60 truncate rounded-xl outline-none"
                    />
                    <button 
                      onClick={() => {
                        // BUG FIX: Navega internamente para o checkout padrão com MP Bricks
                        // em vez de abrir o Checkout Pro externo do MP
                        onClose();
                        navigate(successData.checkoutUrl!.replace(window.location.origin, '') || successData.checkoutUrl!);
                      }}
                      className="px-6 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all"
                    >
                      ABRIR CHECKOUT
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(successData.checkoutUrl || "");
                      onSuccess("Link de pagamento copiado com sucesso!");
                    }}
                    className="w-full py-3 bg-white/5 border border-white/10 text-theme-text text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all text-center font-bold"
                  >
                    COPIAR LINK DE PAGAMENTO
                  </button>
                </div>
                </div>
              )}

              {successData.magicLink && (
                <div className="p-6 bg-theme-bg-muted border border-theme-border/60 rounded-[20px] space-y-4 text-left">
                  <label className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic block">Link de Acesso Rápido do Cliente</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      value={successData.magicLink}
                      className="flex-1 bg-theme-bg border border-theme-border p-3 text-[10px] font-mono text-theme-text/60 truncate rounded-xl outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(successData.magicLink || "");
                        onSuccess("Link copiado para a área de transferência!");
                      }}
                      className="px-6 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full py-5 bg-white/5 border border-white/10 text-theme-text text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all italic rounded-xl"
              >
                FECHAR UNIDADE DE VENDA
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-8 md:p-10 border-t bg-theme-bg-muted/80 flex shrink-0" style={{ borderColor: "var(--theme-border)" }}>
          {step === 5 ? null : (
            step === 1 ? (
              <button
                disabled={!form.customerEmail}
                onClick={() => setStep(2)}
                className="w-full py-5 bg-brand-tactical text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-[1.01] active:scale-[0.98] transition-all italic flex items-center justify-center gap-4 shadow-2xl shadow-brand-tactical/20 disabled:opacity-40"
              >
                CONTINUAR OPERAÇÃO
              </button>
            ) : (
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4 | 5)}
                  className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-theme-text text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={() => (step === 4 ? handleSubmit() : setStep((step + 1) as 1 | 2 | 3 | 4 | 5))}
                  disabled={loading}
                  className="flex-[2] py-5 bg-brand-tactical text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-[1.01] active:scale-[0.98] transition-all italic flex items-center justify-center gap-4 shadow-2xl shadow-brand-tactical/20"
                >
                  {loading
                    ? "PROCESSANDO..."
                    : step === 4
                    ? form.paymentMethod === "MONEY"
                      ? "FINALIZAR E ENVIAR ACESSO"
                      : "GERAR COBRANÇA"
                    : "PRÓXIMA FASE"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
