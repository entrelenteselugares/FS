import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { API } from "../../lib/api";
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<ExpressFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalService[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [customPrice, setCustomPrice] = useState(30);

  useEffect(() => {
    API.get("profissional/me").then(r => {
      setProfessionalServices(r.data.proServices || []);
    });
  }, []);

  const addToCart = (name: string, price: number) => {
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

      if (data.isDigital && data.orderId) {
        onSuccess("Venda registrada! Abrindo portal de pagamento...");
        setTimeout(() => {
          window.location.href = `/checkout/${data.orderId}`;
          onClose();
        }, 1500);
        return;
      }
      onSuccess("Venda e Operação registradas com sucesso!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na venda expressa.";
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = { 1: "Identificação", 2: "Configuração", 3: "Logística", 4: "Finalização" };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-theme-bg border border-theme-border shadow-[0_0_100px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col min-h-[540px]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-tactical to-transparent" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-tactical/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

        {/* Header */}
        <div className="p-5 md:p-8 border-b border-theme-border/60 space-y-3 relative z-10">
          <button onClick={onClose} className="absolute top-5 right-5 text-theme-muted hover:text-brand-tactical transition-all">
            <X size={20} />
          </button>
          <div className="space-y-0.5">
            <div className="text-[8px] md:text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Unidade de Venda Direta</div>
            <h2 className="text-xl md:text-2xl font-heading font-black text-theme-text uppercase italic leading-none">
              {stepLabel[step]}
            </h2>
          </div>
          <div className="flex gap-2 pt-1">
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
        <div className="p-5 md:p-8 flex flex-col flex-grow relative z-10 overflow-y-auto max-h-[70vh]">
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
                    
                    {/* Botão Outros */}
                    <button
                      onClick={() => setShowCustomForm(!showCustomForm)}
                      className="p-3 text-center border border-dashed border-theme-border/60 hover:border-brand-tactical transition-all"
                    >
                      <div className="text-[10px] font-black text-theme-muted uppercase mb-1">✨ OUTROS</div>
                      <div className="text-[11px] font-black text-theme-muted italic">PERSONALIZADO</div>
                    </button>
                  </div>

                  {showCustomForm && (
                    <div className="p-4 bg-brand-tactical/5 border border-brand-tactical/20 space-y-3 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          autoFocus
                          placeholder="NOME DO ITEM"
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value.toUpperCase())}
                          className="bg-theme-bg border border-theme-border p-2 text-[10px] font-black text-theme-text outline-none"
                        />
                        <input 
                          type="number"
                          placeholder="PREÇO (R$)"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Number(e.target.value))}
                          className="bg-theme-bg border border-theme-border p-2 text-[10px] font-black text-brand-tactical outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (!customProductName) return;
                          addToCart(customProductName, customPrice);
                          setCustomProductName("");
                          setShowCustomForm(false);
                        }}
                        className="w-full py-2 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-widest"
                      >
                        ADICIONAR AO CUPOM
                      </button>
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
                            <span className="text-[11px] font-black text-brand-tactical italic">R$ {item.price.toFixed(2)}</span>
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
                      <div className="text-3xl font-heading font-black text-brand-tactical italic leading-none">R$ {form.amount.toFixed(2).replace(".", ",")}</div>
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
        </div>

        {/* Footer Navigation */}
        <div className="p-5 md:p-8 border-t border-theme-border/60 bg-theme-bg-muted/30 relative z-20">
          {step === 1 ? (
            <button
              disabled={!form.customerEmail}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 disabled:opacity-40 shadow-xl shadow-brand-tactical/20 italic"
            >
              CONTINUAR OPERAÇÃO
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                className="flex-1 py-4 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest italic"
              >
                Voltar
              </button>
              <button
                onClick={() => (step === 4 ? handleSubmit() : setStep((step + 1) as 1 | 2 | 3 | 4))}
                disabled={loading}
                className="flex-[2] py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-xl shadow-brand-tactical/20 italic"
              >
                {loading
                  ? "PROCESSANDO..."
                  : step === 4
                  ? form.paymentMethod === "MONEY"
                    ? "FINALIZAR VENDA"
                    : "GERAR COBRANÇA"
                  : "PRÓXIMA FASE"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
