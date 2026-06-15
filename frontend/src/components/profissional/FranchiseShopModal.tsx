import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { 
  X, ShoppingBag, Truck, CreditCard, CheckCircle2, 
  Minus, Plus, MapPin, Wallet, Package, ArrowRight, ArrowLeft 
} from "lucide-react";
import { API } from "../../lib/api";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

const PRODUCTS: Product[] = [
  { id: "credits_100", name: "Recarga 100 Fotos", description: "Créditos para impressão instantânea Phygital", price: 1.00 },
  { id: "paper_roll", name: "Rolo de Papel Premium", description: "Papel fotográfico 10x15 (200 fotos)", price: 1.00 },
  { id: "ribbon_kit", name: "Kit Ribbon Tinta", description: "Cartucho para 200 impressões", price: 1.00 },
];

interface FranchiseShopModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  availableBalance: number;
  userAddress?: string;
}

type Step = "products" | "logistics" | "payment" | "confirm";

export function FranchiseShopModal({ onClose, onSuccess, availableBalance, userAddress }: FranchiseShopModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("products");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryType, setDeliveryType] = useState<"MATRIZ" | "SHIPPING">("SHIPPING");
  const [paymentMethod, setPaymentMethod] = useState<"BALANCE" | "CHECKOUT">("CHECKOUT");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingData, setShippingData] = useState(() => {
    const parts = (userAddress || "||||||").split('|');
    return {
      cep: parts[0] || "",
      street: parts[1] || "",
      number: parts[2] || "",
      neighborhood: parts[3] || "",
      city: parts[4] || "",
      state: parts[5] || "",
      complement: parts[6] || ""
    };
  });

  const handleCepBlur = async () => {
    const cep = shippingData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setShippingData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (err) { console.error("CEP error", err); }
    }
  };

  const total = useMemo(() => {
    return Object.entries(cart).reduce((acc, [id, qty]) => {
      const p = PRODUCTS.find(item => item.id === id);
      return acc + (p?.price || 0) * qty;
    }, 0);
  }, [cart]);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleNext = () => {
    if (step === "products") setStep("logistics");
    else if (step === "logistics") setStep("payment");
    else if (step === "payment") setStep("confirm");
  };

  const handleBack = () => {
    if (step === "logistics") setStep("products");
    else if (step === "payment") setStep("logistics");
    else if (step === "confirm") setStep("payment");
  };

  const handleFinish = async () => {
    setIsProcessing(true);
    const formattedAddress = deliveryType === "SHIPPING" 
      ? `${shippingData.cep}|${shippingData.street}|${shippingData.number}|${shippingData.neighborhood}|${shippingData.city}|${shippingData.state}|${shippingData.complement}`
      : "RETIRADA_MATRIZ";

    try {
      const response = await API.post("/franchise/orders", {
        items: Object.entries(cart).map(([id, qty]) => ({
          id,
          quantity: qty,
          name: PRODUCTS.find(p => p.id === id)?.name,
          price: PRODUCTS.find(p => p.id === id)?.price,
        })),
        total,
        deliveryType,
        paymentMethod,
        address: formattedAddress,
      });

      if (paymentMethod === "CHECKOUT") {
        // Redireciona para o checkout padrão da plataforma (Black/Themed UI)
        navigate(`/checkout/${response.data.order.id}`);
        onClose();
      } else {
        onSuccess(response.data.message || "Pedido realizado com sucesso! Em breve você receberá a confirmação.");
        onClose();
      }
    } catch (error) {
      console.error("Order failed:", error);
      toast.error("Erro ao processar pedido. Tente novamente em alguns instantes.");
    } finally {
      setIsProcessing(false);
    }
  };

  const canPayWithBalance = availableBalance >= total;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[30px] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-tactical/10 border border-brand-tactical/20 flex items-center justify-center text-theme-brand rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-theme-text uppercase leading-none">Loja da Franquia</h2>
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.3em] font-bold mt-1">Abastecimento de Créditos e Insumos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-theme-muted hover:text-theme-text transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-8 py-4 bg-zinc-900/50 flex items-center justify-between border-b border-white/5">
          {[
            { id: "products", label: "PRODUTOS", icon: <Package size={12} /> },
            { id: "logistics", label: "LOGÍSTICA", icon: <Truck size={12} /> },
            { id: "payment", label: "PAGAMENTO", icon: <CreditCard size={12} /> },
            { id: "confirm", label: "CONFIRMAR", icon: <CheckCircle2 size={12} /> },
          ].map((s, idx) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${step === s.id ? 'text-theme-brand' : 'text-theme-muted'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black ${step === s.id ? 'border-brand-tactical bg-brand-tactical/10' : 'border-zinc-800 bg-zinc-800'}`}>
                  {idx + 1}
                </div>
                <span className="text-[9px] font-bold tracking-widest hidden sm:block">{s.label}</span>
              </div>
              {idx < 3 && <div className="w-4 h-px bg-zinc-800 mx-2 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === "products" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                {PRODUCTS.map(p => (
                  <div key={p.id} className="bg-zinc-800/50 border border-white/5 p-5 flex items-center justify-between group hover:border-brand-tactical/30 transition-all rounded-2xl">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-theme-text uppercase">{p.name}</h4>
                      <p className="text-[10px] text-theme-muted uppercase tracking-widest leading-relaxed">{p.description}</p>
                      <p className="text-theme-brand text-xs font-bold mt-2">R$ {p.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 p-1 rounded-xl">
                      <button 
                        onClick={() => updateQty(p.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-theme-muted hover:text-theme-text transition-colors rounded-lg"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-bold text-theme-text w-4 text-center">{cart[p.id] || 0}</span>
                      <button 
                        onClick={() => updateQty(p.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-theme-brand hover:text-theme-text transition-colors rounded-lg"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "logistics" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">Ponto de Recebimento</label>
                <div 
                  onClick={() => setDeliveryType("SHIPPING")}
                  className={`p-6 border transition-all cursor-pointer flex flex-col gap-4 group rounded-2xl ${deliveryType === "SHIPPING" ? 'bg-brand-tactical/5 border-brand-tactical' : 'bg-zinc-800/50 border-white/5 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-5">
                      <div className={`p-3 border rounded-xl ${deliveryType === "SHIPPING" ? 'bg-brand-tactical/10 border-brand-tactical/20 text-theme-brand' : 'bg-zinc-900 border-zinc-800 text-theme-muted'}`}>
                        <MapPin size={20} />
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-bold text-theme-text uppercase">Enviar para Unidade</p>
                        <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">Entrega via Logística Regional</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === "SHIPPING" ? 'border-brand-tactical' : 'border-zinc-800'}`}>
                      {deliveryType === "SHIPPING" && <div className="w-2.5 h-2.5 bg-brand-tactical rounded-full" />}
                    </div>
                  </div>

                  {deliveryType === "SHIPPING" && (
                    <div className="grid grid-cols-6 gap-3 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                      <div className="col-span-2">
                        <input 
                          placeholder="CEP" 
                          value={shippingData.cep}
                          onBlur={handleCepBlur}
                          onChange={e => setShippingData({...shippingData, cep: e.target.value})}
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-zinc-100 rounded-xl"
                        />
                      </div>
                      <div className="col-span-4">
                        <input 
                          placeholder="Logradouro" 
                          value={shippingData.street}
                          onChange={e => setShippingData({...shippingData, street: e.target.value})}
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-zinc-100 rounded-xl"
                        />
                      </div>
                      <div className="col-span-1">
                        <input 
                          placeholder="Nº" 
                          value={shippingData.number}
                          onChange={e => setShippingData({...shippingData, number: e.target.value})}
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-zinc-100 rounded-xl"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          placeholder="Bairro" 
                          value={shippingData.neighborhood}
                          onChange={e => setShippingData({...shippingData, neighborhood: e.target.value})}
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-zinc-100 rounded-xl"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          placeholder="Cidade" 
                          value={shippingData.city}
                          readOnly
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-zinc-100 opacity-50 rounded-xl"
                        />
                      </div>
                      <div className="col-span-1">
                        <input 
                          placeholder="UF" 
                          value={shippingData.state}
                          readOnly
                          className="w-full bg-zinc-900 border border-white/10 p-2 text-[10px] text-zinc-100 opacity-50 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => setDeliveryType("MATRIZ")}
                  className={`p-6 border transition-all cursor-pointer flex items-center justify-between group rounded-2xl ${deliveryType === "MATRIZ" ? 'bg-brand-tactical/5 border-brand-tactical' : 'bg-zinc-800/50 border-white/5 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3 border rounded-xl ${deliveryType === "MATRIZ" ? 'bg-brand-tactical/10 border-brand-tactical/20 text-theme-brand' : 'bg-zinc-900 border-zinc-800 text-theme-muted'}`}>
                      <Package size={20} />
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-theme-text uppercase">Retirada na Matriz</p>
                      <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">Sem custo de frete · Disponível em 24h</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryType === "MATRIZ" ? 'border-brand-tactical' : 'border-zinc-800'}`}>
                    {deliveryType === "MATRIZ" && <div className="w-2.5 h-2.5 bg-brand-tactical rounded-full" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">Método de Liquidação</label>
                
                <div 
                  onClick={() => canPayWithBalance && setPaymentMethod("BALANCE")}
                  className={`p-6 border transition-all flex items-center justify-between group rounded-2xl ${!canPayWithBalance ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'} ${paymentMethod === "BALANCE" ? 'bg-brand-tactical/5 border-brand-tactical' : 'bg-zinc-800/50 border-white/5 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3 border rounded-xl ${paymentMethod === "BALANCE" ? 'bg-brand-tactical/10 border-brand-tactical/20 text-theme-brand' : 'bg-zinc-900 border-zinc-800 text-theme-muted'}`}>
                      <Wallet size={20} />
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-theme-text uppercase">Abatimento no Repasse</p>
                      <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">Saldo Disponível: R$ {availableBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "BALANCE" ? 'border-brand-tactical' : 'border-zinc-800'}`}>
                    {paymentMethod === "BALANCE" && <div className="w-2.5 h-2.5 bg-brand-tactical rounded-full" />}
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod("CHECKOUT")}
                  className={`p-6 border transition-all cursor-pointer flex items-center justify-between group rounded-2xl ${paymentMethod === "CHECKOUT" ? 'bg-brand-tactical/5 border-brand-tactical' : 'bg-zinc-800/50 border-white/5 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3 border rounded-xl ${paymentMethod === "CHECKOUT" ? 'bg-brand-tactical/10 border-brand-tactical/20 text-theme-brand' : 'bg-zinc-900 border-zinc-800 text-theme-muted'}`}>
                      <CreditCard size={20} />
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-xs font-bold text-theme-text uppercase">Cartão ou Pix</p>
                      <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">Pagamento via Checkout Seguro</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "CHECKOUT" ? 'border-brand-tactical' : 'border-zinc-800'}`}>
                    {paymentMethod === "CHECKOUT" && <div className="w-2.5 h-2.5 bg-brand-tactical rounded-full" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-4">
              <div className="w-20 h-20 bg-brand-tactical/10 border border-brand-tactical/20 flex items-center justify-center text-theme-brand mx-auto rounded-full mb-6">
                <ShoppingBag size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-theme-text uppercase">Resumo do Pedido</h3>
                <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold">Confirme as informações antes de finalizar</p>
              </div>

              <div className="bg-zinc-800/30 border border-white/5 p-6 space-y-4 text-left max-w-sm mx-auto rounded-2xl">
                <div className="space-y-2 border-b border-white/5 pb-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = PRODUCTS.find(item => item.id === id);
                    return (
                      <div key={id} className="flex justify-between text-[10px] font-bold uppercase">
                        <span className="text-theme-muted">{qty}x {p?.name}</span>
                        <span className="text-theme-text">R$ {((p?.price || 0) * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-theme-brand">Total do Pedido</span>
                  <span className="text-theme-brand">R$ {total.toFixed(2)}</span>
                </div>
                <div className="pt-4 space-y-2">
                  <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                    Logística: {deliveryType === "SHIPPING" ? "Entrega na Unidade" : "Retirada na Matriz"}
                  </p>
                  <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                    Pagamento: {paymentMethod === "BALANCE" ? "Desconto no Repasse" : "Checkout Digital"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-zinc-900/80 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Valor Total</p>
            <p className="text-xl font-bold text-theme-text">R$ {total.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-4">
            {step !== "products" && (
              <button 
                onClick={handleBack}
                className="px-6 py-4 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 rounded-xl"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            
            {step !== "confirm" ? (
              <button 
                disabled={total === 0}
                onClick={handleNext}
                className="px-10 py-4 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2 rounded-xl"
              >
                Próximo Passo <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                disabled={isProcessing}
                onClick={handleFinish}
                className="px-12 py-4 bg-brand-tactical text-brand-text text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 rounded-xl"
              >
                {isProcessing ? "PROCESSANDO..." : <><CheckCircle2 size={16} /> FINALIZAR PEDIDO</>}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
